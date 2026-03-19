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
    let update = Y.encodeStateAsUpdate(doc1);
    Y.applyUpdate(doc2, update);

    expect(text2.toString()).toBe('Hello');

    // Concurrent edits
    // Client 1 inserts " World" at end
    text1.insert(5, ' World');
    
    // Client 2 inserts "Beautiful " before "World" (index 5)
    text2.insert(5, ' Beautiful');

    // Sync both ways
    const update1 = Y.encodeStateAsUpdate(doc1);
    const update2 = Y.encodeStateAsUpdate(doc2);

    Y.applyUpdate(doc1, update2);
    Y.applyUpdate(doc2, update1);

    // Both should arrive at the same state
    expect(text1.toString()).toBe(text2.toString());
    expect(text1.toString()).toBe('Hello Beautiful World');
  });

  test('Deletions are handled correctly', () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();
    const text1 = doc1.getText('monaco');
    const text2 = doc2.getText('monaco');

    text1.insert(0, 'The quick brown fox');
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    // Client 1 deletes "quick "
    text1.delete(4, 6);

    // Client 2 changes "fox" to "cat"
    text2.delete(16, 3);
    text2.insert(16, 'cat');

    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    expect(text1.toString()).toBe(text2.toString());
    expect(text1.toString()).toBe('The brown cat');
  });
});
