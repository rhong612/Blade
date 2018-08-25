
/**
*  Moves all the initialized card sprites to their initial deck position. Then, plays the hand setup animation.
*/
function playDeckSetupAnimation() {
    const playerDeckSprites = game.state.getCurrentState().playerDeckSprites;
    const enemyDeckSprites = game.state.getCurrentState().enemyDeckSprites;
    const SPEED = 300;
    const DELAY = 100;
    autoMoveGroupTween(playerDeckSprites, PLAYER_DECK_X_LOCATION, playerDeckSprites.getChildAt(0).y, true, SPEED, 0, 0, 0, DELAY, playHandSetupAnimation);
    autoMoveGroupTween(enemyDeckSprites, ENEMY_DECK_X_LOCATION, enemyDeckSprites.getChildAt(0).y, true, SPEED, 0, 0, 0, DELAY);
}



/**
*	Draws starting hands for both players, flips the cards, then plays the sort animation. This function also moves the top 10 sprites from the deck sprites groups to the hand sprites groups.
*/
function playHandSetupAnimation() {
	let playerDeckSprites = game.state.getCurrentState().playerDeckSprites;
	let playerHandSprites = game.state.getCurrentState().playerHandSprites;
	let enemyDeckSprites = game.state.getCurrentState().enemyDeckSprites;
	let enemyHandSprites = game.state.getCurrentState().enemyHandSprites;

	moveTopSprites(playerDeckSprites, playerHandSprites, INITIAL_HAND_SIZE);
	moveTopSprites(enemyDeckSprites, enemyHandSprites, INITIAL_HAND_SIZE);

	const SPEED = 300;
	const DELAY = 100;
	autoMoveGroupTween(playerHandSprites, CARD_WIDTH * CARD_SCALE * 2 + PLAYER_DECK_X_LOCATION, playerHandSprites.getChildAt(0).y, false, SPEED, CARD_WIDTH * CARD_SCALE, 0, 0, DELAY, function() {
		autoFlipGroupTweenMulti(playerHandSprites, game.state.getCurrentState().initialHand, 0, DELAY, playSortAnimation);
	});
	autoMoveGroupTween(enemyHandSprites, ENEMY_DECK_X_LOCATION - CARD_WIDTH * CARD_SCALE * 2, enemyHandSprites.getChildAt(0).y, false, SPEED, -1 * CARD_WIDTH * CARD_SCALE, 0, 0, DELAY);
}



/**
*	Plays the sort animation. Then, plays the spread animation to spread the cards back out.
*/
function playSortAnimation() {
	const SPEED = 300;
	const INITIAL_DELAY = 500;
	const FLIP_DELAY = 300;
	const playerHandSprites = game.state.getCurrentState().playerHandSprites;
	autoMoveGroupTween(playerHandSprites, GAME_WIDTH / 2, playerHandSprites.getChildAt(0).y, false, SPEED, 0, 0, INITIAL_DELAY, 0, function() {
		autoFlipGroupTweenSingle(playerHandSprites, BACK, FLIP_DELAY, 0, function() {
			autoFlipGroupTweenMulti(playerHandSprites, game.state.getCurrentState().sortedInitialHand, FLIP_DELAY, 0, playSpreadAnimation);
		})
	})
}


/**
*	Spreads the cards back out. Then, emits a 'ready' message to the server.
*/
function playSpreadAnimation() {
	const SPEED = 300;
	const DELAY = 100;
	const playerHandSprites = game.state.getCurrentState().playerHandSprites;
	autoMoveGroupTween(playerHandSprites, CARD_WIDTH * CARD_SCALE * 2 + PLAYER_DECK_X_LOCATION, playerHandSprites.getChildAt(0).y, false, SPEED, CARD_WIDTH * CARD_SCALE, 0, DELAY, 0, function() {
		socket.emit('ready');
	});
}




