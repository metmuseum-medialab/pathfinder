pathfinder
==========
This is an app and webservice that makes is easy to create wayfinding experiences that involve dynamic path generation. It was designed for large, confusing, indoor spaces, but in fact could be used abstractly for any graph-traversal/path optimization problem. It supports weighting of paths so allow for different routes depending on the users preference to avoid dimly lit spaces, stairs, etc.

This code consists of two parts:

MapMaker: 
Mapmaker is a simple tools for drawing graphs over an image of a map. In this tool, you draw every possible route from one room to another. You then assign metadata values to the routes and intersections. This metadata is later used by PathFinder to calculate routes


Pathfinder: 
Pathfinder is a service that allows you to request an optimal path through multiple points, taking into account a variety of preferences.

Pathfinder comes with a very simple frontend, but this was designed simply to test the algorithm. It's expected that you'll make your own implementation of a frontend.

This project is very much in development. There's lots of code that's specific to our implementation at the Met, that we're working to abtract out to make it a more general purpose tool.


====================================================================================================


