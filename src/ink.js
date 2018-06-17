/*
 * items
 *  |-> state
 *       |-> transitions
 *            |-> events
 */

// States represent the current status of an item
function State(subtext) {
  this.subtext = subtext;
  this.transitions = {};

  this.addTransition = function(action, transition) {
    this.transitions[action] = transition;
  };
}

// Transitions represent a change in state of an item
// Events are applied when a transition occurs
function Transition(nextState) {
  this.nextState = nextState;
  this.events = [];

  this.addEvent = function(event) {
    this.events.push(event);
  };
}

// Scopes are functions that dynamically determine which items are affected by an event action
let scopes = {
  // default: all neighboring items (same parent item)
  default: function(item) {
    return item.parentItem.subItems;
  }
}

// Events apply actions to items defined by the scope
function Event(action, scope) {
  this.action = action;
  this.scope = scope;
}

// Items are every contained piece of information
// Example items: protagonist, sword, box, lightswitch, room, house
function Item() {
  this.states = {};
  this.currentState = null;
  this.parentItem = null;
  this.subItems = {};

  this.addState = function(descriptor, state, start=false) {
    this.states[descriptor] = state;
    if (start) { this.currentState = state; }
  };

  this.addSubItem = function(descriptor, item) {
    item.parentItem = this;
    if (this.subitems.hasOwnProperty(descriptor)) {
      this.subitems[descriptor].push(item);
    } else {
      this.subitems[descriptor] = [item];
    }
  };
}

// Applies an action to an item, triggering events recursively
// Item states are updated before recursing, simulating the order dictated by time
function applyAction(action, item) {
  let transition = item.currentState.transitions[action];
  item.currentState = transition.nextState;
  for (var event of transition.events) {
    let effectedItems = event.scope(item);
    for (var effectedItemTypes of Object.values(effectedItems)) {
      for (var effectedItem of effectedItemTypes) {
        applyAction(event.action, effectedItem);
      }
    }
  }
}

// example instantiation
let model = new Item(); // the all-encompassing world

let protagonist = new Item();
let awake = new State("Basically the best.");
let asleep = new State("Zzz...");
let filled = new Transition(asleep);
awake.addTransition("filled", filled); // filled action -> asleep state
protagonist.addState("awake", awake, true); // start state
protagonist.addState("asleep", asleep);

let hotdog = new Item();
let whole = new State("A nice, long stick of mystery meat.");
let half = new State("Looks like a chunk has been bitten off...");
let eat = new Transition(half);
let ate = new Event("filled", scopes.default);
eat.addEvent(ate);
whole.addTransition("eat", eat); // eat action -> half state, ate event
hotdog.addState("whole", whole, true); // start state
hotdog.addState("half", half);

model.addSubItem("protagonist", protagonist);
model.addSubItem("hotdog", hotdog);
