const Koa = require('koa');
const Router = require('koa-router');
const path = require('path');

const app = new Koa();
const router = new Router();

const jimp = require('jimp');
const jimpTTF = require('./jimpTTF');

const fs = require('fs');
const axios = require('axios');

router
  .all('/', ctx => {
    ctx.type = 'html';
    ctx.body = fs.createReadStream(path.resolve(__dirname, './index.html'), { encoding: 'utf8' });
  })
  .get(['/image', '/image/:id'], async ctx => {
    console.log(ctx.query);
    let {
      image = path.resolve(__dirname, './assets/users/6031301721.jpg'),
      mode = 'STAFF',
      role = '[role]',
      name = '[name]',
      faculty = '[faculty]',
      filename = new Date().getTime().toString()
    } = ctx.query;

    // if (faculty in FACULTY) {
    //   faculty = FACULTY[faculty].facultyABBR;
    // }
    if (!image.includes('http')) {
      image = path.resolve(__dirname, `./storages/profile/${image}`);
    }

    const cardPath = path.resolve(__dirname, `./assets/cards/${mode.toUpperCase()}.png`);
    const img = await jimp.read(cardPath);
    // const buffer = await axios.get(image).then(res => {
    //   console.log(res.headers);
    //   return Buffer.from(res.data).toString('base64');
    // });
    // console.log('OK', buffer.slice(0, 6));
    // console.log('image', image);
    const usr = await jimp.read(image);

    const config =
      img.getWidth() > img.getHeight()
        ? {
            // landscape , freshy
            background: [1600, 1200],
            profile: [75, 420],
            profileBox: [475, 670],
            texts: [[593 + 25, 412], [593 + 25, 588], [593 + 25, 767]],
            textBox: [600, 120]
          }
        : {
            // potrait , staff
            background: [1200, 1600],
            profile: [85, 359],
            profileBox: [505, 640],
            texts: [[75 + 35, 1039], [75 + 35, 1180], [75 + 35, 1315]],
            textBox: [600, 120]
          };

    img.resize(...config.background);
    img.composite(usr.contain(...config.profileBox), ...config.profile);

    const texts = [name, faculty, role];
    for (const i in texts) {
      let text = await jimpTTF(
        texts[i].trim(),
        ...config.textBox,
        path.resolve(__dirname, './assets/fonts/CHULALONGKORN-Bold.ttf'),
        70,
        '#000'
      ); //Text, width, height, path, size, HexaColor
      // text.write(path.resolve(__dirname, `./text-${i}.png`));
      img.composite(text, config.texts[i][0], config.texts[i][1]);
    }

    ctx.set('Content-type', 'image/png');
    ctx.set('Content-Disposition', `inline; filename="${filename}.png"`);
    ctx.body = await img.getBufferAsync(jimp.MIME_PNG);
  });

const port = process.env.PORT;
if (!port) {
  console.error('no PORT env');
  process.exit();
} else {
  const server = app
    .use(router.routes())
    .use(router.allowedMethods())
    // .callback()
    .listen(+port, () => {
      console.log(`listento http://0.0.0.0:${port}`);
    });
}
