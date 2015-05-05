// node.js
/* 

*/

/*
testing:
*/

// connect to db,
var dijkstra = require("./js/dijkstra.js").dijkstra();
var poiPath = require("./js/poiPath.js").poiPath();
dijkstra.graph_file = "data/all_floors.json";
poiPath.graph_file = "./data/all_floors.json";

var async = require("async");

var urlparser = require("url");
var fs = require("fs");
var pathparser = require("path");

var dataFilename = "all_floors.json";
var dataDir = "data/";
var dataGraphs = {};
var graphGalleryNodes = {};


var jsdom = require("jsdom"); 
$ = require("jquery")(jsdom.jsdom().createWindow()); 

var port = 1337;
if(process && process.env && process.env.NODE_ENV == "production"){
  port = 1337;
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
  res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"]);        

  console.log("got request");
  var parsed = urlparser.parse(req.url, true)
  var query = urlparser.parse(req.url, true).query;
  console.log('~~~~~~~~~~~~~~~~~');
 // console.log(parsed);
  console.log('~~~~~~~~~~~~~~~~~');
  //console.log(query);
  console.log('~~~~~~~~~~~~~~~~~');

  if(!query.action){
    sendFile(parsed.pathname, query, res);

  }else if (query.action == "poiPath"){
    console.log("calling poiPath");
    poi_set = JSON.parse(query.poi);
    
    loadGraphIntoMemory(dataFilename, function(){
      reconcile_pois(dataFilename, poi_set, function(_poi_set, poi_problems){
        poiPath.poiPathCalc(_poi_set, query.prefs, function(poiPath_received){
          console.log("poiPathCalc is running on the server");
          //console.log(poiPath_received);
          console.log(req.headers);
          res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"]);        
          res.writeHead(200, {'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin' : '*'});
          res.end(JSON.stringify({poiPath: poiPath_received , poi_problems: poi_problems}));
        });
      });
    }, false);
  }else if (query.action == "dijkstra"){
    console.log("calling DijkstraCalc");
    //console.log(dijkstra);
    dijkstra.dijkstraCalc(query.c1, query.c2, function(nodes, edges){
      console.log("got nodes and edges");
      res.writeHead(200, {'Content-Type': 'application/json', 
                        'Access-Control-Allow-Origin' : '*'});
      res.end(JSON.stringify({nodes: nodes, edges: edges}));

    });

  }else if (query.action == "savegraph"){
    saveGraph(req, res, query);
  
  }else if (query.action == "loadgraph"){
    loadGraph(req, res, query);
  
  }else if (query.action == "getgraphlist"){
    getGraphList(req, res, query);
  
  }else if (query.action == "getgallerynode"){
    getGalleryNode(req, res, query);
  }else if(query.action == "search"){
    searchScrapi(req, res, query);
  }else{
   res.writeHead(200, {'Content-Type': 'text/html', 
                        'Access-Control-Allow-Origin' : '*'});
   res.end("<html><body><pre>not sure what to do</pre></body></html>");
  }

}


var limit = require("simple-rate-limiter");
var scrapi_request = limit(require('request')).to(10).per(1000);



