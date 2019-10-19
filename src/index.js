const Koa = require('koa');
const Router = require('koa-router');
const path = require('path');
const jimp = require('jimp');
const fs = require('fs');
const axios = require('axios');
const jimpTTF = require('./jimpTTF');

const app = new Koa();
const router = new Router();

router
  .all('/', ctx => {
    ctx.type = 'html';
    ctx.body = fs.createReadStream(path.resolve(__dirname, './index.html'), { encoding: 'utf8' });
  })
  .get('/image', async ctx => {
    console.log(ctx.query);

    //* SET DEFAULT PARAMETER
    let {
      image = path.resolve(__dirname, './assets/users/6031301721.jpg'),
      mode = 'STAFF',
      role = '[role]',
      name = '[name]',
      faculty = '[faculty]'
    } = ctx.query;
    const filename = new Date().getTime().toString();

    //* DOWNLOAD IMAGE
    if (!image.includes('http')) {
      //* FROM LOCAL DISK
      image = path.resolve(__dirname, `./storages/input/${image}`);
    } else if (image.includes('drive.google.com')) {
      console.log('GGD');
      //* FROM GOOGLE DRIVE
      const URL1 = 'https://drive.google.com/file/d/';
      if (image.includes(URL1)) {
        const code = image.replace(URL1, '').split('/')[0];
        image = 'https://drive.google.com/uc?export=download&id=' + code;
      }
      const URL2 = 'https://drive.google.com/open?id=';
      if (image.includes(URL2)) {
        const code = image.split('?id=')[1];
        image = 'https://drive.google.com/uc?export=download&id=' + code;
      }
      ctx.assert(
        image.includes('https://drive.google.com/uc') &&
          image.includes('export=download') &&
          image.includes('id='),
        400,
        'wrong google drive link format'
      );
      console.log('[LOAD]', image);
      image = await axios.get(image, { responseType: 'stream' }).then(response => {
        //* WRITE TO LOCALDISK AND SEND PATH
        const imagePath = path.resolve(__dirname, `./storages/tmp/${filename}.png`);
        const writer = fs.createWriteStream(imagePath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
          writer.on('finish', () => resolve(imagePath));
          writer.on('error', reject);
        });
      });
    }
    //https://drive.google.com/uc?export=download&id=1biHyCPcYhfiYGgYZucAsJgQtXtZWcUtY

    //* READ IMAGE CARDTEMPLATE & PROFILE
    const cardPath = path.resolve(__dirname, `./assets/cards/${mode.toUpperCase()}.png`);
    const img = await jimp.read(cardPath);
    const usr = await jimp.read(image);

    //* SETTING ELEMENT POSITION
    const config =
      img.getWidth() > img.getHeight()
        ? {
            //* LANDSCAPE for freshy
            background: [1600, 1200],
            profile: [75, 420],
            profileBox: [475, 670],
            texts: [[618, 412], [618, 588], [618, 767]],
            textBox: [600, 120]
          }
        : {
            //* POTRAIT for staff
            background: [1200, 1600],
            profile: [85, 359],
            profileBox: [505, 640],
            texts: [[110, 1039], [110, 1180], [110, 1315]],
            textBox: [600, 120]
          };

    //* PLACE IMAGE ON CARD TEMPLATE
    img.resize(...config.background);
    img.composite(usr.contain(...config.profileBox), ...config.profile);

    //* PLACE TEXT ON CARD TEMPLATE
    const texts = [name, faculty, role];
    for (const i in texts) {
      let text = await jimpTTF(
        texts[i].trim(),
        ...config.textBox,
        path.resolve(__dirname, './assets/fonts/CHULALONGKORN-Bold.ttf'),
        70,
        '#000'
      );
      // text.write(path.resolve(__dirname, `./text-${i}.png`));
      img.composite(text, config.texts[i][0], config.texts[i][1]);
    }

    //* RETURN IMAGE BUFFER
    ctx.set('Content-type', 'image/png');
    ctx.set('Content-Disposition', `inline; filename="${filename}.png"`);
    ctx.body = await img.getBufferAsync(jimp.MIME_PNG);
  });

//* START SERVER
const port = process.env.PORT;
if (!port) {
  console.error('no PORT env');
  process.exit();
} else {
  const server = app
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(+port, () => {
      console.log(`listento http://0.0.0.0:${port}`);
    });
}
