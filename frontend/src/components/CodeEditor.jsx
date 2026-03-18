import React, { useEffect, useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';

export function CodeEditor({
  file,
  socket,
  rev,
  onRemoteSnapshot,
  onRemoteChange,
  onChangeContent,
  readOnly
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef({});

  const remoteCursorDecoration = useMemo(
    () => ({
      cursor: { inlineClassName: 'remote-cursor' },
      selection: { inlineClassName: 'remote-selection' }
    }),
    []
  );

  useEffect(() => {
    if (!socket) return;

    const onSnapshot = (payload) => {
      if (!payload || payload.fileId !== file._id) return;
      onRemoteSnapshot?.(payload.content ?? '', payload.rev ?? 0);
    };
    const onChanged = (payload) => {
      if (!payload || payload.fileId !== file._id) return;
      onRemoteChange?.(payload.content ?? '', payload.rev ?? 0);
    };
    const onOutOfDate = (payload) => {
      if (!payload || payload.fileId !== file._id) return;
      onRemoteSnapshot?.(payload.content ?? '', payload.rev ?? 0);
    };

    socket.on('file:snapshot', onSnapshot);
    socket.on('file:changed', onChanged);
    socket.on('file:outOfDate', onOutOfDate);

    return () => {
      socket.off('file:snapshot', onSnapshot);
      socket.off('file:changed', onChanged);
      socket.off('file:outOfDate', onOutOfDate);
    };
  }, [socket, file._id, onRemoteSnapshot, onRemoteChange]);

  useEffect(() => {
    if (!socket) return;

    const onCursorUpdated = (payload) => {
      if (!payload || payload.fileId !== file._id) return;
      if (!editorRef.current || !monacoRef.current) return;

      const editor = editorRef.current;
      const monaco = monacoRef.current;
      const { socketId, cursor, selection } = payload;
      if (!socketId) return;

      const next = [];
      if (cursor?.lineNumber && cursor?.column) {
        next.push({
          range: new monaco.Range(
            cursor.lineNumber,
            cursor.column,
            cursor.lineNumber,
            cursor.column
          ),
          options: remoteCursorDecoration.cursor
        });
      }
      if (
        selection?.startLineNumber &&
        selection?.startColumn &&
        selection?.endLineNumber &&
        selection?.endColumn
      ) {
        next.push({
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          options: remoteCursorDecoration.selection
        });
      }

      const prevIds = decorationsRef.current[socketId] || [];
      const newIds = editor.deltaDecorations(prevIds, next);
      decorationsRef.current[socketId] = newIds;
    };

    socket.on('cursor:updated', onCursorUpdated);
    return () => socket.off('cursor:updated', onCursorUpdated);
  }, [socket, file._id, remoteCursorDecoration]);

  return (
    <div className="code-editor-root">
      <div className="editor-header">
        <span className="editor-filename">{file.name}</span>
        <span className="editor-meta">rev {rev}</span>
      </div>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        value={file.content || ''}
        onChange={(value) => onChangeContent(value ?? '')}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          monacoRef.current = monaco;

          const emitCursor = () => {
            const position = editor.getPosition();
            const selection = editor.getSelection();
            if (!position) return;
            socket?.emit('cursor:update', {
              fileId: file._id,
              cursor: { lineNumber: position.lineNumber, column: position.column },
              selection: selection
                ? {
                    startLineNumber: selection.startLineNumber,
                    startColumn: selection.startColumn,
                    endLineNumber: selection.endLineNumber,
                    endColumn: selection.endColumn
                  }
                : null
            });
          };

          const d1 = editor.onDidChangeCursorPosition(emitCursor);
          const d2 = editor.onDidChangeCursorSelection(emitCursor);

          emitCursor();

          editor.onDidDispose(() => {
            d1.dispose();
            d2.dispose();
          });
        }}
        options={{
          readOnly,
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false
        }}
      />
    </div>
  );
}

