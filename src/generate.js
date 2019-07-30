const parse = require('csv-parse/lib/sync');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const qs = require('qs');

const CSV_FILE = 'ข้อมูลรันบัตรทั้งหมด-round2.csv';
const OUTPUT_DIR = 'output2/';
const SERVER_PORT = 9000;

const storage = p => path.resolve(__dirname, `./storages/${p}`);
(async function() {
  const data = parse(fs.readFileSync(storage(CSV_FILE)).toString(), {
    columns: true,
    comment: '#'
  });
  for (const obj of data) {
    const file = storage(`${OUTPUT_DIR}${obj.ref}.png`);
    if (fs.existsSync(file)) {
      console.log('[SKIP]', obj.ref);
    } else {
      await axios
        .get(`http://0.0.0.0:${SERVER_PORT}/image`, {
          params: obj,
          responseType: 'arraybuffer'
        })
        .then(res => {
          const destination = fs.createWriteStream(file);
          destination.write(res.data);
          console.log('[OK]', obj.ref);
          // Buffer.from(res.data, 'base64')
        })
        .catch(err => {
          console.log('[ERR]', obj.ref, err.message);
          // process.exit(0);
        });
    }
  }
})();
