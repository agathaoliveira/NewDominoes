class Tile {
  leftNumber: number;
  rightNumber: number;
  isDouble: boolean;
  leftChild: Tile;
  rightChild: Tile;
  validForTiles: boolean[];

  constructor(left: number, right: number){
    this.leftNumber = left;
    this.rightNumber = right;
    this.isDouble = left === right;
    this.validForTiles = [false, false, false, false, false, false];
    this.validForTiles[left] = true;
    this.validForTiles[right] = true;
  }
}

class Board
{
  tiles: number[] = [];
  leftMost: number; //the index of the left most child
  rightMost: number; //the index of the right most child

  setRoot(tileId: number)
  {
    this.tiles[0] = tileId;
    //Initialize right and left ot hte root
    this.rightMost = 0;
    this.leftMost = 0;
  }

  addRightChild(tileId: number)
  {
    this.tiles[2*this.rightMost + 2] = tileId; //the right child of the current right title is at index 2 * i + 2. Initialize it to title with index playedTileId
    this.rightMost = 2 * this.rightMost + 2;
  }

  addLeftChild(tileId: number)
  {
    this.tiles[2*this.leftMost + 1] = tileId; //the left child of the current left title is at index 2 * i + 1. Initialize it to title with index playedTileId
    this.leftMost = 2 * this.leftMost + 1;
  }

  containsTile(tileId: number):boolean
  {
    var index = this.tiles.indexOf(tileId);
    if (index)
    {
      return true;
    }
    return false;
  }

}

enum Play
{
  LEFT, RIGHT, BUY
}

class BoardDelta {
  tileId: number;
  play: Play;
}

class Player
{
  id: number;
  hand: number[];

  constructor(playerId: number)
  {
    this.id = playerId;
  }

  addTileToHand(tile: number)
  {
    this.hand.push(tile);
  }

  removeTileFromHand(tile: number)
  {
    var index = this.hand.indexOf(tile, 0);
    if (index != undefined) {
      this.hand.splice(index, 1);
    }
    else
    {
      throw new Error("Unknown array element " + tile);
    }
  }

  getNumberOfRemainingTiles()
  {
    return this.hand.length;
  }

}

interface IState {
  board?: Board;
  delta?: BoardDelta;
  players?: Player[];
  house?: Player;
}

module gameLogic {

  export function getTile(tileId: number) : Tile
  {
    var i: number, j: number, k: number;
    k = 0;
    for(i = 0; i < 7; i++)
    {
      for(j = 0; j <= i; j++)
      {
        if (k == tileId)
        {
          return new Tile(j, i);
        }
        k++;
      }
    }
  }

  export function getInitialBoard(): Board {
    return new Board();
  }

  export function getInitialMove(): IMove {
      var operations: IMove = [],
      player0: Player = new Player(0),
      player1: Player = new Player(1),
      house: Player = new Player(-1),
      setTiles: ISet[] = [],
      setVisibilities: ISetVisibility[] = [],
      shuffleKeys: IShuffle = {keys: []},
      i: number, j: number, k: number;

      k = 0;
      for(i = 0; i < 7; i++)
      {
        for(j = 0; j <= i; j++)
        {
          var currentTile: Tile = new Tile(j, i);
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
      operations.concat(setTiles);
      operations.concat([{shuffle: {keys: shuffleKeys}}]);
      operations.concat(setVisibilities);

      return operations;
  }

  function getWinner(playedTileId: number, currentPlayer: Player): number
  {
    currentPlayer.removeTileFromHand(playedTileId);
    if (currentPlayer.getNumberOfRemainingTiles() === 0)
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
    board: Board, playedTileId: number, play: Play, turnIndexBeforeMove: number, players: Player[], house: Player): IMove {
    var operations: IMove,
    visibility: ISetVisibility,
    boardAfterMove: Board,
    playerAfterMove: Player,
    houseAfterMove: Player;

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
      boardAfterMove.setRoot(playedTileId);
      playerAfterMove.removeTileFromHand(playedTileId);

      visibility = {key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1]};

      operations.concat([{set: {key: 'player' + turnIndexBeforeMove, value: playerAfterMove}}]);
      operations.concat([{set: {key: 'board', value: boardAfterMove}}]);
      operations.concat([{setTurn: {turnIndex: 1 - turnIndexBeforeMove}}]);
      operations.concat([{setVisibility: visibility}])
      return operations;

    }
    else if (Play.LEFT === play)
    {
        boardAfterMove.addLeftChild(playedTileId);
        playerAfterMove.removeTileFromHand(playedTileId);

        visibility =  {key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1]};

        operations.concat([{set: {key: 'player' + turnIndexBeforeMove, value: playerAfterMove}}]);
        operations.concat([{set: {key: 'board', value: boardAfterMove}}]);
        operations.concat([{setTurn: {turnIndex: 1 - turnIndexBeforeMove}}]);
        operations.concat([{setVisibility: visibility}]);
        return operations;
    }
    else if (Play.RIGHT === play)
    {
        boardAfterMove.addRightChild(playedTileId);
        playerAfterMove.removeTileFromHand(playedTileId);

        visibility =  {key: 'tile' + playedTileId, visibleToPlayerIndexes: [0, 1]};

        operations.concat([{set: {key: 'player' + turnIndexBeforeMove, value: playerAfterMove}}]);
        operations.concat([{set: {key: 'board', value: boardAfterMove}}]);
        operations.concat([{setTurn: {turnIndex: 1 - turnIndexBeforeMove}}]);
        operations.concat([{setVisibility: visibility}]);
        return operations;
    }
    else if (Play.BUY === play)
    {
      if (house.getNumberOfRemainingTiles() === 0)
      {
        throw new Error("One cannot buy from the house when it has no tiles");
      }

      houseAfterMove.removeTileFromHand(playedTileId);
      playerAfterMove.addTileToHand(playedTileId);

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
        var players: Player[] = stateBeforeMove.players;
        var house: Player = stateBeforeMove.house;
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
