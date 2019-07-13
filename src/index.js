const Koa = require('koa');
const Router = require('koa-router');
const path = require('path');

const app = new Koa();
const router = new Router();

const jimp = require('jimp');
const jimpTTF = require('./jimpTTF');

const fs = require('fs');

router
  .all('/', ctx => {
    ctx.type = 'html';
    ctx.body = fs.createReadStream(path.resolve(__dirname, './index.html'), { encoding: 'utf8' });
  })
  .get('/image', async ctx => {
    const {
      image = path.resolve(__dirname, './assets/users/6031301721.jpg'),
      mode = 'staff',
      role = '[role]',
      name = '[name]',
      faculty = '[faculty]'
    } = ctx.query || {};

    const cardPath = path.resolve(__dirname, `./assets/cards/${mode}.png`);
    const img = await jimp.read(cardPath);
    const usr = await jimp.read(image);

    const config =
      img.getWidth() > img.getHeight()
        ? {
            // landscape
            background: [1600, 1200],
            profile: [75, 420],
            profileBox: [477, 675],
            texts: [[593, 412], [593, 585], [593, 759]],
            textBox: [560, 126]
          }
        : {
            // potrait
            background: [1200, 1600],
            profile: [85, 359],
            profileBox: [505, 640],
            texts: [[75, 1039], [75, 1173], [75, 1310]],
            textBox: [600, 100]
          };

    img.resize(...config.background);
    img.composite(usr.contain(...config.profileBox), ...config.profile);

    const texts = [role, name, faculty];
    for (const i in texts) {
      let text = await jimpTTF(
        texts[i].trim(),
        ...config.textBox,
        path.resolve(__dirname, './assets/fonts/Cloud-Bold.otf'),
        90,
        '#000'
      ); //Text, width, height, path, size, HexaColor
      text.write(path.resolve(__dirname, `./text-${i}.png`));
      img.composite(text, config.texts[i][0] + 35, config.texts[i][1] + 6);
      // img.print(
      //   font,
      //   config.texts[i][0] + 25,
      //   config.texts[i][1],
      //   {
      //     text: texts[i],
      //     alignmentX: jimp.HORIZONTAL_ALIGN_LEFT,
      //     alignmentY: jimp.VERTICAL_ALIGN_MIDDLE
      //   },
      //   ...config.textBox
      // );
    }

    ctx.set('Content-type', 'image/png');
    ctx.set('Content-Disposition', 'inline; filename="example.png');

    ctx.body = await img.getBufferAsync(jimp.MIME_PNG);
  });

const port = process.env.PORT;
if (!port) {
  console.error('no PORT env');
  process.exit();
} else {
  app
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(+port, () => {
      console.log(`listento http://0.0.0.0:${port}`);
    });
}
