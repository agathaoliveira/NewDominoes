interface ITile {
  leftNumber: number;
  rightNumber: number;
}

/*The domino board is stored as a binary tree. Children are added either to the
*left most position or the right most, since on the game rules, the dominos are
*only played to the left or the right. An array is used to store the tree nodes.
*The numbers on the array are the indexes of the tile keys stored on the all
*tiles arrray. */
interface IBoard
{
  tiles?: number[];
  leftMost?: number; //the index of the left most child
  rightMost?: number; //the index of the right most child
  allTiles?: ISet[]; //all the tiles in order
}

enum Play
{
  LEFT, RIGHT, BUY
}

interface BoardDelta {
  tileId: number;
  play: Play;
}

interface IPlayer
{
  id: number;
  hand: number[];

}

interface IState {
  board?: IBoard;
  delta?: BoardDelta;
  players?: IPlayer[];
  house?: IPlayer;
}

module gameLogic {

  function setBoardRoot(board: IBoard, tileId: number)
  {
    board.tiles = [];
    board.tiles[0] = tileId;
    //Initialize right and left ot hte root
    board.rightMost = 0;
    board.leftMost = 0;
  }

  function flipNumbers(tile: ITile)
  {
    var temp:number = tile.leftNumber;
    tile.leftNumber = tile.rightNumber;
    tile.rightNumber = temp;
  }

  function addTileToTheRight(board: IBoard, tileId: number)
  {
    var rightNumber: number = board.allTiles[board.tiles[board.rightMost]].value.rightNumber;
    var playedTile: ITile = board.allTiles[tileId].value;

    if (playedTile.leftNumber !== rightNumber)
    {
      if (playedTile.rightNumber !== rightNumber)
      {
        throw new Error("Cannot play tile " + JSON.stringify(playedTile) + " on the right when right tile is " + JSON.stringify(board.allTiles[board.tiles[board.rightMost]].value));
      }
      else
      {
        flipNumbers(playedTile);
      }
    }

    board.tiles[2*board.rightMost + 2] = tileId; //the right child of the current right title is at index 2 * i + 2. Initialize it to title with index playedTileId
    board.rightMost = 2 * board.rightMost + 2;

  }

  function addTileToTheLeft(board: IBoard, tileId: number)
  {
    var leftNumber: number = board.allTiles[board.tiles[board.leftMost]].value.leftNumber;
    var playedTile: ITile = board.allTiles[tileId].value;
    if (playedTile.rightNumber !== leftNumber)
    {
      if (playedTile.leftNumber !== leftNumber)
      {
        throw new Error("Cannot play tile " + JSON.stringify(playedTile) + " on the right when left tile is " + board.allTiles[board.tiles[board.leftMost]].value.leftNumber);
      }
      else
      {
        flipNumbers(playedTile);
      }
    }
    board.tiles[2*board.leftMost + 1] = tileId; //the left child of the current left title is at index 2 * i + 1. Initialize it to title with index playedTileId
    board.leftMost = 2 * board.leftMost + 1;
  }

  function addTileToHand(player: IPlayer, tile: number)
  {
    player.hand.push(tile);
  }

  function removeTileFromHand(player: IPlayer, tile: number)
  {
    var index = player.hand.indexOf(tile, 0);
    if (index !== undefined && index !== -1) {
      player.hand.splice(index, 1);
    }
    else
    {
      throw new Error("Unknown array element " + tile);
    }
  }

  function getNumberOfRemainingTiles(player: IPlayer):number
  {
    return player.hand.length;
  }

  export function getInitialBoard(): IBoard {
    return {};
  }

