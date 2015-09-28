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
  root: Tile;
  leftMost: Tile;
  rightMost: Tile;

  setRoot(tile: Tile)
  {
    this.root = tile;
    this.leftMost = tile;
    this.rightMost = tile;
  }
}

enum Play
{
  LEFT, RIGHT, CENTER, BUY, WIN, STAND_OFF
}

class BoardDelta {
  tile: Tile;
  play: Play;
}

class Player
{
  id: number;
  hand: Tile[];

  constructor(playerId: number)
  {
    this.id = playerId;
  }

  addTileToHand(tile: Tile)
  {
    this.hand[this.hand.length] = tile;
  }

  removeTileFromHand(tile: Tile)
  {
    var index = this.hand.indexOf(tile, 0);
    if (index != undefined) {
      this.hand.splice(index, 1);
    }
    else
    {
      throw new Error("Player " + this.id + " does not have tile " + tile.leftNumber + "|" + tile.rightNumber);
    }
  }

  getNumberOfRemainingTiles()
  {
    return this.hand.length;
  }

  hasTileWithNumbers(firstNumber: number, secondNumber: number)
  {
    for(var i = 0; i < this.hand.length; i++)
    {
      if(this.hand[i].validForTiles[firstNumber] || this.hand[i].validForTiles[secondNumber])
      {
        return true;
      }
    }

    return false;
  }

}

interface IState {
  board?: Board;
  delta?: BoardDelta;
  players?: Player[];
  house?: Player;
}

module gameLogic {

