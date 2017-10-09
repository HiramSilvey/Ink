(require '[clojure.string :as str])
(use 'clojure.pprint)

(defn get-cmd []
  (apply hash-map
         (interleave '(:verb :object) (str/split (str/trim (read-line)) #" +" 2))))

(defn parse-event [model]
  (let [cmd (get-cmd)
        verb (cmd :verb)]
    [cmd (for [evt (model :events)
               :when (= (evt :descriptor) (cmd :verb))]
           evt)]))

(defn get-event [model cmd event-obj]
  (let [in-scope ((event-obj :scope) model)
        targets (if (contains? cmd :object)
                  (for [obj in-scope 
                        :when (= (obj :descriptor) (cmd :object))]
                    obj)
                  in-scope)]
    {:action (event-obj :transition) :targets targets}))

(defn apply-event [model action target]
  (try
    (let [current-state ((target :state-machine) :current)
          results ((((target :state-machine) :transitions) current-state) action)
          new-state (results :target)
          new-event-objs (results :events)]
      [(update target :state-machine assoc :current new-state) new-event-objs])
    (catch Exception e [target])))

(defn apply-events [model cmd event-objs]
  (let [event-obj (first event-objs)
        event (get-event model cmd event-obj)
        action (event :action)
        targets (event :targets)
        results (map (partial apply-event model action) targets)
        [new-objs new-event-objs] (apply mapv vector results)
        total-event-objs (concat (drop 1 event-objs) (reduce conj new-event-objs))
        new-model (assoc model :objects 
                          #(for [old-obj %1 new-obj %2] 
                             (if (= (old-obj :descriptor) (new-obj :descriptor))
                               new-obj
                               old-obj)) new-objs)]
    (if (empty? total-event-objs)
      new-model
      (recur new-model {} total-event-objs))))

(defn update-model [model]
  (let [[cmd event-objs] (parse-event model)]
    (apply-events model cmd event-objs)))

(defn scope-all [model] (model :objects))

(def evt1 {:descriptor "eat"
           :transition :eat
           :scope scope-all})

(def evt2 {:descriptor "full"
           :transition :full
           :scope scope-all})

(def hotdog
  {
   :descriptor "hotdog"
   :inventory []
   :state-machine {
                   :states {:ready "looks bad" :halfeaten "regrets"}
                   :transitions {
                                 :ready {:eat {:target :halfeaten :events [evt2]}}
                                 }
                   :current :ready
                   }})

(def player-obj
  {
   :descriptor "player"
   :inventory [hotdog]
   :state-machine {
                   :states {:awake "You're awake!" :asleep "zzz"}
                   :transitions {
                                 :awake {:full {:target :asleep}}
                                 :asleep {:alarm {:target :awake}}}
                   :current :awake
                   }})

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
  (let [updated-model (update-model model)]
    (do
      (pprint updated-model)
      (recur updated-model))))

(run das-model)
