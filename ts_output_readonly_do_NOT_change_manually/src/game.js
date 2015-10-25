var game;
(function (game) {
    var animationEnded = false;
    var canMakeMove = false;
    var isComputerTurn = false;
    var state = null;
    var turnIndex = null;
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
        // See http://www.sitepoint.com/css3-animation-javascript-event-handlers/
        document.addEventListener("animationend", animationEndedCallback, false); // standard
        document.addEventListener("webkitAnimationEnd", animationEndedCallback, false); // WebKit
        document.addEventListener("oanimationend", animationEndedCallback, false); // Opera
    }
    game.init = init;
    function animationEndedCallback() {
        $rootScope.$apply(function () {
            log.info("Animation ended");
            animationEnded = true;
            if (isComputerTurn) {
                sendComputerMove();
            }
        });
    }
    function sendComputerMove() {
        gameService.makeMove(aiService.createComputerMove(turnIndex, state));
    }
    function updateUI(params) {
        animationEnded = false;
        state = params.stateAfterMove;
        if (!state.board) {
            var move = gameLogic.getInitialMove(params.numberOfPlayers);
            gameService.makeMove(move);
        }
        canMakeMove = params.turnIndexAfterMove >= 0 &&
            params.yourPlayerIndex === params.turnIndexAfterMove; // it's my turn
        turnIndex = params.turnIndexAfterMove;
        // Is it the computer's turn?
        isComputerTurn = canMakeMove &&
            params.playersInfo[params.yourPlayerIndex].playerId === '';
        if (isComputerTurn) {
            // To make sure the player won't click something and send a move instead of the computer sending a move.
            canMakeMove = false;
            // We calculate the AI move only after the animation finishes,
            // because if we call aiService now
            // then the animation will be paused until the javascript finishes.
            if (!state.delta) {
                // This is the first move in the match, so
                // there is not going to be an animation, so
                // call sendComputerMove() now (can happen in ?onlyAIs mode)
                sendComputerMove();
            }
        }
    }
    function treeClicked(treeId) {
        log.info(["Tried to make play for tree:", treeId]);
        if (window.location.search === '?throwException') {
            throw new Error("Throwing the error because URL has '?throwException'");
        }
        if (!canMakeMove) {
            return;
        }
        try {
            state.delta.play = (treeId === 0 || treeId === 1) ? Play.RIGHT : Play.LEFT;
            state.delta.tileKey = "tile0"; //TODO: SET THIS BASED ON WHICH TILE WAS DRAGGED TO THIS CELL
            var move = gameLogic.createMove(state, turnIndex);
            canMakeMove = false; // to prevent making another move
            gameService.makeMove(move);
        }
        catch (e) {
            log.info(["Cannot make play for tree:", treeId]);
            return;
        }
    }
    game.treeClicked = treeClicked;
    /* Decide if tile with this numebr should be shown. The tree parameter defines
    * if we are going left or right
    */
    function shouldShowImage(tileLevel, tree) {
        var board = state.board;
        //Root tile
        if (tree === 0) {
            if (tileLevel != 0) {
                return false;
            }
            return !board.root;
        }
        //Check if tile at level (i) exists for right or left tree
        var i = 1;
        var tile = tree === 1 ? board.root.rightTile : board.root.leftTile;
        while (i !== tileLevel || tile !== undefined) {
            i++;
            tile = tree === 1 ? tile.rightTile : tile.leftTile;
        }
        return !(tile === undefined);
    }
    game.shouldShowImage = shouldShowImage;
    /*Get image source for tile at the indicated level*/
    function getImageSource(tileNumber, tree) {
        var board = state.board;
        //Root tile
        if (tree === 0) {
            if (tileNumber != 0) {
                return;
            }
            return constructImageUrl(board.root);
        }
        //Check if tile at level (i) exists for right or left tree
        var i = 1;
        var tile = tree === 1 ? board.root.rightTile : board.root.leftTile;
        while (i !== tileNumber || tile !== undefined) {
            i++;
            tile = tree === 1 ? tile.rightTile : tile.leftTile;
        }
        return constructImageUrl(tile);
    }
    game.getImageSource = getImageSource;
    /*If tile exists, return the real tile. Otherwise, return blank tile.
    * Also take into consideration that the lower number of the tile is always on the left of the name.
    */
    function constructImageUrl(tile) {
        return tile === undefined ? "imgs/dominoes/domino-blank.svg" :
            tile.leftNumber <= tile.rightNumber ?
                "imgs/dominoes/domino-" + tile.leftNumber + "-" + tile.rightNumber + ".svg" :
                "imgs/dominoes/domino-" + tile.rightNumber + "-" + tile.leftNumber + ".svg";
    }
    function shouldSlowlyAppear(row, col) {
        return !animationEnded &&
            state.delta &&
            state.delta.row === row && state.delta.col === col;
    }
    game.shouldSlowlyAppear = shouldSlowlyAppear;
})(game || (game = {}));
angular.module('myApp', ['ngTouch', 'ui.bootstrap'])
    .run(['initGameServices', function (initGameServices) {
        $rootScope['game'] = game;
        translate.setLanguage('en', {
            RULES_OF_TICTACTOE: "Rules of Dominoes",
            RULES_SLIDE1: "You and your opponent take turns to mark the grid in an empty spot. The first mark is X, then O, then X, then O, etc.",
            RULES_SLIDE2: "The first to mark a whole row, column or diagonal wins.",
            CLOSE: "Close"
        });
        game.init();
    }]);
