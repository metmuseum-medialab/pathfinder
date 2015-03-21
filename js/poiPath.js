var fs = require("fs");

var async = require("async");

function poiPath(){
  
  console.log("poiPath started...");

  var poiPathObj = {

    graph_file : false,

    poiPathCalc : function (poi, prefs, callback) {

      var userPrefs = prefs;

      var dijkstra = require("./dijkstra.js").dijkstra();
      dijkstra.graph_file = "data/all_floors.json";

      var poiPerm = {};

      poi_set = JSON.parse(poi);

      var startPoint = false;
      var edgepn2 = false;
      $.each(poi_set, function(index, poi){
        if(poi.type == "start"){
          console.log("start point is"+ index);
          startPoint = index;
          edgepn2 = index;
        }
      });

      if(!startPoint){
        console.log("no start point specified");
      }
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
            // a bug messing up the order?
//            dijkstra.dijkstraCalc(poi_names[poi_1], poi_names[poi_2], userPrefs, function(result_nodes, result_edges){
            dijkstra.dijkstraCalc(poi_names[poi_2], poi_names[poi_1], userPrefs, function(result_nodes, result_edges, result_edges_array){
              
            poiPerm[poi_names[poi_1] + ":" + poi_names[poi_2]] = {nodes: result_nodes, edges: result_edges, edges_array: result_edges_array, n1: poi_names[poi_1], n2: poi_names[poi_2]};
  //            poiPerm[poi_names[poi_2] + ":" + poi_names[poi_1]] = {nodes: result_nodes, edges: result_edges, n1: poi_names[poi_1], n2: poi_names[poi_2]};
              
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

          var prevn2 =false;


          function NearestNeighbor(startnode){

            var shortestEdge = Infinity;
            var shortestEdgeID;
//            var edgepn2 = startnode;


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
            // note: i think these are getting pushed in in an arbitrary order
            var wasReversed = false;
            if(prevn2 && poiPerm[shortestEdgeID].n1 != prevn2){
              wasReversed = true;
              console.log("line order reversed. prevn2 is " + prevn2 + " n1 is " + poiPerm[shortestEdgeID].n1 + ", n2 " +poiPerm[shortestEdgeID].n2);
              poiPerm[shortestEdgeID].edges_array.reverse();
//              var tempn = poiPerm[shortestEdgeID].n2;

            }
            $.each(poiPerm[shortestEdgeID].edges_array, function(index, edge){
              console.log("adding shortest" +  poiPerm[shortestEdgeID].n1 + " :  " + poiPerm[shortestEdgeID].n2);
              console.log("n1 " + edge.n1 + " : n2 : " + edge.n2);
              //poiPath_NN[shortestEdgeID].index = edge;
              // we want all edges to be pointing in the right direction. if the n1 of this edge isn't the n2 of the previous, flip all the values
              var edgeflip = false;
              if(!edgepn2){
                console.log("no pn2, startPoint is " + startPoint);
              }
              console.log("edgepn2 is " + edgepn2);
              if(edgepn2 && edge.n1 != edgepn2){
                edgeflip = true;
                var tempvar = edge.ey;
                edge.ey = edge.sy;
                edge.sy = tempvar;
                tempvar = edge.ex;
                edge.ex = edge.sx;
                edge.sx = tempvar;
                tempvar = edge.n1;
                edge.n1 = edge.n2;
                edge.n2 = tempvar;
              }
              edgepn2 = edge.n2;

              if(index == 0){
                edge.startsAtPoi = poi_set[edge.n1];
              }
              if(index == poiPerm[shortestEdgeID].edges_array.length - 1){
                edge.endsAtPoi = poi_set[edge.n2];
              }

              poiPath_NN.push(edge);


            });
            prevn2 = wasReversed ? poiPerm[shortestEdgeID].n2 : poiPerm[shortestEdgeID].n1;
            
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