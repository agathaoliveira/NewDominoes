describe("aiService", function() {

  it("Player 1 finds an immediate left Move", function() {
    let move = aiService.createComputerMove(
        1, {"tile0":null,"tile1":null,"tile2":null,"tile3":null,"tile4":null,"tile5":null,"tile6":null,"tile7":{"leftNumber":1,"rightNumber":1},"tile8":{"leftNumber":2,"rightNumber":4},"tile9":{"leftNumber":3,"rightNumber":5},"tile10":{"leftNumber":0,"rightNumber":0},"tile11":{"leftNumber":5,"rightNumber":6},"tile12":{"leftNumber":2,"rightNumber":6},"tile13":{"leftNumber":3,"rightNumber":3},"tile14":null,"tile15":null,"tile16":null,"tile17":null,"tile18":null,"tile19":null,"tile20":null,"tile21":null,"tile22":null,"tile23":null,"tile24":null,"tile25":null,"tile26":null,"tile27":{"leftNumber":1,"rightNumber":5},"house":{"id":-1,"hand":["tile14","tile15","tile16","tile17","tile18","tile19","tile20","tile21","tile22","tile23","tile24","tile25","tile26"]},"board":{"currentLeft":5,"currentRight":1,"root":{"tileKey":"tile7","leftTile":{"tileKey":"tile27"}},"leftMost":"tile27","rightMost":"tile7"},"players":[{"id":0,"hand":["tile0","tile1","tile2","tile3","tile4","tile5","tile6"]},{"id":1,"hand":["tile8","tile9","tile10","tile11","tile12","tile13"]}],"delta":{"play":0,"tileKey":"tile27"}}, 5, 1);
    let expectedMove =
        [{"setTurn":{"turnIndex":0}},{"set":{"key":"board","value":{"currentLeft":5,"currentRight":1,"root":{"tileKey":"tile7","leftTile":{"tileKey":"tile27","leftTile":{"tileKey":"tile9"}}},"leftMost":"tile9","rightMost":"tile7"}}},{"set":{"key":"delta","value":{"tileKey":"tile9","play":0}}},{"setVisibility":{"key":"tile9","visibleToPlayerIndexes":[0,1]}},{"set":{"key":"players","value":[{"id":0,"hand":["tile0","tile1","tile2","tile3","tile4","tile5","tile6"]},{"id":1,"hand":["tile8","tile10","tile11","tile12","tile13"]}]}}];
  expect(angular.equals(move, expectedMove)).toBe(true);
});

  it("Player 1 finds an immediate right move", function() {
    let move = aiService.createComputerMove(
        1, {"tile0":{"leftNumber":3,"rightNumber":4},"tile1":{"leftNumber":2,"rightNumber":3},"tile2":{"leftNumber":3,"rightNumber":6},"tile3":null,"tile4":{"leftNumber":4,"rightNumber":5},"tile5":null,"tile6":null,"tile7":{"leftNumber":1,"rightNumber":1},"tile8":{"leftNumber":2,"rightNumber":4},"tile9":{"leftNumber":3,"rightNumber":5},"tile10":{"leftNumber":0,"rightNumber":0},"tile11":{"leftNumber":5,"rightNumber":6},"tile12":{"leftNumber":2,"rightNumber":6},"tile13":{"leftNumber":3,"rightNumber":3},"tile14":{"leftNumber":0,"rightNumber":1},"tile15":null,"tile16":null,"tile17":null,"tile18":null,"tile19":null,"tile20":null,"tile21":null,"tile22":null,"tile23":null,"tile24":null,"tile25":null,"tile26":null,"tile27":{"leftNumber":1,"rightNumber":5},"house":{"id":-1,"hand":["tile15","tile16","tile17","tile18","tile19","tile20","tile21","tile22","tile23","tile24","tile25","tile26"]},"board":{"currentLeft":4,"currentRight":1,"root":{"tileKey":"tile7","leftTile":{"tileKey":"tile27","leftTile":{"tileKey":"tile9","leftTile":{"tileKey":"tile0","leftTile":{"tileKey":"tile8","leftTile":{"tileKey":"tile1","leftTile":{"tileKey":"tile13","leftTile":{"tileKey":"tile2","leftTile":{"tileKey":"tile11","leftTile":{"tileKey":"tile4"}}}}}}}}}},"leftMost":"tile4","rightMost":"tile7"},"players":[{"id":0,"hand":["tile3","tile5","tile6"]},{"id":1,"hand":["tile10","tile12","tile14"]}],"delta":{"tileKey":"tile14","play":2}}, 4, 1);
    let expectedMove =
        [{"setTurn":{"turnIndex":0}},{"set":{"key":"board","value":{"currentLeft":4,"currentRight":1,"root":{"tileKey":"tile7","leftTile":{"tileKey":"tile27","leftTile":{"tileKey":"tile9","leftTile":{"tileKey":"tile0","leftTile":{"tileKey":"tile8","leftTile":{"tileKey":"tile1","leftTile":{"tileKey":"tile13","leftTile":{"tileKey":"tile2","leftTile":{"tileKey":"tile11","leftTile":{"tileKey":"tile4"}}}}}}}}},"rightTile":{"tileKey":"tile14"}},"leftMost":"tile4","rightMost":"tile14"}}},{"set":{"key":"delta","value":{"tileKey":"tile14","play":1}}},{"setVisibility":{"key":"tile14","visibleToPlayerIndexes":[0,1]}},{"set":{"key":"players","value":[{"id":0,"hand":["tile3","tile5","tile6"]},{"id":1,"hand":["tile10","tile12"]}]}}];
  expect(angular.equals(move, expectedMove)).toBe(true);
});

  it("Player 1 finds an immediate first move", function() {
    let move = aiService.createComputerMove(
        1, {"tile0":null,"tile1":null,"tile2":null,"tile3":null,"tile4":null,"tile5":null,"tile6":null,"tile7":{"leftNumber":1,"rightNumber":1},"tile8":{"leftNumber":2,"rightNumber":4},"tile9":{"leftNumber":3,"rightNumber":5},"tile10":{"leftNumber":0,"rightNumber":0},"tile11":{"leftNumber":5,"rightNumber":6},"tile12":{"leftNumber":2,"rightNumber":6},"tile13":{"leftNumber":3,"rightNumber":3},"tile14":null,"tile15":null,"tile16":null,"tile17":null,"tile18":null,"tile19":null,"tile20":null,"tile21":null,"tile22":null,"tile23":null,"tile24":null,"tile25":null,"tile26":null,"tile27":null,"house":{"id":-1,"hand":["tile14","tile15","tile16","tile17","tile18","tile19","tile20","tile21","tile22","tile23","tile24","tile25","tile26","tile27"]},"board":{},"players":[{"id":0,"hand":["tile0","tile1","tile2","tile3","tile4","tile5","tile6"]},{"id":1,"hand":["tile7","tile8","tile9","tile10","tile11","tile12","tile13"]}],"delta":{"play":3}}, undefined, undefined);
    let expectedMove =
        [{"setTurn":{"turnIndex":0}},{"set":{"key":"board","value":{"root":{"tileKey":"tile7"},"leftMost":"tile7","rightMost":"tile7"}}},{"set":{"key":"delta","value":{"tileKey":"tile7","play":1}}},{"setVisibility":{"key":"tile7","visibleToPlayerIndexes":[0,1]}},{"set":{"key":"players","value":[{"id":0,"hand":["tile0","tile1","tile2","tile3","tile4","tile5","tile6"]},{"id":1,"hand":["tile8","tile9","tile10","tile11","tile12","tile13"]}]}}]
  expect(angular.equals(move, expectedMove)).toBe(true);
});

  it("Player 0 finds an immediate winning move", function() {
    let move = aiService.createComputerMove(
        0, {"tile0":{"leftNumber":3,"rightNumber":4},"tile1":{"leftNumber":4,"rightNumber":5},"tile2":{"leftNumber":0,"rightNumber":2},"tile3":{"leftNumber":2,"rightNumber":2},"tile4":{"leftNumber":0,"rightNumber":4},"tile5":{"leftNumber":5,"rightNumber":5},"tile6":{"leftNumber":5,"rightNumber":6},"tile7":null,"tile8":{"leftNumber":1,"rightNumber":2},"tile9":null,"tile10":{"leftNumber":1,"rightNumber":6},"tile11":{"leftNumber":3,"rightNumber":5},"tile12":{"leftNumber":0,"rightNumber":1},"tile13":{"leftNumber":0,"rightNumber":3},"tile14":null,"tile15":null,"tile16":null,"tile17":null,"tile18":null,"tile19":null,"tile20":{"leftNumber":1,"rightNumber":3},"tile21":null,"tile22":null,"tile23":null,"tile24":null,"tile25":null,"tile26":{"leftNumber":0,"rightNumber":5},"tile27":null,"house":{"id":-1,"hand":[]},"board":{"currentLeft":0,"currentRight":3,"root":{"tileKey":"tile5","rightTile":{"tileKey":"tile11","rightTile":{"tileKey":"tile13","rightTile":{"tileKey":"tile4","rightTile":{"tileKey":"tile1","rightTile":{"tileKey":"tile26","rightTile":{"tileKey":"tile12","rightTile":{"tileKey":"tile20"}}}}}}},"leftTile":{"tileKey":"tile6","leftTile":{"tileKey":"tile10","leftTile":{"tileKey":"tile8","leftTile":{"tileKey":"tile3","leftTile":{"tileKey":"tile2"}}}}}},"leftMost":"tile2","rightMost":"tile20"},"players":[{"id":0,"hand":["tile0"]},{"id":1,"hand":["tile7","tile9","tile15","tile16","tile17","tile18","tile19","tile21","tile22","tile23","tile24","tile25","tile27","tile14"]}],"delta":{"play":1,"tileKey":"tile20"}}, 0, 3);
    let expectedMove = [{"setVisibility":{"key":"tile0","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile1","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile2","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile3","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile4","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile5","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile6","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile7","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile8","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile9","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile10","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile11","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile12","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile13","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile14","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile15","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile16","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile17","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile18","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile19","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile20","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile21","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile22","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile23","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile24","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile25","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile26","visibleToPlayerIndexes":[0,1]}},{"setVisibility":{"key":"tile27","visibleToPlayerIndexes":[0,1]}},{"setTurn":{"turnIndex":0}},{"set":{"key":"delta","value":{"play":4,"tileKey":"tile0"}}},{"set":{"key":"players","value":[{"id":0,"hand":[]},{"id":1,"hand":["tile7","tile9","tile15","tile16","tile17","tile18","tile19","tile21","tile22","tile23","tile24","tile25","tile27","tile14"]}]}}];
    expect(angular.equals(move, expectedMove)).toBe(true);
  });

  it("Player 1 finds a buy play", function() {
    let move = aiService.createComputerMove(
        1, {"tile0":{"leftNumber":5,"rightNumber":6},"tile1":{"leftNumber":2,"rightNumber":5},"tile2":{"leftNumber":3,"rightNumber":3},"tile3":{"leftNumber":2,"rightNumber":3},"tile4":{"leftNumber":2,"rightNumber":4},"tile5":null,"tile6":null,"tile7":{"leftNumber":5,"rightNumber":5},"tile8":{"leftNumber":4,"rightNumber":6},"tile9":{"leftNumber":4,"rightNumber":4},"tile10":{"leftNumber":3,"rightNumber":6},"tile11":{"leftNumber":1,"rightNumber":3},"tile12":{"leftNumber":1,"rightNumber":2},"tile13":{"leftNumber":0,"rightNumber":5},"tile14":null,"tile15":null,"tile16":null,"tile17":null,"tile18":null,"tile19":null,"tile20":null,"tile21":null,"tile22":null,"tile23":null,"tile24":null,"tile25":null,"tile26":{"leftNumber":1,"rightNumber":6},"tile27":null,"house":{"id":-1,"hand":["tile14","tile15","tile16","tile17","tile18","tile19","tile20","tile21","tile22","tile23","tile24","tile25"]},"board":{"currentLeft":3,"currentRight":1,"root":{"tileKey":"tile2","leftTile":{"tileKey":"tile10","leftTile":{"tileKey":"tile0","leftTile":{"tileKey":"tile7","leftTile":{"tileKey":"tile1","leftTile":{"tileKey":"tile3"}}}}},"rightTile":{"tileKey":"tile11","rightTile":{"tileKey":"tile12","rightTile":{"tileKey":"tile4","rightTile":{"tileKey":"tile8","rightTile":{"tileKey":"tile26"}}}}}},"leftMost":"tile3","rightMost":"tile26"},"players":[{"id":0,"hand":["tile5","tile6","tile27"]},{"id":1,"hand":["tile9","tile13"]}],"delta":{"play":1,"tileKey":"tile26"}}, 3, 1);
    let expectedMove = [{"setTurn":{"turnIndex":1}},{"set":{"key":"board","value":{"currentLeft":3,"currentRight":1,"root":{"tileKey":"tile2","leftTile":{"tileKey":"tile10","leftTile":{"tileKey":"tile0","leftTile":{"tileKey":"tile7","leftTile":{"tileKey":"tile1","leftTile":{"tileKey":"tile3"}}}}},"rightTile":{"tileKey":"tile11","rightTile":{"tileKey":"tile12","rightTile":{"tileKey":"tile4","rightTile":{"tileKey":"tile8","rightTile":{"tileKey":"tile26"}}}}}},"leftMost":"tile3","rightMost":"tile26"}}},{"set":{"key":"delta","value":{"tileKey":"tile14","play":2}}},{"setVisibility":{"key":"tile14","visibleToPlayerIndexes":[1]}},{"set":{"key":"players","value":[{"id":0,"hand":["tile5","tile6","tile27"]},{"id":1,"hand":["tile14","tile9","tile13"]}]}},{"set":{"key":"house","value":{"id":-1,"hand":["tile15","tile16","tile17","tile18","tile19","tile20","tile21","tile22","tile23","tile24","tile25"]}}}];
    expect(angular.equals(move, expectedMove)).toBe(true);
  });

  it("Player 1 finds a pass play", function() {
    let move = aiService.createComputerMove(
        1, {"tile0":null,"tile1":null,"tile2":null,"tile3":null,"tile4":null,"tile5":{"leftNumber":5,"rightNumber":5},"tile6":{"leftNumber":0,"rightNumber":0},"tile7":{"leftNumber":0,"rightNumber":5},"tile8":{"leftNumber":0,"rightNumber":6},"tile9":{"leftNumber":0,"rightNumber":4},"tile10":{"leftNumber":2,"rightNumber":4},"tile11":{"leftNumber":2,"rightNumber":3},"tile12":{"leftNumber":2,"rightNumber":2},"tile13":{"leftNumber":3,"rightNumber":4},"tile14":null,"tile15":null,"tile16":null,"tile17":null,"tile18":{"leftNumber":6,"rightNumber":6},"tile19":null,"tile20":null,"tile21":null,"tile22":null,"tile23":null,"tile24":null,"tile25":null,"tile26":null,"tile27":null,"house":{"id":-1,"hand":[]},"board":{"currentLeft":6,"currentRight":5,"root":{"tileKey":"tile5","leftTile":{"tileKey":"tile7","leftTile":{"tileKey":"tile6","leftTile":{"tileKey":"tile8","leftTile":{"tileKey":"tile18"}}}}},"leftMost":"tile18","rightMost":"tile5"},"players":[{"id":0,"hand":["tile0","tile1","tile2","tile3","tile4","tile15","tile16","tile17","tile19","tile20","tile21","tile22","tile23","tile24","tile25","tile26","tile27","tile14"]},{"id":1,"hand":["tile9","tile10","tile11","tile12","tile13"]}],"delta":{"play":0,"tileKey":"tile18"}}, 6, 5);
    let expectedMove = [{"setTurn":{"turnIndex":0}},{"set":{"key":"delta","value":{"play":3}}}];
    expect(angular.equals(move, expectedMove)).toBe(true);
  });

});
