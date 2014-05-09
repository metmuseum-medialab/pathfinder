// node.js

// connect to db,
var dijkstra = require("./js/dijkstra_mvp2.js").dijkstra();
var poiPath = require("./js/poiPath_mvp2.js").poiPath();
dijkstra.graph_file = "data/floor_1.json";
poiPath.graph_file = "./data/floor_1.json";

var async = require("async");

var urlparser = require("url");
var fs = require("fs");
var pathparser = require("path");

var dataFilename = "graph.json";
var dataDir = "data/";

var jsdom = require("jsdom");
$ = require("jquery")(jsdom.jsdom().createWindow());

var port = 8080;
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
//  console.log(parsed);
  console.log('~~~~~~~~~~~~~~~~~');
//  console.log(query);
  console.log('~~~~~~~~~~~~~~~~~');

  if(!query.action){
    sendFile(parsed.pathname, query, res);

  }else if (query.action == "poiPath"){
    console.log("calling poiPath");

    poiPath.poiPathCalc(query.poi, function(poiPath_received){
      console.log("poiPathCalc is running on the server");
      console.log(poiPath_received);
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({poiPath: poiPath_received}));
    });

  }else if (query.action == "dijkstra"){
    console.log("calling DijkstraCalc");
    //console.log(dijkstra);
    dijkstra.dijkstraCalc(query.c1, query.c2, function(nodes, edges){
      console.log("got nodes and edges");
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({nodes: nodes, edges: edges}));

    });

  }else if (query.action == "savegraph"){
    saveGraph(req, res, query);

  }else if (query.action == "loadgraph"){
    loadGraph(req, res, query);

  }else if (query.action == "getgraphlist"){
    getGraphList(req, res, query);

  }else{
   res.writeHead(200, {'Content-Type': 'text/html'});
   res.end("<html><body><pre>not sure what to do</pre></body></html>");
  }

}

function saveGraph(req, res, query){

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
        res.writeHead(200, {'Content-Type': contentType});

        res.end(JSON.stringify({result: "bad", message: err}));

        return;
      };
      var contentType = "application/json";
      res.writeHead(200, {'Content-Type': contentType});

      res.end(JSON.stringify({result: "good", filename: shortname}));

      console.log('data saved to file ' + dataFilename);
    });

  });

}


function getGraphList(req, res, query){
  console.log("getting graph list");
  var filelist = getDataFileList(dataDir, function(list){
    var contentType = "application/json";
    res.writeHead(200, {'Content-Type': contentType});

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
      res.writeHead(200, {'Content-Type': contentType});
      res.end(JSON.stringify({result: "bad", message: err}));
      return;
    }
    console.log("data file");
    console.log(data);

    var contentType = "application/json";
    res.writeHead(200, {'Content-Type': contentType});
    res.end(data);


  });

}

var dataCache = {};
function sendFile(path, query, res){

  if(path == "/"){
    path = "/index_mvp2.html";
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
        res.writeHead(404, {'Content-Type': contentType});
        res.end(data);
      }else{
        res.writeHead(200, {'Content-Type': contentType});
        console.log("writing file " + path);
        res.end(data);
      }
    });
  }else{
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(dataCache[path]);
  }
}