function reconcile_pois(dataFilename, poi_set, callback){
  // do a pass over teh submitted POIs. some might just be gallery numbers, or objects
  var poi_problems = [];
  var poi_count = 0;
  $.each(poi_set, function(index, poi){
    console.log("checking " + index);
    // if there's just an objectID, get the gallery, then the node data
    if(!poi.x){ // ie, there's no coordinates
      if(poi.objectinfo){
        // scrapi call for objectinfo
        var crdid = poi.objectinfo.id;
        var url = "http://www.scrapi.org/object/"+crdid+"?fields=accessionNumber,title,dateText,gallery,CRDID,currentImage/imageUrl,medium,primaryArtistNameOnly";
        console.log("Calling url " + url);
        scrapi_request(url, function(error, response, body){
          if (!error && response.statusCode == 200) {
            console.log("got results"); // Show the HTML for the Google homepage. 
            var objectdata = JSON.parse(body);

            objectdata.image_thumb = objectdata.currentImage.imageUrl.replace(/-large/, "-thumb");
            objectdata.href= "http://www.scrapi.org/object/"+crdid;
            objectdata.website_href= "http://www.metmuseum.org/collection/the-collection-online/search/"+crdid;
            console.log(objectdata);
            if(!objectdata.gallery.match(/not on view/i)){
              poi.objectinfo = objectdata;
              poi.galnum = objectdata.gallery;
              reconcile_poi_galnum(dataFilename,poi, poi_problems);
            }else{
              var problem = {message: "the object " + crid + " isn't on view.", code: "obj_not_on_view", object: objectdata, poi: poi};
              poi_problems.push(problem);
              poi.problem = problem;
            }
          }else{
            var problem = {message: "we couldn't find out where object " + crdid + " is.", code:"obj_search_error", poi: poi};
            poi.problem = problem;
            poi_problems.push(problem);
          }
          poi.object_reconciled = true; 
          poi_count++;
          if(poi_count == Object.keys(poi_set).length){
            callback(poi_set, poi_problems);
          }else{
            console.log("count " + poi_count + " not to " + Object.keys(poi_set).length);
          }
        });
      }else if (poi.galnum){
        reconcile_poi_galnum(dataFilename, poi, poi_problems);
        poi_count++;
        if(poi_count == Object.keys(poi_set).length){
          callback(poi_set, poi_problems);
        }else{
            console.log("count " + poi_count + " not to " + Object.keys(poi_set).length);
        }

      }
    // if there's just a gallery number, get the node data from the graph  
    }else{
      poi.object_reconciled = true; 
      poi_count++;
      if(poi_count == Object.keys(poi_set).length){
        callback(poi_set, poi_problems);
      }else{
        console.log("count " + poi_count + " not to " + Object.keys(poi_set).length);
      }
    }
  });
}

function reconcile_poi_galnum(dataFilename, poi, poi_problems){
  var galleryNode = graphGalleryNodes[dataFilename][poi.galnum];
  if(!galleryNode){
    var problem = {code: "gallery_not_listed", message : "we couldn't find gallery " + poi.galnum + " in the map", poi: poi};
    poi.problem = problem;
    poi_problems.push(problem);
  }else{
    $.extend(poi, galleryNode);
  }
  poi.gallery_reconciled = true;
}

function searchScrapi(req, res, query){
  var term = query.term;
  var scrapiurl = "http://scrapi.org/search/" +encodeURIComponent(term);
  var request = require("request");
  request(scrapiurl, function(error, response, body){
    res.writeHead(response.statusCode, {"Content-Type" : response.headers['content-type'], 
                                          'Access-Control-Allow-Origin' : '*'});
    res.end(body);
  });
}

function loadGraphIntoMemory(graphName, callback, errorcallback){
  dataFile = dataDir +  graphName;


  if(!fs.file)

  fs.readFile(dataFile, function(err, data) {
    if(err){
        if(errorcallback){
          errorcallback(err);
        }
        return;
    }
    console.log("data file");
    console.log(data);


    dataGraphs[graphName] = JSON.parse(data);
    graphGalleryNodes[graphName] = {};

    // create index of gallery nodes.
    $.each(dataGraphs[graphName].nodes, function(index, node){
      node.id = index;
      if(node.galnum && node.galnum.trim() != ""){
        graphGalleryNodes[graphName][node.galnum.trim()] = node;
      }
    });

    if(callback){
      callback();    
    }
  });

}

//http://66.175.215.36/pathfinder/?action=getgallerynode&graphName=all_floors.json&gallerynumber=354

function getGalleryNode(req, res, query){

    var graphName = query.graphName;
    var galleryNumber = query.gallerynumber;


    if(!graphGalleryNodes[graphName]){
      loadGraphIntoMemory(graphName, function(){
        var galleryNode = graphGalleryNodes[graphName][galleryNumber];

        if(galleryNode){
          var contentType = "application/json";
          res.writeHead(200, {'Content-Type': contentType, 
                        'Access-Control-Allow-Origin' : '*'});
          res.end(JSON.stringify(galleryNode));
          return;
        }else{
          var contentType = "application/json";
          res.writeHead(200, {'Content-Type': contentType, 
                        'Access-Control-Allow-Origin' : '*'});
          res.end(JSON.stringify({result: "bad", message: "Gallery Number "+ galleryNumber+" not found " }));
          return;          
        }
      },
      function(err){
        var contentType = "application/json";
        res.writeHead(200, {'Content-Type': contentType, 
                        'Access-Control-Allow-Origin' : '*'});
        res.end(JSON.stringify({result: "bad", message: "Gallery Number not found " + err}));
        return;

      });

    }else{
        var galleryNode = graphGalleryNodes[graphName][galleryNumber];
        if(galleryNode){
          var contentType = "application/json";
          res.writeHead(200, {'Content-Type': contentType, 
                        'Access-Control-Allow-Origin' : '*'});
          res.end(JSON.stringify(galleryNode));
          return;
        }else{
          var contentType = "application/json";
          res.writeHead(200, {'Content-Type': contentType, 
                        'Access-Control-Allow-Origin' : '*'});
          res.end(JSON.stringify({result: "bad", message: "Gallery Number " + galleryNumber + " not found "}));
          return;          
        }

    }


}

