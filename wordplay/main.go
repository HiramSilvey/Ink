package main

import "fmt"

func main() {
	fmt.Println("Hello, WebAssembly!")
}

func ParseInput(cmd string) (ActionRequest, string) {
	
}

func HandleInput(cmd string) {
	// Extract the verb (and thereby, via Dictionary, the
	// ActionResolver) for the user's action as well as the
	// details about what to do (who does it, to what, and
	// where--all contained in the ActionRequest)
	req,verb := ParseInput(cmd)
	ar := Dictionary[verb]
	Step({Todo{resolver: ar, request: req}})
}

func Do(todo_list []ToDo) {
	for len(todo_list) > 0 {
		todo := todo_list[0]
		effects,success := todo.resolver.Resolve(todo.request)
		if !success {
			// TODO how to abort with sensible information
			return
		}
		for effect := range effects {
			for result := range obj.Actions[req.verb].follow_on_effects {
				follow_ons = append(follow_ons, ToDo{resolver: result, request: })
			}
		}
	}
}
