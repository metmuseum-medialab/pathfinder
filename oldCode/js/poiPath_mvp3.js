var fs = require("fs");

var async = require("async");

function poiPath(){
  
  console.log("poiPath started...");

  var poiPathObj = {

    graph_file : false,

    poiPathCalc : function (poi, prefs, callback) {

      var userPrefs = prefs;

      var dijkstra = require("./dijkstra_mvp3.js").dijkstra();
      dijkstra.graph_file = "data/floor_1.json";

      var poiPerm = {};

      poi_set = JSON.parse(poi);

      var startPoint;
      $.each(poi_set, function(index, poi){
        if(poi.type == "start"){
          startPoint = index;
        }
      });

      //console.log(poi_set);

      // array of poi names: because eachSeries doesn't give access to index name
      poi_names = [];
      $.each(poi_set, function(index, poi){
        poi_names.push(index);
      });

      // array of poi count: to set up the "permutate w/o repetitions" if statement
      poi_count = [];
      $.each(poi_names, function(index, name){
        poi_count.push(index);
      });
      
      // Run dijkstra to calculate the shortest path between all sets of poi points
      // This must be done synchronously so dijkstra finishes running before
      // the final array of objects is returned

      // eachSeries poi_1 cycles through the poi_set to select the 1st node to compare
      // eachSeries poi_2 cycles through the same poi_set and calls dijkstra to calculate
      // a path between 1st node and any node that is not the same as the 1st node

      //////////////////////////// PERMUTATIONS //////////////////////////////

      async.eachSeries(poi_count, function(poi_1, callback_1){
        async.eachSeries(poi_count, function(poi_2, callback_2){

          if (poi_2 > poi_1) { // permutate without repetitions
            dijkstra.dijkstraCalc(poi_names[poi_1], poi_names[poi_2], userPrefs, function(result_nodes, result_edges){
              
              poiPerm[poi_names[poi_1] + ":" + poi_names[poi_2]] = {nodes: result_nodes, edges: result_edges, n1: poi_names[poi_1], n2: poi_names[poi_2]};
              
              callback_2();
            });
          } else {
            callback_2();
          }
        }, function(err){
          // if any of the saves produced an error, err would equal that error
          if( err ) {
            // One of the iterations produced an error.
            // All processing will now stop.
          } else {
            callback_1();
          }
        });  
      }, function(err){
        // if any of the saves produced an error, err would equal that error
        if( err ) {
          // One of the iterations produced an error.
          // All processing will now stop.
        } else {

          //console.log(JSON.stringify(poiPerm, null, " "));
         
         //////////////////////////// POI PATH ALGORITHM //////////////////////////////

          // SETUP

          // Set the start point
          
          var curNode = startPoint; // Set the current node
          
          $.each(poiPerm, function(index, path) {
            
            // Turn each path into an edge
            var lengthSum = 0;
            $.each(path.edges, function(index, edge) {
              lengthSum += edge.length;
            });
            path.pathLength = lengthSum; // Turn each path into an edge

            // Assign outEdges to nodes in the poi_set array
            
            var startNode = poi_set[path.n1];
            var endNode = poi_set[path.n2];
        
            // START NODE -- EDGES
            if (!startNode.outEdges) {
                startNode.outEdges = {};
            }
            startNode.outEdges[index] = index;
            
            // END NODE -- EDGES
            if (!endNode.outEdges) {
                endNode.outEdges = {};
            }
            endNode.outEdges[index] = index;
          
          });

          // set the "visited" property of all nodes to false
          $.each(poi_set, function(index, poi){
            if (poi.type == "start") {
              poi.visited = true;
            } else {
              poi.visited = false;
            }
          });

          var poiPath_NN = [];

          NearestNeighbor();

          function NearestNeighbor(){

            var shortestEdge = Infinity;
            var shortestEdgeID;

            // cycle through outEdges
            $.each(poi_set[curNode].outEdges, function(index, edge){
              // look for an unvisited node on the other end of the edge
              if (poi_set[poiPerm[edge].n1].visited == false || poi_set[poiPerm[edge].n2].visited == false) {
                // determine if the current edge is the shortest
                if(poiPerm[edge].pathLength < shortestEdge){
                  shortestEdge = poiPerm[edge].pathLength;
                  shortestEdgeID = edge;
                }
              } else {
                // if there are no unvisited nodes, break and loop again
                true;
              }
            });

            // add the shortest edge to the poiPath_NN array
            $.each(poiPerm[shortestEdgeID].edges, function(index, edge){
              poiPath_NN.push(edge);
              //poiPath_NN[shortestEdgeID].index = edge;
            });
            
            
            // make the unvisited node on the shortest edge the current node
            if(poiPerm[shortestEdgeID].n1 != curNode){
              curNode = poiPerm[shortestEdgeID].n1;
            } else if(poiPerm[shortestEdgeID].n2 != curNode){
              curNode = poiPerm[shortestEdgeID].n2;
            }

            poi_set[curNode].visited = true;

            var endFunction = true;
            
            // check if all nodes have been visited
            $.each(poi_set, function(index, poi){
              if(poi.visited == false) {
                endFunction = false;
              } 
            });

            //console.log("endFunction: " + endFunction);

            if (endFunction == false){
              console.log("Starting Nearest Neighbor...");
              NearestNeighbor();
              console.log("Ending Nearest Neighbor...");
            }
          }

          //console.log("poiPath_NN");
          //console.log(poiPath_NN);

          callback(poiPath_NN);
        }
      });
    }
  };
  console.log("poiPath ended...");
  return poiPathObj; 
}

module.exports.poiPath = poiPath;