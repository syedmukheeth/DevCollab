/**
 * Language detection utility.
 * Detects programming language from file extension, shebang, or content heuristics.
 */

const EXTENSION_MAP = {
  '.py': 'python',
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.go': 'go',
  '.java': 'java',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.c': 'c',
  '.rs': 'rust',
  '.rb': 'ruby',
  '.php': 'php',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.html': 'html',
  '.css': 'css',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.sql': 'sql',
  '.r': 'r',
  '.R': 'r',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.dart': 'dart',
  '.lua': 'lua'
};

const SHEBANG_MAP = {
  'python': 'python',
  'python3': 'python',
  'node': 'javascript',
  'ruby': 'ruby',
  'bash': 'bash',
  'sh': 'bash',
  'perl': 'perl'
};

/**
 * Detect language from filename extension.
 * @param {string} filename
 * @returns {string|null}
 */
const detectFromExtension = (filename) => {
  if (!filename) return null;
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return null;
  const ext = filename.slice(lastDot).toLowerCase();
  return EXTENSION_MAP[ext] || null;
};

/**
 * Detect language from shebang line.
 * @param {string} content
 * @returns {string|null}
 */
const detectFromShebang = (content) => {
  if (!content || !content.startsWith('#!')) return null;
  const firstLine = content.split('\n')[0];
  for (const [key, lang] of Object.entries(SHEBANG_MAP)) {
    if (firstLine.includes(key)) return lang;
  }
  return null;
};

/**
 * Detect language using content-based heuristics.
 * @param {string} content
 * @returns {string|null}
 */
const detectFromContent = (content) => {
  if (!content) return null;
  const trimmed = content.trim();

  // Python patterns
  if (/^(import |from |def |class |print\()/.test(trimmed)) return 'python';
  // JavaScript patterns
  if (/^(const |let |var |function |import |export |console\.)/.test(trimmed)) return 'javascript';
  // Go patterns
  if (/^package\s+\w+/.test(trimmed)) return 'go';
  // Java patterns
  if (/^(public\s+class|import\s+java)/.test(trimmed)) return 'java';
  // Rust patterns
  if (/^(fn\s+main|use\s+std|pub\s+fn)/.test(trimmed)) return 'rust';
  // C/C++ patterns
  if (/^#include\s*[<"]/.test(trimmed)) return 'cpp';

  return null;
};

/**
 * Auto-detect language from filename and/or content.
 * @param {string} [filename]
 * @param {string} [content]
 * @returns {string} Detected language or 'plaintext'
 */
const detectLanguage = (filename, content) => {
  return detectFromExtension(filename)
    || detectFromShebang(content)
    || detectFromContent(content)
    || 'plaintext';
};

module.exports = {
  detectLanguage,
  detectFromExtension,
  detectFromShebang,
  detectFromContent,
  EXTENSION_MAP
};
