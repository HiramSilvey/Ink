class DictionaryEntry{
    constructor(synonyms, actionQuery){
	this.synonyms = synonyms;
	this.condition = condition;
	this.actionQuery = actionQuery;
    }
}

// An ActionQuery is associated with a verb, and is "realised" in the current context to create actual Actions
class ActionQuery {
    constructor(ty, verb, subjectQuery, objectQuery){
	this.actionType = ty;
	this.subjectQuery = subjectQuery || ["hasName", "$subject"];
	this.objectQuery = objectQuery || ["hasName", "$object"];
	this.verb = verb;
    }
    realise(context, actor, ob){
	let args = {"$subject":actor,"$object":ob};
	let action_subject = this.subjectQuery.execute(context, args);
	let action_object = this.objectQuery.execute(context, args);
	return new Action(action_subject, this.verb, action_object);
    }
}

// Actions 
class Action { // imma sue u lol
    constructor(sub, verb, ob){
	this.subject = sub;
	this.verb = verb;
	this.object = ob;
    }
    execute(context){
	return this.object.doTransition(verb);
    }
}

// States represent the current status of an item
class State {
    constructor(subtext, transitions) {
	this.description = description; // The answer to "look"
	this.transitions = transitions;
    }
}

// Transitions represent a change in state of an item
// Effects are applied when a transition occurs
class Transition {
    constructor(nextState, effects, description) {
	this.nextState = nextState;
	this.effects = []; // A list of ActionQuery objects
	this.description = description;
    }    
}

// Items are every contained piece of information
class Item {
    constructor(descriptor, states, start, parent, children) {
	this.descritor = descriptor;
	this.currentState = start;
	this.states = states;
	this.parent = parent || null;
	this.children = children || {};
    }

    doTransition(t) {
	let trans = this.currentState.transtions[t];
	if(!trans) throw "No such transition";
	this.currentState = trans.nextState;
	console.log(trans.description);
	return trans.effects;
    }
    
    addSubItem(item) {
	item.parent = this;
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

var dictionary = {
    "go":new DictionaryEntry(
	["move"],
	new ActionQuery("go",
			null,                                                                   // the subject is just the unqualified subject
			["and", ["hasName","$object"], ["hasParent",["hasChild","$subject"]]])), // Only go things that are in same room
    "take":new DictionaryEntry(
	["take","grab"],
	new ActionQuery("go",
			["and", ["hasName","$object"], ["hasParent",["hasChild","$subject"]]], // Only take things in the same room
			["hasName","$subject"])),                                              // "take" is "go" with subject and object reversed
    "scream":new DictionaryEntry(
	["yell","shout"],
	new ActionQuery("scream",
			null, 
			["hasParent",["hasChild","$subject"]])),                                // scream affects only things in same room
    "look":new DictionaryEntry(
	["observe","behold"],
	new ActionQuery("look"))
}

var model = {};

function getActionQuery(verb){
    for(var word of dictionary){
	let i = dictionary[word].synonyms.indexOf(verb);
	if(i < 0) continue;
	return dictionary[word].actionQuery;
    }
}

function exec(s, v, o){
    var actions = [[s, v, o]];

    while(actions.length > 0){
	var next_actions = [];
	for(var a of actions){
	    let subject = a[0];
	    let verb = a[1];
	    let object = a[2];
	    // Parse
	    // (We're pretending already parsed into SVO)
	    
	    // Template
	    let aq = getActionQuery(verb);
	    
	    // Resolve objects
	    let action = aq.realise(model, subject, object);
	    
	    // Do transition
	    let effects = action.execute(model);
	    
	    for(var e of effects) {
		if(e.type == 'action') { // Queue follow-on actions for the next round
		    let args = {"$subject":action.subject};
		    next_actions.push([action.subject, e.verb, e.obj]); // This is wrong--Are we running loop on svo strings or resolved values
		}
		else if(e.type == 'move') { // Execute any moves immediately
		    let args = {"$subject":action.subject};
		    let src = e.src.execute(model, args);
		    let dst = e.dst.execute(model, args);
		    let obj = e.obj.execute(model, args);
		    if(!src.hasSubItem(obj)) throw obj.toString() + " is not in " + src.toString();
		    src.removeSubItem(obj);
		    dst.addSubItem(obj);
		}
		else if(e.type == 'destroy') { // Execute any destroys immediately
		    let args = {"$subject":action.subject};
		    let obj = e.obj.execute(model, args);
		    obj.parent.removeSubItem(obj);
		}
		else if(e.type == 'create') { // Execute any creates immediately
		    let args = {"$subject":action.subject};
		    let obj = e.obj.execute(model, args);
		    obj.parent.addSubItem(obj);
		}
	    }
	}
	actions = next_actions;
    }
}
