interface ITile {
  tileKey?: string;
  leftNumber?:number;
  rightNumber?:number;
  leftTile?: ITile;
  rightTile?: ITile;
}

/*The domino board is stored as a binary tree. Children are added either to the
*left most position or the right most, since on the game rules, the dominos are
*only played to the left or the right. The tree is represented as a linked list.
*/
interface IBoard {
  root: ITile;
  leftMost?: string; //the index of the left most child
  rightMost?: string; //the index of the right most child
  currentLeft: number;
  currentRight: number;
}

enum Play {
  LEFT, RIGHT, BUY, PASS, REVEAL, END
}

interface BoardDelta {
  tileKey?: string;
  play: Play;
}

interface IPlayer {
  id: number;
  hand: string[];
}

interface IState {
  board?: IBoard;
  delta?: BoardDelta;
  players?: IPlayer[];
  house?: IPlayer;
}

module gameLogic {

  function setBoardRoot(board: IBoard, tile: ITile){
    board.root = tile;
    board.leftMost = tile.tileKey;
    board.rightMost = tile.tileKey;
  }

  function addTileToTheRight(board: IBoard, playedTile: ITile){
    var rightTileKey: string = board.rightMost;

    var currentTile: ITile = board.root;
    while (currentTile.tileKey !== rightTileKey)
    {
      currentTile = currentTile.rightTile;
    }

    currentTile.rightTile = playedTile;
    board.rightMost = playedTile.tileKey;
  }

  function addTileToTheLeft(board: IBoard, playedTile: ITile){
    var leftTileKey: string = board.leftMost;

    var currentTile: ITile = board.root;
    while (currentTile.tileKey !== leftTileKey)
    {
      currentTile = currentTile.leftTile;
    }

    currentTile.leftTile = playedTile;
    board.leftMost = playedTile.tileKey;
  }

  function addTileToHand(player: IPlayer, tileKey: string){
    player.hand.push(tileKey);
  }

  function removeTileFromHand(player: IPlayer, tileKey: string)
  {
    var index = player.hand.indexOf(tileKey, 0);
    if (index !== undefined && index !== -1) {
      player.hand.splice(index, 1);
    }
    else
    {
      throw new Error("Unknown array element " + JSON.stringify(tileKey));
    }
  }

  function getNumberOfRemainingTiles(player: IPlayer):number
  {
    return player.hand.length;
  }

  export function getInitialBoard(): IBoard {
    return <IBoard>{};
  }

  export function getInitialMove(numOfPlayers: number): IMove {
      var operations: IMove = [],
      visibilityOperations: IMove = [],
      players: IPlayer[] = [],
      house: IPlayer = {id: -1, hand: []},
      setTiles: ISet[] = [],
      setVisibilities: ISetVisibility[] = [],
      shuffleKeys: IShuffle = {keys: []},
      i: number, j: number, k: number, assignedTiles: number, tilesToAssign: number;

      if (numOfPlayers === 2)
      {
        tilesToAssign = 7;
      }
      else
      {
        tilesToAssign = 5;
      }

      k = 0;
      assignedTiles = 0;
      var currentPlayerId: number = 0;
      for (i = 0; i < 7; i++)
      {
        for (j = 0; j <= i; j++)
        {
          var currentTile: ITile = {leftNumber: j, rightNumber: i};

          if (currentPlayerId < numOfPlayers)
          {

            if (!players[currentPlayerId])
            {
              players[currentPlayerId] = <IPlayer>{ id: currentPlayerId, hand: [] };
            }

            players[currentPlayerId].hand.push('tile' + k);
            setVisibilities[k] = {key: 'tile' + k, visibleToPlayerIndexes: [currentPlayerId] };

            assignedTiles++;
            setTiles[k] = {key: 'tile' + k, value: currentTile };

            if (assignedTiles === tilesToAssign)
            {
              currentPlayerId++;
              assignedTiles = 0;
            }
          }
          else
          {
            house.hand.push('tile' + k);
            setTiles[k] = {key: 'tile' + k, value: currentTile };
            setVisibilities[k] = {key: 'tile' + k, visibleToPlayerIndexes: [] };
          }

          operations.push({set: setTiles[k]});
          visibilityOperations.push({ setVisibility: setVisibilities[k] });
          shuffleKeys.keys.push('tile' +  k);
          k++;
        }
      }

      var board:IBoard = getInitialBoard();

      operations.push({setTurn: {turnIndex: 0}});
      operations.push({set: {key: 'house', value: house}});
      operations.push({set: {key: 'board', value: board}});
      operations.push({shuffle: shuffleKeys});
      operations.push({set: {key: 'players', value: players}});
      return operations.concat(visibilityOperations);;
  }

  function getWinner(currentPlayer: IPlayer): number
  {
    if (getNumberOfRemainingTiles(currentPlayer) === 0)
    {
      return currentPlayer.id;
    }

    return undefined;
  }

