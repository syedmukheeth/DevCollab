import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';
import { MonacoBinding } from 'y-monaco';

export function CodeEditor({
  file,
  readOnly
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);

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
        <span className="editor-meta">CRDT</span>
      </div>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          monacoRef.current = monaco;

          const ydoc = new Y.Doc();
          ydocRef.current = ydoc;

          const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
          const room = `file:${file._id}`;
          const provider = new SocketIOProvider(socketUrl, room, ydoc);
          providerRef.current = provider;

          // Presence: MonacoBinding uses Yjs Awareness metadata.
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

