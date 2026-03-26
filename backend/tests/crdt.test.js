const Y = require('yjs');

describe('CRDT Merge Correctness', () => {
  test('Two clients can merge text concurrently without conflicts', () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const text1 = doc1.getText('monaco');
    const text2 = doc2.getText('monaco');

    // Simulate Client 1 typing "Hello"
    text1.insert(0, 'Hello');
    
    // Sync doc1 to doc2
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    expect(text2.toString()).toBe('Hello');

    // Concurrent edits at the same position (index 5)
    text1.insert(5, ' World');
    text2.insert(5, ' Beautiful');

    // Sync both ways
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    // Both should arrive at the SAME state
    const result1 = text1.toString();
    const result2 = text2.toString();

    expect(result1).toBe(result2);
    // Either "Hello Beautiful World" or "Hello World Beautiful" is valid depending on client ID
    expect(['Hello Beautiful World', 'Hello World Beautiful']).toContain(result1);
  });

  test('Deletions are handled correctly', () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();
    const text1 = doc1.getText('monaco');
    const text2 = doc2.getText('monaco');

    text1.insert(0, 'The quick brown fox');
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    // Client 1 deletes "quick " (indices 4 to 10)
    text1.delete(4, 6);

    // Client 2 changes "fox" to "cat"
    // "The quick brown fox" -> "fox" starts at index 16
    text2.delete(16, 3);
    text2.insert(16, 'cat');

    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    expect(text1.toString()).toBe(text2.toString());
    expect(text1.toString()).toBe('The brown cat');
  });
});
