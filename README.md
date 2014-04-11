pathfinder
==========
This is an app for creating routes on a map,
Then using those routes to determine ideal paths through a space.

Paths may be weighted according to a user's preferences (avoiding stairs, dim rooms, etc)

initially we are creating the route-creation app, to build the dataset.


====================================================================================================

MVP1:
Calculates a path form A to B using Dijkstra's weighted graph algorithm

MVP2: 
Calculates a path between multiple points (starting at the Met's entrance) by permutating all the possble paths between all selected points of interest (using the Dijkstra algorithm from MVP1) and then using the Nearest Neighbor algorithm (a heuristic approach to the Travelling Salesman Problem) to choose the best route among all the possible paths.


