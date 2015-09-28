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
        this.tiles = [];
    }
    Board.prototype.setRoot = function (tileId) {
        this.tiles[0] = tileId;
        //Initialize right and left ot hte root
        this.rightMost = 0;
        this.leftMost = 0;
    };
    Board.prototype.addRightChild = function (tileId) {
        this.tiles[2 * this.rightMost + 2] = tileId; //the right child of the current right title is at index 2 * i + 2. Initialize it to title with index playedTileId
        this.rightMost = 2 * this.rightMost + 2;
    };
    Board.prototype.addLeftChild = function (tileId) {
        this.tiles[2 * this.leftMost + 1] = tileId; //the left child of the current left title is at index 2 * i + 1. Initialize it to title with index playedTileId
        this.leftMost = 2 * this.leftMost + 1;
    };
    Board.prototype.containsTile = function (tileId) {
        var index = this.tiles.indexOf(tileId);
        if (index) {
            return true;
        }
        return false;
    };
    return Board;
})();
var Play;
(function (Play) {
    Play[Play["LEFT"] = 0] = "LEFT";
    Play[Play["RIGHT"] = 1] = "RIGHT";
    Play[Play["BUY"] = 2] = "BUY";
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
        this.hand.push(tile);
    };
    Player.prototype.removeTileFromHand = function (tile) {
        var index = this.hand.indexOf(tile, 0);
        if (index != undefined) {
            this.hand.splice(index, 1);
        }
        else {
            throw new Error("Unknown array element " + tile);
        }
    };
    Player.prototype.getNumberOfRemainingTiles = function () {
        return this.hand.length;
    };
    return Player;
})();
var gameLogic;
(function (gameLogic) {
    function getTile(tileId) {
        var i, j, k;
        k = 0;
        for (i = 0; i < 7; i++) {
            for (j = 0; j <= i; j++) {
                if (k == tileId) {
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
        var operations = [], player0 = new Player(0), player1 = new Player(1), house = new Player(-1), setTiles = [], setVisibilities = [], shuffleKeys = { keys: [] }, i, j, k;
        k = 0;
        for (i = 0; i < 7; i++) {
            for (j = 0; j <= i; j++) {
                var currentTile = new Tile(j, i);
                if (k < 7) {
                    player0.hand[k] = k;
                    setTiles[k] = { key: 'tile' + k, value: currentTile, visibleToPlayerIndexes: [0] };
                }
                else if (k < 14) {
                    player1.hand[k - 7] = k;
                    setTiles[k] = { key: 'tile' + k, value: currentTile, visibleToPlayerIndexes: [1] };
                }
                else {
                    house.hand[k - 14] = k;
                    setTiles[k] = { key: 'tile' + k, value: currentTile, visibleToPlayerIndexes: [] };
                }
                shuffleKeys.keys.push('tile' + k);
                k++;
            }
        }
        operations.concat([{ setTurn: { turnIndex: 0 } }]);
        operations.concat([{ set: { key: 'player0', value: player0 } }]);
        operations.concat([{ set: { key: 'player1', value: player1 } }]);
        operations.concat([{ set: { key: 'house', value: house } }]);
        operations.concat([{ set: { key: 'board', value: getInitialBoard() } }]);
        operations.concat(setTiles);
        operations.concat([{ shuffle: { keys: shuffleKeys } }]);
        operations.concat(setVisibilities);
        return operations;
    }
    gameLogic.getInitialMove = getInitialMove;
    function getWinner(playedTileId, currentPlayer) {
        currentPlayer.removeTileFromHand(playedTileId);
        if (currentPlayer.getNumberOfRemainingTiles() === 0) {
            return currentPlayer.id;
        }
        return undefined;
    }
    /*function isTie(board: Board, players: Player[], house: Player): boolean{
      var leftTile: Tile = board.leftMost;
      var rightTile: Tile = board.rightMost;
  
      if (house.hasTileWithNumbers(board.leftMost.leftNumber, board.rightMost.rightNumber))
      {
        return false;
      }
  
      for(var i = 0; i < players.length; i++)
      {
        if (players[i].hasTileWithNumbers(board.leftMost.leftNumber, board.rightMost.rightNumber))
        {
          return false;
        }
      }
  
      return true;
    }*/
    /**
    * Returns the move that should be performed when player
    * with index turnIndexBeforeMove makes adds a domino to the board.
    */
    function createMove(board, playedTileId, play, turnIndexBeforeMove, players, house) {
        var operations, visibility, boardAfterMove, playerAfterMove, houseAfterMove;
        if (getWinner(playedTileId, players[0]) || getWinner(playedTileId, players[1])) {
            throw new Error("Can only make a move if the game is not over!");
        }
        boardAfterMove = angular.copy(board);
        playerAfterMove = angular.copy(players[turnIndexBeforeMove]);
        houseAfterMove = angular.copy(house);
        //If there was no tile on the board before, this is the first tile
        //TODO: BEFORE RETURNING FROM EACH OPERATION, CHECK FOR WINNER OR TIE
        if (board.tiles.length === 0) {
            boardAfterMove.setRoot(playedTileId);
            playerAfterMove.removeTileFromHand(playedTileId);
            visibility = { key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1] };
            operations.concat([{ set: { key: 'player' + turnIndexBeforeMove, value: playerAfterMove } }]);
            operations.concat([{ set: { key: 'board', value: boardAfterMove } }]);
            operations.concat([{ setTurn: { turnIndex: 1 - turnIndexBeforeMove } }]);
            operations.concat([{ setVisibility: visibility }]);
            return operations;
        }
        else if (Play.LEFT === play) {
            boardAfterMove.addLeftChild(playedTileId);
            playerAfterMove.removeTileFromHand(playedTileId);
            visibility = { key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1] };
            operations.concat([{ set: { key: 'player' + turnIndexBeforeMove, value: playerAfterMove } }]);
            operations.concat([{ set: { key: 'board', value: boardAfterMove } }]);
            operations.concat([{ setTurn: { turnIndex: 1 - turnIndexBeforeMove } }]);
            operations.concat([{ setVisibility: visibility }]);
            return operations;
        }
        else if (Play.RIGHT === play) {
            boardAfterMove.addRightChild(playedTileId);
            playerAfterMove.removeTileFromHand(playedTileId);
            visibility = { key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1] };
            operations.concat([{ set: { key: 'player' + turnIndexBeforeMove, value: playerAfterMove } }]);
            operations.concat([{ set: { key: 'board', value: boardAfterMove } }]);
            operations.concat([{ setTurn: { turnIndex: 1 - turnIndexBeforeMove } }]);
            operations.concat([{ setVisibility: visibility }]);
            return operations;
        }
        else if (Play.BUY === play) {
            if (house.getNumberOfRemainingTiles() === 0) {
                throw new Error("One cannot buy from the house when it has no tiles");
            }
            houseAfterMove.removeTileFromHand(playedTileId);
            playerAfterMove.addTileToHand(playedTileId);
            visibility = { key: 'tile' + playedTileId, visibleToPlayerIndexes: [turnIndexBeforeMove] };
            operations.concat([{ setTurn: { turnIndex: turnIndexBeforeMove } }]);
            operations.concat([{ set: { key: 'player' + turnIndexBeforeMove, value: players[turnIndexBeforeMove] } }]);
            operations.concat([{ set: { key: 'house', value: house } }]);
            operations.concat([{ setVisibility: visibility }]);
            return operations;
        }
        else {
            throw new Error("Unknown play");
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
                var playedTile = deltaValue.tileId;
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
