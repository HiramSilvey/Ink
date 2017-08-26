;; A state machine is a map with three keys:
;;
;; :state is a function from "state IDs" (whatever those are--keywords, numbers, whatever) to state values (currently maps with just a description)
;;
;; Thus ((my-sm :state) :state1) will return the state object for state1
;;
;; :transition is a function that takes a state ID and outputs a function that turns input values into state IDs.
;;
;; For example, (((my-sm :transition) :state1) 1) will return the ID
;; of the state that we should be in when we receive a "1" input in
;; the state1 state.
;;
;; :start is the ID of the starting state

(def example-dfa {
                  :state {
                           :A {:description "last character was a 0"}
                           :B {:description "last char was a 1"}}
                  :transition {
                               :A { 0 :A 1 :B }
                               :B { 0 :A 1 :B }}
                  :start :A
                  })


(def another-dfa {
                  :state {
                           :A {:description "no 0 yet"}
                          :B {:description "found a 0"}}
                  :transition {
                               :A { 0 :B 1 :A }
                               :B { 0 :B 1 :B }}
                  :start :A
                  })

(def counter-sm {
                 :state (fn [state] {:description (cond (> state 0) (str "Health " state) :else "Dead")})
                 :transition (fn [state] (fn [input] (cond (<= state 1) 0 (= input 1) (+ state 1) :else (- state 1))))
                 :start 5
                 })

(defn sm-step [dfa state input] (((dfa :transition) state) input))

(defn sm-run [dfa inputs] (reduce (partial sm-step dfa) (dfa :start) inputs))

;; Takes a list of functions [f1 f2 f3 ...] and returns a function
;; which takes input
;;
;; [x1 x2 x3 ...]
;;
;; and outputs
;;
;; [(f1 x1) (f2 x2) (f3 x3) ...]

(defn fn-product [fs] (fn [input] (vec (map-indexed #(%2 (input %1)) fs))))

;; Say we have state machines sm1 sm2 ... with example states s1 s2
;; ... and with transitions t1 t2 ...
;;
;; The product state machine will be sm, and the product transition t
;;
;; A state s for sm will be [s1 s2 ...].
;;
;; For sm, the resulting state when we transition from state s via a
;; given input x will be:
;;
;; [((t1 s1) x) ((t2 s2) x) ...]
;;
;; Note that [(t1 s1) (t2 s2) ...] is exactly
;;
;; (fn-product (t1 t2 ...)) s
;;
;; Thus the actual new state is computed by:
;;
;; ((apply juxt (fn-product (t1 t2 ...)) s) x)

(defn merge-states [states] (fn-product states))

(defn merge-transitions [ts] #(apply juxt ((fn-product ts) %)))

;; The :start value of the product will simply be a vector consisting
;; of the start values of all the input state machines.

(defn sm-product [sms] {
                        :state (merge-states (map #(% :state) sms))
                        :transition (merge-transitions (map #(% :transition) sms))
                        :start (vec (map #(% :start) sms))
  })

(def pdfa (sm-product (list example-dfa another-dfa)))

(def psm (sm-product (list example-dfa another-dfa counter-sm)))

(sm-run psm (list 0 1 0 0 1 0 1))

