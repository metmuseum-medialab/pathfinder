(function ( $, window, document, undefined ) {


   /*
events triggered by this module
"poi_added"
"poi_deleted"


   */
 
   $.metPathfinder = function(element, options) {
      this.options = {};
       
      element.data('metPathfinder', this);
      
      this.init = function(element, options) {         
         this.options = $.extend({}, $.metPathfinder.defaultOptions, options); 
         this.element = element;
         this.options.map_width = this.options.map_srcWidth * this.options.imgScale;
         this.options.map_height = this.options.map_srcHeight * this.options.imgScale;
       
         //Manipulate element here ...       
      };
      
      //Public functions
      this.setupMap = function(callback) {
         console.log('setting up map');           
         $(this.element).height(this.options.map_height+this.options.vertShift).width(this.options.map_width);
         var realthis = this;

         Raphael($(this.element).attr("id"), this.options.map_width, this.options.map_height+this.options.vertShift, function(text){

             console.log("in paper");
             realthis.options.paper = this; //this is valid within this functiom

             var map_paperImg = realthis.options.paper.image(realthis.options.server_url + realthis.options.map_image_url, 0,realthis.options.vertShift, realthis.options.map_width, realthis.options.map_height);

             $.getJSON(realthis.options.server_url + 'data/all_floors.json ', function(graph) {
                 console.log("got data");
                 console.log(graph);
                 $.each(graph.nodes, function(index, node) {

                     if (node.nodetype == "gallery") { 
                         
                         realthis.options.poi_set = {};

                         var txtClicked = false;

                         var txtDraw = realthis.options.paper.text(node.x, node.y+realthis.options.vertShift, node.galnum);
                         
                         // gallery numbers
                         txtDraw.id = index;
                         txtDraw.attr("fill", "black");
                         txtDraw.attr("fill-opacity",.5);
                         txtDraw.attr("font-size", 10);

                         // text event properties
                         txtDraw.click(function(evt){

                             var poi_id = this.id;
                             var nodeType;

                             //console.log(graph.nodes[this.id]);
                             if (txtClicked == false) {

                                 if (realthis.options.hasStartNode == false) {
                                  console.log("setting as start node");
                                     nodeType = "start";
                                     realthis.options.hasStartNode = true;
                                     realthis.options.startNodeId = poi_id;
                                 } else {
                                     nodeType = "poi";
                                 }

                                 this.attr("fill", "red");
                                 txtClicked = true;
                                 var poi_data = {x: node.x, y: node.y, type: nodeType, galnum: node.galnum};//, elem: this};
                                 realthis.options.poi_set[poi_id] = poi_data;
                                 realthis.element.trigger("poi_added", {element : this, data: poi_data});

//                                 drawWaypoints(); // 
                                 
                                 console.log(node);
                             } else {
                                 this.attr("fill", "black");
                                 txtClicked = false;
                                 delete realthis.options.poi_set[poi_id];
                                 realthis.element.trigger("poi_deleted", {element : this, poi_id : poi_id})
                             }
                             (function(_poi_id, _point){
                                 eve.on("clear.waypoints", function(){
                                     _point.attr("fill", "black");
                                     txtClicked = false;
                                     delete realthis.options.poi_set[_poi_id];
                                     realthis.element.trigger("poi_deleted", {element : this, poi_id : poi_id})
                                 }); 
                             })(poi_id, this);
                         });
                         
                         txtDraw.mouseover(function(evt){
                             if (txtClicked == false) {
                                 this.attr("fill-opacity", 1);
                             }
                         });

                         txtDraw.mouseout(function(evt){
                             if (txtClicked == false) {
                                 this.attr("fill-opacity", .5);
                             }
                         });
                     }
                 });
                if(callback){
                  callback();
                }
             });



          });
      };
      

      this.pathIt = function(){
         this.clearPath();
         console.log("pathit");
         console.log(this.options.poi_set);
         if(Object.keys(this.options.poi_set).length == 0){
          return;
         }
          var poiData = JSON.stringify(this.options.poi_set);
          var prefData = JSON.stringify(this.options.userPrefs);
          var thedata = {poi: poiData, prefs: prefData};
          console.log(thedata);
          realthis = this;
          //console.log(poiData);
          $.ajax({
              url : this.options.server_url+"?action=poiPath" ,
              data : {poi: poiData, prefs: prefData},
              //type : "PUT",
              contentType : 'json',
              // processData : false,
              success : function(poiPath, status){
                  console.log("Received poiPath data from server!!!");
                  console.log(poiPath);
                  realthis.drawPath(realthis.options.poi_set, poiPath);
              },

              error : function(jqXHR, status, message){
                  console.log("poiPath ajax error (index_mvp3.html)");
                  console.log(status);
                  console.log(message);
              }
          });   
      };

      this.drawPath = function(poi_set, poiPath) {
          console.log("About to draw the path!")

          this.clearPath();
          var realthis = this;
          // make circles
          /*$.each(poi_set, function(index, node) {
              var circle = paper.circle(node.x, node.y, 5);

                  circle.id  = node;
                  //circle.attr("stroke","black");
                  //circle.attr("stroke-width",0);
                  //circle.attr("fill", "blue");
                  //circle.attr("fill-opacity",".5");
          });*/
          // highlight path

          // make lines
          $.each(poiPath, function(index, path) {
              $.each(path, function(index, edge) {
                  var pathString = "M"+edge.sx+","+edge.sy+"L"+edge.ex+","+edge.ey;
                  var line = realthis.options.paper.path(pathString);
                  line.attr("stroke","black");
                  line.attr("stroke-width",2);
                  (function(_line){
                      console.log("attaching");
                      eve.on("clear.path", function(){
                          console.log("clear line");
                          _line.remove();
                      })
                  })(line);
                  // number the points
                  var halfx = (edge.sx + edge.ex) / 2;
                  var halfy = (edge.sy + edge.ey) / 2 ;
                  var ident = realthis.options.paper.text(halfx, halfy, index);
                  ident.attr("fill", "red");
                  ident.attr("fill-opacity",.5);
                  ident.attr("font-size", 20);
                  (function(_ident){
                      eve.on("clear.path", function(){
                          _ident.remove();
                      })
                  })(ident);
              });
          });
      };

      this.clearPath = function(){
          eve("clear.path");
      };

      this.objectSearch =  function(text, callback, errorCallback){
            $.ajax({
                url : this.options.server_url+"?action=search&term="+encodeURIComponent(text),
                data : {term: text, graphName: "all_floors.json"},
                //type : "PUT",
                contentType : 'json',
                // processData : false,
               success : function(results, status){
                  callback(results, status);
               },
               error : function(jqXHR, status, message){
                  errorCallback(jqXHR, status, message);
               }
            });

      }; 

      this.getGalleryNode = function(galleryNum, callback, errorCallback){
         var url = this.options.server_url+ "?action=getgallerynode&graphName=all_floors.json&gallerynumber="+encodeURIComponent(galleryNum);

         $.ajax({
            url: url,
            contentType : 'json', 
            // processData : false,
            success : function(results2, status){
               callback(results2, status);
            },
            error :function(jqXHR, status, message){
               errorCallback(jqXHR, status, message);
            }
         });
 
      };


      this.setStartNode = function(startNodeId){
        console.log("setting start node to " + startNodeId);
         this.options.poi_set[this.options.startNodeId].type = "poi";
         this.options.startNodeId = startNodeId;
         this.options.poi_set[this.options.startNodeId].type = "start";
         this.options.hasStartNode = true;
         console.log("start node id is now" + this.options.startNodeId);
         console.log(this.options.poi_set[this.options.startNodeId]);
      };
   
      this.init(element, options);
   };
  
   $.fn.metPathfinder = function(options) { //Using only one method off of $.fn  
      return this.each(function() {
         (new $.metPathfinder($(this), options));              
      });        
   };
    
   $.metPathfinder.defaultOptions = {
      class: 'metPathfinder',
      name: 'not set',
      server_url : "//66.175.215.36/pathfinder/",
      map_image_url : "images/MuseumMapFullAug2014.jpg",
      imgScale : .3,
      vertShift : 0,
      map_srcWidth : 2750,
      map_srcHeight : 4125, 
      map_width : 0,
      map_height : 0,
      paper : false, // "canvas"
      hasStartNode : false,
      startNodeId : false,
      poi_set : {},
      userPrefs : {light: 0, crowd: 0, noise: 0},
      userPrefsText : {
          light : {
              0 : "Don't Care",
              1 : "Bright",
              2 : "Subdued"
          },
          crowd : {
              0 : "Don't Care",
              1 : "Lively",
              2 : "Uncrowded"
          },
          noise : {
              0 : "Don't Care",
              1 : "Loud",
              2 : "Quiet"
          }
      }

   }

}( jQuery, window, document ));