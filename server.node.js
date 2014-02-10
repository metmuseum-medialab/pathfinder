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

var dataFilename = "graph.json";
var dataDir = "data/";


var jsdom = require("jsdom"); 
$ = require("jquery")(jsdom.jsdom().createWindow()); 

var port = 1337;
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

  if(!query.action){
    sendFile(parsed.pathname, query, res);
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
  var graph = JSON.parse(query.graph);
  var graphstring = JSON.stringify(graph, null, ' ');

  var filename; 
  var dataFilename;
  var shortname;
  if(query.filename && query.filename.trim() != ""){
    filename = query.filename;
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


  console.log("saving");
  console.log(graph);

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
}


function getGraphList(req, res, query){
  console.log("getting graph list");
  var filelist = getDataFileList(dataDir, function(list){
    console.log("got list");
    console.log(list);
    var contentType = "application/json";
    res.writeHead(200, {'Content-Type': contentType});

    res.end(JSON.stringify(list));

  });
}

function getDataFileList(dirname, callback2){
  var filelist = fs.readdirSync(dirname);
  console.log(filelist);
  var newList = {};
  async.eachSeries(filelist, 
    function(file, callback){
      console.log("file " + file);
      newList[file] = {file: file};
      var path = dirname + file;
      newList[file].stat = fs.statSync(path);
      console.log(newList);
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
    var contentType = "application/json";
    res.writeHead(200, {'Content-Type': contentType});
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

