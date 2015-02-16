var fs = require("fs");

function dijkstra(){

  var dijkstraObj = {
    graph_file : false,

    // define start and end point — will be user defined
    dijkstraCalc : function (c1, c2 , callback) {
      
      //floor_1
      var startPoint = c1;
      var endPoint = c2;

      var startNode, endNode;

      var curNode = false;

     // console.log("c1", c1);
     // console.log("c2", c2);

      var findEdgeLength = function(x0, y0, x1, y1){
                  return Math.sqrt((x0 -= x1) * x0 + (y0 -= y1) * y0);
              };

      //var stats = fs.statSync('')

      // read the data file (defined in the graph_file var in server.node.js)
      fs.readFile(this.graph_file,  function(err, data) {

        if(err){
          //console.log(err);
        }
        //console.log(data);

        var graph = JSON.parse(data);

        // Delete undefined nodes in edges (edge data cleanup)
        $.each(graph.edges, function(index, edge){
          if(edge.endNode == "undefined_undefined"){
            delete graph.edges[index];
          }
        });

        $.each(graph.edges, function(index, edge){
        
          startNodeName = edge.startNode;
          endNodeName = edge.endNode;
              
          startNode = graph.nodes[startNodeName];
          endNode = graph.nodes[endNodeName];

          // Assign outEdges to nodes
          
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

          // calculate edge length
          edge.edgeLength = findEdgeLength(startNode.x, startNode.y, endNode.x, endNode.y);     
        });   
    
        // Assign  initial weight  (0 - Infinity) and visited (true/false) value to nodes
        $.each(graph.nodes, function(index, node){

          if (index == startPoint) {
              node.weight = 0;
          } else {
              node.weight = Infinity;
          }
          curNode = startPoint;
          node.visited = false; 
        });
          
        function dijkstra() {
            
          // find node with the smallest weight
          var minWeight = Infinity;

          $.each(graph.nodes, function(index, node){ 
            if(node.visited == false) {
              if (minWeight > node.weight) {
                  minWeight = node.weight;
                  minWeightNode = index;
              }       
            }
          });

          // assign the smallest weight node name to curNode
          curNode = minWeightNode;

          // add curNode to visited
          graph.nodes[curNode].visited = true;
          
          // cycle through the edges attached to the min node
          $.each(graph.nodes[curNode].outEdges, function(edge) {

            outEdge_sn = graph.edges[edge].startNode;
            outEdge_en = graph.edges[edge].endNode;

            // edge length + current node weight
            var proposedWeight = graph.nodes[curNode].weight + graph.edges[edge].edgeLength; 

            // evalNode: the node that's on the other end of the edge -- its value will be evaluated and potentially changed  
            if (graph.nodes[outEdge_sn].visited == false || graph.nodes[outEdge_en].visited == false) {
              
              if (outEdge_sn != curNode) {
                evalNode = graph.edges[edge].startNode;
              } else {
                evalNode = graph.edges[edge].endNode;
              }
    
              // if the evalNode has not been visited and has a higher weight than proposed weight, its weight will be changed to the proposed weight 
              if (graph.nodes[evalNode].weight > proposedWeight) {
                  graph.nodes[evalNode].weight = proposedWeight;
                  graph.nodes[evalNode].lastEdge = edge;
              }
            } else {
              true;
            }
            
          });
        }
        
        while(curNode != endPoint) {
            dijkstra();
        }  

        var pathNode = endPoint;
        var pathNodes = [];
        var pathEdges = [];
        pathEdge = graph.nodes[pathNode].lastEdge;
      
        // Trace the path from endPoint to startPoint

        // while the startNode and endNode are not equal to the startPoint:
        while(graph.edges[pathEdge].startNode != startPoint && graph.edges[pathEdge].endNode != startPoint){

          // ARRAY OF PATH NODES:

          // add x and y coordinates to an object
          pathNodeCoords = {};
          pathNodeCoords.x = graph.nodes[pathNode].x;
          pathNodeCoords.y = graph.nodes[pathNode].y;
          
          // push the object to the pathNodes array
          pathNodes.push(pathNodeCoords);
          
          // ARRAY OF PATH EDGES:

          // identify a path edge
          pathEdge = graph.nodes[pathNode].lastEdge;
          
          // create an object for the pathEdges array
          pathEdgeCoords = {};
          pathEdgeCoords.sx = graph.edges[pathEdge].sx;
          pathEdgeCoords.sy = graph.edges[pathEdge].sy;
          pathEdgeCoords.ex = graph.edges[pathEdge].ex;
          pathEdgeCoords.ey = graph.edges[pathEdge].ey;
          
          // push the object to the pathEdges array
          pathEdges.push(pathEdgeCoords);

          // if the lastEdge does not contain the startPoint
          if(graph.edges[pathEdge].startNode != pathNode) {
              pathNode = graph.edges[pathEdge].startNode;
          } else {
              pathNode = graph.edges[pathEdge].endNode;
          }
            
        }
        // push the startPoint node coordinates to the pathNodes array separately
        // after all the lastEdges are found (startPoing doesn't have a lastEdge)    
        pathNodeCoords.x = graph.nodes[startPoint].x;
        pathNodeCoords.y = graph.nodes[startPoint].y;
        
        pathNodes.push(pathNodeCoords);

        callback(pathNodes, pathEdges);

      });
    }
  };
  return dijkstraObj; 
}

module.exports.dijkstra = dijkstra;