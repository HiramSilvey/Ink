/*
 * items
 *  |-> state
 *       |-> transitions
 *            |-> events
 */

// States represent the current status of an item
class State {
  constructor(subtext) {
    this.subtext = subtext;
    this.transitions = {};
  }

  addTransition(action, transition) {
    this.transitions[action] = transition;
  }
}

// Transitions represent a change in state of an item
// Events are applied when a transition occurs
class Transition {
  constructor(nextState) {
    this.nextState = nextState;
    this.events = [];
  }

  addEvent(event) {
    this.events.push(event);
  }
}

// Scopes are functions that dynamically determine which items are affected by an event action
let scopes = {
  // default: all neighboring items (same parent item)
  default: function(item) {
    return item.parentItem.subItems;
  }
}

// Events apply actions to items defined by the scope
class Event {
  constructor(action, scope) {
    this.action = action;
    this.scope = scope;
  }
}

// Items are every contained piece of information
// Example items: protagonist, sword, box, lightswitch, room, house
class Item {
  constructor(descriptor) {
    this.descriptor = descriptor;
    this.states = {};
    this.currentState = null;
    this.parentItem = null;
    this.subItems = {};
  }

  addState(descriptor, state, start) {
    this.states[descriptor] = state;
    if (start) { this.currentState = state; }
  }

  addSubItem(item) {
    item.parentItem = this;
    if (this.subItems.hasOwnProperty(item.descriptor)) {
      this.subItems[item.descriptor].push(item);
    } else {
      this.subItems[item.descriptor] = [item];
    }
  }

  removeSubItem(item) {
    let subItemType = this.subItems[item.descriptor];
    let index = subItemType.indexOf(item);
    if (index != -1) {
      subItemType.splice(index, 1);
      if (!subItemType.length) delete this.subItems[item.descriptor];
    }
  }

  toString() {
    let ans = "";
    if (this.currentState) ans += "state: " + this.currentState.subtext + "\n";
    for(var descriptor in this.subItems){
      for(var subItem of this.subItems[descriptor]){
        ans += descriptor + ": " + subItem.currentState.subtext + "\n";
      }
    }
    return ans;
  }
}

// Moves item from current parent to new parent
function moveItem(item, newParentItem) {
  item.parentItem.removeSubItem(item);
  newParentItem.addSubItem(item);
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

function json2obj(input){
  let model = new Item();
  for(var o of input){
    let item = new Item(o.name);
    for(var s of o.states){
      let state = new State(s.subtext);
      item.addState(s.name, state, s.start);
    }
    for(var t of o.transitions){
      let source = item.states[t.start];
      let target = item.states[t.end];
      let trans = new Transition(target);
      for(var e of t.effects){
        trans.addEvent(new Event(e, scopes.default));
      }
      source.addTransition(t.name, trans);
    }
    model.addSubItem(item);
  }
  return model;
}
