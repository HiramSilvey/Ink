sdl_parser = require('./sdl.js');

DEBUG = {
				'game':true,
				'exec':false,
				'query':false,
				'actionquery':false,
				'queryeval':false,
				'uni':false,
				'universe':false
}

class DictionaryEntry {
				constructor(synonyms, actionQuery) {
								this.synonyms = synonyms;
								this.actionQuery = actionQuery;
				}
}

class Query {
				constructor(spec) {
								this.spec = spec;
								dlog('query',this.spec);
								this.signatures = {
												"and":["queries"],
												"or":["queries"],
												"not":["query"],
												"hasName":["data"],
												"hasDescription":["data"],
												"hasParent":["query"],
												"hasChild":["query"],
												"stateIs":["data"],
												"singleton":["query"],
												"limit":["query","data"]
								}
				}
				toString() {
								let self = this;
								let strBuilder = function (root) {
												let fn = root[0];
												if(fn in named_queries) return `${fn}(${root.slice(1).join(",")})`;
												if(!fn in self.signatures)	throw `Invalid query function: ${fn}`;
												let args = [];
												let params = root.slice(1);
												let sig = self.signatures[fn];
												for(let i = 0; i < params.length; i++){
																if(sig[i] == "data") args.push(params[i]);
																else if(sig[i] == "query") args.push(strBuilder(params[i]));
																else if(sig[i] == "queries") {
																				args = params.slice(i).map(r => strBuilder(r));
																				break;
																}
												}
												return `${fn}(${args.join(",")})`;
								}
								return strBuilder(this.spec);
				}
				execute(context, globalArgs, root) {
								root = root || this.spec;
								dlog('query', context.size, globalArgs, 'r', root);
								let fn = root[0];
								if (fn in named_queries){
												let args = {};
												let i = 1;
												Object.assign(args, globalArgs);
												root.slice(1).forEach(a => args[`$${i++}`] = a);
												return named_queries[fn].execute(context, args);
								}
								if (!(fn in this.signatures)) throw `Invalid query function: ${fn}`;
								let args = [];
								let params = root.slice(1);
								let sig = this.signatures[fn];

								// Recursively execute query arguments and populate data arguments as
								// well as results of executed query arguments into args
								for(let arg_idx = 0; arg_idx < root.length-1; arg_idx++){
												if (arg_idx >= sig.length) throw "Too many arguments";
												
												if (sig[arg_idx] == "queries") {
																// If the argument has type "queries", simply consume all remaining arguments
																for (let q of params.slice(arg_idx)) {
																				args.push(this.execute(context, globalArgs, q));
																}
																break;
												}
												else if (sig[arg_idx] == "query") {
																args.push(this.execute(context, globalArgs, params[arg_idx]));
												}
												else if (sig[arg_idx] == "data") {
																let arg = params[arg_idx];
																if(arg[0] == "$"){
																				if(arg in globalArgs) args.push(globalArgs[arg]);
																				else throw `No such global argument found: ${arg[0]}`;
																}
																else	args.push(arg);
												}
								}

								// Just debug things
								dlog('query', globalArgs, fn)
								if (this.signatures[fn] == "query") {
												for (let a of args) {
																for (let e of a) {
																				dlog('query', 'query arg', e.name);
																}
												}
								} else if (this.signatures[fn] == "data") {
												for (let a of args) {
																dlog('query', 'data arg', a);
												}
								}
								let ans = this[fn](context, args);
								for (let a of ans) dlog('query','ANS', a.name);
								return ans;
				}
				and(context, args) {
								// args = [ query0, query1, ... ]
								// ans = intersection(query0, query1, ...)
								let ans = args[0];
								for (let items of args.slice(1)) {
												ans = [...ans].filter(item => items.has(item));
								}
								return new Set(ans);
				}
				or(context, args) {
								// args = [ query0, query1, ... ]
								// ans = union(query0, query1, ...)
								let ans = new Set();
								for (let items of args) {
												for (let item of items) {
																ans.add(item);
												}
								}
								return ans;
				}
				not(context, args) {
								// args = [ query ]
								let ans = new Set();
								for (let item of context.values()) {
												if (!args[0].has(item)) {
																ans.add(item);
												}
								}
								return ans;
				}
				hasDescription(context, args) {
								// args = [ name_str ]
								let ans = new Set();
								for (let item of context.values()) {
												if (item.states.get(item.current_state).description.indexOf(args[0]) >= 0) {
																ans.add(item);
												}
								}
								return ans;
				}
				hasName(context, args) {
								// args = [ name_str ]
								return context.has(args[0]) ? new Set([context.get(args[0])]) : new Set();
				}
				hasChild(context, args) {
								// args = [ query0 ]
								let ans = new Set();
								for (let item of args[0]) {
												let parent_name = (item.parent) ? item.parent.name : null;
												dlog('queryeval', 'parent', parent_name);
												if (item.parent) {
																ans.add(item.parent);
												}
								}
								return ans;
				}
				hasParent(context, args) {
								// args = [ query0 ]
								let ans = new Set();
								for (let item of context.values()) {
												for (let query_item of args[0]) {
																if (Object.is(item.parent, query_item)) {
																				ans.add(item);
																}
												}
								}
								return ans;
				}
				stateIs(context, args) {
								// args = [ name_str ]
								let ans = new Set();
								for (let item of context.values()) {
												if (item.current_state.name == args[0]) {
																ans.add(item);
												}
								}
								return ans;
				}
				singleton(context, args) {
								// args = [ query ]
								if(args[0].size == 0) throw "nonexistent";
								if(args[0].size > 1) throw "ambiguous";
								return args[0];
				}
				limit(context, args) {
								// args = [ query, num ]
								let ans = new Set();
								for (let item of context.values()) {
												if(ans.length >= args[1]) return ans;
												ans.add(item);
								}
								return ans;
				}
}