  export function getInitialMove(numOfPlayers: number): IMove {
      var operations: IMove = [],
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
      for(i = 0; i < 7; i++)
      {
        for(j = 0; j <= i; j++)
        {
          var currentTile: ITile = {leftNumber: j, rightNumber: i};

          if (currentPlayerId < numOfPlayers)
          {

            if (!players[currentPlayerId])
            {
              players[currentPlayerId] = <IPlayer>{ id: currentPlayerId, hand: [] };
            }

            players[currentPlayerId].hand.push(k);
            assignedTiles++;
            setTiles[k] = {key: 'tile' + k, value: currentTile, visibleToPlayerIndexes: [currentPlayerId] };

            if (assignedTiles === tilesToAssign)
            {
              currentPlayerId++;
              assignedTiles = 0;
            }
          }
          else
          {
            house.hand.push(k);
            setTiles[k] = {key: 'tile' + k, value: currentTile, visibleToPlayerIndexes: [] };
          }

          operations.push({set: setTiles[k]});
          shuffleKeys.keys.push('tile' +  k);
          k++;
        }
      }

      var board:IBoard = getInitialBoard();
      board.allTiles = setTiles;

      operations.push({setTurn: {turnIndex: 0}});

      for (var i = 0; i < players.length; i++)
      {
        operations.push({set: {key: 'player' + i, value: players[i]}});
      }

      operations.push({set: {key: 'house', value: house}});
      operations.push({set: {key: 'board', value: board}});
      operations.push({set: {key: 'allTiles', value: setTiles}});
      operations.push({shuffle: shuffleKeys});


      return operations;
  }

  function getWinner(currentPlayer: IPlayer): number
  {
    if (getNumberOfRemainingTiles(currentPlayer) === 0)
    {
      return currentPlayer.id;
    }

    return undefined;
  }

  function hasTileWithNumbers(player: IPlayer, allTiles: ISet[], firstNumber: number, secondNumber: number): boolean
  {
    for (var i = 0; i < player.hand.length; i++)
    {
      var tile: ITile = allTiles[player.hand[i]].value;
      if (tile.leftNumber === firstNumber || tile.rightNumber === firstNumber || tile.leftNumber === secondNumber || tile.rightNumber === secondNumber)
      {
        return true;
      }
    }
    return false;
  }

  function isTie(board: IBoard, players: IPlayer[], house: IPlayer): boolean{

    if (!board.tiles)
    {
      return false;
    }

    var allTiles: ISet[] = board.allTiles,
    leftTile: ITile = allTiles[board.tiles[board.leftMost]].value,
    rightTile: ITile = allTiles[board.tiles[board.rightMost]].value;


    if (hasTileWithNumbers(house, allTiles, leftTile.leftNumber, rightTile.rightNumber))
    {
      return false;
    }

    for(var i = 0; i < players.length; i++)
    {
      if (hasTileWithNumbers(players[i], allTiles, leftTile.leftNumber, rightTile.rightNumber))
      {
        return false;
      }
    }

    return true;
  }

  function getGenericMove(turn: number, boardAfterMove: IBoard, delta: BoardDelta, visibility: ISetVisibility,
  playerIndex: number, player: IPlayer): IMove
  {
    var operations: IMove = [];

    operations.push({setTurn: {turnIndex: turn}});
    operations.push({set: {key: 'board', value: boardAfterMove}});
    operations.push({set: {key: 'delta', value: delta}});
    operations.push({setVisibility: visibility})
    operations.push({set: {key: 'player' + playerIndex, value: player}});

    return operations;
  }

