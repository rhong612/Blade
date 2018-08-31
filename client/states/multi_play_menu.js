

var multiPlayMenuState = {
	create: function() {
		//Show list of players in the lobby
        socket.on('client_waiting_list', function(player_lobby) {
        	game.state.getCurrentState().clearScreen();
	        game.stage.backgroundColor = "#4488AA";
	        let spacing = 50;
        	for (const key in player_lobby) {
        		if (player_lobby[key].username !== username) {
	        		let text = game.add.text(game.world.centerX, game.world.centerY + spacing, player_lobby[key].username, { fontSize: '50px' });
	        		text.anchor.setTo(0.5);
			        text.inputEnabled = true;
			        text.events.onInputDown.add(function() {
			        	socket.emit('challenge', {target: player_lobby[key].username, challenger: username});
        				game.state.getCurrentState().clearScreen();
			        	let waiting_prompt = game.add.text(game.world.centerX, game.world.centerY, "Waiting for player response...", { fontSize: '50px' });
			        	waiting_prompt.anchor.setTo(0.5);
			        	let cancel_btn = game.add.text(game.world.centerX, game.world.centerY + 100, "Cancel", { fontSize: '50px' });
			        	cancel_btn.anchor.setTo(0.5);
			        	cancel_btn.inputEnabled = true;
			        	cancel_btn.events.onInputDown.add(function() {
							socket.emit('join_waiting_list', username);
							socket.emit('join_waiting_list', player_lobby[key].username);
			        	});
			        });
	        		spacing += 50;
        		}
        	}
        });

        socket.on('client_challenge_prompt', function(challenger_username) {
        	game.state.getCurrentState().clearScreen();
        	game.stage.backgroundColor = "#4488AA";
        	let text = game.add.text(game.world.centerX, game.world.centerY, "Challenge from " + challenger_username, { fontSize: '50px' });
	       	text.anchor.setTo(0.5);
			text.inputEnabled = true;

			let acceptBtn = game.add.text(game.world.centerX, game.world.centerY + 100, "Accept", {fontSize: '50px'});
			acceptBtn.anchor.setTo(0.5);
			acceptBtn.inputEnabled = true;
			let declineBtn = game.add.text(game.world.centerX, game.world.centerY - 100, "Decline", {fontSize: '50px'});
			declineBtn.anchor.setTo(0.5);
			declineBtn.inputEnabled = true;

			acceptBtn.events.onInputDown.add(function() {
				socket.emit('join_private_match', [username, challenger_username]);
			});
			declineBtn.events.onInputDown.add(function() {
				socket.emit('join_waiting_list', username);
				socket.emit('join_waiting_list', challenger_username);
			});

        })

        socket.on('receive_hand_multi', function(response) {
        	console.log("Switching state"); 

            hand = response.hand.slice();
            sortedHand = response.sortedHand.slice();
            playerNum = response.playerNum;
        	game.state.start('multi_play', true, false, hand, sortedHand, playerNum);
        })


        socket.emit('join_waiting_list', username);
	},

	shutdown : function() {
        this.world.remove(game.soundSprite);
        this.world.remove(game.muteSprite);
		game.menuBGM.stop();
	},

	clearScreen : function() {
        game.world.removeAll();
        this.add.existing(game.soundSprite);
        this.add.existing(game.muteSprite);
	}
}
