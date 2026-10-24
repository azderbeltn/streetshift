# OSMnx + Socrata (SODA 2.x / SODA3) + US Census API — saved reference for StreetShift

Sources (fetched 2026-10-24; each section below has its own Source: line; HTML pages converted to text, content verbatim):
- OSMnx: https://osmnx.readthedocs.io/en/stable/installation.html , https://osmnx.readthedocs.io/en/stable/getting-started.html , https://osmnx.readthedocs.io/en/stable/user-reference.html ; version from https://pypi.org/pypi/osmnx/json
- Socrata: https://dev.socrata.com/docs/endpoints , https://dev.socrata.com/docs/queries/ , https://dev.socrata.com/docs/app-tokens , https://dev.socrata.com/docs/queries/where , /select , /limit , https://dev.socrata.com/docs/functions/within_circle , https://dev.socrata.com/docs/datatypes/point , Discovery API spec https://dev.socrata.com/apis/discovery.yaml
- Census: https://api.census.gov/data/2024/acs/acs5/examples.html , https://api.census.gov/data/2024/acs/acs5/geography.html , variable JSON for B01003_001E and B11001_001E , https://www.census.gov/data/developers/guidance/api-user-guide.html , TIGERweb REST https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb , Census Geocoder https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html

## KEY FACTS (summary written by the doc fetcher; the "live test" items were run against the real APIs on 2026-10-24)

### OSMnx
- Current version **osmnx 2.1.1** (`uv add osmnx`, or `pip install osmnx`; conda-forge recommended by docs). OSMnx 2.x API: functions live in modules but are re-exported at top level (`ox.graph_from_point`, `ox.add_edge_speeds`, `ox.graph_to_gdfs`, `ox.features_from_point`, ...).
- `ox.graph_from_point(center_point, dist, *, dist_type='bbox', network_type='all', simplify=True, retain_all=False, truncate_by_edge=False, custom_filter=None)`. **center_point is (lat, lon)**. network_type ∈ {"all", "all_public", "bike", "drive", "drive_service", "walk"}.
- `ox.add_edge_speeds(G, *, hwy_speeds=None, fallback=None, agg=numpy.mean)` → adds `speed_kph`; then `ox.add_edge_travel_times(G)` → adds `travel_time` (seconds).
- `ox.graph_to_gdfs(G, *, nodes=True, edges=True, node_geometry=True, fill_edge_geometry=True)` → (gdf_nodes, gdf_edges); edges indexed by (u, v, key).
- `ox.features_from_point(center_point, tags, dist)` e.g. `tags={'building': True}` → GeoDataFrame multi-indexed by (element type, osmid).
- Routing: `ox.shortest_path(G, orig, dest, *, weight='length', cpus=1)`; `ox.nearest_nodes(G, X, Y)` / `ox.nearest_edges(G, X, Y)` take **X = lon, Y = lat**. Save/load: `ox.save_graphml` / `ox.load_graphml`.

### Socrata / SODA
- **Classic SODA 2.x** endpoint `https://<domain>/resource/<id>.json` with SoQL params (`$select`, `$where`, `$limit`, `$offset`, `$order`). App token via header **`X-App-Token`** (preferred). Live test: `GET https://data.cityofnewyork.us/resource/7ym2-wayt.json?$limit=1` worked with no token (HTTP 200).
- **SODA3**: `POST https://<domain>/api/v3/views/<id>/query.json` with JSON body `{"query": "SELECT * WHERE ...", "page": {"pageNumber": 1, "pageSize": 1000}, "includeSynthetic": false}`; export: `/api/v3/views/<id>/export.csv`. **SODA3 requires an app token or auth** — live test without token returned HTTP 403 `authentication_required`. Always send `X-App-Token`.
- `within_circle(<point_or_location_column>, <lat>, <lon>, <radius_m>)` inside `$where` (works on 2.0, 2.1 and 3.0 endpoints). Live test OK: `https://data.cityofnewyork.us/resource/cqsj-cfgu.json?$where=within_circle(the_geom, 40.7580, -73.9855, 1500)`.
- **NYC dataset gotchas (live test):**
  - Bi-Annual Pedestrian Counts `cqsj-cfgu`: geometry column `the_geom` (GeoJSON Point, lon/lat) → `within_circle` works. Columns like `loc, borough, street_nam, from_stree, to_street, iex, may_07_am, may_07_pm, may_07_md, sept_07_am, ...` (one column per count period). No count location within 1.5 km of Ditmars Blvd (40.7752, -73.9120) — `within_circle` returned `[]`.
  - Automated Traffic Volume Counts `7ym2-wayt`: geometry is a text column `wktgeom` in **NY State Plane feet (EPSG:2263)**, e.g. `"POINT (1035363.4 185093.4)"` — NOT a Point column, so `within_circle` will not work on it; filter by `boro`/`street`/`segmentid` or download and reproject (pyproj EPSG:2263 → 4326). Other columns: `requestid, boro, yr, m, d, hh, mm, vol, segmentid, street, fromst, tost, direction`.
- **Catalog (Discovery) search**: `https://api.us.socrata.com/api/catalog/v1?q=<text>&domains=<domain>&search_context=<domain>&limit=N`. Live test: for DataSF, `domains=data.sf.gov` alone returned only 5 results, but adding `search_context=data.sf.gov` returned proper results (e.g. `g8m3-pdis` "Registered Business Locations - San Francisco"). Result fields: `results[].resource.id`, `.resource.name`, `.metadata.domain`, `.permalink`. NYC example: `q=pedestrian counts&domains=data.cityofnewyork.us&search_context=data.cityofnewyork.us` → `cqsj-cfgu`, `2de2-6x2h` (map view), `ct66-47at` (Bicycle and Pedestrian Counts). NYC historical traffic counts also exist: `btm5-ppia` "Traffic Volume Counts (Historical)".
- DataSF portal domain **data.sf.gov** responded HTTP 200 (old data.sfgov.org retires Nov 20, 2026).

### US Census
- Latest ACS 5-year on the API: **2024** (`https://api.census.gov/data/2024/acs/acs5`; 2025 returned 404).
- Block-group query: `https://api.census.gov/data/2024/acs/acs5?get=NAME,B01003_001E,B11001_001E&for=block%20group:*&in=state:36%20county:081%20tract:*&key=YOUR_KEY` (official example form: `for=block%20group:*&in=state:06%20county:073`; geography hierarchy `state› county› tract› block group`, summary level 150). Response = JSON array of arrays, first row is the header.
- **A key is now required**: live test without `&key=` returned an HTML "Missing Key" page (not JSON). Use `CENSUS_API_KEY`.
- `B01003_001E` = "Estimate!!Total", concept "Total Population". `B11001_001E` = household count (see JSON below; table B11001 Household Type).
- NYC county FIPS (state 36): Bronx 005, Kings/Brooklyn 047, New York/Manhattan 061, Queens 081, Richmond 085. San Francisco = state 06 county 075; Alameda (Berkeley) = 06 001. (FIPS codes from general knowledge; Queens 081 confirmed by the geocoder test below.)
- Block-group polygons: TIGERweb `tigerWMS_ACS2024/MapServer/10` (layer 10 = "Census Block Groups", maxRecordCount 100000, supports geoJSON). Live-tested query:
  `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2024/MapServer/10/query?geometry=-73.912,40.7752&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=500&units=esriSRUnit_Meter&outFields=GEOID,STATE,COUNTY,TRACT,BLKGRP,AREALAND&returnGeometry=true&outSR=4326&f=geojson` → GeoJSON FeatureCollection of block-group polygons (GEOID = state+county+tract+blkgrp, 12 digits).
- Point → block group: Census Geocoder `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=<lon>&y=<lat>&benchmark=Public_AR_Current&vintage=Current_Current&layers=10&format=json` (live response included at the end).

---


# PART 1 — OSMnx


---

Source: https://osmnx.readthedocs.io/en/stable/installation.html

role="main" id="furo-main-content">

# Installation

## Conda

The foolproof way to install OSMnx is with conda or mamba:

```
conda create --strict-channel-priority -c conda-forge -n ox osmnx
```

This creates a new conda environment and installs OSMnx into it, via the conda-forge channel. If you want other packages, such as `jupyterlab`, installed in this environment as well, just add their names after `osmnx` above. To upgrade OSMnx to a newer release, remove the conda environment you created and then create a new one again, as above. See the conda-forge documentation for details.

## Docker

You can run OSMnx + JupyterLab directly from the official OSMnx Docker image.

## Pip

You can also install OSMnx with uv or pip (into a virtual environment):

```
pip install osmnx
```

OSMnx is written in pure Python and distributed on PyPI. Its installation alone is thus trivially simple if you have its dependencies installed and tested on your system. However, OSMnx depends on other packages that in turn depend on compiled C/C++ libraries, which may present some challenges depending on your specific system’s configuration. If precompiled binaries are not available for your system, you may need to compile and configure those dependencies by following their installation instructions. So, if you’re not sure what you’re doing, just follow the conda instructions above to avoid installation problems.

            On this page

- Installation

- Conda

- Docker

- Pip


---

Source: https://osmnx.readthedocs.io/en/stable/getting-started.html

role="main" id="furo-main-content">

# Getting Started

## Get Started in 4 Steps

-
Install OSMnx by following the Installation guide.

-
Read the Introducing OSMnx section on this page.

-
Work through the OSMnx Examples Gallery for step-by-step tutorials and sample code.

-
Consult the User Reference for complete details on using the package.

Finally, if you’re not already familiar with NetworkX and GeoPandas, make sure you read their user guides as OSMnx uses their data structures.

## Introducing OSMnx

This quick introduction explains key concepts and the basic functionality of OSMnx.

### Overview

OSMnx is pronounced as the initialism: “oh-ess-em-en-ex”. It is built on top of NetworkX and GeoPandas, and interacts with OpenStreetMap APIs to:

-
Download and model street networks or other infrastructure anywhere in the world with a single line of code

-
Download geospatial features (e.g., political boundaries, building footprints, grocery stores, transit stops) as a GeoDataFrame

-
Query by city name, polygon, bounding box, or point/address + distance

-
Model driving, walking, biking, and other travel modes

-
Attach node elevations from a local raster file or web service and calculate edge grades

-
Impute missing speeds and calculate graph edge travel times

-
Simplify and correct the network’s topology to clean-up nodes and consolidate complex intersections

-
Fast map-matching of points, routes, or trajectories to nearest graph edges or nodes

-
Save/load network to/from disk as GraphML, GeoPackage, or OSM XML file

-
Conduct topological and spatial analyses to automatically calculate dozens of indicators

-
Calculate and visualize street bearings and orientations

-
Calculate and visualize shortest-path routes that minimize distance, travel time, elevation, etc

-
Explore street networks and geospatial features as a static map or interactive web map

-
Visualize travel distance and travel time with isoline and isochrone maps

-
Plot figure-ground diagrams of street networks and building footprints

The OSMnx Examples Gallery contains tutorials and demonstrations of all these features, and package usage is detailed in the User Reference.

### Configuration

You can configure OSMnx using the `settings` module. Here you can adjust logging behavior, caching, server endpoints, and more. You can also configure OSMnx to retrieve historical snapshots of OpenStreetMap data as of a certain date.

Read more about the settings module in the User Reference.

### Geocoding and Querying

OSMnx geocodes place names and addresses with the OpenStreetMap Nominatim API. You can use the `geocoder` module to geocode place names or addresses to lat-lon coordinates. Or, you can retrieve place boundaries or any other OpenStreetMap elements by name or ID. Read more about the geocoder module in the User Reference.

Using the `features` and `graph` modules, as described below, you can download data by lat-lon point, address, bounding box, bounding polygon, or place name (e.g., neighborhood, city, county, etc).

### Urban Amenities

Using OSMnx’s `features` module, you can search for and download any geospatial features (such as building footprints, grocery stores, schools, public parks, transit stops, etc) from the OpenStreetMap Overpass API as a GeoPandas GeoDataFrame. This uses OpenStreetMap tags to search for matching elements.

Read more about the features module in the User Reference.

### Modeling a Network

Using OSMnx’s `graph` module, you can retrieve any spatial network data (such as streets, paths, rail, canals, etc) from the Overpass API and model them as NetworkX MultiDiGraphs.

In short, MultiDiGraphs are nonplanar directed graphs with possible self-loops and parallel edges. Thus, a one-way street will be represented with a single directed edge from node u to node v, but a bidirectional street will be represented with two reciprocal directed edges (with identical geometries): one from node u to node v and another from v to u, to represent both possible directions of flow. Because these graphs are nonplanar, they correctly model the topology of interchanges, bridges, and tunnels. That is, edge crossings in a two-dimensional plane are not intersections in an OSMnx model unless they represent true junctions in the three-dimensional real world.

The `graph` module uses filters to query the Overpass API: you can either specify a built-in network type or provide your own custom filter with Overpass QL. Under the hood, OSMnx does several things to generate the best possible model. It initially creates a 500m-buffered graph before truncating it to your desired query area, to ensure accurate streets-per-node stats and to attenuate graph perimeter effects. By default, it returns the largest weakly connected component. It also simplifies the graph topology as discussed below.

Read more about the graph module in the User Reference and refer to the official reference paper at the Further Reading page for complete modeling details.

### Topology Clean-Up

The `simplification` module automatically processes the network’s topology from the original raw OpenStreetMap data, such that nodes represent intersections/dead-ends and edges represent the street segments that link them. This takes two primary forms: graph simplification and intersection consolidation.

Graph simplification cleans up the graph’s topology so that nodes represent intersections or dead-ends and edges represent street segments. This is important because in OpenStreetMap raw data, ways comprise sets of straight-line segments between nodes: that is, nodes are vertices for streets’ curving line geometries, not just intersections and dead-ends. By default, OSMnx simplifies this topology by discarding non-intersection/dead-end nodes while retaining the complete true edge geometry as an edge attribute. When multiple OpenStreetMap ways are merged into a single graph edge, the ways’ attribute values can be aggregated into a single value.

Intersection consolidation is important because many real-world street networks feature complex intersections and traffic circles, resulting in a cluster of graph nodes where there is really just one true intersection as we would think of it in transportation or urban design. Similarly, divided roads are often represented by separate centerline edges: the intersection of two divided roads thus creates 4 nodes, representing where each edge intersects a perpendicular edge, but these 4 nodes represent a single intersection in the real world. OSMnx can consolidate such complex intersections into a single node and optionally rebuild the graph’s edge topology accordingly. When multiple OpenStreetMap nodes are merged into a single graph node, the nodes’ attribute values can be aggregated into a single value.

Read more about the simplification module in the User Reference.

### Model Attributes

An OSMnx model has some standard required attributes, plus some optional attributes. The latter are sometimes present based on the source OSM data’s tagging, the `settings` module configuration, and any processing you may have done to add additional attributes (as noted in various functions’ documentation).

As a NetworkX MultiDiGraph object, it has top-level `graph`, `nodes`, and `edges` attributes. The `graph` attribute dictionary must contain a “crs” key defining its coordinate reference system. The `nodes` are identified by OSM ID and each must contain a `data` attribute dictionary that must have “x” and “y” keys defining its coordinates and a “street_count” key defining how many physical streets are incident to it. The `edges` are identified by a 3-tuple of “u” (source node ID), “v” (target node ID), and “key” (to differentiate parallel edges), and each must contain a `data` attribute dictionary that must have an “osmid” key defining its OSM ID and a “length” key defining its length in meters.

The OSMnx `graph` module automatically creates MultiDiGraphs with these required attributes, plus additional optional attributes based on the `settings` module configuration. If you instead manually create your own graph model, make sure it has these required attributes at a minimum.

### Convert, Project, Save

OSMnx’s `convert` module can convert a MultiDiGraph to a DiGraph if you prefer a directed representation of the network without any parallel edges, or to a MultiGraph if you need an undirected representation for use with functions or algorithms that only accept a MultiGraph object. If you just want a fully bidirectional graph (such as for a walking network), just configure the `settings` module’s `bidirectional_network_types` before creating your graph.

The `convert` module can also convert a MultiDiGraph to/from GeoPandas node and edge GeoDataFrames. The nodes GeoDataFrame is indexed by OSM ID and the edges GeoDataFrame is multi-indexed by `u, v, key` just like a NetworkX edge. This allows you to load arbitrary node/edge ShapeFiles or GeoPackage layers as GeoDataFrames then model them as a MultiDiGraph for graph analysis. The `convert` module exposes validation functions to verify that your MultiDiGraph or GeoDataFrames satisfy OSMnx requirements. Read more about the convert module in the User Reference.

You can easily project your graph to different coordinate reference systems using the `projection` module. If you’re unsure which CRS you want to project to, OSMnx can automatically determine an appropriate UTM CRS for you. Read more about the projection module in the User Reference.

Using the `io` module, you can save your graph to disk as a GraphML file (to load into other network analysis software), a GeoPackage (to load into other GIS software), or an OSM XML file. Use the GraphML format whenever saving a graph for later work with OSMnx. Read more about the io module in the User Reference.

### Network Statistics

You can use the `stats` module to calculate a variety of geometric and topological measures as well as street network bearing and orientation statistics. These measures define streets as the edges in an undirected representation of the graph to prevent double-counting bidirectional edges of a two-way street. You can easily generate common stats in transportation studies, urban design, and network science, including intersection density, circuity, average node degree (connectedness), betweenness centrality, and much more. Read more about the stats module in the User Reference.

You can also use NetworkX directly to calculate additional topological network measures.

### Working with Elevation

The `elevation` module lets you automatically attach elevations to the graph’s nodes from a local raster file or the Google Maps Elevation API (or equivalent web API with a compatible interface). You can also calculate edge grades (i.e., rise-over-run) and analyze the steepness of certain streets or routes.

Read more about the elevation module in the User Reference.

### Routing

The `distance` module can find the nearest node(s) or edge(s) to coordinates using a fast spatial index. The `routing` module can solve shortest paths for network routing, parallelized with multiprocessing, using different weights (e.g., distance, travel time, elevation change, etc). It can also impute missing speeds to the graph edges. This imputation can obviously be imprecise, so the user can override it by passing in arguments that define local speed limits. It can also calculate free-flow travel times for each edge.

Read more about the distance and routing modules in the User Reference.

### Visualization

You can plot graphs, routes, network figure-ground diagrams, building footprints, and street network orientation rose diagrams (aka, polar histograms) with the `plot` module. You can also explore street networks, routes, or geospatial features as interactive Folium web maps.

Read more about the plot module in the User Reference.

### Usage Limits

Be a good neighbor! OSMnx works with Overpass’s rate limiting to avoid overwhelming their resources. Don’t run multiple/parallel OSMnx instances simultaneously to circumvent their limits. These APIs are free to use, but they’re not free to operate. If you will make many queries (e.g., more than 1k/day), you need to host your own local Overpass instance. Refer to the Nominatim Usage Policy and Overpass Commons documentation for API usage limits and restrictions to which you must adhere. If you configure OSMnx to use an alternative API instance, ensure you understand and follow their policies. If you feel you need to exceed these limits, just install your own hosted instance and set OSMnx to use it.

## More Info

All of this functionality is demonstrated step-by-step in the OSMnx Examples Gallery, and usage is detailed in the User Reference. Feature development details are in the Changelog. Consult the Further Reading resources for additional technical details and research.

## Frequently Asked Questions

How do I install OSMnx? Follow the Installation guide.

How do I use OSMnx? Check out the step-by-step tutorials in the OSMnx Examples Gallery.

How does this or that function work? Consult the User Reference.

What can I do with OSMnx? Check out recent projects that use OSMnx.

I have a usage question. Please ask it on StackOverflow.

            On this page

- Getting Started

- Get Started in 4 Steps

- Introducing OSMnx

- Overview

- Configuration

- Geocoding and Querying

- Urban Amenities

- Modeling a Network

- Topology Clean-Up

- Model Attributes

- Convert, Project, Save

- Network Statistics

- Working with Elevation

- Routing

- Visualization

- Usage Limits

- More Info

- Frequently Asked Questions


---

Source: https://osmnx.readthedocs.io/en/stable/user-reference.html (osmnx.plot module omitted)

role="main" id="furo-main-content">

# User Reference

This is the User Reference for the OSMnx package. If you are looking for an introduction to OSMnx, read the Getting Started guide. This guide describes the usage of OSMnx’s public API.

## osmnx.bearing module

Calculate graph edge bearings and orientation entropy.

osmnx.bearing.add_edge_bearings(G)[source]

Calculate and add compass bearing attributes to all graph edges.

Vectorized function to calculate (initial) bearing from origin node to
destination node for each edge in a directed, unprojected graph then add
these bearings as new bearing edge attributes. Bearing represents angle
in degrees (clockwise) between north and the geodesic line from the origin
node to the destination node. Ignores self-loop edges as their bearings
are undefined.

Parameters:

G (`MultiDiGraph`) – Unprojected graph.

Returns:

G – Graph with bearing attributes on the edges.

Return type:

networkx.MultiDiGraph

osmnx.bearing.calculate_bearing(lat1, lon1, lat2, lon2)[source]

Calculate the compass bearing(s) between pairs of lat-lon points.

Overloads:

-
lat1 (float), lon1 (float), lat2 (float), lon2 (float) → float

-
lat1 (npt.NDArray[np.float64]), lon1 (npt.NDArray[np.float64]), lat2 (npt.NDArray[np.float64]), lon2 (npt.NDArray[np.float64]) → npt.NDArray[np.float64]

Parameters:

-
lat1 (float | npt.NDArray[np.float64])

-
lon1 (float | npt.NDArray[np.float64])

-
lat2 (float | npt.NDArray[np.float64])

-
lon2 (float | npt.NDArray[np.float64])

Return type:

float | npt.NDArray[np.float64]

Vectorized function to calculate initial bearings between two points’
coordinates or between arrays of points’ coordinates. Expects coordinates
in decimal degrees. The bearing represents the clockwise angle in degrees
between north and the geodesic line from (lat1, lon1) to (lat2, lon2).

Parameters:

-
lat1 (float | npt.NDArray[np.float64]) – First point’s latitude coordinate(s).

-
lon1 (float | npt.NDArray[np.float64]) – First point’s longitude coordinate(s).

-
lat2 (float | npt.NDArray[np.float64]) – Second point’s latitude coordinate(s).

-
lon2 (float | npt.NDArray[np.float64]) – Second point’s longitude coordinate(s).

Returns:

bearing – The bearing(s) in decimal degrees.

Return type:

float | npt.NDArray[np.float64]

osmnx.bearing.orientation_entropy(G, *, num_bins=36, min_length=0, weight=None)[source]

Calculate graph’s orientation entropy.

Orientation entropy is the Shannon entropy of the graphs’ edges’ bearings
across evenly spaced bins. Ignores self-loop edges as their bearings are
undefined. If G is a MultiGraph, all edge bearings will be bidirectional
(ie, two reciprocal bearings per undirected edge). If G is a
MultiDiGraph, all edge bearings will be directional (ie, one bearing per
directed edge).

For more info see: Boeing, G. 2019. “Urban Spatial Order: Street Network
Orientation, Configuration, and Entropy.” Applied Network Science, 4 (1),
67. https://doi.org/10.1007/s41109-019-0189-1

Parameters:

-
G (nx.MultiGraph | nx.MultiDiGraph) – Unprojected graph with bearing attributes on each edge.

-
num_bins (int) – Number of bins. For example, if num_bins=36 is provided, then each
bin will represent 10 degrees around the compass.

-
min_length (float) – Ignore edges with “length” attributes less than min_length. Useful
to ignore the noise of many very short edges.

-
weight (str | None) – If None, apply equal weight for each bearing. Otherwise, weight edges’
bearings by this (non-null) edge attribute. For example, if “length”
is provided, each edge’s bearing observation will be weighted by its
“length” attribute value.

Returns:

entropy – The orientation entropy of G.

Return type:

float

## osmnx.convert module

Convert spatial graphs to/from different data types.

osmnx.convert.graph_from_gdfs(gdf_nodes, gdf_edges, *, graph_attrs=None)[source]

Convert node and edge GeoDataFrames to a MultiDiGraph.

This function is the inverse of graph_to_gdfs and is designed to work in
conjunction with it. However, you can convert arbitrary node and edge
GeoDataFrames as long as 1) gdf_nodes is uniquely indexed by osmid, 2)
gdf_nodes contains x and y coordinate columns representing node
geometries, 3) gdf_edges is uniquely multi-indexed by (u, v, key)
(following normal MultiDiGraph structure). This allows you to load any
node/edge Shapefiles or GeoPackage layers as GeoDataFrames then convert
them to a MultiDiGraph for network analysis.

Note that any geometry attribute on gdf_nodes is discarded, since x
and y provide the necessary node geometry information instead.

Parameters:

-
gdf_nodes (`GeoDataFrame`) – GeoDataFrame of graph nodes uniquely indexed by osmid.

-
gdf_edges (`GeoDataFrame`) – GeoDataFrame of graph edges uniquely multi-indexed by (u, v, key).

-
graph_attrs (`dict`[`str`, `Any`] | `None`) – The new G.graph attribute dictionary. If None, use gdf_edges’s CRS
as the only graph-level attribute (gdf_edges must have its crs
attribute set).

Returns:

G – The converted MultiDiGraph.

Return type:

networkx.MultiDiGraph

osmnx.convert.graph_to_gdfs(G, *, nodes=True, edges=True, node_geometry=True, fill_edge_geometry=True)[source]

Convert a MultiGraph or MultiDiGraph to node and/or edge GeoDataFrames.

Overloads:

-
G (nx.MultiGraph | nx.MultiDiGraph), node_geometry (bool), fill_edge_geometry (bool) → tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]

-
G (nx.MultiGraph | nx.MultiDiGraph), nodes (Literal[True]), edges (Literal[True]), node_geometry (bool), fill_edge_geometry (bool) → tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]

-
G (nx.MultiGraph | nx.MultiDiGraph), nodes (Literal[True]), edges (Literal[False]), node_geometry (bool), fill_edge_geometry (bool) → gpd.GeoDataFrame

-
G (nx.MultiGraph | nx.MultiDiGraph), nodes (Literal[False]), edges (Literal[True]), node_geometry (bool), fill_edge_geometry (bool) → gpd.GeoDataFrame

-
G (nx.MultiGraph | nx.MultiDiGraph), edges (Literal[True]), node_geometry (bool), fill_edge_geometry (bool) → tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]

-
G (nx.MultiGraph | nx.MultiDiGraph), edges (Literal[False]), node_geometry (bool), fill_edge_geometry (bool) → gpd.GeoDataFrame

-
G (nx.MultiGraph | nx.MultiDiGraph), nodes (Literal[True]), edges (bool), node_geometry (bool), fill_edge_geometry (bool) → tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]

-
G (nx.MultiGraph | nx.MultiDiGraph), nodes (Literal[False]), edges (bool), node_geometry (bool), fill_edge_geometry (bool) → gpd.GeoDataFrame

Parameters:

-
G (nx.MultiGraph | nx.MultiDiGraph)

-
nodes (bool)

-
edges (bool)

-
node_geometry (bool)

-
fill_edge_geometry (bool)

Return type:

gpd.GeoDataFrame | tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]

This function is the inverse of graph_from_gdfs.

Parameters:

-
G (nx.MultiGraph | nx.MultiDiGraph) – Input graph.

-
nodes (bool) – If True, convert graph nodes to a GeoDataFrame and return it.

-
edges (bool) – If True, convert graph edges to a GeoDataFrame and return it.

-
node_geometry (bool) – If True, create a geometry column from node “x” and “y” attributes.

-
fill_edge_geometry (bool) – If True, fill missing edge geometry fields using endpoint nodes’
coordinates to create a LineString.

Returns:

gdf_nodes or gdf_edges or (gdf_nodes, gdf_edges) – gdf_nodes is indexed by osmid and gdf_edges is multi-indexed by
(u, v, key) following normal MultiGraph/MultiDiGraph structure.

Return type:

gpd.GeoDataFrame | tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]

osmnx.convert.to_digraph(G, *, weight='length')[source]

Convert MultiDiGraph to DiGraph.

Chooses between parallel edges by minimizing weight attribute value. See
also to_undirected to convert MultiDiGraph to MultiGraph.

Parameters:

-
G (`MultiDiGraph`) – Input graph.

-
weight (`str`) – Attribute value to minimize when choosing between parallel edges.

Returns:

D – The converted DiGraph.

Return type:

networkx.DiGraph

osmnx.convert.to_undirected(G)[source]

Convert MultiDiGraph to undirected MultiGraph.

This function has a limited use case: it allows you to create a MultiGraph
for use with functions/algorithms that only accept a MultiGraph object.
Rather, if you want a fully bidirectional graph (such as for a walking
network), configure the settings module’s bidirectional_network_types
before creating your graph to generate a fully bidirectional MultiDiGraph.

This function maintains parallel edges only if their geometries differ.
See also to_digraph to convert MultiDiGraph to DiGraph.

Parameters:

G (`MultiDiGraph`) – Input graph.

Returns:

Gu – The converted MultiGraph.

Return type:

networkx.MultiGraph

osmnx.convert.validate_features_gdf(gdf)[source]

Validate that features GeoDataFrame satisfies OSMnx expectations.

Raises a ValidationError if validation fails.

Parameters:

gdf (`GeoDataFrame`) – GeoDataFrame of features uniquely multi-indexed by
(element_type, osmid).

Return type:

`None`

osmnx.convert.validate_graph(G, *, strict=True)[source]

Validate that a graph object satisfies OSMnx expectations.

Raises ox._errors.GraphValidationError if validation fails.

Parameters:

-
G (`MultiDiGraph`) – The input graph.

-
strict (`bool`) – If True, enforce optional rules in addition to required rules. These
optional rules primarily enforce expected attribute data types.

Return type:

`None`

osmnx.convert.validate_node_edge_gdfs(gdf_nodes, gdf_edges, *, strict=True)[source]

Validate that node/edge GeoDataFrames can be converted to a MultiDiGraph.

Raises a ValidationError if validation fails.

Parameters:

-
gdf_nodes (`GeoDataFrame`) – GeoDataFrame of graph nodes uniquely indexed by osmid.

-
gdf_edges (`GeoDataFrame`) – GeoDataFrame of graph edges uniquely multi-indexed by (u, v, key).

-
strict (`bool`) – If True, elevate warnings to errors.

Return type:

`None`

## osmnx.distance module

Calculate distances and find nearest graph node/edge(s) to point(s).

osmnx.distance.add_edge_lengths(G, *, edges=None)[source]

Calculate and add length attribute (in meters) to each edge.

Vectorized function to calculate great-circle distance between each edge’s
incident nodes. Ensure graph is unprojected and unsimplified to calculate
accurate distances.

Note: this function is run by all the graph.graph_from_x functions
automatically to add length attributes to all edges. It calculates edge
lengths as the great-circle distance from node u to node v. When
OSMnx automatically runs this function upon graph creation, it does it
before simplifying the graph: thus it calculates the straight-line lengths
of edge segments that are themselves all straight. Only after
simplification do edges take on (potentially) curvilinear geometry. If you
wish to calculate edge lengths later, note that you will be calculating
straight-line distances which necessarily ignore the curvilinear geometry.
Thus you only want to run this function on a graph with all straight edges
(such as is the case with an unsimplified graph).

