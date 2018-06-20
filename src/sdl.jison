%lex
%%

\s+			          /* skip whitespace */
[a-zA-Z_][a-zA-Z_0-9]*		  return "NAME"
\"(?:[^"\\]|\\.)*\"		  return "STR"
"{"				  return "{"
"}"				  return "}"
"["				  return "["
"]"				  return "]"
"\n"				  return "\n"
"|"				  return "|"
":"				  return ":"
";"				  return ";"
"*"				  return "*"
">"				  return ">"
<<EOF>>                	       	  return "EOF"
.                      		  return "INVALID"

/lex

%start sdl

%%

sdl
    : objects EOF
        { return $1; }
    ;
    
objects
    : object ";" objects
        { $$ = [$1].concat($3); }
    | object
	{ $$ = [$1]; }
    ;

object
    : NAME "{" states '|' transitions '|' "[" ids "]" ";" "}"
        { $$ = {"name":$1,"states":$3,"transitions":$5,"ids":$8}; }
    | NAME "{" states '|' transitions "}"
        { $$ = {"name":$1,"states":$3,"transitions":$5}; }
    | NAME "{" states '|' "[" ids "]" ";" "}"
        { $$ = {"name":$1,"states":$3,"ids":$6}; }
    | NAME "{" states "}"
        { $$ = {"name":$1,"states":$3}; }
    ;

states
    : state states
        { $$ = [$1].concat($2); }
    | state
        { $$ = [$1]; }
    ;

transitions
    : transition transitions
        { $$ = [$1].concat($2); }
    | transition
        { $$ = [$1]; }
    ;

transition
    : NAME ":" NAME ">" NAME ";"
        { $$ = {"name":$1,"start":$3,"end":$5,"ids":[]}; }
    | NAME ":" NAME ">" NAME "[" ids "]" ";"
        { $$ = {"name":$1,"start":$3,"end":$5,"ids":$7}; }
    ;

ids
    : NAME
        { $$ = [$1]; }
    | NAME "," ids
        { $$ = [$1].concat($3); }
    ;

state
    : NAME "*" ":" STR ";"
        { $$ = {"name":$1,"subtext":$4,"start":true}; }
    | NAME ":" STR ";"
        { $$ = {"name":$1,"subtext":$3,"start":false}; }
    ;
