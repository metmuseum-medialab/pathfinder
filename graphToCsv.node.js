// graph to csv

fs = require("fs");


var filepath = "./data/floor_1.json";


var data = JSON.parse(fs.readFileSync(filepath));

var strings = [];

var galnums = [];
var dupe_galnums = {};


var nodes_by_galnum = {};


var imgScale = .3;

// finding and averaging dupes
Object.keys(data.nodes).forEach(function(key) {
    var node = data.nodes[key];
	if(node.nodetype == "gallery"){
	  	var x = node.x;
	  	var y = node.y;
	  	var galnum = node.galnum;

	  	if(nodes_by_galnum[galnum]){
		  	console.log("duplicate galnum " + galnum);
		  	if(!dupe_galnums[galnum]){
		  		dupe_galnums[galnum] = [];
		  		dupe_galnums[galnum].push(nodes_by_galnum[galnum]);
		  	}
		  	dupe_galnums[galnum].push(node);
	  	}
		nodes_by_galnum[galnum] = node;
	}
});


var avgs = {};
// average duplicate galnums;
Object.keys(dupe_galnums).forEach(function(key) {
	console.log("dupe " + key);
	var totalx = 0;
	var totaly = 0;
	for(i = 0; i < dupe_galnums[key].length; i++){
		console.log(dupe_galnums[key][i].x / imgScale + " , " + dupe_galnums[key][i].y / imgScale)
		totalx += dupe_galnums[key][i].x;
		totaly += dupe_galnums[key][i].y;
	}
	var avgx = totalx / dupe_galnums[key].length;
	var avgy = totaly / dupe_galnums[key].length;
	console.log(avgx / imgScale + " , " + avgy / imgScale);
	avgs[key] = {x : avgx , y : avgy};
});



Object.keys(data.nodes).forEach(function(key) {
    var node = data.nodes[key];
	if(node.nodetype == "gallery"){
		var x = node.x;
	    var y = node.y;
    	var galnum = node.galnum;

    	if(avgs[galnum]){
    		node.x = avgs[galnum].x;
    		node.y = avgs[galnum].y;
    	}

	    if(galnums.indexOf(galnum) > 0){
	  		console.log("duplicate galnum " + galnum);
	    }else{
		    galnums.push(galnum);

		    var string = node.galnum + "," + Math.floor(node.x / imgScale) + "," + Math.floor(node.y / imgScale);

		    strings.push(string);
		}
	}

});

console.log(strings.join("\n"));



console.log("done");