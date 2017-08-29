(ns ink.model
  (:require 'ink.fsm :as 'fsm))

(def example-object1 {
                      :descriptor "lightswitch"
                      :state {
                              :on {:description "currently on"}
                              :off {:description "currently off"}
                              }
                      :transition {
                                   :on {"flip" :off}
                                   :off {"flip" :on}
                                   }
                      :start :off
                      })

(def example-action1 {
                      :verb "flip"
                      :direct-object "lightswitch"
                      :location "kitchen"
                      })

(def example-location1 {
                        :descriptor "kitchen"
                        :objects [example-object1]
                        :state {
                                :light {:description "the light reflects off the dirty dishes in the sink."}
                                :dark {:description "it's too dark to see the mess from dinner."}
                                }
                        :transition (if #(and (= %1 "lightswitch") (= %2 :on)) :light :dark)
                        :start :dark
                        }
  )