function saveGraph(req, res, query){
  //console.log(JSON.stringify(req));

  /*
  var graph = JSON.parse(query.graph);
  var graphstring = JSON.stringify(graph, null, ' ');
 */


  var body = '';

  req.addListener('data', function(chunk){
    console.log('got a chunk');
    body += chunk;
  });

  req.addListener('error', function(error){
    console.error('got a error', error);
    next(err);
  });

  req.addListener('end', function(chunk){
    console.log('ended');
    if (chunk) {
      body += chunk;
    }

    var data = JSON.parse(body);


    var filename; 
    var dataFilename;
    var shortname;
    if(data.filename && data.filename.trim() != ""){
      filename = data.filename;
      if(!filename.match(/\.json$/)){
        filename += ".json";
      }
      shortname = filename;
      dataFilename = dataDir + filename;
    }else{
      var date = new Date();
      var datetime = date.getTime();
      shortname = "graph."+datetime+".json";
      dataFilename = dataDir + shortname;

    }



    var graph = data.graph;
    var graphstring = JSON.stringify(graph);

    fs.writeFile(dataFilename, graphstring, function (err) {
      if (err) { 
        var contentType = "application/json";
        res.writeHead(200, {'Content-Type': contentType, 
                        'Access-Control-Allow-Origin' : '*'});

        res.end(JSON.stringify({result: "bad", message: err}));

        return;
      };
      var contentType = "application/json";
      res.writeHead(200, {'Content-Type': contentType, 
                        'Access-Control-Allow-Origin' : '*'});

      res.end(JSON.stringify({result: "good", filename: shortname}));

      console.log('data saved to file ' + dataFilename);
    });    

  });

}


function getGraphList(req, res, query){
  console.log("getting graph list");
  var filelist = getDataFileList(dataDir, function(list){
    var contentType = "application/json";
    res.writeHead(200, {'Content-Type': contentType, 
                        'Access-Control-Allow-Origin' : '*'});

    res.end(JSON.stringify(list));

  });
}

function getDataFileList(dirname, callback2){
  var filelist = fs.readdirSync(dirname);

  var newList = {};
  async.eachSeries(filelist, 
    function(file, callback){

      newList[file] = {file: file};
      var path = dirname + file;
      newList[file].stat = fs.statSync(path);

      callback();
    },
    function(){
      callback2(newList);
    }
  );
}

function loadGraph(req, res, query){
  console.log("loading");
  console.log(query);

  var dataFile = dataFilename;
  if(query.dataFile){
    dataFile = dataDir +  query.dataFile;
  }

  fs.readFile(dataFile, function(err, data) {
    if(err){
      console.log(err);
      var contentType = "application/json";
      res.writeHead(200, {'Content-Type': contentType, 
                        'Access-Control-Allow-Origin' : '*'});
      res.end(JSON.stringify({result: "bad", message: err}));
      return;
    }
    console.log("data file");
    console.log(data);

    var contentType = "application/json";
    res.writeHead(200, {'Content-Type': contentType, 
                        'Access-Control-Allow-Origin' : '*'});
    res.end(data);
    

  });

}

var dataCache = {};
function sendFile(path, query, res){

  if(path == "/"){
    path = "/index.html";
  }
  var extname = pathparser.extname(path);
  var contentType = 'text/html';
  switch (extname.toLowerCase()) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpeg';
      break;
  }

  if(!dataCache[path]){
    fs.readFile("."+path, function(err, data){
      if(err){
        console.log("file read error");
        console.log(err);
        res.writeHead(404, {'Content-Type': contentType, 
                        'Access-Control-Allow-Origin' : '*'});
        //indexhtml = data;
        res.end(data);
      }else{
        res.writeHead(200, {'Content-Type': contentType, 
                        'Access-Control-Allow-Origin' : '*'});
        console.log("writing file " + path);
     //   console.log(data);
        //dataCache[path] = data;
        res.end(data);
      }
    });
  }else{
    res.writeHead(200, {'Content-Type': contentType, 
                        'Access-Control-Allow-Origin' : '*'});
    res.end(dataCache[path]);
  }
}

