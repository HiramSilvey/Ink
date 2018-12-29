/*
 * items
 *  |-> state
 *       |-> transitions
 *            |-> events
 */

// Actions represent doing something [to something else]
class Action {
  constructor(verb, ...args) {
    this.verb = verb;
    this.args = args;
  }
}

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
  default: function (item) {
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
    if (start) {
      this.currentState = state;
    }
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
    for (var descriptor in this.subItems) {
      for (var subItem of this.subItems[descriptor]) {
        ans += descriptor + ": " + subItem.currentState.subtext + "\n";
      }
    }
    return ans;
  }
}

class Query {
  // Example: spec = ["and", []]
  constuctor(spec) {
    this.spec = spec;
    this.functions = {
      "and": {
        "impl": this.and,
        "args": "query"
      },
      "or": {
        "impl": this.or,
        "args": "query"
      },
      "not": {
        "impl": this.not,
        "args": "query"
      },
      "hasName": {
        "impl": this.hasName,
        "args": "data"
      },
      "hasChild": {
        "impl": this.hasChild,
        "args": "query"
      },
      "stateIs": {
        "impl": this.stateIs,
        "args": "data"
      }
    }
    this.context = null;
  }
  execute(context, globalArgs, root) {
    root = root || this.spec;
    var fn = root[0];
    if (!fn in this.functions) {
      console.log(`Invalid query function: {fn}`);
      return [];
    }
    fn = this.functions[fn];
    var args = [];
    if (fn.args == "query") {
      for (var q of root[1]) {
        args.push(this.execute(context, globalArgs, q));
      }
    } else {
      for (var arg of root[1].slice()) {
        if (arg[0] == "$") args.push(globalArgs[arg.substring(1)] || arg);
        else args.push(arg);
      }
    }
    return fn.impl(context, args);
  }
  and(context, args) {
    // args = [ query0, query1, ... ]
    // ans = intersection(query0, query1, ...)
    var elts = args[0];
    var ans = [];
    for (var e of elts) {
      for (var l of args.slice(1)) {
        if (ans.includes(e)) continue;
        if (l.includes(e)) ans.push(e);
      }
    }
    return ans;
  }
  or(context, args) {
    // args = [ query0, query1, ... ]
    // ans = union(query0, query1, ...)
    var ans = [];
    for (var l of args) {
      for (var e of l) {
        if (ans.includes(e)) continue;
        else ans.push(e);
      }
    }
    return ans;
  }
  not(context, args) {
    // args = [ query0 ]
    var ans = context.slice();
    for (var e of args[0]) {
      let idx = ans.indexOf(e)
      if (idx != -1) ans.splice(idx, 1);
    }
    return ans
  }
  hasName(context, args) {
    // args = [ name_str ]
    var ans = [];
    for (var item of context) {
      if (item.descriptor == args[0]) ans.push(item);
    }
  }
  hasChild(context, args) {
    // args = [ query0 ]
    var ans = [];
    for (var item of args[0]) {
      for (var subItem of item.subItems) {
        if (subItem.descriptor == args[0]) {
          ans.push(item);
          break;
        }
      }
    }
  }
  stateIs(context, args) {
    // args = [ name_str ]
    var ans = [];
    for (var item of context) {
      if (item.currentState.descriptor == args[0]) ans.push(item);
    }
  }
}

class Transform {
    constructor(condition, transition, adds, removes, params){
	this.condition = condition; // query
	this.transition = transition; // { of: query, what: transition_name }
	this.adds = adds; // [ {to: query, what: query}, ...]
	this.removes = removes; // [ {from: query, what: query}, ...]
	this.params = params; // [ param1, param2, ... ]
    }
    run(context, args) {
	// Narrow the context using the condition query
	if(this.condition) context = this.condition.execute(context, args);
	var transitioning = []
	var add = [];
	var remove = [];
	if(this.transition) transitioning = this.transition.of.execute(context, args);
	if(this.adds){
	    for(var a of this.adds){
		add.push({"to":a.to.execute(context, args),"what":a.what.execute(context, args)});
	    }
	}
	if(this.removes) {
	    for(var r of this.removes){
		remove.push({"from":r.from.execute(context, args),"what":r.what.execute(context, args)});
	    }
	}
	// Now:
	// - add is a list of additions to make
	// - remove is a list of removals to make
	// - transitioning is a list of things to transition
	if(this.adds){
	    for(var a of add)
		for(var owner of a.to)
		    for(var item of a.what)
			owner.addSubItem(item);
	}
	if(this.removes){
	    for(var r of remove)
		for(var owner of r.from)
		    for(var item of r.what)
			owner.removeSubItem(item);
	}
	if(this.transition){
	    for(var item of transitioning){
		applyAction(this.transition.what, item);
	    }
	}
    }
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
      for (var affectedItem of affectedItemTypes) {
        applyAction(event.action, affectedItem);
      }
    }
  }
}

function json2obj(input) {
  let model = new Item();
  for (var o of input) {
    let item = new Item(o.name);
    for (var s of o.states) {
      let state = new State(s.subtext);
      item.addState(s.name, state, s.start);
    }
    for (var t of o.transitions) {
      let source = item.states[t.start];
      let target = item.states[t.end];
      let trans = new Transition(target);
      for (var e of t.effects) {
        trans.addEvent(new Event(e, scopes.default));
      }
      source.addTransition(t.name, trans);
    }
    model.addSubItem(item);
  }
  return model;
}
