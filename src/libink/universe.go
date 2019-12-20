package libink

import (
	"fmt"
	"strings"
	"strconv"
)

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

type Result struct {
	Description string
	Cond *Condition
}

type Universe struct {
	Items map[string]*Item
	Messages []string
	Wins []*Result
	Loses []*Result
}




func MakeUniverse() *Universe {
	return &Universe{Items: make(map[string]*Item), Wins: []*Result{}, Loses: []*Result{}}
}

func (u *Universe) AddWinCondition(description string, c *Condition) {
	u.Wins = append(u.Wins, &Result{Description: description, Cond: c})
}

func (u *Universe) AddLoseCondition(description string, c *Condition) {
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
		ans += i.Describe(false)
	}
	
	return ans
}

func (u *Universe) Look(i *Item) string {
	ans := "You can see:\n"
	for name, target := range u.Items {
		if i.CanReach(target) && target != i {
			if _, ok := i.Inventory[name]; !ok {
				ans += target.Describe(false)
			}
		}
	}
	ans += "You have:\n"
	for _, target := range i.Inventory {
		ans += target.Describe(false)
	}
	
	if i.Parent != nil {
		ans += "You are in:\n"
		ans += i.Parent.Describe(false)
	}
	if len(i.Description) > 0 {
		ans += "You are:\n"
		ans += i.Describe(false)
	}
	return ans
}

func (u *Universe) CheckCondition(c *Condition) bool {
	fmt.Println("check",c.Describe())
	actor := u.FindItem(c.ActorName)
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
		fmt.Println("HAS",c.ActorName,c.ChildName)
		_, ok := u.FindItem(c.ActorName).Inventory[c.ChildName]
		return ok
	} else if c.Type == CONDITION_ALL {
		for _, sc := range c.Subconditions {
			if !u.CheckCondition(sc) {
				return false
			}
		}
		return true
	} else if c.Type == CONDITION_ANY {
		for _, sc := range c.Subconditions {
			if u.CheckCondition(sc) {
				return true
			}
		}
		return false
	} else if c.Type == CONDITION_NOTALL {
		for _, sc := range c.Subconditions {
			if !u.CheckCondition(sc) {
				return true
			}
		}
		return false
	} else if c.Type == CONDITION_NOTANY {
		for _, sc := range c.Subconditions {
			if u.CheckCondition(sc) {
				return false
			}
		}
		return true
	}
	return false
}

func (u *Universe) RunAction(i *Item, verb string, dirobj *Item) []*Effect {
	fmt.Println("running action",verb,dirobj)
	ans := []*Effect{}
	for _, a := range i.Actions {
		if a.Verb == verb && dirobj == a.DirObj && (a.Cond == nil || u.CheckCondition(a.Cond)) {
			fmt.Println("ACT:",a)
			ans = append(ans, a.Effects...)
		}
	}
	return ans
}

func (u *Universe) RunEffect(e *Effect) []*Effect {
	if e.Type == EFFECT_DESCRIBE {
		fmt.Println(e.Message)
		u.Messages = append(u.Messages, e.Message)
	} else {
		actor := u.FindItem(e.ActorName)
		if e.Type == EFFECT_CHANGE {
			if actor.HasStateProperty(e.PropName) {
				actor.StatePropertyValues[e.PropName] = e.NewVal
			}
		} else if e.Type == EFFECT_DO {
			return u.RunAction(actor, e.Verb, u.FindItem(e.DirObj))
		} else if e.Type == EFFECT_ADD {
			if actor.HasNumProperty(e.PropName) {
				actor.NumPropertyValues[e.PropName] += e.ToAdd
			}
		} else if e.Type == EFFECT_GET {
			if target := u.FindItem(e.Target); target != nil {
				actor.Inventory[target.Name] = target
				target.Parent = actor
			}
		} else if e.Type == EFFECT_DROP {
			if target := u.FindItem(e.Target); target != nil {
				delete(actor.Inventory, target.Name)
			}
		}
	}
	return []*Effect{}
}

func (u *Universe) Do(verb, dirobj string) string {
	u.Messages = []string{}
	player := u.FindItem("player")
	if verb == "look" && dirobj == "" {
		return u.Look(player)
	}
	fmt.Println("=====ACTION=====\nplayer", verb, dirobj)
	obj := u.FindItem(dirobj)
	// if obj != nil && !player.CanReach(obj) {
	// 	fmt.Println("No",dirobj,"accessible")
	// 	return fmt.Sprintf("No %s accessible",dirobj)
	// }
	effects := u.RunAction(player, verb, obj)
	for len(effects) > 0 {
		new_effects := []*Effect{}
		for _, eff := range effects {
			fmt.Println("-- effect:",eff.Describe())
			new_effects = append(new_effects, u.RunEffect(eff)...)
		}
		effects = new_effects
	}
	fmt.Println(player.Parent)
	fmt.Println("checking loses")
	for _, r := range u.Loses {
		if u.CheckCondition(r.Cond) {
			fmt.Println("LOSE")
			fmt.Println(r.Description)
			return "LOSE"
		}
	}
	fmt.Println("checking wins")
	for _, r := range u.Wins {
		if u.CheckCondition(r.Cond) {
			fmt.Println("WIN")
			fmt.Println(r.Description)
			return "WIN"
		}
	}
	fmt.Println("---AFTERMATH---\n",u.Look(player))
	return strings.Join(u.Messages, "\n")
}
