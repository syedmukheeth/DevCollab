const { runCode } = require('../src/services/executionService');

describe('Execution Sandbox Isolation', () => {
  test('Python should not be able to access env variables or restricted files', async () => {
    let output = '';
    await runCode({
      code: 'import os; print(os.environ.get("SESSION_SECRET", "NOT_FOUND"))',
      language: 'python',
      onData: ({ payload }) => { output += payload; },
      onDone: (code) => {
        // In local Docker it might still see them if passed, 
        // but in gVisor it should be isolated.
        // For this test we assume SESSION_SECRET is not passed to runner.
        expect(output.trim()).toBe('NOT_FOUND');
      }
    });
  });

  test('JS should have no network access', async () => {
    let output = '';
    await runCode({
      code: 'require("http").get("http://google.com", (res) => { console.log("OK"); }).on("error", (e) => { console.log("ERROR"); });',
      language: 'javascript',
      onData: ({ payload }) => { output += payload; },
      onDone: (code) => {
        // Network: 'none' should cause failure
        expect(output).toContain('ERROR');
      }
    });
  });
});
