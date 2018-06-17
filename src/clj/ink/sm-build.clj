
(defmacro defo [n inventory & args]
  (let [state-args (map rest (filter #(contains? #{"s" "s*"} (name (first %))) args))
        states (apply hash-map (flatten (map #(list (keyword (first %)) (second %)) state-args)))
        start (keyword (second (first (filter #(= (name (first %)) "s*") args))))
        transition-args (map vec (map rest (filter (fn [a] (= (name (first a)) "t")) args)))
        transitions (apply hash-map (flatten (for [s (keys states)]
                      [s
                       (apply
                        hash-map
                        (flatten
                         (map #(list (keyword (get % 0))
                                     {:target (keyword (get % 3))
                                      :events (vec (map keyword (get % 4)))})
                              (filter
                               #(= (name s) (name (get % 1)))
                               transition-args))))])))]
    `(def ~n {
             :descriptor ~(str (name n))
             :inventory ~inventory
             :state-machine
             {
              :state ~states
              :transition ~transitions
              :current ~start
              }})))


(macroexpand '(defo hotdog []
  [s* ready "looks bad"]
  [s halfeaten "regrets"]
  [t eat ready > halfeaten [full]]))

(defo hotdog []
  [s* ready "looks bad"]
  [s halfeaten "regrets"]
  [t eat ready > halfeaten [full]])

hotdog
