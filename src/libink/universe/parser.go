package universe

import (
	"fmt"
	"strings"
	"strconv"
	"github.com/docopt/docopt-go"
	"github.com/google/shlex"
)

func ParseEffect(effect_str string) (*Effect, error) {
	effect_def := `effect

Usage: 
  effect <item> change <propname> to <newpropval>
  effect <item> do <verb> <directobj>
  effect <item> add <propname> <num>
  effect <item> get <gotten>
  effect <item> drop <dropped>
  effect describe <message>
`
	es, err := shlex.Split(effect_str)
	if err != nil {
		return nil, err
	}
	args, err := docopt.ParseArgs(effect_def, es, "")
	if err != nil {
		return nil, err
	}
        if args["change"].(bool) {
		return &Effect{Type: EFFECT_CHANGE, ActorName: args["<item>"].(string), PropName: args["<propname>"].(string), NewVal: args["<newpropval>"].(string)}, nil
	} else if args["do"].(bool) {
		return &Effect{Type: EFFECT_DO, ActorName: args["<item>"].(string), Verb: args["<verb>"].(string), DirObj: args["<directobj>"].(string)}, nil
	} else if args["add"].(bool) {
		num := args["<num>"].(string)
		num = strings.ReplaceAll(num, "m", "-")
		to_add, err := strconv.Atoi(num)
		if err != nil {
			return nil, err
		}
		return &Effect{Type: EFFECT_ADD, ActorName: args["<item>"].(string), PropName: args["<propname>"].(string), ToAdd: to_add}, nil
	} else if args["get"].(bool) {
		return &Effect{Type: EFFECT_GET, ActorName: args["<item>"].(string), Target: args["<gotten>"].(string)}, nil
	} else if args["drop"].(bool) {
		return &Effect{Type: EFFECT_DROP, ActorName: args["<item>"].(string), Target: args["<dropped>"].(string)}, nil
	} else if args["describe"].(bool) {
		return &Effect{Type: EFFECT_DESCRIBE, Message: args["<message>"].(string)}, nil
	}
	return nil, nil
}

func ParseCondition(condition_str string) (*Condition, error) {
	condition_def := `condition

Usage: 
  condition <item> property <propname> is <propval>
  condition <item> property <propname> greater than <propval>
  condition <item> property <propname> less than <propval>
  condition <item> has <child>
  condition all <conditions>...
  condition any <conditions>...
  condition not all <conditions>...
  condition not any <conditions>...
`
	cs, err := shlex.Split(condition_str)
	if err != nil {
		return nil, err
	}
	args, err := docopt.ParseArgs(condition_def, cs, "")
	if err != nil {
		return nil, err
	}
	
        if args["is"].(bool) {
		return &Condition{Type: CONDITION_PROPIS, ActorName: args["<item>"].(string), PropName: args["<propname>"].(string), PropVal: args["<propval>"].(string)}, nil
	} else if args["greater"].(bool) {
		return &Condition{Type: CONDITION_PROPGT, ActorName: args["<item>"].(string), PropName: args["<propname>"].(string), PropVal: args["<propval>"].(string)}, nil
	} else if args["less"].(bool) {
		return &Condition{Type: CONDITION_PROPLT, ActorName: args["<item>"].(string), PropName: args["<propname>"].(string), PropVal: args["<propval>"].(string)}, nil
	} else if args["has"].(bool) {
		return &Condition{Type: CONDITION_HAS, ActorName: args["<item>"].(string), ChildName: args["<child>"].(string)}, nil
	} else if args["all"].(bool) || args["any"].(bool) {
		subconditions := make([]*Condition, 0)
		for _, c := range args["<conditions>"].([]string) {
			cond, _ := ParseCondition(c)
			subconditions = append(subconditions, cond)
		}
		ty := CONDITION_ALL
		if args["all"].(bool) && !args["not"].(bool) {
			ty = CONDITION_ALL
		} else if args["all"].(bool) && args["not"].(bool) {
			ty = CONDITION_NOTALL
		} else if args["any"].(bool) && !args["not"].(bool) {
			ty = CONDITION_ANY
		} else if args["any"].(bool) && args["not"].(bool) {
			ty = CONDITION_NOTANY
		}
		return &Condition{Type: ty, Subconditions: subconditions}, nil
	}
	return nil, nil
}

