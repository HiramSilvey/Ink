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
                      })

(def example-action2 {
                      :verb "dump"
                      :direct-object "load"
                      })

(def example-aciton3 {
                      :verb "clean"
                      })

(def example-location1 {
                        :descriptor "kitchen"
                        :objects {
                                  :
                                  }
                        :state {
                                :light {:description "the light reflects off the dirty dishes in the sink."}
                                :dark {:description "it's too dark to see the mess from dinner."}
                                }
                        :transition {
                                     :light { :dark}
                                     :dark {example-aciton :light}
                                     }
                        :start :dark
                        }
  )

(def example-location2 {
                        :descriptor "bathroom"
                        :state {
                                :clean {:description "the spotless ivory gleams with pride"}
                                :dirty {:description "there's a mysterious brown streak on the wall..."}
                                }
                        :transition {
                                     :clean {example-action3 :clean example-action2 :dirty}
                                     :dirty {example-action3 :clean}
                                     }
                        :start :clean
                        })

(def example-model {
                    :location {

                               }
                    })
