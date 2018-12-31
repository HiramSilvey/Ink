%lex
%%

\s+			          /* skip whitespace */
[$a-zA-Z_][a-zA-Z_0-9]*                 return "NAME"
\'(?:[^'\\]|\\.)*\'|\"(?:[^"\\]|\\.)*\" yytext = yytext.substr(1,yyleng-2); return "STR"
"{"                                     return "{"
"}"                                     return "}"
";"                                     return ";"
"*"                                     return "*"
":"                                     return ":"
">"                                     return ">"
"["                                     return "["
"]"                                     return "]"
"->"                                    return "->"
","                                     return ","
<<EOF>>                	                return "EOF"
.                                       return "INVALID"

/lex

%start sdl

%%

query
    : NAME
        { $$ = {"object":$1}; }
    | "(" NAME "," query ")"
        { $$ = {"function":$2,"query":$4}; }
    ;

action_query
    : query NAME query
        { $$ = {"subject":$1,"verb":$2,"object":$3}; }
    ;

action_queries
    : action_query
        { $$ = [$1]; }
    | action_query "," action_queries
        { $$ = [$1].concat($3); }
    ;

transition
    : "->" NAME
        { $$ = {"next_state":$2}; }
    ;

transfer
    : ">" NAME
        { $$ = {"item":$2}; }
    | NAME ">" NAME
        { $$ = {"item":$3,"destination":$1}; }
    ;

transfers
    : transfer
        { $$ = [$1]; }
    | transfer "," transfers
        { $$ = [$1].concat($3); }
    ;

effect
    : transition
        { $$ = {"transition":$1}; }
    | "[" transfers "]"
        { $$ = {"transfers":$2}; }
    | "[" action_queries "]"
        { $$ = {"action_queries":$2}; }
    | "[" transfers "]" "[" action_queries "]"
        { $$ = {"transfers":$2, "action_queries":$5}; }
    | transition "[" transfers "]"
        { $$ = {"transition":$1,"transfers":$3}; }
    | transition "[" action_queries "]"
        { $$ = {"transition":$1,"action_queries":$3}; }
    | transition "[" transfers "]" "[" action_queries "]"
        { $$ = {"transition":$1,"transfers":$3,"action_queries":$6}; }
    ;

action
    : NAME ":" STR 
        { $$ = {"name":$1,"description":$3,"protected":$1[0] == "_"}; }
    | NAME ":" STR effect
        { $$ = {"name":$1,"description":$3,"protected":$1[0] == "_","effect":$4}; }
    ;

actions
    : action
        { $$ = [$1]; }
    | action "," actions
        { $$ = [$1].concat($3); }
    ;

state
    : NAME ":" STR ";"
        { $$ = {"name":$1,"description":$3,"current":false}; }
    | "*" NAME ":" STR ";"
        { $$ = {"name":$2,"description":$4,"current":true}; }
    | NAME ":" STR "[" actions "]" ";"
        { $$ = {"name":$1,"description":$3,"current":false,"actions":$5}; }
    | "*" NAME ":" STR "[" actions "]" ";"
        { $$ = {"name":$2,"description":$4,"current":true,"actions":$6}; }
    ;

states
    : state
        { $$ = [$1]; }
    | state states
        { $$ = [$1].concat($2); }
    ;

item
    : NAME "{" states "}" ";"
        { $$ = {"name":$1,"states":$3}; }
    | NAME ">" NAME "{" states "}" ";"
        { $$ = {"name":$3,"parent":$1,"states":$5}; }
    ;

items
    : item
        { $$ = [$1]; }
    | item items
        { $$ = [$1].concat($2); }
    ;

sdl
    : items EOF
        { return $1; }
    ;