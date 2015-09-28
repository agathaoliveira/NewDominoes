var Play;
(function (Play) {
    Play[Play["LEFT"] = 0] = "LEFT";
    Play[Play["RIGHT"] = 1] = "RIGHT";
    Play[Play["BUY"] = 2] = "BUY";
})(Play || (Play = {}));
var gameLogic;
(function (gameLogic) {
    function setBoardRoot(board, tileId) {
        board.tiles[0] = tileId;
        //Initialize right and left ot hte root
        board.rightMost = 0;
        board.leftMost = 0;
    }
    function addTileToTheRight(board, tileId) {
        board.tiles[2 * board.rightMost + 2] = tileId; //the right child of the current right title is at index 2 * i + 2. Initialize it to title with index playedTileId
        board.rightMost = 2 * board.rightMost + 2;
    }
    function addTileToTheLeft(board, tileId) {
        board.tiles[2 * board.leftMost + 1] = tileId; //the left child of the current left title is at index 2 * i + 1. Initialize it to title with index playedTileId
        board.leftMost = 2 * board.leftMost + 1;
    }
    function containsTile(board, tileId) {
        var index = board.tiles.indexOf(tileId);
        if (index) {
            return true;
        }
        return false;
    }
    function addTileToHand(player, tile) {
        this.hand.push(tile);
    }
    function removeTileFromHand(player, tile) {
        var index = player.hand.indexOf(tile, 0);
        if (index != undefined) {
            player.hand.splice(index, 1);
        }
        else {
            throw new Error("Unknown array element " + tile);
        }
    }
    function getNumberOfRemainingTiles(player) {
        return player.hand.length;
    }
    function getInitialBoard() {
        return {};
    }
    gameLogic.getInitialBoard = getInitialBoard;
    function getInitialMove() {
        var operations = [], player0 = { id: 0, hand: [] }, player1 = { id: 1, hand: [] }, house = { id: -1, hand: [] }, setTiles = [], setVisibilities = [], shuffleKeys = { keys: [] }, i, j, k;
        k = 0;
        for (i = 0; i < 7; i++) {
            for (j = 0; j <= i; j++) {
                var currentTile = { leftNumber: j, rightNumber: i };
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
        operations.concat([{ set: { key: 'allTiles', value: setTiles } }]);
        operations.concat([{ shuffle: { keys: shuffleKeys } }]);
        operations.concat(setVisibilities);
        return operations;
    }
    gameLogic.getInitialMove = getInitialMove;
    function getWinner(playedTileId, currentPlayer) {
        removeTileFromHand(currentPlayer, playedTileId);
        if (getNumberOfRemainingTiles(currentPlayer) === 0) {
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
            setBoardRoot(board, playedTileId);
            removeTileFromHand(playerAfterMove, playedTileId);
            visibility = { key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1] };
            operations.concat([{ set: { key: 'player' + turnIndexBeforeMove, value: playerAfterMove } }]);
            operations.concat([{ set: { key: 'board', value: boardAfterMove } }]);
            operations.concat([{ setTurn: { turnIndex: 1 - turnIndexBeforeMove } }]);
            operations.concat([{ setVisibility: visibility }]);
            return operations;
        }
        else if (Play.LEFT === play) {
            addTileToTheLeft(boardAfterMove, playedTileId);
            removeTileFromHand(playerAfterMove, playedTileId);
            visibility = { key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1] };
            operations.concat([{ set: { key: 'player' + turnIndexBeforeMove, value: playerAfterMove } }]);
            operations.concat([{ set: { key: 'board', value: boardAfterMove } }]);
            operations.concat([{ setTurn: { turnIndex: 1 - turnIndexBeforeMove } }]);
            operations.concat([{ setVisibility: visibility }]);
            return operations;
        }
        else if (Play.RIGHT === play) {
            addTileToTheRight(boardAfterMove, playedTileId);
            removeTileFromHand(playerAfterMove, playedTileId);
            visibility = { key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1] };
            operations.concat([{ set: { key: 'player' + turnIndexBeforeMove, value: playerAfterMove } }]);
            operations.concat([{ set: { key: 'board', value: boardAfterMove } }]);
            operations.concat([{ setTurn: { turnIndex: 1 - turnIndexBeforeMove } }]);
            operations.concat([{ setVisibility: visibility }]);
            return operations;
        }
        else if (Play.BUY === play) {
            if (getNumberOfRemainingTiles(house) === 0) {
                throw new Error("One cannot buy from the house when it has no tiles");
            }
            removeTileFromHand(houseAfterMove, playedTileId);
            addTileToHand(playerAfterMove, playedTileId);
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
