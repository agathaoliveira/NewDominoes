var Play;
(function (Play) {
    Play[Play["LEFT"] = 0] = "LEFT";
    Play[Play["RIGHT"] = 1] = "RIGHT";
    Play[Play["BUY"] = 2] = "BUY";
})(Play || (Play = {}));
var gameLogic;
(function (gameLogic) {
    function setBoardRoot(board, tile) {
        board.root = tile;
        board.leftMost = tile;
        board.rightMost = tile;
    }
    function flipNumbers(tile) {
        var temp = tile.leftNumber;
        tile.leftNumber = tile.rightNumber;
        tile.rightNumber = temp;
    }
    function addTileToTheRight(board, playedTile) {
        var rightNumber = board.rightMost.rightNumber;
        if (playedTile.leftNumber !== rightNumber) {
            if (playedTile.rightNumber !== rightNumber) {
                throw new Error("Cannot play tile " + JSON.stringify(playedTile) + " on the right when right tile is " + JSON.stringify(board.rightMost));
            }
            else {
                flipNumbers(playedTile);
            }
        }
        var currentTile = board.root;
        while (currentTile.rightNumber != board.rightMost.rightNumber && currentTile.leftNumber != board.rightMost.leftNumber) {
            currentTile = currentTile.rightTile;
        }
        currentTile.rightTile = playedTile;
        board.rightMost = playedTile;
    }
    function addTileToTheLeft(board, playedTile) {
        var leftNumber = board.leftMost.leftNumber;
        if (playedTile.rightNumber !== leftNumber) {
            if (playedTile.leftNumber !== leftNumber) {
                throw new Error("Cannot play tile " + JSON.stringify(playedTile) + " on the left when left tile is " + JSON.stringify(board.leftMost));
            }
            else {
                flipNumbers(playedTile);
            }
        }
        var currentTile = board.root;
        while (currentTile.rightNumber != board.leftMost.rightNumber && currentTile.leftNumber != board.leftMost.leftNumber) {
            currentTile = currentTile.leftTile;
        }
        currentTile.leftTile = playedTile;
        board.leftMost = playedTile;
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
        /*for (var i = 0; i < players.length; i++)
        {
          operations.push({set: {key: 'player' + i, value: players[i]}});
        }*/
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
    /*  function hasTileWithNumbers(player: IPlayer, state: IState, firstNumber: number, secondNumber: number): boolean
      {
        for (var i = 0; i < player.hand.length; i++){
          var tile: ITile = state[player.hand[i]];
          if (tile.leftNumber === firstNumber || tile.rightNumber === secondNumber ||
            tile.leftNumber === secondNumber || tile.rightNumber === secondNumber){
            return true;
          }
        }
        return false;
      }
    
      function isTie(board: IBoard, state: IState, players: IPlayer[], house: IPlayer): boolean{
    
        if (!board.root){
          return false;
        }
    
        var leftTile: ITile = board.leftMost;
        var rightTile: ITile = board.rightMost;
    
        if (hasTileWithNumbers(house, state, leftTile.leftNumber, rightTile.rightNumber)){
          return false;
        }
    
        for (var i = 0; i < players.length; i++){
          if (hasTileWithNumbers(players[i], state, leftTile.leftNumber, rightTile.rightNumber)){
            return false;
          }
        }
    
        return true;
      }*/
    function getGenericMove(turn, boardAfterMove, delta, visibility, players) {
        var operations = [];
        operations.push({ setTurn: { turnIndex: turn } });
        operations.push({ set: { key: 'board', value: boardAfterMove } });
        operations.push({ set: { key: 'delta', value: delta } });
        operations.push({ setVisibility: visibility });
        operations.push({ set: { key: 'players', value: players } });
        return operations;
    }
    function getMoveIfEndGame(player, boardAfterMove, delta, visibility, numberOfPlayers) {
        var operations = [];
        if (getWinner(player) !== undefined) {
            var endScores = [];
            for (var i = 0; i < numberOfPlayers; i++) {
                endScores[i] = 0;
            }
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
    function getVisibilityForAllPlayers(numOfPlayers) {
        var visitibilities = [];
        for (var i = 0; i < numOfPlayers; i++) {
            visitibilities.push(i);
        }
        return visitibilities;
    }
    /**
    * Returns the move that should be performed when player
    * with index turnIndexBeforeMove makes adds a domino to the board.
    */
    function createMove(board, state, playedTileKey, play, turnIndexBeforeMove, players, house) {
        var operations, visibility, boardAfterMove, playersAfterMove, playerAfterMove, houseAfterMove;
        //Check if someone has already won the game
        for (var i = 0; i < players.length; i++) {
            if (getWinner(players[i]) === players[i].id) {
                throw new Error("Can only make a move if the game is not over! Player " + i + " has already won.");
            }
        }
        boardAfterMove = angular.copy(board);
        playersAfterMove = angular.copy(players);
        playerAfterMove = angular.copy(players[turnIndexBeforeMove]);
        houseAfterMove = angular.copy(house);
        var delta = { tileKey: playedTileKey, play: play };
        //If there was no tile on the board before, this is the first tile
        if (!board.root) {
            setBoardRoot(boardAfterMove, state[playedTileKey]);
            removeTileFromHand(playerAfterMove, playedTileKey);
            visibility = { key: playedTileKey, visibleToPlayerIndexes: getVisibilityForAllPlayers(players.length) };
            var nextTurn = (turnIndexBeforeMove + 1) % players.length;
            playersAfterMove[turnIndexBeforeMove] = playerAfterMove;
            return getGenericMove(nextTurn, boardAfterMove, delta, visibility, playersAfterMove);
        }
        else if (Play.LEFT === play) {
            addTileToTheLeft(boardAfterMove, state[playedTileKey]);
            removeTileFromHand(playerAfterMove, playedTileKey);
            visibility = { key: playedTileKey, visibleToPlayerIndexes: getVisibilityForAllPlayers(players.length) };
            var endMove = getMoveIfEndGame(playerAfterMove, boardAfterMove, delta, visibility, players.length);
            var nextTurn = (turnIndexBeforeMove + 1) % players.length;
            playersAfterMove[turnIndexBeforeMove] = playerAfterMove;
            return endMove ? endMove : getGenericMove(nextTurn, boardAfterMove, delta, visibility, playersAfterMove);
        }
        else if (Play.RIGHT === play) {
            addTileToTheRight(boardAfterMove, state[playedTileKey]);
            removeTileFromHand(playerAfterMove, playedTileKey);
            visibility = { key: playedTileKey, visibleToPlayerIndexes: getVisibilityForAllPlayers(players.length) };
            var endMove = getMoveIfEndGame(playerAfterMove, boardAfterMove, delta, visibility, players.length);
            var nextTurn = (turnIndexBeforeMove + 1) % players.length;
            playersAfterMove[turnIndexBeforeMove] = playerAfterMove;
            return endMove ? endMove : getGenericMove(nextTurn, boardAfterMove, delta, visibility, playersAfterMove);
        }
        else if (Play.BUY === play) {
            if (getNumberOfRemainingTiles(house) === 0) {
                throw new Error("One cannot buy from the house when it has no tiles");
            }
            removeTileFromHand(houseAfterMove, playedTileKey);
            addTileToHand(playerAfterMove, playedTileKey);
            visibility = { key: playedTileKey, visibleToPlayerIndexes: [turnIndexBeforeMove] };
            playersAfterMove[turnIndexBeforeMove] = playerAfterMove;
            operations = getGenericMove(turnIndexBeforeMove, boardAfterMove, delta, visibility, playersAfterMove);
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
        var numberOfPlayers = params.numberOfPlayers;
        /*********************************************************************
        * 1. If the stateBeforeMove is empty, then it should be the first
        *    move. Set the board of stateBeforeMove to be the initial board.
        *    If the stateBeforeMove is not empty, then the board should have
        *    one or more dominoes.
        ********************************************************************/
        try {
            if (numberOfPlayers > 4) {
                throw Error("A maximum of 4 players are allowed for this game");
            }
            var expectedMove;
            if (!params.stateBeforeMove) {
                expectedMove = getInitialMove(numberOfPlayers);
            }
            else {
                var deltaValue = stateBeforeMove.delta;
                var playedTileKey = deltaValue.tileKey;
                var play = deltaValue.play;
                var players = stateBeforeMove.players;
                var house = stateBeforeMove.house;
                expectedMove = createMove(stateBeforeMove.board, stateBeforeMove, playedTileKey, play, turnIndexBeforeMove, players, house);
            }
            /*  console.log(JSON.stringify(move));*/
            //  console.log("---------------------")
            //    console.log(JSON.stringify(expectedMove));
            if (!angular.equals(move, expectedMove)) {
                //  logDiffToConsole(move, expectedMove);
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
