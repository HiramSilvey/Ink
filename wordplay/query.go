package main

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

type QueryResult []Item

func (q Query) Execute() (QueryResult, bool) {
	// TODO
}

QueryMap map[QueryOperation]func(params []QueryResult) QueryResult
