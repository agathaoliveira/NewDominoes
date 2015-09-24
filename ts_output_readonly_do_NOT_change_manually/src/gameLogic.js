var Tile = (function () {
    function Tile(left, right) {
        this.leftNumber = left;
        this.rightNumber = right;
        this.isDouble = left === right;
        this.validForTiles = [false, false, false, false, false, false];
        this.validForTiles[left] = true;
        this.validForTiles[right] = true;
    }
    return Tile;
})();
var Board = (function () {
    function Board() {
    }
    Board.prototype.setRoot = function (tile) {
        this.root = tile;
        this.leftMost = tile;
        this.rightMost = tile;
    };
    return Board;
})();
var Play;
(function (Play) {
    Play[Play["LEFT"] = 0] = "LEFT";
    Play[Play["RIGHT"] = 1] = "RIGHT";
    Play[Play["CENTER"] = 2] = "CENTER";
    Play[Play["BUY"] = 3] = "BUY";
})(Play || (Play = {}));
var BoardDelta = (function () {
    function BoardDelta() {
    }
    return BoardDelta;
})();
var Player = (function () {
    function Player(playerId) {
        this.id = playerId;
    }
    Player.prototype.addTileToHand = function (tile) {
        this.hand[this.hand.length] = tile;
    };
    Player.prototype.removeTileFromHand = function (tile) {
        var index = this.hand.indexOf(tile, 0);
        if (index != undefined) {
            this.hand.splice(index, 1);
        }
        else {
            throw new Error("Player " + this.id + " does not have tile " + tile.leftNumber + "|" + tile.rightNumber);
        }
    };
    Player.prototype.getNumberOfRemainingTiles = function () {
        return this.hand.length;
    };
    Player.prototype.hasTileWithNumbers = function (firstNumber, secondNumber) {
        for (var i = 0; i < this.hand.length; i++) {
            if (this.hand[i].validForTiles[firstNumber] || this.hand[i].validForTiles[secondNumber]) {
                return true;
            }
        }
        return false;
    };
    return Player;
})();
var gameLogic;
(function (gameLogic) {
    function getInitialBoard() {
        return new Board();
    }
    gameLogic.getInitialBoard = getInitialBoard;
    function getWinner(tile, currentPlayer) {
        currentPlayer.removeTileFromHand(tile);
        if (currentPlayer.getNumberOfRemainingTiles() === 0) {
            return currentPlayer.id;
        }
        return undefined;
    }
    function isTie(board, players, house) {
        var leftTile = board.leftMost;
        var rightTile = board.rightMost;
        if (house.hasTileWithNumbers(board.leftMost.leftNumber, board.rightMost.rightNumber)) {
            return false;
        }
        for (var i = 0; i < players.length; i++) {
            if (players[i].hasTileWithNumbers(board.leftMost.leftNumber, board.rightMost.rightNumber)) {
                return false;
            }
        }
        return true;
    }
    /**
    * Returns the move that should be performed when player
    * with index turnIndexBeforeMove makes adds a domino to the board.
    */
    function createMove(board, tile, play, turnIndexBeforeMove, players, house) {
        if (!board) {
            // Initially (at the beginning of the match), the board in state is undefined.
            board = getInitialBoard();
        }
        var boardAfterMove = angular.copy(board);
        if (!board.root) {
            if (play !== Play.CENTER) {
                throw new Error("One cannot make a non center play in a board with no first tile!");
            }
            boardAfterMove.setRoot(tile);
            players[turnIndexBeforeMove].removeTileFromHand(tile);
        }
        else {
            if (!board.leftMost || !board.rightMost) {
                throw new Error("One cannot make a move in a board with no pieces on the left or right sides!");
            }
            if (Play.LEFT === play) {
                boardAfterMove.leftMost.leftChild = tile;
                boardAfterMove.leftMost = tile;
            }
            else if (Play.RIGHT === play) {
                boardAfterMove.rightMost.rightChild = tile;
                boardAfterMove.rightMost = tile;
            }
            else if (Play.BUY === play) {
                if (house.getNumberOfRemainingTiles() === 0) {
                    throw new Error("One cannot buy from the house when it has no tiles");
                }
                var tile = house.hand[Math.floor(Math.random() * house.hand.length)];
                house.removeTileFromHand(tile);
                players[turnIndexBeforeMove].addTileToHand(tile);
            }
            else {
                throw new Error("One cannot make a center move on a board that already has a tile");
            }
        }
        var winner = getWinner(tile, players[turnIndexBeforeMove]);
        var firstOperation;
        if (!winner || isTie(boardAfterMove, players, house)) {
            // Game over.
            firstOperation = { endMatch: { endMatchScores: winner ? [winner] : [-1] } };
        }
        else {
            // Game continues. Now it's the opponent's turn (the turn switches from 0 to 1 and 1 to 0).
            firstOperation = { setTurn: { turnIndex: 1 - turnIndexBeforeMove } };
        }
        var delta = { tile: tile, play: play };
        return [firstOperation,
            { set: { key: 'board', value: boardAfterMove } },
            { set: { key: 'delta', value: delta } }];
    }
    gameLogic.createMove = createMove;
    function isMoveOk(params) {
        var move = params.move;
        var turnIndexBeforeMove = params.turnIndexBeforeMove;
        var stateBeforeMove = params.stateBeforeMove;
        // The state and turn after move are not needed in dominoes
        //var turnIndexAfterMove = params.turnIndexAfterMove;
        //var stateAfterMove = params.stateAfterMove;
        // We can assume that turnIndexBeforeMove and stateBeforeMove are legal, and we need
        // to verify that move is legal.
        try {
            var deltaValue = move[2].set.value;
            var tile = deltaValue.tile;
            var play = deltaValue.play;
            var board = stateBeforeMove.board;
            var players = stateBeforeMove.players;
            var house = stateBeforeMove.house;
            var expectedMove = createMove(board, tile, play, turnIndexBeforeMove, players, house);
            if (!angular.equals(move, expectedMove)) {
                return false;
            }
        }
        catch (e) {
            // if there are any exceptions then the move is illegal
            return false;
        }
        return true;
    }
    gameLogic.isMoveOk = isMoveOk;
})(gameLogic || (gameLogic = {}));
