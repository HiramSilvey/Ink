package universe

import (
	"fmt"
	"strconv"
	"math"
)

type EffectType int
const (
	EFFECT_CHANGE EffectType = iota + 1
	EFFECT_DO
	EFFECT_ADD
	EFFECT_GET
	EFFECT_DROP
	EFFECT_DESCRIBE
)

type ConditionType int
const (
	CONDITION_PROPIS ConditionType = iota + 1
	CONDITION_PROPGT
	CONDITION_PROPLT
	CONDITION_HAS
)

type Effect struct {
	Type EffectType
	ActorName string
	PropName string
	OldVal string
	NewVal string
	Verb string
	DirObj string
	ToAdd int
	Target string
	Message string
}

type Condition struct {
	Type ConditionType
	ActorName string
	PropName string
	PropVal string
	ChildName string
}

type StateProperty struct {
	Values map[string]string
}

type NumProperty struct {
	Max int
	Min int
}

type Action struct {
	Verb string
	Cond *Condition
	DirObj *Item
	Effects []*Effect
}

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

type Result struct {
	Description string
	Cond []*Condition
}

type Universe struct {
	Items map[string]*Item
	Wins []*Result
	Loses []*Result
}


func MakeUniverse() *Universe {
	return &Universe{Items: make(map[string]*Item), Wins: []*Result{}, Loses: []*Result{}}
}

func (u *Universe) AddLoseCondition(description string, c []*Condition) {
	u.Wins = append(u.Wins, &Result{Description: description, Cond: c})
}

func (u *Universe) AddWinCondition(description string, c []*Condition) {
	u.Loses = append(u.Loses, &Result{Description: description, Cond: c})
}

func (u *Universe) GetItem(name string) *Item {
	if ans, ok := u.Items[name]; ok {
		return ans
	}
	i := &Item{
		Name: name,
		StateProperties: make(map[string]*StateProperty),
		StatePropertyValues: make(map[string]string),
		NumProperties: make(map[string]*NumProperty),
		NumPropertyValues: make(map[string]int),
		Inventory: make(map[string]*Item),
		Actions: []*Action{},
	}
	u.Items[name] = i
	return i
}

func (u *Universe) FindItem(name string) *Item {
	if ans, ok := u.Items[name]; ok {
		return ans
	}
	return nil
}

func (u *Universe) Describe() string {
	ans := ""
	ans += "Items:\n"
	for _, i := range u.Items {
		ans += i.Describe()
	}
	
	return ans
}

func (i *Item) Describe() string {
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
	// if len(i.Inventory) > 0 {
	// 	ans += "Inventory: \n"
	// 	for name, child := range i.Inventory {
	// 		ans += fmt.Sprintf("%s: %s\n", name, child.Name)
	// 	}
	// }
	return ans
}

func (u *Universe) Look(i *Item) string {
	ans := "You can see:\n"
	for _, target := range u.Items {
		if i.CanReach(target) && target != i {
			ans += target.Describe()
		}
	}
	if i.Parent != nil {
		ans += i.Parent.Describe()
	}
	return ans
}

func (actor *Item) CheckCondition(c *Condition) bool {
	if c.Type == CONDITION_PROPIS {
		if actor.HasNumProperty(c.PropName) {
			target_val, _ := strconv.Atoi(c.PropVal)
			return actor.NumPropertyValues[c.PropName] == target_val
		} else if actor.HasStateProperty(c.PropName) {
			return actor.StatePropertyValues[c.PropName] == c.PropVal
		}
	} else if c.Type == CONDITION_PROPGT {
		if actor.HasNumProperty(c.PropName) {
			target_val, _ := strconv.Atoi(c.PropVal)
			return actor.NumPropertyValues[c.PropName] > target_val
		}
	} else if c.Type == CONDITION_PROPLT {
		if actor.HasNumProperty(c.PropName) {
			target_val, _ := strconv.Atoi(c.PropVal)
			return actor.NumPropertyValues[c.PropName] < target_val
		}
	} else if c.Type == CONDITION_HAS {
		_, ok := actor.Inventory[c.ChildName]
		return ok
	}
	return false
}

func (e *Effect) Describe() string {
	if e.Type == EFFECT_CHANGE {
		return fmt.Sprintf("%s change %s to %s", e.ActorName, e.PropName, e.NewVal)
	} else if e.Type == EFFECT_DO {
		return fmt.Sprintf("%s do %s to %s", e.ActorName, e.Verb, e.DirObj)
	} else if e.Type == EFFECT_ADD {
		return fmt.Sprintf("%s add %d to %s", e.ActorName, e.ToAdd, e.PropName)
	} else if e.Type == EFFECT_GET {
		return fmt.Sprintf("%s get %s", e.ActorName, e.Target)
	} else if e.Type == EFFECT_DROP {
		return fmt.Sprintf("%s drop %s", e.ActorName, e.Target)
	} else if e.Type == EFFECT_DESCRIBE {
		return fmt.Sprintf("say %s", e.Message)
	}
	return "Other"
}

func (u *Universe) RunEffect(e *Effect) []*Effect {
	if e.Type == EFFECT_DESCRIBE {
		fmt.Println(e.Message)
	} else {
		actor := u.FindItem(e.ActorName)
		if e.Type == EFFECT_CHANGE {
			if actor.HasStateProperty(e.PropName) {
				actor.StatePropertyValues[e.PropName] = e.NewVal
			}
		} else if e.Type == EFFECT_DO {
			return actor.RunAction(e.Verb, u.FindItem(e.DirObj))
		} else if e.Type == EFFECT_ADD {
			if actor.HasNumProperty(e.PropName) {
				actor.NumPropertyValues[e.PropName] += e.ToAdd
			}
		} else if e.Type == EFFECT_GET {
			if target := u.FindItem(e.Target); target != nil {
				actor.Inventory[target.Name] = target
			}
		} else if e.Type == EFFECT_DROP {
			if target := u.FindItem(e.Target); target != nil {
				delete(actor.Inventory, target.Name)
			}
		}
	}
	return []*Effect{}
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

func (i *Item) RunAction(verb string, dirobj *Item) []*Effect {
	fmt.Println("running action",verb,dirobj)
	ans := []*Effect{}
	for _, a := range i.Actions {
		if a.Verb == verb && (dirobj == a.DirObj || i.CanReach(dirobj)) && (a.Cond == nil || i.CheckCondition(a.Cond)) {
			ans = append(ans, a.Effects...)
		}
	}
	return ans
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

func (u *Universe) Do(verb, dirobj string) {
	fmt.Println("=====ACTION=====\nplayer", verb, dirobj)
	player := u.FindItem("player")
	obj := u.FindItem(dirobj)
	if obj != nil && !player.CanReach(obj) {
		fmt.Println("No",dirobj,"accessible")
		return
	}
	effects := player.RunAction(verb, obj)
	for len(effects) > 0 {
		new_effects := []*Effect{}
		for _, eff := range effects {
			fmt.Println("-- effect:",eff.Describe())
			new_effects = append(new_effects, u.RunEffect(eff)...)
		}
		effects = new_effects
	}
	fmt.Println(player.Parent)
	fmt.Println("---AFTERMATH---\n",u.Look(player))
}
