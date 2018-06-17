var fs = require('fs');
eval(fs.readFileSync('ink.js')+'');
eval(fs.readFileSync('sdl.js')+'');
console.log(JSON.stringify(sdl.parse(`
hotdog { 
  whole*: "a nice stick of processed meat"; 
  halved: "nomnom"; 
  | 
  eat: whole > halved [fill];
}`)));
