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
    Play[Play["WIN"] = 4] = "WIN";
    Play[Play["STAND_OFF"] = 5] = "STAND_OFF";
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
    function getTile(tileIndex) {
        var i, j, k;
        k = 0;
        for (i = 0; i < 7; i++) {
            for (j = 0; j <= i; j++) {
                if (k == tileIndex) {
                    return new Tile(j, i);
                }
                k++;
            }
        }
    }
    gameLogic.getTile = getTile;
    function getInitialBoard() {
        return new Board();
    }
    gameLogic.getInitialBoard = getInitialBoard;
    function getInitialMove() {
        var operations = [], player0 = new Player(0), player1 = new Player(1), setTiles = [], setVisibilities = [], shuffleKeys = [], i, j, k;
        k = 0;
        for (i = 0; i < 7; i++) {
            for (j = 0; j <= i; j++) {
                var currentTile = new Tile(j, i);
                setTiles[k] = { set: { key: 'tile' + currentTile.leftNumber + currentTile.rightNumber, value: currentTile } };
                if (k < 7) {
                    player0.hand[k] = currentTile;
                    setVisibilities[k] = { setVisibility: { key: 'tile' + currentTile.leftNumber + currentTile.rightNumber, visibleToPlayerIndexes: [0] } };
                }
                else if (k < 14) {
                    player1.hand[k - 7] = currentTile;
                    setVisibilities[k] = { setVisibility: { key: 'tile' + currentTile.leftNumber + currentTile.rightNumber, visibleToPlayerIndexes: [1] } };
                }
                else {
                    setVisibilities[k] = { setVisibility: { key: 'tile' + currentTile.leftNumber + currentTile.rightNumber, visibleToPlayerIndexes: [] } };
                }
                shuffleKeys[k] = 'tile' + currentTile.leftNumber + currentTile.rightNumber;
                k++;
            }
        }
        operations.selfConcat([{ setTurn: { turnIndex: 0 } }]);
        operations.selfConcat([{ set: { key: 'player0', value: player0 } }]);
        operations.selfConcat([{ set: { key: 'player1', value: player1 } }]);
        operations.selfConcat([{ set: { key: 'board', value: getInitialBoard() } }]);
        operations.selfConcat([{ set: { key: 'house', value: new Player(-1) } }]);
        operations.selfConcat(setTiles);
        operations.selfConcat([{ shuffle: { keys: shuffleKeys } }]);
        operations.selfConcat(setVisibilities);
        return operations;
    }
    gameLogic.getInitialMove = getInitialMove;
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
    function createMove(board, playedTile, play, turnIndexBeforeMove, players, house) {
        var operations = [], setVisibilities = [], boardAfterMove, playerAfterMove, houseAfterMove;
        boardAfterMove = angular.copy(board);
        playerAfterMove = angular.copy(players[turnIndexBeforeMove]);
        houseAfterMove = angular.copy(house);
        if (play == Play.CENTER) {
            if (board.root) {
                throw new Error("One cannot make a non center play in a board that already has the first tile!");
            }
            boardAfterMove.setRoot(playedTile);
            playerAfterMove.removeTileFromHand(playedTile);
            setVisibilities.selfConcat([{ setVisibility: { key: 'tile' + playedTile.leftNumber + playedTile.rightNumber, visibleToPlayerIndexes: [] } }]);
            operations.selfConcat([{ setTurn: { turnIndex: 1 - turnIndexBeforeMove } }]);
            operations.selfConcat([{ set: { key: 'player' + turnIndexBeforeMove, value: playerAfterMove } }]);
            operations.selfConcat([{ set: { key: 'board', value: boardAfterMove } }]);
            operations.selfConcat(setVisibilities);
            return operations;
        }
        else {
            if (!board.leftMost || !board.rightMost) {
                throw new Error("One cannot make a move in a board with no pieces on the left or right sides!");
            }
            if (Play.LEFT === play) {
                boardAfterMove.leftMost.leftChild = playedTile;
                boardAfterMove.leftMost = playedTile;
                playerAfterMove.removeTileFromHand(playedTile);
                setVisibilities.selfConcat([{ setVisibility: { key: 'tile' + playedTile.leftNumber + playedTile.rightNumber, visibleToPlayerIndexes: [] } }]);
                operations.selfConcat([{ setTurn: { turnIndex: 1 - turnIndexBeforeMove } }]);
                operations.selfConcat([{ set: { key: 'player' + turnIndexBeforeMove, value: playerAfterMove } }]);
                operations.selfConcat([{ set: { key: 'board', value: boardAfterMove } }]);
                operations.selfConcat(setVisibilities);
                return operations;
            }
            else if (Play.RIGHT === play) {
                boardAfterMove.rightMost.rightChild = playedTile;
                boardAfterMove.rightMost = playedTile;
                playerAfterMove.removeTileFromHand(playedTile);
                setVisibilities.selfConcat([{ setVisibility: { key: 'tile' + playedTile.leftNumber + playedTile.rightNumber, visibleToPlayerIndexes: [] } }]);
                operations.selfConcat([{ setTurn: { turnIndex: 1 - turnIndexBeforeMove } }]);
                operations.selfConcat([{ set: { key: 'player' + turnIndexBeforeMove, value: playerAfterMove } }]);
                operations.selfConcat([{ set: { key: 'board', value: boardAfterMove } }]);
                operations.selfConcat(setVisibilities);
                return operations;
            }
            else if (Play.BUY === play) {
                if (house.getNumberOfRemainingTiles() === 0) {
                    throw new Error("One cannot buy from the house when it has no tiles");
                }
                houseAfterMove.removeTileFromHand(playedTile);
                playerAfterMove.addTileToHand(playedTile);
                setVisibilities.selfConcat([{ setVisibility: { key: 'tile' + playedTile.leftNumber + playedTile.rightNumber, visibleToPlayerIndexes: [turnIndexBeforeMove] } }]);
                operations.selfConcat([{ setTurn: { turnIndex: turnIndexBeforeMove } }]);
                operations.selfConcat([{ set: { key: 'player' + turnIndexBeforeMove, value: players[turnIndexBeforeMove] } }]);
                operations.selfConcat([{ set: { key: 'house', value: house } }]);
                operations.selfConcat(setVisibilities);
                return operations;
            }
            else if (Play.WIN === play) {
                var winner = getWinner(playedTile, players[turnIndexBeforeMove]);
                if (winner === 0) {
                    operations.selfConcat([{ endMatch: { endMatchScores: [1, 0] } }]);
                }
                else if (winner === 1) {
                    operations.selfConcat([{ endMatch: { endMatchScores: [0, 1] } }]);
                }
                return operations;
            }
            else if (Play.STAND_OFF === play) {
                if (isTie(board, players, house)) {
                    operations.selfConcat([{ endMatch: { endMatchScores: [0, 0] } }]);
                    return operations;
                }
                else {
                    throw new Error("There are still plays left. Cannot be a stand off");
                }
            }
            else {
                throw new Error("Unknown play");
            }
        }
    }
    gameLogic.createMove = createMove;
    /**
       * Check if the move is OK.
       *
       * @param params the match info which contains stateBeforeMove,
       *              stateAfterMove, turnIndexBeforeMove, turnIndexAfterMove,
       *              move.
       * @returns return true if the move is ok, otherwise false.
       */
    function isMoveOk(params) {
        var move = params.move;
        var turnIndexBeforeMove = params.turnIndexBeforeMove;
        var stateBeforeMove = params.stateBeforeMove;
        /*********************************************************************
        * 1. If the stateBeforeMove is empty, then it should be the first
        *    move. Set the board of stateBeforeMove to be the initial board.
        *    If the stateBeforeMove is not empty, then the board should have
        *    one or more dominoes.
        ********************************************************************/
        try {
            var expectedMove;
            if (!params.stateBeforeMove) {
                expectedMove = getInitialMove();
            }
            else {
                var deltaValue = move[2].set.value;
                var playedTile = deltaValue.tile;
                var play = deltaValue.play;
                var players = stateBeforeMove.players;
                var house = stateBeforeMove.house;
                expectedMove = createMove(stateBeforeMove.board, playedTile, play, turnIndexBeforeMove, players, house);
            }
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
