import React, { useEffect, useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';
import { MonacoBinding } from 'y-monaco';

const LANGUAGE_BY_EXTENSION = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  json: 'json',
  md: 'markdown',
  css: 'css',
  html: 'html',
  go: 'go',
  java: 'java'
};

const getLanguageFromFileName = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  return LANGUAGE_BY_EXTENSION[ext] || 'plaintext';
};

export function CodeEditor({
  file,
  readOnly,
  collaborationEnabled,
  onChange,
  editorSettings = {}
}) {
  const editorRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);

  const language = useMemo(() => getLanguageFromFileName(file.name), [file.name]);

  useEffect(() => {
    return () => {
      bindingRef.current?.destroy?.();
      providerRef.current?.destroy?.();
      ydocRef.current?.destroy?.();
      bindingRef.current = null;
      providerRef.current = null;
      ydocRef.current = null;
    };
  }, []);

  const resetCollaboration = () => {
    bindingRef.current?.destroy?.();
    providerRef.current?.destroy?.();
    ydocRef.current?.destroy?.();
    bindingRef.current = null;
    providerRef.current = null;
    ydocRef.current = null;
  };

  const getOrCreateLocalUser = () => {
    try {
      const existing = window.localStorage.getItem('devcollab-user');
      if (existing) return JSON.parse(existing);
    } catch (e) {
      // ignore
    }
    const id = Math.random().toString(16).slice(2);
    const name = `User-${id.slice(0, 6)}`;
    const color = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')}`;
    const next = { name, color };
    try {
      window.localStorage.setItem('devcollab-user', JSON.stringify(next));
    } catch (e) {
      // ignore
    }
    return next;
  };

  return (
    <div className="code-editor-root">
      <div className="editor-header">
        <span className="editor-filename">{file.name}</span>
        <span className="editor-meta">{collaborationEnabled ? 'CRDT' : 'LOCAL'}</span>
      </div>
      <Editor
        key={`${file.id}-${collaborationEnabled ? 'collab' : 'local'}`}
        height="100%"
        defaultLanguage={language}
        language={language}
        theme="vs-dark"
        value={file.content || ''}
        onChange={(value) => {
          const nextValue = value ?? '';
          window.getEditorCode = () => nextValue;
          if (!collaborationEnabled) {
            onChange?.(nextValue);
          }
        }}
        onMount={(editor) => {
          editorRef.current = editor;
          window.getEditorCode = () => editor.getValue();

          if (!collaborationEnabled) {
            resetCollaboration();
            return;
          }

          const ydoc = new Y.Doc();
          ydocRef.current = ydoc;

          const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
          const room = `file:${file.id}`;
          const token = window.localStorage.getItem('devcollab-token');
          const provider = new SocketIOProvider(socketUrl, room, ydoc, {
            auth: token ? { token } : {}
          });
          providerRef.current = provider;

          const localUser = getOrCreateLocalUser();
          provider.awareness.setLocalStateField('user', localUser);

          const ytext = ydoc.getText('monaco');
          if (ytext.length === 0 && (file.content || '').length > 0) {
            ytext.insert(0, file.content || '');
          }

          const model = editor.getModel();
          if (!model) return;

          const binding = new MonacoBinding(
            ytext,
            model,
            new Set([editor]),
            provider.awareness
          );
          bindingRef.current = binding;

          editor.onDidScrollChange((e) => {
            provider.awareness.setLocalStateField('scroll', e.scrollTop);
          });

          // Broadcast cursor position for remote presence
          editor.onDidChangeCursorPosition((e) => {
            provider.awareness.setLocalStateField('cursor', {
              lineNumber: e.position.lineNumber,
              column: e.position.column
            });
          });

          editor.onDidChangeCursorSelection((e) => {
            provider.awareness.setLocalStateField('selection', {
              startLineNumber: e.selection.startLineNumber,
              startColumn: e.selection.startColumn,
              endLineNumber: e.selection.endLineNumber,
              endColumn: e.selection.endColumn
            });
          });
        }}
        options={{
          readOnly,
          fontSize: editorSettings.fontSize || 14,
          fontFamily: editorSettings.fontFamily || 'JetBrains Mono, monospace',
          tabSize: editorSettings.tabSize || 2,
          wordWrap: editorSettings.wordWrap || 'on',
          minimap: { enabled: editorSettings.minimap || false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true }
        }}
      />
    </div>
  );
}
