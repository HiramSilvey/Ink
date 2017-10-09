(require '[clojure.string :as str])
(use 'clojure.pprint)
;;(use 'ink.fsm)

(defn sm-step [dfa] (fn [state] (fn [input] (try (or (((dfa :transition) state) input) state) (catch Exception e state)))))

(defn read-parsed []
  (apply hash-map
         (interleave '(:verb :object) (str/split (str/trim (read-line)) #" +" 2))))

(defn get-targets [model event object]
  (let [in-scope ((event :scope) model)
        targets (if object (in-scope object) in-scope)]
    targets))

(defn read-event [model]
  (let [action (get-parsed)
        verb (action :verb)
        event ((model :events) verb)
        targets (get-targets model event (action :object))]
    (assoc event :targets targets)))

(defn do-transition [sm transition]
  (let [result (((sm-step sm) (sm :current)) transition)
        new-state (result :target)
        new-sm (assoc sm :current new-state)
        new-events (result :events)]
    [new-sm new-events]))
  
(defn do-event [model event obj]
  (let [sm (obj :state-machine)
        [new-sm new-events] (do-transition sm (event :transition))
        new-obj (assoc obj :state-machine new-sm)]
    [new-obj new-events]))

(defn apply-events [model events]
    (let [results (for [e events] (map (partial do-event model e) (e :targets)))
          [new-objs lists-of-events] (apply mapv vector results)
          new-events (concat lists-of-events)
          new-model (apply (partial assoc (model :objects)) (interleave new-objs))]
      (if (= (count new-events) 0) new-model (recur new-model new-events))))



;; (defn get-cmd []
;;   (apply hash-map
;;          (interleave '(:verb :object) (str/split (str/trim (read-line)) #" +" 2))))

;; (defn parse-event [model]
;;   (let [cmd (get-cmd)
;;         verb (cmd :verb)]
;;     [cmd (for [evt (model :events)
;;                :when (= (evt :descriptor) (cmd :verb))]
;;            evt)]))

;; (defn get-event [model cmd event-obj]
;;   (let [in-scope ((event-obj :scope) model)
;;         targets (if (contains? cmd :object)
;;                   (for [obj in-scope 
;;                         :when (= (obj :descriptor) (cmd :object))]
;;                     obj)
;;                   in-scope)]
;;     {:action (event-obj :transition) :targets targets}))

;; (defn apply-event [model action target]
;;   (try
;;     (let [current-state ((target :state-machine) :current)
;;           results ((((target :state-machine) :transitions) current-state) action)
;;           new-state (results :target)
;;           new-event-objs (results :events)]
;;       [(update target :state-machine assoc :current new-state) new-event-objs])
;;     (catch Exception e [target])))

;; (defn apply-events [model cmd event-objs]
;;   (let [event-obj (first event-objs)
;;         event (get-event model cmd event-obj)
;;         action (event :action)
;;         targets (event :targets)
;;         results (map (partial apply-event model action) targets)
;;         [new-objs new-event-objs] (apply mapv vector results)
;;         total-event-objs (concat (drop 1 event-objs) (reduce conj new-event-objs))
;;         new-model (assoc model :objects 
;;                           #(for [old-obj %1 new-obj %2] 
;;                              (if (= (old-obj :descriptor) (new-obj :descriptor))
;;                                new-obj
;;                                old-obj)) new-objs)]
;;     (if (empty? total-event-objs)
;;       new-model
;;       (recur new-model {} total-event-objs))))

;; (defn update-model [model]
;;   (let [[cmd event-objs] (parse-event model)]
;;     (apply-events model cmd event-objs)))

(defn scope-all [model] (model :objects))

(def evt1 {:descriptor "eat"
           :transition :eat
           :scope scope-all})

(def evt2 {:descriptor "full"
           :transition :full
           :scope scope-all})

(def evt3 {:transition :regrets-button
           :scope scope-all})



;; (defo hotdog []
;;   (s* ready "looks bad")
;;   (s halfeaten "regrets")
;;   (t eat ready halfeaten (full)))
  
;; obj hotdog
;; state* ready "looks bad"
;; state halfeaten "regrets"
;; trans eat ready > halfeaten (full)

(defmacro mhm [a] `(apply hash-map (flatten ~a)))

(defmacro findfirst [f l] `(first (filter ~f ~l)))

(defmacro defo [n inventory & args]
  (let [start (keyword ((findfirst #(= (name (first %)) "s*") args) 1))
        state-args (filter #(contains? #{"s" "s*"} (name (first %))) args)
        states (mhm (map #(list (keyword (% 1)) (% 2)) state-args))
        transition-args (filter (fn [a] (= (name (first a)) "t")) args)
        transitions (mhm (for [s (keys states)]
                           (list s (mhm (map #(list (keyword (% 1)) {:target (keyword (% 4)) :events (vec (map keyword (% 5)))})
                                             (filter #(= (name s) (name (% 2))) transition-args))))))]
    ('def n {
              :descriptor (str (name n))
              :inventory inventory
              :state-machine
              {
               :state states
               :transition transitions
               :current start
               }})))

(defo hotdog []
  [s* ready "dis knot paystaree"]
  [s halfeaten "regrets"]
  [t eat ready > halfeaten [full]])

(defo player-obj [hotdog]
  [s* awake "u ar pastrie shef"]
  [s asleep "zzz"]
  [t full awake > asleep []]
  [t alarm asleep > awake []])

[hotdog player-obj]

;; (def hotdog
;;   {
;;    :descriptor "hotdog"
;;    :inventory []
;;    :state-machine {
;;         :state {:ready "dis knot paystaree" :halfeaten "regrets"}
;;         :transition {
;;                       :ready {:eat {:target :halfeaten :events [evt2]}}
;;                       }
;;         :current :ready
;;         }})

;; (def player-obj
;;   {
;;    :descriptor "u ar pastrie shef"
;;    :inventory [hotdog]
;;    :state-machine {
;;         :state {:awake "You're awake!" :asleep "zzz"}
;;         :transition {
;;                       :awake {:full {:target :asleep}}
;;                       :asleep {:alarm {:target :awake}}}
;;         :current :awake
;;                    }})

(def das-model
  {
   :player player-obj
   :objects [hotdog player-obj]
   :events [evt1 evt2]
   })

;; (defn run [model]
;;   (let [news ()
;;         new-model (news :model)
;;         side-effects (news :effects)]
;;     (do
;;       (print-news new-model side-effects)
;;       (recur next-model))))

(defn run [model]
  (let [event (read-event model)
        new-model (do-event model event (event :targets))]
    (do
      (pprint new-model)
      (recur new-model))))
  (let [updated-model (update-model model)]
    (do
      (pprint updated-model)
      (recur updated-model))))

(run das-model)
