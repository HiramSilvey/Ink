package main

type QueryOperation int

const (
	Limit QueryOperation = iota
	And
	Or
	Not
	HasDescription
	HasChild
	HasParent
	HasName
	PropertyGreater
	PropertyLess
	PropertyEqual
	EnteredObject
	EnteredSubject
	EnteredVerb
	ConstantInt
	ConstantString
)

type Query struct {
	operation QueryOperation
	params []*Query
	constant_int int
	constant_string string
}

func (q Query) Execute() ([]Item, bool) {
	// TODO
	return make([]Item, 0), true
}

type QueryMap map[QueryOperation]func(items []Item) Item
