async function run() {
  const { generateKeyPair, exportPKCS8, exportSPKI } = await import('jose');
  // 512 bit for tests is fast and small enough to not truncate easily
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true, modulusLength: 2048 });
  
  const priv = await exportPKCS8(privateKey);
  const pub = await exportSPKI(publicKey);
  
  const fs = require('fs');
  fs.writeFileSync('tests/test_keys.json', JSON.stringify({
    priv: Buffer.from(priv).toString('base64'),
    pub: Buffer.from(pub).toString('base64')
  }));
}

run().catch(console.error);
