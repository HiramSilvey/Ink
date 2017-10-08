(require '[clojure.string :as str])
(use 'clojure.pprint)

(defn get-parsed []
  (apply hash-map
         (interleave '(:verb :object) (str/split (str/trim (read-line)) #" +" 2))))

(defn get-event [model]
  (let [action (get-parsed)
        verb (action :verb)
        event ((model :events) verb)
        in-scope ((event :scope) model)
        targets (if (contains? action :object) (in-scope (action :object)) (reduce #(conj %1 (%2 1)) [] (seq in-scope)))]
    {:event (event :transition) :targets targets}))

(defn scope-all [model] (model :objects))

(def evt1 {:transition :eat
           :scope scope-all})

(def evt2 {:transition :full
           :scope scope-all})

(def hotdog
  {
   :descriptor "dis knot paystaree"
   :inventory []
   :state-machine {
        :states {:ready "looks bad" :halfeaten "regrets"}
        :transitions {
                      :ready {:eat {:target :halfeaten :events [evt2]}}
                      }
        :current :awake
        }})

(def player-obj
  {
   :descriptor "u ar pastrie shef"
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
   :objects {"hotdog" hotdog "player" player-obj}
   :events {"eat" evt1}
   })

;; (defn run [model]
;;   (let [news ()
;;         new-model (news :model)
;;         side-effects (news :effects)]
;;     (do
;;       (print-news new-model side-effects)
;;       (recur next-model))))

(defn run [model]
    (do
      (pprint (get-event model))
      (recur das-model)))

(run das-model)
