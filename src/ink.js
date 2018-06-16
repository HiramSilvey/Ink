/*
 * items
 *  |-> state
 *       |-> transitions
 *            |-> events
 */

// States represent the current status of an item
function State(descriptor, subtext) {
  this.descriptor = descriptor;
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

// Events apply actions to items defined by the scope
function Event(action, scope) {
  this.action = action;
  this.scope = scope;
}

// Items are every contained piece of information
// Example items: protagonist, sword, box, lightswitch, room, house
function Item(descriptor, startState) {
  this.descriptor = descriptor;
  this.currentState = startState;
  this.subitems = [];

  this.addSubItem = function(item) {
    this.subitems.push(item);
  };
}
