const { RUNTIMES } = require('../../src/services/executionService');

describe('executionService', () => {
  describe('RUNTIMES', () => {
    it('should support python', () => {
      expect(RUNTIMES.python).toBeDefined();
      expect(RUNTIMES.python.image).toContain('python');
      expect(RUNTIMES.python.ext).toBe('.py');
      expect(RUNTIMES.python.cmd('main.py')).toEqual(['python', 'main.py']);
    });

    it('should support javascript', () => {
      expect(RUNTIMES.javascript).toBeDefined();
      expect(RUNTIMES.javascript.image).toContain('node');
      expect(RUNTIMES.javascript.ext).toBe('.js');
      expect(RUNTIMES.javascript.cmd('main.js')).toEqual(['node', 'main.js']);
    });

    it('should support typescript', () => {
      expect(RUNTIMES.typescript).toBeDefined();
      expect(RUNTIMES.typescript.ext).toBe('.ts');
    });

    it('should support go', () => {
      expect(RUNTIMES.go).toBeDefined();
      expect(RUNTIMES.go.image).toContain('golang');
      expect(RUNTIMES.go.ext).toBe('.go');
      expect(RUNTIMES.go.cmd('main.go')).toEqual(['go', 'run', 'main.go']);
    });

    it('should support java', () => {
      expect(RUNTIMES.java).toBeDefined();
      expect(RUNTIMES.java.image).toContain('openjdk');
      expect(RUNTIMES.java.ext).toBe('.java');
    });

    it('should have exactly 8 supported runtimes', () => {
      expect(Object.keys(RUNTIMES)).toHaveLength(8);
    });

    it('all runtimes should have image, ext, and cmd', () => {
      for (const [name, runtime] of Object.entries(RUNTIMES)) {
        expect(runtime.image).toBeTruthy();
        expect(runtime.ext).toMatch(/^\.\w+$/);
        expect(typeof runtime.cmd).toBe('function');
      }
    });
  });

  describe('runCode', () => {
    // Note: runCode requires Docker. These tests validate the function exists
    // and returns proper errors for invalid input without needing Docker.
    const { runCode } = require('../../src/services/executionService');

    it('should call onDone with an error for unsupported languages', (done) => {
      runCode({
        code: 'print("hello")',
        language: 'brainfuck',
        onData: () => {},
        onDone: (exitCode, err) => {
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(400);
          expect(err.message).toContain('Unsupported language');
          done();
        }
      });
    });
  });
});
