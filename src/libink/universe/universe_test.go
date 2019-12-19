package universe

import (
	"fmt"
	"io/ioutil"
	"testing"
)

func TestGameBig(t *testing.T) {
	game, _ := ioutil.ReadFile("test.ink")
	gamestr := string(game)
	u := ParseGame(gamestr)
	u.Do("eat", "cheese")
	u.Do("fart", "")
	u.Do("stare", "log")
	u.Do("stare", "log")
	u.Do("stare", "log")
	u.Do("go", "library")
	u.Do("use", "cubes")
	fmt.Println(u)
}

