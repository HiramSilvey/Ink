(ns ink.model
  (:require 'ink.fsm :as 'fsm))

;; UPDATE: hooks should exist on the level that they will take effect. For example, if a circuit breaker is pulled in room A, and the whole house must go dark, then the model (which owns all the rooms) or some sub-model with just the house in it should own the hook. The hook takes 3 things minimally: the action (which consists of a verb and direct object), and the returned state of that object once the action has taken place. Actions with no direct objects (like "scream") have a direct object of self. Hooks activate when certain actions + state returned combinations are met. Actions are applied to the top level (model) and then passed down accordingly until the proper object is met. For example, "flip switch" will be applied to model -> kitchen -> lightswitch, and then the state returned by lightswitch will propogate up back to kitchen, then model. Any hooks in either of those can be set off if the dependencies are met.

;; IDEA: for temporary actions (like "look behind couch"), the action should be applied to the location, not the couch. Temporary actions should not actually change the state, the transition should return the same state in the end. QUESTION: What outputs the text displayed to a user after an action? I think the state machine that the action is applied to should be the thing that actually outputs the text. In which case, the transition function should do a couple things:
;;  1. output the result of the transition (output is not a return! unless we want it to return the output and have the caller of the transition output)
;;  2. return the new state (what saves all the current states? the model, so it seems like it HAS to be returned or else it's impossible to know the current states)

(def example-object1 {
                      :descriptor "lightswitch"
                      :state {
                              :on {:description "currently on"}
                              :off {:description "currently off"}
                              }
                      :transition {
                                   :on {"flip" :off} ;;macro with print?? return off
                                   :off {"flip" :on}
                                   }
                      :start :off
                      })

(def example-action1 {
                      :verb "flip"
                      :direct-object example-object1
                      })

(def example-location1 {
                        :descriptor "kitchen"
                        :objects [example-object1]
                        :state {
                                :light {:description "the light reflects off the dirty dishes in the sink."}
                                :dark {:description "it's too dark to see the mess from dinner."}
                                }
                        :start :dark
                        }
  )

(def example-model {
                    :locations [example-location1]
                    :hooks []
                    })

(defn act [action]
  (fsm/sm-run (action :direct-object) (action :verb))
  )
