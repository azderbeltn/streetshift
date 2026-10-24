"""Corridor definitions. Treated/control streets and cross streets are quoted from the NYC DOT
Streets for Recovery report (PDF page 7). Hayes St is the forward-looking corridor
(docs/corridor-candidates.md). `center` is only used to download the OSM graph around the area;
the corridor geometry itself comes from OSM by street name + cross streets."""

AREAS = {
    "astoria": {"city": "NYC", "center": (40.7758, -73.9105), "radius_m": 1500,
                "state": "36", "county": "081"},
    "park_slope": {"city": "NYC", "center": (40.6740, -73.9810), "radius_m": 1500,
                   "state": "36", "county": "047"},
    "chinatown": {"city": "NYC", "center": (40.7155, -73.9975), "radius_m": 1500,
                  "state": "36", "county": "061",
                  # Doyers St is mapped as highway=pedestrian today; include pedestrian/living streets
                  # at walking-pace car speed so the corridor exists but carries almost no cars.
                  "include_pedestrian": True},
    "koreatown": {"city": "NYC", "center": (40.7487, -73.9855), "radius_m": 1500,
                  "state": "36", "county": "061"},
    "prospect_heights": {"city": "NYC", "center": (40.6790, -73.9715), "radius_m": 1500,
                         "state": "36", "county": "047"},
    "hayes_valley": {"city": "SF", "center": (37.7765, -122.4240), "radius_m": 1500,
                     "state": "06", "county": "075"},
}

# Each corridor: one or more (street, from_cross, to_cross) legs. Street names are regexes
# matched against OSM `name` tags (case-insensitive).
CORRIDORS = [
    {"id": "ditmars", "area": "astoria", "role": "treated", "pair": "ditmars",
     "name": "Ditmars Blvd (33rd–36th St)",
     "legs": [("Ditmars Boulevard", r"^33rd Street", r"^36th Street")]},
    {"id": "ditmars_control", "area": "astoria", "role": "control", "pair": "ditmars",
     "name": "Ditmars Blvd (28th–33rd St)",
     "legs": [("Ditmars Boulevard", r"^28th Street", r"^33rd Street")]},
    {"id": "park_slope_5th", "area": "park_slope", "role": "treated", "pair": "park_slope_5th",
     "name": "5th Ave (Union–4th St)",
     "legs": [("^5th Avenue", r"^Union Street", r"^4th Street")]},
    {"id": "park_slope_5th_control", "area": "park_slope", "role": "control", "pair": "park_slope_5th",
     "name": "7th Ave (Union–4th St)",
     "legs": [("^7th Avenue", r"^Union Street", r"^4th Street")]},
    {"id": "pell_doyers", "area": "chinatown", "role": "treated", "pair": "pell_doyers",
     "name": "Pell & Doyers Sts",
     "legs": [("^Pell Street", r"^Bowery", r"^Mott Street"), ("^Doyers Street", r"^Pell Street", r"^Bowery")]},
    {"id": "pell_doyers_control", "area": "chinatown", "role": "control", "pair": "pell_doyers",
     "name": "Bowery (Grand St–Chatham Sq)",
     "legs": [("^Bowery", r"^Grand Street", r"Chatham Square|^Division Street|^Doyers Street|^Pell Street")]},
    {"id": "e32nd", "area": "koreatown", "role": "treated", "pair": "e32nd",
     "name": "E 32nd St (Broadway–Madison)",
     "legs": [("^(East|West) 32nd Street", r"^Broadway", r"^Madison Avenue")]},
    {"id": "e32nd_control", "area": "koreatown", "role": "control", "pair": "e32nd",
     "name": "W 36th St (6th Ave–Madison)",
     "legs": [("^(West|East) 36th Street", r"^(6th Avenue|Avenue of the Americas)", r"^Madison Avenue")]},
    {"id": "vanderbilt", "area": "prospect_heights", "role": "treated", "pair": "vanderbilt",
     "name": "Vanderbilt Ave (Atlantic–Park Pl)",
     "legs": [("^Vanderbilt Avenue", r"^Atlantic Avenue", r"^Park Place")]},
    {"id": "vanderbilt_control", "area": "prospect_heights", "role": "control", "pair": "vanderbilt",
     "name": "Flatbush Ave (Dean St–8th Ave)",
     "legs": [("^Flatbush Avenue", r"^Dean Street", r"^8th Avenue")]},
    {"id": "hayes", "area": "hayes_valley", "role": "forward", "pair": None,
     "name": "Hayes St (Gough–Octavia)",
     "legs": [("^Hayes Street", r"^Gough Street", r"^Octavia")]},
]
