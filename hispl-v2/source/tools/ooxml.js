/* Minimal OOXML reader — pure Node, no dependencies.
   .xlsx and .docx are both ZIP archives of XML parts. Node's zlib can
   inflate the raw deflate streams, so the only thing missing is a ZIP
   central-directory walker. That is about 50 lines. */
const fs = require('fs');
const zlib = require('zlib');

function unzip(file) {
  const buf = fs.readFileSync(file);

  /* End of Central Directory: scan backwards for signature 0x06054b50 */
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip: ' + file);

  let n   = buf.readUInt16LE(eocd + 10);   /* entries on this disk */
  let off = buf.readUInt32LE(eocd + 16);   /* central dir offset    */

  /* ZIP64 fallback for the 0xFFFF/0xFFFFFFFF sentinels */
  if (n === 0xffff || off === 0xffffffff) {
    for (let i = eocd - 20; i >= 0; i--) {
      if (buf.readUInt32LE(i) === 0x07064b50) {
        const z64 = Number(buf.readBigUInt64LE(i + 8));
        n   = Number(buf.readBigUInt64LE(z64 + 32));
        off = Number(buf.readBigUInt64LE(z64 + 48));
        break;
      }
    }
  }

  const out = {};
  let p = off;
  for (let i = 0; i < n; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method  = buf.readUInt16LE(p + 10);
    const csize   = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extLen  = buf.readUInt16LE(p + 30);
    const cmtLen  = buf.readUInt16LE(p + 32);
    const lho     = buf.readUInt32LE(p + 42);
    const name    = buf.toString('utf8', p + 46, p + 46 + nameLen);

    /* Local header tells us where the data actually starts */
    const lNameLen = buf.readUInt16LE(lho + 26);
    const lExtLen  = buf.readUInt16LE(lho + 28);
    const dataAt   = lho + 30 + lNameLen + lExtLen;
    const raw      = buf.subarray(dataAt, dataAt + csize);

    try {
      out[name] = method === 0 ? raw : zlib.inflateRawSync(raw);
    } catch (e) {
      out[name] = Buffer.alloc(0);
    }
    p += 46 + nameLen + extLen + cmtLen;
  }
  return out;
}

module.exports = { unzip };

if (require.main === module) {
  const f = process.argv[2];
  const parts = unzip(f);
  const names = Object.keys(parts);
  console.log(f.split(/[\\/]/).pop() + '  —  ' + names.length + ' parts');
  names.forEach(function (k) {
    console.log('   ' + String(parts[k].length).padStart(9) + '  ' + k);
  });
}
