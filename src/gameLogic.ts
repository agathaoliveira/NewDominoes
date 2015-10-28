interface ITile {
  leftNumber: number;
  rightNumber: number;
  leftTile?: ITile;
  rightTile?: ITile;
}

/*The domino board is stored as a binary tree. Children are added either to the
*left most position or the right most, since on the game rules, the dominos are
*only played to the left or the right. The tree is represented as a linked list.
*/
interface IBoard {
  root: ITile;
  leftMost?: ITile; //the index of the left most child
  rightMost?: ITile; //the index of the right most child
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
    board.leftMost = tile;
    board.rightMost = tile;
  }

  function flipNumbers(tile: ITile){
    var temp:number = tile.leftNumber;
    tile.leftNumber = tile.rightNumber;
    tile.rightNumber = temp;
  }

  function addTileToTheRight(board: IBoard, playedTile: ITile){
    var rightNumber: number = board.rightMost.rightNumber;

    if (playedTile.leftNumber !== rightNumber)
    {
      if (playedTile.rightNumber !== rightNumber)
      {
        throw new Error("Cannot play tile " + JSON.stringify(playedTile) + " on the right when right tile is " + JSON.stringify(board.rightMost));
      }
      else
      {
        flipNumbers(playedTile);
      }
    }

    var currentTile = board.root;
    while (currentTile.rightNumber != board.rightMost.rightNumber && currentTile.leftNumber != board.rightMost.leftNumber)
    {
      currentTile = currentTile.rightTile;
    }

    currentTile.rightTile = playedTile;
    board.rightMost = playedTile;
  }

  function addTileToTheLeft(board: IBoard, playedTile: ITile){

    var leftNumber: number = board.leftMost.leftNumber;

    if (playedTile.rightNumber !== leftNumber)
    {
      if (playedTile.leftNumber !== leftNumber)
      {
        throw new Error("Cannot play tile " + JSON.stringify(playedTile) + " on the left when left tile is " + JSON.stringify(board.leftMost));
      }
      else
      {
        flipNumbers(playedTile);
      }
    }

    var currentTile = board.root;
    while (currentTile.rightNumber != board.leftMost.rightNumber && currentTile.leftNumber != board.leftMost.leftNumber)
    {
      currentTile = currentTile.leftTile;
    }

    currentTile.leftTile = playedTile;
    board.leftMost = playedTile;
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

  export function createMoveEndGame(allPlayers: IPlayer[], state: IState): IMove
  {
    var operations: IMove = [],
    remainingPoints: number[] = [],
    numberOfPlayers: number = allPlayers.length,
    totalPoints: number = 0;

    for (var i = 0; i < numberOfPlayers; i++)
    {
      remainingPoints[i] = getRemainingPoints(allPlayers[i], state);
      totalPoints = totalPoints + remainingPoints[i];
    }

    var endScores: number[] = [];

    for (var i = 0; i < numberOfPlayers; i++)
    {
        endScores[i] = totalPoints - remainingPoints[i];
    }

    operations.push({endMatch: {endMatchScores: endScores}});
    return operations;
  }

  export function createMovePass(turnIndexBeforeMove: number, numberOfPlayers: number) : IMove
  {
    var operations: IMove = [];

    operations.push({setTurn: {turnIndex: (turnIndexBeforeMove + 1) % numberOfPlayers}});

    return operations;
  }

  export function createMoveReveal(numberOfPlayers: number, turnIndexBeforeMove: number):IMove
  {
    var operations: IMove = [],
    playerIndexes = getVisibilityForAllPlayers(numberOfPlayers);

    for (var i = 0; i < 28; i++)
    {
      operations.push({setVisibility: {key: 'tile' + i, visibleToPlayerIndexes: playerIndexes }});
    }

    operations.push({setTurn: {turnIndex: turnIndexBeforeMove}});
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
    operations.concat([{set: {key: 'house', value: house}}]);

    return operations;
  }

  export function createMovePlay(board: IBoard, delta: BoardDelta, playedTile: ITile, player: IPlayer,
    allPlayers: IPlayer[], playedTileKey: string, turnIndexBeforeMove: number, play: Play): IMove
  {
    var operations: IMove,
    visibility: ISetVisibility,
    numberOfPlayers = allPlayers.length;

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
      setBoardRoot(board, playedTile);
    }
    else if (play === Play.RIGHT)
    {
      addTileToTheRight(board, playedTile);
    }
    else //Play.LEFT
    {
      addTileToTheLeft(board, playedTile);
    }

    removeTileFromHand(player, playedTileKey);

    if (getNumberOfRemainingTiles(player) !== 0)
    {
      visibility =  {key: playedTileKey, visibleToPlayerIndexes: getVisibilityForAllPlayers(numberOfPlayers)};
      var nextTurn = (turnIndexBeforeMove + 1) % numberOfPlayers;
      allPlayers[turnIndexBeforeMove] = player;

      return getGenericMove(nextTurn, board, delta, visibility, allPlayers);
    }
    else
    {
      return createMoveReveal(numberOfPlayers, turnIndexBeforeMove);
    }
  }

  /**
  * Returns the move that should be performed when player with index turnIndexBeforeMove makes a move.
  */
  export function createMove(state: IState, turnIndexBeforeMove: number): IMove {
    var operations: IMove,
    visibility: ISetVisibility,
    boardAfterMove: IBoard,
    playersAfterMove: IPlayer[],
    playerAfterMove: IPlayer,
    houseAfterMove: IPlayer,
    playedTileKey: string = !(state.delta) ? undefined : state.delta.tileKey,
    play: Play = state.delta === undefined ? undefined : state.delta.play,
    players: IPlayer[] = state.players,
    house: IPlayer = state.house,
    board: IBoard = state.board;

    boardAfterMove = angular.copy(board);
    playersAfterMove = angular.copy(players);
    playerAfterMove = angular.copy(players[turnIndexBeforeMove]);
    houseAfterMove = angular.copy(house);

    let delta: BoardDelta = {tileKey: playedTileKey, play: play};

    //If there was no tile on the board before, this is the first tile
    if (Play.LEFT === play || Play.RIGHT === play)
    {
      return createMovePlay(board, delta, state[playedTileKey], playerAfterMove, playersAfterMove, playedTileKey, turnIndexBeforeMove, play);
    }
    else if (Play.BUY === play)
    {
      return createMoveBuy(houseAfterMove, playedTileKey, playerAfterMove, playersAfterMove, boardAfterMove, delta, turnIndexBeforeMove);
    }
    else if (Play.PASS == play)
    {
      return createMovePass(turnIndexBeforeMove, playersAfterMove.length);
    }
    else if (Play.REVEAL === play)
    {
      return createMoveReveal(playersAfterMove.length, turnIndexBeforeMove);
    }
    else if (Play.END === play)
    {
      return createMoveEndGame(playersAfterMove, state);
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

export function hasTileWithNumbers(state: IState, turnIndex: number, firstNumber: number, secondNumber: number): boolean
{
  var player: IPlayer = state.players[turnIndex];
  for (var i = 0; i < player.hand.length; i++)
  {
    var tile: ITile = state[player.hand[i]];
    if ((tile.leftNumber === firstNumber && tile.rightNumber === secondNumber) || (tile.rightNumber === firstNumber && tile.leftNumber === secondNumber))
    {
      return true;
    }
  }

  return false;
}

export function canStartGame(state: IState, turnIndex: number, value: number): boolean {
  return hasTileWithNumbers(state, turnIndex, value, value);
}


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

    console.error("isMoveOk(): Calling is move ok. State is " + JSON.stringify(stateBeforeMove));
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
        expectedMove = createMove(stateBeforeMove, turnIndexBeforeMove);
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
      console.log("EXCEPTION ON IS MOVE OK: " + e);
      return false;
    }
    return true;
  }

}
