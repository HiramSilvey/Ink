;; example one-line creation:
(def example (set-start (add-states (add-transitions (add-transitions (get-fsm) :A [0 1] [:A :B]) :B [0 1] [:B :A]) [:A :B] [(str "the A state") (str "the B state")]) :A))

;; return an empty state machine
(defn get-fsm [] {:state {} :transition {} :start nil})

;; add n states with n corresponding descriptions to the specified state machine
;;  fsm - the state machine
;;  state_lbls - the state identifiers (list)
;;  descriptions - the corresponding descriptions to the given state identifiers (list)
(defn add-states [fsm state_lbls descriptions] {
                                                :state (zipmap state_lbls (reduce (fn [agg desc] (merge agg {:description desc})) [] descriptions))
                                                :transition (fsm :transition)
                                                :start (fsm :start)
                                                }
  )

;; add n transitions with n corresponding inputs and destinations to the specified state in the specified state machine
;;  fsm - the state machine
;;  state_lbl - the state identifier
;;  inputs - the inputs of each transition (list)
;;  dests - the destination state identifiers given each corresponding input (list)
(defn add-transitions [fsm state_lbl inputs dests] {
                                                    :state (fsm :state)
                                                    :transition (merge (fsm :transition) {state_lbl (zipmap inputs dests)})
                                                    :start (fsm :start)
                                                    }
  )

;; add a state to a state machine
;; return the new state machine
;;  fsm - the state machine
;;  state_lbl - the state label (identifier)
;;  description - the state description
(defn add-state [fsm state_lbl description] {
                                         :state (merge (fsm :state) {state_lbl {:description description}})
                                         :transition (fsm :transition)
                                         :start (fsm :start)
                                         }
  )

;; add a transition to a state machine
;; return the new state machine
;;  fsm - the state machine
;;  state_lbl - the state label (identifier) the transition pertains to
;;  input - the input to the state specified by state_lbl
;;  dest - the resulting state (identifier) after the transition
(defn add-transition [fsm state_lbl input dest] {
                                             :state (fsm :state)
                                             :transition (merge (fsm :transition) {state_lbl (merge ((fsm :transition) state_lbl) {input dest})})
                                             :start (fsm :start)
                                             }
  )

;; set the start state (identifier) of the state machine
;; return the new state machine
;;  fsm - the state machine
;;  state_lbl - the state label (identifier) to be set as the start state
(defn set-start [fsm state_lbl] {
                                 :state (fsm :state)
                                 :transition (fsm :transition)
                                 :start state_lbl
                                 }
  )

;; delete a state from a state machine
;; return the new state machine
;;  fsm - the state machine
;;  state_lbl - the state label (identifier) to be removed from the state map
(defn del-state [fsm state_lbl] {
                                 :state (dissoc (fsm :state) state_lbl)
                                 :transition (fsm :transition)
                                 :start state_lbl
                                 }
  )

;; delete a transition from a state machine
;; return the new state machine
;;  fsm - the state machine
;;  state_lbl - the state label (identifier) to be removed from the transition map
(defn del-transition [fsm state_lbl] {
                                      :state (fsm :state)
                                      :transition (dissoc (fsm :transition) state_lbl)
                                      :start state_lbl
                                      }
  )
