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

// Represents the description of the context in which a particular action is to be taken
type ActionRequest struct {
	subject string
	object string
	verb string
	preposition string
	preposition_object string
}

// Represents the meaning of an action
type ActionResolver struct {
	subject Query
	object Query
	verb string
}

type ToDo struct {
	resolver ActionResolver
	request ActionRequest
}

// Represents things that happen
type Effect struct {
	transfers []Transfer
	property_updates []PropertyUpdate
	follow_on_effects []ActionResolver
}

func (ar ActionResolver) Resolve(req ActionRequest) ([]Effect, bool) {
	// TODO
	
	// Get the subject and object(s) requested
	subject := ar.subject.execute(req) // need to ensure there
	objects := ar.subject.execute(req)
	effects := []Effect{}
	
	
	for obj := range objects {
		e, ok := obj.Actions[req.verb]
		if !ok {
			return effects, false
		}
		effects = append(effects, e)
		
	}
	return effects, true
}

func (e Effect) Execute() bool {
	// TODO
	return true
}

var Dictionary map[string]ActionResolver