Parameters:

-
G (`MultiDiGraph`) – Unprojected and unsimplified input graph.

-
edges (`Iterable`[`tuple`[`int`, `int`, `int`]] | `None`) – The subset of edges to add length attributes to, as (u, v, k)
tuples. If None, add lengths to all edges.

Returns:

G – Graph with length attributes on the edges.

Return type:

networkx.MultiDiGraph

osmnx.distance.euclidean(y1, x1, y2, x2)[source]

Calculate Euclidean distances between pairs of points.

Overloads:

-
y1 (float), x1 (float), y2 (float), x2 (float) → float

-
y1 (npt.NDArray[np.float64]), x1 (npt.NDArray[np.float64]), y2 (npt.NDArray[np.float64]), x2 (npt.NDArray[np.float64]) → npt.NDArray[np.float64]

Parameters:

-
y1 (float | npt.NDArray[np.float64])

-
x1 (float | npt.NDArray[np.float64])

-
y2 (float | npt.NDArray[np.float64])

-
x2 (float | npt.NDArray[np.float64])

Return type:

float | npt.NDArray[np.float64]

Vectorized function to calculate the Euclidean distance between two
points’ coordinates or between arrays of points’ coordinates. For accurate
results, use projected coordinates rather than decimal degrees.

Parameters:

-
y1 (float | npt.NDArray[np.float64]) – First point’s y coordinate(s).

-
x1 (float | npt.NDArray[np.float64]) – First point’s x coordinate(s).

-
y2 (float | npt.NDArray[np.float64]) – Second point’s y coordinate(s).

-
x2 (float | npt.NDArray[np.float64]) – Second point’s x coordinate(s).

Returns:

dist – Distance from each (x1, y1) point to each (x2, y2) point in same
units as the points’ coordinates.

Return type:

float | npt.NDArray[np.float64]

osmnx.distance.great_circle(lat1, lon1, lat2, lon2, earth_radius=6371009)[source]

Calculate great-circle distances between pairs of points.

Overloads:

-
lat1 (float), lon1 (float), lat2 (float), lon2 (float) → float

-
lat1 (float), lon1 (float), lat2 (float), lon2 (float), earth_radius (float) → float

-
lat1 (npt.NDArray[np.float64]), lon1 (npt.NDArray[np.float64]), lat2 (npt.NDArray[np.float64]), lon2 (npt.NDArray[np.float64]) → npt.NDArray[np.float64]

-
lat1 (npt.NDArray[np.float64]), lon1 (npt.NDArray[np.float64]), lat2 (npt.NDArray[np.float64]), lon2 (npt.NDArray[np.float64]), earth_radius (float) → npt.NDArray[np.float64]

Parameters:

-
lat1 (float | npt.NDArray[np.float64])

-
lon1 (float | npt.NDArray[np.float64])

-
lat2 (float | npt.NDArray[np.float64])

-
lon2 (float | npt.NDArray[np.float64])

-
earth_radius (float)

Return type:

float | npt.NDArray[np.float64]

Vectorized function to calculate the great-circle distance between two
points’ coordinates or between arrays of points’ coordinates using the
haversine formula. Expects coordinates in decimal degrees.

Parameters:

-
lat1 (float | npt.NDArray[np.float64]) – First point’s latitude coordinate(s).

-
lon1 (float | npt.NDArray[np.float64]) – First point’s longitude coordinate(s).

-
lat2 (float | npt.NDArray[np.float64]) – Second point’s latitude coordinate(s).

-
lon2 (float | npt.NDArray[np.float64]) – Second point’s longitude coordinate(s).

-
earth_radius (float) – Earth’s radius in units in which distance will be returned (default
represents meters).

Returns:

dist – Distance from each (lat1, lon1) point to each (lat2, lon2) point
in units of earth_radius.

Return type:

float | npt.NDArray[np.float64]

osmnx.distance.nearest_edges(G, X, Y, *, return_dist=False)[source]

Find the nearest edge to a point or to each of several points.

Overloads:

-
G (nx.MultiDiGraph), X (float), Y (float) → tuple[int, int, int]

-
G (nx.MultiDiGraph), X (float), Y (float), return_dist (Literal[False]) → tuple[int, int, int]

-
G (nx.MultiDiGraph), X (float), Y (float), return_dist (Literal[True]) → tuple[tuple[int, int, int], float]

-
G (nx.MultiDiGraph), X (Iterable[float]), Y (Iterable[float]) → npt.NDArray[np.int64]

-
G (nx.MultiDiGraph), X (Iterable[float]), Y (Iterable[float]), return_dist (Literal[False]) → npt.NDArray[np.int64]

-
G (nx.MultiDiGraph), X (Iterable[float]), Y (Iterable[float]), return_dist (Literal[True]) → tuple[npt.NDArray[np.int64], npt.NDArray[np.float64]]

Parameters:

-
G (nx.MultiDiGraph)

-
X (float | Iterable[float])

-
Y (float | Iterable[float])

-
return_dist (bool)

Return type:

tuple[int, int, int] | npt.NDArray[np.int64] | tuple[tuple[int, int, int], float] | tuple[npt.NDArray[np.int64], npt.NDArray[np.float64]]

If X and Y are single coordinate values, this function will return the
nearest edge to that point. If X and Y are iterables of coordinate
values, it will return the nearest edge to each point.

This function is vectorized: if you have many points to search for, pass
them in one call as numpy arrays (avoid using loops) to maximize runtime
speed. It uses an R-tree spatial index and minimizes the Euclidean
distance from each point to the possible matches. For accurate results,
use a projected graph and projected points.

Parameters:

-
G (nx.MultiDiGraph) – Graph in which to find nearest edges.

-
X (float | Iterable[float]) – The points’ x (longitude) coordinates, in same CRS/units as graph and
containing no nulls.

-
Y (float | Iterable[float]) – The points’ y (latitude) coordinates, in same CRS/units as graph and
containing no nulls.

-
return_dist (bool) – If True, optionally also return the distance(s) between point(s) and
nearest edge(s), in same units as graph and points.

Returns:

ne or (ne, dist) – Nearest edge ID(s) as (u, v, k) tuples, or optionally a tuple of
ID(s) and distance(s) between each point and its nearest edge.

Return type:

tuple[int, int, int] | npt.NDArray[np.int64] | tuple[tuple[int, int, int], float] | tuple[npt.NDArray[np.int64], npt.NDArray[np.float64]]

osmnx.distance.nearest_nodes(G, X, Y, *, return_dist=False)[source]

Find the nearest node to a point or to each of several points.

Overloads:

-
G (nx.MultiDiGraph), X (float), Y (float) → int

-
G (nx.MultiDiGraph), X (float), Y (float), return_dist (Literal[False]) → int

-
G (nx.MultiDiGraph), X (float), Y (float), return_dist (Literal[True]) → tuple[npt.NDArray[np.int64], npt.NDArray[np.float64]]

-
G (nx.MultiDiGraph), X (Iterable[float]), Y (Iterable[float]) → npt.NDArray[np.int64]

-
G (nx.MultiDiGraph), X (Iterable[float]), Y (Iterable[float]), return_dist (Literal[False]) → npt.NDArray[np.int64]

-
G (nx.MultiDiGraph), X (Iterable[float]), Y (Iterable[float]), return_dist (Literal[True]) → tuple[npt.NDArray[np.int64], npt.NDArray[np.float64]]

Parameters:

-
G (nx.MultiDiGraph)

-
X (float | Iterable[float])

-
Y (float | Iterable[float])

-
return_dist (bool)

Return type:

int | npt.NDArray[np.int64] | tuple[int, float] | tuple[npt.NDArray[np.int64], npt.NDArray[np.float64]]

If X and Y are single coordinate values, this function will return the
nearest node to that point. If X and Y are iterables of coordinate
values, it will return the nearest node to each point.

This function is vectorized: if you have many points to search for, pass
them in one call as numpy arrays (avoid using loops) to maximize runtime
speed. If the graph is projected, it uses a k-d tree for Euclidean nearest
neighbor search, which requires that scipy is installed as an optional
dependency. If the graph is unprojected, it uses a ball tree for haversine
nearest neighbor search, which requires that scikit-learn is installed as
an optional dependency.

Parameters:

-
G (nx.MultiDiGraph) – Graph in which to find nearest nodes.

-
X (float | Iterable[float]) – The points’ x (longitude) coordinates, in same CRS/units as graph and
containing no nulls.

-
Y (float | Iterable[float]) – The points’ y (latitude) coordinates, in same CRS/units as graph and
containing no nulls.

-
return_dist (bool) – If True, optionally also return the distance(s) between point(s) and
nearest node(s).

Returns:

nn or (nn, dist) – Nearest node ID(s) or optionally a tuple of ID(s) and distance(s)
between each point and its nearest node.

Return type:

int | npt.NDArray[np.int64] | tuple[int, float] | tuple[npt.NDArray[np.int64], npt.NDArray[np.float64]]

## osmnx.elevation module

Add node elevations from raster files or web APIs, and calculate edge grades.

osmnx.elevation.add_edge_grades(G, *, add_absolute=True)[source]

Calculate and add grade attributes to all graph edges.

Vectorized function to calculate the directed grade (i.e., rise over run)
for each edge in the graph and add it to the edge as an attribute. Nodes
must already have elevation and length attributes before using this
function.

See also the add_node_elevations_raster and add_node_elevations_google
functions.

Parameters:

-
G (`MultiDiGraph`) – Graph with elevation node attributes.

-
add_absolute (`bool`) – If True, also add absolute value of grade as grade_abs attribute.

Returns:

G – Graph with grade (and optionally grade_abs) attributes on the
edges.

Return type:

networkx.MultiDiGraph

osmnx.elevation.add_node_elevations_google(G, *, api_key=None, batch_size=512, pause=0)[source]

Add elevation (meters) attributes to all nodes using a web API.

By default this uses the Google Maps Elevation API, but you could instead
use any equivalent API with the same interface and response format (such
as the Open Topo Data API or the Open-Elevation API) via the settings
module’s elevation_url_template. Adjust the batch_size and pause
arguments as needed for the provider. The Google Maps Elevation API
requires an API key but other providers may not. You can find more
information about the Google Maps Elevation API interface and format at:
https://developers.google.com/maps/documentation/elevation

For a free local alternative see the add_node_elevations_raster
function. See also the add_edge_grades function.

Parameters:

-
G (`MultiDiGraph`) – Graph to add elevation data to.

-
api_key (`str` | `None`) – A valid API key. Can be None if the API does not require a key.

-
batch_size (`int`) – Max number of coordinate pairs to submit in each request (depends on
provider’s limits). Google’s limit is 512.

-
pause (`float`) – How long to pause in seconds between API calls, which can be increased
if you get rate limited.

Returns:

G – Graph with elevation attributes on the nodes.

Return type:

networkx.MultiDiGraph

osmnx.elevation.add_node_elevations_raster(G, filepath, *, band=1, cpus=None)[source]

Add elevation attributes to all nodes from local raster file(s).

If filepath is an iterable of paths, this will generate a virtual raster
composed of the files at those paths as an intermediate step.

See also the add_edge_grades function.

Parameters:

-
G (`MultiDiGraph`) – Graph in same CRS as raster.

-
filepath (`str` | `Path` | `Iterable`[`str` | `Path`]) – The path(s) to the raster file(s) to query.

-
band (`int`) – Which raster band to query.

-
cpus (`int` | `None`) – How many CPU cores to use if multiprocessing. If None, use all
available. If you are multiprocessing, make sure you protect your
entry point: see the Python docs for details.

Returns:

G – Graph with elevation attributes on the nodes.

Return type:

networkx.MultiDiGraph

## osmnx.features module

Download and create GeoDataFrames from OpenStreetMap geospatial features.

Retrieve points of interest, building footprints, transit lines/stops, or any
other map features from OSM, including their geometries and attribute data,
then construct a GeoDataFrame of them. You can use this module to query for
nodes, ways, and relations (the latter of type “multipolygon” or “boundary”
only) by passing a dictionary of desired OSM tags.

For more details, see https://wiki.openstreetmap.org/wiki/Map_features and
https://wiki.openstreetmap.org/wiki/Elements

Refer to the Getting Started guide for usage limitations.

osmnx.features.features_from_address(address, tags, dist)[source]

Download OSM features within some distance of an address.

You can use the settings module to retrieve a snapshot of historical OSM
data as of a certain date, or to configure the Overpass server timeout,
memory allocation, and other custom settings. This function searches for
features using tags. For more details, see:
https://wiki.openstreetmap.org/wiki/Map_features

Parameters:

-
address (`str`) – The address to geocode and use as the center point around which to
retrieve the features.

-
tags (`dict`[`str`, `bool` | `str` | `list`[`str`]]) – Tags for finding elements in the selected area. Results are the union,
not intersection of the tags and each result matches at least one tag.
The keys are OSM tags (e.g. building, landuse, highway, etc) and
the values can be either True to retrieve all elements matching the
tag, or a string to retrieve a single tag:value combination, or a
list of strings to retrieve multiple values for the tag. For example,
tags = {‘building’: True} would return all buildings in the area.
Or, tags = {‘amenity’:True, ‘landuse’:[‘retail’,’commercial’],
‘highway’:’bus_stop’} would return all amenities, any landuse=retail,
any landuse=commercial, and any highway=bus_stop.

-
dist (`float`) – Distance in meters from address to create a bounding box to query.

Returns:

gdf – The features, multi-indexed by element type and OSM ID.

Return type:

geopandas.GeoDataFrame

osmnx.features.features_from_bbox(bbox, tags)[source]

Download OSM features within a lat-lon bounding box.

You can use the settings module to retrieve a snapshot of historical OSM
data as of a certain date, or to configure the Overpass server timeout,
memory allocation, and other custom settings. This function searches for
features using tags. For more details, see:
https://wiki.openstreetmap.org/wiki/Map_features

Parameters:

-
bbox (`tuple`[`float`, `float`, `float`, `float`]) – Bounding box as (left, bottom, right, top). Coordinates should be in
unprojected latitude-longitude degrees (EPSG:4326).

-
tags (`dict`[`str`, `bool` | `str` | `list`[`str`]]) – Tags for finding elements in the selected area. Results are the union,
not intersection of the tags and each result matches at least one tag.
The keys are OSM tags (e.g. building, landuse, highway, etc) and
the values can be either True to retrieve all elements matching the
tag, or a string to retrieve a single tag:value combination, or a
list of strings to retrieve multiple values for the tag. For example,
tags = {‘building’: True} would return all buildings in the area.
Or, tags = {‘amenity’:True, ‘landuse’:[‘retail’,’commercial’],
‘highway’:’bus_stop’} would return all amenities, any landuse=retail,
any landuse=commercial, and any highway=bus_stop.

Returns:

gdf – The features, multi-indexed by element type and OSM ID.

Return type:

geopandas.GeoDataFrame

osmnx.features.features_from_place(query, tags, *, which_result=None)[source]

Download OSM features within the boundaries of some place(s).

The query must be geocodable and OSM must have polygon boundaries for the
geocode result. If OSM does not have a polygon for this place, you can
instead get features within it using the features_from_address
function, which geocodes the place name to a point and gets the features
within some distance of that point.

If OSM does have polygon boundaries for this place but you’re not finding
it, try to vary the query string, pass in a structured query dict, or vary
the which_result argument to use a different geocode result. If you know
the OSM ID of the place, you can retrieve its boundary polygon using the
geocode_to_gdf function, then pass it to the features_from_polygon
function.

You can use the settings module to retrieve a snapshot of historical OSM
data as of a certain date, or to configure the Overpass server timeout,
memory allocation, and other custom settings. This function searches for
features using tags. For more details, see:
https://wiki.openstreetmap.org/wiki/Map_features

Parameters:

-
query (`str` | `dict`[`str`, `str`] | `list`[`str` | `dict`[`str`, `str`]]) – The query or queries to geocode to retrieve place boundary polygon(s).

-
tags (`dict`[`str`, `bool` | `str` | `list`[`str`]]) – Tags for finding elements in the selected area. Results are the union,
not intersection of the tags and each result matches at least one tag.
The keys are OSM tags (e.g. building, landuse, highway, etc) and
the values can be either True to retrieve all elements matching the
tag, or a string to retrieve a single tag:value combination, or a
list of strings to retrieve multiple values for the tag. For example,
tags = {‘building’: True} would return all buildings in the area.
Or, tags = {‘amenity’:True, ‘landuse’:[‘retail’,’commercial’],
‘highway’:’bus_stop’} would return all amenities, any landuse=retail,
any landuse=commercial, and any highway=bus_stop.

-
which_result (`int` | `None` | `list`[`int` | `None`]) – Which search result to return. If None, auto-select the first
(Multi)Polygon or raise an error if OSM doesn’t return one.

Returns:

gdf – The features, multi-indexed by element type and OSM ID.

Return type:

geopandas.GeoDataFrame

osmnx.features.features_from_point(center_point, tags, dist)[source]

Download OSM features within some distance of a lat-lon point.

You can use the settings module to retrieve a snapshot of historical OSM
data as of a certain date, or to configure the Overpass server timeout,
memory allocation, and other custom settings. This function searches for
features using tags. For more details, see:
https://wiki.openstreetmap.org/wiki/Map_features

Parameters:

-
center_point (`tuple`[`float`, `float`]) – The (lat, lon) center point around which to retrieve the features.
Coordinates should be in unprojected latitude-longitude degrees
(EPSG:4326).

-
tags (`dict`[`str`, `bool` | `str` | `list`[`str`]]) – Tags for finding elements in the selected area. Results are the union,
not intersection of the tags and each result matches at least one tag.
The keys are OSM tags (e.g. building, landuse, highway, etc) and
the values can be either True to retrieve all elements matching the
tag, or a string to retrieve a single tag:value combination, or a
list of strings to retrieve multiple values for the tag. For example,
tags = {‘building’: True} would return all buildings in the area.
Or, tags = {‘amenity’:True, ‘landuse’:[‘retail’,’commercial’],
‘highway’:’bus_stop’} would return all amenities, any landuse=retail,
any landuse=commercial, and any highway=bus_stop.

-
dist (`float`) – Distance in meters from center_point to create a bounding box to
query.

Returns:

gdf – The features, multi-indexed by element type and OSM ID.

Return type:

geopandas.GeoDataFrame

osmnx.features.features_from_polygon(polygon, tags)[source]

Download OSM features within the boundaries of a (Multi)Polygon.

You can use the settings module to retrieve a snapshot of historical OSM
data as of a certain date, or to configure the Overpass server timeout,
memory allocation, and other custom settings. This function searches for
features using tags. For more details, see:
https://wiki.openstreetmap.org/wiki/Map_features

Parameters:

-
polygon (Polygon | MultiPolygon) – The geometry within which to retrieve features. Coordinates should be
in unprojected latitude-longitude degrees (EPSG:4326).

-
tags (dict[str, bool | str | list[str]]) – Tags for finding elements in the selected area. Results are the union,
not intersection of the tags and each result matches at least one tag.
The keys are OSM tags (e.g. building, landuse, highway, etc) and
the values can be either True to retrieve all elements matching the
tag, or a string to retrieve a single tag:value combination, or a
list of strings to retrieve multiple values for the tag. For example,
tags = {‘building’: True} would return all buildings in the area.
Or, tags = {‘amenity’:True, ‘landuse’:[‘retail’,’commercial’],
‘highway’:’bus_stop’} would return all amenities, any landuse=retail,
any landuse=commercial, and any highway=bus_stop.

Returns:

gdf – The features, multi-indexed by element type and OSM ID.

Return type:

gpd.GeoDataFrame

osmnx.features.features_from_xml(filepath, *, polygon=None, tags=None, encoding='utf-8')[source]

Create a GeoDataFrame of OSM features from data in an OSM XML file.

Because this function creates a GeoDataFrame of features from an OSM XML
file that has already been downloaded (i.e., no query is made to the
Overpass API), the polygon and tags arguments are optional. If they
are None, filtering will be skipped.

Parameters:

-
filepath (str | Path) – Path to file containing OSM XML data.

-
polygon (Polygon | MultiPolygon | None) – Spatial boundaries to optionally filter the final GeoDataFrame.

-
tags (dict[str, bool | str | list[str]] | None) – Query tags to optionally filter the final GeoDataFrame.

-
encoding (str) – The OSM XML file’s character encoding.

Returns:

gdf – The features, multi-indexed by element type and OSM ID.

Return type:

gpd.GeoDataFrame

## osmnx.geocoder module

Geocode place names or addresses or retrieve OSM elements by place name or ID.

This module uses the Nominatim API’s “search” and “lookup” endpoints. For more
details see https://wiki.openstreetmap.org/wiki/Elements and
https://nominatim.org/.

osmnx.geocoder.geocode(query)[source]

Geocode place names or addresses to (lat, lon) with the Nominatim API.

This geocodes the query via the Nominatim “search” endpoint.

Parameters:

query (`str`) – The query string to geocode.

Returns:

point – The (lat, lon) coordinates returned by the geocoder.

Return type:

tuple[float, float]

osmnx.geocoder.geocode_to_gdf(query, *, which_result=None, by_osmid=False)[source]

Retrieve OSM elements by place name or OSM ID with the Nominatim API.

If searching by place name, the query argument can be a string or
structured dict, or a list of such strings/dicts to send to the geocoder.
This uses the Nominatim “search” endpoint to geocode the place name to the
best-matching OSM element, then returns that element and its attribute
data.

You can instead query by OSM ID by passing by_osmid=True. This uses the
Nominatim “lookup” endpoint to retrieve the OSM element with that ID. In
this case, the function treats the query argument as an OSM ID (or list
of OSM IDs), which must be prepended with their types: node (N), way (W),
or relation (R) in accordance with the Nominatim API format. For example,
query=[“R2192363”, “N240109189”, “W427818536”].

If query is a list, then which_result must be either an int or a list
with the same length as query. The queries you provide must be
resolvable to elements in the Nominatim database. The resulting
GeoDataFrame’s geometry column contains place boundaries if they exist.

Parameters:

-
query (`str` | `dict`[`str`, `str`] | `list`[`str` | `dict`[`str`, `str`]]) – The query string(s) or structured dict(s) to geocode.

-
which_result (`int` | `None` | `list`[`int` | `None`]) – Which search result to return. If None, auto-select the first
(Multi)Polygon or raise an error if OSM doesn’t return one. To get
the top match (sorted by importance) regardless of geometry type, set
which_result=1. Ignored if by_osmid=True.

-
by_osmid (`bool`) – If True, treat query as an OSM ID lookup rather than text search.

Returns:

gdf – GeoDataFrame with one row for each query result.

Return type:

geopandas.GeoDataFrame

## osmnx.graph module

Download and create graphs from OpenStreetMap data.

Refer to the Getting Started guide for usage limitations.

osmnx.graph.graph_from_address(address, dist, *, dist_type='bbox', network_type='all', simplify=True, retain_all=False, truncate_by_edge=False, custom_filter=None)[source]

Download and create a graph within some distance of an address.

This function uses filters to query the Overpass API: you can either
specify a pre-defined network_type or provide your own custom_filter
with Overpass QL.

Use the settings module’s useful_tags_node and useful_tags_way
settings to configure which OSM node/way tags are added as graph node/edge
attributes. If you want a fully bidirectional network, ensure your
network_type is in settings.bidirectional_network_types before
creating your graph. You can also use the settings module to retrieve a
snapshot of historical OSM data as of a certain date, or to configure the
Overpass server timeout, memory allocation, and other customizations.

Parameters:

-
address (`str`) – The address to geocode and use as the central point around which to
construct the graph.

-
dist (`float`) – Retain only those nodes within this many meters of center_point,
measuring distance according to dist_type.

-
dist_type (`str`) – {“network”, “bbox”}
If “bbox”, retain only those nodes within a bounding box of dist. If
“network”, retain only those nodes within dist network distance from
the centermost node.

-
network_type (`str`) – {“all”, “all_public”, “bike”, “drive”, “drive_service”, “walk”}
What type of street network to retrieve if custom_filter is None.

-
simplify (`bool`) – If True, simplify graph topology with the simplify_graph function.

-
retain_all (`bool`) – If True, return the entire graph even if it is not connected. If
False, retain only the largest weakly connected component.

-
truncate_by_edge (`bool`) – If True, retain nodes the outside bounding box if at least one of
the node’s neighbors lies within the bounding box.

-
custom_filter (`str` | `list`[`str`] | `None`) – A custom ways filter to be used instead of the network_type presets,
e.g. ‘[“power”~”line”]’ or ‘[“highway”~”motorway|trunk”]’. If str,
the intersection of keys/values will be used, e.g., ‘[maxspeed=50][lanes=2]’
will return all ways having both maxspeed of 50 and two lanes. If
list, the union of the list items will be used, e.g.,
[‘[maxspeed=50]’, ‘[lanes=2]’] will return all ways having either
maximum speed of 50 or two lanes. Also pass in a network_type that
is in settings.bidirectional_network_types if you want the graph to
be fully bidirectional.

Returns:

G – The resulting MultiDiGraph.

Return type:

networkx.MultiDiGraph

Notes

Very large query areas use the utils_geo._consolidate_subdivide_geometry
function to automatically make multiple requests: see that function’s
documentation for caveats.

osmnx.graph.graph_from_bbox(bbox, *, network_type='all', simplify=True, retain_all=False, truncate_by_edge=False, custom_filter=None)[source]

Download and create a graph within a lat-lon bounding box.

This function uses filters to query the Overpass API: you can either
specify a pre-defined network_type or provide your own custom_filter
with Overpass QL.

Use the settings module’s useful_tags_node and useful_tags_way
settings to configure which OSM node/way tags are added as graph node/edge
attributes. If you want a fully bidirectional network, ensure your
network_type is in settings.bidirectional_network_types before
creating your graph. You can also use the settings module to retrieve a
snapshot of historical OSM data as of a certain date, or to configure the
Overpass server timeout, memory allocation, and other customizations.

Parameters:

-
bbox (`tuple`[`float`, `float`, `float`, `float`]) – Bounding box as (left, bottom, right, top). Coordinates should be in
unprojected latitude-longitude degrees (EPSG:4326).

-
network_type (`str`) – {“all”, “all_public”, “bike”, “drive”, “drive_service”, “walk”}
What type of street network to retrieve if custom_filter is None.

-
simplify (`bool`) – If True, simplify graph topology via the simplify_graph function.

-
retain_all (`bool`) – If True, return the entire graph even if it is not connected. If
False, retain only the largest weakly connected component.

-
truncate_by_edge (`bool`) – If True, retain nodes the outside bounding box if at least one of
the node’s neighbors lies within the bounding box.

-
custom_filter (`str` | `list`[`str`] | `None`) – A custom ways filter to be used instead of the network_type presets,
e.g. ‘[“power”~”line”]’ or ‘[“highway”~”motorway|trunk”]’. If str,
the intersection of keys/values will be used, e.g., ‘[maxspeed=50][lanes=2]’
will return all ways having both maxspeed of 50 and two lanes. If
list, the union of the list items will be used, e.g.,
[‘[maxspeed=50]’, ‘[lanes=2]’] will return all ways having either
maximum speed of 50 or two lanes. Also pass in a network_type that
is in settings.bidirectional_network_types if you want the graph to
be fully bidirectional.

Returns:

G – The resulting MultiDiGraph.

Return type:

networkx.MultiDiGraph

Notes

Very large query areas use the utils_geo._consolidate_subdivide_geometry
function to automatically make multiple requests: see that function’s
documentation for caveats.

osmnx.graph.graph_from_place(query, *, network_type='all', simplify=True, retain_all=False, truncate_by_edge=False, which_result=None, custom_filter=None)[source]

Download and create a graph within the boundaries of some place(s).

The query must be geocodable and OSM must have polygon boundaries for the
geocode result. If OSM does not have a polygon for this place, you can
instead get its street network using the graph_from_address function,
which geocodes the place name to a point and gets the network within some
distance of that point.

If OSM does have polygon boundaries for this place but you’re not finding
it, try to vary the query string, pass in a structured query dict, or vary
the which_result argument to use a different geocode result. If you know
the OSM ID of the place, you can retrieve its boundary polygon using the
geocode_to_gdf function, then pass it to the features_from_polygon
function.

This function uses filters to query the Overpass API: you can either
specify a pre-defined network_type or provide your own custom_filter
with Overpass QL.

Use the settings module’s useful_tags_node and useful_tags_way
settings to configure which OSM node/way tags are added as graph node/edge
attributes. If you want a fully bidirectional network, ensure your
network_type is in settings.bidirectional_network_types before
creating your graph. You can also use the settings module to retrieve a
snapshot of historical OSM data as of a certain date, or to configure the
Overpass server timeout, memory allocation, and other customizations.

Parameters:

-
query (`str` | `dict`[`str`, `str`] | `list`[`str` | `dict`[`str`, `str`]]) – The query or queries to geocode to retrieve place boundary polygon(s).

-
network_type (`str`) – {“all”, “all_public”, “bike”, “drive”, “drive_service”, “walk”}
What type of street network to retrieve if custom_filter is None.

-
simplify (`bool`) – If True, simplify graph topology with the simplify_graph function.

-
retain_all (`bool`) – If True, return the entire graph even if it is not connected. If
False, retain only the largest weakly connected component.

-
truncate_by_edge (`bool`) – If True, retain nodes outside the place boundary polygon(s) if at
least one of the node’s neighbors lies within the polygon(s).

-
which_result (`int` | `None` | `list`[`int` | `None`]) – Which geocoding result to use. if None, auto-select the first
(Multi)Polygon or raise an error if OSM doesn’t return one.

-
custom_filter (`str` | `list`[`str`] | `None`) – A custom ways filter to be used instead of the network_type presets,
e.g. ‘[“power”~”line”]’ or ‘[“highway”~”motorway|trunk”]’. If str,
the intersection of keys/values will be used, e.g., ‘[maxspeed=50][lanes=2]’
will return all ways having both maxspeed of 50 and two lanes. If
list, the union of the list items will be used, e.g.,
[‘[maxspeed=50]’, ‘[lanes=2]’] will return all ways having either
maximum speed of 50 or two lanes. Also pass in a network_type that
is in settings.bidirectional_network_types if you want the graph to
be fully bidirectional.

Returns:

G – The resulting MultiDiGraph.

Return type:

networkx.MultiDiGraph

Notes

Very large query areas use the utils_geo._consolidate_subdivide_geometry
function to automatically make multiple requests: see that function’s
documentation for caveats.

osmnx.graph.graph_from_point(center_point, dist, *, dist_type='bbox', network_type='all', simplify=True, retain_all=False, truncate_by_edge=False, custom_filter=None)[source]

Download and create a graph within some distance of a lat-lon point.

