// node.js
/* 

*/

/*
testing:
*/

// connect to db,


var async = require("async");

var urlparser = require("url");
var fs = require("fs");
var pathparser = require("path");

var jsdom = require("jsdom"); 
$ = require("jquery")(jsdom.jsdom().createWindow()); 

var port = 8888;
if(process && process.env && process.env.NODE_ENV == "production"){
  port = 80;
}
// create some sample objects, put in couchdb



startServer();

var started = false;
function startServer(){

  if(!started){
    started = true;
  }else{
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! already started!");
    return;
  }
    
  var http = require('http');
  http.createServer(function (req, res) {
    parseRequest(req, res);

  }).listen(port);
  console.log('Server running at port ' + port);

  
}


function parseRequest(req, res){
  console.log("got request");
  var parsed = urlparser.parse(req.url, true)
  var query = urlparser.parse(req.url, true).query;
  console.log('~~~~~~~~~~~~~~~~~');
 // console.log(parsed);
  console.log('~~~~~~~~~~~~~~~~~');
  //console.log(query);
  console.log('~~~~~~~~~~~~~~~~~');

  console.log(query);

  if(!query.action){
    sendFile(parsed.pathname, query, res);
  }else if (query.action == "dijkstra"){
    console.log("calling DijkstraCalc");
    dijkstraCalc(query.c1, query.c2, function(nodes, edges){
      console.log("got nodes and edges");
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({nodes: nodes, edges: edges}));

    });
  }else{
   res.writeHead(200, {'Content-Type': 'text/html'});
   res.end("<html><body><pre>not sure what to do</pre></body></html>");
  }

}




var dataCache = {};
function sendFile(path, query, res){

  if(path == "/"){
    path = "/dijkstra.html";
  }
  var extname = pathparser.extname(path);
  var contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
  }

  if(!dataCache[path]){
    fs.readFile("."+path, function(err, data){
      if(err){
        console.log("file read error");
        console.log(err);
        res.writeHead(404, {'Content-Type': contentType});
        //indexhtml = data;
        res.end(data);
      }else{
        res.writeHead(200, {'Content-Type': contentType});
        console.log("writing file " + path);
     //   console.log(data);
        //dataCache[path] = data;
        res.end(data);
      }
    });
  }else{
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(dataCache[path]);
  }
}


// define start and end point — will be user defined
function dijkstraCalc(c1, c2 , callback) {
    //GrecoRoman
    //var startPoint = "365_550";
    //var endPoint = "63_551";

    //ArmsAndArmor
    //var startPoint = "781_357";
    //var endPoint = "654_357";

    //ModernArt
    //var startPoint = "183_142";
    //var endPoint = "46_205";

    //floor_1
    var startPoint = c1;
    var endPoint = c2;

    var startNode, endNode;

    var curNode = false;

    console.log("c1", c1);
    console.log("c2", c2);


  //  var filename = 
    
    var findEdgeLength = function(x0, y0, x1, y1){
                return Math.sqrt((x0 -= x1) * x0 + (y0 -= y1) * y0);
            };


//    var stats = fs.statSync('')

    fs.readFile('./data/floor_1.json',  function(err, data) {

        if(err){
          console.log(err);
        }
        console.log(data);

        var graph = JSON.parse(data);

        console.log('got graph');
        // FUNCTION TO CLEAN UP DATA AND DELETE "stuff"
        $.each(graph.edges, function(index, edge){
            if(edge.endNode == "undefined_undefined"){

                delete graph.edges[index];
            }
        });
        
        // $.each is a jquery function that iterates over any collection (of objects or arrays)
        // "index" is the name of the object
        // "edge" is a var

        $.each(graph.edges, function(index, edge){
        
            startNodeName = edge.startNode;
            endNodeName = edge.endNode;
                
            startNode = graph.nodes[startNodeName];
            endNode = graph.nodes[endNodeName];

            // function to calculate edge length
            
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

                // evalNode: the node that's on the other end of the edge -- its value will be evaluated and potentially changed  
                if (graph.edges[edge].startNode.visited == false) {
                    evalNode = graph.edges[edge].startNode;
                } else {
                    evalNode = graph.edges[edge].endNode;
                }

                // edge length + current node weight
                var proposedWeight = graph.nodes[curNode].weight + graph.edges[edge].edgeLength; 

                // if the evalNode has not been visited and has a higher weight than proposed weight, its weight will be changed to the proposed weight 
                if (graph.nodes[evalNode].weight > proposedWeight) {
                    graph.nodes[evalNode].weight = proposedWeight;
                    graph.nodes[evalNode].lastEdge = edge;

                }
            });
        }


        var count = 0;

        while(curNode != endPoint) {
            console.log("dijkstra");
            console.log(count);
            count++;
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

    }
  )
}
