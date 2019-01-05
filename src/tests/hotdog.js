const readline = require('readline');
Ink = require('../ink.js');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'OHAI> '
});


Ink.setUniverse(`
room {
  *default: 'a normal room';
};
room > hotdog {
  *whole: 'a normal hotdog' [eat: 'hotdog was eaten' -> halfeaten [$object fill $subject]];
  halfeaten: 'a halfeaten hotdog';
};
room > rotdog {
  *whole: 'a green hotdog' [eat: 'poison hotdog was eaten' -> halfeaten [$object kill $subject]];
  halfeaten: 'a halfeaten green hotdog';
};
room > player {
  *hungry: 'a hungry hungry hippo' [go: 'got it' [player > $subject], _fill: 'mmm, delicious!' -> full, _kill: 'ew gross!' -> dead];
  full: 'a full belly';
  dead: 'ur dead lol';
};
`);

rl.prompt()

rl.on('line', (answer) => {
    words = answer.split(" ");
    Ink.exec("player",words[0],words.slice(1).join(" "))
});

//Ink.exec("player","take","hotdog");
//Ink.exec("player","take","normal hotdog");
// Ink.exec("player","take","green hotdog");
// Ink.exec("player","eat","hotdog");
// hotdog = model.subItems["hotdog"][0];
// //console.log(hotdog);

// console.log("BEFORE");
// console.log(model.toString());
// applyAction("eat",hotdog);
// console.log("AFTER");
// console.log(model.toString());
