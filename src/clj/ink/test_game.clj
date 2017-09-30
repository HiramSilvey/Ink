(load-file "fsm.clj")
(require '[clojure.string :as str])
(use '[clojure.string :only (join)])

(defn std_inventory_state [] (fn [items] {:description (join "  " (reduce #(conj %1 (%2 :descriptor)) [] items))}))
(defn std_inventory_transition [] (fn [items] (fn [input] (cond (= (input :verb) "add") (conj items (input :item)) (= (input :verb) "rem") (remove #{input :item} items) :else items))))

(def player {
             :descriptor "player"
             :identity {
                        :state {
                                :default {:description "I'm wearing a dirty shirt with a faint number on the chest... 261?"}
                                }
                        :transition {
                                     :default {:getsick :sick}
                                     :sick {:getcured :default}
                                     }
                        :start :default
                        }
             :inventory {
                         :state std_inventory_state
                         :transition std_inventory_transition
                         :start []
                         }
             }
  )

(def obj1 {
           :descriptor "scalpel"
           :identity {
                      :state {
                              :default {:description "Looks rusty. Is that blood on the blade?"}
                              }
                      :transition {
                                   :default {}
                                   }
                      :start :default
                      }
           })
(def obj2 {
           :descriptor "goo"
           :identity {
                      :state {
                              :default {:description "A sticky substance with a light green hue..."}
                              :eaten {:events [:getsick]}
                              }
                      :transition {
                                   :default {:eat :eaten}
                                   }
                      :start :default
                      }
           })

(def obj3 {
           :descriptor "lightswitch"
           :identity {
                      :state {
                              :on {:description "In the 'on' position." :events [:light_on]}
                              :off {:description "In the 'off' position." :events [:light_off]}
                              }
                      :transition {
                                   :on {:flip :off}
                                   :off {:flip :on}
                                   }
                      :start :off
                      }
           })

(def room {
           :descriptor "room"
           :identity {
                      :state {
                              :default {:description "A dimly lit room with a weird smell... it looks like there's a lightswitch on the wall."}
                              :visible {:description "A dank room made of concrete from floor to ceiling. You see goo, a scalpel, and a lightswitch."}
                              }
                      :transition {
                                   :default {:light_on :visible}
                                   :visible {:light_off :default}
                                   }
                      }
           :inventory {
                       :state std_inventory_state
                       :transition std_inventory_transition
                       :start [player obj1 obj2 obj3]
                       }
           }
  )

(defn main [] (
               let [user_input (read-line)] (
                                             (str/split user_input #" ")
                                             )
               ))
