package main

import "reflect"

type TransferResolver struct {
	item Query
	new_parent Query
}

func (tr TransferResolver) Resolve() (Transfer, bool) {
	// TODO
	return Transfer{}, true
}

type Transfer struct {
	item Item
	new_parent *Item
}

func (t Transfer) Execute() bool {
	for i, item := range t.item.parent.inventory {
		// TODO: determine if this is the best way to compare Items
		if reflect.DeepEqual(item, t.item) {
			t.item.parent.inventory = append(t.item.parent.inventory[:i], t.item.parent.inventory[i+1:]...)
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

type Action struct {
	transfers []Transfer
	property_updates []PropertyUpdate
	follow_on_effects []ActionResolver
}

func (ar ActionResolver) Resolve() (Action, bool) {
	// TODO
	return Action{}, true
}

func (a Action) Execute() bool {
	// TODO
	return true
}

var Dictionary map[string]ActionResolver
