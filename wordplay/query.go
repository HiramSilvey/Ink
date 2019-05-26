package main

type Query struct {
	operation QueryOperation
	params []*Query
	constant_int int
	constant_string string
}

type QueryResult []Item

QueryMap map[QueryOperation]func(params []QueryResult) QueryResult

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
