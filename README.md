Pathfinder
==========
This is an app and webservice that makes is easy to create wayfinding experiences that involve dynamic path generation. It was designed for large, confusing, indoor spaces, but in fact could be used abstractly for any graph-traversal/path optimization problem. It supports weighting of paths so allow for different routes depending on the users preference to avoid dimly lit spaces, stairs, etc.


Terms:
======
"node" - a point in a graph
"edge" - a line connecting two nodes
"Point of Interest" aka POI, aka waypoint - a node you've selected as a point you want to pass through.
"pass"  - a node that is NOT a point of interest, but needed to define a path through a space.

This code consists of two parts:

MapMaker: 
=========
Mapmaker is a simple tools for drawing graphs over an image of a map. In this tool, you draw every possible route from one room to another. You then assign metadata values to the routes and intersections. This metadata is later used by PathFinder to calculate routes

Pathfinder:
===========
Pathfinder is a service that allows you to request an optimal path through multiple points, taking into account a variety of preferences.

Pathfinder comes with a very simple frontend, but this was designed simply to test the algorithm. It's expected that you'll make your own implementation of a frontend.

This project is very much in development. There's lots of code that's specific to our implementation at the Met, that we're working to abtract out to make it a more general purpose tool.


Graph Format:
============
Graph files (json) look like:

    {  
       "image_height":642.6,  // the map image height
       "imageWidth":964.1999999999999, // the map image width
       "nodes":{  
          "481_599":{  
             "x":481,
             "y":599,
             "nodetype":"pass" // indicates this node is a "pass" type
          },
          "482_560":{  
             "x":482,
             "y":560,
             "nodetype":"gallery",
             "galnum":"The Great Hall" // a "point of interest" or POI node
          },
          ... etc
        }
        "edges":{  
          "481_599:482_560":{  
             "sx":481,
             "sy":599,
             "ex":482,
             "ey":560,
             "startNode":"481_599",
             "endNode":"482_560"
          },
          "482_560:438_559":{  
             "sx":482,
             "sy":560,
             "ex":438,
             "ey":559,
             "startNode":"482_560",
             "endNode":"438_559"
          },
        }
      }


Pathfinder Service Description:
==============================
When you run pathfinder, the service listens at the specified port (default 1337) for http requests

GET Request Parameters
----------

action : the request method. May be:
    
### action=poiPath
The Workhorse, this is the request to get the optimized path.
Request format is: 
poi="{stringified json of Nodes, in the format specified in graph file format}"
eg:

    poi="{"127_157":{"x":127,"y":157,"type":"start","galnum":"913"},"389_193":{"x":389,"y":193,"type":"poi","galnum":"525"},"484_221":{"x":484,"y":221,"type":"poi","galnum":"520"}}"
&
prefs="{stringified json of weighting preferences, where higher integers means "these paths are less desirable"
eg:

    prefs="{"light":"0","crowd":"2","noise":0}"
    
Response
--------
returned is json data, describing each segment of the route, in order
eg:

    {  
       "poiPath":[  
          {  
             "sx":36,
             "sy":398,
             "ex":36,
             "ey":437,
             "length":39,
             "n1":"36_398",
             "n2":"36_437",
             "startsAtPoi":{   // if this part of your route starts at one of your selected waypoints, this data is here
                "x":36,
                "y":398,
                "type":"start",
                "galnum":"354",
                "outEdges":{  
                   "36_398:27_554":"36_398:27_554",
                   "36_398:81_467":"36_398:81_467"
                },
                "visited":true
             }
          },
          {  
             "sx":36,
             "sy":437,
             "ex":76,
             "ey":437,
             "length":40,
             "n1":"36_437",
             "n2":"76_437"
          },
          {  
             "sx":76,
             "sy":437,
             "ex":81,
             "ey":467,
             "length":30.4138126514911,
             "n1":"76_437",
             "n2":"81_467",
             "endsAtPoi":{   // if this part of your route end at one of your selected waypoints (POI), this data is here
                "x":81,
                "y":467,
                "type":"poi",
                "galnum":"353",
                "outEdges":{  
                   "36_398:81_467":"36_398:81_467",
                   "27_554:81_467":"27_554:81_467"
                },
                "visited":true
             }
          },
          {  
             "sx":81,
             "sy":467,
             "ex":33,
             "ey":467,
             "length":48,
             "n1":"81_467",
             "n2":"33_467",
             "startsAtPoi":{  
                "x":81,
                "y":467,
                "type":"poi",
                "galnum":"353",
                "outEdges":{  
                   "36_398:81_467":"36_398:81_467",
                   "27_554:81_467":"27_554:81_467"
                },
                "visited":true
             }
          },
    
    ====================================================================================================
    
    
