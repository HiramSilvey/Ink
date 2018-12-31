%lex
%%

\s+			          /* skip whitespace */
[a-zA-Z_][a-zA-Z_0-9]*		  return "NAME"
\"(?:[^"\\]|\\.)*\"		  yytext = yytext.substr(1,yyleng-2); return "STR"
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
","         return ","
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
    : NAME "{" states '|' transitions '|' "[" children "]" ";" "}"
        { $$ = {"name":$1,"states":$3,"transitions":$5,"children":$8}; }
    | NAME "{" states '|' transitions "}"
        { $$ = {"name":$1,"states":$3,"transitions":$5}; }
    | NAME "{" states '|' "[" children "]" ";" "}"
        { $$ = {"name":$1,"states":$3,"children":$6}; }
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
        { $$ = {"name":$1,"start":$3,"end":$5,"effects":[]}; }
    | NAME ":" NAME ">" NAME "[" effects "]" ";"
        { $$ = {"name":$1,"start":$3,"end":$5,"effects":$7}; }
    ;

children
    : NAME
        { $$ = [$1]; }
    | NAME "," children
        { $$ = [$1].concat($3); }
    ;

effects
    : effect
        { $$ = [$1]; }
    | effect "," effects
        { $$ = [$1].concat($3); }
    ;

effect
  : NAME
      { $$ = $1; }
  | NAME ">" NAME
      { $$ = {"item":$1,"newParent":$3}; }
  ;

state
    : NAME "*" ":" STR ";"
        { $$ = {"name":$1,"subtext":$4,"start":true}; }
    | NAME ":" STR ";"
        { $$ = {"name":$1,"subtext":$3,"start":false}; }
    ;
