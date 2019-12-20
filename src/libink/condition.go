package libink

import (
	"fmt"
	"strings"
)

type ConditionType int
const (
	CONDITION_PROPIS ConditionType = iota + 1
	CONDITION_PROPGT
	CONDITION_PROPLT
	CONDITION_HAS
	CONDITION_ALL
	CONDITION_ANY
	CONDITION_NOTALL
	CONDITION_NOTANY
)

type Condition struct {
	Type ConditionType
	ActorName string
	PropName string
	PropVal string
	ChildName string
	Subconditions []*Condition
}

func (c *Condition) Describe() string {
	if c.Type == CONDITION_PROPIS {
		return fmt.Sprintf("%s %s is %s", c.ActorName, c.PropName, c.PropVal)
	} else if c.Type == CONDITION_PROPGT {
		return fmt.Sprintf("%s %s > %s", c.ActorName, c.PropName, c.PropVal)
	} else if c.Type == CONDITION_PROPLT {
		return fmt.Sprintf("%s %s < %s", c.ActorName, c.PropName, c.PropVal)
	} else if c.Type == CONDITION_HAS {
		return fmt.Sprintf("%s has %s", c.ActorName, c.ChildName)
	} else if c.Type == CONDITION_ALL {
		scs := []string{}
		for _, sc := range c.Subconditions {
			scs = append(scs, sc.Describe())
		}
		return fmt.Sprintf("all(%s)", strings.Join(scs,","))
	} else if c.Type == CONDITION_NOTALL {
		scs := []string{}
		for _, sc := range c.Subconditions {
			scs = append(scs, sc.Describe())
		}
		return fmt.Sprintf("notall(%s)", strings.Join(scs,","))
	} else if c.Type == CONDITION_ANY {
		scs := []string{}
		for _, sc := range c.Subconditions {
			scs = append(scs, sc.Describe())
		}
		return fmt.Sprintf("any(%s)", strings.Join(scs,","))
	} else if c.Type == CONDITION_NOTANY {
		scs := []string{}
		for _, sc := range c.Subconditions {
			scs = append(scs, sc.Describe())
		}
		return fmt.Sprintf("notany(%s)", strings.Join(scs,","))
	}
	return ""
}