This function uses filters to query the Overpass API: you can either
specify a pre-defined network_type or provide your own custom_filter
with Overpass QL.

Use the settings module’s useful_tags_node and useful_tags_way
settings to configure which OSM node/way tags are added as graph node/edge
attributes. If you want a fully bidirectional network, ensure your
network_type is in settings.bidirectional_network_types before
creating your graph. You can also use the settings module to retrieve a
snapshot of historical OSM data as of a certain date, or to configure the
Overpass server timeout, memory allocation, and other customizations.

Parameters:

-
center_point (`tuple`[`float`, `float`]) – The (lat, lon) center point around which to construct the graph.
Coordinates should be in unprojected latitude-longitude degrees
(EPSG:4326).

-
dist (`float`) – Retain only those nodes within this many meters of center_point,
measuring distance according to dist_type.

-
dist_type (`str`) – {“bbox”, “network”}
If “bbox”, retain only those nodes within a bounding box of dist
length/width. If “network”, retain only those nodes within dist
network distance of the nearest node to center_point.

-
network_type (`str`) – {“all”, “all_public”, “bike”, “drive”, “drive_service”, “walk”}
What type of street network to retrieve if custom_filter is None.

-
simplify (`bool`) – If True, simplify graph topology with the simplify_graph function.

-
retain_all (`bool`) – If True, return the entire graph even if it is not connected. If
False, retain only the largest weakly connected component.

-
truncate_by_edge (`bool`) – If True, retain nodes the outside bounding box if at least one of
the node’s neighbors lies within the bounding box.

-
custom_filter (`str` | `list`[`str`] | `None`) – A custom ways filter to be used instead of the network_type presets,
e.g. ‘[“power”~”line”]’ or ‘[“highway”~”motorway|trunk”]’. If str,
the intersection of keys/values will be used, e.g., ‘[maxspeed=50][lanes=2]’
will return all ways having both maxspeed of 50 and two lanes. If
list, the union of the list items will be used, e.g.,
[‘[maxspeed=50]’, ‘[lanes=2]’] will return all ways having either
maximum speed of 50 or two lanes. Also pass in a network_type that
is in settings.bidirectional_network_types if you want the graph to
be fully bidirectional.

Returns:

G – The resulting MultiDiGraph.

Return type:

networkx.MultiDiGraph

Notes

Very large query areas use the utils_geo._consolidate_subdivide_geometry
function to automatically make multiple requests: see that function’s
documentation for caveats.

osmnx.graph.graph_from_polygon(polygon, *, network_type='all', simplify=True, retain_all=False, truncate_by_edge=False, custom_filter=None)[source]

Download and create a graph within the boundaries of a (Multi)Polygon.

This function uses filters to query the Overpass API: you can either
specify a pre-defined network_type or provide your own custom_filter
with Overpass QL.

Use the settings module’s useful_tags_node and useful_tags_way
settings to configure which OSM node/way tags are added as graph node/edge
attributes. If you want a fully bidirectional network, ensure your
network_type is in settings.bidirectional_network_types before
creating your graph. You can also use the settings module to retrieve a
snapshot of historical OSM data as of a certain date, or to configure the
Overpass server timeout, memory allocation, and other customizations.

Parameters:

-
polygon (Polygon | MultiPolygon) – The geometry within which to construct the graph. Coordinates should
be in unprojected latitude-longitude degrees (EPSG:4326).

-
network_type (str) – {“all”, “all_public”, “bike”, “drive”, “drive_service”, “walk”}
What type of street network to retrieve if custom_filter is None.

-
simplify (bool) – If True, simplify graph topology with the simplify_graph function.

-
retain_all (bool) – If True, return the entire graph even if it is not connected. If
False, retain only the largest weakly connected component.

-
truncate_by_edge (bool) – If True, retain nodes outside polygon if at least one of the node’s
neighbors lies within polygon.

-
custom_filter (str | list[str] | None) – A custom ways filter to be used instead of the network_type presets,
e.g. ‘[“power”~”line”]’ or ‘[“highway”~”motorway|trunk”]’. If str,
the intersection of keys/values will be used, e.g., ‘[maxspeed=50][lanes=2]’
will return all ways having both maxspeed of 50 and two lanes. If
list, the union of the list items will be used, e.g.,
[‘[maxspeed=50]’, ‘[lanes=2]’] will return all ways having either
maximum speed of 50 or two lanes. Also pass in a network_type that
is in settings.bidirectional_network_types if you want the graph to
be fully bidirectional.

Returns:

G – The resulting MultiDiGraph.

Return type:

nx.MultiDiGraph

Notes

Very large query areas use the utils_geo._consolidate_subdivide_geometry
function to automatically make multiple requests: see that function’s
documentation for caveats.

osmnx.graph.graph_from_xml(filepath, *, bidirectional=False, simplify=True, retain_all=False, encoding='utf-8')[source]

Create a graph from data in an OSM XML file.

Do not load an XML file previously generated by OSMnx: this use case is
not supported and may not behave as expected. To save/load graphs to/from
disk for later use in OSMnx, use the io.save_graphml and
io.load_graphml functions instead.

Use the settings module’s useful_tags_node and useful_tags_way
settings to configure which OSM node/way tags are added as graph node/edge
attributes.

Parameters:

-
filepath (`str` | `Path`) – Path to file containing OSM XML data.

-
bidirectional (`bool`) – If True, create bidirectional edges for one-way streets.

-
simplify (`bool`) – If True, simplify graph topology with the simplify_graph function.

-
retain_all (`bool`) – If True, return the entire graph even if it is not connected. If
False, retain only the largest weakly connected component.

-
encoding (`str`) – The OSM XML file’s character encoding.

Returns:

G – The resulting MultiDiGraph.

Return type:

networkx.MultiDiGraph

## osmnx.io module

File I/O functions to save/load graphs to/from files on disk.

osmnx.io.load_graphml(filepath=None, *, graphml_str=None, node_dtypes=None, edge_dtypes=None, graph_dtypes=None)[source]

Load an OSMnx-saved GraphML file from disk or GraphML string.

This function converts node, edge, and graph-level attributes (serialized
as strings) to their appropriate data types. These can be customized as
needed by passing in dtypes arguments providing types or custom converter
functions. For example, if you want to convert some attribute’s values to
bool, consider using the built-in ox.io._convert_bool_string function
to properly handle “True”/”False” string literals as True/False booleans:
ox.load_graphml(fp, node_dtypes={my_attr: ox.io._convert_bool_string}).

If you manually configured the all_oneway=True setting, you may need to
manually specify here that edge oneway attributes should be type str.

Note that you must pass one and only one of filepath or graphml_str.
If passing graphml_str, you may need to decode the bytes read from your
file before converting to string to pass to this function.

Parameters:

-
filepath (`str` | `Path` | `None`) – Path to the GraphML file.

-
graphml_str (`str` | `None`) – Valid and decoded string representation of a GraphML file’s contents.

-
node_dtypes (`dict`[`str`, `Any`] | `None`) – Dict of node attribute names:types to convert values’ data types. The
type can be a type or a custom string converter function.

-
edge_dtypes (`dict`[`str`, `Any`] | `None`) – Dict of edge attribute names:types to convert values’ data types. The
type can be a type or a custom string converter function.

-
graph_dtypes (`dict`[`str`, `Any`] | `None`) – Dict of graph-level attribute names:types to convert values’ data
types. The type can be a type or a custom string converter function.

Returns:

G – The loaded MultiDiGraph.

Return type:

networkx.MultiDiGraph

osmnx.io.save_graph_geopackage(G, filepath=None, *, directed=False, encoding='utf-8')[source]

Save graph nodes and edges to disk as layers in a GeoPackage file.

Parameters:

-
G (`MultiDiGraph`) – The graph to save.

-
filepath (`str` | `Path` | `None`) – Path to the GeoPackage file including extension. If None, use default
settings.data_folder/graph.gpkg.

-
directed (`bool`) – If False, save one edge for each undirected edge in the graph but
retain original oneway and to/from information as edge attributes. If
True, save one edge for each directed edge in the graph.

-
encoding (`str`) – The character encoding of the saved GeoPackage file.

Return type:

`None`

osmnx.io.save_graph_xml(G, filepath=None, *, way_tag_aggs=None, encoding='utf-8')[source]

Save graph to disk as an OSM XML file.

This function exists only to allow serialization to the OSM XML format
for applications that require it, and has constraints to conform to that.
As such, it has a limited use case which does not include saving/loading
graphs for subsequent OSMnx analysis. To save/load graphs to/from disk for
later use in OSMnx, use the io.save_graphml and io.load_graphml
functions instead. To load a graph from an OSM XML file that you have
downloaded or generated elsewhere, use the graph.graph_from_xml
function.

Use the settings module’s useful_tags_node and useful_tags_way
settings to configure which tags your graph is created and saved with.
This function merges graph edges such that each OSM way has one entry in
the XML output, with the way’s nodes topologically sorted. G must be
unsimplified to save as OSM XML: otherwise, one edge could comprise
multiple OSM ways, making it impossible to group and sort edges in way.
G should also have been created with ox.settings.all_oneway=True for
this function to behave properly.

Parameters:

-
G (`MultiDiGraph`) – Unsimplified, unprojected graph to save as an OSM XML file.

-
filepath (`str` | `Path` | `None`) – Path to the saved file including extension. If None, use default
settings.data_folder/graph.osm.

-
way_tag_aggs (`dict`[`str`, `Any`] | `None`) – Keys are OSM way tag keys and values are aggregation functions
(anything accepted as an argument by pandas.agg). Allows user to
aggregate graph edge attribute values into single OSM way values. If
None, or if some tag’s key does not exist in the dict, the way
attribute will be assigned the value of the first edge of the way.

-
encoding (`str`) – The character encoding of the saved OSM XML file.

Return type:

`None`

osmnx.io.save_graphml(G, filepath=None, *, gephi=False, encoding='utf-8')[source]

Save graph to disk as GraphML file.

Parameters:

-
G (`MultiDiGraph`) – The graph to save as.

-
filepath (`str` | `Path` | `None`) – Path to the GraphML file including extension. If None, use default
settings.data_folder/graph.graphml.

-
gephi (`bool`) – If True, give each edge a unique key/id for compatibility with Gephi’s
interpretation of the GraphML specification.

-
encoding (`str`) – The character encoding of the saved GraphML file.

Return type:

`None`

## osmnx.plot module

[omitted by fetcher: plotting functions not needed]

## osmnx.projection module

Project a graph, GeoDataFrame, or geometry to a different CRS.

osmnx.projection.is_projected(crs)[source]

Determine if a coordinate reference system is projected or not.

Parameters:

crs (`Any`) – The identifier of the coordinate reference system. This can be
anything accepted by pyproj.CRS.from_user_input(), such as an
authority string or a WKT string.

Returns:

projected – True if crs is projected, otherwise False.

Return type:

bool

osmnx.projection.project_gdf(gdf, *, to_crs=None, to_latlong=False)[source]

Project a GeoDataFrame from its current CRS to another.

If to_latlong is True, this projects the GeoDataFrame to the coordinate
reference system defined by settings.default_crs. Otherwise it projects
it to the CRS defined by to_crs. If to_crs is None, it projects it
to the CRS of an appropriate UTM (or UPS) zone given gdf’s bounds.

Parameters:

-
gdf (`GeoDataFrame`) – The GeoDataFrame to be projected.

-
to_crs (`Any` | `None`) – If None, project to an appropriate UTM zone. Otherwise project to
this CRS.

-
to_latlong (`bool`) – If True, project to settings.default_crs and ignore to_crs.

Returns:

gdf_proj – The projected GeoDataFrame.

Return type:

geopandas.GeoDataFrame

osmnx.projection.project_geometry(geom, *, crs=None, to_crs=None, to_latlong=False)[source]

Project a Shapely geometry from its current CRS to another.

If to_latlong is True, this projects the geometry to the coordinate
reference system defined by settings.default_crs. Otherwise it projects
it to the CRS defined by to_crs. If to_crs is None, it projects it
to the CRS of an appropriate UTM (or UPS) zone given geometry’s bounds.

Parameters:

-
geom (`Geometry`) – The geometry to be projected.

-
crs (`Any` | `None`) – The initial CRS of geometry. If None, it will be set to
settings.default_crs.

-
to_crs (`Any` | `None`) – If None, project to an appropriate UTM zone. Otherwise project to this
CRS.

-
to_latlong (`bool`) – If True, project to settings.default_crs and ignore to_crs.

Returns:

geom_proj, crs – The projected geometry and its new CRS.

Return type:

tuple[shapely.Geometry, Any]

osmnx.projection.project_graph(G, *, to_crs=None, to_latlong=False)[source]

Project a graph from its current CRS to another.

If to_latlong is True, this projects the graph to the coordinate
reference system defined by settings.default_crs. Otherwise it projects
it to the CRS defined by to_crs. If to_crs is None, it projects it
to the CRS of an appropriate UTM (or UPS) zone given geometry’s bounds.

Parameters:

-
G (`MultiDiGraph`) – The graph to be projected.

-
to_crs (`Any` | `None`) – If None, project to an appropriate UTM zone. Otherwise project to
this CRS.

-
to_latlong (`bool`) – If True, project to settings.default_crs and ignore to_crs.

Returns:

G_proj – The projected graph.

Return type:

networkx.MultiDiGraph

## osmnx.routing module

Calculate edge speeds, travel times, and weighted shortest paths.

osmnx.routing.add_edge_speeds(G, *, hwy_speeds=None, fallback=None, agg=numpy.mean)[source]

Add edge speeds (km per hour) to graph as new speed_kph edge attributes.

By default, this imputes free-flow travel speeds for all edges via the
mean maxspeed value of the edges of each highway type. For highway types
in the graph that have no maxspeed value on any edge, it assigns the
mean of all maxspeed values in graph.

This default mean-imputation can obviously be imprecise, and the user can
override it by passing in hwy_speeds and/or fallback arguments that
correspond to local speed limit standards. The user can also specify a
different aggregation function (such as the median) to impute missing
values from the observed values.

If edge maxspeed attribute has “mph” in it, value will automatically be
converted from miles per hour to km per hour. Any other speed units should
be manually converted to km per hour prior to running this function,
otherwise there could be unexpected results. If “mph” does not appear in
the edge’s maxspeed attribute string, then function assumes kph, per OSM
guidelines: https://wiki.openstreetmap.org/wiki/Map_Features/Units

If you wish to set all edge speeds to a single constant value (such as for
a walking network), use nx.set_edge_attributes to set the speed_kph
attribute value directly, rather than using this function.

Parameters:

-
G (`MultiDiGraph`) – Input graph.

-
hwy_speeds (`dict`[`str`, `float`] | `None`) – Dict keys are OSM highway types and values are typical speeds (km per
hour) to assign to edges of that highway type for any edges missing
speed data. Any edges with highway type not in hwy_speeds will be
assigned the mean pre-existing speed value of all edges of that
highway type.

-
fallback (`float` | `None`) – Default speed value (km per hour) to assign to edges whose highway
type did not appear in hwy_speeds and had no pre-existing speed
attribute values on any edge.

-
agg (`Callable`[[`Any`], `Any`]) – Aggregation function to impute missing values from observed values.
The default is numpy.mean, but you might also consider for example
numpy.median, numpy.nanmedian, or your own custom function.

Returns:

G – Graph with speed_kph attributes on all edges.

Return type:

networkx.MultiDiGraph

osmnx.routing.add_edge_travel_times(G)[source]

Add edge travel time (seconds) to graph as new travel_time edge attributes.

Calculates free-flow travel time along each edge, based on length and
speed_kph attributes. Note: run add_edge_speeds first to generate the
speed_kph attribute. All edges must have length and speed_kph
attributes and all their values must be non-null.

Parameters:

G (`MultiDiGraph`) – Input graph.

Returns:

G – Graph with travel_time attributes on all edges.

Return type:

networkx.MultiDiGraph

osmnx.routing.k_shortest_paths(G, orig, dest, k, *, weight='length')[source]

Solve k shortest paths from an origin node to a destination node.

Uses Yen’s algorithm. See also shortest_path to solve just the one
shortest path.

Parameters:

-
G (`MultiDiGraph`) – Input graph.

-
orig (`int`) – Origin node ID.

-
dest (`int`) – Destination node ID.

-
k (`int`) – Number of shortest paths to solve.

-
weight (`str`) – Edge attribute to minimize when solving shortest paths.

Yields:

path – The node IDs constituting the next-shortest path.

Return type:

Iterator[list[int]]

osmnx.routing.route_to_gdf(G, route, *, weight='length')[source]

Return a GeoDataFrame of the edges in a path, in order.

Parameters:

-
G (`MultiDiGraph`) – Input graph.

-
route (`list`[`int`]) – Node IDs constituting the path.

-
weight (`str`) – Attribute value to minimize when choosing between parallel edges.

Returns:

gdf_edges – The ordered edges in the path.

Return type:

geopandas.GeoDataFrame

osmnx.routing.shortest_path(G, orig, dest, *, weight='length', cpus=1)[source]

Solve shortest path from origin node(s) to destination node(s).

Overloads:

-
G (nx.MultiDiGraph), orig (int), dest (int), weight (str), cpus (int | None) → list[int] | None

-
G (nx.MultiDiGraph), orig (int), dest (int), cpus (int | None) → list[int] | None

-
G (nx.MultiDiGraph), orig (int), dest (int), weight (str) → list[int] | None

-
G (nx.MultiDiGraph), orig (int), dest (int) → list[int] | None

-
G (nx.MultiDiGraph), orig (Iterable[int]), dest (Iterable[int]), weight (str), cpus (int | None) → list[list[int] | None]

-
G (nx.MultiDiGraph), orig (Iterable[int]), dest (Iterable[int]), cpus (int | None) → list[list[int] | None]

-
G (nx.MultiDiGraph), orig (Iterable[int]), dest (Iterable[int]), weight (str) → list[list[int] | None]

-
G (nx.MultiDiGraph), orig (Iterable[int]), dest (Iterable[int]) → list[list[int] | None]

Parameters:

-
G (networkx.MultiDiGraph)

-
orig (int | Iterable[int])

-
dest (int | Iterable[int])

-
weight (str)

-
cpus (int | None)

Return type:

list[int] | None | list[list[int] | None]

Uses Dijkstra’s algorithm. If orig and dest are single node IDs, this
will return a list of the nodes constituting the shortest path between
them. If orig and dest are lists of node IDs, this will return a list
of lists of the nodes constituting the shortest path between each
origin-destination pair. If a path cannot be solved, this will return None
for that path. You can parallelize solving multiple paths with the cpus
parameter, but be careful to not exceed your available RAM.

See also k_shortest_paths to solve multiple shortest paths between a
single origin and destination. For additional functionality or different
solver algorithms, use NetworkX directly.

Parameters:

-
G (`MultiDiGraph`) – Input graph.

-
orig (`int` | `Iterable`[`int`]) – Origin node ID(s).

-
dest (`int` | `Iterable`[`int`]) – Destination node ID(s).

-
weight (`str`) – Edge attribute to minimize when solving shortest path.

-
cpus (`int` | `None`) – How many CPU cores to use if multiprocessing. If None, use all
available. If you are multiprocessing, make sure you protect your
entry point: see the Python docs for details.

Returns:

path – The node IDs constituting the shortest path, or, if orig and dest
are both iterable, then a list of such paths.

Return type:

list[int] | None | list[list[int] | None]

## osmnx.settings module

Global settings that can be configured by the user.

all_onewaybool

Only use if subsequently saving graph to an OSM XML file via the
save_graph_xml function. If True, forces all ways to be added as one-way
ways, preserving the original order of the nodes in the OSM way. This also
retains the original OSM way’s oneway tag’s string value as edge attribute
values, rather than converting them to True/False bool values. Default is
False.

bidirectional_network_typeslist[str]

Network types for which a fully bidirectional graph will be created.
Default is [“walk”].

cache_folderstr | Path

Path to folder to save/load HTTP response cache files, if the use_cache
setting is True. Default is “./cache”.

cache_only_modebool

If True, download network data from Overpass then raise a
CacheOnlyModeInterrupt error for user to catch. This prevents graph
building from taking place and instead just saves Overpass response to
cache. Useful for sequentially caching lots of raw data (as you can
only query Overpass one request at a time) then using the local cache to
quickly build many graphs simultaneously with multiprocessing. Default is
False.

data_folderstr | Path

Path to folder to save/load graph files by default. Default is “./data”.

default_accessstr

Filter for the OSM “access” tag. Default is ‘[“access”!~”private”]’.
Note that also filtering out “access=no” ways prevents including
transit-only bridges (e.g., Tilikum Crossing) from appearing in drivable
road network (e.g., ‘[“access”!~”private|no”]’). However, some drivable
tollroads have “access=no” plus a “access:conditional” tag to clarify when
it is accessible, so we can’t filter out all “access=no” ways by default.
Best to be permissive here then remove complicated combinations of tags
programatically after the full graph is downloaded and constructed.

default_crsstr

Default coordinate reference system to set when creating graphs. Default
is “epsg:4326”.

doh_url_templatestr | None

Endpoint to resolve DNS-over-HTTPS if local DNS resolution fails. Set to
None to disable DoH, but see downloader._config_dns documentation for
caveats. Default is: “https://8.8.8.8/resolve?name={hostname}”

elevation_url_templatestr

Endpoint of the Google Maps Elevation API (or equivalent), containing
up to two parameters, in order: locations and key. Default is:
“https://maps.googleapis.com/maps/api/elevation/json?locations={locations}&key={key}”.
As alternative free examples, the Open Topo Data API would be:
“https://api.opentopodata.org/v1/aster30m?locations={locations}”
and the Open-Elevation API would be:
“https://api.open-elevation.com/api/v1/lookup?locations={locations}”.

http_accept_languagestr

HTTP header accept-language. Default is “en”. Note that Nominatim’s
default language is “en” and it may sort its results’ importance scores
differently if a different language is specified.

http_refererstr

