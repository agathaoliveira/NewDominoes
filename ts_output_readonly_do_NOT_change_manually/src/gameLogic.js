var Play;
(function (Play) {
    Play[Play["LEFT"] = 0] = "LEFT";
    Play[Play["RIGHT"] = 1] = "RIGHT";
    Play[Play["BUY"] = 2] = "BUY";
    Play[Play["PASS"] = 3] = "PASS";
    Play[Play["REVEAL"] = 4] = "REVEAL";
    Play[Play["END"] = 5] = "END";
})(Play || (Play = {}));
var gameLogic;
(function (gameLogic) {
    function setBoardRoot(board, tile) {
        board.root = tile;
        board.leftMost = tile.tileKey;
        board.rightMost = tile.tileKey;
    }
    function addTileToTheRight(board, playedTile) {
        var rightTileKey = board.rightMost;
        var currentTile = board.root;
        while (currentTile.tileKey !== rightTileKey) {
            currentTile = currentTile.rightTile;
        }
        currentTile.rightTile = playedTile;
        board.rightMost = playedTile.tileKey;
    }
    function addTileToTheLeft(board, playedTile) {
        var leftTileKey = board.leftMost;
        var currentTile = board.root;
        while (currentTile.tileKey !== leftTileKey) {
            currentTile = currentTile.leftTile;
        }
        currentTile.leftTile = playedTile;
        board.leftMost = playedTile.tileKey;
    }
    function addTileToHand(player, tileKey) {
        player.hand.push(tileKey);
    }
    function removeTileFromHand(player, tileKey) {
        var index = player.hand.indexOf(tileKey, 0);
        if (index !== undefined && index !== -1) {
            player.hand.splice(index, 1);
        }
        else {
            throw new Error("Unknown array element " + JSON.stringify(tileKey));
        }
    }
    function getNumberOfRemainingTiles(player) {
        return player.hand.length;
    }
    function getInitialBoard() {
        return {};
    }
    gameLogic.getInitialBoard = getInitialBoard;
    function getInitialMove(numOfPlayers) {
        var operations = [], visibilityOperations = [], players = [], house = { id: -1, hand: [] }, setTiles = [], setVisibilities = [], shuffleKeys = { keys: [] }, i, j, k, assignedTiles, tilesToAssign;
        if (numOfPlayers === 2) {
            tilesToAssign = 7;
        }
        else {
            tilesToAssign = 5;
        }
        k = 0;
        assignedTiles = 0;
        var currentPlayerId = 0;
        for (i = 0; i < 7; i++) {
            for (j = 0; j <= i; j++) {
                var currentTile = { leftNumber: j, rightNumber: i };
                if (currentPlayerId < numOfPlayers) {
                    if (!players[currentPlayerId]) {
                        players[currentPlayerId] = { id: currentPlayerId, hand: [] };
                    }
                    players[currentPlayerId].hand.push('tile' + k);
                    setVisibilities[k] = { key: 'tile' + k, visibleToPlayerIndexes: [currentPlayerId] };
                    assignedTiles++;
                    setTiles[k] = { key: 'tile' + k, value: currentTile };
                    if (assignedTiles === tilesToAssign) {
                        currentPlayerId++;
                        assignedTiles = 0;
                    }
                }
                else {
                    house.hand.push('tile' + k);
                    setTiles[k] = { key: 'tile' + k, value: currentTile };
                    setVisibilities[k] = { key: 'tile' + k, visibleToPlayerIndexes: [] };
                }
                operations.push({ set: setTiles[k] });
                visibilityOperations.push({ setVisibility: setVisibilities[k] });
                shuffleKeys.keys.push('tile' + k);
                k++;
            }
        }
        var board = getInitialBoard();
        operations.push({ setTurn: { turnIndex: 0 } });
        operations.push({ set: { key: 'house', value: house } });
        operations.push({ set: { key: 'board', value: board } });
        operations.push({ shuffle: shuffleKeys });
        operations.push({ set: { key: 'players', value: players } });
        return operations.concat(visibilityOperations);
        ;
    }
    gameLogic.getInitialMove = getInitialMove;
    function getWinner(currentPlayer) {
        if (getNumberOfRemainingTiles(currentPlayer) === 0) {
            return currentPlayer.id;
        }
        return undefined;
    }
    function getVisibilityForAllPlayers(numOfPlayers) {
        var visitibilities = [];
        for (var i = 0; i < numOfPlayers; i++) {
            visitibilities.push(i);
        }
        return visitibilities;
    }
    function getGenericMove(turn, boardAfterMove, delta, visibility, players) {
        var operations = [];
        operations.push({ setTurn: { turnIndex: turn } });
        operations.push({ set: { key: 'board', value: boardAfterMove } });
        operations.push({ set: { key: 'delta', value: delta } });
        operations.push({ setVisibility: visibility });
        operations.push({ set: { key: 'players', value: players } });
        return operations;
    }
    function getRemainingPoints(player, state) {
        var tile, points = 0;
        for (var i = 0; i < player.hand.length; i++) {
            tile = state[player.hand[i]];
            points = points + tile.leftNumber + tile.rightNumber;
        }
        return points;
    }
    function validateTiles(tile, boardTile) {
        if (tile.rightNumber !== boardTile.rightNumber && tile.rightNumber !== boardTile.leftNumber &&
            tile.leftNumber !== boardTile.rightNumber && tile.leftNumber !== boardTile.leftNumber) {
            throw new Error("Cannot place tile at the board! Numbers are invalid.");
        }
    }
    function createMoveEndGame(allPlayers, state, delta) {
        var operations = [], remainingPoints = [], numberOfPlayers = allPlayers.length, totalPoints = 0;
        for (var i = 0; i < numberOfPlayers; i++) {
            remainingPoints[i] = getRemainingPoints(allPlayers[i], state);
            totalPoints = totalPoints + remainingPoints[i];
        }
        var endScores = [];
        for (var i = 0; i < numberOfPlayers; i++) {
            endScores[i] = totalPoints - remainingPoints[i];
        }
        for (var i = 0; i < 28; i++) {
            operations.push({ set: { key: 'tile' + i, value: state['tile' + i] } });
        }
        operations.push({ endMatch: { endMatchScores: endScores } });
        operations.push({ set: { key: 'delta', value: delta } });
        return operations;
    }
    gameLogic.createMoveEndGame = createMoveEndGame;
    function createMovePass(turnIndexBeforeMove, numberOfPlayers, delta) {
        var operations = [];
        operations.push({ setTurn: { turnIndex: (turnIndexBeforeMove + 1) % numberOfPlayers } });
        operations.push({ set: { key: 'delta', value: delta } });
        return operations;
    }
    gameLogic.createMovePass = createMovePass;
    function createMoveReveal(numberOfPlayers, turnIndexBeforeMove, delta, players) {
        var operations = [], playerIndexes = getVisibilityForAllPlayers(numberOfPlayers);
        for (var i = 0; i < 28; i++) {
            operations.push({ setVisibility: { key: 'tile' + i, visibleToPlayerIndexes: playerIndexes } });
        }
        operations.push({ setTurn: { turnIndex: turnIndexBeforeMove } });
        operations.push({ set: { key: 'delta', value: delta } });
        operations.push({ set: { key: 'players', value: players } });
        return operations;
    }
    gameLogic.createMoveReveal = createMoveReveal;
    /* In this case, the domino tile should be removed from the house and added to the player's hand. It should only be visible to the player
    * who bought the tile from the house.
    */
    function createMoveBuy(house, playedTileKey, player, allPlayers, board, delta, turnIndexBeforeMove) {
        var operations, visibility;
        if (getNumberOfRemainingTiles(house) === 0) {
            throw new Error("One cannot buy from the house when it has no tiles");
        }
        removeTileFromHand(house, playedTileKey);
        addTileToHand(player, playedTileKey);
        visibility = { key: playedTileKey, visibleToPlayerIndexes: [turnIndexBeforeMove] };
        allPlayers[turnIndexBeforeMove] = player;
        operations = getGenericMove(turnIndexBeforeMove, board, delta, visibility, allPlayers);
        operations = operations.concat([{ set: { key: 'house', value: house } }]);
        return operations;
    }
    gameLogic.createMoveBuy = createMoveBuy;
    function createMovePlay(board, delta, player, allPlayers, playedTileKey, turnIndexBeforeMove, play, stateAfterMove) {
        var operations, visibility, numberOfPlayers = allPlayers.length, playedTile = { tileKey: playedTileKey };
        //Check if someone has already won the game
        for (var i = 0; i < numberOfPlayers; i++) {
            if (getWinner(allPlayers[i]) === allPlayers[i].id) {
                throw new Error("Can only make a move if the game is not over! Player " + i + " has already won.");
            }
        }
        if (!board.root) {
            var tile = stateAfterMove[playedTileKey];
            if (tile.leftNumber != tile.rightNumber) {
                throw new Error("First tile must be a double");
            }
            setBoardRoot(board, playedTile);
        }
        else if (play === Play.RIGHT) {
            var tile = stateAfterMove[playedTileKey];
            var rightTile = stateAfterMove[board.rightMost];
            validateTiles(tile, rightTile);
            addTileToTheRight(board, playedTile);
        }
        else {
            var tile = stateAfterMove[playedTileKey];
            var leftTile = stateAfterMove[board.leftMost];
            validateTiles(tile, leftTile);
            addTileToTheLeft(board, playedTile);
        }
        removeTileFromHand(player, playedTileKey);
        allPlayers[turnIndexBeforeMove] = player;
        if (getNumberOfRemainingTiles(player) !== 0) {
            visibility = { key: playedTileKey, visibleToPlayerIndexes: getVisibilityForAllPlayers(numberOfPlayers) };
            var nextTurn = (turnIndexBeforeMove + 1) % numberOfPlayers;
            return getGenericMove(nextTurn, board, delta, visibility, allPlayers);
        }
        else {
            delta.play = Play.REVEAL;
            return createMoveReveal(numberOfPlayers, turnIndexBeforeMove, delta, allPlayers);
        }
    }
    gameLogic.createMovePlay = createMovePlay;
    /**
    * Returns the move that should be performed when player with index turnIndexBeforeMove makes a move.
    */
    function createMove(state, turnIndexBeforeMove, delta, stateAfterMove) {
        var operations, visibility, boardAfterMove, playersAfterMove, playerAfterMove, houseAfterMove, playedTileKey = !(delta) ? undefined : delta.tileKey, play = delta === undefined ? undefined : delta.play, players = state.players, house = state.house, board = state.board;
        boardAfterMove = angular.copy(board);
        playersAfterMove = angular.copy(players);
        playerAfterMove = angular.copy(players[turnIndexBeforeMove]);
        houseAfterMove = angular.copy(house);
        //If there was no tile on the board before, this is the first tile
        if (Play.LEFT === play || Play.RIGHT === play) {
            return createMovePlay(boardAfterMove, delta, playerAfterMove, playersAfterMove, playedTileKey, turnIndexBeforeMove, play, stateAfterMove);
        }
        else if (Play.BUY === play) {
            return createMoveBuy(houseAfterMove, playedTileKey, playerAfterMove, playersAfterMove, boardAfterMove, delta, turnIndexBeforeMove);
        }
        else if (Play.PASS == play) {
            return createMovePass(turnIndexBeforeMove, playersAfterMove.length, delta);
        }
        else if (Play.REVEAL === play) {
            return createMoveReveal(playersAfterMove.length, turnIndexBeforeMove, delta, stateAfterMove.players);
        }
        else if (Play.END === play) {
            return createMoveEndGame(playersAfterMove, stateAfterMove, delta);
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
        var numberOfPlayers = params.numberOfPlayers;
        /*********************************************************************
        * 1. If the stateBeforeMove is empty, then it should be the first
        *    move. Set the board of stateBeforeMove to be the initial board.
        *    If the stateBeforeMove is not empty, then the board should have
        *    one or more dominoes.
        ********************************************************************/
        console.log("isMoveOk(): Calling is move ok");
        console.log("isMoveOk(): State Before is " + JSON.stringify(stateBeforeMove));
        console.log("isMoveOk():  State after is" + JSON.stringify(params.stateAfterMove));
        try {
            if (numberOfPlayers > 4) {
                throw Error("A maximum of 4 players are allowed for this game");
            }
            var expectedMove;
            if (!params.stateBeforeMove || !params.stateBeforeMove.board) {
                expectedMove = getInitialMove(numberOfPlayers);
            }
            else if (move[0].endMatch !== undefined) {
                return true;
            }
            else {
                expectedMove = createMove(stateBeforeMove, turnIndexBeforeMove, params.stateAfterMove.delta, params.stateAfterMove);
            }
            //  console.log("ACTUAL: " + JSON.stringify(move));
            //  console.log("---------------------")
            //  console.log("EXPECTED: " + JSON.stringify(expectedMove));
            if (!angular.equals(move, expectedMove)) {
                //  logDiffToConsole(move, expectedMove);
                return false;
            }
        }
        catch (e) {
            // if there are any exceptions then the move is illegal
            console.log("EXCEPTION ON IS MOVE OK: " + e);
            return false;
        }
        return true;
    }
    gameLogic.isMoveOk = isMoveOk;
})(gameLogic || (gameLogic = {}));
