(def example-dfa { :states {
                             :A {
                                 :description "last character was a 0"
                                 :transitions {0 :A 1 :B}}
                             :B {
                                 :description "last char was a 1"
                                 :transitions {0 :A 1 :B}}
                            }
                  :start :A
                  })

(defn dfa-step [dfa state input] ((((dfa :states) state) :transitions) input))

(defn dfa-run [dfa inputs] (reduce (partial dfa-step dfa) (dfa :start) inputs))

(dfa-run example-dfa (list 0 1 0 0 1 0))

(def another-dfa { :states {
                             :A {
                                 :description "no 0 yet"
                                 :transitions {0 :B 1 :A}}
                             :B {
                                 :description "there is a 0"
                                 :transitions {0 :B 1 :B}}
                            }
                  :start :A
                  })

(defn all-pairs [l1 l2] (for [x l1 y l2] [x y]))

(defn dfa-product [dfa1 dfa2] {
                               :states (apply hash-map
                                              (apply concat
                                                     (let [s1 (dfa1 :states) s2 (dfa2 :states)]
                                                       (for [x (keys s1) y (keys s2)]
                                                         (list [x y] {
                                                                      :description [((s1 x) :description) ((s2 y) :description)]
                                                                      :transitions (apply hash-map
                                                                                          (apply concat
                                                                                                 (map #(list %1 [(((s1 x) :transitions) %1) (((s2 y) :transitions) %1)]) (keys ((s1 x) :transitions)))))})))))
                                                               

                               ;; :states (apply concat
                               ;;                (let [s1 (dfa1 :states) s2 (dfa2 :states)]
                               ;;                  (apply concat (map (fn [x] (map (fn [y] (list [x y] [(s1 x) (s2 y)])) l2)) l1))))
                               :start [(dfa1 :start) (dfa2 :start)]})
                                    
(def pdfa (dfa-product example-dfa another-dfa))

(dfa-run pdfa (list 0 1 0 0 1 0))

