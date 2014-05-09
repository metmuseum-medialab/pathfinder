pathfinder
==========
This is an app for creating routes on a map,
Then using those routes to determine ideal paths through a space.

Paths may be weighted according to a user's preferences (avoiding stairs, dim rooms, etc)

Initially we are creating the route-creation app, to build the dataset.

---

# Running the pathfinder

  * Install all the node libraries with `npm install`
  * Run the appropriate server, for example `node server.mvp1.js`
  * Open [http://localhost:1337](http://localhost:1337) in a browser


[MVP1](index_mvp1.html):
Calculates a path form A to B using Dijkstra's weighted graph algorithm

[MVP2](index_mvp2.html):
Calculates a path between multiple user-defined points (starting at the Met's entrance) by creating permutations of all possible paths between these points (using the Dijkstra algorithm from MVP1) and then applying the Nearest Neighbor algorithm (a heuristic approach to the Travelling Salesman Problem) to choose the best route among all the possible paths.
