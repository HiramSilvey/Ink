package libink

import (
	"fmt"
	"math"
)

type Item struct {
	Name string
	Description string
	StateProperties map[string]*StateProperty
	StatePropertyValues map[string]string
	NumProperties map[string]*NumProperty
	NumPropertyValues map[string]int
	Parent *Item
	Inventory map[string]*Item
	Actions []*Action           // verb -> action
}

func (i *Item) Describe(debug bool) string {
	if !debug {
		return fmt.Sprintf("%s: %s\n", i.Name, i.Description)
	}
	ans := fmt.Sprintf("Name: %s\nDescription: %s\n", i.Name, i.Description)
	if i.Parent != nil {
		ans += fmt.Sprintf("Parent: %s\n", i.Parent.Name)
	}
	if len(i.StatePropertyValues) > 0 || len(i.NumPropertyValues) > 0 {
		ans += "Properties: \n"
		for name, val := range i.StatePropertyValues {
			ans += fmt.Sprintf("%s: %s\n", name, val)
		}
		for name, val := range i.NumPropertyValues {
			ans += fmt.Sprintf("%s: %d\n", name, val)
		}
	}
	if len(i.Inventory) > 0 {
		ans += "Inventory: \n"
		for name, child := range i.Inventory {
			ans += fmt.Sprintf("%s: %s\n", name, child.Name)
		}
	}
	return ans
}

func (i *Item) CanReach(target *Item) bool {
	if _, ok := i.Inventory[target.Name]; !ok {
		if i.Parent != nil {
			_, ok2 := i.Parent.Inventory[target.Name]
			return ok2
		}
		return false
	}
	return true
}

func (i *Item) AddChild(child *Item) {
	i.Inventory[child.Name] = child
	child.Parent = i
}

func (i *Item) HasChild(child *Item) bool {
	_, ok := i.Inventory[child.Name]
	return ok
}

func (i *Item) AddNumProperty(propname, description string) {
	i.NumProperties[propname] = &NumProperty{Min: 0, Max: math.MaxInt32}
}

func (i *Item) AddStateProperty(propname, propval, description string) {
	if _, ok := i.StateProperties[propname]; !ok {
		i.StateProperties[propname] = &StateProperty{Values: make(map[string]string)}
	}
	i.StateProperties[propname].Values[propval] = description
}

func (i *Item) AddAction(verb string, dirobj *Item, effects []*Effect, c *Condition) {
	i.Actions = append(i.Actions, &Action{Verb: verb, Cond: c, DirObj: dirobj, Effects: effects})
}

func (i *Item) HasNumProperty(propname string) bool {
	_, ok := i.NumProperties[propname]
	return ok
}

func (i *Item) HasStateProperty(propname string) bool {
	_, ok := i.StateProperties[propname]
	return ok
}

func (i *Item) SetDescription(description string) {
	i.Description = description
}

func (i *Item) SetNumPropertyMax(propname string, maxval int) {
	i.NumProperties[propname].Max = maxval
}

func (i *Item) SetNumPropertyMin(propname string, minval int) {
	i.NumProperties[propname].Min = minval
}

func (i *Item) SetNumPropertyValue(propname string, propval int) {
	if i.NumProperties[propname].Min <= propval && propval <= i.NumProperties[propname].Max {
		i.NumPropertyValues[propname] = propval
	}
}

func (i *Item) SetStatePropertyValue(propname string, propval string) {
	if _, ok := i.StateProperties[propname].Values[propval]; ok {
		i.StatePropertyValues[propname] = propval
	}
}
