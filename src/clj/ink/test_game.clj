(load-file "fsm.clj")
(use '[clojure.string :only (join)])

(defn std_inventory [] {
                        :state (fn [items] {:description (join "  " (reduce #(conj %1 (%2 :descriptor)) [] items))})
                        :transition (fn [items] (fn [input] (cond (= (input :verb) "add") (conj items (input :item)) (= (input :verb) "rem") (remove #{input :item} items) :else items)))
                        :start [] 
                        })

(def player {
           :descriptor "261"
           :identity {
                      :state {
                              :default {:description "I'm wearing a dirty shirt with a faint number on the chest... 261?"}
                              :sick {:description "I don't feel so well..."}
                              }
                      :transition {
                                   :default {:getsick :sick}
                                   :sick {:getcured :default}
                                   }
                      :start :default
                      }
           :inventory std_inventory
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
                              }
                      :transition {
                                   :default {}
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
                              :bright {:description "A dank room made of concrete from floor to ceiling." :events [:items_visible]}
                              :dark {:description "A dimly lit room with a weird smell... it looks like there's a lightswitch on the wall."}
                              }
                      :transition {
                                   :bright {:light_off :dark}
                                   :dark {:light_on :bright}
                                   }
                      }
           :inventory {
                       
                       }
           }
  )
