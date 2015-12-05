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
        player.hand.unshift(tileKey);
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
    function validateTiles(tile, currentNumber) {
        if (tile.rightNumber !== currentNumber &&
            tile.leftNumber !== currentNumber) {
            throw new Error("Cannot place tile at the board! Numbers are invalid.");
        }
    }
    function createMoveEndGame(allPlayers, state, delta) {
        var operations = [], remainingPoints = [], numberOfPlayers = allPlayers.length, min = 336, minPlayer = -1, totalPoints = 0;
        for (var i = 0; i < numberOfPlayers; i++) {
            remainingPoints[i] = getRemainingPoints(allPlayers[i], state);
            totalPoints = totalPoints + remainingPoints[i];
            if (remainingPoints[i] < min) {
                min = remainingPoints[i];
                minPlayer = i;
            }
        }
        var endScores = [];
        for (var i = 0; i < numberOfPlayers; i++) {
            if (i === minPlayer) {
                endScores[i] = totalPoints - 2 * remainingPoints[i];
            }
            else {
                endScores[i] = 0;
            }
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
    function createMoveBuy(house, playedTileKey, player, allPlayers, board, delta, turnIndexBeforeMove, stateAfterMove) {
        var operations, visibility;
        if (getNumberOfRemainingTiles(house) === 0) {
            throw new Error("One cannot buy from the house when it has no tiles");
        }
        removeTileFromHand(house, playedTileKey);
        addTileToHand(player, playedTileKey);
        visibility = { key: playedTileKey, visibleToPlayerIndexes: [turnIndexBeforeMove] };
        board.currentLeft = stateAfterMove.board.currentLeft;
        board.currentRight = stateAfterMove.board.currentRight;
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
            board.currentLeft = stateAfterMove.board.currentLeft;
            board.currentRight = stateAfterMove.board.currentRight;
        }
        else if (play === Play.RIGHT) {
            var tile = stateAfterMove[playedTileKey];
            var rightTile = stateAfterMove.board.currentRight;
            validateTiles(tile, rightTile);
            board.currentRight = rightTile;
            board.currentLeft = stateAfterMove.board.currentLeft;
            addTileToTheRight(board, playedTile);
        }
        else {
            var tile = stateAfterMove[playedTileKey];
            var leftTile = stateAfterMove.board.currentLeft;
            validateTiles(tile, leftTile);
            board.currentLeft = leftTile;
            board.currentRight = stateAfterMove.board.currentRight;
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
            return createMoveBuy(houseAfterMove, playedTileKey, playerAfterMove, playersAfterMove, boardAfterMove, delta, turnIndexBeforeMove, stateAfterMove);
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
    // function logDiffToConsole(o1, o2) {
    //   if (angular.equals(o1, o2))
    //   {
    //     return;
    //   }
    //   console.log("Found diff between: ", o1, o2);
    //   if (!angular.equals(Object.keys(o1), Object.keys(o2))) {
    //     console.log("Keys different: ", JSON.stringify(Object.keys(o1)), JSON.stringify(Object.keys(o2)));
    //   }
    //   for (var k in o1) {
    //     logDiffToConsole(o1[k], o2[k]);
    //   }
    // }
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
        // console.log("isMoveOk(): Calling is move ok");
        //  console.log("isMoveOk(): State Before is " + JSON.stringify(stateBeforeMove));
        //  console.log("isMoveOk():  State after is" + JSON.stringify(params.stateAfterMove));
        try {
            if (numberOfPlayers > 4) {
                throw Error("A maximum of 4 players are allowed for this game");
            }
            var expectedMove;
            if (!params.stateBeforeMove || !params.stateBeforeMove.board || (!params.stateAfterMove.delta && !params.stateAfterMove.board.root)) {
                expectedMove = getInitialMove(numberOfPlayers);
            }
            else {
                expectedMove = createMove(stateBeforeMove, turnIndexBeforeMove, params.stateAfterMove.delta, params.stateAfterMove);
            }
            // console.log("ACTUAL: " + JSON.stringify(move));
            // console.log("---------------------")
            //  console.log("STATE BEFORE: " + JSON.stringify(params.stateBeforeMove));
            // console.log("STATE AFTER: " + JSON.stringify(params.stateAfterMove));
            //  console.log("EXPECTED: " + JSON.stringify(expectedMove));
            if (!angular.equals(move, expectedMove)) {
                //logDiffToConsole(move, expectedMove);
                return false;
            }
        }
        catch (e) {
            // if there are any exceptions then the move is illegal
            // console.log("EXCEPTION ON IS MOVE OK: " + e);
            return false;
        }
        return true;
    }
    gameLogic.isMoveOk = isMoveOk;
})(gameLogic || (gameLogic = {}));
;var game;
(function (game) {
    var animationEnded = false;
    var canMakeMove = false;
    var isComputerTurn = false;
    var state = null;
    var turnIndex = null;
    var treeStructure = [
        [0],
        [1, 2, 3, 4, 5, 6, 7],
        [1, 2, 3, 4, 5, 6],
        [7],
        [8],
        [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
        [8],
        [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22] //tree7
    ];
    var treeSourcesCache = [];
    var treeClassesCache = [];
    var tileOrientationCache = [];
    var tileCache = [];
    var gameArea = document.getElementById("gameArea");
    var currentPlayerArea = document.getElementById("currentPlayer");
    var isUndefinedOrNull = function (val) {
        return angular.isUndefined(val) || val === null;
    };
    game.isHelpModalShown = false;
    function init() {
        console.log("Translation of 'RULES_OF_TICTACTOE' is " + translate('RULES_OF_TICTACTOE'));
        resizeGameAreaService.setWidthToHeight(2);
        gameService.setGame({
            minNumberOfPlayers: 2,
            maxNumberOfPlayers: 2,
            isMoveOk: gameLogic.isMoveOk,
            updateUI: updateUI
        });
        $rootScope.hasGameEnded = false;
        // See http://www.sitepoint.com/css3-animation-javascript-event-handlers/
        document.addEventListener("animationend", animationEndedCallback, false); // standard
        document.addEventListener("webkitAnimationEnd", animationEndedCallback, false); // WebKit
        document.addEventListener("oanimationend", animationEndedCallback, false); // Opera
    }
    game.init = init;
    function updateUI(params) {
        animationEnded = false;
        state = params.stateAfterMove;
        treeSourcesCache = [];
        treeClassesCache = [];
        tileOrientationCache = [];
        tileCache = [];
        $rootScope.yourPlayerIndex = params.yourPlayerIndex;
        $rootScope.turnIndex = params.turnIndexAfterMove;
        $rootScope.hasGameEnded = false;
        $rootScope.selectedTile = undefined;
        //Reset caches
        populateCaches(0, 0, undefined, undefined);
        log.info("updateUI(): ", params);
        if (!state.board && params.yourPlayerIndex === params.turnIndexAfterMove) {
            var move = gameLogic.getInitialMove(params.numberOfPlayers);
            log.info("updateUI(): make initial move. Calling makeMove " + JSON.stringify(move));
            gameService.makeMove(move);
            return;
        }
        canMakeMove = params.turnIndexAfterMove >= 0 &&
            params.yourPlayerIndex === params.turnIndexAfterMove; // it's my turn
        turnIndex = params.turnIndexAfterMove;
        //If the state exists and it is a reveal play, create an end of game play
        if (state && state.delta && state.delta.play === Play.REVEAL) {
            var delta = { play: Play.END };
            state.delta = delta;
            var move = gameLogic.createMove(state, params.turnIndexAfterMove, delta, state);
            gameService.makeMove(move);
            return;
        }
        else if (state && state.delta && state.delta.play === Play.END) {
            $rootScope.hasGameEnded = true;
            $rootScope.scores = params.endMatchScores;
            $rootScope.yourPlayerIndex = params.turnIndexBeforeMove;
            return;
        }
        if (canMakeMove) {
            //if the previous play was a pass move, and the current play was also a pass move, then no player can make a move.
            //Thus, end the game
            if (wasPassMove(params.stateBeforeMove) && wasPassMove(params.stateAfterMove)) {
                var delta = { play: Play.REVEAL };
                var move = gameLogic.createMove(state, params.turnIndexAfterMove, delta, state);
                gameService.makeMove(move);
                return;
            }
        }
        // Is it the computer's turn?
        isComputerTurn = canMakeMove &&
            params.playersInfo[params.yourPlayerIndex].playerId === '';
        if (isComputerTurn) {
            // To make sure the player won't click something and send a move instead of the computer sending a move.
            canMakeMove = false;
            // We calculate the AI move only after the animation finishes,
            // because if we call aiService now
            // then the animation will be paused until the javascript finishes.
            sendComputerMove();
        }
    }
    function animationEndedCallback() {
        $rootScope.$apply(function () {
            log.info("Animation ended");
            animationEnded = true;
            sendComputerMove();
        });
    }
    function getHighestLeftTree() {
        if (tileOrientationCache[5]) {
            return 5;
        }
        if (tileOrientationCache[4]) {
            return 4;
        }
        if (tileOrientationCache[3]) {
            return 3;
        }
        if (tileOrientationCache[2]) {
            return 2;
        }
        if (tileOrientationCache[0]) {
            return 0;
        }
    }
    function getHighestRightTree() {
        if (tileOrientationCache[8]) {
            return 8;
        }
        if (tileOrientationCache[7]) {
            return 7;
        }
        if (tileOrientationCache[6]) {
            return 6;
        }
        if (tileOrientationCache[1]) {
            return 1;
        }
        if (tileOrientationCache[0]) {
            return 0;
        }
    }
    function sendComputerMove() {
        if (!isComputerTurn) {
            return;
        }
        isComputerTurn = false; // to make sure the computer can only move once.
        var leftNumber = getBoardNumber(false, getHighestLeftTree());
        var rightNumber = getBoardNumber(true, getHighestRightTree());
        state.board.currentLeft = leftNumber;
        state.board.currentRight = rightNumber;
        log.info("sendComputerMove(): Calling make move for computer move for left number: " + leftNumber + " and right number " + rightNumber);
        gameService.makeMove(aiService.createComputerMove(turnIndex, state, leftNumber, rightNumber));
    }
    function getBoardNumber(isRight, tree) {
        var tileKey = !tileCache[tree] ? undefined : tileCache[tree][tileCache[tree].length - 1].tileKey;
        var tile = !tileKey ? undefined : state[tileKey];
        var orientation = !tileOrientationCache[tree] ? undefined :
            tileOrientationCache[tree][tileOrientationCache[tree].length - 1];
        if (isRight) {
            var rightNumber = orientation === undefined ? undefined : orientation === "regular" ?
                tile.rightNumber : tile.leftNumber;
            return rightNumber;
        }
        else {
            var leftNumber = orientation === undefined ? undefined : orientation === "regular" ?
                tile.rightNumber : tile.leftNumber;
            return leftNumber;
        }
    }
    function wasPassMove(testState) {
        if (!!testState && !!testState.delta && !!testState.delta.play && testState.delta.play === Play.PASS) {
            return true;
        }
        return false;
    }
    function passPlay() {
        log.info("Tried to pass");
        if (!canMakeMove) {
            return;
        }
        try {
            var play = Play.PASS;
            $rootScope.selectedTile = undefined;
            var move = gameLogic.createMove(state, turnIndex, { play: play }, state);
            canMakeMove = false;
            log.info("Making move to pass");
            gameService.makeMove(move);
        }
        catch (e) {
            log.info("Cannot make pass play");
            return;
        }
    }
    game.passPlay = passPlay;
    function placeTileOnTree(treeId) {
        log.info(["Tried to make play for tree:", treeId]);
        if (window.location.search === '?throwException') {
            throw new Error("Throwing the error because URL has '?throwException'");
        }
        if (!canMakeMove || $rootScope.selectedTile === undefined) {
            return;
        }
        try {
            var play = isRightTree(treeId) ? Play.RIGHT : Play.LEFT;
            var tileKey = $rootScope.selectedTile;
            state.delta = { play: play, tileKey: tileKey };
            var leftNumber = getBoardNumber(false, getHighestLeftTree());
            var rightNumber = getBoardNumber(true, getHighestRightTree());
            //It is the first tile
            if (leftNumber === undefined && rightNumber === undefined) {
                leftNumber = state[tileKey].leftNumber;
                rightNumber = state[tileKey].rightNumber;
            }
            state.board.currentLeft = leftNumber;
            state.board.currentRight = rightNumber;
            var move = gameLogic.createMove(state, turnIndex, { play: play, tileKey: tileKey }, state);
            canMakeMove = false; // to prevent making another move
            log.info("placeTileOnTree(): Making move to place tile on tree. Calling makeMove with move " + JSON.stringify(move));
            $rootScope.selectedTile = undefined;
            gameService.makeMove(move);
        }
        catch (e) {
            log.info(["Cannot make play for tree:", treeId]);
            return;
        }
    }
    game.placeTileOnTree = placeTileOnTree;
    function getTileImageSourceForPlayer(playerId, tileId) {
        if (!state.players[playerId].hand) {
            return constructImageUrl(undefined);
        }
        return constructImageUrl(state[state.players[playerId].hand[tileId]]);
    }
    game.getTileImageSourceForPlayer = getTileImageSourceForPlayer;
    function getNumberOfTilesForPlayer(playerId) {
        if (!state.players || !state.players[playerId] || !state.players[playerId].hand) {
            return [];
        }
        return getArrayUpToNumber(state.players[playerId].hand.length);
    }
    game.getNumberOfTilesForPlayer = getNumberOfTilesForPlayer;
    /* Get number of players but exclude current player
    */
    function getNumberOfPlayers() {
        if (!state || !state.players) {
            return 1;
        }
        return state.players.length - 1;
    }
    game.getNumberOfPlayers = getNumberOfPlayers;
    function makeBuyPlay(tileIndex) {
        if (!canMakeMove || !state || !state.house || !state.house.hand[tileIndex]) {
            return;
        }
        try {
            var delta = { play: Play.BUY, tileKey: state.house.hand[tileIndex] };
            state.delta = delta;
            var move = gameLogic.createMove(state, turnIndex, delta, state);
            canMakeMove = false; // to prevent making another move
            gameService.makeMove(move);
        }
        catch (e) {
            log.info(["Cannot make buy play for tile:", tileIndex]);
            return;
        }
    }
    game.makeBuyPlay = makeBuyPlay;
    function getOpponentIds(currentPlayer) {
        var players = state.players;
        if (!players) {
            return [];
        }
        var result = [];
        for (var i = 0; i < players.length; i++) {
            if (i == currentPlayer) {
                continue;
            }
            result.push(i);
        }
        return result;
    }
    game.getOpponentIds = getOpponentIds;
    function getNumberOfTilesForBoneYard() {
        if (!state.house || !state.house.hand) {
            return [];
        }
        return getArrayUpToNumber(state.house.hand.length);
    }
    game.getNumberOfTilesForBoneYard = getNumberOfTilesForBoneYard;
    function getArrayUpToNumber(maxNumber) {
        var result = [];
        for (var i = 0; i < maxNumber; i++) {
            result.push(i);
        }
        return result;
    }
    function shouldSlowlyAppear(tileIndex, playerId) {
        return !animationEnded && state.delta && state.delta.play === Play.BUY && state.players[playerId].hand[tileIndex] === state.delta.tileKey;
    }
    game.shouldSlowlyAppear = shouldSlowlyAppear;
    function shouldEnlarge(tileLevel, tree) {
        if (animationEnded || !state.delta) {
            return false;
        }
        var tile = getTileAt(tileLevel, tree);
        return tile && state.delta.tileKey === tile.tileKey;
    }
    game.shouldEnlarge = shouldEnlarge;
    function getTileAt(tileLevel, tree) {
        if (tileCache[tree]) {
            return tileCache[tree][tileLevel];
        }
        return undefined;
    }
    /* Decide if tile with this numebr should be shown. The tree parameter defines
    * if we are going left or right
    */
    function shouldShowImage(tileLevel, tree) {
        var tile = getTileAt(tileLevel, tree);
        return !(tile === undefined);
    }
    game.shouldShowImage = shouldShowImage;
    function registerSelectedPlayerTile(tileIndex) {
        $rootScope.selectedTile = state.players[$rootScope.yourPlayerIndex].hand[tileIndex];
    }
    game.registerSelectedPlayerTile = registerSelectedPlayerTile;
    function registerSelectedHouseTile(tileIndex) {
        $rootScope.tile = state.house.hand[tileIndex];
    }
    game.registerSelectedHouseTile = registerSelectedHouseTile;
    function getTreeBefore(tree) {
        if (tree === 1) {
            return 0;
        }
        if (tree === 6) {
            return 1;
        }
        if (tree === 7) {
            return 6;
        }
        if (tree === 2) {
            return 0;
        }
        if (tree === 3) {
            return 2;
        }
        if (tree === 4) {
            return 3;
        }
        if (tree === 5) {
            return 4;
        }
    }
    function getTreeAfter(tree, isRight) {
        if (isRight) {
            if (tree === 0) {
                return 1;
            }
            if (tree === 1) {
                return 6;
            }
            if (tree === 6) {
                return 7;
            }
            if (tree === 7) {
                return 8;
            }
            return undefined;
        }
        else {
            if (tree === 0) {
                return 2;
            }
            if (tree === 2) {
                return 3;
            }
            if (tree === 3) {
                return 4;
            }
            if (tree === 4) {
                return 5;
            }
            return undefined;
        }
    }
    function getTileLevel(isRight, tileKey) {
        if (state.board === undefined || state.board.root === undefined) {
            return -1;
        }
        var board = state.board;
        if (board.root.tileKey === tileKey) {
            return 0;
        }
        var i = 1;
        var tile = isRight ? board.root.rightTile : board.root.leftTile;
        while (tile.tileKey != tileKey) {
            i = i + 1;
            tile = isRight ? tile.rightTile : tile.leftTile;
        }
        return i;
    }
    game.getTileLevel = getTileLevel;
    function getTileOrientation(tileLevel, tree) {
        if (tileOrientationCache[tree] && tileOrientationCache[tree][tileLevel]) {
            return tileOrientationCache[tree][tileLevel];
        }
        return undefined;
    }
    game.getTileOrientation = getTileOrientation;
    function getImageClass(tileLevel, tree, classForComparison) {
        if (!!treeClassesCache[tree] && !!treeClassesCache[tree][tileLevel]) {
            return classForComparison === treeClassesCache[tree][tileLevel];
        }
        return undefined;
    }
    game.getImageClass = getImageClass;
    function getClassForTree(tree, flipped) {
        if (tree === 0) {
            return "rootTile";
        }
        if (tree === 1) {
            if (flipped) {
                return "horizontalTile";
            }
            return "horizontalTileFlip";
        }
        if (tree === 2) {
            if (flipped) {
                return "horizontalTileFlip";
            }
            return "horizontalTile";
        }
        if (tree === 3 || tree === 4) {
            if (flipped) {
                return "maxWidthHeightTileFlip";
            }
            else {
                return "maxWidthHeightTile";
            }
        }
        if (tree === 5) {
            if (flipped) {
                return "tree5Tile";
            }
            else {
                return "tree5TileFlip";
            }
        }
        if (tree === 6) {
            if (flipped) {
                return "maxWidthHeightTile";
            }
            else {
                return "maxWidthHeightTileFlip";
            }
        }
        if (tree === 7) {
            if (flipped) {
                return "tree5TileFlip";
            }
            else {
                return "tree5Tile";
            }
        }
    }
    /*Get image source for tile at the indicated level on right or left tree*/
    function getImageSource(tileLevel, tree) {
        if (treeSourcesCache[tree] && treeSourcesCache[tree][tileLevel]) {
            return treeSourcesCache[tree][tileLevel];
        }
        return undefined;
    }
    game.getImageSource = getImageSource;
    function isRightTree(tree) {
        return (tree === 0 || tree === 1 || tree === 6 || tree === 7 || tree === 8);
    }
    /*If tile exists, return the real tile. Otherwise, return blank tile.
    * Also take into consideration that the lower number of the tile is always on the left of the name.
    */
    function constructImageUrl(tile) {
        if (tile === undefined || tile === null) {
            return "imgs/dominoes/domino-blank.svg";
        }
        return tile.leftNumber <= tile.rightNumber ?
            "imgs/dominoes/domino-" + tile.leftNumber + "-" + tile.rightNumber + ".svg" :
            "imgs/dominoes/domino-" + tile.rightNumber + "-" + tile.leftNumber + ".svg";
    }
    function getFinalScore(player) {
        var scores = $rootScope.scores;
        return "" + scores[player];
    }
    game.getFinalScore = getFinalScore;
    function getPlayerIconSource(player) {
        var imageNumber = player % 2; //2 is chosen because there are only two images.
        if (imageNumber < 0 || imageNumber === -0) {
            imageNumber = 0;
        }
        return "imgs/player/image" + imageNumber + ".svg";
    }
    game.getPlayerIconSource = getPlayerIconSource;
    function isSelectedTile(tileIndex, playerId) {
        var tileKey = state.players[playerId] ? state.players[playerId].hand[tileIndex] : undefined;
        return $rootScope.selectedTile === undefined ? false : $rootScope.selectedTile === tileKey;
    }
    game.isSelectedTile = isSelectedTile;
    function isPassAllowed(playerIndex) {
        var canStartOrBuy = (!state.board || !state.board.root) ? canStartGame(playerIndex) : canBuy();
        ;
        return !$rootScope.hasGameEnded && !canStartOrBuy;
    }
    game.isPassAllowed = isPassAllowed;
    function canBuy() {
        return state.house && state.house.hand && state.house.hand.length !== 0;
    }
    function canStartGame(playerIndex) {
        if ((state.board && state.board.root) || !state.players || !state.players[playerIndex] || !state.players[playerIndex].hand) {
            return false;
        }
        for (var i = 0; i < state.players[playerIndex].hand.length; i++) {
            var tile = state[state.players[playerIndex].hand[i]];
            if (tile.leftNumber === tile.rightNumber) {
                return true;
            }
        }
        return false;
    }
    // function handleDragEvent(type: string, clientX: number, clientY: number) {
    //   var el = angular.element(document.elementFromPoint(clientX, clientY));
    //       if( !dragEl && el.hasClass('checker') ) {
    //           childEl = el;
    //           row = +el.attr('data-row');
    //           col = +el.attr('data-col');
    //           pos = childEl[0].getBoundingClientRect();
    //       }
    //       else if( el.hasClass('checkerCell') ) {
    //           childEl = el.children();
    //           row = +el.attr('data-row');
    //           col = +el.attr('data-col');
    //           pos = childEl[0].getBoundingClientRect();
    //       }
    // }
    function populateCaches(tree, tileLevel, isRight, parent) {
        var board = state.board;
        var tile = undefined; //The tile
        var flipped = false; //Whether or not the tile is flipped
        if (!board || !board.root) {
            return;
        }
        //if on the first tile, populate both right and left trees and then return
        if (tileLevel === 0) {
            tile = state[board.root.tileKey];
            var orientation = "regular";
            if (!tileOrientationCache[tree]) {
                tileOrientationCache[tree] = [];
                treeSourcesCache[tree] = [];
                treeClassesCache[tree] = [];
                tileCache[tree] = [];
            }
            var image = constructImageUrl(tile === undefined ? undefined : tile);
            var imageClass = getClassForTree(tree, false);
            tileOrientationCache[tree][tileLevel] = orientation;
            treeSourcesCache[tree][tileLevel] = image;
            treeClassesCache[tree][tileLevel] = imageClass;
            tileCache[tree][tileLevel] = board.root;
            var nextTree = getTreeAfter(tree, true);
            var nextLevel = treeStructure[nextTree][0];
            populateCaches(nextTree, nextLevel, true, board.root);
            nextTree = getTreeAfter(tree, false);
            nextLevel = treeStructure[nextTree][0];
            populateCaches(nextTree, nextLevel, false, board.root);
            return;
        }
        else {
            tile = isRight ? parent.rightTile : parent.leftTile;
            if (tile === undefined) {
                return;
            }
            var tileWithNumbers = state[tile.tileKey];
            parent = state[parent.tileKey];
            //check if parent was flipped
            var parentFlipped = false;
            if (tileOrientationCache[tree]) {
                parentFlipped = tileOrientationCache[tree][tileLevel - 1] === "flipped";
            }
            else {
                var previousTree = getTreeBefore(tree);
                parentFlipped = tileOrientationCache[previousTree][tileOrientationCache[previousTree].length - 1] === "flipped";
            }
            if (tileWithNumbers !== undefined) {
                if (!parentFlipped && parent.leftNumber >= parent.rightNumber) {
                    if (tileWithNumbers.rightNumber === parent.leftNumber && tileWithNumbers.rightNumber > tileWithNumbers.leftNumber) {
                        flipped = true;
                    }
                    else if (tileWithNumbers.leftNumber === parent.leftNumber && tileWithNumbers.leftNumber > tileWithNumbers.rightNumber) {
                        flipped = true;
                    }
                }
                else if (!parentFlipped && parent.rightNumber >= parent.leftNumber) {
                    if (tileWithNumbers.rightNumber === parent.rightNumber && tileWithNumbers.rightNumber > tileWithNumbers.leftNumber) {
                        flipped = true;
                    }
                    else if (tileWithNumbers.leftNumber === parent.rightNumber && tileWithNumbers.leftNumber > tileWithNumbers.rightNumber) {
                        flipped = true;
                    }
                }
                else if (parentFlipped && parent.rightNumber <= parent.leftNumber) {
                    if (tileWithNumbers.rightNumber === parent.rightNumber && tileWithNumbers.rightNumber > tileWithNumbers.leftNumber) {
                        flipped = true;
                    }
                    else if (tileWithNumbers.leftNumber === parent.rightNumber && tileWithNumbers.leftNumber > tileWithNumbers.rightNumber) {
                        flipped = true;
                    }
                }
                else if (parentFlipped && parent.leftNumber <= parent.rightNumber) {
                    if (tileWithNumbers.rightNumber === parent.leftNumber && tileWithNumbers.rightNumber > tileWithNumbers.leftNumber) {
                        flipped = true;
                    }
                    else if (tileWithNumbers.leftNumber === parent.leftNumber && tileWithNumbers.leftNumber > tileWithNumbers.rightNumber) {
                        flipped = true;
                    }
                }
            }
        }
        var orientation = flipped ? "flipped" : "regular";
        var image = constructImageUrl(tileWithNumbers === undefined ? undefined : tileWithNumbers);
        var imageClass = getClassForTree(tree, orientation === "flipped");
        if (!tileOrientationCache[tree]) {
            tileOrientationCache[tree] = [];
            treeSourcesCache[tree] = [];
            treeClassesCache[tree] = [];
            tileCache[tree] = [];
        }
        tileOrientationCache[tree][tileLevel] = orientation;
        treeSourcesCache[tree][tileLevel] = image;
        treeClassesCache[tree][tileLevel] = imageClass;
        tileCache[tree][tileLevel] = tile;
        //Set next tile on the tree
        var nextTree;
        var nextLevel;
        //if on last tile
        if (tileLevel === treeStructure[tree][treeStructure[tree].length - 1]) {
            nextTree = getTreeAfter(tree, isRight);
            nextLevel = nextTree === undefined ? undefined : treeStructure[nextTree][0];
        }
        else {
            nextTree = tree;
            nextLevel = tileLevel + 1;
        }
        if (nextTree !== undefined) {
            populateCaches(nextTree, nextLevel, isRight, tile);
        }
    }
})(game || (game = {}));
angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
    .run(function () {
    $rootScope['game'] = game;
    translate.setLanguage('en', {
        RULES_OF_TICTACTOE: "Rules of Dominoes",
        RULES_SLIDE1_TITLE: "Do you know how to play dominoes?",
        RULES_SLIDE1: "The objective of the game is to play all of your tiles before the other player does.",
        RULES_SLIDE2_TITLE: "Getting Started",
        RULES_SLIDE2: "At the start of the game, each player receives 7 tiles. The left over tiles are placed at the boneyard.",
        RULES_SLIDE3_TITLE: "Starting the Match",
        RULES_SLIDE3: "A player with a double tile must start the game. If you don't have a double tile and is unable to start, click on pass.",
        RULES_SLIDE4_TITLE: "The ends match",
        RULES_SLIDE4: "The following player must play a piece in one of the extremeties such that the number of dots on the touching ends match.",
        RULES_SLIDE5_TITLE: "The Boneyard",
        RULES_SLIDE5: "If you cannot make a play, you must buy as many pieces as necessary from the boneyard. If the boneyard has no pieces, then you should pass.",
        RULES_SLIDE6_TITLE: "Game End",
        RULES_SLIDE6: "The player who places all his tiles on the board wins. If no player can make a play, the game ends. In this case, the player with the least number of dots in his/her hand wins.",
        SCORE: "Score",
        PASS: "PASS",
        CLOSE: "Close"
    });
    game.init();
});
;var aiService;
(function (aiService) {
    /**
     * Returns the move that the computer player should do for the given board.
     * alphaBetaLimits is an object that sets a limit on the alpha-beta search,
     * and it has either a millisecondsLimit or maxDepth field:
     * millisecondsLimit is a time limit, and maxDepth is a depth limit.
     */
    function createComputerMove(playerIndex, stateBeforeMove, leftNumber, rightNumber) {
        // console.log("createComputerMove(): stateBefore " + JSON.stringify(stateBeforeMove));
        var board = stateBeforeMove.board;
        var hand = stateBeforeMove.players[playerIndex].hand;
        var numberOfHouseTiles = !(stateBeforeMove.house) ? 0 : stateBeforeMove.house.hand.length;
        var key = undefined;
        var play = undefined;
        for (var i = 0; i < hand.length; i++) {
            if (!board || !board.root) {
                if (stateBeforeMove[hand[i]].leftNumber === stateBeforeMove[hand[i]].rightNumber) {
                    play = Play.RIGHT;
                }
            }
            else {
                play = getPlayBasedOnBoardTiles(stateBeforeMove[hand[i]], leftNumber, rightNumber);
            }
            if (play !== undefined) {
                key = hand[i];
                break;
            }
        }
        if (play === undefined) {
            if (!!board && !!board.root && numberOfHouseTiles != 0) {
                play = Play.BUY;
                key = stateBeforeMove.house.hand[0];
            }
            else {
                play = Play.PASS;
            }
        }
        var delta = play !== Play.PASS ? { tileKey: key, play: play } : { play: play };
        stateBeforeMove.delta = delta;
        var move = gameLogic.createMove(stateBeforeMove, playerIndex, delta, stateBeforeMove);
        return move;
    }
    aiService.createComputerMove = createComputerMove;
    function getPlayBasedOnBoardTiles(tile, leftNumber, rightNumber) {
        if (tile.leftNumber === leftNumber || tile.rightNumber === leftNumber) {
            return Play.LEFT;
        }
        else if (tile.leftNumber === rightNumber || tile.rightNumber === rightNumber) {
            return Play.RIGHT;
        }
        return undefined;
    }
})(aiService || (aiService = {}));