/**
*  Moves the entire group of sprites to a certain position with a delay between each move.
*	@param group - A Phaser group of sprites
*	@param x - the x position to move to
*	@param y - the y position to move to
*	@param speed - the speed of the movement. Defaults to 300.
*	@param play_shuffle - plays a shuffle sound if true. Defaults to false.
*	@param x_buffer - each subsequent sprite will have x_buffer added to the original position. Defaults to 0.
*	@param y_buffer - each subsequent sprite will have y_buffer added to the original position. Defaults to 0.
*	@param initial_delay - the delay before starting the movements. Defaults to 0.
*	@param staggering_delay - the delay between each movement. Defaults to 0.
*	@param func - a function to be called after the animation is done. Defaults to an empty function that does nothing.
*/
function autoMoveGroupTween(group, x, y, play_shuffle=false, speed=300, x_buffer = 0, y_buffer = 0, initial_delay= 0, staggering_delay = 0, func=()=>{}) {
	const tweens = [];
	for (let i = 0; i < group.length; i++) {
		let sprite = group.getChildAt(i);
		tweens.push(moveTween(sprite, x + x_buffer * i, y + y_buffer * i, speed, initial_delay + i * staggering_delay));
		tweens[i].onStart.add(function() {
			sprite.bringToTop();
		});
	}
    tweens[tweens.length - 1].onComplete.add(func);
    startAllTweens(tweens);

    if (play_shuffle) {
    	const shuffleSound = game.add.audio(SHUFFLE_SOUND);
    	shuffleSound.play();
    }
}


function autoFlipGroupTweenSingle(group, new_sprite_name, initial_delay = 0, staggering_delay = 0, func=()=>{}) {
	let tweens = [];
	for (let i = 0; i < group.length; i++) {
		tweens.push(getFlipTween(group.getChildAt(i), new_sprite_name, initial_delay + i * staggering_delay));
	}
	onChainComplete(tweens[tweens.length - 1], func);
	startAllTweens(tweens);
}


function autoFlipGroupTweenMulti(group, new_sprite_names, initial_delay = 0, staggering_delay = 0, func=()=>{}) {
	let tweens = [];
	for (let i = 0; i < group.length; i++) {
		tweens.push(getFlipTween(group.getChildAt(i), new_sprite_names[i], initial_delay + i * staggering_delay));
	}
	onChainComplete(tweens[tweens.length - 1], func);
	startAllTweens(tweens);
}

/**
*	Moves the top sprites from groupA to groupB up to the number specified by count
*	@param groupA - the group to be removed from
*	@param groupB - the destination group
*	@param count - the number of sprites to remove
*/
function moveTopSprites(groupA, groupB, count) {
	for (let i = 0; i < count; i++) {
		let topCard = groupA.getTop();
		groupA.remove(topCard);
		groupB.add(topCard);
	}
}



/**
*	Moves a sprite to a given (x, y) position
*	@param sprite - the sprite to move
*	@param y - the y-coordinate to move to
*	@param speed - the speed of the movement
*	@param delay - the delay in ms before starting the move
*	@returns A Phaser tween. You must call tween.start() to start it
*/
function moveTween(sprite, x, y, speed=400, delay=0) {
	return game.add.tween(sprite).to({x: x, y: y}, speed, Phaser.Easing.Linear.Out, false, delay);
}


function swapFieldTween(func) {
	let playerX = playerFieldSprites.getTop().x;
	let playerY = playerFieldSprites.getTop().y;
	let enemyX = enemyFieldSprites.getTop().x;
	let enemyY = enemyFieldSprites.getTop().y;

	let swapTweens = [];
	const SPEED = 800;
	for (let i = 0; i < playerFieldSprites.length; i++) {
		swapTweens.push(game.add.tween(playerFieldSprites.getChildAt(i)).to({x: enemyX, y: enemyY}, SPEED, Phaser.Easing.Linear.Out, false, 0));
	}
	for (let i = 0; i < enemyFieldSprites.length; i++) {
		swapTweens.push(game.add.tween(enemyFieldSprites.getChildAt(i)).to({x: playerX, y: playerY}, SPEED, Phaser.Easing.Linear.Out, false, 0));
	}

	swapTweens[swapTweens.length - 1].onComplete.add(func);
	return swapTweens;
}

function swapFieldTween(func) {
	let playerX = playerFieldSprites.getTop().x;
	let playerY = playerFieldSprites.getTop().y;
	let enemyX = enemyFieldSprites.getTop().x;
	let enemyY = enemyFieldSprites.getTop().y;

	let swapTweens = [];
	const SPEED = 800;
	for (let i = 0; i < playerFieldSprites.length; i++) {
		swapTweens.push(game.add.tween(playerFieldSprites.getChildAt(i)).to({x: enemyX, y: enemyY}, SPEED, Phaser.Easing.Linear.Out, false, 0));
	}
	for (let i = 0; i < enemyFieldSprites.length; i++) {
		swapTweens.push(game.add.tween(enemyFieldSprites.getChildAt(i)).to({x: playerX, y: playerY}, SPEED, Phaser.Easing.Linear.Out, false, 0));
	}

	swapTweens[swapTweens.length - 1].onComplete.add(func);
	return swapTweens;
}

