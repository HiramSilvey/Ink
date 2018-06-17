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

  this.addState = function(descriptor, state, start) {
    this.states[descriptor] = state;
    if (start) { this.currentState = state; }
  };

  this.addSubItem = function(descriptor, item) {
    item.parentItem = this;
    if (this.subItems.hasOwnProperty(descriptor)) {
      this.subItems[descriptor].push(item);
    } else {
      this.subItems[descriptor] = [item];
    }
  };

  this.toString = function() {
    let ans = "";
    if (this.currentState) ans += "state: " + this.currentState.subtext + "\n";
    for(var descriptor in this.subItems){
      for(var subItem of this.subItems[descriptor]){
        ans += descriptor + ": " + subItem.currentState.subtext + "\n";
      }
    }
    return ans;
  };
}

// Applies an action to an item, triggering events recursively
// Item states are updated before recursing, simulating the order dictated by time
function applyAction(action, item) {
  let transition = item.currentState.transitions[action];
  if (!transition) return;
  item.currentState = transition.nextState;
  for (var event of transition.events) {
    let affectedItems = event.scope(item);
    for (var affectedItemTypes of Object.values(affectedItems)) {
      for(var affectedItem of affectedItemTypes){
				applyAction(event.action, affectedItem);
      }
    }
  }
}

// example instantiation
let model = new Item(); // the all-encompassing world

let protagonist = new Item();
let awake = new State("Basically the best.");
let asleep = new State("Zzz...");
awake.addTransition("filled", new Transition(asleep)); // filled action -> asleep state
protagonist.addState("awake", awake, true); // start state
protagonist.addState("asleep", asleep);

let hotdog = new Item();
let whole = new State("A nice, long stick of mystery meat.");
let half = new State("Looks like a chunk has been bitten off...");
let eat = new Transition(half);
eat.addEvent(new Event("filled", scopes.default));
whole.addTransition("eat", eat); // eat action -> half state, ate event (filled action)
hotdog.addState("whole", whole, true); // start state
hotdog.addState("half", half);

model.addSubItem("protagonist", protagonist);
model.addSubItem("hotdog", hotdog);

console.log("BEFORE");
console.log(model.toString());

applyAction("eat",hotdog);


console.log("AFTER");
console.log(model.toString());
