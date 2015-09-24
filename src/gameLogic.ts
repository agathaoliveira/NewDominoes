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
  LEFT, RIGHT, CENTER, BUY
}

class BoardDelta {
  tile: Tile;
  play: Play;
}

class Player
{
  id: number;
  name: string;
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

  export function getInitialBoard(): Board {
      return new Board();
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
    board: Board, tile: Tile, play: Play, turnIndexBeforeMove: number, players: Player[], house: Player): IMove {
    if (!board) {
      // Initially (at the beginning of the match), the board in state is undefined.
      board = getInitialBoard();
    }

    var boardAfterMove = angular.copy(board);
    if (!board.root)
    {
      if (play !== Play.CENTER)
      {
        throw new Error("One cannot make a non center play in a board with no first tile!");
      }
      boardAfterMove.setRoot(tile);
      players[turnIndexBeforeMove].removeTileFromHand(tile);
    }
    else
    {
      if(!board.leftMost || !board.rightMost)
      {
        throw new Error("One cannot make a move in a board with no pieces on the left or right sides!");
      }

      if (Play.LEFT === play)
      {
        boardAfterMove.leftMost.leftChild = tile;
        boardAfterMove.leftMost = tile;
      }
      else if (Play.RIGHT === play)
      {
        boardAfterMove.rightMost.rightChild = tile;
        boardAfterMove.rightMost = tile;
      }
      else if (Play.BUY === play)
      {
        if (house.getNumberOfRemainingTiles() === 0)
        {
          throw new Error("One cannot buy from the house when it has no tiles");
        }

        var tile: Tile = house.hand[Math.floor(Math.random() * house.hand.length)];
        house.removeTileFromHand(tile);
        players[turnIndexBeforeMove].addTileToHand(tile);
      }
      else
      {
        throw new Error("One cannot make a center move on a board that already has a tile");
      }
    }

    var winner = getWinner(tile, players[turnIndexBeforeMove]);
    var firstOperation: IOperation;
    if (!winner || isTie(boardAfterMove, players, house)) {
    // Game over.
      firstOperation = {endMatch: {endMatchScores:
        winner ? [winner] : [-1]}};
    } else {
      // Game continues. Now it's the opponent's turn (the turn switches from 0 to 1 and 1 to 0).
      firstOperation = {setTurn: {turnIndex: 1 - turnIndexBeforeMove}};
    }
    var delta: BoardDelta = {tile: tile, play: play};
    return [firstOperation,
          {set: {key: 'board', value: boardAfterMove}},
          {set: {key: 'delta', value: delta}}];
}

  export function isMoveOk(params: IIsMoveOk): boolean {
    var move = params.move;
    var turnIndexBeforeMove = params.turnIndexBeforeMove;
    var stateBeforeMove: IState = params.stateBeforeMove;
    // The state and turn after move are not needed in dominoes
    //var turnIndexAfterMove = params.turnIndexAfterMove;
    //var stateAfterMove = params.stateAfterMove;

    // We can assume that turnIndexBeforeMove and stateBeforeMove are legal, and we need
    // to verify that move is legal.
    try {
      var deltaValue: BoardDelta = move[2].set.value;
      var tile: Tile = deltaValue.tile;
      var play: Play = deltaValue.play;
      var board = stateBeforeMove.board;
      var players: Player[] = stateBeforeMove.players;
      var house: Player = stateBeforeMove.house;
      var expectedMove = createMove(board, tile, play, turnIndexBeforeMove, players, house);
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
