const readline = require('readline');
Ink = require('../ink.js');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'OHAI> '
});


Ink.setUniverse(`
room {
  *default: 'the living room' [go: '' [$object > $subject]];
};

kitchen {
  *default: 'a beautiful kitchen' [enlighten: '' -> lit, go: '' [$object > $subject]];
  lit: 'a beautiful, well-lit kitchen' [endarken: '' -> default, go: '' [$object > $subject]];
};

kitchen > lamp {
  on: 'the lamp casts its warmth on everything it touches' [_off: 'the light goes out' -> off [$object endarken kitchen], break: 'the bulb shatters' -> broken [$object endarken kitchen]];
  *off: 'a dusty lamp' [_on: 'the light comes on' -> on [$object enlighten kitchen], break: 'the bulb shatters' -> broken [$object endarken kitchen]];
  broken: 'a lamp with a shattered bulb';
};
kitchen > hotdog {
  *whole: 'a normal hotdog' [eat: 'hotdog was eaten' -> halfeaten [$object fill $subject]];
  halfeaten: 'a halfeaten hotdog';
};

kitchen > kitchenexit {
  *default: 'a door' [go: 'welcome to living room' [room > $subject]];
};

room > roomexit {
  *default: 'a door' [go: 'welcome to kitchen' [kitchen > $subject]];
};

room > chandelier {
  *off: 'a beautiful chandelier' [break: 'the bulb shatters' -> broken, scream: 'the bulb oscillates microscopically and then shatters' -> broken];
  broken: 'a busted chandelier';
};

room > switch {
  *off: 'a wall-mounted switch in the off position' [use: 'switch on' -> on [$object on lamp]];
  on: 'a wall-mounted switch in the on position' [use: 'switch off' -> off [$object off lamp]];
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
