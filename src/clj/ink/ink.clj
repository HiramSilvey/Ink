(require '[clojure.string :as str])

(use 'clojure.pprint)

(defn sm-step [dfa] (fn [state] (fn [input] (try (or (((dfa :transition) state) input) state) (catch Exception e state)))))

(defn get-cmd []
  (apply hash-map
         (interleave '(:verb :object) (str/split (str/trim (read-line)) #" +" 2))))

(defn parse-event [model]
  (let [cmd   (get-cmd)
        verb  (cmd :verb)]
    [cmd (for [evt (model :events)
               :when (= (evt :descriptor) (cmd :verb))]
           evt)]))


(defn get-event [model cmd event-obj]
  (let [in-scope   ((event-obj :scope) model)
        targets    (if (contains? cmd :object)
                     (for [obj in-scope 
                           :when (= (obj :descriptor) (cmd :object))]
                       obj)
                     in-scope)]
    {:action (event-obj :transition) :targets targets}))


(defn apply-event [model action target]
  (try
    (let [current-state    ((target :state-machine) :current)
          results          ((((target :state-machine) :transitions) current-state) action)
          new-state        (results :target)
          new-event-objs   (results :events)]
      [(update target :state-machine assoc :current new-state) new-event-objs])
    (catch Exception e [target])))


(defn update-objects [model new-objs] (assoc model :objects
                                             (loop [acc (model :objects) to-add new-objs]
                                               (if (= (count to-add) 0)
                                                 acc
                                                 (let [x (first to-add)] ; x is each object in to-add
                                                   (if (some #(= (x :descriptor) (% :descriptor)) acc) ; if the object is present
                                                     (recur (vec (map #(if (= (x :descriptor) (% :descriptor)) x %) acc)) (rest to-add)) ; update it in the array
                                                     (recur (conj acc x) (rest to-add)))))))) ; else add it to the array


(defn apply-events [model cmd event-objs]
  (let [event-obj                   (first event-objs)
        event                       (get-event model cmd event-obj)
        action                      (event :action)
        targets                     (event :targets)
        results                     (map (partial apply-event model action) targets)
        [new-objs new-event-objs]   (apply mapv vector results)
        total-event-objs            (concat (drop 1 event-objs) (reduce conj new-event-objs))
        new-model                   (update-objects model new-objs)]
    (if (empty? total-event-objs)
      new-model
      (recur new-model {} total-event-objs))))


(defn update-model [model]
  (let [[cmd event-objs]   (parse-event model)]
    (apply-events model cmd event-objs)))


(defn scope-all [model] (model :objects))


(def evt1 {:descriptor "eat"
           :transition :eat
           :scope scope-all})


(def evt2 {:descriptor "full"
           :transition :full
           :scope scope-all})


(def evt3 {:transition :regrets-button
           :scope scope-all})


(defmacro mhm [a] `(apply hash-map (flatten ~a)))


(defmacro findfirst [f l] `(first (filter ~f ~l)))


(defmacro defo [n inventory & args]
  (let [start              (keyword ((findfirst #(= (name (first %)) "s*") args) 1))
        state-args         (filter #(contains? #{"s" "s*"} (name (first %))) args)
        states             (mhm (map #(list (keyword (% 1)) (% 2)) state-args))
        transition-args    (filter (fn [a] (= (name (first a)) "t")) args)
        transitions        (mhm (for [s (keys states)]
                                  (list s (mhm (map #(list (keyword (% 1)) {:target (keyword (% 4)) :events (vec (map keyword (% 5)))})
                                                    (filter #(= (name s) (name (% 2))) transition-args))))))]
    `(def ~n {
              :descriptor ~(str (name n))
              :inventory ~inventory
              :state-machine
              {
               :state ~states
               :transition ~transitions
               :current ~start
               }})))


(defo hotdog []
  [s*  ready     "dis knot paystaree"]
  [s   halfeaten "regrets"]
  [t   eat ready > halfeaten [full]])


(defo player-obj [hotdog]
  [s*  awake   "u ar pastrie shef"]
  [s   asleep  "zzz"]
  [t   full    awake > asleep []]
  [t   alarm   asleep > awake []])


(def das-model
  {
   :player player-obj
   :objects [hotdog player-obj]
   :events [evt1 evt2]
   })


(defn run [model]
  (let [updated-model (update-model model)]
    (do
      (pprint updated-model)
      (recur updated-model))))


(run das-model)
