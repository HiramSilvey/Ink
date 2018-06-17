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
function Scope() {
  // default: all neighboring items (same parent item)
  this.default = function(item) {
    return item.parentItem.subItems;
  };
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
