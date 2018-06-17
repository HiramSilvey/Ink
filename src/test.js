var fs = require('fs');
eval(fs.readFileSync('ink.js')+'');
eval(fs.readFileSync('sdl.js')+'');

let model = json2obj(sdl.parse(`
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
}`));

hotdog = model.subItems["hotdog"][0];

console.log("BEFORE");
console.log(model.toString());
applyAction("eat",hotdog);
console.log("AFTER");
console.log(model.toString());

