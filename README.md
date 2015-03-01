Pathfinder
==========
This is an app and webservice that makes is easy to create wayfinding experiences that involve dynamic path generation. It was designed for large, confusing, indoor spaces, but in fact could be used abstractly for any graph-traversal/path optimization problem. It supports weighting of paths so allow for different routes depending on the users preference to avoid dimly lit spaces, stairs, etc.


Terms:
======
"node" - a point in a graph
"edge" - a line connecting two nodes
"Point of Interest" aka POI - a node named for a gallery, bathroom, or other idenfifyable space.
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

    poiPath: [
        {ex: 176 // end node, x coord
        ey: 125  // end node, y coord
        length: 32.01562118716424 // lenth of path
        n1: "144_124" // node 1 name
        n2: "176_125" // node 2 name
        sx: 144 // start node, x coord
        sy: 124} // start node, y coord
        {ex: 144
        ey: 124
        length: 31.016124838541646
        n1: "113_123"
        n2: "144_124"
        sx: 113
        sy: 123
        }
        ....etc
    ]


====================================================================================================


