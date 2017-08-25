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

(defn all-pairs [l1 l2] (for [x l1 y l2] [x y]))

(sm-run example-dfa (list 0 1 0 0 1 0 1))

;(defn merge-states [s1 s2] (fn [input] [(s1 (get input 0)) (s2 (get input 1))]))

(defn merge-states [states] (fn [state] (vec (map-indexed #(%2 (get state %1)) states))))

;(defn merge-transitions [t1 t2] (fn [state] (fn [input] [((t1 (get state 0)) input) ((t2 (get state 1)) input)])))

(defn merge-transitions [ts] (fn [state] (fn [input] (vec (map-indexed #((%2 (get state %1)) input) ts)))))

(defn sm-product [sms] {
                        :state (merge-states (map #(% :state) sms))
                        :transition (merge-transitions (map #(% :transition) sms))
                        :start (vec (map #(% :start) sms))
  })

(def pdfa (sm-product (list example-dfa another-dfa)))

(def psm (sm-product (list example-dfa another-dfa counter-sm)))

(sm-run psm (list 0 1 0 0 1 0 1))