HTTP header referer. Default is
“OSMnx Python package (https://github.com/gboeing/osmnx)”.

http_user_agentstr

HTTP header user-agent. Default is
“OSMnx Python package (https://github.com/gboeing/osmnx)”.

imgs_folderstr | Path

Path to folder in which to save plotted images by default. Default is
“./images”.

log_filebool

If True, save log output to a file in logs_folder. Default is False.

log_filenamestr

Name of the log file, without file extension. Default is “osmnx”.

log_consolebool

If True, print log output to the console (terminal window). Default is
False.

log_levelint

One of Python’s logger.level constants. Default is logging.INFO.

log_namestr

Name of the logger. Default is “OSMnx”.

logs_folderstr | Path

Path to folder in which to save log files. Default is “./logs”.

max_query_area_sizefloat

Maximum area for any part of the geometry in meters: any polygon bigger
than this will get divided up for multiple queries to the API. Default is
2500000000.

nominatim_keystr | None

Your Nominatim API key, if you are using an API instance that requires
one. Default is None.

nominatim_urlstr

The base API url to use for Nominatim queries. Default is
“https://nominatim.openstreetmap.org/”.

overpass_memoryint | None

Overpass server memory allocation size for the query, in bytes. If
None, server will choose its default allocation size. Use with caution.
Default is None.

overpass_rate_limitbool

If True, check the Overpass server status endpoint for how long to
pause before making request. Necessary if server uses slot management,
but can be set to False if you are running your own Overpass instance
without rate limiting. Default is True.

overpass_settingsstr

Settings string for Overpass queries. Default is
“[out:json][timeout:{timeout}]{maxsize}”. By default, the {timeout} and
{maxsize} values are set dynamically by OSMnx when used.
To query, for example, historical OSM data as of a certain date:
‘[out:json][timeout:90][date:”2019-10-28T19:20:00Z”]’. Use with caution.

overpass_urlstr

The base API url to use for Overpass queries. Default is
“https://overpass-api.de/api”.

requests_kwargsdict[str, Any]

Optional keyword args to pass to the requests package when connecting
to APIs, for example to configure authentication or provide a path to
a local certificate file. More info on options such as auth, cert,
verify, and proxies can be found in the requests package advanced docs.
Default is {}.

requests_timeoutint

The timeout interval in seconds for HTTP requests, and (when applicable)
for Overpass server to use for executing the query. Default is 180.

use_cachebool

If True, cache HTTP responses locally in cache_folder instead of calling
API repeatedly for the same request. Default is True.

useful_tags_nodelist[str]

OSM “node” tags to add as graph node attributes, when present in the data
retrieved from OSM. Default is [“highway”, “junction”, “railway”, “ref”].

useful_tags_waylist[str]

OSM “way” tags to add as graph edge attributes, when present in the data
retrieved from OSM. Default is [“access”, “area”, “bridge”, “est_width”,
“highway”, “junction”, “landuse”, “lanes”, “maxspeed”, “name”, “oneway”,
“ref”, “service”, “tunnel”, “width”].

## osmnx.simplification module

Simplify, correct, and consolidate spatial graph nodes and edges.

osmnx.simplification.consolidate_intersections(G, *, tolerance=10, rebuild_graph=True, max_length=None, dead_ends=False, reconnect_edges=True, node_attr_aggs=None)[source]

Consolidate intersections comprising clusters of nearby nodes.

This algorithm is described in the journal article: Boeing, G. 2025.
“Topological Graph Simplification Solutions to the Street Intersection
Miscount Problem.” Transactions in GIS, 29 (3), e70037.
https://doi.org/10.1111/tgis.70037

Merges nearby nodes and returns either their centroids or a rebuilt graph
with consolidated intersections and reconnected edge geometries. The
tolerance argument can be a single value applied to all nodes or
individual per-node values. It should be adjusted to approximately match
street design standards in the specific street network, and you should use
a projected graph to work in meaningful and consistent units like meters.
Note: tolerance represents a per-node buffering radius. For example, to
consolidate nodes within 10 meters of each other, use tolerance=5.

When rebuild_graph is False, it uses a purely geometric (and relatively
fast) algorithm to identify “geometrically close” nodes, merge them, and
return the merged intersections’ centroids. When rebuild_graph is True,
it uses a topological (and slower but more accurate) algorithm to identify
“topologically close” nodes, merge them, then rebuild/return the graph.
Returned graph’s node IDs represent clusters rather than “osmid” values.
Refer to nodes’ “osmid_original” attributes for original “osmid” values.
If multiple nodes were merged together, the “osmid_original” attribute is
a list of merged nodes’ “osmid” values.

Divided roads are often represented by separate centerline edges. The
intersection of two divided roads thus creates 4 nodes, representing where
each edge intersects a perpendicular edge. These 4 nodes represent a
single intersection in the real world. A similar situation occurs with
roundabouts and traffic circles. This function consolidates nearby nodes
by buffering them to an arbitrary distance, merging overlapping buffers,
and taking their centroid.

Parameters:

-
G (nx.MultiDiGraph) – A projected graph.

-
tolerance (float | dict[int, float]) – Nodes are buffered to this distance (in graph’s geometry’s units) and
subsequent overlaps are dissolved into a single node. If scalar, then
that single value will be used for all nodes. If dict (mapping node
IDs to individual values), then those values will be used per node and
any missing node IDs will not be buffered.

-
rebuild_graph (bool) – If True, consolidate the nodes topologically, rebuild the graph, and
return as MultiDiGraph. Otherwise, consolidate the nodes geometrically
and return the consolidated node points as GeoSeries.

-
max_length (float | None) – Ignore edges longer than this when determining whether nearby nodes
are topologically connected. If None, consider all edges. This
prevents long edges that loop outside an intersection, such as
cloverleaf ramps, from merging their nearby endpoint nodes.

-
dead_ends (bool) – If False, discard dead-end nodes to return only street intersection
points.

-
reconnect_edges (bool) – If True, reconnect edges (and their geometries) to the consolidated
nodes in rebuilt graph, and update the edge length attributes. If
False, the returned graph has no edges (which is faster if you just
need topologically consolidated intersection counts). Ignored if
rebuild_graph is not True.

-
node_attr_aggs (dict[str, Any] | None) – Allows user to aggregate node attributes values when merging nodes.
Keys are node attribute names and values are aggregation functions
(anything accepted as an argument by pandas.agg). Node attributes
not in node_attr_aggs will contain the unique values across the
merged nodes. If None, defaults to {“elevation”: numpy.mean}.

Returns:

Gc or gs – If rebuild_graph=True, returns MultiDiGraph with consolidated
intersections and (optionally) reconnected edge geometries. If
rebuild_graph=False, returns GeoSeries of Points representing the
centroids of street intersections.

Return type:

nx.MultiDiGraph | gpd.GeoSeries

osmnx.simplification.simplify_graph(G, *, node_attrs_include=None, edge_attrs_differ=None, remove_rings=True, track_merged=False, edge_attr_aggs=None)[source]

Simplify a graph’s topology by removing interstitial nodes.

This algorithm is described in the journal article: Boeing, G. 2025.
“Topological Graph Simplification Solutions to the Street Intersection
Miscount Problem.” Transactions in GIS, 29 (3), e70037.
https://doi.org/10.1111/tgis.70037

This simplifies the graph’s topology by removing all nodes that are not
intersections or dead-ends, by creating an edge directly between the end
points that encapsulate them while retaining the full geometry of the
original edges, saved as a new geometry attribute on the new edge.

Note that only simplified edges receive a geometry attribute. Some of
the resulting consolidated edges may comprise multiple OSM ways, and if
so, their unique attribute values are stored as a list. Optionally, the
simplified edges can receive a merged_edges attribute that contains a
list of all the (u, v) node pairs that were merged together.

Use the node_attrs_include or edge_attrs_differ parameters to relax
simplification strictness. For example, edge_attrs_differ=[“osmid”] will
retain every node whose incident edges have different OSM IDs. This lets
you keep nodes at elbow two-way intersections (but be aware that sometimes
individual blocks have multiple OSM IDs within them too). You could also
use this parameter to retain nodes where sidewalks or bike lanes begin/end
in the middle of a block. Or for example, node_attrs_include=[“highway”]
will retain every node with a “highway” attribute (regardless of its
value), even if it does not represent a street junction.

Parameters:

-
G (`MultiDiGraph`) – Input graph.

-
node_attrs_include (`Iterable`[`str`] | `None`) – Node attribute names for relaxing the strictness of endpoint
determination. A node is always an endpoint if it possesses one or
more of the attributes in node_attrs_include.

-
edge_attrs_differ (`Iterable`[`str`] | `None`) – Edge attribute names for relaxing the strictness of endpoint
determination. A node is always an endpoint if its incident edges have
different values than each other for any attribute in
edge_attrs_differ.

-
remove_rings (`bool`) – If True, remove any graph components that consist only of a single
chordless cycle (i.e., an isolated self-contained ring).

-
track_merged (`bool`) – If True, add merged_edges attribute on simplified edges, containing
a list of all the (u, v) node pairs that were merged together.

-
edge_attr_aggs (`dict`[`str`, `Any`] | `None`) – Allows user to aggregate edge segment attributes when simplifying an
edge. Keys are edge attribute names and values are aggregation
functions to apply to these attributes when they exist for a set of
edges being merged. Edge attributes not in edge_attr_aggs will
contain the unique values across the merged edge segments. If None,
defaults to {“length”: sum, “travel_time”: sum}.

Returns:

Gs – Topologically simplified graph, with a new geometry attribute on
each simplified edge.

Return type:

networkx.MultiDiGraph

## osmnx.stats module

Calculate geometric and topological network measures.

This module defines streets as the edges in an undirected representation of
the graph. Using undirected graph edges prevents double-counting bidirectional
edges of a two-way street, but may double-count a divided road’s separate
centerlines with different end point nodes. Due to OSMnx’s periphery cleaning
when the graph was created, you will get accurate node degrees (and in turn
streets-per-node counts) even at the periphery of the graph.

You can use NetworkX directly for additional topological network measures.

osmnx.stats.basic_stats(G, *, area=None, clean_int_tol=None)[source]

Calculate basic descriptive geometric and topological measures of a graph.

Density measures are only calculated if area is provided and clean
intersection measures are only calculated if clean_int_tol is provided.

Parameters:

-
G (`MultiDiGraph`) – Input graph.

-
area (`float` | `None`) – If not None, calculate density measures and use area (in square
meters) as the denominator.

-
clean_int_tol (`float` | `None`) – If not None, calculate consolidated intersections count (and density,
if area is also provided) and use this tolerance value. Refer to the
simplification.consolidate_intersections function documentation for
details.

Returns:

`dict`[`str`, `Any`] – stats –

Dictionary containing the following keys:

-
circuity_avg - see circuity_avg function documentation

-
clean_intersection_count - see clean_intersection_count function documentation

-
clean_intersection_density_km - clean_intersection_count per sq km

-
edge_density_km - edge_length_total per sq km

-
edge_length_avg - edge_length_total / m

-
edge_length_total - see edge_length_total function documentation

-
intersection_count - see intersection_count function documentation

-
intersection_density_km - intersection_count per sq km

-
k_avg - graph’s average node degree (in-degree and out-degree)

-
m - count of edges in graph

-
n - count of nodes in graph

-
node_density_km - n per sq km

-
self_loop_proportion - see self_loop_proportion function documentation

-
street_density_km - street_length_total per sq km

-
street_length_avg - street_length_total / street_segment_count

-
street_length_total - see street_length_total function documentation

-
street_segment_count - see street_segment_count function documentation

-
streets_per_node_avg - see streets_per_node_avg function documentation

-
streets_per_node_counts - see streets_per_node_counts function documentation

-
streets_per_node_proportions - see streets_per_node_proportions function documentation

Return type:

dict[str, Any]

osmnx.stats.circuity_avg(Gu)[source]

Calculate average street circuity using edges of undirected graph.

Circuity is the sum of edge lengths divided by the sum of straight-line
distances between edge endpoints. Calculates straight-line distance as
euclidean distance if projected or great-circle distance if unprojected.
Returns None if the edge lengths sum to zero.

Parameters:

Gu (`MultiGraph`) – Undirected input graph.

Returns:

circuity_avg – The graph’s average undirected edge circuity.

Return type:

float | None

osmnx.stats.count_streets_per_node(G, *, nodes=None)[source]

Count how many physical street segments connect to each node in a graph.

This function uses an undirected representation of the graph and special
handling of self-loops to accurately count physical streets rather than
directed edges. Note: this function is automatically run by all the
graph.graph_from_x functions prior to truncating the graph to the
requested boundaries, to add accurate street_count attributes to each
node even if some of its neighbors are outside the requested graph
boundaries.

Parameters:

-
G (`MultiDiGraph`) – Input graph.

-
nodes (`Iterable`[`int`] | `None`) – Which node IDs to get counts for. If None, use all graph nodes.
Otherwise calculate counts only for these node IDs.

Returns:

streets_per_node – Counts of how many physical streets connect to each node, with keys =
node ids and values = counts.

Return type:

dict[int, int]

osmnx.stats.edge_length_total(G)[source]

Calculate graph’s total edge length.

Parameters:

G (`MultiGraph`) – Input graph.

Returns:

length – Total length (meters) of edges in graph.

Return type:

float

osmnx.stats.intersection_count(G, *, min_streets=2)[source]

Count the intersections in a graph.

Intersections are defined as nodes with at least min_streets number of
streets incident on them.

Parameters:

-
G (`MultiDiGraph`) – Input graph.

-
min_streets (`int`) – A node must have at least min_streets incident on them to count as
an intersection.

Returns:

count – Count of intersections in graph.

Return type:

int

osmnx.stats.self_loop_proportion(Gu)[source]

Calculate percent of edges that are self-loops in a graph.

A self-loop is defined as an edge from node u to node v where u==v.

Parameters:

Gu (`MultiGraph`) – Undirected input graph.

Returns:

proportion – Proportion of graph edges that are self-loops.

Return type:

float

osmnx.stats.street_length_total(Gu)[source]

Calculate graph’s total street segment length.

Parameters:

Gu (`MultiGraph`) – Undirected input graph.

Returns:

length – Total length (meters) of streets in graph.

Return type:

float

osmnx.stats.street_segment_count(Gu)[source]

Count the street segments in a graph.

Parameters:

Gu (`MultiGraph`) – Undirected input graph.

Returns:

count – Count of street segments in graph.

Return type:

int

osmnx.stats.streets_per_node(G)[source]

Retrieve nodes’ street_count attribute values.

See also the count_streets_per_node function for the calculation.

Parameters:

G (`MultiDiGraph`) – Input graph.

Returns:

spn – Dictionary with node ID keys and street count values.

Return type:

dict[int, int]

osmnx.stats.streets_per_node_avg(G)[source]

Calculate graph’s average count of streets per node.

Parameters:

G (`MultiDiGraph`) – Input graph.

Returns:

spna – Average count of streets per node.

Return type:

float

osmnx.stats.streets_per_node_counts(G)[source]

Calculate streets-per-node counts.

Parameters:

G (`MultiDiGraph`) – Input graph.

Returns:

spnc – Dictionary keyed by count of streets incident on each node, and with
values of how many nodes in the graph have this count.

Return type:

dict[int, int]

osmnx.stats.streets_per_node_proportions(G)[source]

Calculate streets-per-node proportions.

Parameters:

G (`MultiDiGraph`) – Input graph.

Returns:

spnp – Dictionary keyed by count of streets incident on each node, and with
values of what proportion of nodes in the graph have this count.

Return type:

dict[int, float]

## osmnx.truncate module

Truncate graph by distance, bounding box, or polygon.

osmnx.truncate.largest_component(G, *, strongly=False)[source]

Return G’s largest weakly or strongly connected component as a graph.

Parameters:

-
G (`MultiDiGraph`) – Input graph.

-
strongly (`bool`) – If True, return the largest strongly connected component. Otherwise
return the largest weakly connected component.

Returns:

G – The largest connected component subgraph of the original graph.

Return type:

networkx.MultiDiGraph

osmnx.truncate.truncate_graph_bbox(G, bbox, *, truncate_by_edge=False)[source]

Remove from a graph every node that falls outside a bounding box.

Parameters:

-
G (`MultiDiGraph`) – Input graph.

-
bbox (`tuple`[`float`, `float`, `float`, `float`]) – Bounding box as (left, bottom, right, top).

-
truncate_by_edge (`bool`) – If True, retain nodes outside bounding box if at least one of node’s
neighbors is within the bounding box.

Returns:

G – The truncated graph.

Return type:

networkx.MultiDiGraph

osmnx.truncate.truncate_graph_dist(G, source_node, dist, *, weight='length')[source]

Remove from a graph every node beyond some network distance from a node.

This function must calculate shortest path distances between source_node
and every other graph node, which can be slow on large graphs.

Parameters:

-
G (`MultiDiGraph`) – Input graph.

-
source_node (`int`) – Node from which to measure network distances to all other nodes.

-
dist (`float`) – Remove every node in the graph that is greater than dist distance
(in same units as weight attribute) along the network from
source_node.

-
weight (`str`) – Graph edge attribute to use to measure distance.

Returns:

G – The truncated graph.

Return type:

networkx.MultiDiGraph

osmnx.truncate.truncate_graph_polygon(G, polygon, *, truncate_by_edge=False)[source]

Remove from a graph every node that falls outside a (Multi)Polygon.

Parameters:

-
G (nx.MultiDiGraph) – Input graph.

-
polygon (Polygon | MultiPolygon) – Only retain nodes in graph that lie within this geometry.

-
truncate_by_edge (bool) – If True, retain nodes outside boundary polygon if at least one of
node’s neighbors is within the polygon.

Returns:

G – The truncated graph.

Return type:

nx.MultiDiGraph

## osmnx.utils module

General utility functions.

osmnx.utils.citation(style='bibtex')[source]

Print the OSMnx package’s citation information.

Boeing, G. (2025). Modeling and Analyzing Urban Networks and Amenities with
OSMnx. Geographical Analysis, 57(4), 567-577. doi:10.1111/gean.70009

Parameters:

style (`str`) – {“apa”, “bibtex”, “ieee”}
The citation format, either APA or BibTeX or IEEE.

Return type:

`None`

osmnx.utils.log(message, level=None, name=None, filename=None)[source]

Write a message to the logger.

This logs to file and/or prints to the console (terminal), depending on
the current configuration of settings.log_file and
settings.log_console.

Parameters:

-
message (`str`) – The message to log.

-
level (`int` | `None`) – One of the Python logger.level constants. If None, set to
settings.log_level value.

-
name (`str` | `None`) – The name of the logger. If None, set to settings.log_name value.

-
filename (`str` | `None`) – The name of the log file, without file extension. If None, set to
settings.log_filename value.

Return type:

`None`

osmnx.utils.ts(style='datetime', template=None)[source]

Return current local timestamp as a string.

Parameters:

-
style (`str`) – {“datetime”, “iso8601”, “date”, “time”}
Format the timestamp with this built-in style.

-
template (`str` | `None`) – If not None, format the timestamp with this format string instead of
one of the built-in styles.

Returns:

timestamp – The current timestamp.

Return type:

str

## osmnx.utils_geo module

Geospatial utility functions.

osmnx.utils_geo.bbox_from_point(point, dist, *, project_utm=False, return_crs=False)[source]

Create a bounding box around a (lat, lon) point.

Overloads:

-
point (tuple[float, float]), dist (float) → tuple[float, float, float, float]

-
point (tuple[float, float]), dist (float), return_crs (Literal[True]) → tuple[float, float, float, float]

-
point (tuple[float, float]), dist (float), return_crs (Literal[False]) → tuple[float, float, float, float]

-
point (tuple[float, float]), dist (float), project_utm (Literal[True]) → tuple[float, float, float, float]

-
point (tuple[float, float]), dist (float), project_utm (Literal[True]), return_crs (Literal[True]) → tuple[tuple[float, float, float, float], Any]

-
point (tuple[float, float]), dist (float), project_utm (Literal[True]), return_crs (Literal[False]) → tuple[float, float, float, float]

-
point (tuple[float, float]), dist (float), project_utm (Literal[False]) → tuple[float, float, float, float]

-
point (tuple[float, float]), dist (float), project_utm (Literal[False]), return_crs (Literal[True]) → tuple[float, float, float, float]

-
point (tuple[float, float]), dist (float), project_utm (Literal[False]), return_crs (Literal[False]) → tuple[float, float, float, float]

Parameters:

-
point (tuple[float, float])

-
dist (float)

-
project_utm (bool)

-
return_crs (bool)

Return type:

tuple[float, float, float, float] | tuple[tuple[float, float, float, float], Any]

Create a bounding box some distance (in meters) in each direction (top,
bottom, right, and left) from the center point and optionally project it.

Parameters:

-
point (`tuple`[`float`, `float`]) – The (lat, lon) center point to create the bounding box around.

-
dist (`float`) – Bounding box distance in meters from the center point.

-
project_utm (`bool`) – If True, return bounding box as UTM-projected coordinates.

-
return_crs (`bool`) – If True, and project_utm is True, then return the projected CRS too.

Returns:

bbox or bbox, crs – (left, bottom, right, top) or ((left, bottom, right, top), crs).

Return type:

tuple[float, float, float, float] | tuple[tuple[float, float, float, float], Any]

osmnx.utils_geo.bbox_to_poly(bbox)[source]

Convert bounding box coordinates to Shapely Polygon.

Parameters:

bbox (`tuple`[`float`, `float`, `float`, `float`]) – Bounding box as (left, bottom, right, top).

Returns:

polygon – The resulting bounding box polygon.

Return type:

shapely.Polygon

osmnx.utils_geo.buffer_geometry(geom, dist)[source]

Buffer an unprojected Shapely geometry by some distance in meters.

Parameters:

-
geom (`Geometry`) – The geometry to be buffered. Coordinates should be in unprojected
latitude-longitude degrees (EPSG:4326).

-
dist (`float`) – The buffer distance in meters.

Returns:

geometry_buff – The (also unprojected) buffered geometry.

Return type:

shapely.Geometry

osmnx.utils_geo.interpolate_points(geom, dist)[source]

Interpolate evenly spaced points along a LineString.

The spacing is approximate because the LineString’s length may not be
evenly divisible by it.

Parameters:

-
geom (LineString | MultiLineString) – A LineString geometry.

-
dist (float) – Spacing distance between interpolated points, in same units as geom.
Smaller values accordingly generate more points.

Yields:

point – Interpolated point’s (x, y) coordinates.

Return type:

Iterator[tuple[float, float]]

osmnx.utils_geo.sample_points(G, n)[source]

Randomly sample points constrained to a spatial graph.

This generates a graph-constrained uniform random sample of points. Unlike
typical spatially uniform random sampling, this method accounts for the
graph’s geometry. And unlike equal-length edge segmenting, this method
guarantees uniform randomness.

Parameters:

-
G (`MultiGraph`) – Graph from which to sample points. Should be undirected (to avoid
oversampling bidirectional edges) and projected (for accurate point
interpolation).

-
n (`int`) – How many points to sample.

Returns:

points – The sampled points, multi-indexed by (u, v, key) of the edge from
which each point was sampled.

Return type:

geopandas.GeoSeries

            On this page

- User Reference

- osmnx.bearing module

- `add_edge_bearings()`

- `calculate_bearing()`

- `orientation_entropy()`

- osmnx.convert module

- `graph_from_gdfs()`

- `graph_to_gdfs()`

- `to_digraph()`

- `to_undirected()`

- `validate_features_gdf()`

- `validate_graph()`

- `validate_node_edge_gdfs()`

- osmnx.distance module

- `add_edge_lengths()`

- `euclidean()`

- `great_circle()`

- `nearest_edges()`

- `nearest_nodes()`

- osmnx.elevation module

- `add_edge_grades()`

- `add_node_elevations_google()`

- `add_node_elevations_raster()`

- osmnx.features module

- `features_from_address()`

- `features_from_bbox()`

- `features_from_place()`

- `features_from_point()`

- `features_from_polygon()`

- `features_from_xml()`

- osmnx.geocoder module

- `geocode()`

- `geocode_to_gdf()`

- osmnx.graph module

- `graph_from_address()`

- `graph_from_bbox()`

- `graph_from_place()`

- `graph_from_point()`

- `graph_from_polygon()`

- `graph_from_xml()`

- osmnx.io module

- `load_graphml()`

- `save_graph_geopackage()`

- `save_graph_xml()`

- `save_graphml()`

- osmnx.plot module

- `get_colors()`

- `get_edge_colors_by_attr()`

- `get_node_colors_by_attr()`

- `plot_figure_ground()`

- `plot_footprints()`

- `plot_graph()`

- `plot_graph_route()`

- `plot_graph_routes()`

- `plot_orientation()`

- osmnx.projection module

- `is_projected()`

- `project_gdf()`

- `project_geometry()`

- `project_graph()`

- osmnx.routing module

- `add_edge_speeds()`

- `add_edge_travel_times()`

- `k_shortest_paths()`

- `route_to_gdf()`

- `shortest_path()`

- osmnx.settings module

- osmnx.simplification module

- `consolidate_intersections()`

- `simplify_graph()`

- osmnx.stats module

- `basic_stats()`

- `circuity_avg()`

- `count_streets_per_node()`

- `edge_length_total()`

- `intersection_count()`

- `self_loop_proportion()`

- `street_length_total()`

- `street_segment_count()`

- `streets_per_node()`

- `streets_per_node_avg()`

- `streets_per_node_counts()`

- `streets_per_node_proportions()`

- osmnx.truncate module

- `largest_component()`

- `truncate_graph_bbox()`

- `truncate_graph_dist()`

- `truncate_graph_polygon()`

- osmnx.utils module

- `citation()`

- `log()`

- `ts()`

- osmnx.utils_geo module

- `bbox_from_point()`

- `bbox_to_poly()`

- `buffer_geometry()`

- `interpolate_points()`

- `sample_points()`



# PART 2 — Socrata / SODA (NYC Open Data, DataSF)


---

Source: https://dev.socrata.com/docs/endpoints


# API Endpoints

## What is an API Endpoint?

The “endpoint” of a SODA API is simply a unique URL that represents an object or collection of objects. Every Socrata dataset, and even every individual data record, has its own endpoint. The endpoint is what you’ll point your HTTP client at to interact with data resources.

All resources are accessed through a common endpoint of `/api/v3/views/IDENTIFIER/query.json` along with their dataset identifier. This paradigm holds true for every dataset in every SODA API. All datasets have a unique identifier - eight alphanumeric characters split into two four-character phrases by a dash. For example, `ydr8-5enu` is the identifier for the Building Permits. This identifier can then be inserted into the `/api/v3/views/IDENTIFIER/query` endpoint to construct the API endpoint.

  [example omitted on the source site: "TryIt macro disabled during SODA3 upgrade"]

Once you’ve got your API endpoint, you can make requests with SoQL to filter and manipulate your dataset.

## Locating the API endpoint for a dataset

You can also find API endpoints, and links to detailed developer documentation for each dataset, in a number of different places, depending on where you are:

If you’re viewing a dataset listing within the Open Data Network, there will be a prominent “API” button that will take you directly to the API documentation for that dataset.
 See this

If you’re viewing a dataset directly, there will be an “API Documentation” button under “Export” and then “SODA API”.
 See this

## Endpoint Versioning

SODA and SoQL are very flexible and allow us to add functionality over time without needing to completely deprecate and replace our APIs. We can do so in several different ways:

This allows us to introduce additional capabilities while still allowing you to issue the same kinds of queries in a backwards-compatible manner. We can extend SODA APIs without needing all developers to migrate their code to a new version.

However, some functionalities are not available on all of our API endpoints, which is why we differentiate between versions of a dataset’s API. Functions made available on a newer version might not be available on an API endpoint of an older version. In the sidebar of our automatic API documentation, we list the version that that endpoint complies with, as well as other useful information.
   See this

Throughout the documentation on this developer portal you’ll notice version toggles and info boxes that will help you understand the difference between SODA endpoint versions.

### Version 3.0 (Latest)

The next iteration of SODA will be released in 2025 and changes the endpoint from `/resource/IDENTIFIER.json` to `/api/v3/IDENTIFIER/query.json`. Notable changes:

- We have separated the endpoint into two:

- `/query` for querying (e.g., `https://data.cityofchicago.org/api/v3/views/ydr8-5enu/query.json`) Query primarily supports machine-readability and has more options for customizing the request.

- `/export` for exports (e.g., `https://data.cityofchicago.org/api/v3/views/ydr8-5enu/export.csv`) Export supports more formats and focuses on generating something readable by humans.

### Version 2.1

The first SODA 2.1 APIs (previously referred to as our “high-performance Socrata Open Data APIs”) were released in April of 2015, and in November of 2015 they received the “2.1” version designation for clarity. SODA 2.1 introduces a number of new datatypes as well as numerous new SoQL functions:

- New geospatial datatypes like `Point`
, `Line`
, and `Polygon`
 replace the `Location`
 datatype

- Closer compliance with SQL semantics, such as `Text`
 comparisons becoming case-sensitive

New functionality will be added to this version over time.

For more information:

- SoQL functions that work with version 2.1

- Datatypes that are available in version 2.1

### Version 2.0

SODA 2.0 was originally released in 2011. Although 2.1 is backwards-compatible with 2.0, there are a number of differences between the two APIs:

- 2.0 supports fewer SoQL functions than 2.1.

- The only geospatial datatype supported is the `Location`
 datatype

- `Text`
 comparisons are case-insensitive

For more information:

- SoQL functions that work with version 2.0

- Datatypes that are available in version 2.0

## Versioning HTTP headers

The simplest way to tell the difference between a 2.0 API and a 2.1 API is via the `X-SODA2-Legacy-Types` header, which will be `true` if you’re accessing a legacy 2.0 API.

## When we will increment endpoint versions

From time to time, we’ll introduce new SoQL functions and datatypes to the latest version of the SODA API. Those changes will be non-breaking, and old queries and applications will continue to function unchanged. The SODA API is designed to make it easy to introduce new functionality over time without making breaking changes.


---

Source: https://dev.socrata.com/docs/queries/


# Queries using SODA3

The Socrata APIs provide rich query functionality through a query language we call the “Socrata Query Language” or “SoQL”. As its name might suggest, it borrows heavily from Structured Query Language (SQL), used by many relational database systems. Its paradigms should be familiar to most developers who have previously worked with SQL, and are easy to learn for those who are new to it.

Requests must be either authenticated by a user or marked with a valid application token. Developers should now use the HTTP POST method when requesting queries, as this allows for longer queries and clearer options.

The endpoints are split into two:

- `/query` for querying (e.g., `https://data.cityofchicago.org/api/v3/views/ydr8-5enu/query.json`) Query has more options for customizing the request so that you can fine-tune what data you want back.

- `/export` for exports (e.g., `https://data.cityofchicago.org/api/v3/views/ydr8-5enu/export.csv`) Export focuses on providing the entire dataset to be consumed by humans or Microsoft Excel or similar programs.

You can click on each option to see more information about them:

   |

       | Request Option
       | /query
       | /export
       | Description

       | `query`
       | available
       | available
       | The SoQL query to run

       | `page`
       | available
       | not available
       | `{ pageNumber: 1, pageSize: 1000 }` to indicate which page (1-indexed) and how many rows per page

       | `parameters`
       | available
       | available
       | Some views require parameters to be provided by the user. Details to be provided at a later date

       | `timeout`
       | default: `600`
       | default: `600`
       | The number of seconds before timing out the request. Default: 600 (10 minutes)

       | `includeSystem`
       | default: `true`
       | not available
       | Whether or not to include system columns

       | `includeSynthetic`
       | default: `true`
       | not available
       | Whether or not to include not-explicitly-requested columns, such as system fields

       | `orderingSpecifier`
       | default: `total`
       | default: `total`
       | Can be set to `discard` if you do not care about order and just want the data. Can improve performance significantly

       | `serializationOptions`
       | not available
       | available
       | Different formats have specific customization options.

## Example

You might use the popular program cURL to make the request with the appropriate payload, or use an appropriate HTTP client library in your preferred programming language.

Query for the first 100 rows of a dataset:

```
curl --header 'X-App-Token: your-application-token' \
     --json '{
        "query": "SELECT *",
        "page": {
            "pageNumber": 1,
            "pageSize": 100
        },
        "includeSynthetic": false
     }' \
     https://soda.demo.socrata.com/api/v3/views/4tka-6guv/query.json
```

Export the dataset as CSV with a byte-order mark and a separator character of `TAB`:

```
curl --header 'X-App-Token: your-application-token' \
     --json '{
       "serializationOptions": {
         "separator": "\t",
         "bom": true
       }
     }' \
     https://soda.demo.socrata.com/api/v3/views/4tka-6guv/export.csv
```


---

Source: https://dev.socrata.com/docs/app-tokens


# Application Tokens

The Socrata Open Data API uses application tokens for two purposes:

## Throttling limits

Without an application token, we can only track usage and perform throttling based on a few simple criteria, mainly source IP address. As such, requests that aren’t using an application token come from a shared pool via IP address. IP addresses that make too many requests during a given period may be subject to throttling.

When requests are made using an application token, we can actually attribute each request to a particular application and developer, granting each their own pool of API requests. Currently we do not throttle API requests that are using an application token, unless those requests are determined to be abusive or malicious.

We reserve the right to change these throttling limits with notice, and we will post an update to announce any such change.

If you are throttled for any reason, you will receive a status code `429` response.

### Don’t be a jerk!

Yes, I know it says you get unlimited requests. But keep in mind that you’re using a shared platform, and you should still be deliberate in how you design your application to use our API. Applications that are determined to be abusive or malicious, or that otherwise monopolize the use of our API may be throttled.

If we detect that your application is nearing the point where we may have to throttle it, we will likely pro-actively reach out to you to discuss how you can optimize your usage. If you have any questions, feel free to contact us and we’d be glad to help!

## Obtaining an Application Token

You can obtain an application token by registering for one in your Socrata profile.

## Using your Application Token

While it is possible to perform simple unauthenticated queries against the Socrata Open Data API without making use of an application token, you’ll receive much higher throttling limits if you include an application token in your requests. If you elect not to use an application token, you’ll be subjected to a much lower throttling limit for all requests originating from your IP address.

Here’s how you include the application token in the request:

   |

       | SODA Version
       | Method

       | 3.0, 2.x
       | Use the `X-App-Token` HTTP header.

       | 2.1, 2.0
       | Use the `$$app_token` parameter in your request.

       | 1.0
       | Use the `app_token` parameter in your request.

Using the header is the preferred method.

Note: Application tokens are not necessarily used for authentication, but you should still preserve the security of your application token by always using `HTTPS` requests. If your application token is duplicated by another developer, their requests will count against your quota.

The following is an example of using the `X-App-Token` HTTP header to pass an application token:

```
POST /api/v3/views/kzjm-xkqj/query.json HTTP/1.1
Host: data.seattle.gov
Accept: application/json
X-App-Token: [REDACTED]
```

The same application token could also be passed as a URL parameter:

  [example omitted on the source site: "TryIt macro disabled during SODA3 upgrade"]

## Using the Application Token as part of the OAuth 2.0 authentication process

Application tokens can also be used for authentication using OAuth 2.0. For more information, see the authentication section.


---

Source: https://dev.socrata.com/docs/queries/where


# The WHERE Clause

The `WHERE` parameter allows you to filter your results using boolean operators. For example, to retrieve only quakes with a `magnitude` of greater than 3.0:

  [example omitted on the source site: "TryIt macro disabled during SODA3 upgrade"]

You can also combine multiple filters together using boolean operators to chain filters together. If we also only wanted quakes from the `pr` source:

  [example omitted on the source site: "TryIt macro disabled during SODA3 upgrade"]

Multiple boolean operators are available to combine filters:

   |

       | Operator
       | Description
       | Example

       | `AND`
       | The logical and of two expressions.
       | `a AND b` will return true ONLY if `a` and `b` are both true.

       | `OR`
       | The logical or of two expressions.
       | `a or b` will return true if either `a` or `b` are true.

       | `NOT`
       | The logical not of an expression.
       | `NOT a` will return true, ONLY if a is false.

       | `IS NULL`
       | Whether a value is null or not.
       | `a IS NULL` will return true, ONLY if `a` is null.

       | `IS NOT NULL`
       | Whether a values is not null.
       | `a IS NOT NULL` will return true, ONLY if `a` is not null

       | `( ... )`
       | Parentheses are used for defining order of operations.
       | `b>3 AND (a=1 OR a=2)`


---

Source: https://dev.socrata.com/docs/queries/select


# The SELECT Clause

The `SELECT` clause operates much as it does in SQL. It allows expressions and aliases, as well as aggregations when using GROUP BY.

For example, to retrieve only the `location` and `magnitude` fields for our earthquakes, use `SELECT` to choose their field names, separated by a comma (`,`):

  [example omitted on the source site: "TryIt macro disabled during SODA3 upgrade"]

You can also create column aliases just like you could do in SQL. For example, to alias `magnitude` to `richter`, provide a select of `magnitude AS 'richter'`:

  [example omitted on the source site: "TryIt macro disabled during SODA3 upgrade"]

You can also use SoQL functions and operators to modify the output of a SODA query. For example, to convert the `depth` from meters to feet, by multiplying it by 3.28:

  [example omitted on the source site: "TryIt macro disabled during SODA3 upgrade"]

For a full listing of the functions available by datatype, check out the datatype-specific documentation.


---

Source: https://dev.socrata.com/docs/queries/limit


# The LIMIT Clause

The `LIMIT` parameter controls the total number of rows returned, and it defaults to 1,000 records per request. It can be used either alone, or with `OFFSET` in order to page through a dataset.

For example, if you wanted to only return the top ten strongest earthquakes, you could use `LIMIT` in conjunction with `$order`:

  [example omitted on the source site: "TryIt macro disabled during SODA3 upgrade"]

When combined with an aggregation via `$group`, `LIMIT` is applied after the aggregation. For example, if the aggregation reduces a result set from 10,000 records to 100, the `LIMIT` is applied to the result set of 100, rather than the original records.

Note: Depending on the version of the API endpoint, it will have different maximums for `LIMIT`:

- Version 2.0 endpoints have a maximum `$limit` of 50,000

- Version 2.1 and 3.0 endpoints have no maximum

Details are available in the API documentation for each API. Make sure you pick a limit appropriate to the speed of your connection, as HTTP calls will time out and payloads for high `LIMIT`s can be very large.


---

Source: https://dev.socrata.com/docs/functions/within_circle


# within_circle(...)

- within_circle(...)

### `within_circle(...)`

Returns the rows that have locations within a specified circle, measured in meters

Works with the following datatypes:

 This function works with 2.0, 2.1, and 3.0 endpoint(s). What does this mean? »

The `within_circle(...)` function is used in the `$where` parameter filter for Point or Location values within a given radius of a point. It accepts four parameters:

For example, to query for all of the Seattle Fire 911 Calls calls within 500 meters of the Socrata offices in Seattle:

  [example omitted on the source site: "TryIt macro disabled during SODA3 upgrade"]


---

Source: https://dev.socrata.com/docs/datatypes/point


# Point Datatype

The `Point` datatype is very similar to the `Location` datatype. It represents a location on the Earth as a WGS84 Latitude and Longitude. The location is encoded as a GeoJSON “point”. Example:

```
{
  "type": "Point",
  "coordinates": [
    -87.653274,
    41.936172
  ]
}
```

The `Point` datatype is displayed in Well Known Text (WKT) format in the dataset user interface. The Well Known Text format is also used when ingressing `Point` columns using certain tools, like DataSync. Example:

```
POINT (-87.653274 41.936172)
```

  Heads up! Contrary to the normal convention of "latitude, longitude" ordering in the `coordinates` property, GeoJSON and Well Known Text order the coordinates as "longitude, latitude" (X coordinate, Y coordinate), as other GIS coordinate systems are encoded. Note that the SoQL `within_box` and `within_circle` functions use the more conventional ordering, however.

The following operators can be used on `Point` fields:

   |

       | Operator
       | Description

       | `IS NULL`
       | `TRUE` for values that are `NULL`.

       | `IS NOT NULL`
       | `TRUE` for values that are not `NULL`.

And the following functions can be used with them:

    3.0
    2.1
    2.0

   |
     | Keyword Name
     | Description
     | Availability

           | `distinct`
           | Returns distinct set of records
           | 2.1 and 3.0

   |
     | Function Name
     | Description
     | Availability

           | `case(...)`
           | Returns different values based on the evaluation of boolean comparisons
           | 2.1 and 3.0

           | `convex_hull(...)`
           | Returns the minimum convex geometry that encloses all of another geometry
           | 2.1 and 3.0

           | `count(...)`
           | Returns a count of a given set of records
           | 2.0, 2.1, and 3.0

           | `distance_in_meters(...)`
           | Returns the distance between two Points in meters
           | 2.1 and 3.0

           | `extent(...)`
           | Returns a bounding box that encloses a set of geometries
           | 2.1 and 3.0

           | `intersects(...)`
           | Allows you to compare two geospatial types to see if they intersect or overlap each other
           | 2.1 and 3.0

           | `num_points(...)`
           | Returns the number of vertices in a geospatial data record
           | 2.1 and 3.0

           | `within_box(...)`
           | Returns the rows that have geodata within the specified box, defined by latitude, longitude corners
           | 2.0, 2.1, and 3.0

           | `within_circle(...)`
           | Returns the rows that have locations within a specified circle, measured in meters
           | 2.0, 2.1, and 3.0

           | `within_polygon(...)`
           | Returns the rows that have locations within the specified box, defined by latitude, longitude corners
           | 2.1 and 3.0

Just like the Location datatype, you can use the`within_circle(...)` function to look for points within a given range. For example, to get all of the crimes within 500 meters of Chicago City Hall:

  [example omitted on the source site: "TryIt macro disabled during SODA3 upgrade"]

However, there are also a ton of additional geo query functions that come with the Point datatype. For example, to aggregate that same dataset by ward and return polygons surrounding each cluster, in GeoJSON:

  [example omitted on the source site: "TryIt macro disabled during SODA3 upgrade"]

## Why are the latitude and longitude backwards?!

Back in school, you were taught that points on the earth were defined as “degrees of latitude and longitude”, right? You probably used them to find locations on the globe, to locate your campsite, or to plot the location of that prime fishing spot or anchorage. So why then are locations in the `Point` datatype encoded as `$longitude, $latitude`?

Well, a latitude and longitude pair, usually used on a Mercator projection is actually only one of many many different ways of translating locations on our (semi-)spherical world onto a flat piece of paper (or an LCD monitor). Not only are there dozens of ways of flattening that globe into a plane (called map projections), but there are also thousands of ways of actually mapping coordinates onto those projections.

GeoJSON and Well Known Text are designed to be flexible to work with many different map projections and coordinate projections, and just like the Cartesian coordinates you learned in math class, those coordinates are encoded in “X, Y” order. With the `EPSG:4326` coordinate system that we use for our geospatial datatypes, that means that the coordinates are encoded in `$longitude, $latitude` order.

For fun, check out this excellent XKCD comic to see what your favorite map projection says about you.


within_circle parameters (from the page list items): 1) the field name of a Location or Point, 2) latitude of the central point, 3) longitude of the central point, 4) radius of the circle in meters.


