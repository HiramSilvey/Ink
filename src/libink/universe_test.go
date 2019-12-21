package libink

import (
	"fmt"
	"strings"
	"io/ioutil"
	"testing"
)


func TestParseGameDescription(t *testing.T) {
	game := `object1 is description1`
	u := ParseGame(game)

	test_ans := u.Items["object1"].Description
	real_ans := "description1"
	if test_ans != real_ans {
		t.Errorf("Description expected: %s, got: %s\n", real_ans, test_ans)
	}
}

func TestParseGameStateProperty(t *testing.T) {
	game := `
object1 property prop1 can be val1 description2
object1 property prop1 can be val2 description3
object1 property prop1 can be val3 description4
object1 property prop1 is val1
`
	u := ParseGame(game)

	test_prop := func(pname, pval, exval string) {
		vals := u.Items["object1"].StateProperties[pname].Values
		if vals[pval] != exval {
			t.Errorf("Description expected: %s, got: %s\n", exval, vals[pname])
		}
	}
	test_prop("prop1","val1","description2")
	test_prop("prop1","val2","description3")
	test_prop("prop1","val3","description4")
	
	test_ans := u.Items["object1"].StatePropertyValues["prop1"]
	real_ans := "val1"
	if test_ans != real_ans {
		t.Errorf("Description expected: %s, got: %s\n", real_ans, test_ans)
	}
}

func TestParseGameNumProperty(t *testing.T) {
	game := `
object1 property prop2 num numdescription1
object1 property prop2 min 1
object1 property prop2 max 10
object1 property prop2 is 5`
	u := ParseGame(game)
	numprop := u.Items["object1"].NumProperties["prop2"]
	numpropval := u.Items["object1"].NumPropertyValues["prop2"]

	if numprop.Min != 1 {
		t.Errorf("Minimum expected: %d, got: %d\n", 1, numprop.Min)
	}
	if numprop.Max != 10 {
		t.Errorf("Minimum expected: %d, got: %d\n", 10, numprop.Max)
	}
	if numpropval != 5 {
		t.Errorf("Value expected: %d, got: %d\n", 5, numpropval)
	}
}


func TestGameWin(t *testing.T) {
	game, _ := ioutil.ReadFile("../../games/birthday.txt")
	gamestr := string(game)
	u := ParseGame(gamestr)
	u.Do("eat", "cheese")
	u.Do("fart", "")
	u.Do("stare", "log")
	u.Do("stare", "log")
	u.Do("use", "slats")
	u.Do("wait", "")
	u.Do("write", "poem")
	u.Do("look", "")
	u.Do("stare", "log")
	u.Do("stare", "log")
	u.Do("stare", "log")
	u.Do("go", "library")
	//u.Do("fart", "") // LOSE
	u.Do("use", "cubes")
	u.Do("go", "outdoors")
	u.Do("wait", "")
	u.Do("use", "slats")
	u.Do("look", "slats")
	u.Do("go", "library")
	u.Do("use", "mouse")
	u.Do("use", "computer")
	u.Do("take", "paper")
	u.Do("go", "outdoors")
	u.Do("write", "poem")
	u.Do("tar", "key")
	ans := u.Do("wrap", "keytar")
	if !strings.Contains(ans, "WIN") {
		t.Errorf("Expected a win. Got %s\n",ans)
	}
	fmt.Println(u)
}

