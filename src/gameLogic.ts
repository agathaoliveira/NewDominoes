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
    board.tiles[0] = tileId;
    //Initialize right and left ot hte root
    board.rightMost = 0;
    board.leftMost = 0;
  }

  function addTileToTheRight(board: IBoard, tileId: number)
  {
    board.tiles[2*board.rightMost + 2] = tileId; //the right child of the current right title is at index 2 * i + 2. Initialize it to title with index playedTileId
    board.rightMost = 2 * board.rightMost + 2;
  }

  function addTileToTheLeft(board: IBoard, tileId: number)
  {
    board.tiles[2*board.leftMost + 1] = tileId; //the left child of the current left title is at index 2 * i + 1. Initialize it to title with index playedTileId
    board.leftMost = 2 * board.leftMost + 1;
  }

  function containsTile(board: IBoard, tileId: number):boolean
  {
    var index = board.tiles.indexOf(tileId);
    if (index)
    {
      return true;
    }
    return false;
  }

  function addTileToHand(player: IPlayer, tile: number)
  {
    this.hand.push(tile);
  }

  function removeTileFromHand(player: IPlayer, tile: number)
  {
    var index = player.hand.indexOf(tile, 0);
    if (index != undefined) {
      player.hand.splice(index, 1);
    }
    else
    {
      throw new Error("Unknown array element " + tile);
    }
  }

  function getNumberOfRemainingTiles(player: IPlayer)
  {
    return player.hand.length;
  }

  export function getInitialBoard(): IBoard {
    return {};
  }

  export function getInitialMove(): IMove {
      var operations: IMove = [],
      player0: IPlayer = {id: 0, hand: []},
      player1: IPlayer = {id: 1, hand: []},
      house: IPlayer = {id: -1, hand: []},
      setTiles: ISet[] = [],
      setVisibilities: ISetVisibility[] = [],
      shuffleKeys: IShuffle = {keys: []},
      i: number, j: number, k: number;

      k = 0;
      for(i = 0; i < 7; i++)
      {
        for(j = 0; j <= i; j++)
        {
          var currentTile: ITile = {leftNumber: j, rightNumber: i};
          if (k < 7)
          {
            player0.hand[k] = k;
            setTiles[k] = {key: 'tile' + k, value: currentTile, visibleToPlayerIndexes: [0] };
          }
          else if (k < 14)
          {
            player1.hand[k-7] = k;
            setTiles[k] = {key: 'tile' + k, value: currentTile, visibleToPlayerIndexes: [1] };
          }
          else
          {
            house.hand[k-14] = k;
            setTiles[k] = {key: 'tile' + k, value: currentTile, visibleToPlayerIndexes: [] };
          }

          shuffleKeys.keys.push('tile' +  k);
          k++;
        }
      }

      operations.concat([{setTurn: {turnIndex: 0}}]);
      operations.concat([{set: {key: 'player0', value: player0}}]);
      operations.concat([{set: {key: 'player1', value: player1}}]);
      operations.concat([{set: {key: 'house', value: house}}]);
      operations.concat([{set: {key: 'board', value: getInitialBoard()}}]);
      operations.concat([{set: {key: 'allTiles', value: setTiles}}]);
      operations.concat([{shuffle: {keys: shuffleKeys}}]);
      operations.concat(setVisibilities);

      return operations;
  }

  function getWinner(playedTileId: number, currentPlayer: IPlayer): number
  {
    removeTileFromHand(currentPlayer, playedTileId);
    if (getNumberOfRemainingTiles(currentPlayer) === 0)
    {
      return currentPlayer.id;
    }
    return undefined;
  }

  /*function isTie(board: Board, players: Player[], house: Player): boolean{
    var leftTile: Tile = board.leftMost;
    var rightTile: Tile = board.rightMost;

    if (house.hasTileWithNumbers(board.leftMost.leftNumber, board.rightMost.rightNumber))
    {
      return false;
    }

    for(var i = 0; i < players.length; i++)
    {
      if (players[i].hasTileWithNumbers(board.leftMost.leftNumber, board.rightMost.rightNumber))
      {
        return false;
      }
    }

    return true;
  }*/

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

    if(getWinner(playedTileId, players[0]) || getWinner(playedTileId, players[1])) //TODO: CHECK FOR TIE
    {
      throw new Error("Can only make a move if the game is not over!");
    }

    boardAfterMove = angular.copy(board);
    playerAfterMove = angular.copy(players[turnIndexBeforeMove]);
    houseAfterMove = angular.copy(house);

    //If there was no tile on the board before, this is the first tile
    //TODO: BEFORE RETURNING FROM EACH OPERATION, CHECK FOR WINNER OR TIE
    if (board.tiles.length === 0)
    {
      setBoardRoot(board, playedTileId);
      removeTileFromHand(playerAfterMove, playedTileId);

      visibility = {key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1]};

      operations.concat([{set: {key: 'player' + turnIndexBeforeMove, value: playerAfterMove}}]);
      operations.concat([{set: {key: 'board', value: boardAfterMove}}]);
      operations.concat([{setTurn: {turnIndex: 1 - turnIndexBeforeMove}}]);
      operations.concat([{setVisibility: visibility}])
      return operations;

    }
    else if (Play.LEFT === play)
    {
        addTileToTheLeft(boardAfterMove, playedTileId);
        removeTileFromHand(playerAfterMove, playedTileId);

        visibility =  {key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1]};

        operations.concat([{set: {key: 'player' + turnIndexBeforeMove, value: playerAfterMove}}]);
        operations.concat([{set: {key: 'board', value: boardAfterMove}}]);
        operations.concat([{setTurn: {turnIndex: 1 - turnIndexBeforeMove}}]);
        operations.concat([{setVisibility: visibility}]);
        return operations;
    }
    else if (Play.RIGHT === play)
    {
        addTileToTheRight(boardAfterMove, playedTileId);
        removeTileFromHand(playerAfterMove, playedTileId);

        visibility =  {key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1]};

        operations.concat([{set: {key: 'player' + turnIndexBeforeMove, value: playerAfterMove}}]);
        operations.concat([{set: {key: 'board', value: boardAfterMove}}]);
        operations.concat([{setTurn: {turnIndex: 1 - turnIndexBeforeMove}}]);
        operations.concat([{setVisibility: visibility}]);
        return operations;
    }
    else if (Play.BUY === play)
    {
      if (getNumberOfRemainingTiles(house) === 0)
      {
        throw new Error("One cannot buy from the house when it has no tiles");
      }

      removeTileFromHand(houseAfterMove, playedTileId);
      addTileToHand(playerAfterMove, playedTileId);

      visibility = {key: 'tile' + playedTileId, visibleToPlayerIndexes: [turnIndexBeforeMove]};

      operations.concat([{setTurn: {turnIndex: turnIndexBeforeMove}}]);
      operations.concat([{set: {key: 'player' + turnIndexBeforeMove, value: players[turnIndexBeforeMove]}}]);
      operations.concat([{set: {key: 'house', value: house}}]);
      operations.concat([{setVisibility: visibility}])
      return operations;
    }
    else
    {
      throw new Error("Unknown play");
    }
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
    var turnIndexBeforeMove = params.turnIndexBeforeMove;
    var stateBeforeMove: IState = params.stateBeforeMove;

    /*********************************************************************
    * 1. If the stateBeforeMove is empty, then it should be the first
    *    move. Set the board of stateBeforeMove to be the initial board.
    *    If the stateBeforeMove is not empty, then the board should have
    *    one or more dominoes.
    ********************************************************************/

    try {

      var expectedMove: IMove;

      if (!params.stateBeforeMove)
      {
        expectedMove = getInitialMove();
      }
      else
      {
        var deltaValue: BoardDelta = move[2].set.value;
        var playedTile: number = deltaValue.tileId;
        var play: Play = deltaValue.play;
        var players: IPlayer[] = stateBeforeMove.players;
        var house: IPlayer = stateBeforeMove.house;
        expectedMove = createMove(stateBeforeMove.board, playedTile, play, turnIndexBeforeMove, players, house);
    }
      if (!angular.equals(move, expectedMove)) {
        return false;
      }
    } catch (e) {
      // if there are any exceptions then the move is illegal
      return false;
    }
    return true;
}

}