---

# Socrata Discovery (catalog) API — OpenAPI spec, verbatim

Source: https://dev.socrata.com/apis/discovery.yaml (rendered at https://dev.socrata.com/docs/other/discovery)

```yaml
---
openapi: 3.1.0
info:
  version: '1.0'
  title: Discovery API
  description: >
    ## Purpose

    Our data platform hosts tens of thousands of government assets. Governments large and small publish data on
    crime, permits, finance, healthcare, research, performance, and more for citizens to use. While this large corpus of
    government data is already accessible via opendatanetwork.com, this API opens up this corpus of government data
    for automated searching, research, and exploration. Assets can be found by keywords, high-level categorizations,
    tags, and much more. This API is a powerful way to access and explore data on our platform.


    The production API endpoints for this API are at 
     - https://api.us.socrata.com/api/catalog/v1 for domains in North America
     - https://api.eu.socrata.com/api/catalog/v1 for all other domains


    For example, to query for datasets categorized as 'Public Safety', you could use the following query:


    <a class="tryit" href="http://api.us.socrata.com/api/catalog/v1?categories=public%20safety">http://api.us.socrata.com/api/catalog/v1?categories=public%20safety</a>

     ## Asset Visibility

     There are four key factors which control whether or not an asset can be viewed anonymously by an unauthenticated
     user. An asset must meet criteria for all factors which apply to the domain itself
     (this varies domain-by-domain, as not all domains employ relevant features or modules which utilize these).

     These factors are:
     - the asset's audience - as _public_ vs internal or private
     - the asset's publication status - as _published_ vs unpublished in a draft state
     - the approval status of the asset - as _approved_ vs pending or rejected
     - whether the asset is hidden - as false i.e. _not hidden_ vs true i.e. hidden

     ## Authentication

     Authentication is not required to use this API for read-only access to the corpus of anonymously-viewable
     (i.e. public, published, approved, and not hidden) assets. However, if you wish to search for private,
     unpublished, unapproved or hidden data, you must authenticate yourself and ensure that you have adequate permissions
     to view the data in question.

     To authenticate, you must:
     - Use one of the methods discussed [here](https://dev.socrata.com/docs/authentication.html) and
     - Provide the 'X-Socrata-Host' host header with the domain that has granted you access to view its assets.
       For example 'X-Socrata-Host:soda.demo.socrata.com'.

     When properly authenticated, you will be able to search over:
     - All data that is anonymously-viewable.
     - Any data that you own or that has been shared to you.
     - Private, unpublished, unapproved, and hidden assets from domains that have granted you a right to view such assets.


     ## App Tokens

    All programmatic usage of Socrata APIs should include an
    [app token](https://dev.socrata.com/docs/app-tokens.html), either via the `X-App-Token` header or the
    `$$app_token parameters` set to a valid token. This is assumed and not documented in the API specs below.


    ## Additional API facts

    1. Search without any parameters returns the set of data you are authorized to see. Any parameter
       usage serves to filter (or sort) this set of data - i.e. no parameters allow you to see
       more data than a search without parameters. This is important to know when considering parameters
       that let you search for assets not found in the public catalog. If you are unauthorized to see such things,
       your results will be empty.
    2. Multiple repetitive parameters are treated differently from multiple unique parameters. Unique parameters,
       for example

       _?tags=fire&provenance=official_

       filters to the _intersection_ of the values. In this example, the search is for official assets with the tag 'fire'.
       Repetitive parameters filter to the _union_ of values. For example

       _?tags=fire&tags=commission_

       searches for assets tagged as either 'fire' or 'commission'.
       The combination of both repetitive and unique parameters follow the same rules. Thus the query

       _?tags=fire&tags=commission&provenance=official_

        would search for official assets tagged as either 'fire' or 'commission'.
    3. Many parameters support repetitive usage, using either the syntax above or the alternate syntax using brackets,
       e.g. _?tags[]=fire&tags[]=commission_. Parameter descriptions will tell whether this is supported or not.
    4. Because this API supports custom metadata search and because custom metadata keys are arbitrary,
       any unrecognized params are assumed to be custom metadata. Thus, if you misname a parameter, for example
       _?domain=soda.demo.socrata.com_ (the parameter should be 'domains'), the results will be empty unless there are
       assets with the custom metadata key 'domain' and value 'soda.demo.socrata.com'.
paths:
  /catalog/v1?ids={4x4}:
    get:
      summary: "Find assets by id"
      description: >
        Most assets are uniquely identified by a string known as a _four-by-four_.
        This is a string made from eight alphanumeric characters split into two four-character phrases,
        e.g. `ku42-jx2v`. While most assets follow this pattern, their drafts do not.
        Draft IDs join the four-by-four of the published version with a colon and a draft identifier.
        For stories, which only ever support a single shared draft, the draft's identifier is "draft".
        For example, if a draft of story ku42-jx2v is created, its ID would be `ku42-jx2v:draft`.
        For non-story drafts, the draft's identifier is an integer. For example, if the 7th draft of asset cio5-yr56
        is created, its ID would be `cio5-yr56:7`.
        The `ids` parameter will limit the results to the assets identified in this way.

        #### Examples
          - `?ids=ku42-jx2v`
          - `?ids=ku42-jx2v&ids=ku42-jx2v:draft`
          - `?ids=cio5-yr56,cio5-yr56:7`
      parameters:
        - $ref: '#/components/parameters/ids'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
        "400":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/400 - Not an Asset Four-by-Four Error'
  /catalog/v1?search_context={domain}&domains={domain}:
    get:
      summary: "Find assets by domain"
      description: >
        Each asset is owned by a single domain. The `domains` and `search_context` parameters are used to limit the results
        to the inferred domains.

        If neither of the `domains` or `search_context` are provided, the inferred domains are
        all domains. Please note, that because of the size of this set, the user will not be
        authenticated across all of the domains and the user will effectively be treated as an anonymous user.

        If only a `search_context` is provided, the inferred domains will include the `search_context` and any
        domains which federate data into the `search_context`.  Using this parameter allows you to
        see the returned data "through the eyes" of a given domain, e.g. filter and search across their
        tags/categories/custom metadata.

        If `domains` are provided, there is no need to infer domains and the given `domains` will be searched.

        #### Examples
          - `?search_context=soda.demo.socrata.com`
          - `?domains=soda.demo.socrata.com`
          - `?domains=soda.demo.socrata.com,data.cityofchicago.org`
          - `?search_context=soda.demo.socrata.com&domains=soda.demo.socrata.com,data.cityofchicago.org`
      parameters:
        - $ref: '#/components/parameters/search_context'
        - $ref: '#/components/parameters/domains'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
        "404":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/404 - Domain Not Found Error'
  /catalog/v1?names={name}:
    get:
      summary: "Find assets by name"
      description: >
        Every asset is given a name/title. The `names` parameter will limit results to those having the
        given name. This filter is case insensitive, but otherwise operates like an exact match. If the exact
        name is not known, consider using the `q` parameter to
        [search by query](#?route=get-/catalog/v1-q--query--min_should_match--match_term-) or to
        [autocomplete](#?route=get-/catalog/v1/autocomplete-q--query--deduplicate--true|false-) the name.
        Keep in mind that spaces and other special characters should be url-encoded.

        #### Examples
          - `?names=NYS%20Attorney%20Registrations`
          - `?names=nys%20attorney%20registrations&names=OpenNY%20Press%20Releases`
          - `?names[]=NYS%20Attorney%20Registrations
               &names[]=OpenNY%20Press%20Releases`
      parameters:
        - $ref: '#/components/parameters/names'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
  /catalog/v1?search_context={search_context}&categories={category}:
    get:
      summary: "Find assets by category"
      description: >
        Each domain is allowed to customize the categories they use and each asset may be assigned one of these
        categories or none. The `categories` parameter will limit the results to those having the given category, but
        only if the `search_context` is included.

        #### Examples
          - `?search_context=soda.demo.socrata.com&categories=Recreation`
          - `?search_context=soda.demo.socrata.com&categories=Recreation&categories=Education`
          - `?search_context=soda.demo.socrata.com
               &categories[]=Recreation&categories[]=Education`
      parameters:
        - $ref: '#/components/parameters/search_context'
        - $ref: '#/components/parameters/categories'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
  /catalog/v1?search_context={search_context}&tags={tag}:
    get:
      summary: "Find assets by tag"
      description: >
        Each asset may have none, one or more tags associated with it. The `tags` parameters will limit the results to
        those having the given tag, but only if the `search_context` is included.
        
        #### Examples
          - `?search_context=soda.demo.socrata.com&tags=%23environment`
          - `?search_context=soda.demo.socrata.com&tags=%23environment&tags=2017`
          - `?search_context=soda.demo.socrata.com&tags[]=2018&tags[]=2017`
      parameters:
        - $ref: '#/components/parameters/search_context'
        - $ref: '#/components/parameters/tags'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
  /catalog/v1?only={type}:
    get:
      summary: "Find assets by type"
      description: >
        Each asset has a logical type, such as a dataset or chart. The `only` parameter will limit the results to a 
        particular type. The current taxonomy includes the following types:

        _api_, _calendar_, _chart_, _dataset_, _federated_href_, _file_, _filter_,
        _form_, _href_, _link_, _map_, _measure_, _story_, _visualization_

        You may use either the singular or plural variants of each type.

        #### Examples
          - `?only=charts`
          - `?only=charts,maps`
          - `?only=datasets&only=link`
          - `?only[]=story&only[]=measure`
      parameters:
        - $ref: '#/components/parameters/only'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
  /catalog/v1?{custom_metadata_key}={value}:
    get:
      summary: "Find by domain-specific metadata"
      description: >
        Each domain has the ability to add custom metadata to datasets beyond the default metadata.
        This custom metadata is different for every domain, but within a domain, all assets may be labeled
        with the metadata. The custom metadata is a named set of key-value pairs. For example one domain might
        have a set named 'Dataset Information' which has keys 'Localities' and 'Agencies & Authorities',
        while another domain has a set named 'Dataset Category' having key 'Agency').
        The caller may restrict the results to a particular custom metadata pair by specifying the parameter name as a
        combination of the set's name and the key's name and the parameter value as the key's value. To construct the
        parameter name, join the set's name to the key's name with an underscore and replace all spaces with dashes.
        Some examples are given in the table below:

        <table>
          <thead>
            <tr>
              <th scope="col">Set Name</th>
              <th scope="col">Field Name</th>
              <th scope="col">Parameter</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dataset Information</td>
              <td>Localities</td>
              <td>?Dataset-Information_Localities</td>
            </tr>
            <tr>
              <td>Data Summary</td>
              <td>Units</td>
              <td>?Dataset-Summary_Units</td>
            </tr>
            <tr>
              <td>Información de la Entidad</td>
              <td>Nombre de la Entidad</td>
              <td>?Información-de-la-Entidad_Nombre-de-la-Entidad</td>
            </tr>
          </tbody>
        </table>


        #### Examples
          - `?Dataset-Information_Localities=Albany%2C+City+of`
          - `?Dataset-Information_Localities=Albany%2C+City+of&Dataset-Summary_Units=Permits`
          - `?Dataset-Category_Agency=Office+of+the+Governor`
      parameters:
        - $ref: '#/components/parameters/custom-metadata_key'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
  /catalog/v1?attribution={organization}:
    get:
      summary: "Find assets by attribution"
      description: >
        Assets can be attributed to various organizations. The `attribution` parameter will limit the results to those
        attributed to the given organization.

        #### Examples
          - `?attribution=New%20York%20State%20Gaming%20Commission`
          - `?attribution=Texas%20Comptroller%20of%20Public%20Accounts`
      parameters:
        - $ref: '#/components/parameters/attribution'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
  /catalog/v1?license={license}:
    get:
      summary: "Find assets by license"
      description: >
        Assets can be released under various licenses.
        The `license` parameter will limit the results to those with the given license.

        #### Examples
          - `?license=Public%20Domain`
          - `?license=
               Creative%20Commons%201.0%20Universal%20(Public%20Domain%20Dedication)`
      parameters:
        - $ref: '#/components/parameters/license'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
  /catalog/v1?q={query}&min_should_match={match_term}:
    get:
      summary: "Find assets by query term"
      description: >
        Assets may be searched by any of the text found in the

        `name, description, category, tags, column names, column fieldnames, column descriptions, attribution`

        fields. The `q` parameter takes arbitrary text and will limit the results to those having some or all of
        the text. The optional `min_should_match` parameter may be used to explicitly specify the number or percent of
        words that must match.
        See [the Elasticsearch docs](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-minimum-should-match.html)
        for the format of arguments to `min_should_match`.
        If `min_should_match` is not specified, the service's default is '3<60%', meaning that if there are 3 or fewer
        search terms specified, all of them must match; otherwise 60% of the search terms must be found in the fields
        specified above.

        For example, if `min_should_match` is '3<60%', searching for

          - _'city dog park'_ will require stemmed matches for all three words; thus,
            'Western Cities Association Dog Parks' will match, but 'New York City Parks' will not.
          - _'trees green spaces new york'_ will require 60% of the words to match, which is 3 out of 5 words.
             Thus, 'New York Tree Map', and 'New Green Spaces Initiative' will both match.

        #### Examples
          - `?q=result`
          - `?q=school%20result%20SAT`
          - `?q=school%20result%20SAT&min_should_match=-1`
      parameters:
        - $ref: '#/components/parameters/q'
        - $ref: '#/components/parameters/min_should_match'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
  /catalog/v1?parent_ids={4x4}:
    get:
      summary: "Find assets by parent id"
      description: >
        Some assets are uploaded directly and others are created from already existing data. For example, charts are
        derived from an existing parent dataset. The `parent_ids` parameter will limit the results to those having
        the parent dataset ids given.

        #### Examples
          - `?parent_ids=nqur-w4p7`
          - `?parent_ids=nqur-w4p7&parent_ids=qzve-kjga`
          - `?parent_ids=nqur-w4p7,qzve-kjga`
      parameters:
        - $ref: '#/components/parameters/parent_ids'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
        "400":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/400 - Not a Four-by-Four Error'
  /catalog/v1?derived_from={4x4}:
    get:
      summary: "Find assets derived from others"
      description: >
        Some assets are uploaded directly and others are created from or use other data. For example, charts are
        derived from an existing parent dataset and stories may then incorporate those charts. Measures may also
        incorporate one or more datasets. The `derived_from` parameter will limit the results to those that
        derive from the given dataset.

        #### Examples
          - `?derived_from=8f6m-78bg`
      parameters:
        - $ref: '#/components/parameters/derived_from'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
        "400":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/400 - Not a Four-by-Four Error'
  /catalog/v1?provenance={provenance}:
    get:
      summary: "Find by provenance"
      description: >
        While many assets on our platform are owned by government data publishers and other staff, some visualizations,
        maps, filtered views, and more are created by a member of the community. These assets are usually denoted with a
        'Community' badge on the data catalog. A _provenance=official_ parameter will limit the results to official
        assets, i.e. those owned by roled users on the domain.
        A _provenance=community_ parameter will limit the results to community created assets.

        #### Examples
          - `?provenance=official`
          - `?provenance=community`
      parameters:
        - $ref: '#/components/parameters/provenance'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
  /catalog/v1?for_user={4x4}:
    get:
      summary: "Find by owner"
      description: >
        Each asset has an owner, which may be a user or a team. The `for_user` parameter will limit the results to
        those owned by the user or team having the provided four-by-four identifier.

        #### Examples
          - `?for_user=xzik-pf59`
          - `?for_user=xzik-pf59,fpiq-yg3w`
          - `?for_user=xzik-pf59&for_user=fpiq-yg3w`
      parameters:
        - $ref: '#/components/parameters/for_user'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
        "400":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/400 - Not a Four-by-Four Error'
  /catalog/v1?search_context={domain}&shared_to={4x4}:
    get:
      summary: "Find by granted shares"
      description: >
        Each asset may be shared to teams or individual users. The `shared_to` param allows you to specify
        four-by-four identifier of a user or team and the results will be limited to those which were shared to them.

        Please note:
          - If you are not an administrator, you may only specify yourself as the user to whom assets are shared.
          - If you are not an administrator, you may only specify teams that you are on (as a member or an owner)
            as the teams to which assets are shared.
          - If you are an administrator, you may see what's shared to any user or team on the domain where you are
            an administrator.
          - You must include the domain name with the `search_context` parameter.

        If you search for assets shared to you, with or without assets shared to your teams, 
        assets _owned_ by you will be filtered out.

        You must authenticate in order to see any assets when using this param.

        #### Examples
          - `?search_context=soda.demo.socrata.com&shared_to=xzik-pf59`
          - `?search_context=soda.demo.socrata.com&shared_to=8xiq-st2k,xzik-pf59`
          - `?search_context=soda.demo.socrata.com&shared_to=8xiq-st2k&shared_to=xzik-pf59`
      parameters:
        - $ref: '#/components/parameters/shared_to'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
        "400":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/400 - Not a Four-by-Four Error'
        "401":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/401 - Unauthorized to Search Users Error'
  /catalog/v1?column_names={name}:
    get:
      summary: "Find by column name"
      description: >
        Tabular assets are composed of rows and columns.  The `column_names` parameter will limit the results to those
        having the given column names. The search is case insensitive, but otherwise looks for an exact match.
        Keep in mind that spaces and other special characters should be url-encoded.

        #### Examples
          - `?column_names=Winning%20numbers`
          - `?column_names=Winning%20numbers&column_names=Draw%20Date`
          - `?column_names[]=winning%20NUMBERS&column_names[]=draw%20date`
      parameters:
        - $ref: '#/components/parameters/column_names'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
  /catalog/v1?visibility={visibility}&show_visibility={true|false}:
    get:
      summary: "Find by visibility"
      description: >
        While many assets on our platform are discoverable and accessible via the open data catalog, others are held
        internally for government use. A _visibility=open_ parameter will limit the results to only those that would
        show in the public catalog. A _visibility=internal_ parameter will limit the results to those held internally,
        but note that only authenticated users who have sufficient rights and provide either a `search_context`
        or `domains` parameter will receive results.

        As discussed in the "Asset Visibility" at the beginning of this documentation,
        this visibility status is a product of four factors. This parameter is thus a convenience parameter where a
        'open' value corresponds to


        _audience=public&published=true&approval_status=approved&explicitly_hidden=false_.


        By default, visibility information is not included on the returned assets. To have it returned, attach a
        `show_visibility=true` parameter.

        #### Examples
          - `?visibility=open`
          - `?visibility=open&show_visibility=true`
          - `?search_context=data.texas.gov&visibility=internal`
      parameters:
        - $ref: '#/components/parameters/visibility'
        - $ref: '#/components/parameters/show_visibility'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
        "400":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/400 - Incorrect visibility Param Error'
  /catalog/v1?audience={audience}:
    get:
      summary: "Find by audience"
      description: >
        The audience is the first of four factors which control an asset’s visibility.
        Each asset has one of three different audiences. These include:

          - _private_ if the asset is only visible to the owner and any individuals the owner has shared the asset to
          - _site_ if the asset is visible to all members of a site/domain
          - _public_ if the asset is visible to anyone, within or outside the site/domain

        Only the _audience=public_ parameter may be used by any user. The _audience=site_ and _audience=private_
        parameters are only available to authenticated users who have sufficient rights and provide either a
        `search_context` or `domains` parameter, else a 401 error is returned.

        #### Examples
          - `?audience=public`
          - `?search_context=data.texas.gov&audience=site`
          - `?domains=data.texas.gov&audience=private`
      parameters:
        - $ref: '#/components/parameters/audience'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
        "400":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/400 - Incorrect audience Param Error'
        "401":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/401 - Unauthorized to Search NonPublic Data Error'
  /catalog/v1?published={true|false}:
    get:
      summary: "Find by publication status"
      description: >
        The publication status of each asset is the second of four factors which control an asset’s visibility.
        A _published=true_ parameter will limit the results to those that are published;
        A _published=false_ parameter will limit the results to those that are unpublished, but note that only
        authenticated users who have sufficient rights and provide a `search_context` or `domains` parameter will
        receive results.

        #### Examples
          - `?published=true`
          - `?search_context=data.texas.gov&published=false`
      parameters:
        - $ref: '#/components/parameters/published'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
  /catalog/v1?explicitly_hidden={true|false}:
    get:
      summary: "Find hidden/unhidden assets"
      description: >
        The hidden status of each asset is the third of four factors which control an asset’s visibility.
        Some sites selectively and explicitly hide certain assets from their public catalog for different reasons.
        A _explicitly_hidden=false_ parameter will limit the results to those that are not hidden.
        A _explicitly_hidden=true_ parameter will limit the results to those that are hidden, but note that only
        authenticated users who have sufficient rights and provide a `search_context` or `domains` parameter will
        receive results.

        #### Examples
          - `?explicitly_hidden=false`
          - `?search_context=data.texas.gov&explicitly_hidden=true`
      parameters:
        - $ref: '#/components/parameters/explicitly_hidden'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
  /catalog/v1?approval_status={approved|rejected|pending|not_ready}&target_audience={public|internal}:
    get:
      summary: "Find by approval status"
      description: >
        The approval status of each asset is the fourth of four factors which control an asset’s visibility.
        Assets must be approved in order to become anonymously or internally viewable. At any point in time,
        the status of these views may be 'pending', 'rejected', 'approved' or 'not_ready' (to be approved) for either
        of the public or internal audiences.
        The `approval_status` parameter accepts one of those values and will limit the results to those assets
        with the given state. The `target_audience` parameter accepts either 'public' or 'internal' and further limits
        the results to those with the given approvals status destined for the given target audience.
        Note that no results will be returned when searching for rejected, pending or not_ready
        approval statuses unless the data is already anonymously viewable or the user has authenticated and
        provided a `search_context` or `domains` parameter.

        #### Examples
          - `?approval_status=approved`
          - `?approval_status=approved&target_audience=public`
          - `?domains=soda.demo.socrata.com&approval_status=rejected,pending`
          - `?domains=soda.demo.socrata.com&approval_status=rejected&approval_status=approved`
          - `?domains=soda.demo.socrata.com&approval_status[]=rejected
               &approval_status[]=approved`
          - `?search_context=datahub.hhs.gov&approval_status=not_ready
               &target_audience=internal`
          - `?search_context=datahub.hhs.gov&approval_status=approved
               &target_audience[]=public&target_audience[]=internal`
      parameters:
        - $ref: '#/components/parameters/approval_status'
        - $ref: '#/components/parameters/target_audience'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
        "400":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/400 - Incorrect approval_status Param Error'
        # (TODO annabelle, go over each entry looking for other cases with multiple 400s
        "400+":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/400 - Incorrect target_audience Param Error'
  /catalog/v1?submitter_id={4x4}:
    get:
      summary: "Find by submitter"
      description: >
        For assets that have been submitted for approval and are currently pending, rejected or approved,
        the 'submitter_id' parameter accepts the submitting user's four-by-four identifier and will limit
        the results to those assets which have been submitted by that user.

        #### Examples
          - `?submitter_id=xzik-pf59`
      parameters:
        - $ref: '#/components/parameters/submitter_id'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
        "400":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/400 - Not a Four-by-Four Error'
  /catalog/v1?reviewer_id={4x4}:
    get:
      summary: "Find by reviewer"
      description: >
        For assets that have been submitted for approval and reviewed, and are currently rejected or approved,
        the 'reviewer_id' parameter accepts the reviewing user's four-by-four identifier and will limit
        the results to those assets which have been reviewed by that user.

        #### Examples
          - `?reviewer_id=r4qn-dwdd`
      parameters:
        - $ref: '#/components/parameters/reviewer_id'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
        "400":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/400 - Not a Four-by-Four Error'
  /catalog/v1?derived={true|false}:
    get:
      summary: "Find derived/base assets"
      description: >
        Some assets are uploaded directly and others are created from already existing data. For example, charts are
        derived from an existing parent dataset. The `derived` parameter will limit the results to one or other of these
        classes of data. A 'true' value finds derived assets and a 'false' value finds base assets.

        #### Examples
          - `?derived=true`
          - `?derived=false`
      parameters:
        - $ref: '#/components/parameters/derived'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
  /catalog/v1?order={sort_order}:
    get:
      summary: "Sort results"
      description: >
        The results of all the above filters can be sorted by any of the attributes in the list below. If not specified,
        the results are sorted by relevance. All sort values can optionally append a space and either 'ASC' or 'DESC'
        for ascending or descending sorts, but note that the space must be URL-escaped with '+' or '%20'.
        The default for each attribute is given in the table.

        It is possible for search results to have missing values for some of these sort fields (such as
        'domain_category', for example). Any assets missing a value altogether for the field being sorted
        on will show up at the end of the results list.

        <table>
          <thead>
            <tr>
              <th scope="col">Attribute</th>
              <th scope="col">Default Sort Order</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>relevance (default)</td>
              <td>descending</td>
            </tr>
            <tr>
              <td>name</td>
              <td>ascending</td>
            </tr>
            <tr>
              <td>owner</td>
              <td>ascending</td>
            </tr>
            <tr>
              <td>dataset_id</td>
              <td>ascending</td>
            </tr>
            <tr>
              <td>datatype</td>
              <td>ascending</td>
            </tr>
            <tr>
              <td>domain_category</td>
              <td>ascending</td>
            </tr>
            <tr>
              <td>createdAt</td>
              <td>descending</td>
            </tr>
            <tr>
              <td>updatedAt</td>
              <td>descending</td>
            </tr>
            <tr>
              <td>page_views_total</td>
              <td>descending</td>
            </tr>
            <tr>
              <td>page_views_last_month</td>
              <td>descending</td>
            </tr>
            <tr>
              <td>page_views_last_week</td>
              <td>descending</td>
            </tr>
          </tbody>
        </table>



        #### Examples
          - `?order=name`
          - `?order=dataset_id%20ASC`
          - `order=page_views_total+DESC`
      parameters:
        - $ref: '#/components/parameters/order'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
        "400":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/400 - Incorrect order Param Error'
  /catalog/v1?limit={number}&offset={number}:
    get:
      summary: "Paginate results"
      description: >
        The search service allows pagination of results.  By default, we will return at most 100 results
        starting from 0. Using the `limit` and `offset` params will return at most {limit} results starting
        from {offset}.


        If the sum of the `offset` and `limit` parameters is greater than 10000, the server will respond
        with a 400. If your use-case involves scanning over a large set of results, you will want to use
        the `scroll_id` parameter in conjunction with the `limit` parameter. For more detail, refer to
        [Deep scrolling results](#?route=get-/catalog/v1-limit--number--scroll_id--id-).

        #### Examples
          - `?limit=10&offset=0`
          - `?limit=10&offset=10`
          - `?limit=10&offset=20`
      parameters:
        - $ref: '#/components/parameters/limit'
        - $ref: '#/components/parameters/offset'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
        "400":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/400 - Too Much Data Requested Error'
  /catalog/v1?limit={number}&scroll_id={id}:
    get:
      summary: "Deep scroll results"
      description: >
        The search API is optimized for the prototypical use-case -- namely, providing some queries or
        filter conditions, and retrieving a relatively small number of search results. As a result, the
        search service does not support paging over a large set of search results. Specifically, if the sum
        of the `offset` and `limit` parameters is greater than 10000, the server will respond with
        a 400. This will happen regardless of the actual result set size. Larger result sets can be
        incrementally paged over via the `scroll_id` parameter.


        This parameter takes a value corresponding
        to an asset ID, specifically, the ID of the last result in the previously fetched chunk of
        results. So for example, suppose you execute a query and find that it returns a large set of
        results (ie. more than 10000). You should execute the same query again, including a reasonable
        value for the `limit` parameter, being sure to include the `scroll_id` parameter as well.
        Initially, you won't have a value for the `scroll_id` parameter, so you will leave it blank. But
        with each subsequent request, you should pass the asset id corresponding to the last result from
        the previously fetched batch of results.


        Note that sorting parameters are not honored when used in conjunction with deep scrolling via the
        `scroll_id` parameter. If the `order` or `offset` parameters are specified at the same time as the `scroll_id`
        parameter, the server will respond with a 400.

        #### Examples
          - `?limit=100&scroll_id`
          - `?limit=100&scroll_id=6rrk-xbdr`
      parameters:
        - $ref: '#/components/parameters/limit'
        - $ref: '#/components/parameters/scroll_id'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
        "400":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/400 - Disallowed order Param Error'
        "400+":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/400 - Disallowed offset Param Error'
  /catalog/v1?boost{key}={number}:
    get:
      summary: "Boost assets"
      description: >
        It is possible to adjust the rankings of assets to promote them above others.
        This leverages the weight function of
        [function score queries](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-function-score-query.html#function-weight).
        This weight acts as a multiplier for the relevance score of each document.
        Thus, a number between 0 and 1 will demote assets, while any number greater than 1 will boost them.


        Several parameters allow for different types of boosting. Some notes about the table below:

          - The Explanation assumes a greater than 1 value
          - Where you see {variable_name} in the Parameter, that requires substituting in a value. See the examples below.
          - The boost params `boostTitle`, `boostDesc` and `boostColumns` work in conjunction with the
            [`q` param](#?route=get-/catalog/v1-q--query--min_should_match--match_term-)

        <table>
          <thead>
            <tr>
              <th scope="col">Parameter</th>
              <th scope="col">Explanation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>boostOfficial</td>
              <td>Official assets boosted; community assets not</td>
            </tr>
            <tr>
              <td>boost{Datatype}</td>
              <td>Assets having the given {Datatype} boosted; others not</td>
            </tr>
            <tr>
              <td>boostDomains[{DomainName}]</td>
              <td>Assets from the given {DomainName} boosted; others not</td>
            </tr>
            <tr>
              <td>boostTitle</td>
              <td>Assets with titles matching the 'q' query boosted; others not</td>
            </tr>
            <tr>
              <td>boostDesc</td>
              <td>Assets with descriptions matching the 'q' query boosted; others not</td>
            </tr>
            <tr>
              <td>boostColumns</td>
              <td>Assets with column names matching the 'q' query boosted; others not</td>
            </tr>
          </tbody>
        </table>


        #### Examples
          - `?boostOfficial=3.6`
          - `?boostStories=2&boostMaps=3`
          - `?boostDomains[soda.demo.socrata.com]=2`
          - `?boostTitle=2&q=Lotto`
          - `?boostDesc=1.5&q=hospitalizations`
          - `?boostColumns=5.67&q=vendor`
      parameters:
        - $ref: '#/components/parameters/boostOfficial'
        - $ref: '#/components/parameters/boostDatatype'
        - $ref: '#/components/parameters/boostDomain'
        - $ref: '#/components/parameters/boostTitle'
        - $ref: '#/components/parameters/boostDesc'
        - $ref: '#/components/parameters/boostColumns'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Search Response'
  /catalog/v1/autocomplete?q={query}&deduplicate={true|false}:
    get:
      summary: "Autocomplete asset names"
      description: >
        The Discovery API supports autocomplete of asset names and tags. Using the autocomplete endpoint for asset names
        returns assets having titles that match the search query.
        Any of the filtering parameters described above may be used with the required `q` parameter. Note that while
        this endpoint mirrors the top-level search endpoint, the behavior of the `q` parameter
        differs slightly. Just as with the full search endpoint, it takes arbitrary text. However, the autocomplete
        search is restricted to the 'name' field of the asset (i.e. the asset title).
        Additionally, this autocomplete search can return different assets than the top-level search.
        An simplified explanation is that the former matches characters while the latter matches words.


        An additional and optional parameter, `deduplicate`, provides two different behaviors.
        If 'true', no asset title will appear more than once.
        If 'false', every matching asset is returned along with its four-by-four identifier.

        #### Examples
          - `?q=medi`
          - `?q=medi&deduplicate=true`
          - `?q=medi&deduplicate=false`
      parameters:
        - $ref: '#/components/parameters/q'
        - $ref: '#/components/parameters/deduplicate'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Autocomplete Titles Response'
  /catalog/v1/tags/autocomplete?q={query}:
    get:
      summary: "Autocomplete asset tags"
      description: >
        The Discovery API supports autocomplete of asset names and tags. Using the autocomplete endpoint for tags
        returns assets having tags that match the search query.
        Any of the filtering parameters described above may be used with the required `q` parameter. Note that while
        this endpoint mirrors the top-level search endpoint, the behavior of the `q` parameter
        differs slightly. Just as with the full search endpoint, it takes arbitrary text. However, the autocomplete
        search is restricted to the 'tags' field of the asset.

        #### Examples
          - `?q=medi`
      parameters:
        - $ref: '#/components/parameters/q'
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Autocomplete Tags Response'
  /catalog/v1/domains:
    get:
      summary: "Count assets by domain"
      description: >
        This endpoint mirrors the top-level endpoint, accepting any of the filtering params described above. It returns
        the count of assets matching the query grouped by domain. Providing no parameters returns the count of assets
        the user is able to view, subject to authentication, grouped by domain.

        #### Examples
          - `?`
          - `?audience=public&q=dog`
          - `?only=maps`
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Count by Domain Response'
  /catalog/v1/domain_tags:
    get:
      summary: "Count assets by tag"
      description: >
        This endpoint mirrors the top-level endpoint, accepting any of the filtering params described above. It returns
        the count of assets matching the query grouped by tag. Providing no parameters returns the count of assets
        the user is able to view, subject to authentication, grouped by tag.

        #### Examples
          - `?`
          - `?domains=data.texas.gov`
          - `?only=datasets&q=popul`
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Count by Tag Response'
  /catalog/v1/domain_categories:
    get:
      summary: "Count assets by category"
      description: >
        This endpoint mirrors the top-level endpoint, accepting any of the filtering params described above. It returns
        the count of assets matching the query grouped by category. Providing no parameters returns the count of assets
        the user is able to view, subject to authentication, grouped by category.

        #### Examples
          - `?`
          - `?domains=soda.demo.socrata.com`
          - `?provenance=official`
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Count by Category Response'
  /catalog/v1/domains/{domain}/facets:
    get:
      summary: "Count assets by facets"
      description: >
        This endpoint mirrors the top-level endpoint, accepting any of the filtering params described above. It returns
        the count of assets matching the query grouped by the following facets:

          - datatypes
          - categories
          - tags
          - provenance
          - custom metadata

        Providing no parameters returns the count of assets
        the user is able to view, subject to authentication, grouped by each facet.

        #### Examples
          - `?`
          - `?only=stories`
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: '#/components/responses/200 - Count by Facets Response'
components:
  parameters:
    ids:
      name: ids
      description: >
        The four-by-four identifier of an asset. A comma-separated list of IDs is supported.
        Repeated params are supported.<br><br>
      in: query
      schema:
        type: string
        example: 'ku42-jx2v'
    domains:
      name: domains
      description: >
        The domain name from which an asset comes. A comma-separated list of names is supported.
        Repeated params are supported.<br><br>
      in: query
      schema:
        type: string
        example: soda.demo.socrata.com
    search_context:
      name: search_context
      description: >
        A domain name that represents the named domain and all incoming federations.
        Required with category and tag search.<br><br>
      in: query
      schema:
        type: string
        example: soda.demo.socrata.com
    names:
      name: names
      description: >
        The title of an asset. Repeated params, with or without brackets, are supported. <br><br>
      in: query
      schema:
        type: string
        example: 'NYS+Attorney+Registrations'
    categories:
      name: categories
      description: >
        The category of an asset. Repeated params, with or without brackets, are supported. <br><br>
      in: query
      schema:
        type: string
        example: 'Recreation'
    tags:
      name: tags
      description: >
        Any of the tags on an asset. Repeated params, with or without brackets, are supported.<br><br>
      in: query
      schema:
        type: string
        example: 'Environment'
    only:
      name: only
      description: >
        The datatype of an asset. Singular or plural terms are accepted.
        A comma-separated list of types is supported. Repeated params, with or without brackets, are supported.<br><br>
      in: query
      schema:
        type: string
        enum:
          - chart
          - dataset
          - file
          - filter
          - link
          - map
          - measure
          - story
          - system_dataset
          - visualization
    custom-metadata_key:
      name: custom-metadata_key
      description: >
        The name 'custom-metadata_key' is meant to represent any custom metadata field-set and field. See
        [Find by domain-specific metadata](#?route=get-/catalog/v1--custom_metadata_key---value-)
        for more details.<br><br>
      in: query
      schema:
        type: string
        example: 'Albany%2C+City+of'
    attribution:
      name: attribution
      description: The case-sensitive name of the attributing entity.<br><br>
      in: query
      schema:
        type: string
        example: 'New%20York%20State%20Gaming%20Commission'
    license:
      name: license
      description: The case-sensitive license name.<br><br>
      in: query
      schema:
        type: string
        example: 'Public+Domain'
    q:
      name: q
      description: >
        For search, a token matching one from an asset's name, description, category, tags, column names,
        column fieldnames, column descriptions or attribution.<br><br>

        For autocomplete, a token matching either an asset's name or tags.<br><br>
      in: query
      schema:
        type: string
        example: 'pop'
    min_should_match:
      name: min_should_match
      description: >
        The number or percent of words that must match. Acceptable formats are defined
        [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-minimum-should-match.html).
        <br><br>
      in: query
      schema:
        type: string
        example: '-1'
    parent_ids:
      name: parent_ids
      description: >
        The four-by-four identifier of a parent asset having child assets. A comma-separated list of IDs is supported. 
        Repeated params are supported.<br><br>
      in: query
      schema:
        type: string
        example: 'ku42-jx2v'
    derived_from:
      name: derived_from
      description: >
        The four-by-four identifier of an asset from which other assets are derived.<br><br>
      in: query
      schema:
        type: string
        example: '8f6m-78bg'
    provenance:
      name: provenance
      description: The provenance of an asset.<br><br>
      in: query
      schema:
        type: string
        enum:
          - official
          - community
    for_user:
      name: for_user
      description: >
        The four-by-four identifier of a user who owns data. A comma-separated list of IDs is supported.
        Repeated params are supported.<br><br>
      in: query
      schema:
        type: string
        example: 'xzik-pf59'
    shared_to:
      name: shared_to
      description: >
        The four-by-four identifier of a user who is shared data. A comma-separated list of IDs is supported.
        Repeated params are supported. <br><br>
      in: query
      schema:
        type: string
        example: 'xzik-pf59'
    column_names:
      name: column_names
      description: >
        The name of a column within a dataset. Repeated params, with or without brackets, are supported.<br><br>
      in: query
      schema:
        type: string
        example: 'winning+numbers'
    visibility:
      name: visibility
      description: The visibility of an asset.<br><br>
      in: query
      schema:
        type: string
        enum:
          - open
          - internal
    show_visibility:
      name: show_visibility
      description: Whether to include visibility information in the response.<br><br>
      in: query
      schema:
        type: boolean
        enum:
          - true
          - false
    audience:
      name: audience
      description: The audience of an asset.<br><br>
      in: query
      schema:
        type: string
        enum:
          - public
          - site
          - private
    published:
      name: published
      description: Whether the asset is published or not.<br><br>
      in: query
      schema:
        type: boolean
        enum:
          - true
          - false
    explicitly_hidden:
      name: explicitly_hidden
      description: Whether the asset is hidden from the public catalog or not.<br><br>
      in: query
      schema:
        type: boolean
        enum:
          - true
          - false
    approval_status:
      name: approval_status
      description: >
        The internal or public approval status of an asset. Combine with a `target_audience=public` or
        `target_audience=internal` parameter to limit to the approval status of public-bound or internal-bound data.
        A comma-separated list of statuses is supported. Repeated params, with or without brackets, are supported.
        <br><br>
      in: query
      schema:
        type: string
        enum:
          - approved
          - pending
          - rejected
          - not_ready
    target_audience:
      name: target_audience
      description: >
        The audience a submitted asset desires if approved. Combine with the `approval_status` parameter to limit to
        particular stages of the approval process.
        A comma-separated list of statuses is supported. Repeated params, with or without brackets, are supported.
        <br><br>
      in: query
      schema:
        type: string
        enum:
          - public
          - internal
    submitter_id:
      name: submitter_id
      description: >
        The four-by-four identifier of a user who has submitted an asset for approval.<br><br>
      in: query
      schema:
        type: string
        example: 'ku42-jx2v'
    reviewer_id:
      name: reviewer_id
      description: >
        The four-by-four identifier of a user who has submitted an asset for approval.<br><br>
      in: query
      schema:
        type: string
        example: 'ku42-jx2v'
    derived:
      name: derived
      description: Whether the asset was derived from another or uploaded directly.<br><br>
      in: query
      schema:
        type: boolean
        enum:
          - true
          - false
    order:
      name: order
      description: >
        The field to sort assets by. Optionally append a space and 'ASC' or 'DESC' to direct the sort.<br><br>
      in: query
      schema:
        type: string
        default: 'relevance'
        enum:
          - relevance
          - name
          - owner
          - dataset_id
          - datatype
          - domain_category
          - createdAt
          - updatedAt
          - page_views_total
          - page_views_last_month
          - page_views_last_week
    offset:
      name: offset
      description: The starting point for paging.<br><br>
      in: query
      schema:
        type: number
        default: 0
        example: 10
        minimum: 0
        maximum: 10000
    limit:
      name: limit
      description: The max number of results to return.<br><br>
      in: query
      schema:
        type: number
        default: 100
        example: 10
        minimum: 0
        maximum: 10000
    scroll_id:
      name: scroll_id
      description: >
        Initially empty, but afterwards, the four-by-four identifier of the final asset in the current results.<br><br>
      in: query
      schema:
        type: string
        example: '6rrk-xbdr'
    boostOfficial:
      name: boostOfficial
      description: Multiplier for the relevance score of official assets.<br><br>
      in: query
      schema:
        type: number
        example: 2.3
    boostDatatype:
      name: boost{Datatype}
      description: >
        Multiplier for the relevance score of assets with the given {Datatype}. A parameter name for example is
        `boostStories` or `boostMaps`.<br><br>
      in: query
      schema:
        type: number
        example: 3
    boostDomain:
      name: boostDomains[{DomainName}]
      description: >
        Multiplier for the relevance score of assets from the given {DomainName}. A parameter name for example is
        `boostDomains[soda.demo.socrata.com]` or `boostDomains[data.texas.gov]`.<br><br>
      in: query
      schema:
        type: number
        example: .5
    boostTitle:
      name: boostTitle
      description: >
        Multiplier for the relevance score of assets having a title that matches the given query.
        Use with the `q` parameter to define the query.<br><br>
      in: query
      schema:
        type: number
        example: 1.2
    boostDesc:
      name: boostDesc
      description: >
        Multiplier for the relevance score of assets having a description that matches the given query.
        Use with the `q` parameter to define the query.<br><br>
      in: query
      schema:
        type: number
        example: -2
    boostColumns:
      name: boostDesc
      description: >
        Multiplier for the relevance score of assets having column names that matches the given query.
        Use with the `q` parameter to define the query.<br><br>
      in: query
      schema:
        type: number
        example: 8
    deduplicate:
      name: deduplicate
      description: >
        Whether the results returned from autocomplete return distinct titles or not. When 'false', asset
        ids are returned in addition to the typical response.<br><br>
      in: query
      schema:
        type: boolean
        enum:
          - true
          - false
  schemas:
    Page Views:
      type: object
      description: The set of page view data for the asset.
      properties:
        page_views_last_week:
          type: integer
          description: >
            The number of views the asset has had in the last week.<br><br>
            Sort by this field [here](#?route=get-/catalog/v1-order--sort_order-).<br><br>
          example: 581
        page_views_last_month:
          type: integer
          description: >
            The number of views the asset has had in the last month.<br><br>
            Sort by this field [here](#?route=get-/catalog/v1-order--sort_order-).<br><br>
          example: 3763
        page_views_total:
          type: integer
          description: >
            The number of views the asset has ever had.<br><br>
            Sort by this field [here](#?route=get-/catalog/v1-order--sort_order-).<br><br>
          example: 5920905
        page_views_last_week_log:
          type: number
          description: >
            The base 2 log of the number of views the asset has had in the last week plus 1.<br><br>
          example: 9.184875342908285
        page_views_last_month_log:
          type: number
          description: >
            The base 2 log of the number of views the asset has had in the last month plus 1.<br><br>
          example: 11.878050912728536
        page_views_total_log:
          type: number
          description: >
            The base 2 log of the number of views the asset has ever had plus 1.<br><br>
          example: 22.49738651911404
    Resource:
      type: object
      description: Primary metadata about the asset.
      properties:
        name:
          type: string
          description: >
            The name of the asset.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-names--name-).<br>
            Search within this field [here](#?route=get-/catalog/v1-q--query--min_should_match--match_term-).<br>
            Sort by this field [here](#?route=get-/catalog/v1-order--sort_order-).<br>
            Autocomplete this field [here](#?route=get-/catalog/v1/autocomplete-q--query--deduplicate--true|false-).
            <br><br>
          example: 'Lottery Cash 4 Life Winning Numbers: Beginning 2014'
        id:
          type: string
          description: >
            The four-by-four identifier of the asset.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-ids--4x4-).<br>
            Sort by this field [here](#?route=get-/catalog/v1-order--sort_order-).<br><br>
          example: 'kwxv-fwze'
        description:
          type: string
          description: >
            The description of the asset or "" if not provided.<br><br>
            Search within this field [here](#?route=get-/catalog/v1-q--query--min_should_match--match_term-).<br><br>
          example: 'Go to http://on.ny.gov/1xRIvPz on the New York Lottery website for past Cash 4 Life results and payouts.'
        parent_fxf:
          type: array
          description: An array of parent four-by-fours; or empty if the asset has none.
          items:
            type: string
            description: >
              The four-by-four identifier of the asset's parent.<br><br>
              Search by this field [here](#?route=get-/catalog/v1-parent_ids--4x4-).<br><br>
            example: 'nhjr-rpi2'
        attribution:
          type: string
          description: >
            The organization to which the asset is attributed; or null if not provided.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-attribution--organization-).<br>
            Search within this field [here](#?route=get-/catalog/v1-q--query--min_should_match--match_term-).<br><br>
          example: 'New York State Gaming Commission'
        attribution_link:
          type: string
          description: >
            The link provided by the organization to which the asset is attributed; or null if not provided.<br><br>
          example: 'http://nylottery.ny.gov/wps/portal/Home/Lottery/home/your+lottery/drawing+results/drawingresults_cash4life'
        contact_email:
          type: string
          description: >
            The email address to contact if there are questions/comments about the asset; or null if not provided.
            <br><br>
          example: 'opendata@its.ny.gov'
        type:
          type: string
          description: >
            The datatype of the asset.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-only--type-).<br>
            Sort by this field [here](#?route=get-/catalog/v1-order--sort_order-).<br><br>
          example: 'dataset'
        updatedAt:
          type: string
          description: >
            The timestamp at which the asset was last updated.<br><br>
            Sort by this field [here](#?route=get-/catalog/v1-order--sort_order-).<br><br>
          example: '2024-08-02T10:03:06.000Z'
        createdAt:
          type: string
          description: >
            The timestamp at which the asset was created.<br><br>
            Sort by this field [here](#?route=get-/catalog/v1-order--sort_order-).<br><br>
          example: '2014-06-17T19:47:54.000Z'
        metadata_updated_at:
          type: string
          description: >
            The timestamp at which the asset's metadata (vs. data) was last updated.<br><br>
          example: '2024-08-02T10:03:05.000Z'
        data_updated_at:
          type: string
          description: >
            The timestamp at which the asset's data (vs. metadata) was last updated.<br><br>
          example: '2024-08-02T10:03:06.000Z'
        publication_date:
          type: string
          description: >
            The timestamp at which the asset was last published.<br><br>
          example: '2021-04-27T14:13:45.000Z'
        page_views:
          $ref: '#/components/schemas/Page Views'
        columns_name:
          type: array
          description: An array of column names; or empty if asset has no columns.
          items:
            type: string
            description: >
              The display name of a column of the asset.<br><br>
              Search within this field [here](#?route=get-/catalog/v1-q--query--min_should_match--match_term-).<br><br>
            example: 'Winning Numbers'
        columns_field_name:
          type: array
          description: An array of column field names; or empty if asset has no columns.
          items:
            type: string
            description: >
              The field name of a column of the asset, used for api access.<br><br>
              Search within this field [here](#?route=get-/catalog/v1-q--query--min_should_match--match_term-).<br><br>
            example: 'winning_numbers'
        columns_datatype:
          type: array
          description: >
            An array of column datatypes; or empty if asset has no columns.
          items:
            type: string
            description: >
              The datatype of a column of the asset.<br><br>
            example: 'Text'
        columns_description:
          type: array
          description: An array of column descriptions; or empty if asset has no columns.
          items:
            type: string
            description: >
              The description of a column of the asset; or "" if not provided.<br><br>
              Search within this field [here](#?route=get-/catalog/v1-q--query--min_should_match--match_term-).<br><br>
            example: 'Winning numbers'
        columns_formats:
          type: array
          description: >
            An array of column formats; or empty if asset has no columns.
          items:
            type: object
            description: >
              An object of several different formatting keys, values; or {} if none provided.<br><br>
            example: '{"align": "center"}'
        download_count:
          type: integer
          description: >
            The number of times the asset has been downloaded.<br><br>
          example: 210231
        provenance:
          type: string
          description: >
            Indicates whether the asset was created by a community user or a roled user.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-provenance--provenance-).<br><br>
          enum:
            - official
            - community
        locked:
          type: boolean
          description: >
            Whether the asset is locked against making changes to the asset.<br><br>
          enum:
            - true
            - false
        blob_mime_type:
          type: string
          description: >
            The mimeType of the blob contained by a file asset; or null if the asset is not a file.<br><br>
          example: 'text/plain; charset=us-ascii'
        hide_from_data_json:
          type: boolean
          description: >
            Whether this document has been marked to (not) appear in the data.json output of its domain.<br><br>
          enum:
            - true
            - false
        lens_view_type:
          deprecated: true
          description: Replaced by 'type' field denoting the asset's datatype.
        lens_display_type:
          deprecated: true
          description: Replaced by 'type' field denoting the asset's datatype.
    Classification:
      type: object
      description: Category, tags and custom metadata for the asset.
      properties:
        categories:
          deprecated: true
          description: >
            In the past, assets were assigned a domain-independent category. Thus older
            assets may have this field and newer assets will not.
        tags:
          deprecated: true
          description: >
            In the past, assets were assigned a domain-independent tag. Thus older
            assets may have this field and newer assets will not.
        domain_category:
          type: string
          description: >
            The category of the asset; or not present in the response if not provided.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-search_context--search_context--categories--category-).<br>
            Search within this field [here](#?route=get-/catalog/v1-q--query--min_should_match--match_term-).<br>
            Sort by this field [here](#?route=get-/catalog/v1-order--sort_order-).<br><br>
          example: 'Government & Finance'
        domain_tags:
          type: array
          description: An array of asset tags; or empty if the asset has none.
          items:
            type: string
            description: >
              One of the tags given to the asset.<br><br>
              Search by this field [here](#?route=get-/catalog/v1-search_context--search_context--tags--tag-).<br>
              Search within this field [here](#?route=get-/catalog/v1-q--query--min_should_match--match_term-).<br>
              Autocomplete this field [here](#?route=get-/catalog/v1/tags/autocomplete-q--query-).<br><br>
            example: 'cash 4 life'
        domain_metadata:
          type: array
          description: >
            An array of key/value objects containing the custom metadata of the asset;
            or empty if asset has no custom metadata.<br><br>
            Search by this field [here](#?route=get-/catalog/v1--custom_metadata_key---value-).<br><br>
          items:
            type: object
            properties:
              key:
                type: string
                description: >
                  The custom metadata key that can be used as a parameter with custom metadata search.<br><br>
                example: 'Dataset-Information_Agency'
              value:
                type: string
                description: >
                  The custom metadata value.<br><br>
                example: 'Gaming Commission, New York State'
    Approval:
      type: object
      description: Approval information for the asset relative to the given target_audience
      properties:
        state:
          type: string
          description: >
            The approvals state of the asset.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-approval_status--approved|rejected|pending|not_ready--target_audience--public|internal-).<br><br>
          enum:
            - approved
            - rejected
            - pending
            - not_ready
        target_audience:
          type: string
          description: >
            The audience the asset would like if approved.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-approval_status--approved|rejected|pending|not_ready--target_audience--public|internal-).<br><br>
          enum:
            - public
            - internal
        submission_outcome:
          type: string
          description: >
            The outcome of approval for the asset;
            or null if the asset is not submitted.<br><br>
          enum:
            - change_audience
            - update_published_asset
        submitted_at:
          type: string
          description: >
            The timestamp at which the asset was submitted for approval;
            or null if the asset is not submitted.<br><br>
          example: '2019-07-24T10:01:19.000Z'
        submitter_id:
          type: string
          description: >
            The four-by-four identifier of the user who submitted the asset;
            or null if the asset is not submitted.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-submitter_id--4x4-).<br><br>
          example: 'xzik-pf59'
        submitter_name:
          type: string
          description: >
            The display name of the user who submitted the asset;
            or null if the asset is not submitted.<br><br>
          example: 'NY Open Data'
        submission_id:
          type: string
          description: >
            The identifier of the submission of the asset;
            or null if the asset is not submitted.<br><br>
          example: 'NY Open Data'
        reviewed_automatically:
          type: boolean
          description: >
            Whether the asset was automatically approved vs manually approved;
            or null if the asset is not submitted.<br><br>
          enum:
            - true
            - false
        reviewed_at:
          type: string
          description: >
            The timestamp at which the asset was reviewed for approval;
            or null if the asset is not submitted or reviewed.<br><br>
          example: '2019-07-24T10:01:19.000Z'
        reviewer_id:
          type: string
          description: >
            The four-by-four identifier of the user who reviewed the asset;
            or null if the asset is not submitted or reviewed
            or null if the asset was automatically reviewed.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-reviewer_id--4x4-).<br><br>
          example: 'r4qn-dwdd'
        reviewer_name:
          type: string
          description: >
            The display name of the user who reviewed the asset;
            or null if the asset is not submitted or reviewed
            or null if the asset was automatically reviewed. <br><br>
          example: 'Ministerio de Tecnologías de la Información y las Comunicaciones- MINTIC'
        outcome_application_status:
          type: string
          description: >
            The status of applying the 'submission_outcome' to the asset;
            or null if the asset is not submitted and approved. <br><br>
          enum:
            - success
            - failure
            - in_progress
            - unclaimed
    Metadata:
      type: object
      description: Secondary metadata about the asset.
      properties:
        domain:
          type: string
          description: >
            The domain the asset belongs to.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-search_context--domain--domains--domain-).<br><br>
          example: 'soda.demo.socrata.com'
        license:
          type: string
          description: >
            The license the asset is release under; or not present in the response if not provided.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-license--license-).<br><br>
          example: 'Public+Domain'
        is_public:
          type: boolean
          description: >
            Whether the asset is public; only present when using the `show_visibility=true` param.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-audience--audience-).<br><br>
          enum:
            - true
            - false
        is_published:
          type: boolean
          description: >
            Whether the asset is published; only present when using the `show_visibility=true` param.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-published--true|false-).<br><br>
          enum:
            - true
            - false
        is_hidden:
          type: boolean
          description: >
            Whether the asset is hidden from the public catalog;
            only present when using the `show_visibility=true` param.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-explicitly_hidden--true|false-).<br><br>
          enum:
            - true
            - false
        approvals:
          type: array
          description: For each target_audience, the approvals information for the asset.
          items:
            $ref: '#/components/schemas/Approval'
        visible_to_anonymous:
          type: boolean
          description: >
            Whether the asset can be viewed by anonymous users;
            only present when using the `show_visibility=true` param.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-visibility--visibility--show_visibility--true|false-).<br><br>
          enum:
            - true
            - false
        visible_to_site:
          type: boolean
          description: >
            Whether the asset can be viewed by all of the roled users on the asset's domain;
            only present when using the `show_visibility=true` param.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-audience--audience-).<br><br>
          enum:
            - true
            - false
        is_derived:
          type: boolean
          description: >
            Whether the asset is derived from another;
            only present when using the `show_visibility=true` param.<br><br>
            Search by this field [here](#?route=get-/catalog/v1-derived--true|false-).<br><br>
          enum:
            - true
            - false
    Owner:
      type: object
      description: User data about the user who owns the asset.
      properties:
        id:
          type: string
          description: >
            The four-by-four identifier of the user.<br><br>
            Search by this field[here](#?route=get-/catalog/v1-for_user--4x4-).<br>
            Sort by this field [here](#?route=get-/catalog/v1-order--sort_order-).<br><br>
          example: 'xzik-pf59'
        display_name:
          type: string
          description: The display name of the user.<br><br>
          example: 'NY Open Data'
    Creator:
      type: object
      description: User data about the user who created the asset.
      properties:
        id:
          type: string
          description: The four-by-four identifier of the user.<br><br>
          example: 'xzik-pf59'
        display_name:
          type: string
          description: The display name of the user.<br><br>
          example: 'NY Open Data'
    Asset:
      type: object
      description: The representation of an asset.
      properties:
        resource:
          $ref: '#/components/schemas/Resource'
        classification:
          $ref: '#/components/schemas/Classification'
        metadata:
          $ref: '#/components/schemas/Metadata'
        owner:
          $ref: '#/components/schemas/Owner'
        creator:
          $ref: '#/components/schemas/Creator'
        permalink:
          type: string
          description: The permanent link of the asset.<br><br>
          example: 'https://soda.demo.socrata.com/d/kwxv-fwze'
        link:
          type: string
          description: The prettier, but non-permanent, link of the asset.<br><br>
          example: 'https://soda.demo.socrata.com/Government-Finance/Lottery-Cash-4-Life-Winning-Numbers-Beginning-2014/kwxv-fwze'
    Timings:
      type: object
      description: Timing information for returning the user's query.
      properties:
        serviceMillis:
          type: number
          description: The number of milliseconds needed to return the API response.<br><br>
          example: 71
        searchMillis:
          type: array
          items:
            type: number
            description: The number of milliseconds needed to fetch the data.<br><br>
            example: 8
    MatchOffsets:
      type: array
      description: The location of the match.
      items:
        type: "object"
        properties:
          start:
            type: "number"
            description: Where the matched query term starts, as a character count, in the associated asset field.<br><br>
            example: 0
          length:
            type: "number"
            description: The number of characters the matched query term has.<br><br>
            example: 4
    TitleMatch:
      type: object
      description: Matching titles and where along the asset's title the match occurred.
      properties:
        title:
          type: string
          description: The raw title of the matching asset.<br><br>
          example: 'Medicaid Enrolled Provider Listing'
        display_title:
          type: string
          description: An html marked up variant of the raw title that provides highlighting.<br><br>
          example: '<span class=highlight>Medi</span>caid Enrolled Provider Listing'
        id:
          type: string
          description: >
            The four-by-four identifier of the matching asset;
            only present when using the `deduplicate=false` param.<br><br>
          example: 'keti-qx5t'
        match_offsets:
          type: array
          description: An array of indices defining the location of the match.
          items:
            $ref: '#/components/schemas/MatchOffsets'
    TagMatch:
      type: object
      description: Matching tags and where along the asset's tag the match occurred.
      properties:
        tag_text:
          type: string
          description: The tag of the matching asset.<br><br>
          example: 'medicare'
        matches:
          type: array
          description: An array of indices defining the location of the match.
          items:
            $ref: '#/components/schemas/MatchOffsets'
    DomainAndCount:
      type: object
      description: The domain and the count of matching assets.
      properties:
        domain:
          type: string
          description: The domain's name.<br><br>
          example: 'soda.demo.socrata.com'
        count:
          type: integer
          description: The count of assets from the named domain.<br><br>
          example: 1488
    TagAndCount:
      type: "object"
      description: The tag and the count of matching assets.
      properties:
        domain_tag:
          type: string
          description: The tag.<br><br>
          example: 'oceans'
        count:
          type: integer
          description: The count of assets having the tag.<br><br>
          example: 12076
    CategoryAndCount:
      type: "object"
      description: The category and the count of matching assets.
      properties:
        domain_category:
          type: string
          description: The category.<br><br>
          example: 'Health'
        count:
          type: integer
          description: The count of assets having the category.<br><br>
          example: 3590
    ValueAndCount:
      type: "object"
      description: The facet value and the count of assets having that value.
      properties:
        value:
          type: string
          description: The facet value.<br><br>
          example: 'dataset'
        count:
          type: integer
          description: The count of assets having the value for that facet.<br><br>
          example: 806
    FacetAndCount:
      type: "object"
      description: The facet and the count of assets having that facet.
      properties:
        facet:
          type: string
          description: The facet class.<br><br>
          example: 'datatypes'
        count:
          type: integer
          description: The count of assets in the facet class.<br><br>
          example: 806
        values:
          type: array
          items:
            $ref: '#/components/schemas/ValueAndCount'
  responses:
    200 - Search Response:
      type: object
      description: The response from a query to api/catalog.
      properties:
        results:
          type: array
          description: >
            An array of the assets returned from a query.<br><br>
            Paginate results [here](#?route=get-/catalog/v1-limit--number--offset--number-).<br>
            Scroll through results [here](#?route=get-/catalog/v1-limit--number--scroll_id--id-).
          items:
            $ref: '#/components/schemas/Asset'
        resultSetSize:
          type: number
          description: >
            The total number of assets that could be returned from a query. This will only equal the size of
            the `results` array if the total number is fewer than the given or default `limit` param.<br><br>
          example: 1
        timings:
          $ref: '#/components/schemas/Timings'
    200 - Autocomplete Titles Response:
      type: object
      description: The response from a query to api/catalog/v1/autocomplete.
      properties:
        results:
          type: array
          description: An array of the autocomplete matches from a query.
          items:
            $ref: '#/components/schemas/TitleMatch'
        resultSetSize:
          type: number
          description: >
            The total number of matches that could be returned from a query. This will only equal the size
            of the `results` array if the total number is fewer than the given or default `limit` param.<br><br>
          example: 1
        timings:
          $ref: '#/components/schemas/Timings'
    200 - Autocomplete Tags Response:
      type: object
      description: The response from a query to api/catalog/v1/tags/autocomplete.
      properties:
        results:
          type: array
          description: An array of the autocomplete matches from a query.
          items:
            $ref: '#/components/schemas/TagMatch'
        resultSetSize:
          type: number
          description: The total number of matches that could be returned from a query.<br><br>
          example: 1
        timings:
          $ref: '#/components/schemas/Timings'
    200 - Count by Domain Response:
      type: object
      description: The response from a query to api/catalog/v1/domains.
      properties:
        results:
          type: array
          description: An array of domains and counts.
          items:
            $ref: '#/components/schemas/DomainAndCount'
        resultSetSize:
          type: number
          description: The total number of domains returned.<br><br>
          example: 1
        timings:
          $ref: '#/components/schemas/Timings'
    200 - Count by Tag Response:
      type: object
      description: The response from a query to api/catalog/v1/domain_tags.
      properties:
        results:
          type: array
          description: An array of tags and counts.
          items:
            $ref: '#/components/schemas/TagAndCount'
        resultSetSize:
          type: number
          description: The total number of tags returned.<br><br>
          example: 1
        timings:
          $ref: '#/components/schemas/Timings'
    200 - Count by Category Response:
      type: object
      description: The response from a query to api/catalog/v1/domain_categories.
      properties:
        results:
          type: array
          description: An array of categories and counts.
          items:
            $ref: '#/components/schemas/CategoryAndCount'
        resultSetSize:
          type: number
          description: The total number of categories returned.<br><br>
          example: 1
        timings:
          $ref: '#/components/schemas/Timings'
    200 - Count by Facets Response:
      type: array
      description: The response from a query to api/catalog/v1/domains/{domainName}/facets.
      items:
        $ref: '#/components/schemas/FacetAndCount'
    401 - Unauthorized to Search Users Error:
      type: object
      description: The error returned when a user is unauthorized to search assets shared to a particular user.
      properties:
        error:
          type: string
          description: The error message.<br><br>
          example: "User is not authorized to search assets shared to xzik-pf59"
    401 - Unauthorized to Search NonPublic Data Error:
      type: object
      description: The error returned when a user is unauthorized to search for private assets.
      properties:
        error:
          type: string
          description: The error message.<br><br>
          example: "User is not authorized to search private assets"
    400 - Not an Asset Four-by-Four Error:
      type: object
      description: The error returned when a four-by-four parameter does not identify an asset.
      properties:
        error:
          type: string
          description: The error message.<br><br>
          example: "Id 'ku42jx2v' is incorrectly formatted and will not identify any asset."
    400 - Not a Four-by-Four Error:
      type: object
      description: The error returned when a four-by-four parameter is incorrectly formatted.
      properties:
        error:
          type: string
          description: The error message.<br><br>
          example: "requirement failed: Id 'xzik' is not correctly formatted as a 4x4"
    404 - Domain Not Found Error:
      type: object
      description: The error returned when a provided domain is not found.
      properties:
        error:
          type: string
          description: The error message.<br><br>
          example: 'Domain not found: data.ny.org.'
    400 - Incorrect visibility Param Error:
      type: object
      description: The error returned when an incorrect visibility parameter is given.
      properties:
        error:
          type: string
          description: The error message.<br><br>
          example: "'visibility' must be one List(open, internal); got public"
    400 - Incorrect audience Param Error:
      type: object
      description: The error returned when an incorrect audience parameter is given.
      properties:
        error:
          type: string
          description: The error message.<br><br>
          example: "'audience' must be one List(public, private, site); got everybody"
    400 - Incorrect approval_status Param Error:
      type: object
      description: The error returned when an incorrect approval_status parameter is given.
      properties:
        error:
          type: string
          description: The error message.<br><br>
          example: "'approval_status' must be one of List(approved, pending, rejected, not_ready); got good"
    400 - Incorrect target_audience Param Error:
      type: object
      description: The error returned when an incorrect target_audience parameter is given.
      properties:
        error:
          type: string
          description: The error message.<br><br>
          example: "'target_audience' must be one of List(public, internal); got everybody"
    400 - Incorrect order Param Error:
      type: object
      description: The error returned when an incorrect order parameter is given.
      properties:
        error:
          type: string
          description: The error message.<br><br>
          example: "'popularity' is not a supported sort"
    400 - Too Much Data Requested Error:
      type: object
      description: The error returned when the combination of the offset and limit parameters exceeds 10,000.
      properties:
        error:
          type: string
          description: The error message.<br><br>
          example: "Sum of `offset` and `limit` cannot exceed 10000. Please Deep scroll results instead."
    400 - Disallowed order Param Error:
      type: object
      description: The error returned when the both scroll_id and order parameters are given.
      properties:
        error:
          type: string
          description: The error message.<br><br>
          example: "The `order` and `scroll_id` parameters cannot both be specified"
    400 - Disallowed offset Param Error:
      type: object
      description: The error returned when the both scroll_id and offset parameters are given.
      properties:
        error:
          type: string
          description: "The error message"
          example: "The `offset` and `scroll_id` parameters cannot both be specified"

```


