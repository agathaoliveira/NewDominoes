module aiService {
  /**
   * Returns the move that the computer player should do for the given board.
   * alphaBetaLimits is an object that sets a limit on the alpha-beta search,
   * and it has either a millisecondsLimit or maxDepth field:
   * millisecondsLimit is a time limit, and maxDepth is a depth limit.
   */
  export function createComputerMove(
      playerIndex: number, stateBeforeMove: IState, leftNumber: number, rightNumber: number): IMove {

    // console.log("createComputerMove(): stateBefore " + JSON.stringify(stateBeforeMove));

    var board: IBoard = stateBeforeMove.board;
    var hand: string[] = stateBeforeMove.players[playerIndex].hand;
    var numberOfHouseTiles: number = !(stateBeforeMove.house) ? 0 : stateBeforeMove.house.hand.length;

    var key: string = undefined;
    var play: Play = undefined;
    for (var i = 0; i < hand.length; i++)
    {
      if (!board || !board.root)
      {
        if (stateBeforeMove[hand[i]].leftNumber === stateBeforeMove[hand[i]].rightNumber)
        {
          play = Play.RIGHT;
        }
      }
      else
      {
        play = getPlayBasedOnBoardTiles(stateBeforeMove[hand[i]], leftNumber, rightNumber);
      }

      if (play !== undefined)
      {
        key = hand[i];
        break;
      }
    }

    if (play === undefined)
    {
      if (!!board && !!board.root && numberOfHouseTiles != 0)
      {
        play = Play.BUY
        key = stateBeforeMove.house.hand[0];
      }
      else
      {
        play = Play.PASS;
      }
    }

    var delta: BoardDelta = play !== Play.PASS ? { tileKey: key, play: play } : { play: play };
    stateBeforeMove.delta = delta;
    var move: IMove = gameLogic.createMove(stateBeforeMove, playerIndex, delta, stateBeforeMove);

    return move;
  }

  function getPlayBasedOnBoardTiles(tile: ITile, leftNumber: number, rightNumber: number): Play
  {
    if (tile.leftNumber === leftNumber || tile.rightNumber === leftNumber)
    {
      return Play.LEFT;
    }
    else if (tile.leftNumber === rightNumber || tile.rightNumber ===  rightNumber)
    {
      return Play.RIGHT;
    }

    return undefined;
  }

}
