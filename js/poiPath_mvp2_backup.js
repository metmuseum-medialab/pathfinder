var fs = require("fs");

var async = require("async");

function poiPath(){

  var poiPathObj = {

    graph_file : false,

    poiPathCalc : function (poi, callback) {

      var dijkstra = require("./dijkstra_mvp2.js").dijkstra();
      dijkstra.graph_file = "data/floor_1.json";

      var poiPerm = {};
      
      poi_set = JSON.parse(poi);

      console.log("poi_set: ");
      console.log(poi_set);

      // array to be used for index names

      //////////////////////////// PERMUTATIONS //////////////////////////////

      // Run dijkstra to calculate the shortest path between all sets of poi points
      // This must be done synchronously so dijkstra finishes running before
      // the final array of objects is returned

      // eachSeries poi_1 cycles through the poi_set to select the 1st node to compare
      // eachSeries poi_2 cycles through the same poi_set and calls dijkstra to calculate
      // a path between 1st node and any node that is not the same as the 1st node

      var poiCount1 = 0;
      var poiCount2 = 0;
      console.log("about to run eachSeries");

      async.eachSeries(poi_set, function(poi_1, callback_1){
        console.log("eachSeries 1 is running");
        async.eachSeries(poi_set, function(poi_2, callback_2){
          console.log("eachSeries 2 is running");
          /*
          if (poiCount2 > poiCount1) { // permutate without repetitions
            dijkstra.dijkstraCalc(poi_set[poi_1], poi_names[poi_2], function(result_nodes, result_edges){

              poiPerm[poi_names[poi_1] + ":" + poi_names[poi_2]] = {n1: poi_names[poi_1], n2: poi_names[poi_2], nodes: result_nodes, edges: result_edges};

              poiCount2++;
              console.log("poiCount2: " + poiCount2);
              callback_2();
             
            });
          } else {
            poiCount2++;
            console.log("poiCount2: " + poiCount2);
            callback_2();
          }*/
          callback_2();
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
         
          //////////////////////////// POI PATH ALGORITHM //////////////////////////////

          /*
          var startPoint = poi_set; // Set the start point
          var curNode = startPoint; // Set the current node
          
          // SETUP

          $.each(poiPerm, function(index, path) {
            
            // Turn each path into an edge
            var lengthSum = 0;
            $.each(path.edges, function(index, edge) {
              lengthSum += edge.length;
            });
            path.pathLength = lengthSum; // Turn each path into an edge

            // Assign outEdges to nodes in the poi_set array

            var startNode;
            var endNode;

            // define start and end nodes, to be used for setting up outEdges
            $.each(poi_set, function(index_node, node){
              $.each(node, function(index_poi, poi){
                if(index_poi == path.n1){
                  startNode = poi;
                }
                if(index_poi == path.n2){
                  endNode = poi;
                }
              });
            });

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
          });*/

          callback("callback works");
        }
      });
    }
  };
  return poiPathObj; 
}

module.exports.poiPath = poiPath;