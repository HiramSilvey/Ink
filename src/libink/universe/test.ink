player is "Just a normal guy"

outdoors is "Ah, fresh air"
library is "The library"
basement is "The library basement"

cheese is "A large wheel of cheese"
cubes is "Some cheese cubes"
trap is "A mousetrap"
pen is "A pen"
log is "A log"
boulder is "A massive boulder"
slats is "Some wood slats"
paper is "Some sheets of paper"
wrapper is "Wrapping paper"
poem is "A poem"
web is "The internet"
computer is "A computer"
tar is "There is a puddle of tar on the ground"
key is "A key"
keytar is "A keytar, but it's missing something"
rockinkeytar is "A rockin' keytar. Awwww yea"
present is "A present!"
mouse is "A mouse"

outdoors has player
outdoors has log
outdoors has boulder
outdoors has tar
basement has trap
library has paper
library has computer
player has cheese

player property comfort can be normal ""
player property comfort can be uncomfortable "Your stomach hurts a little"
player property comfort can be veryuncomfortable "Your stomach hurts a lot"
player property comfort is normal
player property numslats num "slats" 
player property numslats max 44
player property numslats min 0

log property length num "meters"
log property length is 4

library property smell can be normal "it smells of musty books"
library property smell can be stinky "Ew, someone farted"
library property smell is normal

computer property usability can be nomouse "The computer seems to be missing a mouse"
computer property usability can be useable "The computer is ready to use"

basement property lightness can be dark "You strain to make out what's there, but only see blackness"
basement property lightness can be light "The fluorescent light burns your retinas"
basement property lightness is light

trap property state can be empty "the trap is empty"
trap property state can be loaded "the trap is loaded with bait"
trap property state can be tripped "the trap has caught something"
trap property state is empty

trap can trip "" then "trap change state to tripped" "player get mouse" "describe 'you got a mouse!'"

player can eat cheese if "player has cheese" then "describe 'yum. But now you feel a build up of gasses in your intestines'" "player drop cheese" "player change comfort to uncomfortable"
player can fart "" then "describe 'Hahahaha but now it smells like fart'"
player can fart "" if 'all "player property comfort is uncomfortable" "library has player"' then "library change smell to stinky"
player can fart "" if "player property comfort is uncomfortable" then "describe 'you cut the cheese'" "player get cubes" "player change comfort to normal"
player can use cubes if 'all "player has cubes" "library has player" "trap property state is empty"' then "trap change state to loaded"
player can stare log if 'all "outdoors has player" "log property length greater than 0"' then "describe 'you saw the log'" "log add length m1" "player add numslats 1"
player can stare log if 'all "outdoors has player" "log property length less than 1"' then "describe 'you can barely see the log'"
player can use slats if 'all "outdoors has player" "player property numslats greater than 3"' then "describe 'you arrange the slats to make a pen'" "player get pen"
player can use slats if 'all "outdoors has player" "player property numslats less than 4"' then "describe 'You do not have enough slats to do anything interesting'"
player can use slats if "library has player" then "describe 'What are you doing with those in here?'"
player can use mouse if 'all "library has player" "player has mouse"' then "describe 'you attach the mouse to the computer'" "computer change usability to useable" "player drop mouse"
player can use computer if 'all "library has player" "computer property usability is useable"' then 'describe "you browse the web and find the key"' "player get key"
player can write poem if 'all "player has paper" "player has pen"' then "describe 'awwww yeah, you now have rapping paper'" "player drop paper" "player get wrapper"
player can write poem if 'not all "player has paper" "player has pen"' then "describe 'you might need a pen and paper to do that'"
player can write "" then 'describe "what do you want to write?"'

player can take paper if "library has player" then "player get paper" "library drop paper"
player can tar key if 'all "outdoors has player" "player has key"' then 'describe "You just made a keytar. Awww yea"' "player get keytar" "player drop key"
player can wait "" if "trap property state is loaded" then "trap do trip ''"
player can wrap keytar if 'all "player has keytar" "player has wrapper"' then 'describe "You have a nice present"' "player get present"

player can go library if "basement has player" then "basement drop player" "library get player"
player can go library if "outdoors has player" then "outdoors drop player" "library get player"
player can go basement if "library has player" then "library drop player" "basement get player"
player can go outdoors if "library has player" then "library drop player" "outdoors get player"

lose "You stunk up the library. How dare you. YOU LOSE." if "library property smell is stinky" 
win "You have a present! Happy Hanukkah! YOU WIN." if "player has present"
