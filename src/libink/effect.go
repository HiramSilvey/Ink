package libink

import "fmt"

type EffectType int
const (
	EFFECT_CHANGE EffectType = iota + 1
	EFFECT_DO
	EFFECT_ADD
	EFFECT_GET
	EFFECT_DROP
	EFFECT_DESCRIBE
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
