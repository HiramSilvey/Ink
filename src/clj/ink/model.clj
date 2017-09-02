(ns ink.model
  (:require 'ink.fsm :as 'fsm))

;; UPDATE: hooks should exist on the level that they will take effect. For example, if a circuit breaker is pulled in room A, and the whole house must go dark, then the model (which owns all the rooms) or some sub-model with just the house in it should own the hook. The hook takes 3 things minimally: the action (which consists of a verb and direct object), and the returned state of that object once the action has taken place. Actions with no direct objects (like "scream") have a direct object of self. Hooks activate when certain actions + state returned combinations are met. Actions are applied to the top level (model) and then passed down accordingly until the proper object is met. For example, "flip switch" will be applied to model -> kitchen -> lightswitch, and then the state returned by lightswitch will propogate up back to kitchen, then model. Any hooks in either of those can be set off if the dependencies are met.

;; IDEA: for temporary actions (like "look behind couch"), the action should be applied to the location, not the couch. Temporary actions should not actually change the state, the transition should return the same state in the end. QUESTION: What outputs the text displayed to a user after an action? I think the state machine that the action is applied to should be the thing that actually outputs the text. In which case, the transition function should do a couple things:
;;  1. output the result of the transition (output is not a return! unless we want it to return the output and have the caller of the transition output)
;;  2. return the new state (what saves all the current states? the model, so it seems like it HAS to be returned or else it's impossible to know the current states)

(def example-object1 {
                      :descriptor "lightswitch"
                      :state {
                              :on {:description "currently on" :events (:enlightened)}
                              :off {:description "currently off" :events (:benighted)}
                              :broken {:description "broken" :events (:gebroken)}
                              }
                      :transition {
                                   :on {:flip :off :break :broken} ;;macro with print?? return off
                                   :off {:flip :on :break :broken}
                                   }
                      :start :off
                      })


;; Pseudocode

;; A scope is a function that takes in the model and outputs a list of objects.  Some example scopes are:

(defn current-room [model] (query-model model "SELECT room FROM model.rooms WHERE player in room")) ; This is a fake language fo querying the model.  We could have a sophisticated macro language for this
(defn one-neighbourhood [model] (query-model model "SELECT room as my-room FROM model.rooms WHERE player in room UNION ALL SELECT room FROM model.rooms WHERE my-room in room.connections"))

;; Perform an action: Returns (or rather, should return) the model after the action is applied

(defn do-action [action actor model]
  (let [targets (((events event) :scope) model) ; The list of objects to apply the event to (targets) is derived from the event's scope and the current state
        event (make-event action model)]    ; The event is derived from the action
    (map (partial apply-event event model) targets))) ; Apply the event TODO: should actually return the model suitably updated, rather than just the objects

;; Trigger an event: Returns the object after the event is applied

(defn apply-event [event model obj]
  (sm-step obj (obj :current-state) event)
  
    
(def events {:flip {:scope current-room}
             :scream {:scope one-neighbourhood}})

;; End of pseudocode
  

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
