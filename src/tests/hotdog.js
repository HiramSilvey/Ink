Ink = require('../ink2.js');

Ink.setUniverse(`
room {
  default*: "A normal room";
  |
  go: default > default;
  |
  [protagonist, hotdog];
};

protagonist {
  awake*: "Basically the best";
  asleep: "Zzz...";
  |
  fill: awake > asleep;
};

hotdog {
  whole*: "a nice stick of processed meat";
  halved: "nomnom";
  |
  eat: whole > halved [fill];
}`);

Ink.exec("protagonist","take","hotdog");
Ink.exec("protagonist","eat","hotdog");
// hotdog = model.subItems["hotdog"][0];
// //console.log(hotdog);

// console.log("BEFORE");
// console.log(model.toString());
// applyAction("eat",hotdog);
// console.log("AFTER");
// console.log(model.toString());
