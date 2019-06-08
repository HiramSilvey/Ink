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
	Do({ToDo{resolver: ar, request: req}})
}


// Represents the description of the context in which a particular action is to be taken
type Phrase struct {
	subject Item
	object string
	verb string
	preposition string
	preposition_object string
}


// The mapping between a verb and the query that pick out the objects
// of that verb
var Dictionary map[string]Query

// The one Item to rule them all
var Universe Item

// The main execution of a phrase:
//
// - Use `Dictionary` to find the query that will give us the verb's object(s)
// - Execute that query to acquire the actual []Item target list of the action
// - For each target in that list with the verb as a valid action:
//   - Find the effect associated with that verb
//   - Execute all transfers in the effect
//   - Execute all property updates in the effect
//   - Execute all follow-on phrases with actor now being the target item itself
//
// TODO: It is possible that these executions can/should be farmed out to member functions of the various structs
// themselves, but for simplicity it will all be placed here for now. As currently realised, this function has "yikes"
// many nested loops.

func Execute(p Phrase) []QueryError {
	errs := []QueryError{}
	if q,ok := Dictionary[p.verb]; ok {
		if objs,err := q.execute(Universe); err == nil {
			for target := range objs {
				// Now `target` is the target of actor's action

				if effect,has_effect := target.actions[p.verb]; has_effect {
					// Here, actor finally performs the action on the target

					// First, execute all transitions
					for t := range effect.transfers {
						if to_move,err := t.item.Execute(); err != nil {
							errs = append(errs, err)
							continue
						}
						if destination,err := t.destination.Execute(); err != nil {
							errs = append(errs, err)
							continue
						}
						// Find to_move in its parent's inventory and LIKE TO MOVE IT MOVE IT
						for i, item := range to_move.parent.inventory {	
							if reflect.DeepEqual(item, to_move) {
								item.parent.inventory = append(to_move.parent.inventory[:i], to_move.parent.inventory[i+1:]...)
								destination.inventory = append(destination.inventory, to_move)
								break
							}
						}
					}
					
					// Then execute property updates
					for pu := range effect.property_updates {
						// Find the item whose properties we wish to update
						if item_to_update,err := pu.subject.Execute(); err != nil {
							errs = append(errs, err)
							continue
						}

						// Execute the update on that item
						if err := pu.update.Execute(item_to_update); err != nil {
							errs = append(errs, err)
							continue
						}
					}

					// Finally, execute follow-on actions (recursively, which results in depth-first
					// execution, which may not be desirable)
					for follow_on := range effect.follow_ons {
						Execute(follow_on, target)
					}
				} else {
					fmt.Println("Cannot {p.verb} to {target.Describe()}")
				}
			}
		}
	}
	for effect := range effects {
			for result := range obj.Actions[req.verb].follow_on_effects {
				follow_ons = append(follow_ons, ToDo{resolver: result, request: })
			}
	}
}