  function getMoveIfEndGame(player: IPlayer, boardAfterMove: IBoard, delta: BoardDelta, visibility: ISetVisibility): IMove
  {
    var operations: IMove = [];

    if (getWinner(player))
    {
      var endScores: number[] = [];
      endScores[player.id] = 1;

      operations.push({endMatch: {endMatchScores: endScores}});
      operations.push({set: {key: 'board', value: boardAfterMove}});
      operations.push({set: {key: 'delta', value: delta}});
      operations.push({setVisibility: visibility});

      return operations;
    }
    else
    {
      return undefined;
    }
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

  /**
  * Returns the move that should be performed when player
  * with index turnIndexBeforeMove makes adds a domino to the board.
  */
  export function createMove(
    board: IBoard, playedTileId: number, play: Play, turnIndexBeforeMove: number, players: IPlayer[], house: IPlayer): IMove {
    var operations: IMove,
    visibility: ISetVisibility,
    boardAfterMove: IBoard,
    playerAfterMove: IPlayer,
    houseAfterMove: IPlayer;

    //Check if someone has already won the game
    for (var i = 0; i < players.length; i++)
    {
      if (getWinner(players[i]) === players[i].id)
      {
        throw new Error("Can only make a move if the game is not over! Player " + i + " has already won.");
      }
    }

    if (isTie(board, players, house))
    {
      throw new Error("Can only make a move if the game is not over! The game is a tie");
    }

    boardAfterMove = angular.copy(board);
    playerAfterMove = angular.copy(players[turnIndexBeforeMove]);
    houseAfterMove = angular.copy(house);

    let delta: BoardDelta = {tileId: playedTileId, play: play};

    //If there was no tile on the board before, this is the first tile
    if (!board.tiles || board.tiles.length === 0)
    {
      setBoardRoot(board, playedTileId);
      removeTileFromHand(playerAfterMove, playedTileId);
      visibility = {key: 'tile' + playedTileId, visibleToPlayerIndexes: getVisibilityForAllPlayers(players.length)};

      var nextTurn = (turnIndexBeforeMove + 1) % players.length;
      return getGenericMove(nextTurn, boardAfterMove, delta, visibility, turnIndexBeforeMove, playerAfterMove);
    }
    else if (Play.LEFT === play)
    {

        addTileToTheLeft(boardAfterMove, playedTileId);
        removeTileFromHand(playerAfterMove, playedTileId);

        visibility =  {key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1]};

        var endMove:IMove = getMoveIfEndGame(playerAfterMove, boardAfterMove, delta, visibility);
        var nextTurn = (turnIndexBeforeMove + 1) % players.length;
        return endMove ? endMove : getGenericMove(nextTurn, boardAfterMove, delta, visibility, turnIndexBeforeMove, playerAfterMove);
    }
    else if (Play.RIGHT === play)
    {
        addTileToTheRight(boardAfterMove, playedTileId);
        removeTileFromHand(playerAfterMove, playedTileId);

        visibility =  {key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1]};
        var endMove:IMove = getMoveIfEndGame(playerAfterMove, boardAfterMove, delta, visibility);
        var nextTurn = (turnIndexBeforeMove + 1) % players.length;
        return endMove ? endMove : getGenericMove(nextTurn, boardAfterMove, delta, visibility, turnIndexBeforeMove, playerAfterMove);
    }
    /*In this case, the domino tile should be removed from the house and
    /*added to the plauers hand. It should only be visible to the player
    /*who bought from the house.*/
    else if (Play.BUY === play)
    {
      if (getNumberOfRemainingTiles(house) === 0)
      {
        throw new Error("One cannot buy from the house when it has no tiles");
      }

      removeTileFromHand(houseAfterMove, playedTileId);
      addTileToHand(playerAfterMove, playedTileId);

      visibility = {key: 'tile' + playedTileId, visibleToPlayerIndexes: [turnIndexBeforeMove]};

      operations = getGenericMove(turnIndexBeforeMove, boardAfterMove, delta, visibility, turnIndexBeforeMove, playerAfterMove);
      operations.concat([{set: {key: 'house', value: houseAfterMove}}]);

      return operations;
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
    var turnIndexBeforeMove = params.turnIndexBeforeMove;
    var stateBeforeMove: IState = params.stateBeforeMove;
    var numberOfPlayers: number = params.numberOfPlayers;

    /*********************************************************************
    * 1. If the stateBeforeMove is empty, then it should be the first
    *    move. Set the board of stateBeforeMove to be the initial board.
    *    If the stateBeforeMove is not empty, then the board should have
    *    one or more dominoes.
    ********************************************************************/

    try {

      if (numberOfPlayers > 4)
      {
        throw Error("A maximum of 4 players are allowed for this game");
      }
      
      var expectedMove: IMove;

      if (!params.stateBeforeMove)
      {
        expectedMove = getInitialMove(numberOfPlayers);
      }
      else
      {
        var deltaValue: BoardDelta = stateBeforeMove.delta;
        var playedTile: number = deltaValue.tileId;
        var play: Play = deltaValue.play;
        var players: IPlayer[] = stateBeforeMove.players;
        var house: IPlayer = stateBeforeMove.house;

        expectedMove = createMove(stateBeforeMove.board, playedTile, play, turnIndexBeforeMove, players, house);
      }

    /*  console.log(JSON.stringify(move));*/
      console.log("---------------------")
      console.log(JSON.stringify(expectedMove));

      if (!angular.equals(move, expectedMove)) {
      //  logDiffToConsole(move, expectedMove);
        return false;
      }
    } catch (e) {
      // if there are any exceptions then the move is illegal
      return false;
    }
    return true;
}

}
