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
    }
    toString(){
	let self = this;
	let strBuilder = function(root){
	    let fn = root[0];
	    let f = self.functions[fn];
	    let args = "";
	    if(f.args == "data") args = root.slice(1).join(",");
	    else if(f.args == "data") args = root.slice(1).map(r => strBuilder(r)).join(",");
	    return `${fn}(${args})`;
	}
	return strBuilder(this.spec);
    }
    execute(context, globalArgs, root) {
	root = root || this.spec;
	console.log('EQ', context.size, globalArgs, 'r', root);
	var fn = root[0];
	if (!(fn in this.functions)) throw `Invalid query function: ${fn}`;
	let f = this.functions[fn];
	var args = [];
	if (f.args == "query"){ for (var q of root.slice(1)) args.push(this.execute(context, globalArgs, q)); }
	else for (var arg of root.slice(1)) args.push(arg[0] == "$" && globalArgs[arg] ? globalArgs[arg] : arg);
	console.log('Q',globalArgs,fn)
	if (f.args == "query"){
	    for(var a of args) {
		for(var e of a){
		    console.log('query arg', e.toString())
		}
	    }
	}
	else {
	    for(var a of args) {
		console.log('data arg', a.toString())
	    }
	}
	//console.log(args);
	var ans = f.impl(context, args);
	for (var a of ans) console.log('ANS', a && a.toString());
	console.log('AQ',ans)
	return ans;
    }
    and(context, args) {
	// args = [ query0, query1, ... ]
	// ans = intersection(query0, query1, ...)
	var elts = args[0];
	var ans = new Set();
	for (var e of elts) {
	    let add = true;
	    for (var l of args.slice(1)) {
		if (ans.has(e)) continue;
		if (!l.has(e)){ add = false; break; }
	    }
	    if(add) ans.add(e);
	}
	return ans;
    }
    or(context, args) {
	// args = [ query0, query1, ... ]
	// ans = union(query0, query1, ...)
	var ans = new Set;
	for (var l of args) {
	    for (var e of l) {
		ans.add(e);
	    }
	}
	return ans;
    }
    not(context, args) {
	// args = [ query0 ]
	let ans = new Set();
	for(var [name,item] of context){
	    if(!args[0].has(name)) ans.add(name);
	}
	return ans
    }
    hasName(context, args) {
	// args = [ name_str ]
	return context.has(args[0]) ? new Set([args[0]]) : new Set();
    }
    hasChild(context, args) {
	// args = [ query0 ]
	var ans = new Set();

	for (var item of args[0]) {
	    console.log('parent', context.get(item).parent);
	    ans.add(context.get(item).parent);
	}
	return ans;
    }
    hasParent(context, args) {
	// args = [ query0 ]
	var ans = new Set();
	for (var [name,item] of context) {
	    for (var i of args[0]) {
		if (item.parent == i) {
		    ans.add(name);
		}
	    }
	}
	return ans;
    }
    stateIs(context, args) {
	// args = [ name_str ]
	var ans = [];
	for (var item of context) {
	    if (item.current_state.name == args[0]) ans.push(item);
	}
	return ans;
    }
}
var q = new Query([]);

// An ActionQuery is associated with a verb and contains queries that
// will, given a context, resolve the actor and direct object.
class ActionQuery {
    constructor(verb, subjectQuery, objectQuery) {
	console.log('S',subjectQuery);
	console.log('O',objectQuery);
	this.subjectQuery = new Query(subjectQuery || ["hasName", "$subject"]);
	this.objectQuery = new Query(objectQuery || ["hasName", "$object"]);
	this.verb = verb;
    }
    execute(context, subject, object) {
	let args = {
	    "$subject": subject,
	    "$object": object
	};
	//console.log(context, args);
	let action_subject = this.subjectQuery.execute(context, args);
	let action_object = this.objectQuery.execute(context, args);
	if (action_subject.length == 0) throw "No valid subject";
	if (action_subject.length > 1) throw "Ambiguous subject";
	if (action_object.length == 0) throw "No valid object";
	if (action_object.length > 1) throw "Ambiguous object";
	let as = context.get(action_subject.values().next().value);
	let ao = context.get(action_object.values().next().value);
	console.log(`SUB=${as.name}, VRB=${this.verb}, OBJ=${ao.name}`,args);
	return ao.act(context, as, this.verb, ao);
    }
    toString(indentation){
	let indent = " ".repeat(indentation);
	return `${indent}${this.verb}:\n${indent} subject: ${this.subjectQuery.toString()}\n${indent} object: ${this.objectQuery.toString()}`;
    }
}

class Transfer {
    // Move the item to the inventory of the destination.
    constructor(itemQuery, destinationQuery) {
	console.log('ID',itemQuery,destinationQuery);
	this.itemQuery = new Query(itemQuery);
	// Execution must interpret a null destination as a move to the root level,
	// effectively removing the item from play.
	this.destinationQuery = new Query(destinationQuery || ["hasName","OUTSIDE"]);
    }

    execute(context, subject, verb, object) {
	let args = {'$subject':subject.name, '$object':object.name};
	let item = this.itemQuery.execute(context, args);
	let dst = this.destinationQuery.execute(context, args);
	item = context.get(item.values().next().value);
	dst = context.get(dst.values().next().value);
	context.get(item.parent).inventory.delete(item.name);// Remove item from current parent
	item.parent = dst.name; // Set item parent to destination
	dst.inventory.add(item.name); // Add item to destination inventory
    }

    toString(indentation) {
	let indent = " ".repeat(indentation);
	let str = `${indent} ${this.itemQuery.toString()} --> ${this.destinationQuery.toString()}`;
	return str;
    }
}

