window.astar = "";

/* Implementation of A* in Javascript. Takes in the grid of tiles, and gives us the next tile to move to */
(function() {
   var astarGrid = [];

   cellDistance = function(nearPos, farPos) {
      var diffX = Math.abs(nearPos.x - farPos.x);
      var diffY = Math.abs(nearPos.y - farPos.y);
      return diffX + diffY;
   };

   printArray = function(me, targ) {
      var result = "";
      for (var y = 0; y < astarGrid.length; y++) {
         for (var x = 0; x < astarGrid[0].length; x++) {
            if (me.x == x && me.y == y) {
               result += "!! ";
            }
            else if (targ && targ.x == x && targ.y == y) {
               result += "?? ";
            }
            else {
               result += ("00" + astarGrid[x][y].g).substr(-2,2);
               result += " ";
            }
         }
         result += "\n";
      }
      console.log(result)
   };

   printPath = function(node) {
      while(node.parent) {
         console.log("X: " + node.pos.x + " Y: " + node.pos.y);
         node = node.parent;
      }
   };

   /** Returns an array of the 4 cells around this cell. */
   getNeighborCells = function(cell) {
      var ret = [];
      var x = cell.pos.x;
      var y = cell.pos.y;

      // West
      if(astarGrid[x-1] && astarGrid[x-1][y]) {
         ret.push(astarGrid[x-1][y]);
      }

      // East
      if(astarGrid[x+1] && astarGrid[x+1][y]) {
         ret.push(astarGrid[x+1][y]);
      }

      // South
      if(astarGrid[x] && astarGrid[x][y-1]) {
         ret.push(astarGrid[x][y-1]);
      }

      // North
      if(astarGrid[x] && astarGrid[x][y+1]) {
         ret.push(astarGrid[x][y+1]);
      }

      return ret;
   };

   /* Return the cell that'll get us to our destination, A-star style. */
   window.astar = function(game, grid, currPosition, target) {
      var validCells =  new BinaryHeap(function(node) {
         return node.f;
      });

      /* Create astar data grid if necessary */
      var needNewGrid = astarGrid.length != grid.width || astarGrid[0].length != gridheight;
      if (needNewGrid) {
         astarGrid = [];
         for (var x = 0; x < grid.width; x++) {
            astarGrid.push(new Array(grid.height));
            // for (var y = 0; y < grid.length; y++) {
            //    astarGrid[x][y] = 0;
            // }
         }
      }

      for (var x = 0; x < grid.width; x++) {
         for (var y = 0; y < grid.height; y++) {
            astarGrid[x][y] = {
               f: 0,
               g: 0,
               h: 0,
               cost: 1,
               visited: false,
               parent: null,
               pos: { x: x, y: y },
               closed: false,
            };
         }
      }

      validCells.push(astarGrid[currPosition.x][currPosition.y]);

      while (validCells.content.length > 0) {
         // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
         var currentNode = validCells.pop();

         // End case -- result has been found, return the traced path.
         if(currentNode.pos.x == target.x && currentNode.pos.y == target.y) {
            var curr = currentNode;
            var prev = curr;
            while(curr.parent) {
               prev = curr;
               curr = curr.parent;
            }
            return prev;
         }

         // Normal case -- move currentNode from open to closed, process each of its neighbors.
         currentNode.closed = true;

         // Find all neighbors for the current node.
         var neighbors = getNeighborCells(currentNode);

         for(var i = 0; i < neighbors.length; i++) {
            var neighbor = neighbors[i];

            // HERE is where you would <continue> if the node was not able to be stepped on. Pwease no steppy!

            // The g score is the shortest distance from start to current node.
            // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
            var gScore = currentNode.g + neighbor.cost;
            var beenVisited = neighbor.visited;

            if(!beenVisited || gScore < neighbor.g) {
               // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
               neighbor.visited = true;
               neighbor.parent = currentNode;
               neighbor.h = cellDistance(neighbor.pos, target);
               neighbor.g = gScore;
               neighbor.f = neighbor.g + neighbor.h;

               if (!beenVisited) {
                  // Pushing to heap will put it in proper place based on the 'f' value.
                  validCells.push(neighbor);
               }
               else {
                  // Already seen the node, but since it has been rescored we need to reorder it in the heap
                  validCells.rescoreElement(neighbor);
               }
            }
         }
      }

      // STUCK! Give up.
      return null;
   };
})();

/*

Original License:

Copyright (c) Brian Grinstead, http://briangrinstead.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
