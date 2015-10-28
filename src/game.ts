module game {
  let animationEnded = false;
  let canMakeMove = false;
  let isComputerTurn = false;
  let state: IState = null;
  let turnIndex: number = null;
  let treeSources: string[][] = [];
  let gameArea = document.getElementById("gameArea");
  let currentPlayerArea = document.getElementById("currentPlayer");
  let treeNumberOfTiles: number[] = [0, 0, 0]; //Store the number of tiles on the tree
  let treeMaxNumberOfTiles: number[] = [1, 6, 6]; //Max number of tiles for a tree
  var isUndefinedOrNull = function (val) {
          return angular.isUndefined(val) || val === null;
        };
  export let isHelpModalShown: boolean = false;
  var dndStartPos = null;
        var dndElem = null;

  export function init() {
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
    console.error("sendComputerMove(): Special Error: Calling make move for computer move");
    gameService.makeMove(
        aiService.createComputerMove(turnIndex, state));
  }

  function updateUI(params: IUpdateUI): void {
    animationEnded = false;
    state = params.stateAfterMove;
    $rootScope.state = state;

    console.error("updateUI(): updating UI. State is: " + JSON.stringify(state));

    if (!state.board && params.yourPlayerIndex === params.turnIndexAfterMove) {
      let move = gameLogic.getInitialMove(params.numberOfPlayers);
      console.error("updateUI(): make initial move");
      gameService.makeMove(move);
    }
    canMakeMove = params.turnIndexAfterMove >= 0 && // game is ongoing
      params.yourPlayerIndex === params.turnIndexAfterMove; // it's my turn
    turnIndex = params.turnIndexAfterMove;

    $rootScope.yourPlayerIndex = params.yourPlayerIndex;
    $rootScope.turnIndex = params.turnIndexAfterMove;

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

  export function placeTileOnTree(treeId: number): void {
    log.info(["Tried to make play for tree:", treeId]);
    if (window.location.search === '?throwException') { // to test encoding a stack trace with sourcemap
      throw new Error("Throwing the error because URL has '?throwException'");
    }
    if (!canMakeMove) {
      return;
    }

    try {
      state.delta.play = (treeId === 0 || treeId === 1) ? Play.RIGHT : Play.LEFT;
      state.delta.tileKey = $rootScope.selectedTile;
      let move = gameLogic.createMove(state, turnIndex);
      canMakeMove = false; // to prevent making another move
      console.error("placeTileOnTree(): Making move to place tile on tree. State is " + JSON.stringify(state));
      gameService.makeMove(move);
    } catch (e) {
      log.info(["Cannot make play for tree:", treeId]);
      return;
    }
  }

  export function getTileImageSourceForPlayer(playerId: number, tileId: number): string
  {
    if (!state.players[playerId].hand) { return constructImageUrl(undefined); }

    return constructImageUrl(state[state.players[playerId].hand[tileId]]);
  }

  export function getNumberOfTilesForPlayer(playerId: number): number[]
  {
    if (!state.players || !state.players[turnIndex] || !state.players[turnIndex].hand)
    {
      return [];
    }

    return getArrayUpToNumber(state.players[turnIndex].hand.length);
  }

  /* Get number of players but exclude current player
  */
  export function getNumberOfPlayers(): number
  {
    if (!state || !state.players)
    {
      return 1;
    }

    return state.players.length - 1;
  }

  export function makeBuyPlay(tileIndex: number)
  {
    if (!canMakeMove || !state || !state.house || !state.house.hand[tileIndex])
    {
      return;
    }

    try
    {
      state.delta = {play: Play.BUY, tileKey: state.house.hand[tileIndex]};
      $rootScope.state = state;
      let move = gameLogic.createMove(state, turnIndex);
      canMakeMove = false; // to prevent making another move

      console.error("makeBuyPlay(): Making buy move. State is " + JSON.stringify(state));
      gameService.makeMove(move);

    } catch (e) {
      log.info(["Cannot make buy play for tile:", tileIndex]);
      return;
    }
  }

  export function getOpponentIds(currentPlayer: number): number[]
  {
    var players = state.players;
    if (!players) { return []; }

    var result: number[] = [];
    for (var i = 0; i < players.length; i++)
    {
      if (i == currentPlayer) { continue; }
      result.push(i);
    }

    return result;
  }

  export function getNumberOfTilesForBoneYard(): number
  {
    if (!state.house || !state.house.hand)
    {
      return [];
    }

    return getArrayUpToNumber(state.house.hand.length);
  }

  function getArrayUpToNumber(maxNumber: number): number[]
  {

    var result: number[] = [];
    for (var i = 0; i < maxNumber; i++)
    {
      result.push(i);
    }

    return result;
  }

  /* Decide if tile with this numebr should be shown. The tree parameter defines
  * if we are going left or right
  */
  export function shouldShowImage(tileLevel: number, tree: number): boolean {
    let board = state.board;

    if (!board || !board.root)
    {
      return false;
    }

    //Root tile
    if (tree === 0)
    {
      if (tileLevel != 0) { return false; }
      return !!board.root;
    }

    //Check if tile at level (i) exists for right or left tree
    var i = 1;
    var tile: ITile = tree === 1 ? board.root.rightTile : board.root.leftTile;

    while (i !== tileLevel || tile !== undefined)
    {
      i++;
      tile = tree === 1 ? tile.rightTile : tile.leftTile;
    }

    return !(tile === undefined)
  }

  export function registerSelectedPlayerTile(tileIndex: number)
  {
    $rootScope.selectedTile = state.players[$rootScope.yourPlayerIndex].hand[tileIndex];
  }

  export function registerSelectedHouseTile(tileIndex: number)
  {
    $rootScope.tile = state.house.hand[tileIndex];
  }

  /*Get image source for tile at the indicated level on right or left tree*/
  export function getImageSource(tileLevel: number, tree: string): string {
    let board = state.board;

    if (!treeSources[tree][tileLevel])
    {
      return treeSources[tree][tileLevel];
    }

    //Root tile
    if (tree === '0')
    {
      if (tileLevel != 0) { return; }
      var image: string = constructImageUrl(board.root);
      treeSources[tree][tileLevel] = image;
      return image;
    }

    //Check if tile at level (i) exists for right or left tree
    var i = 1;
    var tile: ITile = tree === '1' ? board.root.rightTile : board.root.leftTile;

    while (i !== tileLevel && tile !== undefined)
    {
      i++;
      tile = tree === '1' ? tile.rightTile : tile.leftTile;
    }

    var image: string = constructImageUrl(tile);
    treeSources[tree][tileLevel] = image;
    return image;
  }

  /*If tile exists, return the real tile. Otherwise, return blank tile.
  * Also take into consideration that the lower number of the tile is always on the left of the name.
  */
  function constructImageUrl(tile: ITile) : string
  {
    return tile === undefined ? "imgs/dominoes/domino-blank.svg" :
    tile.leftNumber <= tile.rightNumber ?
    "imgs/dominoes/domino-" + tile.leftNumber + "-" + tile.rightNumber + ".svg" :
    "imgs/dominoes/domino-" + tile.rightNumber + "-" + tile.leftNumber + ".svg";
  }

  // export function shouldSlowlyAppear(row: number, col: number): boolean {
  //   return !animationEnded &&
  //       state.delta &&
  //       state.delta.row === row && state.delta.col === col;
  // }
}

//   function handleDragEvent(type, clientX, clientY) {
//       if (!$scope.isYourTurn || !isWithinGameArea(clientX, clientY)) {
//           draggingLines.style.display = "none";
//           myDrag.style.display = "none";
//           return;
//       }
//       var pos = getDraggingTilePosition(clientX, clientY);
//       if (type === "touchstart" ) {
//           dragStartHandler(pos);
//       }
//       if (!dragFrom) {
//           // end dragging if not a valid drag start
//           return;
//       }
//       if (type === "touchend") {
//           dragEndHandler(pos);
//       } else {
//           // drag continues
//           dragContinueHandler(pos);
//       }
//       if (type === "touchend" || type === "touchcancel" || type === "touchleave") {
//           draggingLines.style.display = "none";
//           myDrag.style.display = "none";
//           dragFrom = null;
//       }
//   }
// }

angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
  .run(function () {
  $rootScope['game'] = game;
  translate.setLanguage('en',  {
    RULES_OF_TICTACTOE: "Rules of Dominoes",
    RULES_SLIDE1: "You and your opponent take turns to mark the grid in an empty spot. The first mark is X, then O, then X, then O, etc.",
    RULES_SLIDE2: "The first to mark a whole row, column or diagonal wins.",
    CLOSE: "Close"
  });
  game.init();
});