class Action { // lawsoot lawl
    constructor(next_state, transfers, action_queries) {
	// Execution must interpret a null next_state as not changing the state's
	// current_state.
	this.next_state = next_state || null;
	this.transfers = transfers || [];
	this.action_queries = action_queries || [];
    }

    execute(context, subject, verb, object) {
	// Perform transition on object
	if (this.next_state !== null) object.current_state = this.next_state;
	
	// Perform all specified transfers
	for (let transfer of this.transfers) transfer.execute(context, subject, verb, object);

	// Return a list of ActionQuery objects for follow-on actions
	return {'followers':this.action_queries,'subject':subject.name,'object':object.name};
    }

    toString(indentation) {
	let indent = " ".repeat(indentation);
	let str = `${indent}next_state: ${this.next_state || "[None]"}\n${indent}transfers:`;
	for (let transfer of this.transfers) str += "\n"+transfer.toString(indentation + 1);
	str += `\n${indent}action_queries:`;
	for (let action_query of this.action_queries) str += "\n"+action_query.toString(indentation + 1);
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

    execute(context, subject, verb, object) {
	if (this.actions.hasOwnProperty(verb)) this.actions[verb].execute(context, subject, verb, object);
	else throw `Action ${verb} not found in object:\n` + JSON.stringify(this.actions, null, " ");
    }

    toString(indentation) {
	let indent = " ".repeat(indentation);
	let str = `${indent}${this.name}:\n${indent} description: ${this.description}\n${indent} actions:`;
	for (let [action_name, action] of this.actions) {
	    str += `\n${indent}  ${action_name}:\n` + action.toString(indentation + 3);
	}
	return str;
    }
}

class Item {
    constructor(name, states, current_state, inventory, parent) {
	this.name = name;
	this.states = states;
	this.current_state = current_state;
	this.inventory = inventory || new Set();
	this.parent = parent || null;
    }

    act(context, subject, verb, object){
	return this.states.get(this.current_state).actions.get(verb).execute(context, subject, verb, object);
    }

    toString() {
	let str = `${this.name}:`;
	str += `\n current state: ${this.current_state}\n parent: ${this.parent}\n states:\n`;
	for (let [name,state] of this.states) {
	    str += state.toString(2);
	}
	str += `\n inventory: ` + Array.from(this.inventory).join(",");
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

function exec(subject, verb, object) {
    var actionQueries = {'followers':[getActionQuery(verb)],'subject':subject,'object':object};

    while (actionQueries.followers.length > 0) {
	var next_actions = [];
	for (var aq of actionQueries.followers) {
	    // Parse
	    // (We're pretending already parsed into SVO)

	    // Template
	    for (let [n,u] of universe) console.log('BEFORE',u.toString());

	    // Resolve objects
	    actionQueries = aq.execute(universe, subject, object);
	    for (let [n,u] of universe) console.log('AFTER',u.toString());
	    // for (var e of effects) {
	    // 	if (e.type == 'action') { // Queue follow-on actions for the next round
	    // 	    let args = {
	    // 		"$subject": action.subject
	    // 	    };
	    // 	    next_actions.push([action.subject, e.verb, e.obj]); // This is wrong--Are we running loop on svo strings or resolved values
	    // 	} else if (e.type == 'move') { // Execute any moves immediately
	    // 	    let args = {
	    // 		"$subject": action.subject
	    // 	    };
	    // 	    let src = e.src.execute(universe, args);
	    // 	    let dst = e.dst.execute(universe, args);
	    // 	    let obj = e.obj.execute(universe, args);
	    // 	    if (!src.hasSubItem(obj)) throw obj.toString() + " is not in " + src.toString();
	    // 	    src.removeSubItem(obj);
	    // 	    dst.addSubItem(obj);
	    // 	} else if (e.type == 'destroy') { // Execute any destroys immediately
	    // 	    let args = {
	    // 		"$subject": action.subject
	    // 	    };
	    // 	    let obj = e.obj.execute(universe, args);
	    // 	    obj.parent.removeSubItem(obj);
	    // 	} else if (e.type == 'create') { // Execute any creates immediately
	    // 	    let args = {
	    // 		"$subject": action.subject
	    // 	    };
	    // 	    let obj = e.obj.execute(universe, args);
	    // 	    obj.parent.addSubItem(obj);
	    // 	}
	    // }
	}
	actions = next_actions;
    }
}

function json2obj(input) {
    let model = new Map();
    for (let o of input) {
	var states = new Map();
	var start = null;
	for (var s of o.states) {
	    let actions = new Map();
	    if(s.actions){
		for(let a of s.actions){
		    let next_state = s.name;
		    let transfers = [];
		    let action_queries = [];
		    if('transition' in a.effect) next_state = a.effect.transition.next_state;
		    if('transfers' in a.effect) transfers = a.effect.transfers.map(T => new Transfer(T.item, T.destination));
		    if('action_queries' in a.effect) action_queries = a.effect.action_queries.map(A => new ActionQuery(A.verb, A.subject, A.object));
		    actions.set(a.name, new Action(next_state, transfers, action_queries));
		}
	    }
	    states.set(s.name, new State(s.name, s.description, actions));
	    if (s.current) start = s.name;
	}

	let item = new Item(o.name, states, start, null, o.parent);
	model.set(o.name, item);
    }
    for (var [name,item] of model) {
	if(item.parent) model.get(item.parent).inventory.add(name);
    }
    return model;
}

function setUniverse(spec) {
    let jm = sdl_parser.parse(spec);
    // console.log(jm);
    //console.log(JSON.stringify(jm, null, " "));
    universe = json2obj(jm);
    // console.log(universe);
}

module.exports = {
    setUniverse: setUniverse,
    exec: exec
}
