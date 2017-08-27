;; return an empty state machine
(defn get-fsm [] {:state {} :transition {} :start nil})

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
                                 :transition (fsm :tronsition)
                                 :start state_lbl
                                 }
  )

;; TODO
;; del-state
;; del-transition
