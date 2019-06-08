package main

// The various types of query, enumerated
type QueryOperation int

const (
	Limit QueryOperation = iota + 1
	Actor
	Cause
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
	ConstantInt
	ConstantString
)

// The various ways a query can fail, enumerated
type QueryError int

const (
	Ambiguous QueryError = iota + 1
)


// A query is of the form QueryOperation(param1 Query, param2 Query, ...) and may additionally reference some constants (e.g. to compare
// to "hello" or such)
type Query struct {
	operation QueryOperation
	params []*Query
	constant_int int
	constant_string string
}

// To execute a query, we need to know some context:
// * The items relevant to the query (N.B.: This means this function can probably only be kicked off by something with a reference to the universe)
// * The actor (as an Item) -- the thing that originated the whole chain of actions
// * The cause (as an Item) -- the proximate cause of the query (e.g. the object on which we're having an effect)
// * The intended target (as a string)

func (q Query) Execute(context []Item, actor Item, initiator Item, target string) ([]Item, QueryError) {
	// TODO
	return make([]Item, 0), true
}

// TODO make one of these and fill it out with functions!
type QueryMap map[QueryOperation]func(context []Item, actor Item, initiator Item, target string) ([]Item, QueryError)

