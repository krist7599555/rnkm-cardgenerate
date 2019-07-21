const parse = require('csv-parse/lib/sync');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const qs = require('qs');

const storage = p => path.resolve(__dirname, `./storages/${p}`);

(async function() {
  const data = parse(fs.readFileSync(storage('ข้อมูลรันบัตรทั้งหมด.csv')).toString(), {
    columns: true,
    comment: '#'
  });
  for (const obj of data) {
    const file = storage(`output/${obj.ref}.png`);
    if (fs.existsSync(file)) {
      console.log('[SKIP]', obj.ref);
    } else {
      await axios
        .get('http://0.0.0.0:9000/image', {
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