# PART 3 — US Census API (ACS 5-year), TIGERweb, Census Geocoder


Source: https://api.census.gov/data/2024/acs/acs5/variables/B01003_001E.json

```json
{
  "name": "B01003_001E",
  "label": "Estimate!!Total",
  "concept": "Total Population",
  "predicateType": "int",
  "group": "B01003",
  "limit": 0,
  "attributes": "B01003_001EA,B01003_001M,B01003_001MA"
}
```

Source: https://api.census.gov/data/2024/acs/acs5/variables/B11001_001E.json

```json
{
  "name": "B11001_001E",
  "label": "Estimate!!Total:",
  "concept": "Household Type (Including Living Alone)",
  "predicateType": "int",
  "group": "B11001",
  "limit": 0,
  "attributes": "B11001_001EA,B11001_001M,B11001_001MA"
}
```

---

Source: https://api.census.gov/data/2024/acs/acs5/geography.html

Census Data API: /data/2024/acs/acs5/geography

Census Data API: FIPS Geographies in /data/2024/acs/acs5/geography
 |

 | Reference Date | Geography Level | Geography Hierarchy | Limit

 | 65 items

 | 2024-01-01 | 010 | us |

 | 2024-01-01 | 020 | region |

 | 2024-01-01 | 030 | division |

 | 2024-01-01 | 040 | state |

 | 2024-01-01 | 050 | state› county |

 | 2024-01-01 | 060 | state› county› county subdivision |

 | 2024-01-01 | 067 | state› county› county subdivision› subminor civil division |

 | 2024-01-01 | 070 | state› county› county subdivision› place/remainder (or part) |

 | 2024-01-01 | 140 | state› county› tract |

 | 2024-01-01 | 150 | state› county› tract› block group |

 | 2024-01-01 | 155 | state› place› county (or part) |

 | 2024-01-01 | 160 | state› place |

 | 2024-01-01 | 170 | state› consolidated city |

 | 2024-01-01 | 172 | state› consolidated city› place (or part) |

 | 2024-01-01 | 230 | state› alaska native regional corporation |

 | 2024-01-01 | 250 | american indian area/alaska native area/hawaiian home land |

 | 2024-01-01 | 251 | american indian area/alaska native area/hawaiian home land› tribal subdivision/remainder |

 | 2024-01-01 | 252 | american indian area/alaska native area (reservation or statistical entity only) |

 | 2024-01-01 | 254 | american indian area (off-reservation trust land only)/hawaiian home land |

 | 2024-01-01 | 256 | american indian area/alaska native area/hawaiian home land› tribal census tract |

 | 2024-01-01 | 258 | american indian area/alaska native area/hawaiian home land› tribal census tract› tribal block group |

 | 2024-01-01 | 260 | american indian area/alaska native area/hawaiian home land› state (or part) |

 | 2024-01-01 | 269 | american indian area/alaska native area/hawaiian home land› state (or part)› place/remainder (or part) |

 | 2024-01-01 | 270 | american indian area/alaska native area/hawaiian home land› state (or part)› county (or part) |

 | 2024-01-01 | 280 | state› american indian area/alaska native area/hawaiian home land (or part) |

 | 2024-01-01 | 283 | state› american indian area/alaska native area (reservation or statistical entity only) (or part) |

 | 2024-01-01 | 286 | state› american indian area (off-reservation trust land only)/hawaiian home land (or part) |

 | 2024-01-01 | 290 | american indian area/alaska native area/hawaiian home land› tribal subdivision/remainder› state (or part) |

 | 2024-01-01 | 291 | american indian area/alaska native area (reservation or statistical entity only)› tribal census tract (or part) |

 | 2024-01-01 | 292 | american indian area (off-reservation trust land only)/hawaiian home land› tribal census tract (or part) |

 | 2024-01-01 | 293 | american indian area/alaska native area (reservation or statistical entity only)› tribal census tract (or part)› tribal block group (or part) |

 | 2024-01-01 | 294 | american indian area (off-reservation trust land only)/hawaiian home land› tribal census tract (or part)› tribal block group (or part) |

 | 2024-01-01 | 310 | metropolitan statistical area/micropolitan statistical area |

 | 2024-01-01 | 311 | metropolitan statistical area/micropolitan statistical area› state (or part) |

 | 2024-01-01 | 312 | metropolitan statistical area/micropolitan statistical area› state (or part)› principal city (or part) |

 | 2024-01-01 | 313 | metropolitan statistical area/micropolitan statistical area› state (or part)› county |

 | 2024-01-01 | 314 | metropolitan statistical area/micropolitan statistical area› metropolitan division |

 | 2024-01-01 | 315 | metropolitan statistical area/micropolitan statistical area› metropolitan division› state (or part) |

 | 2024-01-01 | 316 | metropolitan statistical area/micropolitan statistical area› metropolitan division› state (or part)› county |

 | 2024-01-01 | 320 | state› metropolitan statistical area/micropolitan statistical area (or part) |

 | 2024-01-01 | 321 | state› metropolitan statistical area/micropolitan statistical area (or part)› principal city (or part) |

 | 2024-01-01 | 322 | state› metropolitan statistical area/micropolitan statistical area (or part)› county |

 | 2024-01-01 | 323 | state› metropolitan statistical area/micropolitan statistical area (or part)› metropolitan division (or part) |

 | 2024-01-01 | 324 | state› metropolitan statistical area/micropolitan statistical area (or part)› metropolitan division (or part)› county |

 | 2024-01-01 | 330 | combined statistical area |

 | 2024-01-01 | 331 | combined statistical area› state (or part) |

 | 2024-01-01 | 332 | combined statistical area› metropolitan statistical area/micropolitan statistical area |

 | 2024-01-01 | 333 | combined statistical area› metropolitan statistical area/micropolitan statistical area› state (or part) |

 | 2024-01-01 | 340 | state› combined statistical area (or part) |

 | 2024-01-01 | 341 | state› combined statistical area (or part)› metropolitan statistical area/micropolitan statistical area (or part) |

 | 2024-01-01 | 400 | urban area |

 | 2024-01-01 | 410 | urban area› state (or part) |

 | 2024-01-01 | 430 | urban area› state (or part)› county (or part) |

 | 2024-01-01 | 500 | state› congressional district |

 | 2024-01-01 | 510 | state› congressional district› county (or part) |

 | 2024-01-01 | 550 | state› congressional district› american indian area/alaska native area/hawaiian home land (or part) |

 | 2024-01-01 | 610 | state› state legislative district (upper chamber) |

 | 2024-01-01 | 612 | state› state legislative district (upper chamber)› county (or part) |

 | 2024-01-01 | 620 | state› state legislative district (lower chamber) |

 | 2024-01-01 | 622 | state› state legislative district (lower chamber)› county (or part) |

 | 2024-01-01 | 795 | state› public use microdata area |

 | 2024-01-01 | 860 | zip code tabulation area |

 | 2024-01-01 | 950 | state› school district (elementary) |

 | 2024-01-01 | 960 | state› school district (secondary) |

 | 2024-01-01 | 970 | state› school district (unified) |