  function getVisibilityForAllPlayers(numOfPlayers: number): number[]
  {
    var visitibilities:number[] = [];

    for (var i = 0; i < numOfPlayers; i++)
    {
      visitibilities.push(i);
    }

    return visitibilities;
  }

  function getGenericMove(turn: number, boardAfterMove: IBoard, delta: BoardDelta, visibility: ISetVisibility,
  players: IPlayer[]): IMove
  {
    var operations: IMove = [];

    operations.push({setTurn: {turnIndex: turn}});
    operations.push({set: {key: 'board', value: boardAfterMove}});
    operations.push({set: {key: 'delta', value: delta}});
    operations.push({setVisibility: visibility});

    operations.push({set: {key: 'players', value: players}});

    return operations;
  }

  function getRemainingPoints(player: IPlayer, state: IState): number
  {
    var tile: ITile,
    points: number = 0;

    for (var i = 0; i < player.hand.length; i++)
    {
      tile = state[player.hand[i]];
      points = points + tile.leftNumber + tile.rightNumber;
    }

    return points;
  }

  function validateTiles(tile: ITile, currentNumber: number)
  {
    if (tile.rightNumber !== currentNumber &&
      tile.leftNumber !== currentNumber)
      {
          throw new Error("Cannot place tile at the board! Numbers are invalid.");
      }
  }

  export function createMoveEndGame(allPlayers: IPlayer[], state: IState, delta: BoardDelta): IMove
  {
    var operations: IMove = [],
    remainingPoints: number[] = [],
    numberOfPlayers: number = allPlayers.length,
    min: number = 336,
    minPlayer: number = -1,
    totalPoints: number = 0;

    for (var i = 0; i < numberOfPlayers; i++)
    {
      remainingPoints[i] = getRemainingPoints(allPlayers[i], state);
      totalPoints = totalPoints + remainingPoints[i];
      if (remainingPoints[i] < min)
      {
        min = remainingPoints[i];
        minPlayer = i;
      }
    }

    var endScores: number[] = [];
    for (var i = 0; i < numberOfPlayers; i++)
    {
        if (i === minPlayer)
        {
          endScores[i] = totalPoints - 2 * remainingPoints[i];
        }
        else
        {
          endScores[i] = 0;
        }
    }

    for (var i = 0; i < 28; i++)
    {
      operations.push({set: {key: 'tile' + i, value: state['tile' + i]}});
    }

    operations.push({endMatch: {endMatchScores: endScores}});
    operations.push({set: {key: 'delta', value: delta}});
    return operations;
  }

  export function createMovePass(turnIndexBeforeMove: number, numberOfPlayers: number, delta: BoardDelta) : IMove
  {
    var operations: IMove = [];

    operations.push({setTurn: {turnIndex: (turnIndexBeforeMove + 1) % numberOfPlayers}});
    operations.push({set: {key: 'delta', value: delta}});

    return operations;
  }

  export function createMoveReveal(numberOfPlayers: number, turnIndexBeforeMove: number, delta: BoardDelta, players: IPlayer[]):IMove
  {
    var operations: IMove = [],
    playerIndexes = getVisibilityForAllPlayers(numberOfPlayers);

    for (var i = 0; i < 28; i++)
    {
      operations.push({setVisibility: {key: 'tile' + i, visibleToPlayerIndexes: playerIndexes }});
    }

    operations.push({setTurn: {turnIndex: turnIndexBeforeMove}});
    operations.push({set: {key: 'delta', value: delta}});
    operations.push({set: {key: 'players', value: players}});
    return operations;
  }

  /* In this case, the domino tile should be removed from the house and added to the player's hand. It should only be visible to the player
  * who bought the tile from the house.
  */
  export function createMoveBuy(house: IPlayer, playedTileKey: string, player: IPlayer, allPlayers: IPlayer[], board: IBoard,
    delta:BoardDelta, turnIndexBeforeMove: number): IMove
  {
    var operations: IMove,
    visibility: ISetVisibility;

    if (getNumberOfRemainingTiles(house) === 0)
    {
      throw new Error("One cannot buy from the house when it has no tiles");
    }

    removeTileFromHand(house, playedTileKey);
    addTileToHand(player, playedTileKey);

    visibility = {key: playedTileKey, visibleToPlayerIndexes: [turnIndexBeforeMove]};

    allPlayers[turnIndexBeforeMove] = player;
    operations = getGenericMove(turnIndexBeforeMove, board, delta, visibility, allPlayers);
    operations = operations.concat([{set: {key: 'house', value: house}}]);

    return operations;
  }

