# StreetShift Analyst

![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)
![tag:hackathon](https://img.shields.io/badge/hackathon-5F43F1)

**Ask what happens when a street goes car-free.** The StreetShift Analyst runs a city simulation of a street closure (pedestrianization) and tells you three things, each with a range:

- **Connection:** conversations per hour, how long people linger, new connections formed, and whether the new space thrives or sits empty.
- **Economy:** revenue change for the businesses on and around the street.
- **Traffic:** added vehicle-hours and which streets absorb the overflow.

The model is backtested on five real 2020 New York City Open Streets against the city's published restaurant sales data, so every answer comes with its track record.

## Example questions

- What happens if NYC pedestrianizes Ditmars Blvd in Astoria?
- What if San Francisco closed Hayes Street to cars full-time, with seating and weekend events?
- Would closing Pell and Doyers Streets in Chinatown help restaurants?
- How accurate is StreetShift on real streets?

## Streets modelled

Hayes St (Gough–Octavia), San Francisco · Ditmars Blvd, Astoria · 5th Ave, Park Slope · Pell & Doyers Sts, Chinatown · E 32nd St, Koreatown · Vanderbilt Ave, Prospect Heights.

## How it works

Claude reads your question and picks the street and options. The agent runs the scenario on the StreetShift simulator (OpenStreetMap road network, Google Maps businesses via Apify, US Census population, NYC traffic and pedestrian counts) and answers in plain language with a link to the live 3D map.

Keywords: urban planning, pedestrian street, car-free street, open streets, city simulation, traffic impact, small business, public space, placemaking.
