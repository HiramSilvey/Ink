(defn get-fsm [] {:state {} :transition {} :start nil})

(defn add-state [fsm state_lbl description] {
                                         :state (merge (fsm :state) {state_lbl {:description description}})
                                         :transition (fsm :transition)
                                         :start (fsm :start)
                                         }
  )

(defn add-transition [fsm state_lbl input dest] {
                                             :state (fsm :state)
                                             :transition (merge (fsm :transition) {state_lbl (merge ((fsm :transition) state_lbl) {input dest})})
                                             :start (fsm :start)
                                             }
  )
