/**
 * Keyboard shortcuts system for SyncMesh.
 * Registers global shortcuts and provides a help overlay.
 */

const SHORTCUTS = [
  { keys: 'Ctrl+Enter', action: 'run-code', label: 'Run Code' },
  { keys: 'Ctrl+S', action: 'save', label: 'Save File' },
  { keys: 'Ctrl+B', action: 'toggle-sidebar', label: 'Toggle Sidebar' },
  { keys: 'Ctrl+J', action: 'toggle-terminal', label: 'Toggle Terminal' },
  { keys: 'Ctrl+Shift+T', action: 'toggle-theme', label: 'Toggle Theme' },
  { keys: 'Ctrl+N', action: 'new-file', label: 'New File' },
  { keys: 'Ctrl+Shift+?', action: 'show-shortcuts', label: 'Show Shortcuts' },
  { keys: 'Ctrl+Shift+P', action: 'command-palette', label: 'Command Palette' },
];

/**
 * Parse a shortcut key string into modifier+key parts.
 */
const parseKeys = (keyStr) => {
  const parts = keyStr.split('+');
  return {
    ctrl: parts.includes('Ctrl'),
    shift: parts.includes('Shift'),
    alt: parts.includes('Alt'),
    key: parts[parts.length - 1].toLowerCase()
  };
};

/**
 * Check if a keyboard event matches a shortcut.
 */
const matchesShortcut = (event, shortcut) => {
  const parsed = parseKeys(shortcut.keys);
  return (
    event.ctrlKey === parsed.ctrl &&
    event.shiftKey === parsed.shift &&
    event.altKey === parsed.alt &&
    event.key.toLowerCase() === parsed.key
  );
};

/**
 * Register keyboard shortcut handler.
 * @param {Object<string, Function>} handlers - Map of action names to handler functions
 * @returns {Function} Cleanup function to remove the event listener
 */
const registerShortcuts = (handlers) => {
  const listener = (event) => {
    for (const shortcut of SHORTCUTS) {
      if (matchesShortcut(event, shortcut) && handlers[shortcut.action]) {
        event.preventDefault();
        event.stopPropagation();
        handlers[shortcut.action]();
        break;
      }
    }
  };

  window.addEventListener('keydown', listener);
  return () => window.removeEventListener('keydown', listener);
};

export { SHORTCUTS, registerShortcuts };
