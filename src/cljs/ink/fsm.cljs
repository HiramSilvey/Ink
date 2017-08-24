(defn new-state [desc]
  (return (hash-map "description" desc "transitions" (set ()))))

;; add-transition, return new state with transition added
;; del-transition, return new state without specified transition

;; questions: will hooking be part of the model outside of the state machine? seems so
;;            how will composition work for attributes like a health bar?
;;            how to minimize number of possible states?