  export function getTile(tileIndex: number) : Tile
  {
    var i: number, j: number, k: number;
    k = 0;
    for(i = 0; i < 7; i++)
    {
      for(j = 0; j <= i; j++)
      {
        if (k == tileIndex)
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

  export function getInitialMove() {
      var operations = [],
      player0: Player = new Player(0),
      player1: Player = new Player(1),
      setTiles = [],
      setVisibilities = [],
      shuffleKeys = [],
      i: number, j: number, k: number;
      k = 0;

      for(i = 0; i < 7; i++)
      {
        for(j = 0; j <= i; j++)
        {
          var currentTile: Tile = new Tile(j, i);
          setTiles[k] = {set: {key: 'tile' + currentTile.leftNumber + currentTile.rightNumber, value: currentTile }}

          if(k < 7)
          {
            player0.hand[k] = currentTile;
            setVisibilities[k] = {setVisibility: {key: 'tile' +  currentTile.leftNumber + currentTile.rightNumber, visibleToPlayerIndexes: [0]}};
          }
          else if (k < 14)
          {
            player1.hand[k-7] = currentTile;
            setVisibilities[k] = {setVisibility: {key: 'tile' +  currentTile.leftNumber + currentTile.rightNumber, visibleToPlayerIndexes: [1]}};
          }
          else
          {
            setVisibilities[k] = {setVisibility: {key: 'tile' +  currentTile.leftNumber + currentTile.rightNumber, visibleToPlayerIndexes: []}};
          }
          shuffleKeys[k] = 'tile' +  currentTile.leftNumber + currentTile.rightNumber;
          k++;
        }
      }

      operations.selfConcat([{setTurn: {turnIndex: 0}}]);
      operations.selfConcat([{set: {key: 'player0', value: player0}}]);
      operations.selfConcat([{set: {key: 'player1', value: player1}}]);
      operations.selfConcat([{set: {key: 'board', value: getInitialBoard()}}]);
      operations.selfConcat([{set: {key: 'house', value: new Player(-1)}}]);
      operations.selfConcat(setTiles);
      operations.selfConcat([{shuffle: {keys: shuffleKeys}}]);
      operations.selfConcat(setVisibilities);

      return operations;
  }

  function getWinner(tile: Tile, currentPlayer: Player): number
  {
    currentPlayer.removeTileFromHand(tile);
    if (currentPlayer.getNumberOfRemainingTiles() === 0)
    {
      return currentPlayer.id;
    }
    return undefined;
  }

  function isTie(board: Board, players: Player[], house: Player): boolean{
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
  }

  /**
  * Returns the move that should be performed when player
  * with index turnIndexBeforeMove makes adds a domino to the board.
  */
  export function createMove(
    board: Board, playedTile: Tile, play: Play, turnIndexBeforeMove: number, players: Player[], house: Player): IMove {
    var operations = [],
    setVisibilities = [],
    boardAfterMove: Board,
    playerAfterMove: Player,
    houseAfterMove: Player;

    boardAfterMove = angular.copy(board);
    playerAfterMove = angular.copy(players[turnIndexBeforeMove]);
    houseAfterMove = angular.copy(house);
    if (play == Play.CENTER)
    {
      if (board.root)
      {
        throw new Error("One cannot make a non center play in a board that already has the first tile!");
      }
      boardAfterMove.setRoot(playedTile);
      playerAfterMove.removeTileFromHand(playedTile);

      setVisibilities.selfConcat([{setVisibility: {key: 'tile' + playedTile.leftNumber + playedTile.rightNumber, visibleToPlayerIndexes: []}}]);

      operations.selfConcat([{setTurn: {turnIndex: 1 - turnIndexBeforeMove}}]);
      operations.selfConcat([{set: {key: 'player' + turnIndexBeforeMove, value: playerAfterMove}}]);
      operations.selfConcat([{set: {key: 'board', value: boardAfterMove}}]);
      operations.selfConcat(setVisibilities)
      return operations;

    }
    else
    {
      if(!board.leftMost || !board.rightMost)
      {
        throw new Error("One cannot make a move in a board with no pieces on the left or right sides!");
      }

      if (Play.LEFT === play)
      {
        boardAfterMove.leftMost.leftChild = playedTile;
        boardAfterMove.leftMost = playedTile;
        playerAfterMove.removeTileFromHand(playedTile);

        setVisibilities.selfConcat([{setVisibility: {key: 'tile' + playedTile.leftNumber + playedTile.rightNumber, visibleToPlayerIndexes: []}}]);

        operations.selfConcat([{setTurn: {turnIndex: 1 - turnIndexBeforeMove}}]);
        operations.selfConcat([{set: {key: 'player' + turnIndexBeforeMove, value: playerAfterMove}}]);
        operations.selfConcat([{set: {key: 'board', value: boardAfterMove}}]);
        operations.selfConcat(setVisibilities)
        return operations;
      }
      else if (Play.RIGHT === play)
      {
        boardAfterMove.rightMost.rightChild = playedTile;
        boardAfterMove.rightMost = playedTile;
        playerAfterMove.removeTileFromHand(playedTile);

        setVisibilities.selfConcat([{setVisibility: {key: 'tile' + playedTile.leftNumber + playedTile.rightNumber, visibleToPlayerIndexes: []}}]);

        operations.selfConcat([{setTurn: {turnIndex: 1 - turnIndexBeforeMove}}]);
        operations.selfConcat([{set: {key: 'player' + turnIndexBeforeMove, value: playerAfterMove}}]);
        operations.selfConcat([{set: {key: 'board', value: boardAfterMove}}]);
        operations.selfConcat(setVisibilities)
        return operations;

      }
      else if (Play.BUY === play)
      {
        if (house.getNumberOfRemainingTiles() === 0)
        {
          throw new Error("One cannot buy from the house when it has no tiles");
        }

        houseAfterMove.removeTileFromHand(playedTile);
        playerAfterMove.addTileToHand(playedTile);

        setVisibilities.selfConcat([{setVisibility: {key: 'tile' + playedTile.leftNumber + playedTile.rightNumber, visibleToPlayerIndexes: [turnIndexBeforeMove]}}]);

        operations.selfConcat([{setTurn: {turnIndex: turnIndexBeforeMove}}]);
        operations.selfConcat([{set: {key: 'player' + turnIndexBeforeMove, value: players[turnIndexBeforeMove]}}]);
        operations.selfConcat([{set: {key: 'house', value: house}}]);
        operations.selfConcat(setVisibilities)
        return operations;
      }
      else if (Play.WIN === play)
      {
        var winner = getWinner(playedTile, players[turnIndexBeforeMove]);

        if (winner === 0) {
          operations.selfConcat([{endMatch: {endMatchScores: [1, 0]}}]);
        } else if (winner === 1) {
          operations.selfConcat([{endMatch: {endMatchScores: [0, 1]}}]);
        }

        return operations;
      }
      else if (Play.STAND_OFF === play)
      {
        if(isTie(board, players, house))
        {
          operations.selfConcat([{endMatch: {endMatchScores: [0, 0]}}]);
          return operations;
        }
        else
        {
          throw new Error("There are still plays left. Cannot be a stand off");
        }
      }
      else
      {
        throw new Error("Unknown play");
      }
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
        var playedTile: Tile = deltaValue.tile;
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
