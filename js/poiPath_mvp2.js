var fs = require("fs");

var async = require("async");

function poiPath(){

  var poiPathObj = {

    graph_file : false,

    poiPathCalc : function (poi, callback) {

      var dijkstra = require("./dijkstra_mvp2.js").dijkstra();
      dijkstra.graph_file = "data/floor_1.json";

      var poiPath = {};

      poi_set = JSON.parse(poi);
 
      // Run dijkstra to calculate the shortest path between all sets of poi points
      // This must be done synchronously so dijkstra finishes running before
      // the final array of objects is returned

      // eachSeries poi_1 cycles through the poi_set to select the 1st node to compare
      // eachSeries poi_2 cycles through the same poi_set and calls dijkstra to calculate
      // a path between 1st node and any node that is not the same as the 1st node

      async.eachSeries(poi_set, function(poi_1, callback_1){
        async.eachSeries(poi_set, function(poi_2, callback_2){
          if (poi_1 != poi_2) {
            //console.log("about to run dijkstraCalc");
            dijkstra.dijkstraCalc(poi_1, poi_2, function(result_nodes, result_edges){

              poiPath[poi_1 + ":" + poi_2] = {nodes: result_nodes, edges: result_edges};
              //console.log("inner loop ran once...");
              callback_2();

            });
          } else {
            //console.log("inner loop ran once - same point");
            callback_2();
          }

        }, function(err){
          // if any of the saves produced an error, err would equal that error
          if( err ) {
            // One of the iterations produced an error.
            // All processing will now stop.
            //console.log('error callback_2');
          } else {
            //console.log('yey! callback_2');
            callback_1();
          }
        });  
      }, function(err){
        // if any of the saves produced an error, err would equal that error
        if( err ) {
          // One of the iterations produced an error.
          // All processing will now stop.
          //console.log('error callback_1');
        } else {
          //console.log('yey! callback_1');
          //console.log(JSON.stringify(poiPath, null, " "));
          //console.log("all loops ran...");
         
         //////////////////////////// POI ALGORITHM //////////////////////////////

         // NEAREST NEIGHBOR

          $.each(poiPath, function(index, path) {
            $.each(path.nodes, function(index, nodes) {
              console.log(index);
            });
          });
          callback("callback works");
        }
      });
    }
  };
  return poiPathObj; 
}

module.exports.poiPath = poiPath;