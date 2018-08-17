//Boilerplate
const express = require('express');
const app = express();
const http = require('http').Server(app); //Creates a server and passes in app as the request handler
const io = require('socket.io')(http);


const current_ongoing_games = [];

const player_lobby = {};

const cards_list = require('./cards');

const active_players = {};

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});


http.listen(3000, function() {
	console.log("Listening on port 3000...");
}); //Listen on port 3000

app.use(express.static(__dirname + '/client'));

io.on('connection', function(socket) {
	console.log("A user has connected.");

	createGuest(socket);

	socket.on('disconnect', removePlayer);

	socket.on('start_single_game', createSingleGame);

	socket.on('join_waiting_list', joinWaitingList);

	socket.on('challenge', function(names) {
		for (let id in player_lobby) {
			let username = player_lobby[id].username;
			if (username === names.target) {
				this.leave('waiting_room');
				io.sockets.connected[id].leave('waiting_room');
				delete player_lobby[this.id];
				delete player_lobby[id];
				io.to(id).emit('client_challenge_prompt', names.challenger);
				refreshWaitingList();
				break;
			}
		}


	});
});

function joinWaitingList() {
	this.join('waiting_room');
	player_lobby[this.id] = active_players[this.id];
	refreshWaitingList();
}

function refreshWaitingList() {
	io.in('waiting_room').emit('client_waiting_list', player_lobby);
}

function createGuest(socket) {
	var username = 'guest' + new Date().valueOf();
	active_players[socket.id] = new Player(username);
	socket.emit('display_name', username);

	updatePlayerList();
}

function removePlayer() {
	console.log('A user has disconnected.');
	delete active_players[this.id];
	delete player_lobby[this.id];

	updatePlayerList();
	refreshWaitingList();
}

function updatePlayerList() {
	const username_list = [];
	for (const player in active_players) {
		username_list.push(active_players[player].username);
	}
	io.emit('update_players', username_list);
}

function createSingleGame() {
	var gameID = current_ongoing_games.length;
	var newGame = new SingleGame(gameID);
	current_ongoing_games.push(newGame);
	active_players[this.id].currentGame = gameID;

	newGame.playerDeck = initializeDeck();
	shuffleDeck(newGame.playerDeck);
	newGame.enemyDeck = initializeDeck();
	shuffleDeck(newGame.enemyDeck);

	newGame.playerHand = newGame.playerDeck.splice(0, 10);
	let unsortedHand = newGame.playerHand;
	newGame.enemyHand = newGame.enemyDeck.splice(0, 10);
	newGame.sortPlayerHand();
	newGame.sortEnemyHand();

	//var draw = newGame.draw();
	var draw = {playerDraw: [cards_list.BOLT, cards_list.BOLT], enemyDraw: [cards_list.BOLT, cards_list.WAND]}; //For testing purposes

	this.emit('receive_hand', {hand: unsortedHand, sortedHand: newGame.playerHand, playerDraw: draw.playerDraw, enemyDraw: draw.enemyDraw});
}


function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}


function initializeDeck() {
	const deck = [];
	for (let i = 0; i < 6; i++) {
		deck.push(cards_list.BOLT);
	}
	for (let i = 0; i < 2; i++) {
		deck.push(cards_list.BLAST);
	}
	for (let i = 0; i < 2; i++) {
		deck.push(cards_list.FORCE);
	}
	for (let i = 0; i < 2; i++) {
		deck.push(cards_list.SEVEN_CARD);
	}
	for (let i = 0; i < 3; i++) {
		deck.push(cards_list.SIX_CARD);
	}
	for (let i = 0; i < 4; i++) {
		deck.push(cards_list.FIVE_CARD);
	}
	for (let i = 0; i < 4; i++) {
		deck.push(cards_list.FOUR_CARD);
	}
	for (let i = 0; i < 4; i++) {
		deck.push(cards_list.THREE_CARD);
	}
	for (let i = 0; i < 3; i++) {
		deck.push(cards_list.TWO_CARD);
	}
	for (let i = 0; i < 2; i++) {
		deck.push(cards_list.WAND);
	}
	return deck;
}


const NO_GAME = -1;
class Player {
	constructor(username) {
		this.username = username;
		this.currentGame = NO_GAME;
	}
}

class SingleGame {
	constructor(gameID) {
		this.gameID = gameID;
		this.playerDeck = null;
		this.playerHand = null;
		this.playerScore = 0;
		this.enemyDeck = null;
		this.enemyHand = null;
		this.enemyScore = 0;
		this.playerField = [];
		this.enemyField = [];
	}

	draw() {
		let playerDraw = [];
		let enemyDraw = [];
		let i = 0;
		while (this.playerDeck.length > 0) {
			playerDraw.push(this.playerDeck.shift());
			enemyDraw.push(this.enemyDeck.shift());

			if (playerDraw[i] != enemyDraw[i]) {
				this.playerField.push(playerDraw[i]);
				this.enemyField.push(enemyDraw[i]);
				break;
			}

			i++;
		}
		return {playerDraw: playerDraw, enemyDraw: enemyDraw};
	}

	sortPlayerHand() {
		
	}

	sortEnemyHand() {

	}
}