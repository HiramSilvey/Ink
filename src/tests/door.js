var fs = require('fs');
eval(fs.readFileSync('../ink.js')+'');
eval(fs.readFileSync('../sdl.js')+'');

let model = json2obj(sdl.parse(`
bedroom {
  all*: "A room with a bed in it";
  |
  [protagonist, toKitchen];
};

kitchen {
  all*: "Looks like an old kitchen. When was the last time these dishes were washed?";
  |
  [hotdog, toBedroom];
};

toKitchen {
  closed*: "A wooden door with a strange smell coming from behind it...";
  open: "The smell thickens.";
  |
  openKitchen: closed > open [openBedroom];
  go: open > open [protagonist > kitchen];
};

toBedroom {
  closed*: "A wooden door with a do not disturb sign on it";
  open: "Looks comfy.";
  |
  openBedroom: closed > open [openKitchen];
  go: open > open [protagonist > bedroom];
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
}`));
