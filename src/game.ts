module game {
  let animationEnded = false;
  let canMakeMove = false;
  let isComputerTurn = false;
  let state: IState = null;
  let turnIndex: number = null;
  let treeSources: string[][] = [];
  let treeClasses: string[][] = [];
  let gameArea = document.getElementById("gameArea");
  let currentPlayerArea = document.getElementById("currentPlayer");
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

    $rootScope.hasGameEnded = false;

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
    log.info("sendComputerMove(): Calling make move for computer move");
    gameService.makeMove(
        aiService.createComputerMove(turnIndex, state));
  }

  function updateUI(params: IUpdateUI): void {
    animationEnded = false;
    state = params.stateAfterMove;
    $rootScope.state = state;

    log.info("updateUI(): updating UI.");

    if (!state.board && params.yourPlayerIndex === params.turnIndexAfterMove) {
      let move = gameLogic.getInitialMove(params.numberOfPlayers);
      log.info("updateUI(): make initial move. Calling makeMove " + JSON.stringify(move));
      gameService.makeMove(move);
    }
    canMakeMove = params.turnIndexAfterMove >= 0 && // game is ongoing
      params.yourPlayerIndex === params.turnIndexAfterMove; // it's my turn
    turnIndex = params.turnIndexAfterMove;

    $rootScope.yourPlayerIndex = params.yourPlayerIndex;
    $rootScope.turnIndex = params.turnIndexAfterMove;

    if (!!state && !!state.delta && state.delta.play === Play.REVEAL)
    {
      let delta = { play: Play.END };
      state.delta = delta;
      let move = gameLogic.createMove(state, params.turnIndexAfterMove, delta, state);
      gameService.makeMove(move);
    }
    else if (!!state && !!state.delta && state.delta.play === Play.END)
    {
      $rootScope.hasGameEnded = true;
      $rootScope.scores = params.endMatchScores;
      $rootScope.yourPlayerIndex = params.turnIndexBeforeMove;
      return;
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
    if (!canMakeMove || $rootScope.selectedTile === undefined) {
      return;
    }

    try {
      let play = isRightTree(treeId) ? Play.RIGHT : Play.LEFT;
      let tileKey = $rootScope.selectedTile;
      state.delta = { play: play, tileKey: tileKey };
      let move = gameLogic.createMove(state, turnIndex, { play: play, tileKey: tileKey }, state);
      canMakeMove = false; // to prevent making another move
      log.error("placeTileOnTree(): Making move to place tile on tree. Calling makeMove with move " + JSON.stringify(move));
      $rootScope.selectedTile = undefined;
      gameService.makeMove(move);
    } catch (e) {
      log.error(["Cannot make play for tree:", treeId]);
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
    if (!state.players || !state.players[playerId] || !state.players[playerId].hand)
    {
      return [];
    }

    return getArrayUpToNumber(state.players[playerId].hand.length);
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
      let delta = {play: Play.BUY, tileKey: state.house.hand[tileIndex]};
      let move = gameLogic.createMove(state, turnIndex, delta, state);
      canMakeMove = false; // to prevent making another move

      console.error("makeBuyPlay(): Calling makeMove");
      gameService.makeMove(move);

    } catch (e) {
      log.error(["Cannot make buy play for tile:", tileIndex]);
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
    var tile: ITile = isRightTree(tree) ? board.root.rightTile : board.root.leftTile;

    while (i !== tileLevel && tile !== undefined)
    {
      i++;
      tile = isRightTree(tree) ? tile.rightTile : tile.leftTile;
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

  export function getImageClass(tileLevel: number, tree: number): string{
    let board = state.board;

    if (!!treeClasses[tree] && !!treeClasses[tree][tileLevel])
    {
      return treeClasses[tree][tileLevel];
    }

    if (board.leftMost === board.root.tileKey && board.rightMost === board.root.tileKey)
    {
      var imageClass: string = "rootTile";
      treeClasses[tree] = [];
      treeClasses[tree][tileLevel] = imageClass;
      return imageClass;
    }

    var parent:ITile = board.root;
    //Check if tile at level (i) exists for right or left tree
    var flipped: boolean = false;
    var i = 1;
    var tile: ITile = isRightTree(tree) ? board.root.rightTile : board.root.leftTile;

    while (i !== tileLevel && tile !== undefined)
    {
      parent = tile;
      i++;
      tile = isRightTree(tree) ? tile.rightTile : tile.leftTile;
    }

    tile = tile === undefined ? undefined : state[tile.tileKey];
    parent = parent === undefined ? undefined : state[parent.tileKey];

    //parent was flipped
    var parentFlipped = false;
    if (!!treeClasses[tree])
    { parentFlipped = treeClasses[tree][tileLevel-1] === getClassForTree(tree, true);}

    if (tile !== undefined && !isRightTree(tree)) //LEFT TREE
    {
      if (!parentFlipped && parent.leftNumber >= parent.rightNumber)
      {
        if (tile.rightNumber === parent.leftNumber && tile.rightNumber > tile.leftNumber){ flipped = true; }
        else if (tile.leftNumber === parent.leftNumber && tile.leftNumber > tile.rightNumber) { flipped = true; }
      }
      else if (!parentFlipped && parent.rightNumber >= parent.leftNumber)
      {
        if (tile.rightNumber === parent.rightNumber && tile.rightNumber > tile.leftNumber){ flipped = true; }
        else if (tile.leftNumber === parent.rightNumber && tile.leftNumber > tile.rightNumber) { flipped = true; }
      }
      else if (parentFlipped && parent.rightNumber <= parent.leftNumber)
      {
        if (tile.rightNumber === parent.rightNumber && tile.rightNumber > tile.leftNumber){ flipped = true; }
        else if (tile.leftNumber === parent.rightNumber && tile.leftNumber > tile.rightNumber) { flipped = true; }
      }
      else if (parentFlipped && parent.leftNumber <= parent.rightNumber)
      {
        if (tile.rightNumber === parent.leftNumber && tile.rightNumber > tile.leftNumber){ flipped = true; }
        else if (tile.leftNumber === parent.leftNumber && tile.leftNumber > tile.rightNumber) { flipped = true; }
      }
    }
    else if (tile !== undefined)
    {
      if (isHighLow(tree))
      {
        if (!parentFlipped && parent.leftNumber > parent.rightNumber)
        {
          if (tile.rightNumber === parent.leftNumber && tile.rightNumber > tile.leftNumber){ flipped = true; }
          else if (tile.leftNumber === parent.leftNumber && tile.leftNumber > tile.rightNumber) { flipped = true; }
        }
        else if (!parentFlipped && parent.rightNumber > parent.leftNumber)
        {
          if (tile.rightNumber === parent.rightNumber && tile.rightNumber > tile.leftNumber){ flipped = true; }
          else if (tile.leftNumber === parent.rightNumber && tile.leftNumber > tile.rightNumber) { flipped = true; }
        }
        else if (parentFlipped && parent.leftNumber > parent.rightNumber)
        {
          if (tile.rightNumber === parent.rightNumber && tile.rightNumber > tile.leftNumber){ flipped = true; }
          else if (tile.leftNumber === parent.rightNumber && tile.leftNumber > tile.rightNumber) { flipped = true; }
        }
      }
    }
    var imageClass: string = getClassForTree(tree, flipped);

    if (!treeClasses[tree])
    {
      treeClasses[tree] = [];
    }
    treeClasses[tree][tileLevel] = imageClass;
    return imageClass;

  }

  function getClassForTree(tree: number, flipped: boolean): string{
    if (tree === 1 || tree === 2){
      if (flipped){ return "horizontalTileFlip"; }
      return "horizontalTile";
    }
    if (tree === 3 || tree === 4)
    {
      if (flipped){ return "maxWidthHeightTileFlip"; }
      else { return "maxWidthHeightTile"; }
    }
    if (tree === 5)
    {
      if (flipped){}
      else { return "tree5Tile"; }
    }
  }

  /*Get image source for tile at the indicated level on right or left tree*/
  export function getImageSource(tileLevel: number, tree: number): string {
    let board = state.board;

    if (!!treeSources[tree] && !!treeSources[tree][tileLevel])
    {
      return treeSources[tree][tileLevel];
    }

    //Root tile
    if (board.leftMost === board.root.tileKey && board.rightMost === board.root.tileKey)
    {
      var image: string = constructImageUrl(state[board.root.tileKey]);
      treeSources[tree] = [];
      treeSources[tree][tileLevel] = image;
      return image;
    }

    var i = 1;
    var tile: ITile = isRightTree(tree) ? board.root.rightTile : board.root.leftTile;

    while (i !== tileLevel && tile !== undefined)
    {
      i++;
      tile = isRightTree(tree) ? tile.rightTile : tile.leftTile;
    }

    tile = tile === undefined ? undefined : state[tile.tileKey];

    var image: string = constructImageUrl(tile === undefined ? undefined : tile);
    if (!treeSources[tree])
    {
      treeSources[tree] = [];
    }
    treeSources[tree][tileLevel] = image;
    return image;
  }

  //3 is not
  function isHighLow(tree: number)
  {
    return (tree === 2 || tree === 1);
  }

  function isRightTree(tree: number): boolean
  {
    return (tree === 0 || tree === 1 || tree === 6 || tree === 7 || tree === 8);
  }

  /*If tile exists, return the real tile. Otherwise, return blank tile.
  * Also take into consideration that the lower number of the tile is always on the left of the name.
  */
  function constructImageUrl(tile: ITile) : string
  {
    if(tile === undefined)
    {
        return "imgs/dominoes/domino-blank.svg";
    }

    return tile.leftNumber <= tile.rightNumber ?
      "imgs/dominoes/domino-" + tile.leftNumber + "-" + tile.rightNumber + ".svg" :
      "imgs/dominoes/domino-" + tile.rightNumber + "-" + tile.leftNumber + ".svg";
  }

  export function getFinalScore(player: number): string
  {
    var scores:number[] = $rootScope.scores;
    return "" + scores[player];
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
