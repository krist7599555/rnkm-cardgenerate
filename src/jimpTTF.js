const im = require('gm').subClass({ imageMagick: true });
const jimp = require('jimp');

module.exports = function(msg, x, y, path, size, HexColor) {
  if (!x || !y) throw new Error('[JimpFONT] Error: X or Z is not specified !');
  if (!path || path === undefined)
    throw new Error('[JimpFONT] Error: Path is not specified or is undefined !');
  if (!size || size === undefined)
    throw new Error('[JimpFONT] Error: Size is not specified or is undefined !');
  if (!HexColor || HexColor === undefined)
    throw new Error('[JimpFONT] Error: HexColor is not specified or is undefined !');

  return new Promise(async (resolve, reject) => {
    let img = im(x, y).command('convert'); //width, height
    img.font(path, size); //path, Font size
    img.out('-fill').out(HexColor); //HexaColor important!
    img.out('-background').out('transparent');
    img.out('-gravity').out('west');
    img.out(`caption:${msg}\r-`); //Text //* \r.+ is magic ?? by krist7599555

    img.setFormat('png').toBuffer(async function(err, buffer) {
      if (err) throw reject(`[JimpFONT] Error: ${err} !`);
      await resolve(buffer);
    });
  }).then(async buffer => {
    return await jimp.read(buffer);
  });
};
