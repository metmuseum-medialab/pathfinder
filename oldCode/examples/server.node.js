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


var secrets = require("./secrets").secrets();


var site = secrets.hackpad_name;
// hp_clientid and hp_secret

var Hackpad = require("hackpad");

var port = secrets.port;
if(process && process.env && process.env.NODE_ENV == "production"){
  port = secrets.prod_port;
}
// create some sample objects, put in couchdb


var client = new Hackpad(secrets.hp_clientid, secrets.hp_secret, {site: site});


var pads = {};


updateList(startServer);

function updateList(doneCallback){

  pads = {};

  client.list(function(error, list){

    var titleReg = /^# (.*)\n/;
    // eg [Accessibility](/lWrAuo7a0Uf)
    var linksReg = /\[([^\]]+)]\(\/([^\)]+)\)/g;

    console.log("got list" + list.length);
   // console.log(list);
    async.eachSeries(list, function(padid, callback){
      console.log("\n\n+++value " + padid);

      client.export(padid, null, 'md', function(error, content){

        /*
        console.log("\n\n\n\n*********************************************** content");
        console.log("padid : " + padid);
        console.log(error);
        */
        console.log(content);

        // parse content from md
        var pad;

        if(pads[padid]){
          pad = pads[padid];        
        }else{
          pad  = {padid : padid, numLinks: 0, numInLinks: 0, links: {}, inLinks : {}};

        }
        var matches = content.match(titleReg);

        if(matches){
          pad.title = matches[1];
        }else{
          console.log("page no title");
          callback();
          return;
        }

        var linkMatches;
        while (linkMatches = linksReg.exec(content)){
          var linkTitle = linkMatches[1];

          if(linkTitle.trim() != ""){
            var linkPadID = linkMatches[2];

            if(linkPadID != padid){ // no self-links!

              linkPadID = linkPadID.split("#")[0];

              var link = {title: linkTitle, padid : linkPadID};
              if(!pad.links[linkPadID]){
                pad.links[linkPadID] = link;
                pad.numLinks++;
              }

              // need inboiund links as well.
              var destPad= pads[linkPadID];
              if(!destPad){
                destPad = {padid : linkPadID, title: linkTitle, links: {} , inLinks: {} , numLinks: 0, numInLinks : 0};
                pads[linkPadID] =  destPad;
              }
              if(!destPad.inLinks){
                destPad.inLinks = {};
              }
              if(!destPad[padid]){
                destPad.inLinks[padid] = padid;
                destPad.numInLinks++;
              }
            }
          }

        }
        console.log(pad);


        pads[padid] = pad; 

        callback();
      });
    },

    doneCallback

    );
  });

}



var started = false;
function startServer(){

  if(!started){
    started = true;
  }else{
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! already started!");
    return;
  }

  console.log(JSON.stringify(pads, null, ' '));

  console.log("starting server");
    
  var http = require('http');
  http.createServer(function (req, res) {
    parseRequest(req, res);

  }).listen(port);
  console.log('Server running at port ' + port);


  console.log("pads length" + pads.length);

  
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
  }else if (query.action == "listpads"){
    listpads(query, res);

  }else if (query.action == "updatelist"){
    updateList(function (){ 
      console.log("%%%%%%%%%%%%%%%%%%%%%%%%updating happened!");
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end("<html><body>list updated</body></html>");
    });
  }else{
   res.writeHead(200, {'Content-Type': 'text/html'});
   res.end("<html><body><pre>not sure what to do</pre></body></html>");
  }

}

function listpads(query, res){

  res.writeHead(200, {'Content-Type' : 'application/json'});

  res.end(JSON.stringify(pads));

}




var dataCache = {};
function sendFile(path, query, res){

  if(path == "/"){
    path = "/index.html";
  }

  var extname = pathparser.extname(path);
  var contentType = 'text/html';
  if(path.match(/secrets\.js/)){
        res.writeHead(404, {'Content-Type': contentType});
        //indexhtml = data;
        res.end("I'm afraid I can't do that.");
        return;
  }

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