// An ActionQuery is associated with a verb and contains queries that
// will, given a context, resolve the actor and direct object.
class ActionQuery {
				constructor(verb, subjectQuery, objectQuery) {
								dlog('actionquery', 'S', subjectQuery);
								dlog('actionquery', 'O', objectQuery || 'asd');
								dlog('actionquery', 'V', verb);
								this.subjectQuery = new Query(subjectQuery ? ["singleton",subjectQuery] : ["singleton",["hasName", "$subject"]]);
								this.objectQuery = new Query(objectQuery ? objectQuery : ["hasName", "$object"]);
								this.verb = verb;
								dlog('actionquery', 'S', this.subjectQuery.toString());
								dlog('actionquery', 'O', this.objectQuery.toString());
								dlog('actionquery', 'V', this.verb);
								dlog('actionquery',this);
				}
				execute(context, subject, object) {
								let args = {
												"$subject": subject,
												"$object": object
								};
								dlog('actionquery', 'executing...',this);
								dlog('actionquery', 'S', this.subjectQuery.toString());
								dlog('actionquery', 'O', this.objectQuery.toString());
								dlog('actionquery', 'V', this.verb);
								let action_subject = this.subjectQuery.execute(context, args);
								let action_object = this.objectQuery.execute(context, args);
								let as = action_subject.values().next().value; // subject is always a singleton so can get its value
								let ans = [];
								for(let ao of action_object){
												dlog('actionquery', `SUB=${as.name}, VRB=${this.verb}, OBJ=${ao.name}`, args);
												let new_aqs = ao.act(context, as, this.verb, ao);
												// If there are any new action queries to run, push them onto the list
												if(new_aqs && 'followers' in new_aqs && new_aqs.followers.length > 0) ans.push(new_aqs);
								}
								return ans;
				}
				toString(indentation) {
								let indent = " ".repeat(indentation);
								return `${indent}${this.verb}:\n${indent} subject: ${this.subjectQuery.toString()}\n${indent} object: ${this.objectQuery.toString()}`;
				}
}

