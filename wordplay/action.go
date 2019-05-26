package main

type TransferResolver struct {
	item Query
	new_parent Query
}

func (tr TransferResolver) Resolve() (Transfer, bool) {
	// TODO
}

type Transfer struct {
	current_parent *Item
	item *Item
	new_parent *Item
}

func (t Transfer) Execute() bool {
	for i := range t.current_parent.inventory {
		if t.current_parent.inventory[i] == t.item {
			t.current_parent.inventory = append(t.current_parent.inventory[:i], t.current_parent.inventory[i+1]...)
			t.new_parent.inventory = append(t.new_parent.inventory, t.item)
			return true
		}
	}
	return false
}

type ActionResolver struct {
	subject Query
	object Query
	verb string
}

func (ar ActionResolver) Resolve() (Action, bool) {
	// TODO
}

type Action struct {
	transfers []Transfer
	property_updates []PropertyUpdate
	follow_on_effects []ActionResolver
}

func (a Action) Execute() bool {
	// TODO
}

var Dictionary map[string]ActionResolver
