sdl_parser = require('./sdl.js');

class DictionaryEntry {
  constructor(synonyms, actionQuery) {
    this.synonyms = synonyms;
    this.actionQuery = actionQuery;
  }
}

class Query {
  constructor(spec) {
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
      "hasParent": {
        "impl": this.hasParent,
        "args": "query"
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
    console.log('EQ', context.length, globalArgs, 'r', root);
    var fn = root[0];
    if (!(fn in this.functions)) throw `Invalid query function: {fn}`;
    fn = this.functions[fn];
    var args = [];
    if (fn.args == "query")
      for (var q of root.slice(1)) args.push(this.execute(context, globalArgs, q));
    else
      for (var arg of root.slice(1)) args.push(arg[0] == "$" && globalArgs[arg] ? globalArgs[arg] : arg);
    //for(var a of args) console.log('Q', a.toString(), globalArgs)
    //console.log(args);
    var ans = fn.impl(context, args);
    for (var a of ans) console.log('ANS', a && a.toString());
    //console.log('AQ',ans)
    return ans;
  }
  and(context, args) {
    // args = [ query0, query1, ... ]
    // ans = intersection(query0, query1, ...)
    var elts = args[0];
    var ans = [];
    for (var e of elts) {
      for (var l of args.slice(1)) {
        if (ans.indexOf(e) >= 0) continue;
        if (l.indexOf(e) >= 0) ans.push(e);
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
    return ans;
  }
  hasChild(context, args) {
    // args = [ query0 ]
    var ans = [];

    for (var item of args[0]) {
      console.log('parent', item.parent && item.parent.toString());
      if (ans.indexOf(item.parent) < 0) ans.push(item.parent);
    }
    return ans;
  }
  hasParent(context, args) {
    // args = [ query0 ]
    var ans = [];
    for (var item of context) {
      console.log('par', item.parent && item.parent.toString())
      for (var i of args[0]) {
        if (ans.indexOf(item) < 0 && item.parent == i) {
          ans.push(item);
        }
      }
    }
    return ans;
  }
  stateIs(context, args) {
    // args = [ name_str ]
    var ans = [];
    for (var item of context) {
      if (item.currentState.descriptor == args[0]) ans.push(item);
    }
    return ans;
  }
}
var q = new Query([]);

// An ActionQuery is associated with a verb, and is "realised" in the current context to create actual Actions
class ActionQuery {
  constructor(verb, subjectQuery, objectQuery) {
    subjectQuery = subjectQuery || ["hasName", "$subject"];
    objectQuery = objectQuery || ["hasName", "$object"];
    this.subjectQuery = new Query(subjectQuery);
    this.objectQuery = new Query(objectQuery);
    this.verb = verb;
  }
  execute(context, actor, ob) {
    let args = {
      "$subject": actor,
      "$object": ob
    };
    console.log(context, args);
    let action_subject = this.subjectQuery.execute(context, args);
    let action_object = this.objectQuery.execute(context, args);
    console.log('sub', action_subject);
    console.log('ob', action_object);
    if (action_subject.length == 0) throw "No valid subject";
    if (action_subject.length > 1) throw "Ambiguous subject";
    if (action_object.length == 0) throw "No valid object";
    if (action_object.length > 1) throw "Ambiguous object";
    console.log(`SUB=${action_subject[0].toString()}, VRB=${this.verb}, OBJ=${action_object[0].toString()}`);
    action_object[0].doAction(this.verb);
  }
}

class Transfer {
  // Move the item to the inventory of the destination.
  constructor(item, destination) {
    this.item = item;
    // Execution must interpret a null destination as a move to the root level,
    // effectively removing the item from play.
    this.destination = destination || null;
  }

  do() {
    // This is to prevent circular ownership if the item is currently the
    // destination's parent.
    if (this.item.inventory.has(this.destination)) {
      this.item.inventory.delete(this.destination);
      // The destination will move up a level and its previous grandparent
      // will become its new parent.
      this.destination.parent = this.item.parent;
    }
    if (this.item.parent !== null) {
      this.item.parent.inventory.delete(item);
    }
    if (this.destination !== null) {
      this.destination.inventory.add(item);
    }
    this.item.parent = this.destination;
  }

  toString(indentation) {
    let indent = ``;
    for (let i = 0; i < indentation; i++) {
      indent += `\t`;
    }
    let str = indent + `item: ${this.item}`;
    str += indent + `destination: ${this.destination}`;
    return str;
  }
}

class Action {
  constructor(next_state, transfers, action_queries) {
    // Execution must interpret a null next_state as not changing the state's
    // current_state.
    this.next_state = next_state || null;
    this.transfers = transfers || [];
    this.action_queries = action_queries || [];
  }

  do(object) {
    if (this.next_state !== null) {
      object.current_state = this.next_state;
    }
    for (let transfer of this.transfers) {
      transfer.do();
    }
    // TODO(daniel): action_queries
  }

  toString(indentation) {
    let indent = ``;
    for (let i = 0; i < indentation; i++) {
      indent += `\t`;
    }
    let str = indent + `next_state: ${this.next_state}`;
    str += `\n` + indent + `tranfers:\n`;
    for (let transfer of this.transfers) {
      str += transfer.toString(indentation + 1);
    }
    str += `\n` + indent + `action_queries:\n`;
    for (let action_query of this.action_queries) {
      // TODO(daniel) action_query toString that follows this pattern
      str += action_query.toString(indentation + 1);
    }
    return str;
  }
}

// States represent the current status of an item.
class State {
  constructor(name, description, actions) {
    this.name = name; // Used for debugging.
    this.description = description; // The answer to "look".
    this.actions = actions || {};
  }

  do(object, action_name) {
    if (this.actions.hasOwnProperty(action_name)) {
      this.actions[action_name].do(object);
    } else {
      throw "Action ${action_name} not found in object:\n" + JSON.stringify(this.actions, null, " ");
    }
  }

  toString(indentation) {
    let indent = ``;
    for (let i = 0; i < indentation; i++) {
      indent += `\t`;
    }
    let str = indent + `${this.name}:`;
    str += `\n` + indent + `\tdescription: ${this.description}`;
    str += `\n` + indent + `\tactions:`;
    for (let [action_name, action] of this.actions) {
      str += `\n` + indent + `\t\t${action_name}:\n` + action.toString(indentation + 3);
    }
    return str;
  }
}

class Item {
  constructor(name, states, current_state, inventory, parent) {
    this.name = name;
    this.states = states;
    this.current_state = current_state;
    this.inventory = inventory || [];
    this.parent = parent || null;
  }

  toString() {
    let str = `${this.name}:`;
    str += `\n\tcurrent state: ${this.current_state}`;
    str += `\n\tparent: ${this.parent}`;
    str += `\n\tstates\n:`;
    for (let state of this.states) {
      str += state.toString(2);
    }
    str += `\n\tinventory:\n`;
    for (let item of this.inventory) {
      str += `\n\t\t` + item.name;
    }
    return str;
  }
}

var dictionary = {
  "go": new DictionaryEntry(
    ["move"],
    new ActionQuery("go",
      null, // the subject is just the unqualified subject
      ["and", ["hasName", "$object"],
        ["hasParent", ["hasChild", ["hasName", "$subject"]]]
      ])), // Only go things that are in same room
  "eat": new DictionaryEntry(
    ["devour", "gobble"],
    new ActionQuery("eat",
      null, // the subject is just the unqualified subject
      ["and", ["hasName", "$object"],
        ["hasParent", ["hasName", "$subject"]]
      ])), // Only eat things that you have
  "take": new DictionaryEntry(
    ["take", "grab"],
    new ActionQuery("go",
      ["and", ["hasName", "$object"],
        ["hasParent", ["hasChild", ["hasName", "$subject"]]]
      ], // Only take things in the same room
      ["hasName", "$subject"])), // "take" is "go" with subject and object reversed
  "scream": new DictionaryEntry(
    ["yell", "shout"],
    new ActionQuery("scream",
      null,
      ["hasParent", ["hasChild", ["hasName", "$subject"]]])), // scream affects only things in same room
  "look": new DictionaryEntry(
    ["observe", "behold"],
    new ActionQuery("look"))
}

var universe = {};

function getActionQuery(verb) {
  for (var word in dictionary) {
    if (word != verb && dictionary[word].synonyms.indexOf(verb) < 0) continue;
    return dictionary[word].actionQuery;
  }
}

function exec(s, v, o) {
  var actions = [
    [s, v, o]
  ];

  while (actions.length > 0) {
    var next_actions = [];
    for (var a of actions) {
      let subject = a[0];
      let verb = a[1];
      let object = a[2];
      console.log('EXEC SVO', subject, verb, object);
      // Parse
      // (We're pretending already parsed into SVO)

      // Template
      let aq = getActionQuery(verb);
      for (var u of universe) console.log(u.toString());

      // Resolve objects
      let effects = aq.execute(universe, subject, object);

      for (var e of effects) {
        if (e.type == 'action') { // Queue follow-on actions for the next round
          let args = {
            "$subject": action.subject
          };
          next_actions.push([action.subject, e.verb, e.obj]); // This is wrong--Are we running loop on svo strings or resolved values
        } else if (e.type == 'move') { // Execute any moves immediately
          let args = {
            "$subject": action.subject
          };
          let src = e.src.execute(universe, args);
          let dst = e.dst.execute(universe, args);
          let obj = e.obj.execute(universe, args);
          if (!src.hasSubItem(obj)) throw obj.toString() + " is not in " + src.toString();
          src.removeSubItem(obj);
          dst.addSubItem(obj);
        } else if (e.type == 'destroy') { // Execute any destroys immediately
          let args = {
            "$subject": action.subject
          };
          let obj = e.obj.execute(universe, args);
          obj.parent.removeSubItem(obj);
        } else if (e.type == 'create') { // Execute any creates immediately
          let args = {
            "$subject": action.subject
          };
          let obj = e.obj.execute(universe, args);
          obj.parent.addSubItem(obj);
        }
      }
    }
    actions = next_actions;
  }
}

function json2obj(input) {
  let model = [];
  var all_items = {}
  for (var o of input) {
    var states = {};
    var start = null;
    for (var s of o.states) {
      states[s.name] = new State(s.subtext, []);
      if (s.start) start = s.name;
    }

    let item = new Item(o.name, states, start, o.parent || null, o.children);
    all_items[o.name] = item;

    for (var t of o.transitions) {
      let source = item.states[t.start];
      let target = item.states[t.end];
      let trans = new Transition(target);
      for (var e of t.effects) {
        trans.effects.push(e);
      }
      source.transitions[t.name] = trans;
    }
    model.push(item);
  }
  for (var i of model) {
    let new_children = [];
    for (var c of i.children) {
      for (var j of model) {
        if (j.descriptor == c) {
          new_children.push(j);
        }
      }
    }
    i.children = new_children;
  }
  for (var i of model) {
    for (var c of i.children) {
      c.parent = i;
    }
  }
  return model;
}

function setUniverse(spec) {
  let jm = sdl_parser.parse(spec);
  console.log(JSON.stringify(jm, null, " "));
  universe = json2obj(jm);
  //console.log(universe);
}

module.exports = {
  setUniverse: setUniverse,
  exec: exec
}