---

Source: https://api.census.gov/data/2024/acs/acs5/examples.html (rows for us/state/county/tract/block group/place only)

 | us | 010 | https://api.census.gov/data/2024/acs/acs5?get=NAME,B01001_001E&for=us:*&key=YOUR_KEY_GOES_HERE |
 | state | 040 | https://api.census.gov/data/2024/acs/acs5?get=NAME,B01001_001E&for=state:*&key=YOUR_KEY_GOES_HERE |
 | state› county | 050 | https://api.census.gov/data/2024/acs/acs5?get=NAME,B01001_001E&for=county:*&key=YOUR_KEY_GOES_HERE |
 | state› county› tract | 140 | https://api.census.gov/data/2024/acs/acs5?get=NAME,B01001_001E&for=tract:*&in=state:48&key=YOUR_KEY_GOES_HERE |
 | state› county› tract› block group | 150 | https://api.census.gov/data/2024/acs/acs5?get=NAME,B01001_001E&for=block%20group:*&in=state:06%20county:073&key=YOUR_KEY_GOES_HERE |
 | state› place | 160 | https://api.census.gov/data/2024/acs/acs5?get=NAME,B01001_001E&for=place:*&key=YOUR_KEY_GOES_HERE |

---

Source: https://www.census.gov/data/developers/guidance/api-user-guide.html

-

-

-

-

    Census Data API User Guide

-

-

-

-

-

-

-

-

-

-

-

-

-

-

-

-

-

# Census Data API User Guide

Skip Navigation

		Within Developers

 -->

####

# Census Data API User Guide

      May 12, 2026

     -->

-

                    Census Data API User Guide
                    [1.1 MB]

The purpose of this user guide is to instruct developers and researchers on how to use the Census Data Application Programming Interface (API) to request data from U.S. Census Bureau datasets.

-
				Overview

-
				What is the API

-
				Query Limits

-
				API Key

-
				Available Data

-

					More

-
						Core Concepts

-
						Example API Queries

-
						Ucgid Predicate

-
						Help & Contact Us

	         Overview

-
                Overview

-
                What is the API

-
                Query Limits

-
                API Key

-
                Available Data

-
                Core Concepts

-
                Example API Queries

-
                Ucgid Predicate

-
                Help & Contact Us

## Overview

Applications built on Census data typically take advantage of three underlying services: Census Data API, TIGERweb REST Services and the Geocoder REST Services:

### Census Data API

The Census Data Application Programming Interface (API) is an API that gives the public access to raw statistical data from various Census Bureau data programs. In terms of space, we aggregate the data and usually associate them with a certain Census geographic boundary/area defined by a FIPS code. In terms of time, we associate the data with a specific vintage (reference year).

### TIGERweb

TIGERweb GeoServices REST API provides Census area boundaries/shapes referenced by FIPS codes. This service can take two types of parameters to return one or more Census boundaries: a FIPS code or a latitude/longitude pair. FIPS codes are 12-digit codes that are hierarchical in code so that the higher numbers define higher-level geographies and lower numbers define lower-level geographies.

### Geocoder

Our publicly available Geocoding Services API  translates addresses and other location formats into latitude/longitude parameters, which are then fed into the TIGERweb REST services to request a Census boundary.

### Focus: Census Data API

The primary purpose of this guide is to cover the Census Data API. To learn more about the geography APIs, please visit the links included above.

## Related Information

     -->

-

How-to Materials for Using the Census API

Do you have questions on how to use the Census API? Check out our step-by-step guidance to learn how to use the Census API to find the data you need.

-

Data Tool

Explore Census Data

This new platform on data.census.gov is based on overwhelming feedback to streamline the way you get data and digital content from the Census Bureau.

### You May Be Interested In

	Data

						Census Bureau Data and Maps

						Access demographic, economic and population data from the U.S. Census Bureau. Explore census data with visualizations and view tutorials.

						Data Tools and Applications

						Find information using interactive applications to get statistics from multiple surveys.

						Emergency Management Hub

						The U.S. Census Bureau produces timely local data that are critical to emergency planning, preparedness and recovery efforts.

	Page Last Revised - May 14, 2026

 in static template will not break template structure*/ -->


---

Source: https://www.census.gov/data/developers/guidance/api-user-guide.Example_API_Queries.html

-

-

-

-

    Census Data API User Guide

-

-

-

-

-

-

-

-

-

-

-

-

-

-

-

-

-

# Census Data API User Guide

Skip Navigation

		Within Developers

 -->

####

# Census Data API User Guide

      May 12, 2026

     -->

-

                    Census Data API User Guide
                    [1.1 MB]

The purpose of this user guide is to instruct developers and researchers on how to use the Census Data Application Programming Interface (API) to request data from U.S. Census Bureau datasets.

-
				Available Data

-
				Core Concepts

-
				Example API Queries

-
				Ucgid Predicate

-
				Help & Contact Us

-

					More

-
						Overview

-
						What is the API

-
						Query Limits

-
						API Key

	         Example API Queries

-
                Overview

-
                What is the API

-
                Query Limits

-
                API Key

-
                Available Data

-
                Core Concepts

-
                Example API Queries

-
                Ucgid Predicate

-
                Help & Contact Us

## Example API Queries

Following are some examples that give a detailed breakdown of the components of the URL needed for building a query in a dataset. These examples will introduce you to some of the most popular datasets in the API: Population Estimates, the American Community Survey, and International Trade. Many aspects of these examples apply across datasets, such as the use of categorical variables or group calls.

###

                Population Estimates Example

Let’s begin with a query for the Hispanic population by state in the dataset, Population Estimates: Estimates by Age Group, Sex, Race, and Hispanic Origin.  You will find this dataset listed on the Census Data API Datasets page of the Discovery Tool:

Format queries as a URL, as follows (use Chrome or Firefox):  api.census.gov/data/2019/pep/charagegroups?get=NAME,POP&HISP=2&for=state:*&key=your key here

Assemble components of this query by following these steps:

1. Start your query with the host name:

api.census.gov/data

2. Add the data year to the URL:

api.census.gov/data/2019

This is the year that the data were estimated.

3. Add the dataset name acronym:

 api.census.gov/data/2019/pep/charagegroups

This is the base URL for this dataset. You can find dataset names by browsing the discovery tool: api.census.gov/data.html

4. Add ?get= to the query

 api.census.gov/data/2019/pep/charagegroups?get=

5. Add your variables:

 api.census.gov/data/2019/pep/charagegroups?get=NAME,POP

 In this dataset, NAME will provide the geography name and POP will provide the total population. Use a comma to separate each variable; e.g., NAME,POP. You can find the full list of available variables in the variables page for the dataset: api.census.gov/data/2019/pep/charagegroups/variables.html

6. Add variable predicates (if applicable):

api.census.gov/data/2019/pep/charagegroups?get=NAME,POP&HISP=2

In this dataset, the variable HISP provides data for three categories:

• 2 = Hispanic

• 1 = Non Hispanic

• 0 = Total Population

You can find this by clicking the link for the HISP variable in the discovery tool, or by visiting the documentation page for categorical variables in the Population Estimates datasets.

7. Add your geographies:

api.census.gov/data/2019/pep/charagegroups?get=NAME,POP&HISP=2‌&for=state:*

Use a predicate clause starting with an ampersand (&) to separate it from your get clause and then a for followed by an in clause, if needed; e.g., &for=state:. Because we are looking for information in all the states, add a wildcard (*) to indicate all values; e.g.,  state:*.  You can find the full list of available geographies in the examples page for the dataset: api.census.gov/data/2019/pep/charagegroups/examples.html

As you can see, you can only search on the state, county, or national level for this dataset. Other datasets provide results for more types of geographic areas. Sometimes datasets change the number of geographies they publish from year to year.

8.  Add your API key:

api.census.gov/data/2019/pep/charagegroups?get=NAME,POP&HISP=2&for=state:*&key=your key here

You can copy your query results into a spreadsheet to clean it up and analyze it, or you can save it as a file and consume it as JSON. The response for all queries is formatted as a two dimensional JSON array where the first row provides column names and the subsequent rows provide data values. The first rows of output of the query are configured as follows:

[["NAME","POP","HISP","state"],

["Mississippi","100110","2","28"],

["Missouri","268708","2","29"],

["Montana","43289","2","30"],

["Nebraska","219645","2","31"],

["Nevada","900600","2","32"],

["New Hampshire","54589","2","33"],

["New Jersey","1856844","2","34"],

["New Mexico","1032942","2","35"],

["New York","3751058","2","36"],

…..

You can find examples of other queries for this dataset by clicking the link in the Examples column on the API datasets page, which takes you to this Example page: api.census.gov/data/2019/pep/charagegroups/examples.html

 |
 | As you begin to build queries, start with examples and expand upon them. This is a great way to learn how to use the Census Data API.

             Top of Section

###

                American Community Survey (ACS) Example

The ACS has many datasets in the Census Data API with a large number of variables and special naming conventions. In our example, we will focus on the American Community Survey 1-Year Data.

E and M

At the end of a variable’s name in ACS datasets, E and M are characters for estimates and margins of error. E indicates the estimated value, based on the sample surveyed, while M at the end of a variable number indicates the margin of error.  The smaller the sample size the greater the margin of error.

PE and PM

At the end of a variable’s name in some ACS datasets, PE stands for percentage estimate, and PM stands for percentage margin of error.

More details are available on the ACS Variable Types page.

In our example, we will build an API call that provides data for the total number of Hmong people living in each U.S. state as determined by the 2019 American Community Survey 1-Year data. Format the search query URL as follows:

api.census.gov/data/2019/acs/acs1?get=NAME,B02015_009E,B02015_009M&for=state:*&key=your key here

Assemble components of this query by following these steps:

1. Start your query with the host name:

api.census.gov/data

2. Add the data year to the query:

 api.census.gov/data/2019

3. Add the dataset name acronym:

api.census.gov/data/2019/acs/acs1

This is the base URL for this dataset. You can find dataset names by browsing the discovery tool: api.census.gov/data.html

4. Add ?get= to the query:

 api.census.gov/data/2019/acs/acs1?get=

5. Add your variables:

api.census.gov/data/2019/acs/acs1?get=NAME,B02015_009E,B02015_009M

In this dataset, the variable called NAME provides the geographic name you are using to limit your search. The variable B02015_009E provides the total number of Hmong people, and the variable B02015_009M is an attribute that will provide the corresponding margin of error. Use a comma to separate each variable; e.g., ?get=NAME,B02015_009E,B02015_009M. You can find the full list of available variables in the variables page for the dataset: api.census.gov/data/2019/acs/acs1/variables.html

6. Add your geographies:

api.census.gov/data/2019/acs/acs1?get=NAME,B02015_009E,B02015_009M‌&for=state:*

Use a predicate clause starting with an ampersand (&) to separate it from your get clause and then a for followed by an in clause, if needed; e.g., &for=state:. Because we are looking for information in all the states, add a wildcard (*) to indicate all values; e.g.,  state:*.  You can find the full list of available geographies in the examples page for the dataset: api.census.gov/data/2019/acs/acs1/examples.html

7. Add your API key:

api.census.gov/data/2019/acs/acs1?get=NAME,B02015_009E,B02015_009M&for=state:*&key=your key here

The query configures the first rows of output as follows:

[["NAME","B02015_009E","B02015_009M","state"],

["Illinois","655","511","17"],

["Georgia","3162","1336","13"],

["Idaho",null,null,"16"],

["Hawaii","56","92","15"],

["Indiana","1344","1198","18"],

["Iowa","685","705","19"],

["Kansas","2189","1177","20"],

["Kentucky","530","503","21"],

["Louisiana","0","224","22"],

["Maine",null,null,"23"],

…..

“Null” occurs as a result when there is no data entered for that answer. You can find other examples of searches in this dataset by clicking the link in the “Examples” column on the API datasets page, which will take you to the examples page here: api.census.gov/data/2019/acs/acs1/examples.html

 |
 | If your query returns an error message with no data, check your spelling, capitalization, and spacing. Correct it, and run it again.

             Top of Section

###

                Group Call Example – Get Results for All Data Variables in a Table

If you want data for all variables in a table, use the group functionality. This will give you results for all variables in one easy command, even if the table contains more than 50 variables. For example, this API query provides results for all variables in table B02015 in each state from the 2019 American Community Survey 1-Year Estimates

api.census.gov/data/2019/acs/acs1?get=group(B02015)&for=state:*&key=your key here

Assemble components of this query by following these steps:

- Start your query with the host name:

 api.census.gov/data

- Add the data year to the query:

 api.census.gov/data/2019

- Add the dataset name acronym:

api.census.gov/data/2019/acs/acs1

This is the base URL for this dataset. You can find dataset names by browsing the discovery tool: api.census.gov/data.html

- Add ?get= to the query:

 api.census.gov/data/2019/acs/acs1?get=

- Add group and your desired table ID in parenthesis.

api.census.gov/data/2019/acs/acs1?get=group(B02015)

- Add your geographies:

api.census.gov/data/2019/acs/acs1?get=group(B02015)&for=state:*

- Add your API key:

api.census.gov/data/2019/acs/acs1?get=group(B02015)&for=state:*&key=your key here

Use a predicate clause starting with an ampersand (&) to separate it from your get clause and then a for followed by an in clause, if needed; e.g., &for=state:. Because we are looking for information in all the states, add a wildcard (*) to indicate all values; e.g.,  state:*.  You can find the full list of available geographies in the examples page for the dataset: api.census.gov/data/2019/acs/acs1/examples.html

The query provides the first rows of output as follows:

[["B02015_001E","B02015_001EA","B02015_001M","B02015_001MA","B02015_002E","B02015_002EA","B02015_002M","B02015_002MA","B02015_003E","B02015_003EA","B02015_003M","B02015_003MA","B02015_004E","B02015_004EA","B02015_004M","B02015_004MA","B02015_005E","B02015_005EA","B02015_005M","B02015_005MA","B02015_006E","B02015_006EA","B02015_006M","B02015_006MA","B02015_007E","B02015_007EA","B02015_007M","B02015_007MA","B02015_008E","B02015_008EA","B02015_008M","B02015_008MA","B02015_009E","B02015_009EA","B02015_009M","B02015_009MA","B02015_010E","B02015_010EA","B02015_010M","B02015_010MA","B02015_011E","B02015_011EA","B02015_011M","B02015_011MA","B02015_012E","B02015_012EA","B02015_012M","B02015_012MA","B02015_013E","B02015_013EA","B02015_013M","B02015_013MA","B02015_014E","B02015_014EA","B02015_014M","B02015_014MA","B02015_015E","B02015_015EA","B02015_015M","B02015_015MA","B02015_016E","B02015_016EA","B02015_016M","B02015_016MA","B02015_017E","B02015_017EA","B02015_017M","B02015_017MA","B02015_018E","B02015_018EA","B02015_018M","B02015_018MA","B02015_019E","B02015_019EA","B02015_019M","B02015_019MA","B02015_020E","B02015_020EA","B02015_020M","B02015_020MA","B02015_021E","B02015_021EA","B02015_021M","B02015_021MA","B02015_022E","B02015_022EA","B02015_022M","B02015_022MA","B02015_023E","B02015_023EA","B02015_023M","B02015_023MA","B02015_024E","B02015_024EA","B02015_024M","B02015_024MA","B02015_025E","B02015_025EA","B02015_025M","B02015_025MA","GEO_ID","NAME","state"],

["717992",null,"5911",null,"242823",null,"12230",null,"2062",null,"1211",null,"23",null,"41",null,"7001",null,"3663",null,"3627",null,"1798",null,"135795",null,"8745",null,"126628",null,"10428",null,"655",null,"511",null,"1867",null,"1105",null,"21568",null,"3365",null,"58037",null,"5955",null,"3572",null,"1770",null,"667",null,"409",null,"3579",null,"2581",null,"3567",null,"1759",null,"0",null,"195",null,"39777",null,"7043",null,"1209",null,"739",null,"5564",null,"1467",null,"11820",null,"3313",null,"29296",null,"5888",null,"314",null,"311",null,"5226",null,"2848",null,"13315",null,"2555",null,"0400000US17","Illinois","17"],

…..

In order to get the data in a viewable format, you can save the results as a .csv file by following the steps in the short videos and PDFs at the How-To Materials for Using the Census API page.

             Top of Section

###

                Time Series Dataset Example - International Trade Monthly Exports

For some datasets available on the Census Data API, data are stored for multiple points of time in one dataset, rather than across several datasets for individual points of time. When this occurs, we refer to the dataset as a time series dataset.  For more information on time series datasets, see the time series section for Predicate in this user guide. You can find the list of time series datasets on the Census Data API at: api.census.gov/data/timeseries.html

In this example, we will build a query for one of the time series datasets in the API, International Trade: Monthly U.S. Exports by End-Use Code for the total export value (monthly and year-to-date) for all Customs districts for June 2016:

api.census.gov/data/timeseries/intltrade/exports/enduse?get=DISTRICT,DIST_NAME,ALL_VAL_MO,ALL_VAL_YR&YEAR=2016&MONTH=06&key=your key here

Assemble components of this query by following these steps:

1. Start your query with the host name:

api.census.gov/data

2. Add timeseries to the query:

api.census.gov/data/timeseries

3. Add the dataset name acronym:

api.census.gov/data/timeseries/intltrade/exports/enduse

This is the base URL for this dataset. You can find dataset names by browsing the discovery tool: api.census.gov/data.html

4. Add ?get= to the query:

api.census.gov/data/timeseries/intltrade/exports/enduse?get=

Add your variables:

 api.census.gov/data/timeseries/intltrade/exports/enduse?get=DISTRICT,‌DIST_NAME, ALL_VAL_MO,ALL_VAL_YR

 In this dataset,  ALL_VAL_MO provides the total exports of goods in the month, and variable ALL_VAL_YR provides total exports of goods year to date. The variable DISTRICT provides the two-digit district code, and DIST_NAME provides the district name. You can find the full list of available variables in the variables page for the dataset:

api.census.gov/data/timeseries/intltrade/exports/enduse/variables.html

In the discovery tool, you will notice that the variable for DISTRICT has text that says “Default Displayed” in the required column. This indicates that the variable provides data for several categories. The default for this variable is to provide data for each available district code. If you are not sure what the default is for a variable, include it in an API call and view the results. This will help you decide if you want to keep the variable in your query as is or if you may want to limit the results by adding a variable predicate in your query. In this case, we will continue with the default to get data for all districts.

5. Add the time period:

api.census.gov/data/timeseries/intltrade/exports/enduse?get=DISTRICT,‌DIST_NAME,ALL_VAL_MO,ALL_VAL_YR&YEAR=2016&MONTH=06

 Adding the time period using the related predicate is required for this dataset. This will be in the format of a four digit year and two digit month.

 |
 | You can also specify this required time range as &time=2016-06. See Section Predicate in this user guide for building predicates for time series.

6. Use the default geography:

api.census.gov/data/timeseries/intltrade/exports/enduse?get=DISTRICT,DIST_NAME,ALL_VAL_MO,ALL_VAL_YR&YEAR=2016&MONTH=06

This dataset does not have any geography predicates we can add to further refine our results, as shown on the examples page. api.census.gov/data/timeseries/intltrade/exports/enduse/examples.html. By default, we will get data for all exports in the United States.

7. Add your API key:

api.census.gov/data/timeseries/intltrade/exports/enduse?get=DISTRICT,DIST_NAME,ALL_VAL_MO,ALL_VAL_YR&YEAR=2016&MONTH=06&key=your key here

The query configures the first rows of output of the query as follows:

            ["DISTRICT","DIST_NAME","ALL_VAL_MO","ALL_VAL_YR","YEAR","MONTH"],

["-","TOTAL FOR ALL DISTRICTS","125098472280","710375181044","2016","06"],

["01","PORTLAND, ME","331806543","2115131981","2016","06"],

["02","ST. ALBANS, VT","185303473","1146029068","2016","06"],

["04","BOSTON, MA","727206031","3809798337","2016","06"],

["05","PROVIDENCE, RI","16926100","81324062","2016","06"],

["07","OGDENSBURG, NY","1453893826","8175510192","2016","06"],

["09","BUFFALO, NY","4480533914","23856111530","2016","06"],

["10","NEW YORK CITY, NY","11710790969","67631679235","2016","06"],

["11","PHILADELPHIA, PA","1394262586","7917423322","2016","06"],

["13","BALTIMORE, MD","1211018756","7350714163","2016","06"],

["14","NORFOLK, VA","2010648266","13040563942","2016","06"],

["15","WILMINGTON, NC","452132998","2830658475","2016","06"],

["16","CHARLESTON, SC","2955226028","16729308335","2016","06"],

["17","SAVANNAH, GA","4122821568","22937972567","2016","06"], 

…..

             Top of Section

Now you are ready to write your API queries for a dataset. You can open and save your search to a text-editing program as a JSON file. You can save your search directly in Chrome and Firefox, but in Internet Explorer and Safari, you need to save your search to a text file program. You can only search for variables that the variable table specifically lists with the API.

When using Chrome and Firefox, you can save your results as a .csv file. Instructions for this are provided in the short videos and PDF walkthroughs on the How-To Materials for Using the Census API page.

## Related Information

     -->

-

How-to Materials for Using the Census API

Do you have questions on how to use the Census API? Check out our step-by-step guidance to learn how to use the Census API to find the data you need.

-

Data Tool

Explore Census Data

This new platform on data.census.gov is based on overwhelming feedback to streamline the way you get data and digital content from the Census Bureau.

### You May Be Interested In

	Data

						Census Bureau Data and Maps

						Access demographic, economic and population data from the U.S. Census Bureau. Explore census data with visualizations and view tutorials.

						Data Tools and Applications

						Find information using interactive applications to get statistics from multiple surveys.

						Emergency Management Hub

						The U.S. Census Bureau produces timely local data that are critical to emergency planning, preparedness and recovery efforts.

	Page Last Revised - May 14, 2026

 in static template will not break template structure*/ -->


---

# TIGERweb tigerWMS_ACS2024 MapServer — layer list

Source: https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2024/MapServer?f=json

```
0: 2020 Census Public Use Microdata Areas
1: 2020 Census Public Use Microdata Areas Labels
2: 2020 Census ZIP Code Tabulation Areas
3: 2020 Census ZIP Code Tabulation Areas Labels
4: Tribal Census Tracts
5: Tribal Census Tracts Labels
6: Tribal Block Groups
7: Tribal Block Groups Labels
8: Census Tracts
9: Census Tracts Labels
10: Census Block Groups
11: Census Block Groups Labels
14: Unified School Districts
15: Unified School Districts Labels
16: Secondary School Districts
17: Secondary School Districts Labels
18: Elementary School Districts
19: Elementary School Districts Labels
84: School District Administrative Areas
85: School District Administrative Areas Labels
20: Estates
21: Estates Labels
22: County Subdivisions
23: County Subdivisions Labels
24: Subbarrios
25: Subbarrios Labels
26: Consolidated Cities
27: Consolidated Cities Labels
28: Incorporated Places
29: Incorporated Places Labels
30: Census Designated Places
31: Census Designated Places Labels
32: Alaska Native Regional Corporations
33: Alaska Native Regional Corporations Labels
34: Tribal Subdivisions
35: Tribal Subdivisions Labels
36: Federal American Indian Reservations
37: Federal American Indian Reservations Labels
38: Off-Reservation Trust Lands
39: Off-Reservation Trust Lands Labels
40: State American Indian Reservations
41: State American Indian Reservations Labels
42: Hawaiian Home Lands
43: Hawaiian Home Lands Labels
44: Alaska Native Village Statistical Areas
45: Alaska Native Village Statistical Areas Labels
46: Oklahoma Tribal Statistical Areas
47: Oklahoma Tribal Statistical Areas Labels
48: State Designated Tribal Statistical Areas
49: State Designated Tribal Statistical Areas Labels
50: Tribal Designated Statistical Areas
51: Tribal Designated Statistical Areas Labels
52: American Indian Joint-Use Areas
53: American Indian Joint-Use Areas Labels
54: 119th Congressional Districts
55: 119th Congressional Districts Labels
56: 2024 State Legislative Districts - Upper
57: 2024 State Legislative Districts - Upper Labels
58: 2024 State Legislative Districts - Lower
59: 2024 State Legislative Districts - Lower Labels
60: Census Divisions
61: Census Divisions Labels
62: Census Regions
63: Census Regions Labels
80: States
81: States Labels
82: Counties
83: Counties Labels
88: Urban Areas
87: Urban Areas Labels
97: Combined Statistical Areas
96: Combined Statistical Areas Labels
95: Metropolitan Divisions
94: Metropolitan Divisions Labels
93: Metropolitan Statistical Areas
92: Metropolitan Statistical Areas Labels
91: Micropolitan Statistical Areas
90: Micropolitan Statistical Areas Labels
```

All TIGERweb services (from https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb?f=json):

```
TIGERweb/AIANNHA (MapServer)
TIGERweb/CBSA (MapServer)
TIGERweb/Hydro (MapServer)
TIGERweb/Labels (MapServer)
TIGERweb/Legislative (MapServer)
TIGERweb/Places_CouSub_ConCity_SubMCD (MapServer)
TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA (MapServer)
TIGERweb/Region_Division (MapServer)
TIGERweb/School (MapServer)
TIGERweb/Special_Land_Use_Areas (MapServer)
TIGERweb/State_County (MapServer)
TIGERweb/tigerWMS_ACS2012 (MapServer)
TIGERweb/tigerWMS_ACS2013 (MapServer)
TIGERweb/tigerWMS_ACS2014 (MapServer)
TIGERweb/tigerWMS_ACS2015 (MapServer)
TIGERweb/tigerWMS_ACS2016 (MapServer)
TIGERweb/tigerWMS_ACS2017 (MapServer)
TIGERweb/tigerWMS_ACS2018 (MapServer)
TIGERweb/tigerWMS_ACS2019 (MapServer)
TIGERweb/tigerWMS_ACS2021 (MapServer)
TIGERweb/tigerWMS_ACS2022 (MapServer)
TIGERweb/tigerWMS_ACS2023 (MapServer)
TIGERweb/tigerWMS_ACS2024 (MapServer)
TIGERweb/tigerWMS_ACS2025 (MapServer)
TIGERweb/tigerWMS_ACS2026 (MapServer)
TIGERweb/tigerWMS_Census2010 (MapServer)
TIGERweb/tigerWMS_Census2020 (MapServer)
TIGERweb/tigerWMS_CurrentBlocks (MapServer)
TIGERweb/tigerWMS_Current (MapServer)
TIGERweb/tigerWMS_ECON2012 (MapServer)
TIGERweb/tigerWMS_PhysicalFeatures (MapServer)
TIGERweb/Tracts_Blocks (MapServer)
TIGERweb/Transportation (MapServer)
TIGERweb/TribalTracts (MapServer)
TIGERweb/Urban (MapServer)
TIGERweb/US_InternationalBoundary_Line (MapServer)
TIGERweb/USLandmass (MapServer)
```

---

Source: https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html

Geocoding
Services

Web
Application Programming Interface (API)

Last updated 02/2026

______________________________________________________________________________

Contents

Geocoding Definition. 1

Audience. 1

Single Record Geocoding Service
Requests. 1

Required Parameters. 2

Optional Parameters. 3

Geocoding Service Responses. 4

JSON Output Format. 4

Batch Geocoding. 6

Required Parameters. 6

Example Shell Script Submissions. 7

Batch GeoLookup. 7

Required Parameters. 8

Example Shell Script Submission. 9

# Geocoding Definition

Geocoding is the process of taking an address and returning
an actual or calculated latitude/longitude coordinate.  Depending on the parts
of the address that are provided, determines to what granularity it is possible
to geocode.

The current Geocoding Services engine requires a structure
address be provided.  The resulting latitude/longitude is calculated along an
address range.

There are two entry points for the geocoding service –
single record submission and batch.

The acceptable input address parts are:

·        
Structure number and street name (required)

·        
Urbanization (optional)

·        
City name (optional)

·        
Municipio (optional)

·        
State (optional)

·        
ZIP code (optional)

Further guidance on what address parts are
supported/required for each search type is provided later in the documentation.

# Audience

This document is intended for application, website, and
mobile developers within the U.S. Census Bureau and the general public who want
to leverage the Geocoding Services capability.

This service is designed for coding a provided address, or
file of addresses, to a latitude/longitude coordinate based on data that’s been
loaded into the geocoding engine from a MAF/TIGER benchmark database.

The Census Geocoder only geocodes addresses that are within
the United States, Puerto Rico, and the U.S. Island Areas.

The optional inclusion of the Geographic Lookup (geoLookup)
adds information to the result relating to various levels of geography that
cover the aforementioned latitude/longitude coordinate.  GeoLookup results can
also be obtained directly by searching on the latitude/longitude coordinates.

# Single Record Geocoding Service Requests

A Geocoding Service API request must be in the following
form:

https://geocoding.geo.census.gov/geocoder/returntype/searchtype?parameters

Note: The above URL will not work on its own. The returntype and searchtype
in the URL needs to be replaced with one of the values in the next section.

## Required Parameters

·        
returntype –
locations (to get just geocoding response) or geographies (to get
geocoding response as well as geoLookup)

·        
searchtype – onelineaddress OR address
OR addressPR OR coordinates (supported only by the returntype = geographies)

·        
benchmark –
A numerical ID or name that references what version of the locator should be
searched.  This generally corresponds to MTDB data which is benchmarked twice
yearly.  A full list of options can be accessed at:

https://geocoding.geo.census.gov/geocoder/benchmarks

 

The general format of the name is DatasetType_SpatialBenchmark. 
The valid values for these include:

o  
DatasetType

§ 
Public_AR

o  
SpatialBenchmark

§ 
Current

§ 
ACS#### (#### will be replaced by the most recent ACS survey year)

§ 
Census#### (#### will be replaced by the most recent Census
year)

A resulting benchmark name could be
“Public_AR_Current”.  Over time, there will always be a “Current” benchmark. 
It will change as the underlying dataset changes.

·        
vintage –
A numerical ID or name that references what vintage of geography is desired for
the geoLookup (only needed when returntype = geographies).
A full list of options for a given benchmark can be accessed at

https://geocoding.geo.census.gov/geocoder/vintages?benchmark=benchmarkId

 

Note: benchmarkId in the example
above needs to be replaced with a valid benchmark ID. Here is an example using
the "Current" benchmark ID (4):

https://geocoding.geo.census.gov/geocoder/vintages?benchmark=4

 

The general format of the name is GeographyVintage_SpatialBenchmark. 
The SpatialBenchmark variable should always match the same named variable in
what was chosen for the benchmark parameter.  The GeographyVintage can be
Current, ACS####, etc.  A resulting vintage name could be “Current_Current”. 
Over time, there will always be a “Current” vintage.  It will change as the
underlying dataset changes.

·        
address
(searchtype = onelineaddress) – A single line containing the full address to be
searched. The onelineaddress searchtype
supports Puerto Rico addresses without Urbanization and Municipio, but it does
not support Puerto Rico addresses with Urbanization and Municipio. Puerto Rico
addresses with an Urbanization and Municipio submitted to this searchtype may result in a no match or match to a
Puerto Rico address without an Urbanization.

·        
street, city,
state, zip (searchtype = address) – The address split into the parts indicated.  Not all
parts need to be specified. At a minimum, the geocoder expects the street and zip
parameters OR the street, city, and state parameters.
The address searchtype supports Puerto Rico
addresses without Urbanization and Municipio, but it does not support Puerto
Rico addresses with Urbanization and Municipio. Puerto Rico addresses with an
Urbanization and Municipio submitted to this searchtype
may result in a no match or match to a Puerto Rico address without an
Urbanization.

·        
street, urb,
city, municipio, state, zip (searchtype = addressPR) – The Puerto Rico address split into the
parts indicated. Not all parts need to be specified. zip
should begin with 006, 007, or 009. To submit a Puerto Rico address without an
Urbanization the geocoder expects at a minimum the street
and zip parameters OR the street, city, and state parameters. To submit a Puerto Rico address
with an Urbanization the geocoder expects at a minimum the street, urb, and municipio parameters.

·        
x,y
(searchtype = coordinates) – The
longitude and latitude represented as decimal x/y values.  Only returns
geoLookup data. Can only be used with returntype
= geographies.

## Optional Parameters

·        
format – The format to be used for
returning the standardized output (supported values include json and jsonp).

·        
callback – The name of the function
to pass the JSON response to as a parameter. The format
parameter should be set to jsonp when using callback to request a JSONP response. At this time
the geocoder does not support CORS requests so the callback
and format parameters should be used in
the client to make calls to the geocoder.

·        
layers – By default, State, County,
Tract, Block, Congressional Districts, State Legislative Districts, Census
Designated Places, County Subdivisions, Incorporated Places, Combined
Statistical Areas, Urban Areas, Urbanized Areas, and Urban Clusters layers are
displayed when “geographies” is the chosen returntype. 
It is possible that not all layers listed will return as this depends on the
selected vintage and if the geography has nationwide coverage. If additional or
different layers are desired, they can be specified in a comma delimited list
by ID or name as listed in the TIGERweb WMS layers, for instance here for the
"Current_Current" vintage:

https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer.

 

A valid entry could be: layers=14,16,18 OR layers=Unified+School+Districts,Secondary+School+Districts,Elementary+School+Districts. 
Only layers without the word “Labels” are considered.  If all layers are
desired, layers=all is an accepted entry.

In cases where the SpatialBenchmark
selected is Census####, the TIGERweb WMS needed can be found at the following
URL in the Census#### folder:

https://tigerweb.geo.census.gov/arcgis/rest/

# Geocoding Service Responses

Geocoding Services responses are returned in the format
indicated by the format parameter value in the URL
request’s path.

 

## JSON Output Format

In this example, Geocoding Services API requests a json
response for the address “4600 Silver Hill Rd, Washington, DC 20233”:

https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=4600+Silver+Hill+Rd%2C+Washington%2C+DC+20233&benchmark=4&format=json

Other valid examples:

https://geocoding.geo.census.gov/geocoder/locations/address?street=4600+Silver+Hill+Rd&city=Washington&state=DC&zip=20233&benchmark=Public_AR_Current&format=json

https://geocoding.geo.census.gov/geocoder/locations/address?street=4600+Silver+Hill+Rd&city=Washington&state=DC&benchmark=4&format=json

The JSON returned by this request is shown below.  Note the
actual JSON may contain less whitespace.  You should not make assumptions about
the amount or format of whitespace in requests.

{"result": {

     "input": {

          "address": {"address":
"4600 Silver Hill Rd, Washington, DC 20233"},

          "benchmark": {

               "isDefault": true,

               "benchmarkDescription":
"Public Address Ranges - Current Benchmark",

               "id": "4",

               "benchmarkName":
"Public_AR_Current"

          }

     },

     "addressMatches": [{

          "tigerLine": {

               "side": "L",

               "tigerLineId":
"76355984"

          },

          "coordinates": {

               "x": -76.92748724230096,

               "y": 38.84601622386617

          },

          "addressComponents": {

               "zip": "20233",

               "streetName": "SILVER
HILL",

               "preType": "",

               "city": "WASHINGTON",

               "preDirection": "",

               "suffixDirection": "",

               "fromAddress": "4600",

               "state": "DC",

               "suffixType": "RD",

               "toAddress": "4700",

               "suffixQualifier": "",

               "preQualifier": ""

          },

          "matchedAddress": "4600 SILVER
HILL RD, WASHINGTON, DC, 20233"

     }]

}}

 

Examples using geoLookup:

https://geocoding.geo.census.gov/geocoder/geographies/address?street=4600+Silver+Hill+Rd&city=Washington&state=DC&benchmark=Public_AR_Current&vintage=Current_Current&layers=10&format=json

Additional JSON response data for geoLookup:

```
"geographies": {"Census Block Groups": [{
```

```
     "GEOID": "240338024052",
```

```
     "CENTLAT": "+38.8538877",
```

```
     "AREAWATER": 8728,
```

```
     "STATE": "24",
```

```
     "BASENAME": "2",
```

```
     "OID": "20890286109972",
```

```
     "LSADC": "BG",
```

```
     "FUNCSTAT": "S",
```

```
     "INTPTLAT": "+38.8507922",
```

```
     "NAME": "Block Group 2",
```

```
     "OBJECTID": 210878,
```

```
     "TRACT": "802405",
```

```
     "CENTLON": "-076.9390445",
```

```
     "BLKGRP": "2",
```

```
     "AREALAND": 3168458,
```

```
     "INTPTLON": "-076.9410126",
```

```
     "MTFCC": "G5030",
```

```
     "COUNTY": "033"
```

```
}]}
```

```
 
```

```
If a JSONP-formatted result is desired/required, the format=jsonp can be specified with a corresponding JavaScript callback method on the request. For example:
```

```
 
```

https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=4600+Silver+Hill+Rd%2C+Washington%2C+DC+20233&benchmark=4&format=jsonp&callback=test

# Batch Geocoding

Geocoding can be accomplished in batch mode with submission
of a CSV or Excel formatted file. CSV formatted files should have an extension
ending in .CSV, .TXT, .DAT, and Excel files should have an extension ending in
.XLS, or .XLSX. The file needs to be included as part of the HTTP request. 

The CSV formatted file must be formatted in the following
way for all addresses including Puerto Rico addresses without an Urbanization:

Unique ID, Street address, City,
State, ZIP

The batch mode also supports Puerto Rico addresses with an
Urbanization. Puerto Rico addresses with Urbanization must be formatted in the
following way:

Unique ID, Street address,
Municipio, State, ZIP, Urbanization

The two address formats can be submitted together in the
same file. Excel submissions should place each component in its own column.

If a component is missing from the dataset, it must still
retain the delimited format with a null value.  Unique ID and Street address
are required fields.

If there are commas that are part of one of the fields, the
whole field needs to be enclosed in quote marks for proper parsing.

There is currently an upper limit of 10,000 records per
batch file.

The URL is as follows:

https://geocoding.geo.census.gov/geocoder/returntype/addressbatch  

Note: The above URL will not work on its own. The returntype in the URL needs to be replaced with one
of the values in the next section.

## Required Parameters

·        
returntype –
locations (to get just geocoding response) or geographies (to get
geocoding response as well as geoLookup).  Independent geoLookup (“coordinates”
above) is not currently an available batch option. Batch geoLookup only
includes state, county, tract, and block code. Currently there is no way to
request additional geographies in the geographies returntype.

·        
benchmark –
A numerical ID or name that references what version of the locator should be
searched.  This generally corresponds to MTDB data which is benchmarked twice
yearly.  A full list of options can be accessed at:

https://geocoding.geo.census.gov/geocoder/benchmarks

 

The general format of the name is DatasetType_SpatialBenchmark. 
The valid values for these include:

o  
DatasetType

§ 
Public_AR

o  
SpatialBenchmark

§ 
Current

§ 
ACS#### (#### will be replaced by the most recent ACS survey
year)

§ 
Census#### (#### will be replaced by the most recent Census
year)

A resulting benchmark name could be
“Public_AR_Current”.  Over time, there will always be a “Current” benchmark. 
It will change as the underlying dataset changes.

·        
vintage –
A numerical ID or name that references what vintage of geography is desired for
the geoLookup (only needed when returntype = geographies).
A full list of options for a given benchmark can be accessed at:

https://geocoding.geo.census.gov/geocoder/vintages?benchmark=benchmarkId

 

Note: benchmarkId in the example
above needs to be replaced with a valid benchmark ID. Here is an example using
the "Current" benchmark ID (4):

https://geocoding.geo.census.gov/geocoder/vintages?benchmark=4

 

The general format of the name is GeographyVintage_SpatialBenchmark. 
The SpatialBenchmark variable should always match the same named variable in
what was chosen for the benchmark parameter.  The GeographyVintage can be
Current, ACS####, etc.  A resulting vintage name could be “Current_Current”. 
Over time, there will always be a “Current” vintage.  It will change as the
underlying dataset changes.

·        
addressFile –
An input of type “file” containing the addresses to be coded.

## Example Shell Script Submissions

Locations Example:

curl --form addressFile=@localfile.csv
--form benchmark=4 https://geocoding.geo.census.gov/geocoder/locations/addressbatch
--output geocoderesult.csv

Geographies Example:

curl --form addressFile=@localfile.csv
--form benchmark=4 --form vintage=4 https://geocoding.geo.census.gov/geocoder/geographies/addressbatch
--output geocoderesult.csv

# Batch GeoLookup

GeoLookup with coordinates can be accomplished in batch mode
with submission of a CSV or Excel formatted file. CSV formatted files should
have an extension ending in .CSV, .TXT, .DAT, and Excel files should have an
extension ending in .XLS, or .XLSX.  The file needs to be included as part of
the HTTP request. 

The CSV formatted file must be formatted in the following
way:

                Unique ID, Longitude (X), Latitude (Y)

Excel submissions should place each component in its own
column.

There is currently an upper limit of 10,000 records per
batch file.

The URL is as follows:

https://geocoding.geo.census.gov/geocoder/geographies/coordinatesbatch 

## Required Parameters

- benchmark
     – A numerical ID or name that references what version of the
     locator should be searched.  This generally corresponds to MTDB data which
     is benchmarked twice yearly.  A full list of options can be accessed at:

https://geocoding.geo.census.gov/geocoder/benchmarks

 

The general format of the name is DatasetType_SpatialBenchmark. 
The valid values for these include:

- DatasetType

- Public_AR

- SpatialBenchmark

- Current

- ACS#### (#### will be replaced by the most recent ACS survey
       year)

- Census#### (#### will be replaced by the most recent Census
       year)

A resulting benchmark name could be “Public_AR_Current”. 
Over time, there will always be a “Current” benchmark.  It will change as the
underlying dataset changes.

- vintage –
     A numerical ID or name that references what vintage of geography is
     desired for the geoLookup. A full list of options for a given benchmark
     can be accessed at:

https://geocoding.geo.census.gov/geocoder/vintages?benchmark=benchmarkId

 

Note: benchmarkId in the example above needs to be
replaced with a valid benchmark ID. Here is an example using the
"Current" benchmark ID (4):

https://geocoding.geo.census.gov/geocoder/vintages?benchmark=4

 

The general format of the name is GeographyVintage_SpatialBenchmark. 
The SpatialBenchmark variable should always match the same named variable in
what was chosen for the benchmark parameter.  The GeographyVintage can be
Current, ACS####, etc.  A resulting vintage name could be “Current_Current”. 
Over time, there will always be a “Current” vintage.  It will change as the
underlying dataset changes.

·        
coordinatesFile
– An input of type “file” containing the coordinates for geoLookup.

## Example Shell Script
Submission

 

curl --form
coordinatesFile=@coordinates.csv --form benchmark=4 --form vintage=4 https://geocoding.geo.census.gov/geocoder/geographies/coordinatesbatch
--output geocoderresult.csv


Geocoder vintages for benchmark Public_AR_Current (https://geocoding.geo.census.gov/geocoder/vintages?benchmark=Public_AR_Current&format=json):

```json
{"vintages":[{"isDefault":true,"id":"4","vintageName":"Current_Current","vintageDescription":"Current Vintage - Current Benchmark"},{"isDefault":false,"id":"410","vintageName":"Census2010_Current","vintageDescription":"Census2010 Vintage - Current Benchmark"},{"isDefault":false,"id":"417","vintageName":"ACS2017_Current","vintageDescription":"ACS2017 Vintage - Current Benchmark"},{"isDefault":false,"id":"418","vintageName":"ACS2018_Current","vintageDescription":"ACS2018 Vintage - Current Benchmark"},{"isDefault":false,"id":"419","vintageName":"ACS2019_Current","vintageDescription":"ACS2019 Vintage - Current Benchmark"},{"isDefault":false,"id":"420","vintageName":"Census2020_Current","vintageDescription":"Census2020 Vintage - Current Benchmark"},{"isDefault":false,"id":"421","vintageName":"ACS2021_Current","vintageDescription":"ACS2021 Vintage - Current Benchmark"},{"isDefault":false,"id":"422","vintageName":"ACS2022_Current","vintageDescription":"ACS2022 Vintage - Current Benchmark"},{"isDefault":false,"id":"423","vintageName":"ACS2023_Current","vintageDescription":"ACS2023 Vintage - Current Benchmark"},{"isDefault":false,"id":"424","vintageName":"ACS2024_Current","vintageDescription":"ACS2024 Vintage - Current Benchmark"},{"isDefault":false,"id":"425","vintageName":"ACS2025_Current","vintageDescription":"ACS2025 Vintage - Current Benchmark"},{"isDefault":false,"id":"426","vintageName":"ACS2026_Current","vintageDescription":"ACS2026 Vintage - Current Benchmark"}],"selectedBenchmark":"Public_AR_Current","benchmarks":[{"isDefault":true,"benchmarkDescription":"Public Address Ranges - Current Benchmark","id":"4","benchmarkName":"Public_AR_Current"},{"isDefault":false,"benchmarkDescription":"Public Address Ranges - ACS2026 Benchmark","id":"8","benchmarkName":"Public_AR_ACS2026"},{"isDefault":true,"benchmarkDescription":"Public Address Ranges - LUCA Benchmark","id":"11","benchmarkName":"Public_AR_LUCA"},{"isDefault":false,"benchmarkDescription":"Public Address Ranges - Census 2020 Benchmark","id":"2020","benchmarkName":"Public_AR_Census2020"}]}
```

Live response, 2026-10-24, for `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=-73.912&y=40.7752&benchmark=Public_AR_Current&vintage=Current_Current&layers=10&format=json` (Ditmars Blvd, Astoria):

```json
{"result":{"geographies":{"Census Block Groups":[{"GEOID":"360810115002","CENTLAT":"+40.7754553","AREAWATER":0,"STATE":"36","BASENAME":"2","OID":"208903716510867","LSADC":"BG","FUNCSTAT":"S","INTPTLAT":"+40.7754553","NAME":"Block Group 2","OBJECTID":212859,"TRACT":"011500","CENTLON":"-073.9120794","BLKGRP":"2","AREALAND":85521,"INTPTLON":"-073.9120794","MTFCC":"G5030","COUNTY":"081"}]},"input":{"vintage":{"isDefault":true,"id":"4","vintageName":"Current_Current","vintageDescription":"Current Vintage - Current Benchmark"},"location":{"x":-73.912,"y":40.7752},"benchmark":{"isDefault":true,"benchmarkDescription":"Public Address Ranges - Current Benchmark","id":"4","benchmarkName":"Public_AR_Current"}}}}
```