  export function createMovePlay(board: IBoard, delta: BoardDelta, player: IPlayer,
    allPlayers: IPlayer[], playedTileKey: string, turnIndexBeforeMove: number, play: Play, stateAfterMove: IState): IMove
  {
    var operations: IMove,
    visibility: ISetVisibility,
    numberOfPlayers = allPlayers.length,
    playedTile: ITile = {tileKey: playedTileKey};

    //Check if someone has already won the game
    for (var i = 0; i < numberOfPlayers; i++)
    {
      if (getWinner(allPlayers[i]) === allPlayers[i].id)
      {
        throw new Error("Can only make a move if the game is not over! Player " + i + " has already won.");
      }
    }

    if (!board.root)
    {
      var tile: ITile = stateAfterMove[playedTileKey];
      if (tile.leftNumber != tile.rightNumber) { throw new Error("First tile must be a double"); }
      setBoardRoot(board, playedTile);
    }
    else if (play === Play.RIGHT)
    {
      var tile: ITile = stateAfterMove[playedTileKey];
      var rightTile: number = stateAfterMove.board.currentRight;

      validateTiles(tile, rightTile);
      board.currentRight = rightTile;

      addTileToTheRight(board, playedTile);
    }
    else //Play.LEFT
    {
      var tile: ITile = stateAfterMove[playedTileKey];
      var leftTile: number = stateAfterMove.board.currentLeft;

      validateTiles(tile, leftTile);
      board.currentLeft = leftTile;

      addTileToTheLeft(board, playedTile);
    }

    removeTileFromHand(player, playedTileKey);

    allPlayers[turnIndexBeforeMove] = player;

    if (getNumberOfRemainingTiles(player) !== 0)
    {
      visibility =  {key: playedTileKey, visibleToPlayerIndexes: getVisibilityForAllPlayers(numberOfPlayers)};
      var nextTurn = (turnIndexBeforeMove + 1) % numberOfPlayers;
      return getGenericMove(nextTurn, board, delta, visibility, allPlayers);
    }
    else
    {
      delta.play = Play.REVEAL;
      return createMoveReveal(numberOfPlayers, turnIndexBeforeMove, delta, allPlayers);
    }
  }

  /**
  * Returns the move that should be performed when player with index turnIndexBeforeMove makes a move.
  */
  export function createMove(state: IState, turnIndexBeforeMove: number, delta: BoardDelta, stateAfterMove: IState): IMove {
    var operations: IMove,
    visibility: ISetVisibility,
    boardAfterMove: IBoard,
    playersAfterMove: IPlayer[],
    playerAfterMove: IPlayer,
    houseAfterMove: IPlayer,
    playedTileKey: string = !(delta) ? undefined : delta.tileKey,
    play: Play = delta === undefined ? undefined : delta.play,
    players: IPlayer[] = state.players,
    house: IPlayer = state.house,
    board: IBoard = state.board;

    boardAfterMove = angular.copy(board);
    playersAfterMove = angular.copy(players);
    playerAfterMove = angular.copy(players[turnIndexBeforeMove]);
    houseAfterMove = angular.copy(house);

    //If there was no tile on the board before, this is the first tile
    if (Play.LEFT === play || Play.RIGHT === play)
    {
      return createMovePlay(boardAfterMove, delta, playerAfterMove, playersAfterMove, playedTileKey, turnIndexBeforeMove, play, stateAfterMove);
    }
    else if (Play.BUY === play)
    {
      return createMoveBuy(houseAfterMove, playedTileKey, playerAfterMove, playersAfterMove, boardAfterMove, delta, turnIndexBeforeMove);
    }
    else if (Play.PASS == play)
    {
      return createMovePass(turnIndexBeforeMove, playersAfterMove.length, delta);
    }
    else if (Play.REVEAL === play)
    {
      return createMoveReveal(playersAfterMove.length, turnIndexBeforeMove, delta, stateAfterMove.players);
    }
    else if (Play.END === play)
    {
      return createMoveEndGame(playersAfterMove, stateAfterMove, delta);
    }
    else
    {
      throw new Error("Unknown play");
    }
}

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
  export function isMoveOk(params: IIsMoveOk): boolean {
    var move = params.move;
    var turnIndexBeforeMove: number = params.turnIndexBeforeMove;
    var stateBeforeMove: IState = params.stateBeforeMove;
    var numberOfPlayers: number = params.numberOfPlayers;

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
      if (numberOfPlayers > 4)
      {
        throw Error("A maximum of 4 players are allowed for this game");
      }

      var expectedMove: IMove;

      if (!params.stateBeforeMove || !params.stateBeforeMove.board)
      {
        expectedMove = getInitialMove(numberOfPlayers);
      }
      else
      {
        expectedMove = createMove(stateBeforeMove, turnIndexBeforeMove, params.stateAfterMove.delta, params.stateAfterMove);
      }

      //  console.log("ACTUAL: " + JSON.stringify(move));
      //  console.log("---------------------")
        //  console.log("EXPECTED: " + JSON.stringify(expectedMove));

      if (!angular.equals(move, expectedMove)) {
      //  logDiffToConsole(move, expectedMove);
        return false;
      }
    } catch (e) {
      // if there are any exceptions then the move is illegal
      // console.log("EXCEPTION ON IS MOVE OK: " + e);
      return false;
    }
    return true;
  }

}
