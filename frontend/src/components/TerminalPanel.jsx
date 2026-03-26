import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export function TerminalPanel({ lines = [] }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#1e1e1e', // match vscode dark panel
        foreground: '#cccccc',
        cursor: '#aaaaaa',
      },
      fontFamily: 'JetBrains Mono, Fira Code, monospace',
      fontSize: 13,
      cursorBlink: true,
      scrollback: 1000,
      disableStdin: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (xtermRef.current && lines.length > 0) {
      // Clear before rewriting because our global state simply replaces 'lines' array each run
      xtermRef.current.clear();
      
      lines.forEach(line => {
        const text = String(line.payload).replace(/\n/g, '\r\n');
        if (line.type === 'error' || line.type === 'stderr') {
          xtermRef.current.writeln(`\x1b[31m${text}\x1b[0m`);
        } else if (line.type === 'system') {
          xtermRef.current.writeln(`\x1b[34m${text}\x1b[0m`);
        } else {
          xtermRef.current.writeln(text);
        }
      });
      fitAddonRef.current?.fit();
    }
  }, [lines]);

  return (
    <div 
      ref={terminalRef} 
      style={{ width: '100%', height: '100%', overflow: 'hidden', padding: '8px' }} 
    />
  );
}