func ParseGame(game string) *Universe {
	obj_def := `object

Usage:
  obj <item> is <description>
  obj <item> has <child>
  obj <item> property <propname> can be <propval> <description>
  obj <item> property <propname> num <description>
  obj <item> property <propname> max <propval>
  obj <item> property <propname> min <propval>
  obj <item> property <propname> is <propval>
  obj <item> can <verb> <directobj> then <effects>...
  obj <item> can <verb> <directobj> if <condition> then <effects>...
  obj win <description> if <condition>
  obj lose <description> if <condition>
`
	u := MakeUniverse()
	
	for lineno, l := range strings.Split(game, "\n") {
		fmt.Println("Line:",l)
		l = strings.TrimSpace(l)
		if len(l) == 0 {
			continue
		}
		line, _ := shlex.Split(l)
		args, err := docopt.ParseArgs(obj_def, line, "")
		if err != nil {
			fmt.Println("Line",lineno,":",l,">>> Error:",err)
		} else {
			if args["win"].(bool) {
				cond_str := args["<condition>"].(string)
				cond, err := ParseCondition(cond_str)
				if err != nil {
					fmt.Println("Line",lineno,":",l,">>> Condition: ",cond_str,">>> Error:",err)
					continue
				}
				u.AddWinCondition(args["<description>"].(string), cond)
			} else if args["lose"].(bool) {
				cond_str := args["<condition>"].(string)
				cond, err := ParseCondition(cond_str)
				if err != nil {
					fmt.Println("Line",lineno,":",l,">>> Condition: ",cond_str,">>> Error:",err)
					continue
				}
				u.AddLoseCondition(args["<description>"].(string), cond)
			} else {
				item := u.GetItem(args["<item>"].(string))
				if args["is"].(bool) && !args["property"].(bool) {
					item.SetDescription(args["<description>"].(string))
				} else if args["has"].(bool) {
					item.AddChild(u.GetItem(args["<child>"].(string)))
				} else if args["can"].(bool) && args["be"].(bool) {
					item.AddStateProperty(args["<propname>"].(string), args["<propval>"].(string), args["<description>"].(string))
				} else if args["num"].(bool) {
					item.AddNumProperty(args["<propname>"].(string), args["<description>"].(string))
				} else if args["max"].(bool) {
					val, _ := strconv.Atoi(args["<propval>"].(string))
					item.SetNumPropertyMax(args["<propname>"].(string), val)
				} else if args["min"].(bool) {
					val, _ := strconv.Atoi(args["<propval>"].(string))
					item.SetNumPropertyMin(args["<propname>"].(string), val)
				} else if args["property"].(bool) && args["is"].(bool) {
					if item.HasStateProperty(args["<propname>"].(string)) {
						item.SetStatePropertyValue(args["<propname>"].(string), args["<propval>"].(string))
						fmt.Println("pset",args["<propname>"].(string),args["<propval>"].(string))
					} else if item.HasNumProperty(args["<propname>"].(string)) {
						val, _ := strconv.Atoi(args["<propval>"].(string))
						item.SetNumPropertyValue(args["<propname>"].(string), val)
					} else {
						fmt.Println("Non-existent property:",args["<propname>"].(string))
					}
				} else if args["can"].(bool) && !args["if"].(bool) && args["then"].(bool) {
					effects := []*Effect{}
					for _, es := range args["<effects>"].([]string) {
						eff, err := ParseEffect(es)
						if err != nil {
							fmt.Println("Line",lineno,":",l,">>> effect: ",es,">>> Error:",err)
							continue
						}
						effects = append(effects, eff)
					}
					item.AddAction(args["<verb>"].(string), u.FindItem(args["<directobj>"].(string)), effects, nil)
				} else if args["can"].(bool) && args["if"].(bool) && args["then"].(bool) {
					effects := []*Effect{}
					for _, es := range args["<effects>"].([]string) {
						eff, err := ParseEffect(es)
						if err != nil {
							fmt.Println("Line",lineno,":",l,">>> effect: ",es,">>> Error:",err)
							continue
						}
						effects = append(effects, eff)
					}
					cond, err := ParseCondition(args["<condition>"].(string))
					if err != nil {
						fmt.Println("Line",lineno,":",l,">>> Condition: ",args["<condition>"].(string),">>> Error:",err)
						continue
					}
					item.AddAction(args["<verb>"].(string), u.FindItem(args["<directobj>"].(string)), effects, cond)
				} else {
					fmt.Println("Line",lineno,":",l,">>> Something unexpected happened. Args:",args)
				}
			} 
		}
	}
	return u
}