function playPlayerMirrorAnimation(index, func) {
	const SPEED = 800;
	let sprite = playerHandSprites.getChildAt(index);
	game.world.bringToTop(playerHandSprites);
	playerHandSprites.bringToTop(sprite);
	let tween = game.add.tween(sprite).to({ x: sprite.x, y: sprite.y - 100 }, SPEED, Phaser.Easing.Linear.Out, false, 0);

	let swapTweens = swapFieldTween(function() {
		playerHandSprites.remove(sprite, true); //Remove and destroy
		func();
	});
	tween.onComplete.add(function() {
		startAllTweens(swapTweens);
	});

	tween.start();
}

function playEnemyMirrorAnimation(index, card, func) {
	const SPEED = 800;
	let sprite = enemyHandSprites.getChildAt(index);
	game.world.bringToTop(enemyHandSprites);
	enemyHandSprites.bringToTop(sprite);
	let tween = game.add.tween(sprite).to({ x: sprite.x, y: sprite.y + 100 }, SPEED, Phaser.Easing.Linear.Out, false, 0);
	let flipTween = getFlipTween(sprite, card.name, 0);

	let swapTweens = swapFieldTween(function() {
		enemyHandSprites.remove(sprite, true); //Remove and destroy
		func();
	});
	tween.onComplete.add(function() {
		startAllTweens(swapTweens);
	});

	tween.start();
	flipTween.start();
}

function playPlayerWandAnimation(index, func) {
	if (playerFieldSprites.getTop().key === BACK) {
		const SPEED = 800;
		let sprite = playerHandSprites.getChildAt(index);
		game.world.bringToTop(playerHandSprites);
		playerHandSprites.bringToTop(sprite);
		let tween = game.add.tween(sprite).to({ x: sprite.x, y: sprite.y - 100 }, SPEED, Phaser.Easing.Linear.Out, false, 0);
		endOfChain(tween, getFlipTween(playerFieldSprites.getTop(), playerFieldSprites.getTop().name, 0));
		onChainComplete(tween, function() {
			playerHandSprites.remove(sprite, true); //Remove and destroy
			func();
		});
		tween.start();
	}
	else {
		playPlayerActivateAnimation(index, func);
	}
}

function playEnemyWandAnimation(index, card, func) {
	if (enemyFieldSprites.getTop().key === BACK) {
		const SPEED = 800;
		let sprite = enemyHandSprites.getChildAt(index);
		game.world.bringToTop(enemyHandSprites);
		enemyHandSprites.bringToTop(sprite);
		let tween = game.add.tween(sprite).to({ x: sprite.x, y: sprite.y + 100 }, SPEED, Phaser.Easing.Linear.Out, false, 0);
		let flipTween = getFlipTween(sprite, card.name, 0);
		endOfChain(tween, getFlipTween(enemyFieldSprites.getTop(), enemyFieldSprites.getTop().name, 0));
		onChainComplete(tween, function() {
			enemyHandSprites.remove(sprite, true); //Remove and destroy
			func();
		});
		tween.start();
		flipTween.start();
	}
	else {
		playEnemyActivateAnimation(index, card, func);
	}
}


function playPlayerBoltAnimation(index, func) {
	const SPEED = 800;
	let sprite = playerHandSprites.getChildAt(index);
	game.world.bringToTop(playerHandSprites);
	playerHandSprites.bringToTop(sprite);
	let tween = game.add.tween(sprite).to({ x: sprite.x, y: sprite.y - 100 }, SPEED, Phaser.Easing.Linear.Out, false, 0);
	endOfChain(tween, getFlipTween(enemyFieldSprites.getTop(), BACK, 0));
	onChainComplete(tween, function() {
		playerHandSprites.remove(sprite, true); //Remove and destroy
		func();
	});
	tween.start();
}
function playEnemyBoltAnimation(index, card, func) {
	const SPEED = 800;
	let sprite = enemyHandSprites.getChildAt(index);
	game.world.bringToTop(enemyHandSprites);
	enemyHandSprites.bringToTop(sprite);
	let tween = game.add.tween(sprite).to({ x: sprite.x, y: sprite.y + 100 }, SPEED, Phaser.Easing.Linear.Out, false, 0);
	let flipTween = getFlipTween(sprite, card.name, 0);
	endOfChain(tween, getFlipTween(playerFieldSprites.getTop(), BACK, 0));
	onChainComplete(tween, function() {
		enemyHandSprites.remove(sprite, true); //Remove and destroy
		func();
	});
	tween.start();
	flipTween.start();
}

