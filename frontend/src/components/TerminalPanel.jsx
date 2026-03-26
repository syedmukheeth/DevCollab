import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export function TerminalPanel({ socket, sessionId }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);

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
      scrollback: 1000
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = term;

    const handleResize = () => {
      fitAddon.fit();
      if (socket?.connected) {
        socket.emit('pty-resize', { cols: term.cols, rows: term.rows, sessionId });
      }
    };
    
    // Resize Observer for the container size changes
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(terminalRef.current);
    
    window.addEventListener('resize', handleResize);

    term.onData((data) => {
      if (socket?.connected) {
        socket.emit('pty-input', data);
      }
    });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [socket, sessionId]);

  useEffect(() => {
    if (!socket || !xtermRef.current) return;

    const onPtyOutput = (data) => {
      xtermRef.current.write(data);
    };

    socket.on('pty-output', onPtyOutput);

    // Initial connection hookup
    socket.emit('pty-start', { sessionId });
    
    // Initial resize sync
    setTimeout(() => {
      if (xtermRef.current) {
        socket.emit('pty-resize', { cols: xtermRef.current.cols, rows: xtermRef.current.rows, sessionId });
      }
    }, 100);

    return () => {
      socket.off('pty-output', onPtyOutput);
    };
  }, [socket, sessionId]);

  return (
    <div 
      ref={terminalRef} 
      style={{ width: '100%', height: '100%', overflow: 'hidden', padding: '8px' }} 
    />
  );
}
