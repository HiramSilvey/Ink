package main

type Transfer struct {
	item_to_transfer Query
	destination Query
}

type ActionResolver struct {
	subject_query Query
	object_query Query
	verb string
}

type Action struct {
	transfers []Transfer
	property_updates []PropertyUpdate
	follow_on_effects []ActionResolver
}

var Dictionary map[string]ActionResolver