function playPlayerActivateAnimation(index, func = function() {}) {
	const SPEED = 400;
	let sprite = playerHandSprites.getChildAt(index);
	game.world.bringToTop(playerHandSprites);
	playerHandSprites.bringToTop(sprite);
	let tween = game.add.tween(sprite).to({ x: GAME_WIDTH - (2 * CARD_WIDTH), y: (GAME_HEIGHT - (CARD_HEIGHT * CARD_SCALE * ANCHOR * 4)) }, SPEED, Phaser.Easing.Linear.Out, false, 0);
	tween.onComplete.add(function() {
		playerHandSprites.removeChild(sprite);
		playerFieldSprites.add(sprite);
		func();
	});
	tween.start();
}

function playEnemyActivateAnimation(index, card, func) {
	const SPEED = 400;
	let sprite = enemyHandSprites.getChildAt(index);
	game.world.bringToTop(enemyHandSprites);
	enemyHandSprites.bringToTop(sprite);
	let tween = game.add.tween(sprite).to({ x: CARD_WIDTH * 2, y: CARD_HEIGHT * CARD_SCALE * ANCHOR * 4}, SPEED, Phaser.Easing.Linear.Out, false, 0);
	let flipTween = getFlipTween(sprite, card.name, 0);
	tween.onComplete.add(function() {
		enemyHandSprites.removeChild(sprite);
		enemyFieldSprites.add(sprite);
		func();
	});
	tween.start();
	flipTween.start();
}

function dumpField(func) {
	if (playerFieldSprites.length >= 1) {
		let tweens = [];
		tweens.push(dumpPlayerCardAnimation(playerFieldSprites.getChildAt(0), 0));
		for (let i = 1; i < playerFieldSprites.length; i++) {
			tweens.push(dumpPlayerCardAnimation(playerFieldSprites.getChildAt(i), 0));
		}

		for (let i = 0; i < enemyFieldSprites.length; i++) {
			tweens.push(dumpEnemyCardAnimation(enemyFieldSprites.getChildAt(i), 0));
		}

		onChainComplete(tweens[tweens.length - 1], function() {
			playerFieldSprites.removeAll(true);
			enemyFieldSprites.removeAll(true);
			func();
		});
		startAllTweens(tweens);
	}
	else {
		func();
	}
}


/**
*	Draws the specified number of cards given by the server. Dumps cards when necessary.
*/
function playDrawAnimation() {
	console.log('Current deck index:' + currentDeckIndex);
	game.world.bringToTop(playerDeckSprites);
	game.world.bringToTop(enemyDeckSprites);
	const DELAY = 300;
    let playerTween = drawPlayerCardAnimation(playerDeckSprites.getChildAt(currentDeckIndex), DELAY); 
    let enemyTween = drawEnemyCardAnimation(enemyDeckSprites.getChildAt(currentDeckIndex), DELAY);
    endOfChain(playerTween, getFlipTween(playerDeckSprites.getChildAt(currentDeckIndex), playerDraw[0].name, 0));
    endOfChain(enemyTween, getFlipTween(enemyDeckSprites.getChildAt(currentDeckIndex), enemyDraw[0].name, 0));

    for (let i = 1; i < playerDraw.length; i++) {
        endOfChain(playerTween, dumpPlayerCardAnimation(playerDeckSprites.getChildAt(currentDeckIndex)));
        endOfChain(enemyTween, dumpEnemyCardAnimation(enemyDeckSprites.getChildAt(currentDeckIndex)));
    	playerDeckSprites.removeChildAt(currentDeckIndex); //Remove from deck
    	enemyDeckSprites.removeChildAt(currentDeckIndex); //Remove from deck

        currentDeckIndex--;
		console.log('Current deck index:' + currentDeckIndex);
        endOfChain(playerTween, drawPlayerCardAnimation(playerDeckSprites.getChildAt(currentDeckIndex)));
        endOfChain(enemyTween, drawEnemyCardAnimation(enemyDeckSprites.getChildAt(currentDeckIndex)));

        endOfChain(playerTween, getFlipTween(playerDeckSprites.getChildAt(currentDeckIndex), playerDraw[i].name, 0));
        endOfChain(enemyTween, getFlipTween(enemyDeckSprites.getChildAt(currentDeckIndex), enemyDraw[i].name, 0));
    	playerDeckSprites.getChildAt(currentDeckIndex).name = playerDraw[i].name;
    	enemyDeckSprites.getChildAt(currentDeckIndex).name = enemyDraw[i].name;
    }

    onChainComplete(playerTween, function() {
    	//The last drawn cards go to the field
    	let playerSprite = playerDeckSprites.removeChildAt(currentDeckIndex);
    	let enemySprite = enemyDeckSprites.removeChildAt(currentDeckIndex);
    	playerFieldSprites.add(playerSprite);
    	enemyFieldSprites.add(enemySprite);
    	currentDeckIndex--;
    	startTurn();
    });

    playerDraw = [];
    enemyDraw = [];
    playerTween.start();
    enemyTween.start();
}

