(defn new-state [desc]
  (return (hash-map "description" desc "transitions" (set ()))))