class Transfer {
				// Move the item to the inventory of the destination.
				constructor(itemQuery, destinationQuery) {
								this.itemQuery = new Query(itemQuery);
								// Execution must interpret a null destination as a move to the root level,
								// effectively removing the item from play.
								this.destinationQuery = new Query(destinationQuery || ["hasName", "OUTSIDE"]);
				}

				execute(context, subject, verb, object) {
								let args = {
												'$subject': subject.name,
												'$object': object.name
								};
								let item = this.itemQuery.execute(context, args);
								let destination = this.destinationQuery.execute(context, args);
								// daniel -- these are returning the 1st values in the resulting array?
								item = item.values().next().value;
								destination = destination.values().next().value;
								if (item.parent) {
												item.parent.inventory.delete(item); // Remove item from current parent
								}
								item.parent = destination; // Set item parent to destination
								destination.inventory.add(item); // Add item to destination inventory
				}

				toString(indentation) {
								let indent = " ".repeat(indentation);
								let str = `${indent} ${this.itemQuery.toString()} --> ${this.destinationQuery.toString()}`;
								return str;
				}
}

class Action { // lawsoot lawl
				constructor(description, next_state, transfers, action_queries) {
								// Execution must interpret a null next_state as not changing the state's
								// current_state.
								this.description = description;
								this.next_state = next_state || null;
								this.transfers = transfers || [];
								this.action_queries = action_queries || [];
				}

				execute(context, subject, verb, object) {
								dlog('GAME',this.description);
								// Perform transition on object
								if (this.next_state !== null) object.current_state = this.next_state;

								// Perform all specified transfers
								for (let transfer of this.transfers) transfer.execute(context, subject, verb, object);
								
								// Return a list of ActionQuery objects for follow-on actions
								return {
												'followers': this.action_queries,
												'subject': subject.name,
												'object': object.name
								};
				}