function showReturnButton() {
    let image = game.add.image(0, game.world.centerX, RETURN_BUTTON);
    image.inputEnabled = true;
    image.events.onInputDown.add(function() {
    	socket.emit('leave_game');
        game.state.start('menu');
    });
}

function resetConn() {
	socket.removeAllListeners();
	setupConn();
}

function startTurn() {
	playerScoreText.setText(playerScore);
	enemyScoreText.setText(enemyScore);
	if (gameover) {
		if (winner === playerNum) {
			waitingText.setText("You win!");
			resetConn();
			showReturnButton();
		}
		else {
			waitingText.setText("You lose!");
			resetConn();
			showReturnButton();
		}
	}
	else if (turn === playerNum) {
    	waitingText.setText("");
    	//Can click on cards
    	for (let i = 0; i < playerHandSprites.length; i++) {
    		let sprite = playerHandSprites.getChildAt(i);
    		sprite.inputEnabled = true;
    		sprite.events.onInputDown.add(function() {
		    	for (let j = 0; j < playerHandSprites.length; j++) {
		    		let s = playerHandSprites.getChildAt(j);
		    		s.events.onInputDown.removeAll();
		    		s.events.onInputOver.removeAll();
		    		s.events.onInputOut.removeAll();
		    		s.alpha = 1.0;
		    	}
    			playerHandSprites.setAll('inputEnabled', false);
    			socket.emit('server_play_card', i);
    		});
       		sprite.events.onInputOver.add(sprite => sprite.alpha = 0.5, this);
        	sprite.events.onInputOut.add(sprite => sprite.alpha = 1.0, this);
    	}
    }
    else {
    	waitingText.setText("Waiting for other player...");
    }

}

function getFlipTween(sprite, newCard, delay) {
	const FLIP_SPEED = 200;
    let flipTween = game.add.tween(sprite.scale).to({
        x: 0,
        y: CARD_SCALE * 1.2 //Expand y to give the flip a slight "3d" effect
    }, FLIP_SPEED, Phaser.Easing.Linear.None, false, delay);

    let flipTween2 = game.add.tween(sprite.scale).to({
        x: CARD_SCALE,
        y: CARD_SCALE
    }, FLIP_SPEED, Phaser.Easing.Linear.None, false);

    flipTween.onComplete.add(function() {
        sprite.loadTexture(newCard);
    });
    flipTween.chain(flipTween2);

    if (newCard !== BACK) {
    	sprite.name = newCard; //Set the cards name property for wand/bolt
    }
    return flipTween;
}

function cardSort() {
	hand = sortedHand;
}

function startAllTweens(tweens_array) {
	for (let i = 0; i < tweens_array.length; i++) {
		tweens_array[i].start();
	}
}


function drawPlayerCardAnimation(sprite, delay = 0) {
    const SPEED = 400;
    return game.add.tween(sprite).to({ x: GAME_WIDTH - (2 * CARD_WIDTH), y: (GAME_HEIGHT - (CARD_HEIGHT * CARD_SCALE * ANCHOR * 4)) }, SPEED, Phaser.Easing.Linear.Out, false, delay);
}

function drawEnemyCardAnimation(sprite, delay = 0) {
    const SPEED = 400;
    return game.add.tween(sprite).to({ x: CARD_WIDTH * 2, y: CARD_HEIGHT * CARD_SCALE * ANCHOR * 4}, SPEED, Phaser.Easing.Linear.Out, false, delay);
}

function dumpPlayerCardAnimation(sprite, delay) {
    const SPEED = 400;
    const DELAY = 1500;
    return game.add.tween(sprite).to({x: GAME_WIDTH + CARD_WIDTH }, SPEED, Phaser.Easing.Linear.Out, false, DELAY);
}

function dumpEnemyCardAnimation(sprite, delay) {
    const SPEED = 400;
    const DELAY = 1500;
    return game.add.tween(sprite).to({x: -1 * CARD_WIDTH }, SPEED, Phaser.Easing.Linear.Out, false, DELAY);
}


function endOfChain(chain, newTween) {
    let end = chain;
    while (end.chainedTween != undefined) {
        end = end.chainedTween;
    }
    end.chain(newTween);
}

function onChainComplete(chain, func) {
    let end = chain;
    while (end.chainedTween != undefined) {
        end = end.chainedTween;
    }
    end.onComplete.add(func);
}