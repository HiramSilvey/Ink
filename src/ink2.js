sdl_parser = require('./sdl.js');

class DictionaryEntry{
    constructor(synonyms, actionQuery){
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
	console.log('EQ',context.length, globalArgs, 'r',root);
	var fn = root[0];
	if (!(fn in this.functions)) throw `Invalid query function: {fn}`;
	fn = this.functions[fn];
	var args = [];
	if (fn.args == "query") for (var q of root.slice(1)) args.push(this.execute(context, globalArgs, q));
	else for (var arg of root.slice(1)) args.push(arg[0] == "$" && globalArgs[arg] ? globalArgs[arg] : arg);
	//for(var a of args) console.log('Q', a.toString(), globalArgs)
	//console.log(args);
	var ans = fn.impl(context, args);
	for(var a of ans) console.log('ANS',a && a.toString());
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
	    console.log('parent',item.parent && item.parent.toString());
	    if(ans.indexOf(item.parent) < 0) ans.push(item.parent);
	}
	return ans;
    }
    hasParent(context, args) {
	// args = [ query0 ]
	var ans = [];
	for (var item of context) {
	    console.log('par',item.parent && item.parent.toString())
	    for(var i of args[0]){
		if(ans.indexOf(item) < 0 && item.parent == i){
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
    constructor(verb, subjectQuery, objectQuery){
	subjectQuery = subjectQuery || ["hasName", "$subject"];
	objectQuery = objectQuery || ["hasName", "$object"];
	this.subjectQuery = new Query(subjectQuery);
	this.objectQuery = new Query(objectQuery);
	this.verb = verb;
    }
    execute(context, actor, ob){
	let args = {"$subject":actor,"$object":ob};
	console.log(context, args);
	let action_subject = this.subjectQuery.execute(context, args);
	let action_object = this.objectQuery.execute(context, args);
	console.log('sub',action_subject);
	console.log('ob',action_object);
	if(action_subject.length == 0) throw "No valid subject";
	if(action_subject.length > 1) throw "Ambiguous subject";
	if(action_object.length == 0) throw "No valid object";
	if(action_object.length > 1) throw "Ambiguous object";
	console.log(`SUB=${action_subject[0].toString()}, VRB=${this.verb}, OBJ=${action_object[0].toString()}`);
	action_object[0].doAction(this.verb);
    }
}

// States represent the current status of an item
class State {
    constructor(subtext, transitions) {
	this.description = subtext; // The answer to "look"
	this.transitions = transitions || {};
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
	this.descriptor = descriptor;
	this.currentState = start;
	this.states = states;
	this.parent = parent || null;
	this.children = children || [];
    }

    doAction(t) {
	// needs updating
	console.log(this.states, 'AA',this.states[this.currentState]);
	let trans = this.states[this.currentState].transitions[t];
	if(!trans) throw "No such transition";
	this.currentState = trans.nextState;
	console.log(trans.description);
	return trans.effects;
    }
    
    addSubItem(item) {
	item.parent = this;
	if (this.children.hasOwnProperty(item.descriptor)) {
	    this.children[item.descriptor].push(item);
	} else {
	    this.children[item.descriptor] = [item];
	}
    }

    removeSubItem(item) {
	let subItemType = this.children[item.descriptor];
	let index = subItemType.indexOf(item);
	if (index != -1) {
	    subItemType.splice(index, 1);
	    if (!subItemType.length) delete this.children[item.descriptor];
	}
    }

    toString() {
	let ans = `${this.descriptor} [in: ${this.parent ? this.parent.descriptor : "[None]"}; state: ${this.currentState}; `;
	for (var child of this.children) {
	    ans += `has: ${child.descriptor} -- ${child.currentState}; `;
	}
	ans += "]"
	return ans;
    }
}

var dictionary = {
    "go":new DictionaryEntry(
	["move"],
	new ActionQuery("go",
			null,                                                                   // the subject is just the unqualified subject
			["and", ["hasName","$object"], ["hasParent",["hasChild",["hasName","$subject"]]]])), // Only go things that are in same room
    "eat":new DictionaryEntry(
	["devour", "gobble"],
	new ActionQuery("eat",
			null,                                                                   // the subject is just the unqualified subject
			["and", ["hasName","$object"], ["hasParent",["hasName","$subject"]]])),             // Only eat things that you have
    "take":new DictionaryEntry(
	["take","grab"],
	new ActionQuery("go",
			["and", ["hasName","$object"], ["hasParent",["hasChild",["hasName","$subject"]]]], // Only take things in the same room
			["hasName","$subject"])),                                              // "take" is "go" with subject and object reversed
    "scream":new DictionaryEntry(
	["yell","shout"],
	new ActionQuery("scream",
			null, 
			["hasParent",["hasChild",["hasName","$subject"]]])),                                // scream affects only things in same room
    "look":new DictionaryEntry(
	["observe","behold"],
	new ActionQuery("look"))
}

var universe = {};

function getActionQuery(verb){
    for(var word in dictionary){
	if(word != verb && dictionary[word].synonyms.indexOf(verb) < 0) continue;
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
	    console.log('EXEC SVO',subject,verb,object);
	    // Parse
	    // (We're pretending already parsed into SVO)
	    
	    // Template
	    let aq = getActionQuery(verb);
	    for(var u of universe) console.log(u.toString());
	    
	    // Resolve objects
	    let effects = aq.execute(universe, subject, object);
	    
	    for(var e of effects) {
		if(e.type == 'action') { // Queue follow-on actions for the next round
		    let args = {"$subject":action.subject};
		    next_actions.push([action.subject, e.verb, e.obj]); // This is wrong--Are we running loop on svo strings or resolved values
		}
		else if(e.type == 'move') { // Execute any moves immediately
		    let args = {"$subject":action.subject};
		    let src = e.src.execute(universe, args);
		    let dst = e.dst.execute(universe, args);
		    let obj = e.obj.execute(universe, args);
		    if(!src.hasSubItem(obj)) throw obj.toString() + " is not in " + src.toString();
		    src.removeSubItem(obj);
		    dst.addSubItem(obj);
		}
		else if(e.type == 'destroy') { // Execute any destroys immediately
		    let args = {"$subject":action.subject};
		    let obj = e.obj.execute(universe, args);
		    obj.parent.removeSubItem(obj);
		}
		else if(e.type == 'create') { // Execute any creates immediately
		    let args = {"$subject":action.subject};
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
	for (var s of o.states){
	    states[s.name] = new State(s.subtext, []);
	    if(s.start) start = s.name;
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
    for(var i of model){
	let new_children = [];
	for(var c of i.children){
	    for(var j of model){
		if(j.descriptor == c){
		    new_children.push(j);
		}
	    }
	}
	i.children = new_children;
    }
    for(var i of model){
	for(var c of i.children){
	    c.parent = i;
	}
    }
    return model;
}

function setUniverse(spec){
    let jm = sdl_parser.parse(spec);
    console.log(jm);
    universe = json2obj(jm);
    //console.log(universe);
}

module.exports = {
    setUniverse: setUniverse,
    exec: exec
}
