var Play;
(function (Play) {
    Play[Play["LEFT"] = 0] = "LEFT";
    Play[Play["RIGHT"] = 1] = "RIGHT";
    Play[Play["BUY"] = 2] = "BUY";
})(Play || (Play = {}));
var gameLogic;
(function (gameLogic) {
    function setBoardRoot(board, tileId) {
        board.tiles = [];
        board.tiles[0] = tileId;
        //Initialize right and left ot hte root
        board.rightMost = 0;
        board.leftMost = 0;
    }
    function flipNumbers(tile) {
        var temp = tile.leftNumber;
        tile.leftNumber = tile.rightNumber;
        tile.rightNumber = temp;
    }
    function addTileToTheRight(board, tileId) {
        var rightNumber = board.allTiles[board.tiles[board.rightMost]].value.rightNumber;
        var playedTile = board.allTiles[tileId].value;
        if (playedTile.leftNumber !== rightNumber) {
            if (playedTile.rightNumber !== rightNumber) {
                throw new Error("Cannot play tile " + JSON.stringify(playedTile) + " on the right when right tile is " + JSON.stringify(board.allTiles[board.tiles[board.rightMost]].value));
            }
            else {
                flipNumbers(playedTile);
            }
        }
        board.tiles[2 * board.rightMost + 2] = tileId; //the right child of the current right title is at index 2 * i + 2. Initialize it to title with index playedTileId
        board.rightMost = 2 * board.rightMost + 2;
    }
    function addTileToTheLeft(board, tileId) {
        var leftNumber = board.allTiles[board.tiles[board.leftMost]].value.leftNumber;
        var playedTile = board.allTiles[tileId].value;
        if (playedTile.rightNumber !== leftNumber) {
            if (playedTile.leftNumber !== leftNumber) {
                throw new Error("Cannot play tile " + JSON.stringify(playedTile) + " on the right when left tile is " + board.allTiles[board.tiles[board.leftMost]].value.leftNumber);
            }
            else {
                flipNumbers(playedTile);
            }
        }
        board.tiles[2 * board.leftMost + 1] = tileId; //the left child of the current left title is at index 2 * i + 1. Initialize it to title with index playedTileId
        board.leftMost = 2 * board.leftMost + 1;
    }
    function addTileToHand(player, tile) {
        player.hand.push(tile);
    }
    function removeTileFromHand(player, tile) {
        var index = player.hand.indexOf(tile, 0);
        if (index !== undefined && index !== -1) {
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
                operations.push({ set: setTiles[k] });
                shuffleKeys.keys.push('tile' + k);
                k++;
            }
        }
        var board = getInitialBoard();
        board.allTiles = setTiles;
        operations.push({ setTurn: { turnIndex: 0 } });
        operations.push({ set: { key: 'player0', value: player0 } });
        operations.push({ set: { key: 'player1', value: player1 } });
        operations.push({ set: { key: 'house', value: house } });
        operations.push({ set: { key: 'board', value: board } });
        operations.push({ set: { key: 'allTiles', value: setTiles } });
        operations.push({ shuffle: shuffleKeys });
        return operations;
    }
    gameLogic.getInitialMove = getInitialMove;
    function getWinner(currentPlayer) {
        if (getNumberOfRemainingTiles(currentPlayer) === 0) {
            return currentPlayer.id;
        }
        return undefined;
    }
    function hasTileWithNumbers(player, allTiles, firstNumber, secondNumber) {
        for (var i = 0; i < player.hand.length; i++) {
            var tile = allTiles[player.hand[i]].value;
            if (tile.leftNumber === firstNumber || tile.rightNumber === firstNumber || tile.leftNumber === secondNumber || tile.rightNumber === secondNumber) {
                return true;
            }
        }
        return false;
    }
    function isTie(board, players, house) {
        if (!board.tiles) {
            return false;
        }
        var allTiles = board.allTiles, leftTile = allTiles[board.tiles[board.leftMost]].value, rightTile = allTiles[board.tiles[board.rightMost]].value;
        if (hasTileWithNumbers(house, allTiles, leftTile.leftNumber, rightTile.rightNumber)) {
            return false;
        }
        for (var i = 0; i < players.length; i++) {
            if (hasTileWithNumbers(players[i], allTiles, leftTile.leftNumber, rightTile.rightNumber)) {
                return false;
            }
        }
        return true;
    }
    function getGenericMove(turn, boardAfterMove, delta, visibility, playerIndex, player) {
        var operations = [];
        operations.push({ setTurn: { turnIndex: turn } });
        operations.push({ set: { key: 'board', value: boardAfterMove } });
        operations.push({ set: { key: 'delta', value: delta } });
        operations.push({ setVisibility: visibility });
        operations.push({ set: { key: 'player' + playerIndex, value: player } });
        return operations;
    }
    function getMoveIfEndGame(player, boardAfterMove, delta, visibility) {
        var operations = [];
        if (getWinner(player)) {
            var endScores = [];
            endScores[player.id] = 1;
            operations.push({ endMatch: { endMatchScores: endScores } });
            operations.push({ set: { key: 'board', value: boardAfterMove } });
            operations.push({ set: { key: 'delta', value: delta } });
            operations.push({ setVisibility: visibility });
            return operations;
        }
        else {
            return undefined;
        }
    }
    /**
    * Returns the move that should be performed when player
    * with index turnIndexBeforeMove makes adds a domino to the board.
    */
    function createMove(board, playedTileId, play, turnIndexBeforeMove, players, house) {
        var operations, visibility, boardAfterMove, playerAfterMove, houseAfterMove;
        if (getWinner(players[0]) === players[0].id || getWinner(players[1]) === players[1].id || isTie(board, players, house)) {
            throw new Error("Can only make a move if the game is not over!");
        }
        boardAfterMove = angular.copy(board);
        playerAfterMove = angular.copy(players[turnIndexBeforeMove]);
        houseAfterMove = angular.copy(house);
        var delta = { tileId: playedTileId, play: play };
        //If there was no tile on the board before, this is the first tile
        if (!board.tiles || board.tiles.length === 0) {
            setBoardRoot(board, playedTileId);
            removeTileFromHand(playerAfterMove, playedTileId);
            visibility = { key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1] };
            return getGenericMove(1 - turnIndexBeforeMove, boardAfterMove, delta, visibility, turnIndexBeforeMove, playerAfterMove);
        }
        else if (Play.LEFT === play) {
            addTileToTheLeft(boardAfterMove, playedTileId);
            removeTileFromHand(playerAfterMove, playedTileId);
            visibility = { key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1] };
            var endMove = getMoveIfEndGame(playerAfterMove, boardAfterMove, delta, visibility);
            return endMove ? endMove : getGenericMove(1 - turnIndexBeforeMove, boardAfterMove, delta, visibility, turnIndexBeforeMove, playerAfterMove);
        }
        else if (Play.RIGHT === play) {
            addTileToTheRight(boardAfterMove, playedTileId);
            removeTileFromHand(playerAfterMove, playedTileId);
            visibility = { key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1] };
            var endMove = getMoveIfEndGame(playerAfterMove, boardAfterMove, delta, visibility);
            return endMove ? endMove : getGenericMove(1 - turnIndexBeforeMove, boardAfterMove, delta, visibility, turnIndexBeforeMove, playerAfterMove);
        }
        else if (Play.BUY === play) {
            if (getNumberOfRemainingTiles(house) === 0) {
                throw new Error("One cannot buy from the house when it has no tiles");
            }
            removeTileFromHand(houseAfterMove, playedTileId);
            addTileToHand(playerAfterMove, playedTileId);
            visibility = { key: 'tile' + playedTileId, visibleToPlayerIndexes: [turnIndexBeforeMove] };
            operations = getGenericMove(turnIndexBeforeMove, boardAfterMove, delta, visibility, turnIndexBeforeMove, playerAfterMove);
            operations.concat([{ set: { key: 'house', value: houseAfterMove } }]);
            return operations;
        }
        else {
            throw new Error("Unknown play");
        }
    }
    gameLogic.createMove = createMove;
    //This is a helper function for debugging
    /*function logDiffToConsole(o1, o2) {
      if (angular.equals(o1, o2))
      {
        return;
      }
      console.log("Found diff between: ", o1, o2);
      if (!angular.equals(Object.keys(o1), Object.keys(o2))) {
        console.log("Keys different: ", JSON.stringify(Object.keys(o1)), JSON.stringify(Object.keys(o2)));
      }
      for (var k in o1) {
        logDiffToConsole(o1[k], o2[k]);
      }
    }*/
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
                var deltaValue = stateBeforeMove.delta;
                var playedTile = deltaValue.tileId;
                var play = deltaValue.play;
                var players = stateBeforeMove.players;
                var house = stateBeforeMove.house;
                expectedMove = createMove(stateBeforeMove.board, playedTile, play, turnIndexBeforeMove, players, house);
            }
            /*  console.log(JSON.stringify(move));
              console.log("---------------------")
              console.log(JSON.stringify(expectedMove));*/
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
