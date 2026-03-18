import React from 'react';
import Editor from '@monaco-editor/react';

export function CodeEditor({ file, onChangeContent, readOnly }) {
  return (
    <div className="code-editor-root">
      <div className="editor-header">
        <span className="editor-filename">{file.name}</span>
      </div>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        value={file.content || ''}
        onChange={(value) => onChangeContent(value ?? '')}
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

