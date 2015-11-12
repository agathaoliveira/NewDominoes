module game {
  let animationEnded = false;
  let canMakeMove = false;
  let isComputerTurn = false;
  let state: IState = null;
  let turnIndex: number = null;
  let treeSources: string[][] = [];
  let treeClasses: string[][] = [];
  let tileOrientation: string[][] = [];
  let gameArea = document.getElementById("gameArea");
  let currentPlayerArea = document.getElementById("currentPlayer");
  var isUndefinedOrNull = function (val) {
          return angular.isUndefined(val) || val === null;
        };
  export let isHelpModalShown: boolean = false;


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

  function getHighestLeftTree(): number
  {
    if (!!tileOrientation[2]) { return 2;}
    if (!!tileOrientation[3]) { return 3;}
    if (!!tileOrientation[4]) { return 4;}
    if (!!tileOrientation[5]) { return 5;}
  }

  function getHighestRightTree(): number
  {
    if (!!tileOrientation[8]) { return 8;}
    if (!!tileOrientation[7]) { return 7;}
    if (!!tileOrientation[6]) { return 6;}
    if (!!tileOrientation[1]) { return 1;}
    if (!!tileOrientation[0]) { return 0;}
  }

  function sendComputerMove() {
    var leftNumber = getBoardNumber(false, getHighestLeftTree());
    var rightNumber = getBoardNumber(true, getHighestRightTree());
    log.info("sendComputerMove(): Calling make move for computer move for left number: " + leftNumber + " and right number " + rightNumber);
    gameService.makeMove(
        aiService.createComputerMove(turnIndex, state, leftNumber, rightNumber));
  }

  function getBoardNumber(isRight: boolean, tree: number): number
  {
    let board = state.board;

    if (board === undefined) { return undefined; }

    if (isRight)
    {
      var rightLevel = getTileLevel(true, board.rightMost);
      var rightOrientation = rightLevel === -1 ? undefined : getTileOrientation(rightLevel, tree);
      var rightNumber = rightOrientation === undefined ? undefined : rightOrientation === "regular" ? state[board.rightMost].rightNumber : state[board.rightMost].leftNumber;

      return rightNumber;
    }
    else
    {
      var leftLevel = getTileLevel(false, board.leftMost);
      var leftOrientation = leftLevel === -1 ? undefined : getTileOrientation(leftLevel, tree);
      var leftNumber = leftOrientation === undefined ? undefined : leftOrientation === "regular" ? state[board.leftMost].rightNumber : state[board.leftMost].leftNumber;

      return leftNumber;
    }
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
      return;
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
      return;
    }
    else if (!!state && !!state.delta && state.delta.play === Play.END)
    {
      $rootScope.hasGameEnded = true;
      $rootScope.scores = params.endMatchScores;
      $rootScope.yourPlayerIndex = params.turnIndexBeforeMove;
      return;
    }

    if (canMakeMove)
    {
      if (wasPassMove(params.stateBeforeMove) && wasPassMove(params.stateAfterMove))
      {
        let delta = { play: Play.REVEAL };
        let move = gameLogic.createMove(state, params.turnIndexAfterMove, delta, state);
        gameService.makeMove(move);
        return ;
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
      // if (!state.delta) {
      //   // This is the first move in the match, so
      //   // there is not going to be an animation, so
      //   // call sendComputerMove() now (can happen in ?onlyAIs mode)
      //
      // }
      sendComputerMove();
    }
  }

  function wasPassMove(testState: IState): boolean
  {
    if (!!testState && !!testState.delta && !!testState.delta.play && testState.delta.play === Play.PASS)
    {
      return true;
    }

    return false;
  }

  export function passPlay():void
  {
    log.info("Tried to pass");
    if (!canMakeMove) {
      return;
    }
    try {
      let play = Play.PASS;
      $rootScope.selectedTile = undefined;
      let move = gameLogic.createMove(state, turnIndex, { play: play}, state);
      canMakeMove = false;
      log.info("Making move to pass");
      gameService.makeMove(move);
    } catch (e) {
      log.error(["Cannot make play for tree:", treeId]);
      return;
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
      log.info("placeTileOnTree(): Making move to place tile on tree. Calling makeMove with move " + JSON.stringify(move));
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

  export function shouldSlowlyAppear(tileIndex: number, playerId: number): boolean
  {
    return !animationEnded && state.delta && state.delta.play === Play.BUY && state.players[playerId].hand[tileIndex] === state.delta.tileKey;
  }

  export function shouldEnlarge(tileLevel: number, tree: number): boolean {

    if (animationEnded || !state.delta){ return false; }

    var tile = getTileAt(tileLevel, tree);

    return tile && state.delta.tileKey === tile.tileKey;
  }

  function getTileAt(tileLevel: number, tree: number): ITile
  {
    let board = state.board;

    if (!board || !board.root)
    {
      return undefined;
    }

    var tile: ITile;
    //Root tile
    if (tree === 0)
    {
      if (tileLevel != 0) { return undefined; }
      tile = board.root;
    }
    else
    {
      //Check if tile at level (i) exists for right or left tree
      var i = 1;
      tile = isRightTree(tree) ? board.root.rightTile : board.root.leftTile;

      while (i !== tileLevel && tile !== undefined)
      {
        i++;
        tile = isRightTree(tree) ? tile.rightTile : tile.leftTile;
      }
    }

    return tile;
  }

  /* Decide if tile with this numebr should be shown. The tree parameter defines
  * if we are going left or right
  */
  export function shouldShowImage(tileLevel: number, tree: number): boolean {
    var tile = getTileAt(tileLevel, tree);
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

  function getTreeBefore(tree: number):number
  {
    if (tree === 1) { return 0; }
    if (tree === 6) { return 1; }
    if (tree === 7) { return 6; }
    if (tree === 2) { return 0; }
    if (tree === 3) { return 2; }
    if (tree === 4) { return 3; }
    if (tree === 5) { return 4; }
  }

  export function getTileLevel(isRight: boolean, tileKey: string): number
  {
    if (state.board === undefined || state.board.root === undefined) { return -1; }

    let board = state.board;

    if (board.root.tileKey === tileKey)
    {
      return 0;
    }

    var i = 1;
    var tile: ITile = isRight ? board.root.rightTile : board.root.leftTile;

    while (tile.tileKey != tileKey)
    {
      i = i + 1;
      tile = isRight ? tile.rightTile : tile.leftTile;
    }

    return i;
  }

  export function getTileOrientation(tileLevel: number, tree: number):string{

    if (!!tileOrientation[tree] && !!tileOrientation[tree][tileLevel])
    {
      return tileOrientation[tree][tileLevel];
    }

    var board: IBoard = state.board;

    if (board.leftMost === board.root.tileKey && board.rightMost === board.root.tileKey)
    {
      var orientation: string = "regular";
      tileOrientation[tree] = [];
      tileOrientation[tree][tileLevel] = orientation;
      return orientation;
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
    if (tileLevel === 0) { return "regular"; }
    if (!!tileOrientation[tree])
    { parentFlipped = tileOrientation[tree][tileLevel-1] === "flipped";}
    else {
      var previousTree: number = getTreeBefore(tree);
      parentFlipped = tileOrientation[previousTree][tileLevel-1] === "flipped";
    }

    if (tile !== undefined)
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

    var orientation: string = flipped ? "flipped" : "regular";

    if (!tileOrientation[tree])
    {
      tileOrientation[tree] = [];
    }
    tileOrientation[tree][tileLevel] = orientation;
    return orientation;

  }

  export function getImageClass(tileLevel: number, tree: number, classForComparison: string): boolean{

    if (!!treeClasses[tree] && !!treeClasses[tree][tileLevel])
    {
      return classForComparison === treeClasses[tree][tileLevel];
    }

    if (tileLevel === 0) { return "rootTile"; }

    var orientation: string = getTileOrientation(tileLevel, tree);
    var imageClass: string = getClassForTree(tree, orientation === "flipped");

    if (!treeClasses[tree])
    {
      treeClasses[tree] = [];
    }
    treeClasses[tree][tileLevel] = imageClass;
    return imageClass === classForComparison;

  }

  function getClassForTree(tree: number, flipped: boolean): string{

    if (tree === 0) { return "rootTile"; }

    if (tree === 1)
    {
      if (flipped){ return "horizontalTile"; }
      return "horizontalTileFlip";
    }
    if (tree === 2){
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
      if (flipped){ return "tree5Tile"; }
      else { return "tree5TileFlip"; }
    }
    if (tree === 6)
    {
      if (flipped){ return "maxWidthHeightTile"; }
      else { return "maxWidthHeightTileFlip"; }
    }
    if (tree === 7)
    {
      if (flipped){ return "tree5TileFlip"; }
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

  function isRightTree(tree: number): boolean
  {
    return (tree === 0 || tree === 1 || tree === 6 || tree === 7 || tree === 8);
  }

  /*If tile exists, return the real tile. Otherwise, return blank tile.
  * Also take into consideration that the lower number of the tile is always on the left of the name.
  */
  function constructImageUrl(tile: ITile) : string
  {
    if (tile === undefined || tile === null)
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

  export function getPlayerIconSource(player: number): string
  {
    var imageNumber = player % 2; //2 is chosen because there are only two images.
    return "imgs/player/image" + player + ".svg";
  }

  function handleDragEvent(type: string, clientX: number, clientY: number) {
    var el = angular.element(document.elementFromPoint(clientX, clientY));
        if( !dragEl && el.hasClass('checker') ) {
            childEl = el;
            row = +el.attr('data-row');
            col = +el.attr('data-col');
            pos = childEl[0].getBoundingClientRect();
        }
        else if( el.hasClass('checkerCell') ) {
            childEl = el.children();
            row = +el.attr('data-row');
            col = +el.attr('data-col');
            pos = childEl[0].getBoundingClientRect();
        }
  }

}




angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
  .run(function () {
  $rootScope['game'] = game;
  translate.setLanguage('en',  {
    RULES_OF_TICTACTOE: "Rules of Dominoes",
    RULES_SLIDE1: "This game is played according to the draw rules. The first player to join the game who has a double places the first domino. If you don't have a double tile, click on pass",
    RULES_SLIDE2: "Each player adds a domino to an open end of the layout, if he/she can. The layout flows left/right as necessary.",
    RULES_SLIDE3: "If a player is unable to make a move, he/she must draw dominoes from the boneyard until he can make a move. If there are no dominoes left, then the player must pass.",
    RULES_SLIDE4: "A game ends either when a player plays all his/her tiles, or when a game is blocked. A game is blocked when no player is able to add another tile to the layout.",
    RULES_SLIDE5: "When a hand ends, the player with the lightest hand (i.e. the fewest number of dots on their dominoes) wins the number of sum total of points in all of his opponents hands (minus the points in his own hand, if any)",
    PASS: "PASS",
    CLOSE: "Close"
  });
  game.init();
});
