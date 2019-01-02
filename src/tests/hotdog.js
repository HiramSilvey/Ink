Ink = require('../ink.js');

Ink.setUniverse(`
room {
  *default: 'a normal room';
};
room > hotdog {
  *full: 'a normal hotdog' [eat: 'hotdog was eaten' -> halfeaten [hotdog fill $subject]];
  halfeaten: 'a halfeaten hotdog';
};
room > player {
  *hungry: 'a hungry hungry hippo' [go: 'got it' [player > $subject], _fill: 'mmm, delicious!' -> full];
  full: 'a full belly';
};
`);

Ink.exec("player","take","hotdog");
Ink.exec("player","eat","hotdog");
// hotdog = model.subItems["hotdog"][0];
// //console.log(hotdog);

// console.log("BEFORE");
// console.log(model.toString());
// applyAction("eat",hotdog);
// console.log("AFTER");
// console.log(model.toString());