				toString(indentation) {
								let indent = " ".repeat(indentation);
								let str = `${indent}next_state: ${this.next_state || "[None]"}\n${indent}transfers:`;
								for (let transfer of this.transfers) str += "\n" + transfer.toString(indentation + 1);
								str += `\n${indent}action_queries:`;
								for (let action_query of this.action_queries) str += "\n" + action_query.toString(indentation + 1);
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

				act(context, subject, verb, object) {
								if(verb == "look") dlog('GAME',this.states.get(this.current_state).description);
								let action = this.states.get(this.current_state).actions.get(verb);
								if(action) return action.execute(context, subject, verb, object);
								return {};
				}

				toString(verbose) {
								let str = `${this.name}:`;
								let parent_name = (this.parent) ? this.parent.name : null;
								str += `\n current state: ${this.current_state}\n parent: ${parent_name}`;
								if(verbose){
												str += `\n states:`;
												for (let [name, state] of this.states) {
																str += "\n"+state.toString(2);
												}
								}
								str += `\n inventory: ` + Array.from(this.inventory, item => item.name).join(", ");
								return str;
				}
}

named_queries = {
				"sibling":new Query(["hasParent", ["hasChild", ["hasName", "$subject"]]]),
				"owned":new Query(["hasParent", ["hasName", "$subject"]])
}

let dictionary = {
				"go": new DictionaryEntry(
								["move"],
								new ActionQuery("go",
																								null, // the subject is just the unqualified subject
																								["and", ["hasDescription", "$object"],	["sibling"]])), // Only go things that are in same room
				"inventory": new DictionaryEntry(
								["items"],
								new ActionQuery("look", null, ["hasParent",["hasName", "$subject"]])),
				"look": new DictionaryEntry(
								["observe", "behold"],
								new ActionQuery("look",
																								null, // the subject is just the unqualified subject
																								["sibling"])), // Only see things that are in same room
				"eat": new DictionaryEntry(
								["devour", "gobble"],
								new ActionQuery("eat",
																								null, // the subject is just the unqualified subject
																								["singleton", ["and", ["hasDescription", "$object"],	["owned"]]])), // Only eat things that you have
				"take": new DictionaryEntry(
								["take", "grab"],
								new ActionQuery("go",
																								["and", ["hasDescription", "$object"],	["sibling"]], // Only take things in the same room
																								["hasName", "$subject"])), // "take" is "go" with subject and object reversed
				"scream": new DictionaryEntry(
								["yell", "shout", "shriek"],
								new ActionQuery("scream",
																								null,
																								["sibling"])), // scream affects only things in same room
}

let universe = {};

function getActionQuery(verb) {
				for (let word of Object.keys(dictionary)) {
								if (word != verb && dictionary[word].synonyms.indexOf(verb) < 0) {
												continue;
								}
								if (word in dictionary) return [dictionary[word].actionQuery];
				}
				return [];
}

function exec(subject, verb, object) {
				let actions = [{
								'followers': getActionQuery(verb),
								'subject': subject,
								'object': object
				}];

				let user_action = true;
				while(actions.length > 0){
								for (let a of actions) {
												for(let aq of a.followers){
																
																dlog('GAME', `Action: ${a.subject} ${aq.verb} ${a.object}`);
																dlog('EXEC', '=========[ EXEC ]=========');
																dlog('EXCE', aq.toString());
																dlog('EXEC', '----| BEFORE |----');
																for (let [n, u] of universe) dlog('EXEC',u.toString());
																try {
																				actions = aq.execute(universe, a.subject, a.object);
																} catch(e) {
																				if(user_action && e == "ambiguous") {
																								dlog('GAME', `Ambiguous "${object}".`);
																				}
																				else if(user_action && e == "nonexistent") {
																								dlog('GAME', `What "${object}"?`);
																				}
																				else throw e;
																				actions = [];
																}
																user_action = false;
																dlog('EXEC','----| AFTER |----')
																for (let [n, u] of universe) dlog('exec',u.toString());
												}
								}
								actions = actions.filter(a => a.followers.length > 0);
				}
}

function dlog(){
				if(DEBUG[arguments[0].toLowerCase()])	console.log.apply(console, arguments)
}

function jsonToObject(items) {
				let model = new Map();
				for (let item of items) {
								let states = new Map();
								let current_state = null;
								for (let state of item.states) {
												let actions = new Map();
												if (state.actions) {
																for (let action of state.actions) {
																				let next_state = state.name;
																				let transfers = [];
																				let action_queries = [];
																				if (action.effect.hasOwnProperty('transition')) {
																								next_state = action.effect.transition.next_state;
																				}
																				if (action.effect.hasOwnProperty('transfers')) {
																								transfers = action.effect.transfers.map(transfer => new Transfer(transfer.item, transfer.destination));
																				}
																				if (action.effect.hasOwnProperty('action_queries')) { 
																								action_queries = action.effect.action_queries.map(action_query => new ActionQuery(action_query.verb, action_query.subject, action_query.object));
																				}
																				actions.set(action.name, new Action(action.description, next_state, transfers, action_queries));
																}
												}
												states.set(state.name, new State(state.name, state.description, actions));
												if (state.current) {
																current_state = state.name;
												}
								}
								model.set(item.name, new Item(item.name, states, current_state, null, item.parent));
				}
				for (let [name, item] of model) {
								if (item.parent) {
												item.parent = model.get(item.parent);
												item.parent.inventory.add(item);
								}
				}
				return model;
}

function setUniverse(specification) {
				let json_model = sdl_parser.parse(specification);
				dlog('uni',json_model);
				dlog('universe',JSON.stringify(json_model, null, " "));
				universe = jsonToObject(json_model);
}

module.exports = {
				setUniverse: setUniverse,
				exec: exec
}
