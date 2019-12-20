package main

import (
	"fmt"
	"libink"
	"syscall/js"
	"github.com/docopt/docopt-go"
	"github.com/google/shlex"
)

var Game string
var U *libink.Universe
var c chan string

func SetGame(this js.Value, inputs []js.Value) interface{} {
	Game = inputs[0].String()
	callback := inputs[1]
	callback.Invoke(ResetGame())
	return nil
}

func ResetGame() string {
	U = libink.ParseGame(Game)
	return "done"
}

func RestartGame(this js.Value, inputs []js.Value) interface{} {
	callback := inputs[0]
	callback.Invoke(ResetGame())
	return nil
}

func DoCommand(this js.Value, inputs []js.Value) interface{} {
	var aftermath string
	usage := `Usage:
  do <verb>
  do <verb> <obj>`
	cmd := inputs[0].String()
	callback := inputs[1]

	fmt.Println("got")
	fmt.Println(inputs)
	fmt.Println(cmd)

	
	line, _ := shlex.Split(cmd)
	parser := &docopt.Parser{
		HelpHandler: docopt.PrintHelpOnly,
		OptionsFirst: true,
	}
	args, err := parser.ParseArgs(usage, line, "")
	if err != nil {
		fmt.Println(err)
		callback.Invoke("error")
		return nil
	}
	verb := args["<verb>"].(string)
	if do_str, ok := args["<obj>"].(string); ok {
		aftermath = U.Do(verb, do_str)
	} else {
		aftermath = U.Do(verb, "")
	}
	fmt.Println(aftermath)
	callback.Invoke(aftermath)
	return nil
}

func main() {
	U = libink.MakeUniverse()
	c = make(chan string, 100)
	js.Global().Set("InkSetGame", js.FuncOf(SetGame))
	js.Global().Set("InkRestartGame", js.FuncOf(RestartGame))
	js.Global().Set("InkRunCommand", js.FuncOf(DoCommand))
	fmt.Println("Hello Ink!")
	<-c
}

