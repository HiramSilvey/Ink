(require '[clojure.string :as str])

(defn get-parsed []
  (apply hash-map
         (interleave '(:verb :object) (str/split (str/trim (read-line)) #" +" 2))))

(defn get-event [model] (get-parsed))

(defn scope-all [model] )

(def evt1 {:descriptor "hello"
           :scope scope-all})

