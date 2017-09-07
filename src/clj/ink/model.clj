(ns ink.model
  (:require 'ink.fsm :as 'fsm))

;; UPDATE: hooks should exist on the level that they will take effect. For example, if a circuit breaker is pulled in room A, and the whole house must go dark, then the model (which owns all the rooms) or some sub-model with just the house in it should own the hook. The hook takes 3 things minimally: the action (which consists of a verb and direct object), and the returned state of that object once the action has taken place. Actions with no direct objects (like "scream") have a direct object of self. Hooks activate when certain actions + state returned combinations are met. Actions are applied to the top level (model) and then passed down accordingly until the proper object is met. For example, "flip switch" will be applied to model -> kitchen -> lightswitch, and then the state returned by lightswitch will propogate up back to kitchen, then model. Any hooks in either of those can be set off if the dependencies are met.

;; IDEA: for temporary actions (like "look behind couch"), the action should be applied to the location, not the couch. Temporary actions should not actually change the state, the transition should return the same state in the end. QUESTION: What outputs the text displayed to a user after an action? I think the state machine that the action is applied to should be the thing that actually outputs the text. In which case, the transition function should do a couple things:
;;  1. output the result of the transition (output is not a return! unless we want it to return the output and have the caller of the transition output)
;;  2. return the new state (what saves all the current states? the model, so it seems like it HAS to be returned or else it's impossible to know the current states)

(def player1 {:descriptor "player"})

(def room1 {
            :descriptor "room1"
            :state {
                    :lit {:description "An empty room"}
                    :dark {:description "A dark room"}
                    }
            :transition {
                         :lit {:benighted :dark :gebroken :dark}
                         :dark {:enlightened :lit}
                         }
            :start :lit
            :inventory [player1]
            }

(def switch1 {
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
                      :start :on
                      })


;; Pseudocode

;; A scope is a function that takes in the model and outputs a list of objects.  Some example scopes are:

(defn current-room [model] (query-model model "SELECT room FROM model.rooms WHERE player in room")) ; This is a fake language fo querying the model.  We could have a sophisticated macro language for this
(defn one-neighbourhood [model] (query-model model "SELECT room as my-room FROM model.rooms WHERE player in room UNION ALL SELECT room FROM model.rooms WHERE my-room in room.connections"))
                                        ; Other examples might include:
                                        ; - Any room with a plant in it
                                        ; - Any room with a player in it
                                        ; - All rooms connected to the current one and with the door betweent them open


;; Perform an action: Returns (or rather, should return) the model after the action is applied and after all conequent events have been propagated

(defn do-action [action actor model]
  (let [event (make-event action actor model)]
    (apply-events [event] model)))

(defn apply-events [events model]
  (for [e events] 
    (let [targets )
          results (map (partial apply-event event model) targets)
          [new-objs lists-of-events] (apply mapv vector results)
          new-events (concat more-events)
          new-model (apply (partial assoc model) (interleave targets new-objs))]
      (if (= (count new-events) 0) new-model (recur new-events new-model)))))
  
(defn make-event [action actor model]
  {:verb (action :verb)
   :targets (if (= nil (action :object))
              (((get-event :verb) :scope) model)
              (list (action :object)))})

;; Trigger an event: Returns the object after the event is applied as well as a list of events triggered thereby

(defn apply-event [event model obj]
  (let [new-state (sm-step obj (obj :current-state) event)
        new-obj (assoc obj :current-state new-state)
        new-events (if (= (obj :current-state) new-state) [] (((obj :state) new-state) :events))]
    [new-obj new-events]))


;; All defined events
    
(def get-events {:flip {:scope current-room}
                 :scream {:scope one-neighbourhood}})

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
