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
    : object "\n" objects
        { $$ = [$1].concat($3); }
    | object
	{ $$ = [$1]; }
    ;

object
    : NAME "{" states '|' transitions "}"
        { $$ = {"name":$1,"states":$3,"transitions":$5}; }
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
        { $$ = {"action":$1,"start":$3,"end":$5,"effects":[]]; }
    | NAME ":" NAME ">" NAME "[" effects "]" ";"
        { $$ = {"action":$1,"start":$3,"end":$5,"effects":$7]; }
    ;

effects
    : NAME
        { $$ = [$1]; }
    | NAME "," effects
        { $$ = [$1].concat($3); }
    ;

state
    : NAME "*" ":" STR ";"
        { $$ = {"name":$1,"subtext":$4,"start":true}; }
    | NAME ":" STR ";"
        { $$ = {"name":$1,"subtext":$3,"start":false]; }
    ;
