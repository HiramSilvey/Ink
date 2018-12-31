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

action
    : query NAME query
        { $$ = {"subject":$1,"verb":$2,"object":$3}; }
    ;

actions
    : action
        { $$ = [$1]; }
    | action "," actions
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

change
    : transition
        { $$ = {"transition":$1}; }
    | "[" transfers "]"
        { $$ = {"transfers":$1}; }
    | "[" actions "]"
        { $$ = {"actions":$1}; }
    | transition "[" transfers "]"
        { $$ = {"transition":$1,"transfers":$3}; }
    | transition "[" actions "]"
        { $$ = {"transition":$1,"actions":$3}; }
    | transition "[" transfers "]" "[" actions "]"
        { $$ = {"transition":$1,"transfers":$3,"actions":$6}; }
    ;

effect
    : NAME ":" STR 
        { $$ = {"name":$1,"description":$3,"protected":$1[0] == "_"}; }
    | NAME ":" STR change
        { $$ = {"name":$1,"description":$3,"protected":$1[0] == "_","change":$4}; }
    ;

effects
    : effect
        { $$ = [$1]; }
    | effect "," effects
        { $$ = [$1].concat($3); }
    ;

state
    : NAME ":" STR ";"
        { $$ = {"name":$1,"description":$3,"current":false}; }
    | "*" NAME ":" STR ";"
        { $$ = {"name":$2,"description":$4,"current":true}; }
    | NAME ":" STR "[" effects "]" ";"
        { $$ = {"name":$1,"description":$3,"current":false,"effects":$5}; }
    | "*" NAME ":" STR "[" effects "]" ";"
        { $$ = {"name":$2,"description":$4,"current":true,"effects":$6}; }
    ;

states
    : state
        { $$ = [$1]; }
    | state states
        { $$ = [$1].concat($2); }
    ;

object
    : NAME "{" states "}" ";"
        { $$ = {"name":$1,"states":$3}; }
    | NAME ">" NAME "{" states "}" ";"
        { $$ = {"name":$3,"parent":$1,"states":$5}; }
    ;

objects
    : object
        { $$ = [$1]; }
    | object objects
        { $$ = [$1].concat($2); }
    ;

sdl
    : objects EOF
        { return $1; }
    ;