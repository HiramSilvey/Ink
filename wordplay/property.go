package main

type PropertyValue struct { // lol tax
	constraint_type int // 0: unconstrained, 1: range-bounded, 2: valid value
	value int
	lower_bound int
	upper_bound int
	valid_values map[int]bool
	descriptions map[int]string
}

// returns true if setting is valid
func (pv *PropertyValue) SetTo(v int) bool {
	switch pv.constraint_type {
	case 1:
		if v < pv.lower_bound || v > pv.upper_bound {
			return false
		}
	case 2:
		if _, ok := pv.valid_values[v]; !ok {
			return false
		}
	}
	pv.value = v
	return true
}

func (pv PropertyValue) Describe() string {
	if desc, ok := pv.descriptions[pv.value]; ok {
		return desc
	}
	return string(pv.value)
}

type PropertyOperation int

const (
	PropertySet PropertyOperation = iota
	PropertyAdd
)

type PropertyUpdateOperation struct {
	operation PropertyOperation
	value int
}

type PropertyUpdate struct {
	subject *Query                 // Whose property are we updating
	name string                    // Which property are we updating
	update PropertyUpdateOperation // What to do to the value
}
