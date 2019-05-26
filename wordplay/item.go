package main

import "strings"

type Item struct {
	name string
	properties map[string]PropertyValue // name:value
	inventory []Item                    // list of Item
	actions map[string]Action           // verb -> action
}

func (i Item) Describe() string {
	var desc []string
	for pname, pval := range i.properties {
		desc = append(desc, pname + ": " + pval.Describe())
	}
	return i.name + " (" + strings.Join(desc, ", ") + ")"
}
