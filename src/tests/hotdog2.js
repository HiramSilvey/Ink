Ink = require('../ink2.js');

Ink.setUniverse(`
room {
  *default: 'a normal room';
};
room > hotdog {
  *full: 'a normal hotdog' [eat: 'hotdog was eaten' -> halfeaten [hotdog fill $actor]];
  halfeaten: 'a halfeaten hotdog';
};
room > player {
  *hungry: 'a hungry hungry hippo' [_fill: 'mmm, delicious!' -> full];
  full: 'a full belly';
};
`);

//Ink.exec("protagonist","take","hotdog");
//Ink.exec("protagonist","eat","hotdog");
// hotdog = model.subItems["hotdog"][0];
// //console.log(hotdog);

// console.log("BEFORE");
// console.log(model.toString());
// applyAction("eat",hotdog);
// console.log("AFTER");
// console.log(model.toString());
