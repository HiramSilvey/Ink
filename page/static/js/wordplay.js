function init_app() { 
    new Vue({
	el: '#wordplayapp',
	data: function() {
	    return {
		history: [],
		game_src: `room is "a palatial room"
room property furnishings can be empty "so very sad and empty"
room property furnishings can be kingly "like a king"
room property furnishings is empty
room can upgrade "" if "room property furnishings is empty" then "room change furnishings to kingly" 
throne is "a stately throne"
ball is "a beautiful blue bouncy ball"
player property status can be pauper "An ordinary guy"
player property status can be king "KING ME"
player can sing "" then "describe 'Your beautiful voice bounces off the walls like a ball'"
player can dance "" then "player get ball" "describe 'You are having a ball!'"
player can throw ball if "player has ball" then "room get throne" "describe 'The ball is throne!'" "room do upgrade ''"
player can drop ball if "player has ball" then "player drop ball" "room get ball"
player can sit throne if "room has throne" then "player change status to king"
room has player
win "You are king! YOU WIN!" if "player property status is king"
lose "That doesn't go with the decor at all! YOU LOSE!" if "room has ball"`,
		command: "Enter command here"
	    };
	    
	},
	mounted: function(){
	    this.run_game();
	},
	methods: {
	    get_history() {
		return this.history.join("\n");
	    },
	    run_game() {
		this.history = [];
		this.command = "";
		var self = this;
		InkSetGame(this.game_src, function() {
		    self.history = [">>> ready"];
		});
	    },
	    run_cmd() {
		this.history.push("> "+this.command);
		var self = this;
		var cmd = self.command;
		console.log(cmd)
		InkRunCommand(cmd, function(aftermath) {
		    self.history.push(aftermath);
		    console.log("got",aftermath);
		});
		this.$nextTick(function(){
		    var container = this.$el.querySelector("#history_display");
		    container.scrollTop = container.scrollHeight;
		});
		this.command = "";
	    }
	}
	
    });
}
