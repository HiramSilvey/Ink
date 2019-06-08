package main

import "reflect"

// Represents actual changes that can happen in the world. To wit:
// - transfers: Items moving between owners
// - property_updates: Item properties being changed
// - follow_ons: Phrases representing response actions to be performed by the Item causing the Effect

type Effect struct {
	transfers []Transfer
	property_updates []PropertyUpdate
	follow_ons []Phrase
}

// Transfers need to be able to answer "what do I transfer?" and
// "where do I put it?" given answers to "who initiated the transfer?"
// and "on what?"

type Transfer struct {
	item Query
	destination Query
}
