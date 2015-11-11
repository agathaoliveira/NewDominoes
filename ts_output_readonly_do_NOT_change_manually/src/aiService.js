var aiService;
(function (aiService) {
    /**
     * Returns the move that the computer player should do for the given board.
     * alphaBetaLimits is an object that sets a limit on the alpha-beta search,
     * and it has either a millisecondsLimit or maxDepth field:
     * millisecondsLimit is a time limit, and maxDepth is a depth limit.
     */
    function createComputerMove(playerIndex, stateBeforeMove, leftNumber, rightNumber) {
        // We use alpha-beta search, where the search states are TicTacToe moves.
        // Recal that a TicTacToe move has 3 operations:
        // 0) endMatch or setTurn
        // 1) {set: {key: 'board', value: ...}}
        // 2) {set: {key: 'delta', value: ...}}]
        console.log("createComputerMove(): stateBefore " + JSON.stringify(stateBeforeMove));
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
