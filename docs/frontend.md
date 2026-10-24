# Frontend: deck.gl 9 + MapLibre GL JS + OpenFreeMap — saved reference for StreetShift

Sources (fetched 2026-10-24):
- deck.gl docs (tag v9.4.0), raw markdown from https://github.com/visgl/deck.gl/tree/v9.4.0/docs (verbatim): mapbox-overlay, using-with-maplibre, trips-layer, path-layer, column-layer, arc-layer, scatterplot-layer, core/layer (base props incl. `parameters`, `updateTriggers`, `transitions`), animations-and-transitions, react/deckgl, get-started/using-with-react
- deck.gl Trips example: https://github.com/visgl/deck.gl/blob/v9.4.0/examples/website/trips/app.tsx
- luma.gl GPU parameters (blending): https://github.com/visgl/luma.gl/blob/master/docs/api-reference/core/parameters.md
- MapLibre GL JS docs (markdown, via https://maplibre.org/maplibre-gl-js/docs/llms.txt): examples display-a-map, display-buildings-in-3d, animate-map-camera-around-a-point, create-a-hover-effect, change-building-color-based-on-zoom-level; v5-to-v6 migration guide; Map class method excerpts; style spec (layer properties, fill-extrusion, line) from https://maplibre.org/maplibre-style-spec/layers/
- OpenFreeMap: https://openfreemap.org/quick_start/ , https://tiles.openfreemap.org/styles/{liberty,dark,bright,positron,fiord} , https://tiles.openfreemap.org/planet (TileJSON)

## KEY FACTS (summary written by the doc fetcher)

- Current npm versions (2026-10-24): `deck.gl` **9.4.0**; `@deck.gl/core`, `@deck.gl/layers`, `@deck.gl/geo-layers`, `@deck.gl/mapbox`, `@deck.gl/react` all **9.4.0**; `maplibre-gl` **6.15.0** (MapLibre v6 — read the v5→v6 migration guide below).
- Imports: `import {TripsLayer} from '@deck.gl/geo-layers'`; `import {ColumnLayer, PathLayer, ArcLayer, ScatterplotLayer} from '@deck.gl/layers'`; `import {MapboxOverlay} from '@deck.gl/mapbox'`.
- Overlay on MapLibre: `const overlay = new MapboxOverlay({interleaved: true, layers: [...]}); map.addControl(overlay);` then update with `overlay.setProps({layers})` (full details in mapbox-overlay + using-with-maplibre sections below).
- Animate TripsLayer by updating `currentTime` each frame (requestAnimationFrame) and re-setting layers; see the Trips example app below.
- Additive "glow" blending in deck.gl 9 uses luma.gl 9 WebGPU-style string parameters on the layer's `parameters` prop, e.g.
  `parameters: {blendColorOperation: 'add', blendColorSrcFactor: 'src-alpha', blendColorDstFactor: 'one', blendAlphaOperation: 'add', blendAlphaSrcFactor: 'one', blendAlphaDstFactor: 'one-minus-src-alpha', depthWriteEnabled: false}`.
  Param names/values are from the luma.gl doc below. Whether a separate `blend: true` flag is also required is NOT stated in the fetched docs — test it. (deck.gl 8 used WebGL constants like `GL.SRC_ALPHA`; don't use those.)
- **OpenFreeMap styles** (free, no API key; each returned HTTP 200 on 2026-10-24):
  `https://tiles.openfreemap.org/styles/liberty`, `https://tiles.openfreemap.org/styles/bright`, `https://tiles.openfreemap.org/styles/positron`, `https://tiles.openfreemap.org/styles/dark`, `https://tiles.openfreemap.org/styles/fiord`.
  The site's "3D" demo button is `data-style="liberty-3d"`, but `https://tiles.openfreemap.org/styles/liberty-3d` returned **404**: 3D is the `liberty` style (it ships a `building-3d` fill-extrusion layer at minzoom 14) viewed with pitch.
- Vector source used by all styles: `"openmaptiles": {"type": "vector", "url": "https://tiles.openfreemap.org/planet"}` (TileJSON). The tiles URL inside is date-stamped (e.g. `https://tiles.openfreemap.org/planet/20261018_080001_pt/{z}/{x}/{y}.pbf`), so always reference the TileJSON URL. Schema = OpenMapTiles; max zoom 14 (overzoomed beyond).
- Buildings: source-layer **`building`** (z13–14) with fields `render_height`, `render_min_height`, `colour`, `hide_3d`.
  Glyphs: `https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf`; sprite: `https://tiles.openfreemap.org/sprites/ofm_f384/ofm`.
- The `dark` style has only a flat `building` **fill** layer (`fill-color: rgb(10,10,10)`), no extrusion. For dark 3D buildings: load `styles/dark`, then after `map.on('load')` add a fill-extrusion layer modelled on liberty's `building-3d` (copied verbatim below), e.g.
  `map.addLayer({id: 'building-3d', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 14, filter: ['!=', ['get', 'hide_3d'], true], paint: {'fill-extrusion-color': '#1a1d24', 'fill-extrusion-height': ['get', 'render_height'], 'fill-extrusion-base': ['get', 'render_min_height'], 'fill-extrusion-opacity': 0.85}})`
  (this snippet is the fetcher's composition from the liberty layer + TileJSON fields, not an official example; the `hide_3d` filter is optional).
- Vite worker setup for MapLibre (verbatim from OpenFreeMap quick start): `import { Map, setWorkerUrl } from 'maplibre-gl'`; `import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'`; `setWorkerUrl(workerUrl)`.
- Fallback dark style (`MAP_STYLE_URL` in .env): `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json` (the deck.gl Trips example uses `https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json`).

---


# OpenFreeMap

OpenFreeMap Quick Start Guide

## OpenFreeMap
Quick Start Guide

This guide provides step-by-step instructions for integrating OpenFreeMap into your website or mobile application.

To get started, choose a style from the default styles provided below. Later, there’ll be options to use custom styles as well.

(You can navigate the map, it’s interactive!)

OpenFreeMap © OpenMapTiles Data from OpenStreetMap
PositronBrightLibertyDarkFiord3D

Use the following style in a MapLibre map:https://tiles.openfreemap.org/styles/liberty

## How to load MapLibre?

Install MapLibre GL JS:

```
npm install maplibre-gl
```

Add a map container to your page:

```
<div id="map" style="height: 500px"></div>
```

Then initialize the map:

```
import { Map, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

// Vite worker setup
setWorkerUrl(workerUrl)

new Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [13.388, 52.517],
  zoom: 9.5,
})
```

For other bundlers, see MapLibre’s installation guide.

## Using Mapbox?

If you are currently using Mapbox, please change your libraries to MapLibre GL JS. MapLibre is based on the last open-source version of Mapbox GL JS before it went closed-source. Migrating should be as simple as changing the libraries, as long as you are not using any features specific to the 2.x or later releases.

## Using Leaflet

MapLibre GL Leaflet lets you add OpenFreeMap vector tiles to a Leaflet map.

```
npm install leaflet maplibre-gl @maplibre/maplibre-gl-leaflet
```

```
import * as L from 'leaflet'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'

// Vite worker setup
setWorkerUrl(workerUrl)

const map = L.map('map').setView([52.517, 13.388], 10)
maplibreGL({ style: 'https://tiles.openfreemap.org/styles/liberty' }).addTo(map)
```

## Using OpenLayers

ol-mapbox-style creates OpenLayers layers from a MapLibre style.

```
npm install ol ol-mapbox-style
```

```
import Map from 'ol/Map.js'
import View from 'ol/View.js'
import LayerGroup from 'ol/layer/Group.js'
import { fromLonLat } from 'ol/proj.js'
import { apply } from 'ol-mapbox-style'
import 'ol/ol.css'

const openfreemap = new LayerGroup()
apply(openfreemap, 'https://tiles.openfreemap.org/styles/liberty')

new Map({
  target: 'map',
  layers: [openfreemap],
  view: new View({ center: fromLonLat([13.388, 52.517]), zoom: 10.5 }),
})
```

## Mobile Apps

For mobile apps, you can use the same styles with MapLibre Native.

Offline downloads are allowed up to 3,000 tiles or 50 MB per download, with at most 4 parallel requests and a unique User-Agent. For anything larger, please contact us.

## Custom styles

You can customize the styles using the Maputnik editor. For example, you can remove labels, POIs, or change colors.

When you use a customized style, you need to host the style JSON yourself and use its URL in MapLibre.

Customize Bright

Customize Liberty

Customize Positron

## Self-hosting

You can also download our processed full planet Btrfs images if you want to self-host yourself. Details can be found on GitHub.

Start by copying config/linux_host/config.sample.jsonc to a named config such as config/linux_host/self-hosted.jsonc, then fill out your domain, certificate settings, areas (use ["monaco"] first, then ["planet", "monaco"]), and auto_update before running ./linux_host/deploy_linux_host.py --config self-hosted.

## How can I sponsor the project?

If this project helps you save on your map hosting costs, please consider sponsoring me on GitHub Sponsors.

If possible, please choose a monthly donation, even if it’s a smaller amount. The nature of this project needs recurring donations to cover the server costs.
Sponsor mePrivacy PolicyTerms of Service


## OpenFreeMap `liberty` style: sources + building layers (verbatim JSON from https://tiles.openfreemap.org/styles/liberty)

```json
{
 "ne2_shaded": {
  "maxzoom": 6,
  "tileSize": 256,
  "tiles": [
   "https://tiles.openfreemap.org/natural_earth/ne2sr/{z}/{x}/{y}.png"
  ],
  "type": "raster"
 },
 "openmaptiles": {
  "type": "vector",
  "url": "https://tiles.openfreemap.org/planet"
 }
}
{
 "id": "building",
 "type": "fill",
 "source": "openmaptiles",
 "source-layer": "building",
 "minzoom": 13,
 "maxzoom": 14,
 "paint": {
  "fill-color": "hsl(35,8%,85%)",
  "fill-outline-color": [
   "interpolate",
   [
    "linear"
   ],
   [
    "zoom"
   ],
   13,
   "hsla(35,6%,79%,0.32)",
   14,
   "hsl(35,6%,79%)"
  ]
 }
}
{
 "id": "building-3d",
 "type": "fill-extrusion",
 "source": "openmaptiles",
 "source-layer": "building",
 "minzoom": 14,
 "paint": {
  "fill-extrusion-base": [
   "get",
   "render_min_height"
  ],
  "fill-extrusion-color": "hsl(35,8%,85%)",
  "fill-extrusion-height": [
   "get",
   "render_height"
  ],
  "fill-extrusion-opacity": 0.8
 }
}
```

## OpenFreeMap `dark` style: top-level keys, building layer, list of layer ids (verbatim from https://tiles.openfreemap.org/styles/dark)

```json
{
 "version": 8,
 "sources": {
  "ne2_shaded": {
   "maxzoom": 6,
   "tileSize": 256,
   "tiles": [
    "https://tiles.openfreemap.org/natural_earth/ne2sr/{z}/{x}/{y}.png"
   ],
   "type": "raster"
  },
  "openmaptiles": {
   "type": "vector",
   "url": "https://tiles.openfreemap.org/planet"
  }
 },
 "sprite": "https://tiles.openfreemap.org/sprites/ofm_f384/ofm",
 "glyphs": "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf"
}
{
 "id": "building",
 "type": "fill",
 "source": "openmaptiles",
 "source-layer": "building",
 "minzoom": 12,
 "filter": [
  "match",
  [
   "geometry-type"
  ],
  [
   "MultiPolygon",
   "Polygon"
  ],
  true,
  false
 ],
 "paint": {
  "fill-antialias": true,
  "fill-color": "rgb(10,10,10)",
  "fill-outline-color": "rgb(27 ,27 ,29)"
 }
}
// layer ids (id, type): [["background", "background"], ["water", "fill"], ["landcover_ice_shelf", "fill"], ["landcover_glacier", "fill"], ["landuse_residential", "fill"], ["landcover_wood", "fill"], ["landuse_park", "fill"], ["waterway", "line"], ["water_name", "symbol"], ["building", "fill"], ["aeroway-taxiway", "line"], ["aeroway-runway-casing", "line"], ["aeroway-area", "fill"], ["aeroway-runway", "line"], ["road_area_pier", "fill"], ["road_pier", "line"], ["highway_path", "line"], ["highway_minor", "line"], ["highway_major_casing", "line"], ["highway_major_inner", "line"], ["highway_major_subtle", "line"], ["highway_motorway_casing", "line"], ["highway_motorway_inner", "line"], ["road_oneway", "symbol"], ["road_oneway_opposite", "symbol"], ["highway_motorway_subtle", "line"], ["railway_transit", "line"], ["railway_transit_dashline", "line"], ["railway_minor", "line"], ["railway_minor_dashline", "line"], ["railway", "line"], ["railway_dashline", "line"], ["highway_name_other", "symbol"], ["highway_name_motorway", "symbol"], ["boundary_state", "line"], ["boundary_country_z0-4", "line"], ["boundary_country_z5-", "line"], ["place_other", "symbol"], ["place_suburb", "symbol"], ["place_village", "symbol"], ["place_town", "symbol"], ["place_city", "symbol"], ["place_city_large", "symbol"], ["place_state", "symbol"], ["place_country_other", "symbol"], ["place_country_minor", "symbol"], ["place_country_major", "symbol"]]
```

## OpenFreeMap planet TileJSON summary (from https://tiles.openfreemap.org/planet)

```
tiles: ['https://tiles.openfreemap.org/planet/20261018_080001_pt/{z}/{x}/{y}.pbf'] minzoom 0 maxzoom 14
aerodrome_label z8-14 {'class': 'String', 'ele': 'Number', 'ele_ft': 'Number', 'iata': 'String', 'icao': 'String', 'name': 'String', 'name_de': 'String', 'name_en': 'String', 'name_int': 'String'}
aeroway z10-14 {'class': 'String', 'ref': 'String'}
boundary z0-14 {'adm0_l': 'String', 'adm0_r': 'String', 'admin_level': 'Number', 'claimed_by': 'String', 'class': 'String', 'disputed': 'Number', 'disputed_name': 'String', 'maritime': 'Number', 'name': 'String', 'name_de': 'String', 'name_en': 'String', 'name_int': 'String'}
building z13-14 {'colour': 'String', 'hide_3d': 'Boolean', 'render_height': 'Number', 'render_min_height': 'Number'}
housenumber z14-14 {'housenumber': 'String'}
landcover z0-14 {'class': 'String', 'subclass': 'String'}
landuse z4-14 {'class': 'String'}
mountain_peak z7-14 {'class': 'String', 'customary_ft': 'Number', 'ele': 'Number', 'ele_ft': 'Number', 'name': 'String', 'name_de': 'String', 'name_en': 'String', 'name_int': 'String', 'rank': 'Number'}
park z4-14 {'class': 'String', 'name': 'String', 'name_de': 'String', 'name_en': 'String', 'name_int': 'String', 'rank': 'Number'}
place z0-14 {'capital': 'Number', 'class': 'String', 'iso_a2': 'String', 'name': 'String', 'name_de': 'String', 'name_en': 'String', 'name_int': 'String', 'rank': 'Number'}
poi z11-14 {'agg_stop': 'Number', 'class': 'String', 'indoor': 'Number', 'layer': 'Number', 'level': 'Number', 'name': 'String', 'name_de': 'String', 'name_en': 'String', 'name_int': 'String', 'rank': 'Number', 'subclass': 'String'}
transportation z4-14 {'access': 'String', 'bicycle': 'String', 'brunnel': 'String', 'class': 'String', 'expressway': 'Number', 'foot': 'String', 'horse': 'String', 'indoor': 'Number', 'layer': 'Number', 'level': 'Number', 'mtb_scale': 'String', 'network': 'String', 'official': 'Number', 'oneway': 'Number', 'ramp': 'Number', 'service': 'String', 'subclass': 'String', 'surface': 'String', 'toll': 'Number'}
transportation_name z6-14 {'class': 'String', 'indoor': 'Number', 'layer': 'Number', 'level': 'Number', 'name': 'String', 'name_de': 'String', 'name_en': 'String', 'name_int': 'String', 'network': 'String', 'ref': 'String', 'ref_length': 'Number', 'subclass': 'String'}
water z0-14 {'brunnel': 'String', 'class': 'String', 'id': 'Number', 'intermittent': 'Number'}
water_name z0-14 {'class': 'String', 'intermittent': 'Number', 'name': 'String', 'name_de': 'String', 'name_en': 'String', 'name_int': 'String'}
waterway z3-14 {'brunnel': 'String', 'class': 'String', 'intermittent': 'Number', 'name': 'String', 'name_de': 'String', 'name_en': 'String', 'name_int': 'String'}
```


---

Source: https://github.com/visgl/deck.gl/blob/v9.4.0/docs/api-reference/mapbox/mapbox-overlay.md

# MapboxOverlay

`MapboxOverlay` is an implementation of [Mapbox GL JS](https://www.npmjs.com/package/mapbox-gl)'s [IControl](https://docs.mapbox.com/mapbox-gl-js/api/markers/#icontrol) API. When adding a `MapboxOverlay` control to an mapbox map, deck.gl layers are rendered in synchronization with the base map layers. This control supports both [overlaid and interleaved](../../get-started/using-with-map.md) rendering modes.

## Example

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="language">
  <TabItem value="ts" label="TypeScript">

```ts
import {MapboxOverlay} from '@deck.gl/mapbox';
import {ScatterplotLayer} from '@deck.gl/layers';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v9',
  accessToken: '<mapbox_access_token>',
  center: [0.45, 51.47],
  zoom: 11
});

map.once('load', () => {
  const deckOverlay = new MapboxOverlay({
    interleaved: true,
    layers: [
      new ScatterplotLayer({
        id: 'deckgl-circle',
        data: [
          {position: [0.45, 51.47]}
        ],
        getPosition: d => d.position,
        getFillColor: [255, 0, 0, 100],
        getRadius: 1000,
        beforeId: 'waterway-label' // In interleaved mode render the layer under map labels. Replace with `slot: 'bottom'` if using Mapbox v3 Standard Style.
      })
    ]
  });

  map.addControl(deckOverlay);
});
```

  </TabItem>
  <TabItem value="react" label="React">

```tsx
import React from 'react';
import {Map, useControl} from 'react-map-gl/mapbox';
import {MapboxOverlay} from '@deck.gl/mapbox';
import {DeckProps} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';
import 'mapbox-gl/dist/mapbox-gl.css';

function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

function App() {
  const layers: [
    new ScatterplotLayer({
      id: 'deckgl-circle',
      data: [
        {position: [0.45, 51.47]}
      ],
      getPosition: d => d.position,
      getFillColor: [255, 0, 0, 100],
      getRadius: 1000,
      beforeId: 'waterway-label' // In interleaved mode render the layer under map labels. Replace with `slot: 'bottom'` if using Mapbox v3 Standard Style.
    })
  ];

  return (
    <Map
      initialViewState={{
        longitude: 0.45,
        latitude: 51.47,
        zoom: 11
      }}
      mapStyle="mapbox://styles/mapbox/light-v9"
      mapboxAccessToken="<mapbox_access_token>"
    >
      <DeckGLOverlay layers={layers} interleaved />
    </Map>
  );
}
```

See react-map-gl's [useControl](https://visgl.github.io/react-map-gl/docs/api-reference/use-control) hook.

  </TabItem>
</Tabs>


## Constructor

```ts
import {MapboxOverlay} from '@deck.gl/mapbox';
import type {MapboxOverlayProps} from '@deck.gl/mapbox';

new MapboxOverlay(props: MapboxOverlayProps);
```

`MapboxOverlay` accepts the same props as the [Deck](../core/deck.md) class, with the following exceptions:

- `views` - multi-view support is limited. There is only one `MapView` that can synchronize with the base map. See the [using with multi-views](#multi-view-usage) section for details.
- `parent` / `canvas` / `device` - context creation is managed internally.
- `viewState` / `initialViewState` - camera state is managed internally.
- `controller` - always disabled (to use Mapbox's interaction handlers).
- `useDevicePixels` - ignored in interleaved mode, where the base map owns the WebGL context and the canvas drawing buffer size. To control pixel ratio in interleaved mode, use MapLibre's [`pixelRatio`](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/#pixelratio) constructor option on the Map instance. Mapbox GL JS does not expose an equivalent option.

The constructor additionally accepts the following options:

- `interleaved` (boolean) - If `false`, a dedicated deck.gl canvas is added on top of the base map. If `true`, deck.gl layers are inserted into mapbox-gl's layer stack, and share the same `WebGL2RenderingContext` as the base map. Default is `false`. Note that interleaving with basemaps such as mapbox-gl-js v1 that only support WebGL 1 is not supported, see [compatibility](./overview#interleaved-renderer-compatibility).

When using `interleaved: true`, deck.gl layers are grouped by their `beforeId` or `slot` prop and rendered in batches. You may control the ordering of layers in the Mapbox/MapLibre stack by optionally adding a `beforeId` prop to a layer. If multiple deck.gl layers have the same `beforeId`, they are rendered together in the order that is passed into the `layers` array, enabling cross-layer extension handling (e.g. MaskExtension, CollisionFilterExtension). If used with Mapbox v3 Standard Style, supply a [slot](https://docs.mapbox.com/mapbox-gl-js/guides/migrate/#layer-slots) prop to layers instead.

Note that extensions which require layers to share a rendering context (such as MaskExtension and CollisionFilterExtension) only work between layers within the same group. Ensure that layers using these extensions share the same `beforeId` or `slot` value.

## Methods

##### setProps

```ts
const overlay = new MapboxOverlay({
  interleaved: true,
  layers: []
});

map.addControl(overlay);

// Update layers
overlay.setProps({
  layers: [new ScatterplotLayer({...})]
})
```

Updates (partial) props of the underlying `Deck` instance. See [Deck.setProps](../core/deck.md#setprops).

##### pickObject

See [Deck.pickObject](../core/deck.md#pickobject).

##### pickObjects

See [Deck.pickObjects](../core/deck.md#pickobjects).

##### pickMultipleObjects

See [Deck.pickMultipleObjects](../core/deck.md#pickmultipleobjects).

##### finalize

Removes the control and deletes all resources.

##### getCanvas

See [Deck.getCanvas](../core/deck.md#getcanvas). When using `interleaved: true`, returns the base map's `canvas`.

## Remarks

### Antialiasing

Base maps create their WebGL context with `antialias: false`, so in interleaved mode deck.gl layers receive no multisampling. Layers that rely on it — including [PathLayer](../layers/path-layer.md), [LineLayer](../layers/line-layer.md), [ArcLayer](../layers/arc-layer.md), and [PointCloudLayer](../layers/point-cloud-layer.md) — will look aliased against the base map. Set `antialiasing: true` on those layers, or enable MSAA on the base map itself.

### Multi-view usage

When using `MapboxOverlay` with multiple views passed to the `views` prop, only one of the views can match the base map and receive interaction.

With that said, it is still possible to take advantage of deck's multi-view system and render a mapbox base map onto any one `MapView` of your choice by setting the `views` array and a `layerFilter` callback.

**View ID Conventions:**
- `MapboxOverlay` internally uses a `MapView` with the id `"mapbox"` to synchronize with the base map's camera.
- You can reference this view id in your `layerFilter` to control which layers render on the main map.
- When providing custom views, you do **not** need to explicitly include a view with id `"mapbox"` - it will be automatically injected if not present.
- If you want to customize the mapbox-synchronized view (e.g., to control draw order with other custom views), you can explicitly define a `MapView({id: 'mapbox'})` in your views array.

```ts
import {MapboxOverlay} from '@deck.gl/mapbox';
import {Deck, MapView, OrthographicView} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';

const map = new mapboxgl.Map({...});

const overlay = new MapboxOverlay({
  views: [
    // This view will be synchronized with the base map
    new MapView({id: 'mapbox'}),
    // This view will not be interactive
    new OrthographicView({id: 'widget'})
  ],
  layerFilter: ({layer, viewport}) => {
    const shouldDrawInWidget = layer.id.startsWith('widget');
    if (viewport.id === 'widget') return shouldDrawInWidget;
    return !shouldDrawInWidget;
  },
  layers: [
    new ScatterplotLayer({
      id: 'my-scatterplot',
      data: [
        {position: [-74.5, 40], size: 100}
      ],
      getPosition: d => d.position,
      getRadius: d => d.size,
      getFillColor: [255, 0, 0]
    }),
    new ScatterplotLayer({
      id: 'widget-scatterplot',
      data: [
        {position: [0, 0], size: 100}
      ],
      getPosition: d => d.position,
      getRadius: d => d.size,
      getFillColor: [255, 0, 0]
    })
  ]
});

map.addControl(overlay);
```



---

Source: https://github.com/visgl/deck.gl/blob/v9.4.0/docs/developer-guide/base-maps/using-with-maplibre.md

# Using with MapLibre

| Pure JS | React | Overlaid | Interleaved |
| ----- | ----- | ----- | ----- |
|  ✓ | ✓ | [example](https://github.com/visgl/deck.gl/tree/9.4-release/examples/get-started/pure-js/maplibre) | [example](https://deck.gl/gallery/maplibre-overlay) |

[MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) is a powerful open-source library that uses WebGL to render interactive maps from vector tiles in a browser. deck.gl's `MapView` can sync perfectly with the camera of MapLibre, at every zoom level and rotation angle.

MapLibre GL JS v4.5.1, v5, and v6 applications should use `MapLibreOverlay` from `@deck.gl/maplibre`.

## Integration Modes

When using deck.gl and MapLibre, there are three options you can choose from: interleaved, overlaid, and reverse-controlled.

### Interleaved

The [interleaved](../../get-started/using-with-map.md#interleaved) mode renders deck.gl layers into the WebGL2 context created by MapLibre. If you need to mix deck.gl layers with MapLibre layers, e.g. having deck.gl surfaces below text labels, or objects occluding each other correctly in 3D, then you have to use this option.

Interleaving is supported by using [MapLibreOverlay](../../api-reference/maplibre/overview.md) with `interleaved: true`. It only works when WebGL2 is available. See [compatibility](../../api-reference/maplibre/overview.md#compatibility).


### Overlaid

The [overlaid](../../get-started/using-with-map.md#overlaid) mode renders deck.gl in a separate canvas inside the MapLibre's controls container. If your use case does not require interleaving, but you still want to use certain features of maplibre-gl, such as maplibre-gl controls (e.g. `NavigationControl`, `Popup`) or plugins (e.g. [navigation directions](https://github.com/mapbox/mapbox-gl-directions), [mapbox-gl-draw](https://maplibre.org/maplibre-gl-js/docs/examples/mapbox-gl-draw/)), then you should use this option.

This is supported by using [MapLibreOverlay](../../api-reference/maplibre/overview.md) with `interleaved: false`.


### Reverse Controlled

The reverse-controlled mode renders deck.gl above the MapLibre container and blocks any interaction to the base map. If your use case does not require interleaving, but you need to implement your own [pointer input handling](../../api-reference/core/controller.md), have multiple maps or a map that does not fill the whole canvas (with Deck's [multi-view feature](../views.md#using-multiple-views)), you need this to allow deck.gl manage the map's size and camera.

You cannot use maplibre-gl controls and plugins with this option. Instead, use the components from `@deck.gl/widgets`.


## Examples

### Example: interleaved or overlaid

Both the interleaved and overlaid options are supported by the [`@deck.gl/maplibre`](../../api-reference/maplibre/overview.md) module. It is compatible with MapLibre controls and plugins.

The examples below use Vite's worker URL import. See the [MapLibre installation guide](https://maplibre.org/maplibre-gl-js/docs/#installation) for other bundlers.


import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="language">
  <TabItem value="ts" label="TypeScript">

```ts
import {MapLibreOverlay} from '@deck.gl/maplibre';
import {ScatterplotLayer} from '@deck.gl/layers';
import {Map, setWorkerUrl} from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';

setWorkerUrl(maplibreWorkerUrl);

const map = new Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  center: [0.45, 51.47],
  zoom: 11
});

await map.once('load');

const deckOverlay = new MapLibreOverlay({
  interleaved: true,
  layers: [
    new ScatterplotLayer({
      id: 'deckgl-circle',
      data: [
        {position: [0.45, 51.47]}
      ],
      getPosition: d => d.position,
      getFillColor: [255, 0, 0, 100],
      getRadius: 1000,
      beforeId: 'watername_ocean' // In interleaved mode render the layer under map labels
    })
  ]
});

map.addControl(deckOverlay);
```

  </TabItem>
  <TabItem value="react" label="React">

```tsx
import React from 'react';
import {Map, useControl} from 'react-map-gl/maplibre';
import {setWorkerUrl} from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import {MapLibreOverlay, MapLibreOverlayProps} from '@deck.gl/maplibre';
import {ScatterplotLayer} from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';

setWorkerUrl(maplibreWorkerUrl);

function DeckGLOverlay(props: MapLibreOverlayProps) {
  const overlay = useControl<MapLibreOverlay>(() => new MapLibreOverlay(props));
  overlay.setProps(props);
  return null;
}

function App() {
  const layers = [
    new ScatterplotLayer({
      id: 'deckgl-circle',
      data: [
        {position: [0.45, 51.47]}
      ],
      getPosition: d => d.position,
      getFillColor: [255, 0, 0, 100],
      getRadius: 1000,
      beforeId: 'watername_ocean' // In interleaved mode render the layer under map labels
    })
  ];

  return (
    <Map
      initialViewState={{
        longitude: 0.45,
        latitude: 51.47,
        zoom: 11
      }}
      mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    >
      <DeckGLOverlay layers={layers} interleaved />
    </Map>
  );
}
```

  </TabItem>
</Tabs>


You can find full project setups in the [react get-started example](https://github.com/visgl/deck.gl/tree/9.4-release/examples/get-started/react/maplibre/) and [pure js get-started example](https://github.com/visgl/deck.gl/tree/9.4-release/examples/get-started/pure-js/maplibre/).


### Example: reverse controlled

The reverse-controlled option is supported by the pre-built scripting bundle, and in React when used with the `react-map-gl` library. There is currently no easy way to do it under Vanilla JS.

<Tabs groupId="language">
  <TabItem value="scripting" label="Scripting">

```js
<script src="https://unpkg.com/deck.gl@^9.0.0/dist.min.js"></script>
<script src="https://unpkg.com/maplibre-gl@^4.0.0/dist/maplibre-gl.js"></script>
<link href="https://unpkg.com/maplibre-gl@^4.0.0/dist/maplibre-gl.css" rel="stylesheet" />
<script type="text/javascript">
  const {DeckGL, ScatterplotLayer} = deck;

  new DeckGL({
    mapStyle: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    initialViewState: {
      longitude: 0.45,
      latitude: 51.47,
      zoom: 11
    },
    controller: true,
    layers: [
      new ScatterplotLayer({
        id: 'deckgl-circle',
        data: [
          {position: [0.45, 51.47]}
        ],
        getPosition: d => d.position,
        getFillColor: [255, 0, 0, 100],
        getRadius: 1000
      })
    ]
  });
</script>
```

  </TabItem>

  <TabItem value="react" label="React">

```tsx
import React from 'react';
import {Map} from 'react-map-gl/maplibre';
import {DeckGL} from '@deck.gl/react';
import {ScatterplotLayer} from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';

function App() {
  const layers = [
    new ScatterplotLayer({
      id: 'deckgl-circle',
      data: [
        {position: [0.45, 51.47]}
      ],
      getPosition: d => d.position,
      getFillColor: [255, 0, 0, 100],
      getRadius: 1000,
    })
  ];

  return (
    <DeckGL
      initialViewState={{
        longitude: 0.45,
        latitude: 51.47,
        zoom: 11
      }}
      controller
      layers={layers}
    >
      <Map mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" />
    </DeckGL>
  );
}
```

  </TabItem>
</Tabs>


## Additional Information

### react-map-gl

[react-map-gl](https://github.com/visgl/react-map-gl) is a React wrapper around maplibre-gl maintained by the vis.gl community. If you'd like to use deck.gl together with maplibre-gl and React, this library is the recommended companion.

All the [examples on this website](https://github.com/visgl/deck.gl/tree/9.4-release/examples/website) are implemented using the React integration.

When you choose the interleaved or overlaid option, the react-map-gl [Map](https://visgl.github.io/react-map-gl/docs/api-reference/map) React component acts as the root component, and [MapLibreOverlay](../../api-reference/maplibre/overview.md#example) is used with react-map-gl's `useControl` hook.

When you choose the reverse-controlled option, the `DeckGL` React component acts as the root component, and the react-map-gl [Map](https://visgl.github.io/react-map-gl/docs/api-reference/map) is a child. In this case, `Map` will automatically interpret the deck.gl view state (i.e. latitude, longitude, zoom etc), so that deck.gl layers will render as a synchronized geospatial overlay over the underlying map.


### Choosing a map tile service

There are paid map tile servers such as [MapTiler](https://www.maptiler.com/), [Stadia Maps](https://stadiamaps.com/), and [AWS Location Service](https://docs.aws.amazon.com/location/latest/developerguide/map-concepts.html).

deck.gl public demos use [CARTO free basemaps](https://carto.com/basemaps) as a non-commercial application. Checkout [this guide](../../api-reference/carto/basemap.md) to start using it.

If you host your own map tiles, you will need a custom map style JSON that points to your own [vector tile source](https://maplibre.org/maplibre-style-spec/), this custom style must match the schema of your tile source.

Open source tile schemas include:

- [TileZen schema](https://tilezen.readthedocs.io/en/latest/layers/)
- [OpenMapTiles schema ](https://openmaptiles.org/schema/)
- [Mapbox Vector Tile Spec](https://www.mapbox.com/developers/vector-tiles/)

Some useful resources for hosting your own map tiles:

- [Martin](https://github.com/maplibre/martin), a tile server from the MapLibre organization
- [Open source tools](https://github.com/mapbox/awesome-vector-tiles)
- [Maputnik Style editor](https://maplibre.org/maputnik/)



---

Source: https://github.com/visgl/deck.gl/blob/v9.4.0/docs/api-reference/geo-layers/trips-layer.md

# TripsLayer

import {TripsLayerDemo} from '@site/src/doc-demos/geo-layers';

<TripsLayerDemo />

The `TripsLayer` renders animated paths that represent vehicle trips.



import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="language">
  <TabItem value="js" label="JavaScript">

```js
import {Deck} from '@deck.gl/core';
import {TripsLayer} from '@deck.gl/geo-layers';

const layer = new TripsLayer({
  id: 'TripsLayer',
  data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/sf.trips.json',
  
  getPath: d => d.waypoints.map(p => p.coordinates),
  // Timestamp is stored as float32, do not return a long int as it will cause precision loss
  getTimestamps: d => d.waypoints.map(p => p.timestamp - 1554772579000),
  getColor: [253, 128, 93],
  currentTime: 500,
  trailLength: 600,
  capRounded: true,
  jointRounded: true,
  widthMinPixels: 8
});

new Deck({
  initialViewState: {
    longitude: -122.4,
    latitude: 37.74,
    zoom: 11
  },
  controller: true,
  layers: [layer]
});
```

  </TabItem>
  <TabItem value="ts" label="TypeScript">

```ts
import {Deck} from '@deck.gl/core';
import {TripsLayer} from '@deck.gl/geo-layers';

type DataType = {
  waypoints: {
    coordinates: [longitude: number, latitude: number];
    timestamp: number;
  }[]
};

const layer = new TripsLayer<DataType>({
  id: 'TripsLayer',
  data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/sf.trips.json',
  
  getPath: (d: DataType) => d.waypoints.map(p => p.coordinates),
  // Timestamp is stored as float32, do not return a long int as it will cause precision loss
  getTimestamps: (d: DataType) => d.waypoints.map(p => p.timestamp - 1554772579000),
  getColor: [253, 128, 93],
  currentTime: 500,
  trailLength: 600,
  capRounded: true,
  jointRounded: true,
  widthMinPixels: 8
});

new Deck({
  initialViewState: {
    longitude: -122.4,
    latitude: 37.74,
    zoom: 11
  },
  controller: true,
  layers: [layer]
});
```

  </TabItem>
  <TabItem value="react" label="React">

```tsx
import React from 'react';
import {DeckGL} from '@deck.gl/react';
import {TripsLayer} from '@deck.gl/geo-layers';

type DataType = {
  waypoints: {
    coordinates: [longitude: number, latitude: number];
    timestamp: number;
  }[]
};

function App() {
  const layer = new TripsLayer<DataType>({
    id: 'TripsLayer',
    data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/sf.trips.json',
    
    getPath: (d: DataType) => d.waypoints.map(p => p.coordinates),
    // Timestamp is stored as float32, do not return a long int as it will cause precision loss
    getTimestamps: (d: DataType) => d.waypoints.map(p => p.timestamp - 1554772579000),
    getColor: [253, 128, 93],
    currentTime: 500,
    trailLength: 600,
    capRounded: true,
    jointRounded: true,
    widthMinPixels: 8
  });

  return <DeckGL
    initialViewState={{
      longitude: -122.4,
      latitude: 37.74,
      zoom: 11
    }}
    controller
    layers={[layer]}
  />;
}
```

  </TabItem>
</Tabs>



## Installation

To install the dependencies from NPM:

```bash
npm install deck.gl
# or
npm install @deck.gl/core @deck.gl/layers @deck.gl/geo-layers
```

```ts
import {TripsLayer} from '@deck.gl/geo-layers';
import type {TripsLayerProps} from '@deck.gl/geo-layers';

new TripsLayer<DataT>(...props: TripsLayerProps<DataT>[]);
```

To use pre-bundled scripts:

```html
<script src="https://unpkg.com/deck.gl@^9.0.0/dist.min.js"></script>
<!-- or -->
<script src="https://unpkg.com/@deck.gl/core@^9.0.0/dist.min.js"></script>
<script src="https://unpkg.com/@deck.gl/layers@^9.0.0/dist.min.js"></script>
<script src="https://unpkg.com/@deck.gl/geo-layers@^9.0.0/dist.min.js"></script>
```

```js
new deck.TripsLayer({});
```


## Properties

Inherits from all [Base Layer](../core/layer.md) and [PathLayer](../layers/path-layer.md) properties, plus the following:

### Render Options

#### `currentTime` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#currenttime}

- Default: `0`

The current time of the frame, i.e. the playhead of the animation.

This value should be in the same units as the timestamps from `getPath`.

#### `fadeTrail` (boolean, optional) {#fadetrail}

- Default: `true`

Whether or not the path fades out.

If `false`, `trailLength` has no effect.

#### `trailLength` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#traillength}

- Default: `120`

How long it takes for a path to completely fade out.

This value should be in the same units as the timestamps from `getPath`.

### Data Accessors

#### `getPath` ([Accessor&lt;PathGeometry&gt;](../../developer-guide/using-layers.md#accessors), optional) {#getpath}

- Default: `d => d.path`

Called for each data object to retrieve paths.
Returns an array of navigation points on a single path.

See [PathLayer](../layers/path-layer.md) documentation for supported path formats.

#### `getTimestamps` ([Accessor&lt;number[]&gt;](../../developer-guide/using-layers.md#accessors), optional) {#gettimestamps}

- Default: `d => d.timestamps`

Returns an array of timestamps, one for each navigation point in the geometry returned by `getPath`, representing the time that the point is visited.

Because timestamps are stored as 32-bit floating numbers, raw unix epoch time can not be used. You may test the validity of a timestamp by calling `Math.fround(t)` to check if there would be any loss of precision.


## Remarks

### Using with GlobeView

When using this layer with [GlobeView](../core/globe-view.md) or MapLibre's globe projection, trails may be invisible when viewed from certain angles because `GlobeView` enables back-face culling by default. To ensure trails are visible from both sides, set:

```js
new TripsLayer({
  // ...other props
  parameters: {cullMode: 'none'}
});
```

# Source

[modules/geo-layers/src/trips-layer](https://github.com/visgl/deck.gl/tree/9.4-release/modules/geo-layers/src/trips-layer)



---

Source: https://github.com/visgl/deck.gl/blob/v9.4.0/docs/api-reference/layers/path-layer.md

# PathLayer
![webgpu](https://img.shields.io/badge/webgpu-supported-blue.svg?style=flat-square)

import {PathLayerDemo} from '@site/src/doc-demos/layers';

<PathLayerDemo />

The `PathLayer` renders lists of coordinate points as extruded polylines with mitering.

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="language">
  <TabItem value="js" label="JavaScript">

```js
import {Deck} from '@deck.gl/core';
import {PathLayer} from '@deck.gl/layers';

const layer = new PathLayer({
  id: 'PathLayer',
  data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/bart-lines.json',

  getColor: d => {
    const hex = d.color;
    // convert to RGB
    return hex.match(/[0-9a-f]{2}/g).map(x => parseInt(x, 16));
  },
  getPath: d => d.path,
  getWidth: 100,
  pickable: true
});

new Deck({
  initialViewState: {
    longitude: -122.4,
    latitude: 37.74,
    zoom: 11
  },
  controller: true,
  getTooltip: ({object}) => object && object.name,
  layers: [layer]
});
```

  </TabItem>
  <TabItem value="ts" label="TypeScript">

```ts
import {Deck, PickingInfo} from '@deck.gl/core';
import {PathLayer} from '@deck.gl/layers';

type BartLine = {
  name: string;
  color: string;
  path: [longitude: number, latitude: number][];
};

const layer = new PathLayer<BartLine>({
  id: 'PathLayer',
  data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/bart-lines.json',

  getColor: (d: BartLine) => {
    const hex = d.color;
    // convert to RGB
    return hex.match(/[0-9a-f]{2}/g).map(x => parseInt(x, 16));
  },
  getPath: (d: BartLine) => d.path,
  getWidth: 100,
  pickable: true
});

new Deck({
  initialViewState: {
    longitude: -122.4,
    latitude: 37.74,
    zoom: 11
  },
  controller: true,
  getTooltip: ({object}: PickingInfo<BartLine>) => object && object.name,
  layers: [layer]
});
```

  </TabItem>
  <TabItem value="react" label="React">

```tsx
import React from 'react';
import {DeckGL} from '@deck.gl/react';
import {PathLayer} from '@deck.gl/layers';
import type {PickingInfo} from '@deck.gl/core';

type BartLine = {
  name: string;
  color: string;
  path: [longitude: number, latitude: number][];
};

function App() {
  const layer = new PathLayer<BartLine>({
    id: 'PathLayer',
    data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/bart-lines.json',

    getColor: (d: BartLine) => {
      const hex = d.color;
      // convert to RGB
      return hex.match(/[0-9a-f]{2}/g).map(x => parseInt(x, 16));
    },
    getPath: (d: BartLine) => d.path,
    getWidth: 100,
    pickable: true
  });

  return <DeckGL
    initialViewState={{
      longitude: -122.4,
      latitude: 37.74,
      zoom: 11
    }}
    controller
    getTooltip={({object}: PickingInfo<BartLine>) => object && object.name}
    layers={[layer]}
  />;
}
```

  </TabItem>
</Tabs>


## Installation

To install the dependencies from NPM:

```bash
npm install deck.gl
# or
npm install @deck.gl/core @deck.gl/layers
```

```ts
import {PathLayer} from '@deck.gl/layers';
import type {PathLayerProps} from '@deck.gl/layers';

new PathLayer<DataT>(...props: PathLayerProps<DataT>[]);
```

To use pre-bundled scripts:

```html
<script src="https://unpkg.com/deck.gl@^9.0.0/dist.min.js"></script>
<!-- or -->
<script src="https://unpkg.com/@deck.gl/core@^9.0.0/dist.min.js"></script>
<script src="https://unpkg.com/@deck.gl/layers@^9.0.0/dist.min.js"></script>
```

```js
new deck.PathLayer({});
```

## Properties

Inherits from all [Base Layer](../core/layer.md) properties.

### Render Options

#### `widthUnits` (string, optional) {#widthunits}

* Default: `'meters'`

The units of the line width, one of `'meters'`, `'common'`, and `'pixels'`. See [unit system](../../developer-guide/coordinate-systems.md#supported-units).

#### `widthScale` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#widthscale}

* Default: `1`

The path width multiplier that multiplied to all paths.

#### `widthMinPixels` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#widthminpixels}

* Default: `0`

The minimum path width in pixels. This prop can be used to prevent the path from getting too thin when zoomed out.

#### `widthMaxPixels` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#widthmaxpixels}

* Default: Number.MAX_SAFE_INTEGER

The maximum path width in pixels. This prop can be used to prevent the path from getting too thick when zoomed in.


#### `capRounded` (boolean, optional) {#caprounded}

* Default: `false`

Type of caps. If `true`, draw round caps. Otherwise draw square caps.


#### `jointRounded` (boolean, optional) {#jointrounded}

* Default: `false`

Type of joint. If `true`, draw round joints. Otherwise draw miter joints.

#### `billboard` (boolean, optional) {#billboard}

* Default: `false`

If `true`, extrude the path in screen space (width always faces the camera).
If `false`, the width always faces up.

#### `miterLimit` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#miterlimit}

* Default: `4`

The maximum extent of a joint in ratio to the stroke width.
Only works if `jointRounded` is `false`.

#### `antialiasing` (boolean, optional) {#antialiasing}

* Default: `false`

When enabled, this prop computes edge coverage in the shader. When disabled, the layer relies on render-target multisampling. Shader-computed coverage can cause artifacts where a path overlaps itself. Only the edges along the width of the path are smoothed — flat caps at the two ends of a path are not; set `capRounded` to `true` if those need smoothing.

Other antialiasing techniques have different trade-offs; see [Antialiasing and Multisampling](https://luma.gl/docs/api-guide/gpu/gpu-antialiasing) in the luma.gl docs.

#### `_pathType` (object, optional) {#_pathtype}

* Default: `null`

> Note: This prop is experimental

One of `null`, `'loop'` or `'open'`.

If `'loop'` or `'open'`, will skip normalizing the coordinates returned by `getPath` and instead assume all paths are to be loops or open paths. Disabling normalization improves performance during data update, but makes the layer prone to error in case the data is malformed. It is only recommended when you use this layer with preprocessed static data or validation on the backend.

When normalization is disabled, paths must be specified in the format of flat array. Open paths must contain at least 2 vertices and closed paths must contain at least 3 vertices. See `getPath` below for details.

### Data Accessors

#### `getPath` ([Accessor&lt;PathGeometry&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getpath}

* Default: `object => object.path`

Called on each object in the `data` stream to retrieve its corresponding path.

A path can be one of the following formats:

* An array of points (`[x, y, z]`). Compatible with the GeoJSON [LineString](https://tools.ietf.org/html/rfc7946#section-3.1.4) specification.
* A flat array or [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) of numbers, in the shape of `[x0, y0, z0, x1, y1, z1, ...]`. By default, each coordinate is assumed to contain 3 consecutive numbers. If each coordinate contains only two numbers (x, y), set the `positionFormat` prop of the layer to `XY`:

```ts
new PathLayer<{vertices: Float32Array}>({
  getPath: d => d.vertices, // [x0, y0, x1, y1, x2, y2, ...]
  positionFormat: 'XY'
})
```

#### `getColor` ([Accessor&lt;Color&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getcolor}

* Default `[0, 0, 0, 255]`

The rgba color of each object, in `r, g, b, [a]`. Each component is in the 0-255 range.

* If an array is provided, it is used as the color for all objects.
* If a function is provided, it is called on each object to retrieve its color.

#### `getWidth` ([Accessor&lt;number&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getwidth}

* Default: `1`

The width of each path, in units specified by `widthUnits` (default meters).

* If a number is provided, it is used as the width for all paths.
* If a function is provided, it is called on each path to retrieve its width.


## Use binary attributes

This section is about the special requirements when [supplying attributes directly](../../developer-guide/performance.md#supply-attributes-directly) to a `PathLayer`.

Because each path has a different number of vertices, when `data.attributes.getPath` is supplied, the layer also requires an array `data.startIndices` that describes the vertex index at the start of each path. For example, if there are 3 paths of 2, 3, and 4 vertices each, `startIndices` should be `[0, 2, 5, 9]`.

Additionally, all other attributes (`getColor`, `getWidth`, etc.), if supplied, must contain the same layout (number of vertices) as the `getPath` buffer.

To truly realize the performance gain from using binary data, the app likely wants to skip all data processing in this layer. Specify the `_pathType` prop to skip normalization.

Example use case:

```ts title="Use plain JSON array"
const PATH_DATA = [
  {
    path: [[-122.4, 37.7], [-122.5, 37.8], [-122.6, 37.85]],
    name: 'Richmond - Millbrae',
    color: [255, 0, 0]
  },
  // ...
];

new PathLayer({
  data: PATH_DATA,
  getPath: d => d.path,
  getColor: d => d.color
})
```

The equivalent binary attributes would be:

```ts title="Use binary attributes"
// Flatten PATH_DATA into several binary buffers. This is typically done on the server or in a worker
// [-122.4, 37.7, -122.5, 37.8, -122.6, 37.85, ...]
const positions = new Float64Array(PATH_DATA.map(d => d.path).flat(2));
// The color attribute must supply one color for each vertex
// [255, 0, 0, 255, 0, 0, 255, 0, 0, ...]
const colors = new Uint8Array(PATH_DATA.map(d => d.path.map(_ => d.color)).flat(2));
// The "layout" that tells PathLayer where each path starts
const startIndices = new Uint16Array(PATH_DATA.reduce((acc, d) => {
  const lastIndex = acc[acc.length - 1];
  acc.push(lastIndex + d.path.length);
  return acc;
}, [0]));

new PathLayer({
  data: {
    length: PATH_DATA.length,
    startIndices: startIndices, // this is required to render the paths correctly!
    attributes: {
      getPath: {value: positions, size: 2},
      getColor: {value: colors, size: 3}
    }
  },
  _pathType: 'open' // this instructs the layer to skip normalization and use the binary as-is
})
```

## Remarks

### Using with GlobeView

When using this layer with [GlobeView](../core/globe-view.md) or MapLibre's globe projection, paths may be invisible when viewed from certain angles because `GlobeView` enables back-face culling by default. To ensure paths are visible from both sides, set:

```js
new PathLayer({
  // ...other props
  parameters: {cullMode: 'none'}
});
```

## Source

[modules/layers/src/path-layer](https://github.com/visgl/deck.gl/tree/9.4-release/modules/layers/src/path-layer)



---

Source: https://github.com/visgl/deck.gl/blob/v9.4.0/docs/api-reference/layers/column-layer.md

# ColumnLayer
![webgpu](https://img.shields.io/badge/webgpu-supported-blue.svg?style=flat-square)

import {ColumnLayerDemo} from '@site/src/doc-demos/layers';

<ColumnLayerDemo />


The `ColumnLayer` renders extruded cylinders (tessellated regular polygons) at given coordinates. It is the primitive layer rendered by [HexagonLayer](../aggregation-layers/hexagon-layer.md) after aggregation. Unlike the `HexagonLayer`, it renders one column for each data object.

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="language">
  <TabItem value="js" label="JavaScript">

```js
import {Deck} from '@deck.gl/core';
import {ColumnLayer} from '@deck.gl/layers';

const layer = new ColumnLayer({
  id: 'ColumnLayer',
  data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/hexagons.json',
  diskResolution: 12,
  extruded: true,
  radius: 250,
  elevationScale: 5000,
  getElevation: d => d.value,
  getFillColor: d => [48, 128, d.value * 255, 255],
  getPosition: d => d.centroid,
  pickable: true
});

new Deck({
  initialViewState: {
    longitude: -122.4,
    latitude: 37.74,
    zoom: 11
  },
  controller: true,
  getTooltip: ({object}) => object && `height: ${object.value * 5000}m`,
  layers: [layer]
});
```

  </TabItem>
  <TabItem value="ts" label="TypeScript">

```ts
import {Deck, PickingInfo} from '@deck.gl/core';
import {ColumnLayer} from '@deck.gl/layers';

type DataType = {
  value: number;
  centroid: [longitude: number, latitude: number];
};

const layer = new ColumnLayer<DataType>({
  id: 'ColumnLayer',
  data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/hexagons.json',
  diskResolution: 12,
  extruded: true,
  radius: 250,
  elevationScale: 5000,
  getElevation: (d: DataType) => d.value,
  getFillColor: (d: DataType) => [48, 128, d.value * 255, 255],
  getPosition: (d: DataType) => d.centroid,
  pickable: true
});

new Deck({
  initialViewState: {
    longitude: -122.4,
    latitude: 37.74,
    zoom: 11
  },
  controller: true,
  getTooltip: ({object}: PickingInfo<DataType>) => object && `height: ${object.value * 5000}m`,
  layers: [layer]
});
```

  </TabItem>
  <TabItem value="react" label="React">

```tsx
import React from 'react';
import {DeckGL} from '@deck.gl/react';
import {ColumnLayer} from '@deck.gl/layers';
import type {PickingInfo} from '@deck.gl/core';

type DataType = {
  value: number;
  centroid: [longitude: number, latitude: number];
};

function App() {
  const layer = new ColumnLayer<DataType>({
    id: 'ColumnLayer',
    data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/hexagons.json',
    diskResolution: 12,
    extruded: true,
    radius: 250,
    elevationScale: 5000,
    getElevation: (d: DataType) => d.value,
    getFillColor: (d: DataType) => [48, 128, d.value * 255, 255],
    getPosition: (d: DataType) => d.centroid,
    pickable: true
  });

  return <DeckGL
    initialViewState={{
      longitude: -122.4,
      latitude: 37.74,
      zoom: 11
    }}
    controller
    getTooltip={({object}: PickingInfo<DataType>) => object && `height: ${object.value * 5000}m`}
    layers={[layer]}
  />;
}
```

  </TabItem>
</Tabs>


## Installation

To install the dependencies from NPM:

```bash
npm install deck.gl
# or
npm install @deck.gl/core @deck.gl/layers
```

```ts
import {ColumnLayer} from '@deck.gl/layers';
import type {ColumnLayerProps} from '@deck.gl/layers';

new ColumnLayer<DataT>(...props: ColumnLayerProps<DataT>[]);
```

To use pre-bundled scripts:

```html
<script src="https://unpkg.com/deck.gl@^9.0.0/dist.min.js"></script>
<!-- or -->
<script src="https://unpkg.com/@deck.gl/core@^9.0.0/dist.min.js"></script>
<script src="https://unpkg.com/@deck.gl/layers@^9.0.0/dist.min.js"></script>
```

```js
new deck.ColumnLayer({});
```


## Properties

Inherits from all [Base Layer](../core/layer.md) properties.

### Render Options

#### `diskResolution` (number, optional) {#diskresolution}

* Default: `20`

The number of sides to render the disk as. The disk is a regular polygon that fits inside the given radius. A higher resolution will yield a smoother look close-up, but also need more resources to render.

#### `radius` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#radius}

* Default: `1000`

Disk size in units specified by `radiusUnits` (default meters).

#### `angle` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#angle}

* Default: `0`

Disk rotation, counter-clockwise in degrees.

#### `vertices` (Position[], optional) {#vertices}

Replace the default geometry (regular polygon that fits inside the unit circle) with a custom one. The length of the array must be at least `diskResolution`. Each vertex is a point `[x, y]` that is the offset from the instance position, relative to the radius.

#### `offset` (number[2], optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#offset}

* Default: `[0, 0]`

Disk offset from the position, relative to the radius. By default, the disk is centered at each position.

#### `coverage` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#coverage}

* Default: `1`

Radius multiplier, between 0 - 1. The radius of the disk is calculated by
`coverage * radius`

#### `elevationScale` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#elevationscale}

* Default: `1`

Column elevation multiplier. The elevation of column is calculated by
`elevationScale * getElevation(d)`. `elevationScale` is a handy property
to scale all column elevations without updating the data.

#### `filled` (boolean, optional) {#filled}

* Default: `true`

Whether to draw a filled column (solid fill).

#### `stroked` (boolean, optional) {#stroked}

* Default: `false`

Whether to draw an outline around the disks. Only applies if `extruded: false`.

#### `extruded` (boolean, optional) {#extruded}

* Default: `true`

Whether to extrude the columns. If set to `false`, all columns will be rendered as flat polygons.

#### `wireframe` (boolean, optional) {#wireframe}

* Default: `false`

Whether to generate a line wireframe of the column. The outline will have
"horizontal" lines closing the top and bottom polygons and a vertical line
(a "strut") for each vertex around the disk. Only applies if `extruded: true`.

#### `flatShading` (boolean, optional) {#flatshading}

* Default: `false`

If `true`, the vertical surfaces of the columns use [flat shading](https://en.wikipedia.org/wiki/Shading#Flat_vs._smooth_shading).
If `false`, use smooth shading. Only effective if `extruded` is `true`.

#### `radiusUnits` (string, optional) {#radiusunits}

* Default: `'meters'`

The units of the radius, one of `'meters'`, `'common'`, and `'pixels'`. See [unit system](../../developer-guide/coordinate-systems.md#supported-units).

#### `lineWidthUnits` (string, optional) {#linewidthunits}

* Default: `'meters'`

The units of the line width, one of `'meters'`, `'common'`, and `'pixels'`. See [unit system](../../developer-guide/coordinate-systems.md#supported-units).

#### `lineWidthScale` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#linewidthscale}

* Default: `1`

The line width multiplier that multiplied to all outlines if the `stroked` attribute is `true`.

#### `lineWidthMinPixels` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#linewidthminpixels}

* Default: `0`

The minimum outline width in pixels.

#### `lineWidthMaxPixels` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#linewidthmaxpixels}

* Default: Number.MAX_SAFE_INTEGER

The maximum outline width in pixels.


#### `material` (Material, optional) {#material}

* Default: `true`

This is an object that contains material props for [lighting effect](../core/lighting-effect.md) applied on extruded polygons. Check [the lighting guide](../../developer-guide/using-effects.md#material-settings) for configurable settings.


### Data Accessors

#### `getPosition` ([Accessor&lt;Position&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getposition}

* Default: `object => object.position`

Method called to retrieve the position of each column, in `[x, y]`. An optional third component can be used to set the elevation of the bottom.

#### `getFillColor` ([Accessor&lt;Color&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getfillcolor}

* Default: `[0, 0, 0, 255]`

The rgba color is in the format of `[r, g, b, [a]]`. Each channel is a number between 0-255 and `a` is 255 if not supplied.

* If an array is provided, it is used as the color for all objects.
* If a function is provided, it is called on each object to retrieve its color.
* If not provided, it falls back to `getColor`.

#### `getLineColor` ([Accessor&lt;Color&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getlinecolor}

* Default: `[0, 0, 0, 255]`

The rgba color is in the format of `[r, g, b, [a]]`. Each channel is a number between 0-255 and `a` is 255 if not supplied.

* If an array is provided, it is used as the outline color for all columns.
* If a function is provided, it is called on each object to retrieve its outline color.
* If not provided, it falls back to `getColor`.

#### `getElevation` ([Accessor&lt;number&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getelevation}

* Default: `1000`

The elevation of each cell in meters.

* If a number is provided, it is used as the elevation for all objects.
* If a function is provided, it is called on each object to retrieve its elevation.


#### `getLineWidth` ([Accessor&lt;number&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getlinewidth}

* Default: `1`

The width of the outline of the column, in units specified by `lineWidthUnits` (default meters). Only applies if `extruded: false` and `stroked: true`.

* If a number is provided, it is used as the outline width for all columns.
* If a function is provided, it is called on each object to retrieve its outline width.

## Source

[modules/layers/src/column-layer](https://github.com/visgl/deck.gl/tree/9.4-release/modules/layers/src/column-layer)



---

Source: https://github.com/visgl/deck.gl/blob/v9.4.0/docs/api-reference/layers/arc-layer.md

# ArcLayer
![webgpu](https://img.shields.io/badge/webgpu-supported-blue.svg?style=flat-square)

import {ArcLayerDemo} from '@site/src/doc-demos/layers';

<ArcLayerDemo />

The `ArcLayer` renders raised arcs joining pairs of source and target coordinates.


import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="language">
  <TabItem value="js" label="JavaScript">

```js
import {Deck} from '@deck.gl/core';
import {ArcLayer} from '@deck.gl/layers';

const layer = new ArcLayer({
  id: 'ArcLayer',
  data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/bart-segments.json',
  getSourcePosition: d => d.from.coordinates,
  getTargetPosition: d => d.to.coordinates,
  getSourceColor: d => [Math.sqrt(d.inbound), 140, 0],
  getTargetColor: d => [Math.sqrt(d.outbound), 140, 0],
  getWidth: 12,
  pickable: true
});

new Deck({
  initialViewState: {
    longitude: -122.4,
    latitude: 37.74,
    zoom: 11
  },
  controller: true,
  getTooltip: ({object}) => object && `${object.from.name} to ${object.to.name}`,
  layers: [layer]
});
```

  </TabItem>
  <TabItem value="ts" label="TypeScript">

```ts
import {Deck, PickingInfo} from '@deck.gl/core';
import {ArcLayer} from '@deck.gl/layers';

type BartSegment = {
  inbound: number;
  outbound: number;
  from: {
    name: string;
    coordinate: [longitude: number, latitude: number];
  };
  to: {
    name: string;
    coordinate: [longitude: number, latitude: number];
  };
};

const layer = new ArcLayer<BartSegment>({
  id: 'ArcLayer',
  data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/bart-segments.json',
  getSourcePosition: (d: BartSegment) => d.from.coordinates,
  getTargetPosition: (d: BartSegment) => d.to.coordinates,
  getSourceColor: (d: BartSegment) => [Math.sqrt(d.inbound), 140, 0],
  getTargetColor: (d: BartSegment) => [Math.sqrt(d.outbound), 140, 0],
  getWidth: 12,
  pickable: true
});

new Deck({
  initialViewState: {
    longitude: -122.4,
    latitude: 37.74,
    zoom: 11
  },
  controller: true,
  getTooltip: ({object}: PickingInfo<BartSegment>) => object && `${object.from.name} to ${object.to.name}`,
  layers: [layer]
});
```

  </TabItem>
  <TabItem value="react" label="React">

```tsx
import React from 'react';
import {DeckGL} from '@deck.gl/react';
import {ArcLayer} from '@deck.gl/layers';
import type {PickingInfo} from '@deck.gl/core';

type BartSegment = {
  inbound: number;
  outbound: number;
  from: {
    name: string;
    coordinate: [longitude: number, latitude: number];
  };
  to: {
    name: string;
    coordinate: [longitude: number, latitude: number];
  };
};

function App() {
  const layer = new ArcLayer<BartSegment>({
    id: 'ArcLayer',
    data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/bart-segments.json',
    getSourcePosition: (d: BartSegment) => d.from.coordinates,
    getTargetPosition: (d: BartSegment) => d.to.coordinates,
    getSourceColor: (d: BartSegment) => [Math.sqrt(d.inbound), 140, 0],
    getTargetColor: (d: BartSegment) => [Math.sqrt(d.outbound), 140, 0],
    getWidth: 12,
    pickable: true
  });

  return <DeckGL
    initialViewState={{
      longitude: -122.4,
      latitude: 37.74,
      zoom: 11
    }}
    controller
    getTooltip={({object}: PickingInfo<BartSegment>) => object && `${object.from.name} to ${object.to.name}`}
    layers={[layer]}
  />;
}
```

  </TabItem>
</Tabs>


## Installation

To install the dependencies from NPM:

```bash
npm install deck.gl
# or
npm install @deck.gl/core @deck.gl/layers
```

```ts
import {ArcLayer} from '@deck.gl/layers';
import type {ArcLayerProps} from '@deck.gl/layers';

new ArcLayer<DataT>(...props: ArcLayerProps<DataT>[]);
```

To use pre-bundled scripts:

```html
<script src="https://unpkg.com/deck.gl@^9.0.0/dist.min.js"></script>
<!-- or -->
<script src="https://unpkg.com/@deck.gl/core@^9.0.0/dist.min.js"></script>
<script src="https://unpkg.com/@deck.gl/layers@^9.0.0/dist.min.js"></script>
```

```js
new deck.ArcLayer({});
```

## Properties

Inherits from all [Base Layer](../core/layer.md) properties.

### Render Options

#### `greatCircle` (boolean, optional) {#greatcircle}

* Default: `false`

If `true`, create the arc along the shortest path on the earth surface. This option is only effective with data in the `LNGLAT` coordinate system.

#### `numSegments` (number, optional) {#numsegments}

* Default: `50`

The number of segments used to draw each arc. This prop can be used to make arcs smooth when using `greatCircle` with long paths.

#### `widthUnits` (string, optional) {#widthunits}

* Default: `'pixels'`

The units of the line width, one of `'meters'`, `'common'`, and `'pixels'`. See [unit system](../../developer-guide/coordinate-systems.md#supported-units).

#### `widthScale` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#widthscale}

* Default: `1`

The scaling multiplier for the width of each line. This prop is a very efficient way to change the width of all objects, comparing to recalculating the width for each object with `getWidth`.

#### `widthMinPixels` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#widthminpixels}

* Default: `0`

The minimum line width in pixels. This prop can be used to prevent the line from getting too thin when zoomed out.

#### `widthMaxPixels` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#widthmaxpixels}

* Default: `Number.MAX_SAFE_INTEGER`

The maximum line width in pixels. This prop can be used to prevent the line from getting too thick when zoomed in.

#### `antialiasing` (boolean, optional) {#antialiasing}

* Default: `false`

When enabled, this prop computes edge coverage in the shader. When disabled, the layer relies on render-target multisampling. Shader-computed coverage can cause artifacts where arcs overlap. Only the edges along the width of the arc are smoothed — the two ends are not.

Other antialiasing techniques have different trade-offs; see [Antialiasing and Multisampling](https://luma.gl/docs/api-guide/gpu/gpu-antialiasing) in the luma.gl docs.


### Data Accessors

#### `getSourcePosition` ([Accessor&lt;Position&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getsourceposition}

* Default: `object => object.sourcePosition`

Method called to retrieve the source position of each object.

#### `getTargetPosition` ([Accessor&lt;Position&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#gettargetposition}

* Default: `object => object.targetPosition`

Method called to retrieve the target position of each object.

#### `getSourceColor` ([Accessor&lt;Color&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getsourcecolor}

* Default: `[0, 0, 0, 255]`

The rgba color is in the format of `[r, g, b, [a]]`. Each channel is a number between 0-255 and `a` is 255 if not supplied.

* If an array is provided, it is used as the source color for all objects.
* If a function is provided, it is called on each object to retrieve its source color.

#### `getTargetColor` ([Accessor&lt;Color&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#gettargetcolor}

* Default `[0, 0, 0, 255]`

The rgba color at the target, in `r, g, b, [a]`. Each component is in the 0-255 range.

* If an array is provided, it is used as the target color for all objects.
* If a function is provided, it is called on each object to retrieve its target color.

#### `getWidth` ([Accessor&lt;number&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getwidth}

* Default: `1`

The line width of each object, in units specified by `widthUnits` (default pixels).

* If a number is provided, it is used as the line width for all objects.
* If a function is provided, it is called on each object to retrieve its line width.

#### `getHeight` ([Accessor&lt;number&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getheight}

* Default: `1`

Multiplier of layer height. `0` will make the layer flat.

#### `getTilt` ([Accessor&lt;number&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#gettilt}

* Default: `0`

Use to tilt the arc to the side if you have multiple arcs with the same source and target positions.
In degrees, can be positive or negative (`-90 to +90`).

## Remarks

### Using with GlobeView

When using this layer with [GlobeView](../core/globe-view.md) or MapLibre's globe projection, arcs may be invisible when viewed from certain angles because `GlobeView` enables back-face culling by default. To ensure arcs are visible from both sides, set:

```js
new ArcLayer({
  // ...other props
  parameters: {cullMode: 'none'}
});
```

## Source

[modules/layers/src/arc-layer](https://github.com/visgl/deck.gl/tree/9.4-release/modules/layers/src/arc-layer)



---

Source: https://github.com/visgl/deck.gl/blob/v9.4.0/docs/api-reference/layers/scatterplot-layer.md

# ScatterplotLayer
![webgpu](https://img.shields.io/badge/webgpu-supported-blue.svg?style=flat-square)

import {ScatterplotLayerDemo} from '@site/src/doc-demos/layers';

<ScatterplotLayerDemo />

The `ScatterplotLayer` renders circles at given coordinates.

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="language">
  <TabItem value="js" label="JavaScript">

```js
import {Deck} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';

const layer = new ScatterplotLayer({
  id: 'ScatterplotLayer',
  data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/bart-stations.json',
  
  stroked: true,
  getPosition: d => d.coordinates,
  getRadius: d => Math.sqrt(d.exits),
  getFillColor: [255, 140, 0],
  getLineColor: [0, 0, 0],
  getLineWidth: 10,
  radiusScale: 6,
  pickable: true
});

new Deck({
  initialViewState: {
    longitude: -122.4,
    latitude: 37.74,
    zoom: 11
  },
  controller: true,
  getTooltip: ({object}) => object && object.name,
  layers: [layer]
});
```

  </TabItem>
  <TabItem value="ts" label="TypeScript">

```ts
import {Deck, PickingInfo} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';

type BartStation = {
  name: string;
  entries: number;
  exits: number;
  coordinates: [longitude: number, latitude: number];
};

const layer = new ScatterplotLayer<BartStation>({
  id: 'ScatterplotLayer',
  data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/bart-stations.json',
  
  stroked: true,
  getPosition: (d: BartStation) => d.coordinates,
  getRadius: (d: BartStation) => Math.sqrt(d.exits),
  getFillColor: [255, 140, 0],
  getLineColor: [0, 0, 0],
  getLineWidth: 10,
  radiusScale: 6,
  pickable: true
});

new Deck({
  initialViewState: {
    longitude: -122.4,
    latitude: 37.74,
    zoom: 11
  },
  controller: true,
  getTooltip: ({object}: PickingInfo<BartStation>) => object && object.name,
  layers: [layer]
});
```

  </TabItem>
  <TabItem value="react" label="React">

```tsx
import React from 'react';
import {DeckGL} from '@deck.gl/react';
import {ScatterplotLayer} from '@deck.gl/layers';
import type {PickingInfo} from '@deck.gl/core';

type BartStation = {
  name: string;
  entries: number;
  exits: number;
  coordinates: [longitude: number, latitude: number];
};

function App() {
  const layer = new ScatterplotLayer<BartStation>({
    id: 'ScatterplotLayer',
    data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/bart-stations.json',
    
    stroked: true,
    getPosition: (d: BartStation) => d.coordinates,
    getRadius: (d: BartStation) => Math.sqrt(d.exits),
    getFillColor: [255, 140, 0],
    getLineColor: [0, 0, 0],
    getLineWidth: 10,
    radiusScale: 6,
    pickable: true
  });

  return <DeckGL
    initialViewState={{
      longitude: -122.4,
      latitude: 37.74,
      zoom: 11
    }}
    controller
    getTooltip={({object}: PickingInfo<BartStation>) => object && object.name}
    layers={[layer]}
  />;
}
```

  </TabItem>
</Tabs>


## Installation

To install the dependencies from NPM:

```bash
npm install deck.gl
# or
npm install @deck.gl/core @deck.gl/layers
```

```ts
import {ScatterplotLayer} from '@deck.gl/layers';
import type {ScatterplotLayerProps} from '@deck.gl/layers';

new ScatterplotLayer<DataT>(...props: ScatterplotLayerProps<DataT>[]);
```

To use pre-bundled scripts:

```html
<script src="https://unpkg.com/deck.gl@^9.0.0/dist.min.js"></script>
<!-- or -->
<script src="https://unpkg.com/@deck.gl/core@^9.0.0/dist.min.js"></script>
<script src="https://unpkg.com/@deck.gl/layers@^9.0.0/dist.min.js"></script>
```

```js
new deck.ScatterplotLayer({});
```

## Properties

Inherits from all [Base Layer](../core/layer.md) properties.

### Render Options

#### `radiusUnits` (string, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#radiusunits}

* Default: `'meters'`

The units of the radius, one of `'meters'`, `'common'`, and `'pixels'`. See [unit system](../../developer-guide/coordinate-systems.md#supported-units).

#### `radiusScale` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#radiusscale}

* Default: `1`

A global radius multiplier for all points.

#### `lineWidthUnits` (string, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#linewidthunits}

* Default: `'meters'`

The units of the line width, one of `'meters'`, `'common'`, and `'pixels'`. See [unit system](../../developer-guide/coordinate-systems.md#supported-units).

#### `lineWidthScale` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#linewidthscale}

* Default: `1`

A global line width multiplier for all points.

#### `stroked` (boolean, optional) {#stroked}

* Default: `false`

Draw the outline of points.

#### `filled` (boolean, optional) {#filled}

* Default: `true`

Draw the filled area of points.

#### `radiusMinPixels` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#radiusminpixels}

* Default: `0`

The minimum radius in pixels. This prop can be used to prevent the circle from getting too small when zoomed out.

#### `radiusMaxPixels` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#radiusmaxpixels}

* Default: `Number.MAX_SAFE_INTEGER`

The maximum radius in pixels. This prop can be used to prevent the circle from getting too big when zoomed in.

#### `lineWidthMinPixels` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#linewidthminpixels}

* Default: `0`

The minimum line width in pixels. This prop can be used to prevent the stroke from getting too thin when zoomed out.

#### `lineWidthMaxPixels` (number, optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#linewidthmaxpixels}

* Default: `Number.MAX_SAFE_INTEGER`

The maximum line width in pixels. This prop can be used to prevent the path from getting too thick when zoomed in.

#### `billboard` (boolean, optional) {#billboard}

- Default: `false`

If `true`, rendered circles always face the camera. If `false` circles face up (i.e. are parallel with the ground plane).

#### `antialiasing` (boolean, optional) {#antialiasing}

- Default: `true`

If `true`, circles are rendered with smoothed edges. If `false`, circles are rendered with rough edges. Antialiasing can cause artifacts on edges of overlapping circles. Also, antialiasing isn't supported in FirstPersonView. 

### Data Accessors

#### `getPosition` ([Accessor&lt;Position&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getposition}

* Default: `object => object.position`

Method called to retrieve the position of each object.

#### `getRadius` ([Accessor&lt;number&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getradius}

* Default: `1`

The radius of each object, in units specified by `radiusUnits` (default meters).

* If a number is provided, it is used as the radius for all objects.
* If a function is provided, it is called on each object to retrieve its radius.

#### `getColor` ([Accessor&lt;Color&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getcolor}

* Default: `[0, 0, 0, 255]`

The rgba color is in the format of `[r, g, b, [a]]`. Each channel is a number between 0-255 and `a` is 255 if not supplied.

* If an array is provided, it is used as the color for all objects.
* If a function is provided, it is called on each object to retrieve its color.

It will be overridden by `getLineColor` and `getFillColor` if these new accessors are specified.

#### `getFillColor` ([Accessor&lt;Color&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getfillcolor}

* Default: `[0, 0, 0, 255]`

The rgba color is in the format of `[r, g, b, [a]]`. Each channel is a number between 0-255 and `a` is 255 if not supplied.

* If an array is provided, it is used as the filled color for all objects.
* If a function is provided, it is called on each object to retrieve its color.
* If not provided, it falls back to `getColor`.

#### `getLineColor` ([Accessor&lt;Color&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getlinecolor}

* Default: `[0, 0, 0, 255]`

The rgba color is in the format of `[r, g, b, [a]]`. Each channel is a number between 0-255 and `a` is 255 if not supplied.

* If an array is provided, it is used as the outline color for all objects.
* If a function is provided, it is called on each object to retrieve its color.
* If not provided, it falls back to `getColor`.

#### `getLineWidth` ([Accessor&lt;number&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getlinewidth}

* Default: `1`

The width of the outline of each object, in units specified by `lineWidthUnits` (default meters).

* If a number is provided, it is used as the outline width for all objects.
* If a function is provided, it is called on each object to retrieve its outline width.
* If not provided, it falls back to `strokeWidth`.

#### `getPixelOffset` ([Accessor&lt;number[2]&gt;](../../developer-guide/using-layers.md#accessors), optional) ![transition-enabled](https://img.shields.io/badge/transition-enabled-green.svg?style=flat-square") {#getpixeloffset}

* Default: `[0, 0]`

Screen space offset relative to the `coordinates` in pixel unit.

* If an array is provided, it is used as the offset for all objects.
* If a function is provided, it is called on each object to retrieve its offset.

## Source

[modules/layers/src/scatterplot-layer](https://github.com/visgl/deck.gl/tree/9.4-release/modules/layers/src/scatterplot-layer)



---

Source: https://github.com/visgl/deck.gl/blob/v9.4.0/docs/api-reference/core/layer.md

# Layer Class

The `Layer` class is the base class of all deck.gl layers, and it provides a number of **base properties** available in all layers.


## Static Members

#### `layerName` (string, required) {#layername}

This static property should contain the name of the layer, typically the name of layer's class (it cannot reliably be autodeduced in minified code). It is used as the default Layer id as well as for debugging and profiling.


#### `defaultProps` (object, optional) {#defaultprops}

All deck.gl layers define a `defaultProps` static member listing their props and default values. Using `defaultProps` improves both the code readability and performance during layer instance construction. See [prop types](../../developer-guide/custom-layers/prop-types.md).


## Constructor

```ts
new Layer(...props);
```

Parameters:

* `props` (object) - `Layer` properties.

Notes:

* More than one property object can be supplied.
* Property objects will be merged with the same semantics as [Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign), i.e. props in later objects will overwrite props earlier object.
* Every layer specifies default values for all its props, and these values will be used internally if that prop is not specified by the application in the Layer constructor.


## Properties

### Basic Properties

#### `id` (string, optional) {#id}

* Default: the layer class's name.

The `id` must be unique among all your layers at a given time. It is highly recommended to set `id` explicitly. If more than one instance of a specific type of layer exist at the same time, they will require different ids for deck.gl to properly distinguish them.

Remarks:

* `id` is used to match layers between rendering calls. deck.gl requires each layer to have a unique `id`. A default `id` is assigned based on layer type, which means if you are using more than one layer of the same type (e.g. two `ScatterplotLayer`s) you need to provide a custom `id` for at least one of them.
* A layer class' name is defined by the `Layer.layerName` static member, or inferred from the constructor name (which is not robust in minified code).
* For sublayers (automatically generated by composite layers), a unique "composite layer id" is automatically generated by appending the sub layer's id to the parent layer's `id`, so there is no risk of `id` collisions for sublayers, as long as the application's layer names are unique.


#### `data` (Iterable | string | Promise | AsyncIterable | object, optional) {#data}

* Default: `[]`

deck.gl layers typically expect `data` to be one of the following types:

- A JavaScript array of data objects.
- An object that implements the [iterable protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols), for example `Map` and `Set`. Represents a collection of data objects.
- Any non-iterable object that contains a `length` field. deck.gl will not attempt to interpret its format, but simply call each accessor `length` times. (See remark below)
- `String`: an URL pointing to the data source. deck.gl will attempt to fetch the remote content and parse it as JSON. The resulting object is then used as the value of the `data` prop.
- `Promise`: the resolved value will be used as the value of the `data` prop.
- `AsyncIterable`: an [async iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator) object that yields data in batches. The default implementation expects each batch to be an array of data objects; one may change this behavior by supplying a custom `dataTransform` callback.

##### data.attributes

When using a non-iterable `data` object, the object may optionally contain a field `attributes`, if the application wishes to supply binary buffers directly to the layer. This use case is discussed in detail in the [performance developer guide](../../developer-guide/performance.md#supply-attributes-directly).

The keys in `data.attributes` correspond to the [accessor](../../developer-guide/using-layers.md#accessors) name that the binary should replace, for example `getPosition`, `getColor`. See each layer's documentation for available accessor props.

Each value in `data.attributes` may be one of the following formats:

- luma.gl [Buffer](https://luma.gl/docs/api-reference/core/resources/buffer) instance
- A typed array, which will be used to create a `Buffer`
- An object containing the following optional fields. For more information, see [WebGL vertex attribute API](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer).
  + `buffer` ([Buffer](https://luma.gl/docs/api-reference/core/resources/buffer))
  + `value` (TypedArray)
  + `type` ("uint8" | "sint8" | "unorm8" | "snorm8" | "uint16" | "sint16" | "unorm16" | "snorm16" | "uint32" | "sint32" | "float32") - A WebGPU-style data type, see [VertexFormat](https://luma.gl/docs/api-guide/gpu/gpu-attributes#vertexformat).
  + `size` (number) - the number of elements per vertex attribute.
  + `offset` (number) - offset of the first vertex attribute into the buffer, in bytes
  + `stride` (number) - the offset between the beginning of consecutive vertex attributes, in bytes
  + `normalized` (boolean) - whether data values should be normalized. Note that all color attributes in deck.gl layers are normalized by default.

**Remarks**

* Some layers may accept alternative data formats. For example, the [GeoJsonLayer](../layers/geojson-layer.md) supports any valid GeoJSON object as `data`. These exceptions, if any, are documented in each layer's documentation.
* When an iterable value is passed to `data`, every accessor function receives the current element as the first argument. When a non-iterable value (any object with a `length` field) is passed to `data`, the accessor functions are responsible of interpreting the data format. The latter is often used with binary inputs. Read about this in [accessors](../../developer-guide/using-layers.md#accessors).
* The automatic URL loading support is intended as a convenience for simple use cases. There are many limitations, including control over request parameters and headers, ability to parse non-JSON data, control of post-processing, CORS support etc. In such cases, it is always possible to load data using traditional JavaScript techniques and rerender the layer with the resulting data array.
* For `Layer` writers: Even though applications can pass in url string as `data` props, deck.gl makes sure that the layers never see `data` props containing `String` values. Layers will only see the default empty array value for the `data` prop until the data is loaded, at which point it will be updated with the loaded array.


#### `visible` (boolean, optional) {#visible}

* Default: `true`

Whether the layer is visible. Under most circumstances, using `visible` prop to control the visibility of layers are recommended over doing conditional rendering. Compare:

```ts
const layers = [
  new MyLayer({data: ..., visible: showMyLayer})
];
```

with

```ts
const layers = [];
if (showMyLayer) {
  layers.push(new MyLayer({data: ...}));
}
```

In the second example (conditional rendering) the layer state will be destroyed and regenerated every time the `showMyLayer` flag changes.

#### `opacity` (number, optional) {#opacity}

* Default: `1`

The opacity of the layer.

Remarks:

* deck.gl automatically applies gamma to the opacity in an attempt to make opacity changes appear linear (i.e. the perceived opacity is visually proportional to the value of the prop).
* While it is a recommended convention that all deck.gl layers should support the `opacity` prop, it is up to each layer's fragment shader to properly implement support for opacity.


#### `extensions` (LayerExtension[], optional) {#extensions}

Add additional functionalities to this layer. See the [list of available extensions](../extensions/overview.md).


#### `onError` (Function, optional) {#onerror}

Called when this layer encounters an error, with the following arguments:

- `error` - a JavaScript `Error` object.

If this callback is supplied and returns `true`, the error is marked as handled and will not bubble up to the [`onError`](./deck.md#onerror) callback of the `Deck` instance.


### Interaction Properties

Layers can be interacted with using these properties.

#### `pickable` (boolean | '3d', optional) {#pickable}

* Default: `false`

Whether the layer responds to mouse pointer picking events.

When set to `true`, the layer can be picked and the picking info will contain 2D coordinates (assuming z=0).

When set to `'3d'`, the layer can be picked with depth picking enabled. The `coordinate` field in the [picking info object](../../developer-guide/interactivity.md#the-pickinginfo-object) will be a 3D point, unprojected onto the actual picked geometry. This is useful for getting accurate 3D coordinates in layers with elevation or 3D models, but comes with a performance overhead.

#### `onHover` (Function, optional) {#onhover}

This callback will be called when the mouse enters/leaves an object of this deck.gl layer with the following parameters:

* [`info`](../../developer-guide/interactivity.md#the-pickinginfo-object)
* `event` - the source event

If this callback returns a truthy value, the `hover` event is marked as handled and will not bubble up to the [`onHover`](./deck.md#onhover) callback of the `DeckGL` canvas.

Requires `pickable` to be true.

#### `onClick` (Function, optional) {#onclick}

This callback will be called when the mouse clicks over an object of this deck.gl layer with the following parameters:

* [`info`](../../developer-guide/interactivity.md#the-pickinginfo-object)
* `event` - the source event

If this callback returns a truthy value, the `click` event is marked as handled and will not bubble up to the [`onClick`](./deck.md#onclick) callback of the `DeckGL` canvas.

Requires `pickable` to be true.

#### `onDragStart` (Function, optional) {#ondragstart}

This callback will be called when the mouse starts dragging an object of this deck.gl layer with the following parameters:

* [`info`](../../developer-guide/interactivity.md#the-pickinginfo-object)
* `event` - the source event

If this callback returns a truthy value, the `dragstart` event is marked as handled and will not bubble up to the [`onDragStart`](./deck.md#ondragstart) callback of the `DeckGL` canvas.

Requires `pickable` to be true.

#### `onDrag` (Function, optional) {#ondrag}

This callback will be called when the mouse drags an object of this deck.gl layer with the following parameters:

* [`info`](../../developer-guide/interactivity.md#the-pickinginfo-object)
* `event` - the source event

If this callback returns a truthy value, the `drag` event is marked as handled and will not bubble up to the [`onDrag`](./deck.md#ondrag) callback of the `DeckGL` canvas.

Requires `pickable` to be true.

#### `onDragEnd` (Function, optional) {#ondragend}

This callback will be called when the mouse releases an object of this deck.gl layer with the following parameters:

* [`info`](../../developer-guide/interactivity.md#the-pickinginfo-object)
* `event` - the source event

If this callback returns a truthy value, the `dragend` event is marked as handled and will not bubble up to the [`onDragEnd`](./deck.md#ondragend) callback of the `DeckGL` canvas.

Requires `pickable` to be true.

#### `highlightColor` (Color | Function, optional) {#highlightcolor}

* Default: `[0, 0, 128, 128]`

RGBA color to blend with the highlighted object (either the hovered over object if `autoHighlight: true`, or the object at the index specified by `highlightedObjectIndex`). When the value is a 3 component (RGB) array, a default alpha of 255 is applied.

- If an array is supplied, it is used for the object that is currently highlighted.
- If a function is supplied, it is called with a [pickingInfo](../../developer-guide/interactivity.md#the-pickinginfo-object) object when the hovered object changes. The return value is used as the highlight color for the picked object. Only works with `autoHighlight: true`.

#### `highlightedObjectIndex` (number | null, optional) {#highlightedobjectindex}

* Default: `null`

The index of the object in `data` to highlight. If specified, overrides the effect of `autoHighlight`.

When set to an integer that corresponds to an object, the object will be highlighted with `highlightColor`. When set to an integer that does not correspond to an object (e.g. `-1`), nothing is highlighted.

#### `autoHighlight` (boolean, optional) {#autohighlight}

* Default: `false`

When true, current object pointed by mouse pointer (when hovered over) is highlighted with `highlightColor`.

Requires `pickable` to be true.


### Coordinate System Properties

Normally only used when the application wants to work with coordinates that are not Web Mercator projected longitudes/latitudes.

#### `coordinateSystem` (string, optional) {#coordinatesystem}

* Default: `'default'`

Specifies how layer positions and offsets should be geographically interpreted. One of:

- `'default'`
- `'cartesian'`
- `'lnglat'`
- `'meter-offsets'`
- `'lnglat-offsets'`

The default is to interpret positions as latitude and longitude, however it is also possible to interpret positions as meter offsets added to projection center specified by the `coordinateOrigin` prop.

See the article on [Coordinate Systems](../../developer-guide/coordinate-systems.md) for details.

#### `coordinateOrigin` (number[3], optional) {#coordinateorigin}

* Default: `[0, 0, 0]`

Specifies a reference point for coordinates that are expressed as offsets. Used when the `coordinateSystem` is set to one of the following modes:

- `'cartesian'` (optional)
- `'meter-offsets'` (required)
- `'lnglat-offsets'` (required)

See the article on [Coordinate Systems](../../developer-guide/coordinate-systems.md) for details.

#### `wrapLongitude` (boolean, optional) {#wraplongitude}

- Default: `false`

Normalizes geometry longitudes. Only works with the `LNGLAT` coordinate system.

When enabled on `PathLayer`, `PolygonLayer` and `GeoJsonLayer`, the paths/polygons are interpretted such that the connection between any two neighboring vertices is drawn on the shorter side of the world, and split into two if it crosses the 180th meridian. Note that this introduces CPU overhead at runtime. When working with static data, it is recommend that you preprocess the features offline instead of using this option.

When enabled on layers with position pairs, such as `LineLayer` and `ArcLayer`, they will draw the shortest path between source and target positions. If the shortest path crosses the 180th meridian, it is split into two segments.

When enabled on other layers, the effect is applied by moving the anchor point into the `[-180, 180]` range.


#### `modelMatrix` (number[16], optional) {#modelmatrix}

An optional 4x4 matrix that is multiplied into the affine projection matrices used by shader `project` GLSL function and the Viewport's `project` and `unproject` JavaScript function.

Allows local coordinate system transformations to be applied to a layer, which is useful when composing data from multiple sources that use different coordinate systems.

Note that the matrix projection is applied after the non-linear mercator projection calculations are resolved, so be careful when using model matrices with longitude/latitude encoded coordinates. They normally work best with non-mercator viewports or meter offset based mercator layers.


### Data Properties

There are a number of additional properties that provide extra control over data iteration, comparison and update.

#### `dataComparator` (Function, optional) {#datacomparator}

This prop causes the `data` prop to be compared using a custom comparison function. The comparison function is called with the old data and the new data objects, and is expected to return true if they compare equally.

Used to override the default shallow comparison of the `data` object.

As an illustration, the app could set this to e.g. 'lodash.isequal', enabling deep comparison of the data structure. This particular examples would obviously have considerable performance impact and should only be used as a temporary solution for small data sets until the application can be refactored to avoid the need.

The function receives two arguments:

- `newData` - the new data prop
- `oldData` - the data prop before the update

And should return `true` if the two values are considered equal (no update needed), or `false` if the data has changed.


#### `dataTransform` (Function, optional) {#datatransform}

Executed to manipulate remote data when it's fetched. This callback applies when `data` is assigned a value that is either string (URL), Promise or an async iterable.

The function receives two arguments:

- `data` - the newly fetched data
- `previousData` - (only available when `data` is an async iterable) the previously loaded data. If `dataTransform` is not supplied, the new data chunk is appended to the previous data array.

And must return a valid `data` object: an array, an iterable or a non-iterable object that contains a `length` field. See documentation of the `data` prop for details.


#### `_dataDiff` (Function, optional) **Experimental** {#_datadiff}

This function is called when the data changes, either shallowly when `dataComparator` is not supplied or because `dataComparator` returns `false`, to retrieve the indices of the changed objects. By default, when data changes, the attributes of all objects are recalculated. If this prop is supplied, only the attributes of the specified objects will be updated. This can lead to significant performance improvement if a few rows in a large data table need to change frequently:


```ts
let data: DataType[] = [...];

function updateData(index: number, item: DataType) {
  // make a shallow copy
  data = data.slice();
  data[index] = item;
  const layers = [
    new ScatterplotLayer<DataType>({
      data,
      // Only update the attributes at `index``
      _dataDiff: (newData: DataType[], oldData: DataType[]) => [{startRow: index, endRow: index + 1}],
      // ...
    })
  ];
  deckInstance.setProps({layers});
}
```


The function receives two arguments:

- `newData` - the new data prop
- `oldData` - the data prop before the update

And is expected to return an array of "ranges", in the form of `{startRow, endRow}`:
- `startRow` (number) - the beginning index of a changed chunk in the new data.
- `endRow` (number) - the end index of a changed chunk in the new data (excluded).

**This feature is experimental and intended for advanced use cases.** Note that it only rewrites part of a buffer, not remove or insert, therefore the user of this prop is responsible of making sure that all the unchanged objects remain at the same indices between `oldData` and `newData`. This becomes trickier when dealing with data of dynamic lengths, for example `PathLayer`, `PolygonLayer` and `GeoJsonLayer`. Generally speaking, it is not recommended to use this feature when the count of vertices in the paths/polygons may change.

#### `positionFormat` ("XYZ"|"XY", optional) {#positionformat}

The format of positions. This prop is currently only effective in `PathLayer`, `SolidPolygonLayer` and `PolygonLayer`.

Default `'XYZ'`.

#### `colorFormat` ("RGBA"|"RGB", optional) {#colorformat}

The format of colors. Setting it to `'RGB'` will make the layer ignore the alpha channel of the colors returned by accessors, and instead assume all objects to be opaque.
The layer's overall transparency controlled by `opacity` is still applied.

Default `'RGBA'`.

#### `numInstances` (number, optional) {#numinstances}

deck.gl automatically derives the number of drawing instances from the `data` prop by counting the number of objects in `data`. However, the developer might want to manually override it using this prop.

#### `updateTriggers` (object, optional) {#updatetriggers}

Accessors such as `getColor` and `getPosition` are called to retrieve colors and positions when a layer is first added. From then on, to maximize performance, deck.gl does not recalculate colors or positions unless the `data` prop changes by shallow comparison.

Sometimes `data` remains the same, but the outcome of an accessor has changed. In the following example, this is caused by changes in the external values `maleColor` and `femaleColor`:

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="language">
  <TabItem value="ts" label="TypeScript">

```ts
import {Deck, Color} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';

type DataType = {
  position: [x: number, y: number];
  gender: 'M'|'F';
};
const data: DataType[] = [...];
const deckInstance = new Deck({...});

function render({maleColor, femaleColor}: {
  maleColor: Color;
  femaleColor: Color;
}) {
  const layers = [
    new ScatterplotLayer<DataType>({
      getPosition: (d: DataType) => d.position;
      getFillColor: (d: DataType) => d.gender === 'M' ? maleColor : femaleColor
    })
  ];

  deckInstance.setProps({layers});
}
```

In this case, you need to explicitly inform deck.gl to re-evaluate `getFillColor` for all data items. You do so by defining `updateTriggers`:

```ts
function render({maleColor, femaleColor}: {
  maleColor: Color;
  femaleColor: Color;
}) {
  const layers = [
    new ScatterplotLayer<DataType>({
      getPosition: (d: DataType) => d.position;
      getFillColor: (d: DataType) => d.gender === 'M' ? maleColor : femaleColor,
      // getFillColor should be re-evaluated when something in [maleColor, femaleColor] changes
      updateTriggers: {
        getFillColor: [maleColor, femaleColor]
      }
    })
  ];

  deckInstance.setProps({layers});
}
```

</TabItem>
  <TabItem value="react" label="React">

```tsx
import React from 'react';
import {DeckGL} from '@deck.gl/react';
import {Color} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';

type DataType = {
  position: [x: number, y: number];
  gender: 'M'|'F';
};
const data: DataType[] = [...];
const deckInstance = new Deck({...});

function App({maleColor, femaleColor}: {
  maleColor: Color;
  femaleColor: Color;
}) {
  const layers = [
    new ScatterplotLayer<DataType>({
      getPosition: (d: DataType) => d.position;
      getFillColor: (d: DataType) => d.gender === 'M' ? maleColor : femaleColor
    })
  ];

  return <DeckGL
    // ...
    layers={layers}
  />;
}
```

In this case, you need to explicitly inform deck.gl to re-evaluate `getFillColor` for all data items. You do so by defining `updateTriggers`:

```tsx
function App({maleColor, femaleColor}: {
  maleColor: Color;
  femaleColor: Color;
}) {
  const layers = [
    new ScatterplotLayer<DataType>({
      getPosition: (d: DataType) => d.position;
      getFillColor: (d: DataType) => d.gender === 'M' ? maleColor : femaleColor,
      // getFillColor should be re-evaluated when something in [maleColor, femaleColor] changes
      updateTriggers: {
        getFillColor: [maleColor, femaleColor]
      }
    })
  ];

  return <DeckGL
    // ...
    layers={layers}
  />;
}
```

  </TabItem>
</Tabs>


`updateTriggers` expect an object whose keys are names of accessor props of this layer, and values are one or more variables that affect the output of the accessors.

For example, `updateTriggers.getFillColor` is a list of variables that affect the output of
 `getFillColor`. If either value in the array changes, all attributes that depend on
 `getFillColor` will be updated.
The variables may be numbers, strings, objects or functions. During each rendering cycle, deck.gl shallow-compares them with the previous values.


Note:

* change of the `data` prop has higher priority than the `updateTriggers`. If the app supplies a new `data` object, then all attributes will be automatically updated, even if the updateTriggers have not changed. To block excessive attribute updates, set the [`dataComparator`](./layer.md#datacomparator) prop.


#### `loaders` (Loader[], optional) {#loaders}

- Default: `[]`

An array of [loaders.gl loaders](https://loaders.gl/docs/developer-guide/using-loaders).

Out of the box, deck.gl supports loading JSON and image files (with [ImageLoader](https://loaders.gl/modules/images/docs/api-reference/image-loader)), and specific layer implementation such as `MVTLayer`, `TerrainLayer` and `ScenegraphLayer` also include loaders for their targeted formats.

Support for addtional formats can be added by adding loaders to the `loaders` prop. For example, to load data from CSV files:

```js
import {CSVLoader} from '@loaders.gl/csv';

const layer = new HexagonLayer({
  data: './data.csv',
  loaders: [CSVLoader]
  ...
});
```

#### `loadOptions` (object, optional) {#loadoptions}

- Default: `null`

Layers use [loaders.gl](https://loaders.gl) to load data and other resources. `loadOptions` is an object to customize the behavior of any loader used during fetching and parsing. The object may contain any of the [top-level options](https://loaders.gl/modules/core/docs/api-reference/parse#options), as well as loader-specific options targeting a particular format.

Layers may also include specialized loaders for their own use case, such as images, 3d-tiles, etc. See the documentation of each layer for additional load options that are available.

Find usage examples in the [data loading guide](../../developer-guide/loading-data.md).


#### `fetch` (Function, optional) {#fetch}

Called to fetch and parse content from URLs.

The function receives the following arguments:

- `url` (string) - the URL to fetch
- `context` (object)
  + `layer` (Layer) - the current layer
  + `propName` (string) - the name of the prop that is making the request
  + `loaders` (Loader[]) - an array of [loaders.gl loaders](https://loaders.gl/docs/developer-guide/using-loaders) to parse this request with, default to `props.loaders`.
  + `loadOptions` (object) - loader options for this request, default to `props.loadOptions`.
  + `signal` ([AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)?) - the signal to abort the request

The function is expected to return a Promise that resolves to loaded data.

* Default: `load(url, loaders, loadOptions)`


#### `onDataLoad` (Function, optional) {#ondataload}

Called when remote data is fully loaded. This callback applies when `data` is assigned a value that is either string (URL), Promise or an async iterable.

The function receives two arguments:

- `value` - the loaded data
- `context` (object)
  + `layer` - the current layer


### Render Properties

#### `parameters` (object, optional) {#parameters}

The `parameters` allows applications to specify values for GPU parameters such as blending mode, depth testing etc. Any `parameters` will be applied temporarily while rendering this layer only.

Please refer to the luma.gl [GPU Parameters](https://luma.gl/docs/api-reference/core/parameters) documentation on supported parameters and values.


#### `getPolygonOffset` (Function, optional) {#getpolygonoffset}

* Default: `({layerIndex}) => [0, -layerIndex * 100]`

When multiple layers are rendered on the same plane, [z-fighting](https://en.wikipedia.org/wiki/Z-fighting) may create undesirable artifacts. To improve the visual quality of composition, deck.gl allows layers to use `gl.polygonOffset` to apply an offset to its depth. By default, each layer is offset a small amount by its index so that layers are cleanly stacked from bottom to top.

This accessor takes a single parameter `uniform` - an object that contains the current render uniforms, and returns an array of two numbers `factor` and `units`. Negative values pull layer towards the camera, and positive values push layer away from the camera. For more information, refer to the [documentation](https://www.khronos.org/registry/OpenGL-Refpages/es2.0/xhtml/glPolygonOffset.xml) and [FAQ](https://www.opengl.org/archives/resources/faq/technical/polygonoffset.htm).

If the accessor is assigned a falsy value, polygon offset will be set to `[0, 0]`.

Remarks:

* While this feature helps mitigate z-fighting, at close up zoom levels the issue might return because of the precision error of 32-bit projection matrices. Try set the `fp64` prop to `true` in this case.

#### `transitions` (object, optional) {#transitions}

* Default: `{}`

When a layer prop updates, if the `transitions` prop is configured, the prop value may animate smoothly from the old value to the new value. Animation parameters are defined per prop by using the prop names as keys:

```ts
new ScatterplotLayer({
  // ...
  transitions: {
    getPosition: 600,
    getFillColor: {
      duration: 300,
      easing: d3.easeCubicInOut,
      enter: ([r, g, b]) => [r, g, b, 0] // fade in
    },
    radiusScale: {
      type: 'spring',
      stiffness: 0.01,
      damping: 0.15
    }
  }
});
```

Each prop name is mapped to a number or an object that is the transition setting. As a shorthand, if a prop name maps to a number, then the number is assigned to the `duration` parameter with an `interpolation` type transition. If an object is supplied, it may contain the following fields:

| Key           | Type       | Default     | Description |
| ------------- | --------   | ----------- | ----------- |
| `type`        | string   | `'interpolation'` | Type of the transition, currently supports `'interpolation'` and `'spring'` |
| `enter`       | Function | `value => value` | Callback to get the value that the entering vertices are transitioning from. See [attribute backfilling](../../developer-guide/animations-and-transitions.md#attribute-backfilling) |
| `onStart`     | Function | `null`      | Callback when the transition is started |
| `onEnd`       | Function | `null`      | Callback when the transition is done |
| `onInterrupt` | Function | `null`      | Callback when the transition is interrupted |

- Additional fields for `type: 'interpolation'`:

    | Key           | Type       | Default     | Description |
    | ------------- | --------   | ----------- | ----------- |
    | `duration`    | `Number`   | `0`         | Duration of the transition animation, in milliseconds |
    | `easing`      | `(t: number) => number` | `t => t` | Easing function that maps a value from [0, 1] to [0, 1], see [http://easings.net/](http://easings.net/) |

- Additional fields for `type: 'spring'`:

    | Key           | Type       | Default     | Description |
    | ------------- | --------   | ----------- | ----------- |
    | `stiffness`   | `Number`   | `0.05`      | "Tension" factor for the spring |
    | `damping`     | `Number`   | `0.5`       | "Friction" factor that counteracts the spring's acceleration |

The [Animations and Transitions](../../developer-guide/animations-and-transitions.md#layer-prop-transitions) developer guide provides a deeper dive into the behavior and performance considerations of this feature.

## Members

> Layer members are designed to support the creation of new layers or layer sub-classing and are NOT intended to be used by applications.


#### `context` (object) {#context}

The context object stores information that are shared by all layers.

* `gl` ([WebGL2RenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext)) - WebGL context of the current canvas.
* `viewport` ([Viewport](./viewport.md)) - The current viewport
* `deck` ([Deck](./deck.md)) - The current deck.gl instance

#### `state` (object) {#state}

The state object allows a layer to store persistent information cross rendering cycles.

* `attributeManager` ([AttributeManager](./attribute-manager.md)) - The attribute manager of this layer.

#### `props` (object) {#props}

[Properties](./layer.md#constructor) of this layer.


#### `isLoaded` (boolean) {#isloaded}

`true` if all asynchronous assets are loaded.

#### `parent` (Layer | null) {#parent}

A `Layer` instance if this layer is rendered by a [CompositeLayer](./composite-layer.md)


## Methods

> Layer methods are designed to support the creation of new layers or layer sub-classing and are NOT intended to be called by applications.

### General Methods

#### `clone` {#clone}

```js
const updatedLayer = layer.clone(overrideProps);
```

Create a copy of this layer, optionally change some prop values.

Arguments:
- `overrideProps` (object, optional) - layer props to update.

#### `setState` {#setstate}

Used to update the layers [`state`](./layer.md#state) object. Calling this method will also cause the layer to rerender.

#### `setModuleParameters` {#setmoduleparameters}

Used to update the settings of shader modules.

#### `raiseError` {#raiseerror}

Used to propagate errors thrown in layers to the deck.gl error handling system. This prevents rendering from being interrupted by exceptions in layers.

`raiseError(error, message)`

- `error` (Error) - a JavaScript Error object
- `message` (string, optional) - additional contextual description to amend the error message with

### Layer Lifecycle Methods

For more information about when these methods are called, see [layer lifecycle](../../developer-guide/custom-layers/layer-lifecycle.md).

#### `initializeState` {#initializestate}

This method is called only once for each layer to set up the initial state.

`initializeState(context)`

* `context` - The layer context is supplied as a parameter
  - `context.gl` (`WebGL2RenderingContext`) - gl context
  - ...

deck.gl will already have created the `state` object at this time, and added the `gl` context and the `attributeManager` state.

#### `shouldUpdateState` {#shouldupdatestate}

Called during each rendering cycle when layer [properties](./layer.md#constructor) or [context](./layer.md#context) has been updated and before layers are drawn.

`shouldUpdateState({props, oldProps, context, changeFlags})`

Parameters:

* `props` (object) - Layer properties from the current rendering cycle.
* `oldProps` (object) - Layer properties from the previous rendering cycle.
* `context` (object) - Layer context from the current rendering cycle.
* `changeFlags`:
  - an object that contains the following boolean flags:
  - `dataChanged`, `propsChanged`, `viewportChanged`, `somethingChanged`, `propsOrDataChanged`, `stateChanged`, `updateTriggersChanged`

Returns:

* `true` this layer needs to be updated.

Remarks:

* Prop change is determined by shallow comparison.
* Data change is determined by shallow comparison of `props.data` unless [`dataComparator`](./layer.md#datacomparator) is supplied.
* The default implementation returns `true` if any change has been detected in data or props, but **ignores viewport changes**.

#### `updateState` {#updatestate}

Called when a layer needs to be updated.

`updateState({props, oldProps, context, changeFlags})`

Parameters:

* `props` (object) - Layer properties from the current rendering cycle.
* `oldProps` (object) - Layer properties from the previous rendering cycle.
* `context` (object) - Layer context from the current rendering cycle.
* `changeFlags`:
  - an object that contains the following boolean flags:
  - `dataChanged`, `propsChanged`, `viewportChanged`, `somethingChanged`, `propsOrDataChanged`, `stateChanged`, `updateTriggersChanged`

The default implementation will invalidate all attributeManager attributes if the `data` prop has changed.

#### `draw` {#draw}

Called on a layer to render to the WebGL canvas.

`draw({moduleParameters, uniforms, ..., context})`

Parameters:

* `uniforms`:

* an object that contains all the [default unforms](../../developer-guide/custom-layers/writing-shaders.md#uniforms) to be passed to the shaders.
* `context` - The layer context is supplied as a parameter
  - `context.gl` (`WebGL2RenderingContext`) - gl context
  - ...

The default implementation looks for a variable `model` in the layer's state (which is expected to be an instance of the luma.gl `Model` class) and calls `draw` on that model with the parameters.

#### `getPickingInfo` {#getpickinginfo}

Called when a layer is being hovered or clicked, before any user callbacks are called. The layer can override or add additional fields to the `info` object that will be passed to the callbacks.

Parameters:

* `pickParams` (object)
  - `pickParams.info` (object) - The current `info` object. By default it contains the
  following fields:

    + `x` (number) - Mouse position x relative to the viewport.
    + `y` (number) - Mouse position y relative to the viewport.
    + `coordinate` (number[2]) - Mouse position in world coordinates. Only applies if [`coordinateSystem`](./layer.md#coordinatesystem) is `'lnglat'`.
    + `color` (number[4]) - The color of the pixel that is being picked. It represents a "picking color" that is encoded by [`layer.encodePickingColor()`](./layer.md#encodepickingcolor).
    + `index` (number) - The index of the object that is being picked. It is the returned value of [`layer.decodePickingColor()`](./layer.md#decodepickingcolor).
    + `picked` (boolean) - `true` if `index` is not `-1`.
  - `pickParams.mode` (string) - One of `hover` and `click`

Returns:

* An `info` object with optional fields about what was picked. This object will be passed to the layer's `onHover` or `onClick` callbacks.
* `null`, if the corresponding event should cancelled with no callback functions called.

The default implementation populates the `info.object` field with the `info.index` element from the layer's `data` prop.

#### `finalizeState` {#finalizestate}

This method is called before the layer is being removed. A layer should release all resources created during its life span.


### Layer Projection Methods

While most projection is handled "automatically" in the layers vertex shader, it is occasionally useful to be able to work in the projected coordinates in JavaScript while calculating uniforms etc.

#### `project` {#project}

Projects a map coordinate to screen coordinate, using the current viewport settings and the current coordinate system.

Parameters:

* `coordinates` (number[]) - `[x, y, z]` in this layer's coordinate system.

Returns:

* A screen coordinates array `[x, y]` or `[x, y, z]` if an altitude was given.

#### `unproject` {#unproject}

Unprojects a screen coordinate using the current viewport settings.

Parameters:

* `pixels` (number[]) - `[x, y, z]` Passing a `z` is optional.

Returns:

* A map coordinates array `[lng, lat]` or `[lng, lat, altitude]` if a `z` was given.

#### `projectPosition` {#projectposition}

Projects a map coordinate to world coordinate using the current viewport settings and the current coordinate system. Can be useful to calculate world space angle and distances.

Parameters:

* `coordinates` (number[]) - `[x, y, z]` in this layer's coordinate system.
* `params` (object, optional) - Projection parameters override. It accepts the following fields:
  - `viewport` (Viewport) - defaults to `this.context.viewport`.
  - `modelMatrix` (Matrix4) - defaults to `this.props.modelMatrix`.
  - `coordinateOrigin` (number[3]) - defaults to `this.props.coordinateOrigin`.
  - `coordinateSystem` (string) - defaults to `this.props.coordinateSystem`.
  - `fromCoordinateOrigin` (number[3]) - defaults to passed `coordinateOrigin`.
  - `fromCoordinateSystem` (string) - defaults to passed `coordinateSystem`.

Returns:

* World coordinates in `[x, y]`.

### Layer Picking Methods

For the usage of these methods, see [how picking works](../../developer-guide/custom-layers/picking.md).

#### `decodePickingColor` {#decodepickingcolor}

Converts a color to a "sub-feature index" number.
This color is encoded by the `layer.encodePickingColor()` method.

Parameters:

* `color` (Uint8Array) - The color to be decoded in `[r, g, b]`.

Returns:

* A number representing the index of the feature. The null picking color (See `Layer.nullPickingColor`) will be decoded as -1.

Note:

* The null picking color is returned when a pixel is picked that is not covered by the layer, or when the layer has selected to render a pixel using the null picking color to make it unpickable.

#### `encodePickingColor` {#encodepickingcolor}

Converts a "sub-feature index" number to a color. This color can later be decoded by the `layer.decodePickingColor()` method.

Parameters:

* `index` (Integer) - The index to be encoded.

Returns:

* An array of `[r, g, b]`.

To get a color that does not correspond to any sub-feature, use `layer.nullPickingColor()`.

Notes:

* indices to be encoded must be integers larger than or equal to 0.
* Picking colors are 24 bit values and can thus encode up to 16 million indices.

#### `nullPickingColor` {#nullpickingcolor}

Returns:

* a "null" picking color which is equal the color of pixels not covered by the layer. This color is guaranteed not to match any index value greater than or equal to zero.

## Source

[modules/core/src/lib/layer.ts](https://github.com/visgl/deck.gl/tree/9.4-release/modules/core/src/lib/layer.ts)



---

Source: https://github.com/visgl/deck.gl/blob/v9.4.0/docs/developer-guide/animations-and-transitions.md

# Animations and Transitions

deck.gl provides several built-in animation/transition features.

* **[Camera Transitions](#camera-transitions)** - the camera can move smoothly from the current view state to the new view state.
* **[Layer Prop Transitions](#layer-prop-transitions)** - when a layer prop is updated, it may animate from the old value to the new value.

Advanced motion effects can also be implemented using deck.gl in conjunction with other animation libraries, see the [custom animations](#custom-animations) section.

## Camera Transitions

Camera transitions provide smooth and visually appealing transitions when `viewState` change from one state to the other.

Transitions are performed when setting `Deck`'s `viewState` or `initialViewState` prop to a new value with the following additional fields:

* `transitionInterpolator` (object, optional, default: `LinearInterpolator`) - An interpolator object that defines the transition behavior between two view states. The choices are:

  - [LinearInterpolator](../api-reference/core/linear-interpolator.md) - a generic interpolator that works with all view types. This is the default.
  - [FlyToInterpolator](../api-reference/core/fly-to-interpolator.md) - a "fly to" style camera transition for geospatial views. This is pretty useful when the camera center changes by long distance.
  - Implement a custom interpolator. See [TransitionInterpolator](../api-reference/core/transition-interpolator.md).

* `transitionDuration` (number | string, optional, default: 0) - Transition duration in milliseconds, default value 0, implies no transition.
When using `FlyToInterpolator`, it can also be set to `'auto'` where actual duration is calculated based on the distance between the start and end states, and the `speed` option.
* `transitionEasing` (Function, optional, default: `t => t`) - Easing function that can be used to achieve effects like "Ease-In-Cubic", "Ease-Out-Cubic", etc. Default value performs Linear easing. ([list of sample easing functions](http://easings.net))   
* `transitionInterruption` (number, optional, default: `TRANSITION_EVENTS.BREAK`) - This field controls how to process a new view state change that occurs while performing an existing transition. This field has no impact once transition is complete. Here is the list of all possible values with resulting behavior.

    | `TRANSITION_EVENTS` | Result |
    | ---------------   | ------ |
    | `BREAK`             | Current transition will stop at the current state and next view state update is processed. |
    | `SNAP_TO_END`       | Current transition will skip remaining transition steps and view state is updated to final value, transition is stopped and next view state update is processed. |
    | `IGNORE`            | Any view state update is ignored until current transition is complete, this also includes view state changes due to user interaction. |

* `onTransitionStart` (Functional, optional) - Callback fires when requested transition starts.
* `onTransitionInterrupt` (Functional, optional) - Callback fires when transition is interrupted.
* `onTransitionEnd` (Functional, optional) - Callback fires when transition ends.


### Camera Transition Examples

This example provides `flyTo` style transition to move camera from current location to the requested city.

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="language">
  <TabItem value="js" label="JavaScript">

```js
import {Deck, FlyToInterpolator} from '@deck.gl/core';

const CITIES = {
  SF: {
    longitude: -122.4,
    latitude: 37.8,
    zoom: 10
  },
  NYC: {
    longitude: -74.0,
    latitude: 40.7,
    zoom: 10
  }
}

const deckInstance = new Deck({
  initialViewState: CITIES.SF,
  controller: true
});

for (const button of document.querySelectorAll('button')) {
  button.onclick = () => flyToCity(button.id);
}

function flyToCity(name) {
  deckInstance.setProps({
    initialViewState: {
      ...CITIES[name],
      transitionInterpolator: new FlyToInterpolator({speed: 2}),
      transitionDuration: 'auto'
    }
  })
}
```

  </TabItem>
  <TabItem value="ts" label="TypeScript">

```ts
import {Deck, MapViewState, FlyToInterpolator} from '@deck.gl/core';

const CITIES: {[name: string]: MapViewState} = {
  SF: {
    longitude: -122.4,
    latitude: 37.8,
    zoom: 10
  },
  NYC: {
    longitude: -74.0,
    latitude: 40.7,
    zoom: 10
  }
}

const deckInstance = new Deck({
  initialViewState: CITIES.SF,
  controller: true
});

for (const button of document.querySelectorAll('button')) {
  (button as HTMLButtonElement).onclick = () => flyToCity(button.id);
}

function flyToCity(name: string) {
  deckInstance.setProps({
    initialViewState: {
      ...CITIES[name],
      transitionInterpolator: new FlyToInterpolator({speed: 2}),
      transitionDuration: 'auto'
    }
  })
}
```

  </TabItem>
  <TabItem value="react" label="React">

```tsx
import React, {useState, useCallback} from 'react';
import {DeckGL} from '@deck.gl/react';
import {MapViewState, FlyToInterpolator} from '@deck.gl/core';

const CITIES: {[name: string]: MapViewState} = {
  SF: {
    longitude: -122.4,
    latitude: 37.8,
    zoom: 10
  },
  NYC: {
    longitude: -74.0,
    latitude: 40.7,
    zoom: 10
  }
}

function App() {
  const [initialViewState, setInitialViewState] = useState<MapViewState>(CITIES.SF);

  const flyToCity = useCallback(evt => {
    setInitialViewState({
      ...CITIES[evt.target.id],
      transitionInterpolator: new FlyToInterpolator({speed: 2}),
      transitionDuration: 'auto'
    });
  }, [])

  return <>
    <DeckGL
      initialViewState={initialViewState}
      controller
    />;
    {Object.keys(CITIES).map(name => <button id={name} onClick={flyToCity}>{name}</button>)}
  </>;
}
```

  </TabItem>
</Tabs>

This example continuously rotates the camera along the Z (vertical) axis until user interrupts the rotation by dragging. It uses `LinearInterpolator` and restricts transitions to `bearing`. Continuous transitions are achieved by triggering new transitions upon the `onTransitionEnd` callback.

<Tabs groupId="language">
  <TabItem value="js" label="JavaScript">

```js
import {Deck, LinearInterpolator} from '@deck.gl/core';

let initialViewState = {
  longitude: -122.4,
  latitude: 37.8,
  zoom: 12
};

const deckInstance = new Deck({
  initialViewState,
  controller: true,
  onLoad: rotateCamera
});

function rotateCamera() {
  initialViewState = {
    ...initialViewState,
    bearing: initialViewState.bearing + 120,
    transitionDuration: 1000,
    transitionInterpolator: new LinearInterpolator(['bearing']),
    onTransitionEnd: rotateCamera
  };
  deckInstance.setProps({initialViewState});
}
```

  </TabItem>
  <TabItem value="ts" label="TypeScript">

```ts
import {Deck, LinearInterpolator, MapViewState} from '@deck.gl/core';

let initialViewState: MapViewState = {
  longitude: -122.4,
  latitude: 37.8,
  zoom: 12
};

const deckInstance = new Deck({
  initialViewState,
  controller: true,
  onLoad: rotateCamera
});

function rotateCamera(): void {
  initialViewState = {
    ...initialViewState,
    bearing: initialViewState.bearing + 120,
    transitionDuration: 1000,
    transitionInterpolator: new LinearInterpolator(['bearing']),
    onTransitionEnd: rotateCamera
  };
  deckInstance.setProps({initialViewState});
}
```

  </TabItem>
  <TabItem value="react" label="React">

```tsx
import React, {useState, useCallback} from 'react';
import {DeckGL} from '@deck.gl/react';
import {LinearInterpolator, MapViewState} from '@deck.gl/core';

function App() {
  const [initialViewState, setInitialViewState] = useState<MapViewState>({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 12
  });

  const rotateCamera = useCallback(() => {
    setInitialViewState(viewState => ({
      ...viewState,
      bearing: viewState.bearing + 120,
      transitionDuration: 1000,
      transitionInterpolator: new LinearInterpolator(['bearing']),
      onTransitionEnd: rotateCamera
    }));
  }, []);

  return <DeckGL
    initialViewState={initialViewState}
    controller
    onLoad={rotateCamera}
  />;
}
```

  </TabItem>
</Tabs>


### Remarks

Deck's view state transition model is "set and forget": the values of the following props at the start of a transition carry through the entire duration of the transition:

+ `transitionDuration`
+ `transitionInterpolator`
+ `transitionEasing`
+ `transitionInterruption`

The default transition behavior can always be intercepted and overwritten in the handler for `onViewStateChange`. However, if a transition is in progress, the properties that are being transitioned (e.g. longitude and latitude) should not be manipulated, otherwise the change will be interpreted as an interruption of the transition.


## Layer Prop Transitions

Layer properties may smoothly transition from one value to the next if a [transitions](../api-reference/core/layer.md#transitions) prop is configured. There are two categories of transition-enabled props, for each enabling transition has different implications regarding performance and complexity.

- Uniform prop (usually of type `number` or `number[]`) transition is performed on the CPU. It only recomputes one single numeric value per update, and imposes virtually no cost on top of redrawing on each animation frame.
- Attribute prop (usually named `get*`) transition is performed on the GPU. Since it recomputes values for `attribute_size * data_length` numbers, the ammount of data being updated per frame can be quite large for a big dataset. For example, animating the position of 1M point cloud involves 3M float64 or 6M float32 numbers. Performing the computation on the GPU means that they can be updated efficiently in parallel and without leaving the GPU memory. However, when such a transition is first triggered, some of the preparation is done on the CPU (specifically the `enter` callback), and it could potentially be expensive. See more discussions below.

To enable layer prop transitions, set the layer's `transitions` prop to an object that defines animation parameters by using the prop names as keys. The following example has the columns "grow" from the ground when data is loaded:


<Tabs groupId="language">
  <TabItem value="js" label="JavaScript">

```js
import {Deck} from '@deck.gl/core';
import {HexagonLayer} from '@deck.gl/aggregation-layers';

const deckInstance = new Deck({
  // ...
  layer: getLayers(null)
});

const resp = await fetch('/path/to/data.json');
const data = await resp.json();
deckInstance.setProps({
  layer: getLayers(data)
});

function getLayers(data) {
  return [
    new HexagonLayer({
      id: '3d-heatmap',
      data,
      getPosition: d => [d.longitude, d.latitude],
      getElevationWeight: d => d.count,
      extruded: true,
      elevationScale: data && data.length ? 50 : 0,
      transitions: {
        elevationScale: 3000
      }
    })
  ];
}
```

  </TabItem>
  <TabItem value="ts" label="TypeScript">

```ts
import {Deck} from '@deck.gl/core';
import {HexagonLayer} from '@deck.gl/aggregation-layers';

type DataType = {
  longitude: number;
  latitude: number;
  count: number;
};

const deckInstance = new Deck({
  // ...
  layer: getLayers(null)
});

const resp = await fetch('/path/to/data.json');
const data = await resp.json() as DataType[];
deckInstance.setProps({
  layer: getLayers(data)
});

function getLayers(data: DataType[] | null) {
  return [
    new HexagonLayer<DataType>({
      id: '3d-heatmap',
      data,
      getPosition: (d: DataType) => [d.longitude, d.latitude],
      getElevationWeight: (d: DataType) => d.count,
      extruded: true,
      elevationScale: data && data.length ? 50 : 0,
      transitions: {
        elevationScale: 3000
      }
    })
  ];
}
```

  </TabItem>
  <TabItem value="react" label="React">

```tsx
import React, {useEffect, useState} from 'react';
import {DeckGL} from '@deck.gl/react';
import {HexagonLayer} from '@deck.gl/aggregation-layers';

type DataType = {
  longitude: number;
  latitude: number;
  count: number;
};

function App() {
  const [data, setData] = useState<DataType[] | null>(null);

  useEffect(() => {
    (async () => {
      const resp = await fetch('/path/to/data.json');
      const data = await resp.json() as DataType[];
      setData(data);
    })();
  }, []);

  const layers = [
    new HexagonLayer<DataType>({
      id: '3d-heatmap',
      data,
      getPosition: (d: DataType) => [d.longitude, d.latitude],
      getElevationWeight: (d: DataType) => d.count,
      extruded: true,
      elevationScale: data && data.length ? 50 : 0,
      transitions: {
        elevationScale: 3000
      }
    })
  ];

  return <DeckGL
    // ...
    layers={layers}
  />;
}
```

  </TabItem>
</Tabs>


In the `transitions` object, each prop name is mapped to a number or an object that is the transition setting. As a shorthand, if a prop name maps to a number, then the number is assigned to the `duration` parameter with an `interpolation` type transition. If an object is supplied, it may contain the following fields:

| Key           | Type       | Default     | Description |
| ------------- | --------   | ----------- | ----------- |
| `type`        | string   | `'interpolation'` | Type of the transition, currently supports `'interpolation'` and `'spring'` |
| `enter`       | Function | `value => value` | Callback to get the value that the entering vertices are transitioning from. See "attribute backfilling" below |
| `onStart`     | Function | `null`      | Callback when the transition is started |
| `onEnd`       | Function | `null`      | Callback when the transition is done |
| `onInterrupt` | Function | `null`      | Callback when the transition is interrupted |

- Additional fields for `type: 'interpolation'`:

    | Key           | Type       | Default     | Description |
    | ------------- | --------   | ----------- | ----------- |
    | `duration`    | `Number`   | `0`         | Duration of the transition animation, in milliseconds |
    | `easing`      | `(t: number) => number` | `t => t` | Easing function that maps a value from [0, 1] to [0, 1], see [http://easings.net/](http://easings.net/) |

- Additional fields for `type: 'spring'`:

    | Key           | Type       | Default     | Description |
    | ------------- | --------   | ----------- | ----------- |
    | `stiffness`   | `Number`   | `0.05`      | "Tension" factor for the spring |
    | `damping`     | `Number`   | `0.5`       | "Friction" factor that counteracts the spring's acceleration |


### Attribute Backfilling 

Consider the following setup, a `ScatterplotLayer` with `transitions` enabled for positions and fill colors:

```ts
import {ScatterplotLayer} from '@deck.gl/layers';
import type {Color} from '@deck.gl/core';

new ScatterplotLayer({
  // ...
  transitions: {
    getPosition: {
      type: 'spring',
      damping: 0.2
    },
    getFillColor: {
      duration: 600,
      easing: (x: number) => -(Math.cos(Math.PI * x) - 1) / 2, // ease-in-out-sine
      entry: ([r, g, b]: Color) => [r, g, b, 0]
    }
  }
});
```

When the layer's data updates from 3 elements to 4 elements, positions and colors also changed:

| Object index | Old `getPosition` result | New `getPosition` result | Old `getFillColor` result | New `getFillColor` result |
|--|----|----|----|----|
| 0 | [0, 0, 0] | [0, 3, 0] | [255, 0, 0, 255] | [255, 255, 0, 255] |
| 1 | [1, 0, 0] | [0, 0, 0] | [0, 255, 0, 255] | [255, 0, 0, 255] |
| 2 | [2, 0, 0] | [1, 0, 0] | [0, 0, 255, 255] | [0, 255, 0, 255] |
| 3 | - | [2, 0, 0] | - | [0, 0, 255, 255] |

* For index 0-2, transitions are performed from the old values to the new values at the same index. 
* Because the new data is larger, `enter` callback is called at index 3 to backfill the position and color to transition from. The first argument is the "to" value. For position, the default `enter` returns `[2, 0, 0]` (same value), which will look like the new circle just appeared in place. For color, the user-supplied `enter` returns `[0, 0, 255, 0]` (same RGB and alpha=0), which will look like the new circle faded in.

When working with variable-length geometries, such as `PathLayer` and `PolygonLayer`, transitions are handled per geometry (path or polygon). For each geometry, transitions are performed between the old and new values at the same vertex index. If the new path/polygon has more vertices, `enter` is called to backfill the "from" value. In this case, `enter` also receives a second argument `fromChunk` representing the "from" value of the entire geometry.

The process of attribute backfilling may be expensive performance-wise because it calls `enter` for each index on the CPU, then upload the new data to the GPU. It only happens when data size/vertex count is growing.

### Limitations

Between updates, objects are identified by their index in the `data` array. This means that if objects are inserted or removed, the transition will not look as expected. There is [an open feature request](https://github.com/visgl/deck.gl/issues/2570) for supporting custom object id.


## Custom Animations

The most powerful way to create animations with deck.gl is to manage data and settings externally, and update the layers' props on every frame.

The following example shows the [TripsLayer](../api-reference/geo-layers/trips-layer.md)'s `currentTime` prop animated by the [popmotion](https://popmotion.io/) library:

<Tabs groupId="language">
  <TabItem value="js" label="JavaScript">

```js
import {Deck} from '@deck.gl/core';
import {TripsLayer} from '@deck.gl/geo-layers';
import {animate} from "popmotion";

const currentTimeAnimation = animate({
  from: 0, // currentTime min value
  to: 1800, // currentTime max value
  duration: 5000, // over the course of 5 seconds
  repeat: Infinity,
  onUpdate: updateLayers
});

const deckInstance = new Deck({
  initialViewState: {
    longitude: -122.4,
    latitude: 37.8,
    zoom: 12
  },
  controller: true
});

function updateLayers(currentTime) {
  const layers = [
    new TripsLayer({
      id: 'TripsLayer',
      data: '/path/to/data.json',
      getPath: d => d.waypoints.map(p => p.coordinates),
      getTimestamps: d => d.waypoints.map(p => p.timestamp),
      getColor: [253, 128, 93],
      getWidth: 50,

      currentTime,
      trailLength: 600
    })
  ];

  deckInstance.setProps({layers});
}
```

  </TabItem>
  <TabItem value="ts" label="TypeScript">

```ts
import {Deck} from '@deck.gl/core';
import {TripsLayer} from '@deck.gl/geo-layers';
import {animate} from "popmotion";

const currentTimeAnimation = animate<number>({
  from: 0, // currentTime min value
  to: 1800, // currentTime max value
  duration: 5000, // over the course of 5 seconds
  repeat: Infinity,
  onUpdate: updateLayers
});

const deckInstance = new Deck({
  initialViewState: {
    longitude: -122.4,
    latitude: 37.8,
    zoom: 12
  },
  controller: true
});

type TripData = {
  coordinates: [longitude: number, latitude: number][];
  timestamps: number[];
};

function updateLayers(currentTime: number) {
  const layers = [
    new TripsLayer<TripData>({
      id: 'TripsLayer',
      data: '/path/to/data.json',
      getPath: (d: TripData) => d.waypoints.map(p => p.coordinates),
      getTimestamps: (d: TripData) => d.waypoints.map(p => p.timestamp),
      getColor: [253, 128, 93],
      getWidth: 50,

      currentTime,
      trailLength: 600
    })
  ];

  deckInstance.setProps({layers});
}
```

  </TabItem>
  <TabItem value="react" label="React">

```tsx
import React, {useState, useEffect} from 'react';
import {DeckGL} from '@deck.gl/react';
import {MapViewState} from '@deck.gl/core';
import {TripsLayer} from '@deck.gl/geo-layers';
import {animate} from "popmotion";

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -122.4,
  latitude: 37.8,
  zoom: 12
};

type TripData = {
  coordinates: [longitude: number, latitude: number][];
  timestamps: number[];
};

function App() {
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    const currentTimeAnimation = animate<number>({
      from: 0, // currentTime min value
      to: 1800, // currentTime max value
      duration: 5000, // over the course of 5 seconds
      repeat: Infinity,
      onUpdate: setCurrentTime
    });
    return () => currentTimeAnimation.stop();
  });

  const layers = [
    new TripsLayer<TripData>({
      id: 'TripsLayer',
      data: '/path/to/data.json',
      getPath: (d: TripData) => d.waypoints.map(p => p.coordinates),
      getTimestamps: (d: TripData) => d.waypoints.map(p => p.timestamp),
      getColor: [253, 128, 93],
      getWidth: 50,

      currentTime,
      trailLength: 600
    })
  ];

  return <DeckGL
    initialViewState={INITIAL_VIEW_STATE}
    controller
    layers={layers}
  />;
}
```

  </TabItem>
</Tabs>

Deck.gl is designed to handle layer updates very efficiently at high frame rate. An example of this kind of application is [autonomous vehicle visualization](https://avs.auto), where car pose, LIDAR point clouds, camera imagery, as well as geometries outlining perception, prediction and planning decisions are streamed in from a server many times a second. The [performance guide](./performance.md) describes various techniques in optimizing for large datasets and frequent updates.

[hubble.gl](https://hubble.gl/), a project by the vis.gl community, implements comprehensive keyframe-controlled animation of deck.gl layers for interactive storytelling and/or render to video.



---

Source: https://github.com/visgl/deck.gl/blob/v9.4.0/docs/api-reference/react/deckgl.md

# DeckGL (React Component)

`DeckGL` is the main interface to deck.gl for React applications. `DeckGL` is a React component that takes a list of deck.gl layer instances and a view state, and renders those layers on a transparent canvas that can be used as an overlay over other components like maps.

Make sure to read the [Using deck.gl with React](../../get-started/using-with-react.md) article.

The `DeckGL` class is a React wrapper of the [Deck](../core/deck.md) JavaScript class which exposes essentially the same props. The `Deck` class should not be used directly in React applications.


## Usage

```js
// Basic usage
import {DeckGL} from '@deck.gl/react';
import {ScatterplotLayer} from '@deck.gl/layers';

const App = (data) => (
  <DeckGL
    longitude={-122.45}
    latitude={37.78}
    zoom={12}
    layers={[new ScatterplotLayer({data})]} />
);
```

Like any React component, `DeckGL` can accept child components. Typical React components include:

- Base maps such as the [`Map`](https://visgl.github.io/react-map-gl/docs/api-reference/map) component from `react-map-gl`, which can synchronize with deck.gl's view state.
- [Widgets](./overview.md#using-react-wrapped-widgets), which can display and control deck.gl state.

```js
import {DeckGL} from '@deck.gl/react';
import {Map} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const App = (data) => (
  <DeckGL
    initialViewState={{longitude: -122.45, latitude: 37.78, zoom: 12}}
    controller={true}
    layers={[new ScatterplotLayer({data})]}
  >
    <Map mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" />
  </DeckGL>
);

```

## Properties

`DeckGL` accepts all [Deck](../core/deck.md#properties) properties, with these additional semantics:

### React Context

#### `ContextProvider` (React.Component, optional) {#contextprovider}

A [Context.Provider](https://reactjs.org/docs/context.html#contextprovider) component. If supplied, will be rendered as the ancestor to all children. The passed through context contains the following values:

- `viewport` ([Viewport](../core/viewport.md)) - the current viewport
- `container` (DOMElement) - the DOM element containing the deck canvas
- `eventManager` ([EventManager](https://visgl.github.io/mjolnir.js/docs/api-reference/event-manager))
- `onViewStateChange` ([onViewStateChange](../core/deck.md#onviewstatechange)) - the view state change handler 
- `deck` ([Deck](../core/deck.md)) - the current deck instance, if present
- `widgets` ([Widget](../core/widget.md)[]) - the current jsx widgets, if any

```jsx
/// Example using react-map-gl v6 controls with deck.gl
/// To use react-map-gl v7, see https://deck.gl/docs/api-reference/mapbox/mapbox-overlay
import {DeckGL} from '@deck.gl/react';
import {_MapContext as MapContext, NavigationControl} from 'react-map-gl';

<DeckGL ... ContextProvider={MapContext.Provider}>
  <div style={NAVIGATION_CONTROL_STYLES}>
    <NavigationControl />
  </div>
</DeckGL>
```


### Children

The following semantics of the standard React `children` property are considered experimental.


#### JSX layers

It is possible to use JSX syntax to create deck.gl layers as React children of the `DeckGL` React components, instead of providing them as ES6 class instances to the `layers` prop.

```jsx
  <DeckGL initialViewState={...viewState}>
    <LineLayer id="line-layer" data={data} />
  <DeckGL />
```

> Caveat: The JSX layer syntax is limited in that it only works when the layers are direct children of the `DeckGL` component. deck.gl layers are not true React components and cannot be rendered independently by React, and the JSX support depends on deck.gl intercepting the JSX generated child elements before React tries to render them.


#### JSX views

It is possible to use JSX syntax to create deck.gl views as React children of the `DeckGL` React components, instead of providing them as ES6 class instances to the `views` prop.

```jsx
  <DeckGL initialViewState={...viewState} layers={layers} >
    <MapView id="map" width="50%" controller={true} >
      <Map mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" />
    </MapView>
    <FirstPersonView width="50%" x="50%" fovy={50} />
  <DeckGL />
```

If a certain view id is used in both JSX views and the `views` prop, the view instance in the `views` prop has priority.

```jsx
  const views = [
    new MapView({id: 'map', width: '50%', controller: true}),
    new FirstPersonView({width: '50%', x: '50%', fovy: 50})
  ];

  <DeckGL initialViewState={...viewState} layers={layers} views={views} >
    <View id="map">
      <Map mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" />
    </View>
  <DeckGL />
```

#### JSX Widgets

It is possible to use JSX syntax to create deck.gl widgets as React children of the `DeckGL` React components, instead of providing them as ES6 class instances to the `widgets` props.

```jsx
  <DeckGL initialViewState={...viewState}>
    <ZoomWidget id="zoom-widget" placement="top-right" />
  <DeckGL />
```

Learn how to use widgets in JSX by reading [Using React-wrapped widgets](./overview.md#using-react-wrapped-widgets).

#### Position Children in Views

To make it easy to use React components in combination with deck.gl views (e.g. to place a base map under a view, or add a label on top of a view), deck.gl can make such components automatically adjust as that view is added, removed or resized.

Each child element of `DeckGL` is positioned inside a view. All children of a view is wrapped in a DOM container that:

* is offset to be relative to the deck.gl view that it corresponds to.
* is resized to match the extent of the deck.gl view with the corresponding view id.
* is hidden if the view id is missing from `DeckGL`'s `views` prop.

The containing view of each element is determined as follows:

- If the element is a direct child of `DeckGL`, it is positioned inside the default (first) view.
- If the element is nested under a `<View id={id}>` tag, it is positioned inside the view corresponding to the `id` prop. 


#### Render callbacks

You may supply a function as a child to the `DeckGL` or `View` node (see **JSX views**). The function will be called to retrieve the React children when the viewport updates.

The following arguments are passed:

* `x` - the left offset of the current view, in pixels
* `y` - the top offset of the current view, in pixels
* `width` - the width of the current view, in pixels
* `height` - the height of the current view, in pixels
* `viewState` - the view state of the current view
* `viewport` - the `Viewport` instance of the current view

This is useful when you need to specify custom rendering logic for a child:

```jsx
  <DeckGL {...viewState}>
    {({x, y, width, height, viewState, viewport}) => (
      <Marker
        project={viewport.project}
        longitude={-122.45}
        latitude={37.8}
        width={24}
        height={24} />
    )}
  <DeckGL />
```

Additional Notes:

* The DeckGL components own `canvas` element is added last to the child list, to sit on top of all the base components, however Z index can be used to override this.
* Child repositioning is done with CSS styling on a wrapper div.
* Children that do not belong to any `<View>` tag and are functions are called with the properties of the default view.
* Children that do not belong to any `<View>` tag and are valid React elements are rendered as is.


## Methods

All [Deck](../core/deck.md#methods) methods are available on the `DeckGL` component, but not all of them can be explicitly called. For example, to rerender your component, you can pass updated props to `DeckGL` component directly, while you should call `setProps` with new props in `Deck`. 

The public methods you can call explicitly list below:

* `pickObjectAsync`
* `pickObjectsAsync`
* `pickObject`
* `pickMultipleObjects`
* `pickObjects`

We do recommend you to use the pure JavaScript version of deck.gl if you are more comfortable with an imperative programming style (e.g. `deck.setProps()`).

## Source

[modules/react/src/deckgl.ts](https://github.com/visgl/deck.gl/tree/9.4-release/modules/react/src/deckgl.ts)



---

Source: https://github.com/visgl/deck.gl/blob/v9.4.0/docs/get-started/using-with-react.md

# Using deck.gl with React

While not directly based on React, deck.gl is designed from ground up to work with [React](https://facebook.github.io/react/) based applications. deck.gl layers fit naturally into React's component render flow and flux/redux based applications. deck.gl layers will be performantly rerendered whenever you rerender your normal JSX or React components.


## The DeckGL React Component

To use deck.gl with React, simply import the `DeckGL` React component and render it as a child of another component, passing in your list of deck.gl layers as a property.

```tsx
import React from 'react';
import {DeckGL} from '@deck.gl/react';
import {MapViewState} from '@deck.gl/core';
import {LineLayer} from '@deck.gl/layers';

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -122.41669,
  latitude: 37.7853,
  zoom: 13
};

type DataType = {
  from: [longitude: number, latitude: number];
  to: [longitude: number, latitude: number];
};

function App() {
  const layers = [
    new LineLayer<DataType>({
      id: 'line-layer',
      data: '/path/to/data.json',
      getSourcePosition: (d: DataType) => d.from,
      getTargetPosition: (d: DataType) => d.to,
    })
  ];

  return <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller
      layers={layers} />;
}

```

## Adding a Base Map

The vis.gl community maintains two React libraries that seamlessly work with deck.gl.

- `react-map-gl` - a React wrapper for [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/guides) and [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/). Several integration options are discussed in [using with Mapbox](../developer-guide/base-maps/using-with-mapbox.md).
- `@vis.gl/react-google-maps` - a React wrapper for [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript). See [using with Google Maps](../developer-guide/base-maps/using-with-google-maps.md).

## Using JSX Layers, Views, and Widgets

It is possible to use JSX syntax to create deck.gl layers, views, and widgets as React children of the `DeckGL` React components, instead of providing them as ES6 class instances to the `layers`, `views`, or `widgets` prop, respectively. There are no performance advantages to this syntax but it can allow for a more consistent, React-like coding style.

```jsx
import React from 'react';
import {DeckGL} from '@deck.gl/react';
import {MapViewState} from '@deck.gl/core';
import {LineLayer} from '@deck.gl/layers';
import {ZoomWidget} from '@deck.gl/react';
import {Map} from 'react-map-gl/mapbox';

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -122.41669,
  latitude: 37.7853,
  zoom: 13
};

function App() {
  return (
    <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller
    >
      <LineLayer
        id="line-layer"
        data="/path/to/data.json"
        getSourcePosition={d => d.from}
        getTargetPosition={d => d.to} />

      <MapView id="map" width="50%" controller >
        <Map mapStyle="mapbox://styles/mapbox/light-v9" />
      </MapView>

      <FirstPersonView width="50%" x="50%" fovy={50} />

      <ZoomWidget/>
    </DeckGL>
  );
}
```

For more information on this syntax and its limitations, see [DeckGL API](../api-reference/react/deckgl.md).


## Performance Remarks

- Comparing to the `Deck` class in vanilla JavaScript, the `DeckGL` React component is a thin wrapper and in itself does not add any significant performance overhead. However, applications should be mindful that callbacks such as `onHover`, `onViewStateChange` etc. could potentially be invoked on every animation frame, and updating app states within these callbacks will trigger React to rerender (at least part of) the component tree. Therefore, apps should be diligent in following React best practices in general, such as avoiding expensive recalculation with `useMemo` hooks.

- When the component containing `DeckGL` indeed needs to rerender, there is no performance concern in recreating the deck.gl layer instances, even if their props are not changed. When deck.gl receives new layer instances, it compares them with the existing layers, and only updates GPU resources when needed, just like React does for DOM components. Learn more about how it works in this [FAQ](../developer-guide/using-layers.md#should-i-be-creating-new-layers-on-every-render).


## Using deck.gl with SSR

Frameworks such as `Next.js` and `Gatsby` leverage Server Side Rendering to improve page loading performance. As of v9.0, deck.gl is fully [ES module](https://nodejs.org/api/packages.html) compliant with support for both ESM-style `import` and CommonJS-style `require()`. Depending on your project settings and the server-side bundler, everything likely would just work.

For some projects, SSR may fail with an error message `Error: require() of ES Module 'xxx'`. This is because some of deck.gl's upstream dependencies, such as `d3`, have opted to become ESM-only and no longer support `require()`. Possible mitigations are:

- Add `type: "module"` to the project's package.json. This will require other CommonJS-style scripts in the project be updated, as detailed in [Node.js documentation](https://nodejs.org/api/esm.html#enabling). Or,
- Isolate the deck.gl imports and exclude them from SSR. Since deck.gl renders into a WebGL2/WebGPU context, it wouldn't benefit from SSR to begin with. Below is a minimal sample for `Next.js`:

```jsx title="/src/components/map.js"
import {DeckGL} from '@deck.gl/react';
import {TextLayer} from '@deck.gl/layers';

export default function Map() {
  const layers = [
    new TextLayer({...})
  ];

  return <DeckGL layers={layers} />
}
```

```jsx title="/src/pages/app.js"
import dynamic from 'next/dynamic';
const Map = dynamic(() => import('../components/map'), {ssr: false});

export default function App() {
  return <Map />;
}
```

More examples are discussed in [this issue](https://github.com/visgl/deck.gl/issues/7735).



---

# deck.gl Trips example app (verbatim)

Source: https://github.com/visgl/deck.gl/blob/v9.4.0/examples/website/trips/app.tsx

```tsx
// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {Map} from 'react-map-gl/maplibre';
import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
import {DeckGL} from '@deck.gl/react';
import type {Device} from '@luma.gl/core';
import {PolygonLayer} from '@deck.gl/layers';
import {TripsLayer} from '@deck.gl/geo-layers';
import {animate} from 'popmotion';

import type {Position, Color, Material, MapViewState} from '@deck.gl/core';

// Source data CSV
const DATA_URL = {
  BUILDINGS:
    'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/buildings.json', // eslint-disable-line
  TRIPS: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/trips-v7.json' // eslint-disable-line
};

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 2.0,
  position: [-74.05, 40.7, 8000]
});

const lightingEffect = new LightingEffect({ambientLight, pointLight});

type Theme = {
  buildingColor: Color;
  trailColor0: Color;
  trailColor1: Color;
  material: Material;
  effects: [LightingEffect];
};

const DEFAULT_THEME: Theme = {
  buildingColor: [74, 80, 87],
  trailColor0: [253, 128, 93],
  trailColor1: [23, 184, 190],
  material: {
    ambient: 0.1,
    diffuse: 0.6,
    shininess: 32,
    specularColor: [60, 64, 70]
  },
  effects: [lightingEffect]
};

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -74,
  latitude: 40.72,
  zoom: 13,
  pitch: 45,
  bearing: 0
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';

const landCover: Position[][] = [
  [
    [-74.0, 40.7],
    [-74.02, 40.7],
    [-74.02, 40.72],
    [-74.0, 40.72]
  ]
];

type Building = {
  polygon: Position[];
  height: number;
};

type Trip = {
  vendor: number;
  path: Position[];
  timestamps: number[];
};

export default function App({
  device,
  buildings = DATA_URL.BUILDINGS,
  trips = DATA_URL.TRIPS,
  trailLength = 180,
  initialViewState = INITIAL_VIEW_STATE,
  mapStyle = MAP_STYLE,
  theme = DEFAULT_THEME,
  loopLength = 1800, // unit corresponds to the timestamp in source data
  animationSpeed = 1
}: {
  device?: Device;
  buildings?: string | Building[];
  trips?: string | Trip[];
  trailLength?: number;
  loopLength?: number;
  animationSpeed?: number;
  initialViewState?: MapViewState;
  mapStyle?: string;
  theme?: Theme;
}) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const animation = animate({
      from: 0,
      to: loopLength,
      duration: (loopLength * 60) / animationSpeed,
      repeat: Infinity,
      onUpdate: setTime
    });
    return () => animation.stop();
  }, [loopLength, animationSpeed]);

  const layers = [
    // This is only needed when using shadow effects
    new PolygonLayer<Position[]>({
      id: 'ground',
      data: landCover,
      getPolygon: f => f,
      stroked: false,
      getFillColor: [0, 0, 0, 0]
    }),
    new TripsLayer<Trip>({
      id: 'trips',
      data: trips,
      getPath: d => d.path,
      getTimestamps: d => d.timestamps,
      getColor: d => (d.vendor === 0 ? theme.trailColor0 : theme.trailColor1),
      opacity: 0.3,
      widthMinPixels: 2,
      rounded: true,
      trailLength,
      currentTime: time,

      shadowEnabled: false
    }),
    new PolygonLayer<Building>({
      id: 'buildings',
      data: buildings,
      extruded: true,
      wireframe: false,
      opacity: 0.5,
      getPolygon: f => f.polygon,
      getElevation: f => f.height,
      getFillColor: theme.buildingColor,
      material: theme.material
    })
  ];

  return (
    <DeckGL
      device={device}
      layers={layers}
      effects={theme.effects}
      initialViewState={initialViewState}
      controller={true}
    >
      <Map reuseMaps mapStyle={mapStyle} />
    </DeckGL>
  );
}

export function renderToDOM(container: HTMLDivElement) {
  createRoot(container).render(<App />);
}

```


---

Source: https://github.com/visgl/luma.gl/blob/master/docs/api-reference/core/parameters.md

import {BlendingExample} from '@site/src/examples';

# GPU parameters

Pipeline parameters are fixed state; pass parameters describe a target and its mutable draw state.
See [Using GPU parameters](/docs/api-guide/gpu/gpu-parameters) for examples.

## Parameter ownership

| State | API | Lifetime |
| --- | --- | --- |
| Rasterization, depth, stencil, blending, multisampling | `RenderPipelineProps.parameters` | Fixed for a pipeline. |
| Viewport, scissor rectangle, blend constant, stencil reference | `RenderPass.setParameters()` | Mutable between draws. |
| Clearing, read-only attachments, rasterizer discard | `RenderPassProps` | Fixed for a pass. |
| Texture sampling | `Sampler` | Fixed for a sampler. |

Create another pipeline for different fixed state, or use `Model.setParameters()` to let
Engine manage pipeline selection. [PipelineFactory](/docs/api-reference/core/pipeline-factory)
can reuse compatible pipeline descriptors.

## Dynamic RenderPass parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `viewport` | `NumberArray4 \| NumberArray6` | `[x, y, width, height]`, optionally followed by minimum and maximum depth. |
| `scissorRect` | `NumberArray4` | `[x, y, width, height]` clipping rectangle in drawing-buffer pixels. |
| `blendConstant` | `NumberArray4` | RGBA value used by `constant` and `one-minus-constant` blend factors. |
| `stencilReference` | `number` | Reference value for stencil comparisons and replacement. |

## Fixed RenderPass options

Use `clearColor`, `clearDepth`, and `clearStencil` to choose clear values, or boolean
`false` to preserve an attachment. Attachment textures belong to `Framebuffer`; clear
values belong to the pass. See
[RenderPassProps](/docs/api-reference/core/resources/render-pass#renderpassprops)
for the complete contract and defaults.

## RenderPipeline Parameters

### Assembly (Culling)

These parameters control the primitive assembly stage (which happens before fragment shader runs).

| Function    | Type / Values                     | Description                           |
| ----------- | --------------------------------- | ------------------------------------- |
| `cullMode` | **`'none'`**, `'front'`, `'back'` | Which face to cull |
| `frontFace` | **`'ccw'`**, `'cw'` | Which triangle winding order is front |

In addition, the following `RenderPipeline` properties are not typically considered GPU parameters but do impact the assembly stage:
- `topology` must be specified on a `RenderPipeline` to describe the layout of vertex buffers.
- `stripIndexFormat` can be specified on the `RenderPipeline` to define sub-list separators.

### Depth Test Parameters

After the GPU completes stencil tests, depth tests and writes are performed. These can be controlled by the following parameters:

| Function              | Description                            | Values               | WebGL counterpart                   |
| --------------------- | -------------------------------------- | -------------------- | ----------------------------------- |
| `depthWriteEnabled` | Whether depth buffer is updated | `boolean` **`false`** | `gl.depthMask` |
| `depthCompare` | If and how depth testing is done | **`always`**, ... | `gl.depthFunc` |
| `depthBias` | Small depth offset for polygons | `float` | `gl.polygonOffset` |
| `depthBiasSlopeScale` | Small depth factor for polygons | `float` | `gl.polygonOffset` |
| `depthBiasClamp` | Max depth offset for polygons | `float` | N/A |
| `unclippedDepth` | Disable depth value clipping to [0, 1] | **false** boolean | N/A - Requires `depth-clip-control` |

- **Depth Bias** - Sometimes referred to as "polygon offset". Adds small offset to fragment depth values (by factor × DZ + r × units). Usually used as a heuristic to avoid z-fighting, but can also be used for effects like applying decals to surfaces, and for rendering solids with highlighted edges. The semantics of polygon offsets are loosely specified by the WebGL standard and results can thus be driver dependent.


### Multisampling

| Function                 | Values           | Description |
| ------------------------ | ---------------- | ----------- |
| `sampleCount` | **`1`** | — |
| `sampleMask` | **`0xFFFFFFFF`** | — |
| `sampleAlphaToCoverageEnabled` | **`false`** | — |

### Stencil Test

After the fragment shader runs, optional stencil tests are performed, with resulting operations on the stencil buffer.

| Function                    | Type               | Default            | Description                            |
| --------------------------- | ------------------ | ------------------ | -------------------------------------- |
| `stencilReadMask` | `number` | (**`0xffffffff`**) | Binary mask for reading stencil values |
| `stencilWriteMask` | `number` | (**`0xffffffff`**) | Binary mask for writing stencil values |
| `stencilCompare` | `StencilCompare` | **`always`** | How the mask is compared |
| `stencilPassOperation` | `StencilOperation` | **`'keep'`** | — |
| `stencilDepthFailOperation` | `StencilOperation` | **`'keep'`** | — |
| `stencilFailOperation` | `StencilOperation` | **`'keep'`** | — |


| `StencilCompare` | Description                                |
| ---------------- | ------------------------------------------ |
| `'always'` | Always pass |
| `'never'` | Never pass |
| `'less'` | Pass if (ref & mask) < (stencil & mask) |
| `'equal'` | Pass if (ref & mask) = (stencil & mask) |
| `'less-equal'` | Pass if (ref & mask) \<\= (stencil & mask) |
| `'greater'` | Pass if (ref & mask) > (stencil & mask) |
| `'not-equal'` | Pass if (ref & mask) != (stencil & mask) |
| `'greater-equal'` | Pass if (ref & mask) \>\= (stencil & mask) |

`StencilOperation` values describe action when the stencil test fails

- stencil test fail action,
- depth test fail action,
- pass action


| `StencilOperation`  | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| `'keep'` | Keeps current value |
| `'zero'` | Sets stencil buffer value to 0 |
| `'replace'` | Sets stencil buffer value to reference value per `stencilFunc` |
| `'invert'` | Inverts stencil buffer value bitwise |
| `'increment-clamp'` | Increments stencil buffer value. Clamps to max value |
| `'increment-wrap'` | Increments stencil buffer value. Wraps to zero |
| `'decrement-clamp'` | Decrements stencil buffer value. Clamps to 0 |
| `'decrement-wrap'` | Decrements stencil buffer value, wraps to max unsigned value |


Remarks:

- By using binary masks, an 8 bit stencil buffer can effectively contain 8 separate masks or stencils
- The luma.gl API currently does not support setting stencil operations separately for front and back faces.

### Color Targets

A `RenderPipeline` requires information about each color attachments:

| Target setting         | Type            | Default   | Description                                                |
| ---------------------- | --------------- | --------- | ---------------------------------------------------------- |
| `format` | `TextureFormat` | N/A | — |
| `writeMask?` | `number` | ALL = 0xF | RED = 0x1, GREEN = 0x2, BLUE = 0x4, ALPHA = 0x8, ALL = 0xF |
| `blendColorOperation?` | BlendOperation | `'add'` | — |
| `blendColorSrcFactor?` | BlendFactor | `'one'` | — |
| `blendColorDstFactor?` | BlendFactor | `'zero'` | — |
| `blendAlphaOperation?` | BlendOperation | `'add'` | — |
| `blendAlphaSrcFactor?` | BlendFactor | `'one'` | — |
| `blendAlphaDstFactor?` | BlendFactor | `'zero'` | — |

### Blending

Blending mixes the source color and the target color:

Use the interactive playground to compare blend operations, source and destination factors,
blend constants, and separate color and alpha output.

<BlendingExample embedded showStats={false} />

- The two colors are first multiplied with chosen factors (controlled by "blend function" parameters).
- The two colors are then either added, subtracted, or the min or max color is used per the "blend operation" parameter.

The default blending settings do not perform any visual "blending" but simply overwrites the destination color with the source color by:

- multiplying the src color with 1
- multiplying the destination color with 0
- using the `'add'` blend operation.

The following link provides more information on [color blending][color_blending].

[color_blending]: https://csawesome.runestone.academy/runestone/books/published/learnwebgl2/12_advanced_rendering/05_color_blending.html

- `blendConstant` The constant blend color referenced by `constant` and `one-minus-constant` can be changed at any time with `RenderPass.setParameters({})`.

| BlendOperation       | Output color                    | Visual effect                                                           |
| -------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| `'add'` | source + destination | Incrementally brighten as multiple elements render on top of each other |
| `'subtract'` | source - destination | - |
| `'reverse-subtract'` | destination - source | - |
| `'min'` | minimum of source and destination | - |
| `'max'` | maximum of source and destination | Ensure brightest color is preserved |

| BlendFunction           | All colors multiplied with                             | Comment                                  |
| ----------------------- | ------------------------------------------------------ | ---------------------------------------- |
| `'zero'` | `[0,0,0,0]` | — |
| `'one'` | `[1,1,1,1]` | — |
| `'src'` | RBGAsrc | — |
| `'one-minus-src'` | 1 - RGBAsrc | — |
| `'src-alpha'` | AAAAsrc | — |
| `'one-minus-src-alpha'` | 1 - AAAAsrc | — |
| `'dst'` | RBGAdst | — |
| `'one-minus-dst'` | 1 - RBGAdst | — |
| `'dst-alpha'` | AAAAdest | — |
| `'one-minus-dst-alpha'` | 1 - AAAAdst | — |
| `'src-alpha-saturated'` | [min(AS, 1 - AD), min(AS, 1 - AD), min(AS, 1 - AD), 1] | — |
| `'constant'` | RGBAconstant | constant set with `blendConstant` parameter |
| `'one-minus-constant'` | 1- RGBAconstant | constant set with `blendConstant` parameter |



---

Source: https://maplibre.org/maplibre-gl-js/docs/examples/display-a-map/

# Display a map

Initialize a map in an HTML element with MapLibre GL JS.

```js
import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.mjs';

const map = new maplibregl.Map({
    container: 'map', // container id
    style: 'https://demotiles.maplibre.org/style.json', // style URL
    center: [0, 0], // starting position [lng, lat]
    zoom: 1, // starting zoom
    maplibreLogo: true
});
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Display a map</title>
    <meta property="og:description" content="Initialize a map in an HTML element with MapLibre GL JS." />
    <meta property="og:category" content="Getting Started" />
    <meta property="og:order" content="1" />
    <meta property="og:created" content="2025-06-25" />
    <meta charset='utf-8'>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel='stylesheet' href='https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.css' />

    <style>
        body { margin: 0; padding: 0; }
        html, body, #map { height: 100%; }
    </style>
</head>
<body>
<div id="map"></div>
<script type="module">
    import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.mjs';

    const map = new maplibregl.Map({
        container: 'map', // container id
        style: 'https://demotiles.maplibre.org/style.json', // style URL
        center: [0, 0], // starting position [lng, lat]
        zoom: 1, // starting zoom
        maplibreLogo: true
    });
</script>
</body>
</html>
```



---

Source: https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/

# Display buildings in 3D

Use extrusions to display buildings' height in 3D.

```js
import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.mjs';

const map = new maplibregl.Map({
    style: `https://tiles.openfreemap.org/styles/bright`,
    center: [-74.0066, 40.7135],
    zoom: 15.5,
    pitch: 45,
    bearing: -17.6,
    container: 'map',
    canvasContextAttributes: {antialias: true}
});

// The 'building' layer in the streets vector source contains building-height
// data from OpenStreetMap.
map.on('load', () => {
    // Insert the layer beneath any symbol layer.
    const layers = map.getStyle().layers;

    let labelLayerId;
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
            labelLayerId = layers[i].id;
            break;
        }
    }

    map.addSource('openfreemap', {
        url: `https://tiles.openfreemap.org/planet`,
        type: 'vector',
    });

    map.addLayer(
        {
            'id': '3d-buildings',
            'source': 'openfreemap',
            'source-layer': 'building',
            'type': 'fill-extrusion',
            'minzoom': 15,
            'filter': ['!=', ['get', 'hide_3d'], true],
            'paint': {
                'fill-extrusion-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'render_height'], 0, 'lightgray', 200, 'royalblue', 400, 'lightblue'
                ],
                'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    16,
                    ['get', 'render_height']
                ],
                'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    16,
                    ['get', 'render_min_height']
                ]
            }
        },
        labelLayerId
    );
});
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Display buildings in 3D</title>
  <meta property="og:description" content="Use extrusions to display buildings' height in 3D." />
  <meta property="og:category" content="3D Models & Buildings" />
  <meta property="og:order" content="1" />
  <meta property="og:created" content="2025-06-25" />
  <meta charset='utf-8'>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel='stylesheet' href='https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.css' />

  <style>
      body { margin: 0; padding: 0; }
      html, body, #map { height: 100%; }
  </style>
</head>
<body>
<div id="map"></div>
<script type="module">
  import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.mjs';

  const map = new maplibregl.Map({
      style: `https://tiles.openfreemap.org/styles/bright`,
      center: [-74.0066, 40.7135],
      zoom: 15.5,
      pitch: 45,
      bearing: -17.6,
      container: 'map',
      canvasContextAttributes: {antialias: true}
  });

  // The 'building' layer in the streets vector source contains building-height
  // data from OpenStreetMap.
  map.on('load', () => {
      // Insert the layer beneath any symbol layer.
      const layers = map.getStyle().layers;

      let labelLayerId;
      for (let i = 0; i < layers.length; i++) {
          if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
              labelLayerId = layers[i].id;
              break;
          }
      }

      map.addSource('openfreemap', {
          url: `https://tiles.openfreemap.org/planet`,
          type: 'vector',
      });

      map.addLayer(
          {
              'id': '3d-buildings',
              'source': 'openfreemap',
              'source-layer': 'building',
              'type': 'fill-extrusion',
              'minzoom': 15,
              'filter': ['!=', ['get', 'hide_3d'], true],
              'paint': {
                  'fill-extrusion-color': [
                      'interpolate',
                      ['linear'],
                      ['get', 'render_height'], 0, 'lightgray', 200, 'royalblue', 400, 'lightblue'
                  ],
                  'fill-extrusion-height': [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      15,
                      0,
                      16,
                      ['get', 'render_height']
                  ],
                  'fill-extrusion-base': [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      15,
                      0,
                      16,
                      ['get', 'render_min_height']
                  ]
              }
          },
          labelLayerId
      );
  });
</script>
</body>
</html>
```



---

Source: https://maplibre.org/maplibre-gl-js/docs/examples/animate-map-camera-around-a-point/

# Animate map camera around a point

Animate the map camera around a point.

```js
import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.mjs';

const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [-87.62712, 41.89033],
    zoom: 15.5,
    pitch: 45
});

function rotateCamera(timestamp) {
    // clamp the rotation between 0 -360 degrees
    // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
    map.rotateTo((timestamp / 100) % 360, {duration: 0});
    // Request the next frame of the animation.
    requestAnimationFrame(rotateCamera);
}

map.on('load', () => {
    // Start the animation.
    rotateCamera(0);

    // Add 3d buildings and remove label layers to enhance the map
    const layers = map.getStyle().layers;
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
            // remove text labels
            map.removeLayer(layers[i].id);
        }
    }
});
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Animate map camera around a point</title>
    <meta property="og:description" content="Animate the map camera around a point." />
    <meta property="og:category" content="Camera & Animation" />
    <meta property="og:created" content="2025-06-25" />
    <meta charset='utf-8'>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel='stylesheet' href='https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.css' />

    <style>
        body { margin: 0; padding: 0; }
        html, body, #map { height: 100%; }
    </style>
</head>
<body>
<div id="map"></div>
<script type="module">
    import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.mjs';

    const map = new maplibregl.Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [-87.62712, 41.89033],
        zoom: 15.5,
        pitch: 45
    });

    function rotateCamera(timestamp) {
        // clamp the rotation between 0 -360 degrees
        // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
        map.rotateTo((timestamp / 100) % 360, {duration: 0});
        // Request the next frame of the animation.
        requestAnimationFrame(rotateCamera);
    }

    map.on('load', () => {
        // Start the animation.
        rotateCamera(0);

        // Add 3d buildings and remove label layers to enhance the map
        const layers = map.getStyle().layers;
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                // remove text labels
                map.removeLayer(layers[i].id);
            }
        }
    });
</script>
</body>
</html>
```



---

Source: https://maplibre.org/maplibre-gl-js/docs/examples/create-a-hover-effect/

# Create a hover effect

Use events and feature states to create a per feature hover effect.

```js
import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.mjs';

const map = new maplibregl.Map({
    container: 'map',
    style: 'https://demotiles.maplibre.org/style.json',
    center: [-100.486052, 37.830348],
    zoom: 2
});
let hoveredStateId = null;

map.on('load', () => {
    map.addSource('states', {
        'type': 'geojson',
        'data':
            'https://maplibre.org/maplibre-gl-js/docs/assets/us_states.geojson'
    });

    // The feature-state dependent fill-opacity expression will render the hover effect
    // when a feature's hover state is set to true.
    map.addLayer({
        'id': 'state-fills',
        'type': 'fill',
        'source': 'states',
        'layout': {},
        'paint': {
            'fill-color': '#627BC1',
            'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1,
                0.5
            ]
        }
    });

    map.addLayer({
        'id': 'state-borders',
        'type': 'line',
        'source': 'states',
        'layout': {},
        'paint': {
            'line-color': '#627BC1',
            'line-width': 2
        }
    });

    // When the user moves their mouse over the state-fill layer, we'll update the
    // feature state for the feature under the mouse.
    map.on('mousemove', 'state-fills', (e) => {
        if (e.features.length > 0) {
            if (hoveredStateId) {
                map.setFeatureState(
                    {source: 'states', id: hoveredStateId},
                    {hover: false}
                );
            }
            hoveredStateId = e.features[0].id;
            map.setFeatureState(
                {source: 'states', id: hoveredStateId},
                {hover: true}
            );
        }
    });

    // When the mouse leaves the state-fill layer, update the feature state of the
    // previously hovered feature.
    map.on('mouseleave', 'state-fills', () => {
        if (hoveredStateId) {
            map.setFeatureState(
                {source: 'states', id: hoveredStateId},
                {hover: false}
            );
        }
        hoveredStateId = null;
    });
});
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Create a hover effect</title>
    <meta property="og:description" content="Use events and feature states to create a per feature hover effect." />
    <meta property="og:category" content="Events & Queries" />
    <meta property="og:order" content="2" />
    <meta property="og:created" content="2025-06-25" />
    <meta charset='utf-8'>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel='stylesheet' href='https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.css' />

    <style>
        body { margin: 0; padding: 0; }
        html, body, #map { height: 100%; }
    </style>
</head>
<body>
<div id="map"></div>
<script type="module">
    import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.mjs';

    const map = new maplibregl.Map({
        container: 'map',
        style: 'https://demotiles.maplibre.org/style.json',
        center: [-100.486052, 37.830348],
        zoom: 2
    });
    let hoveredStateId = null;

    map.on('load', () => {
        map.addSource('states', {
            'type': 'geojson',
            'data':
                'https://maplibre.org/maplibre-gl-js/docs/assets/us_states.geojson'
        });

        // The feature-state dependent fill-opacity expression will render the hover effect
        // when a feature's hover state is set to true.
        map.addLayer({
            'id': 'state-fills',
            'type': 'fill',
            'source': 'states',
            'layout': {},
            'paint': {
                'fill-color': '#627BC1',
                'fill-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    1,
                    0.5
                ]
            }
        });

        map.addLayer({
            'id': 'state-borders',
            'type': 'line',
            'source': 'states',
            'layout': {},
            'paint': {
                'line-color': '#627BC1',
                'line-width': 2
            }
        });

        // When the user moves their mouse over the state-fill layer, we'll update the
        // feature state for the feature under the mouse.
        map.on('mousemove', 'state-fills', (e) => {
            if (e.features.length > 0) {
                if (hoveredStateId) {
                    map.setFeatureState(
                        {source: 'states', id: hoveredStateId},
                        {hover: false}
                    );
                }
                hoveredStateId = e.features[0].id;
                map.setFeatureState(
                    {source: 'states', id: hoveredStateId},
                    {hover: true}
                );
            }
        });

        // When the mouse leaves the state-fill layer, update the feature state of the
        // previously hovered feature.
        map.on('mouseleave', 'state-fills', () => {
            if (hoveredStateId) {
                map.setFeatureState(
                    {source: 'states', id: hoveredStateId},
                    {hover: false}
                );
            }
            hoveredStateId = null;
        });
    });
</script>
</body>
</html>
```



---

Source: https://maplibre.org/maplibre-gl-js/docs/examples/change-building-color-based-on-zoom-level/

# Change building color based on zoom level

Use the interpolate expression to ease-in the building layer and smoothly fade from one color to the next.

```js
import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.mjs';

const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/bright',
    center: [-90.73414, 14.55524],
    zoom: 13
});

map.on('load', () => {
    map.setPaintProperty('building-top', 'fill-color', [
        'interpolate',
        ['exponential', 0.5],
        ['zoom'],
        15,
        '#e2714b',
        22,
        '#eee695'
    ]);

    map.setPaintProperty('building-top', 'fill-opacity', [
        'interpolate',
        ['exponential', 0.5],
        ['zoom'],
        15,
        0,
        22,
        1
    ]);
});

document.getElementById('zoom').addEventListener('click', () => {
    map.zoomTo(19, {duration: 9000});
});
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Change building color based on zoom level</title>
    <meta property="og:description" content="Use the interpolate expression to ease-in the building layer and smoothly fade from one color to the next." />
    <meta property="og:category" content="Expressions" />
    <meta property="og:order" content="2" />
    <meta property="og:created" content="2023-06-27" />
    <meta charset='utf-8'>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel='stylesheet' href='https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.css' />

    <style>
        body { margin: 0; padding: 0; }
        html, body, #map { height: 100%; }
    </style>
</head>
<body>
<style>
    #zoom {
        display: block;
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translate(-50%);
        width: 50%;
        height: 40px;
        padding: 10px;
        border: none;
        border-radius: 3px;
        font-size: 12px;
        text-align: center;
        color: #fff;
        background: #ee8a65;
    }
</style>
<div id="map"></div>
<button id="zoom">Zoom to buildings</button>
<script type="module">
    import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.mjs';

    const map = new maplibregl.Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/bright',
        center: [-90.73414, 14.55524],
        zoom: 13
    });

    map.on('load', () => {
        map.setPaintProperty('building-top', 'fill-color', [
            'interpolate',
            ['exponential', 0.5],
            ['zoom'],
            15,
            '#e2714b',
            22,
            '#eee695'
        ]);

        map.setPaintProperty('building-top', 'fill-opacity', [
            'interpolate',
            ['exponential', 0.5],
            ['zoom'],
            15,
            0,
            22,
            1
        ]);
    });

    document.getElementById('zoom').addEventListener('click', () => {
        map.zoomTo(19, {duration: 9000});
    });
</script>
</body>
</html>
```



---

Source: https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/

# v5 to v6 migration guide

MapLibre GL JS v6 ships as ES modules only. The UMD bundle, the separate CSP build, and the CommonJS (`require('maplibre-gl')`) entry from v5 are all gone. The bundle file is now `maplibre-gl.mjs` (and `maplibre-gl-worker.mjs`). If your build tooling or test runner still uses `require()` (plain Node scripts, test runners that don't transform ESM, server-side code importing the package without a bundler), this surfaces as `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## Imports

If you import maplibre-gl from npm with **named imports** (`import {Map} from 'maplibre-gl'`), your imports keep working: v6 resolves to the ESM bundle automatically.

If you used the **default import** (`import maplibregl from 'maplibre-gl'`), switch to either named imports or a namespace import:

```ts
// before
import maplibregl from 'maplibre-gl';

// after
import * as maplibregl from 'maplibre-gl';
// or pull in just what you need
import {Map, setWorkerUrl} from 'maplibre-gl';
```

## `<script>` tag

If you load maplibre-gl via `<script src>`, switch to a module script:

```html
<!-- before -->
<script src="https://unpkg.com/maplibre-gl@^5/dist/maplibre-gl.js"></script>

<!-- after -->
<script type="module">
    import * as maplibregl from 'https://unpkg.com/maplibre-gl@^6.0.0/dist/maplibre-gl.mjs';
</script>
```

Pin an explicit major version (e.g. ^6.0.0) rather than `@latest` or an unversioned specifier. Starting with v6, a page pinned to `@latest` goes to a blank gray screen with a 404 in the console.

## `setWorkerUrl()` is bundler-only

For direct browser ESM (loading from a CDN like unpkg via a `<script type="module">` tag), the worker URL is auto-detected from `import.meta.url` and laundered through a same-origin Blob URL when needed, so no [`setWorkerUrl()`](<https://maplibre.org/maplibre-gl-js/docs/API/functions/setWorkerUrl/index.md>) call is required.

For bundlers (Vite, webpack, esbuild, rspack, Rollup), `import.meta.url` doesn't reliably resolve to the worker file inside the bundler's module graph, so each consumer still needs a one-time `setWorkerUrl()` call. See [Installation](<https://maplibre.org/maplibre-gl-js/docs/#installation>) for per-bundler snippets.

## CSP directives

The dedicated CSP bundle from v5 is no longer needed.

If you load MapLibre from a CDN cross-origin to your page (e.g. unpkg), the worker is constructed from a same-origin Blob URL, so your CSP needs to allow `blob:` in `worker-src`:

```text
worker-src 'self' blob: ;
img-src data: blob: 'self' ;
```

If you self-host the worker file (any bundler setup), the worker URL is same-origin and `blob:` is not required:

```text
worker-src 'self' ;
img-src data: blob: 'self' ;
```

## zoomLevelsToOverscale

In version 5 there was an experimental parameter added to allow slicing vector tiles instead of overscaling them. We tested it, and it looks like it fixes a lot of issues in labeling etc. It changes rendering and the results of queryRenderedFeatures. If you would like to revert to the previous behavior you can set `zoomLevelsToOverscale: undefined` when initializing the map.

## Nested GeoJSON properties

Nested objects and arrays in GeoJSON feature properties are now preserved: features returned from events and `queryRenderedFeatures` contain them as real objects instead of JSON strings. If you called `JSON.parse` on such properties, remove it — it now throws `SyntaxError: "[object Object]" is not valid JSON`.

```diff
-const info = JSON.parse(e.features[0].properties.info);
+const info = e.features[0].properties.info;
```

## pragma mapbox

In case you were using `#pragma mapbox` in your shared code please replace it with `#pragma maplibre`.

```diff
-#pragma mapbox
+#pragma maplibre
```

## Events

All events are now classes, it is advised not to use `instanceof` but instead check the `type` field. Since the change was from types to classes this shouldn't be a problem in most code bases.

### styleimagemissing

In v6, `styleimagemissing` listeners can no longer resolve the current image request by calling `Map#addImage`. To migrate a listener that supplies missing images, replace it with [`Map#setMissingStyleImageResolver`](<https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#setmissingstyleimageresolver>):

```diff
-map.on('styleimagemissing', ({id}) => {
+map.setMissingStyleImageResolver((id) => {
     map.addImage(id, generateImage(id));
 });
```

The resolver can be synchronous or asynchronous. For asynchronous loading, call `Map#addImage` before the resolver's promise settles. The `styleimagemissing` event can still be used to observe images that remain unresolved.

## WebGL2 is now required

WebGL1 support has been removed; WebGL2 is now required. A browser or device that does not support WebGL2 will fail to render a map under v6. When WebGL2 is unavailable, the `Map` constructor throws a `GPUInitializationError` (check with `instanceof GPUInitializationError`, exported from `maplibre-gl`) instead of returning a map.

## `map.transform` was removed

The internal `map.transform` property has been removed; `Map` now composes a `Camera` rather than extending it. Use `Map`'s public API instead of reaching into `transform`. If you relied on something `transform` exposed that isn't covered by the public API, please open an issue or PR.



---

# MapLibre style spec excerpts: Layer properties, Fill-extrusion, Line

Source: https://maplibre.org/maplibre-style-spec/layers/

# Layers

A style's `layers` property lists all the layers available in that style. The type of layer is specified by the `type` property, and must be one of `background`, `fill`, `line`, `symbol`, `raster`, `circle`, `fill-extrusion`, `heatmap`, `hillshade`, `color-relief`.

Except for layers of the `background` type, each layer needs to refer to a source. Layers take the data that they get from a source, optionally filter features, and then define how those features are styled.

```json
"layers": [
    {
        "id": "coastline",
        "source": "maplibre",
        "source-layer": "countries",
        "type": "line",
        "paint": {"line-color": "#198EC8"}
    }
]
```

## Layer Properties

### id

*Required [string](<https://maplibre.org/maplibre-style-spec/types/#string>).*

Unique layer name.

### type

*Required [enum](<https://maplibre.org/maplibre-style-spec/types/#enum>). Possible values: `fill`, `line`, `symbol`, `circle`, `heatmap`, `fill-extrusion`, `raster`, `hillshade`, `color-relief`, `background`.*

Rendering type of this layer.

- `fill`: A filled polygon with an optional stroked border.
- `line`: A stroked line.
- `symbol`: An icon or a text label.
- `circle`: A filled circle.
- `heatmap`: A heatmap.
- `fill-extrusion`: An extruded (3D) polygon.
- `raster`: Raster map textures such as satellite imagery.
- `hillshade`: Client-side hillshading visualization based on DEM data. The implementation supports Mapbox Terrain RGB, Mapzen Terrarium tiles and custom encodings.
- `color-relief`: Client-side elevation coloring based on DEM data. The implementation supports Mapbox Terrain RGB, Mapzen Terrarium tiles and custom encodings.
- `background`: The background color or pattern of the map.

### metadata

*Optional.*

Arbitrary properties useful to track with the layer, but do not influence rendering. Properties should be prefixed to avoid collisions, like 'maplibre:'.

```json
"metadata": {"source:comment": "Hydrology FCCODE 460 - Narrow wash"}
```

### source

*Optional [string](<https://maplibre.org/maplibre-style-spec/types/#string>).*

Name of a source description to be used for this layer. Required for all layer types except `background`.

### source-layer

*Optional [string](<https://maplibre.org/maplibre-style-spec/types/#string>).*

Layer to use from a vector tile source. Required for vector tile sources; prohibited for all other source types, including GeoJSON sources.

### minzoom

*Optional [number](<https://maplibre.org/maplibre-style-spec/types/#number>) in range `[0, 24]`.*

The minimum zoom level for the layer. At zoom levels less than the minzoom, the layer will be hidden.

### maxzoom

*Optional [number](<https://maplibre.org/maplibre-style-spec/types/#number>) in range `[0, 24]`.*

The maximum zoom level for the layer. At zoom levels equal to or greater than the maxzoom, the layer will be hidden.

### filter

*Optional [filter](<https://maplibre.org/maplibre-style-spec/expressions/index.md>).*

A expression specifying conditions on source features. Only features that match the filter are displayed. Zoom expressions in filters are only evaluated at integer zoom levels. The `feature-state` expression is not supported in filter expressions.

### layout

*Optional [layout](<https://maplibre.org/maplibre-style-spec/layers/#layout>).*

Layout properties for the layer.

### paint

*Optional [paint](<https://maplibre.org/maplibre-style-spec/layers/#paint>).*

Default paint properties for this layer.

## Fill-extrusion

### visibility

*[Layout](<#layout>) property. Optional [enum](<https://maplibre.org/maplibre-style-spec/types/#enum>). Possible values: `visible`, `none`. Defaults to `"visible"`.*

Whether this layer is displayed.

- `visible`: The layer is shown.
- `none`: The layer is not shown.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.27.0 | 5.1.0 | 3.6.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.16.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### fill-extrusion-rounded-corner-distance

*[Layout](<#layout>) property. Optional [number](<https://maplibre.org/maplibre-style-spec/types/#number>) in range `[0, ∞)`. Units in meters. Defaults to `0`.*

The distance from each fill extrusion corner, measured along the adjacent edges, that is replaced by a rounded corner. A value of `0` disables rounded corners.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 6.2.0 | 13.4.0 | 6.28.0 |

### fill-extrusion-opacity

*[Paint](<#paint>) property. Optional [number](<https://maplibre.org/maplibre-style-spec/types/#number>) in range `[0, 1]`. Defaults to `1`. Supports [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions. [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

The opacity of the entire fill extrusion layer. This is rendered on a per-layer, not per-feature, basis, and data-driven styling is not available.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.27.0 | 5.1.0 | 3.6.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### fill-extrusion-color

*[Paint](<#paint>) property. Optional [color](<https://maplibre.org/maplibre-style-spec/types/#color>). Defaults to `"#000000"`. Disabled by [`fill-extrusion-pattern`](<#fill-extrusion-pattern>). Supports [feature-state](<https://maplibre.org/maplibre-style-spec/expressions/#feature-state>) and [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions. [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

The base color of the extruded fill. The extrusion's surfaces will be shaded differently based on this color in combination with the root `light` settings. If this color is specified as `rgba` with an alpha component, the alpha component will be ignored; use `fill-extrusion-opacity` to set layer opacity.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.27.0 | 5.1.0 | 3.6.0 |
| data-driven styling | 0.27.0 | 5.1.0 | 3.6.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### fill-extrusion-translate

*[Paint](<#paint>) property. Optional [array](<https://maplibre.org/maplibre-style-spec/types/#array>). Units in pixels. Defaults to `[0,0]`. Supports [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions. [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

The geometry's offset. Values are `[x, y]` where negatives indicate left and up (on the flat plane), respectively.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.27.0 | 5.1.0 | 3.6.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### fill-extrusion-translate-anchor

*[Paint](<#paint>) property. Optional [enum](<https://maplibre.org/maplibre-style-spec/types/#enum>). Possible values: `map`, `viewport`. Defaults to `"map"`. Requires [`fill-extrusion-translate`](<#fill-extrusion-translate>).*

Controls the frame of reference for `fill-extrusion-translate`.

- `map`: The fill extrusion is translated relative to the map.
- `viewport`: The fill extrusion is translated relative to the viewport.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.27.0 | 5.1.0 | 3.6.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### fill-extrusion-pattern

*[Paint](<#paint>) property. Optional [resolvedImage](<https://maplibre.org/maplibre-style-spec/types/#resolvedimage>). [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

Name of image in sprite to use for drawing images on extruded fills. For seamless patterns, image width and height must be a factor of two (2, 4, 8, ..., 512). Note that zoom-dependent expressions will be evaluated only at integer zoom levels.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.27.0 | 5.1.0 | 3.6.0 |
| data-driven styling | 0.49.0 | 6.5.0 | 4.4.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### fill-extrusion-height

*[Paint](<#paint>) property. Optional [number](<https://maplibre.org/maplibre-style-spec/types/#number>). Units in meters. Defaults to `0`. Supports [feature-state](<https://maplibre.org/maplibre-style-spec/expressions/#feature-state>) and [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions. [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

The height with which to extrude this layer. Negative values extrude below ground level, so a floor that is entirely underground can be expressed.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.27.0 | 5.1.0 | 3.6.0 |
| data-driven styling | 0.27.0 | 5.1.0 | 3.6.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |
| negative values | ❌ ([\#8051](<https://github.com/maplibre/maplibre-gl-js/issues/8051>)) | ❌ ([\#4455](<https://github.com/maplibre/maplibre-native/issues/4455>)) | ❌ ([\#4455](<https://github.com/maplibre/maplibre-native/issues/4455>)) |

### fill-extrusion-base

*[Paint](<#paint>) property. Optional [number](<https://maplibre.org/maplibre-style-spec/types/#number>). Units in meters. Defaults to `0`. Requires [`fill-extrusion-height`](<#fill-extrusion-height>). Supports [feature-state](<https://maplibre.org/maplibre-style-spec/expressions/#feature-state>) and [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions. [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

The height with which to extrude the base of this layer. Must be less than or equal to `fill-extrusion-height`. Negative values extrude below ground level, e.g. underground floors.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.27.0 | 5.1.0 | 3.6.0 |
| data-driven styling | 0.27.0 | 5.1.0 | 3.6.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |
| negative values | ❌ ([\#8051](<https://github.com/maplibre/maplibre-gl-js/issues/8051>)) | ❌ ([\#4455](<https://github.com/maplibre/maplibre-native/issues/4455>)) | ❌ ([\#4455](<https://github.com/maplibre/maplibre-native/issues/4455>)) |

### fill-extrusion-vertical-gradient

*[Paint](<#paint>) property. Optional [boolean](<https://maplibre.org/maplibre-style-spec/types/#boolean>). Defaults to `true`.*

Whether to apply a vertical gradient to the sides of a fill-extrusion layer. If true, sides will be shaded slightly darker farther down.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.50.0 | 7.0.0 | 4.7.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

## Line

### line-cap

*[Layout](<#layout>) property. Optional [enum](<https://maplibre.org/maplibre-style-spec/types/#enum>). Possible values: `butt`, `round`, `square`. Defaults to `"butt"`.*

The display of line endings.

- `butt`: A cap with a squared-off end which is drawn to the exact endpoint of the line.
- `round`: A cap with a rounded end which is drawn beyond the endpoint of the line at a radius of one-half of the line's width and centered on the endpoint of the line.
- `square`: A cap with a squared-off end which is drawn beyond the endpoint of the line at a distance of one-half of the line's width.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.10.0 | 2.0.1 | 2.0.0 |
| data-driven styling | 5.22.0 | ❌ ([\#4194](<https://github.com/maplibre/maplibre-native/issues/4194>)) | ❌ ([\#4194](<https://github.com/maplibre/maplibre-native/issues/4194>)) |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.7.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-join

*[Layout](<#layout>) property. Optional [enum](<https://maplibre.org/maplibre-style-spec/types/#enum>). Possible values: `bevel`, `round`, `miter`. Defaults to `"miter"`.*

The display of lines when joining.

- `bevel`: A join with a squared-off end which is drawn beyond the endpoint of the line at a distance of one-half of the line's width.
- `round`: A join with a rounded end which is drawn beyond the endpoint of the line at a radius of one-half of the line's width and centered on the endpoint of the line.
- `miter`: A join with a sharp, angled corner which is drawn with the outer sides beyond the endpoint of the path until they meet.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.10.0 | 2.0.1 | 2.0.0 |
| data-driven styling | 0.40.0 | 5.2.0 | 3.7.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.7.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-miter-limit

*[Layout](<#layout>) property. Optional [number](<https://maplibre.org/maplibre-style-spec/types/#number>). Defaults to `2`. Requires `line-join` to be `miter`. Supports [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions.*

Used to automatically convert miter joins to bevel joins for sharp angles.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.10.0 | 2.0.1 | 2.0.0 |
| data-driven styling | 5.22.0 | ❌ ([\#4194](<https://github.com/maplibre/maplibre-native/issues/4194>)) | ❌ ([\#4194](<https://github.com/maplibre/maplibre-native/issues/4194>)) |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.7.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-round-limit

*[Layout](<#layout>) property. Optional [number](<https://maplibre.org/maplibre-style-spec/types/#number>). Defaults to `1.05`. Requires `line-join` to be `round`. Supports [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions.*

Used to automatically convert round joins to miter joins for shallow angles.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.10.0 | 2.0.1 | 2.0.0 |
| data-driven styling | 5.22.0 | ❌ ([\#4194](<https://github.com/maplibre/maplibre-native/issues/4194>)) | ❌ ([\#4194](<https://github.com/maplibre/maplibre-native/issues/4194>)) |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.7.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-sort-key

*[Layout](<#layout>) property. Optional [number](<https://maplibre.org/maplibre-style-spec/types/#number>).*

Sorts features in ascending order based on this value. Features with a higher sort key will appear above features with a lower sort key.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 1.2.0 | 9.1.0 | 5.8.0 |
| data-driven styling | 1.2.0 | 9.1.0 | 5.8.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.7.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### visibility

*[Layout](<#layout>) property. Optional [enum](<https://maplibre.org/maplibre-style-spec/types/#enum>). Possible values: `visible`, `none`. Defaults to `"visible"`.*

Whether this layer is displayed.

- `visible`: The layer is shown.
- `none`: The layer is not shown.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.10.0 | 2.0.1 | 2.0.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.16.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-opacity

*[Paint](<#paint>) property. Optional [number](<https://maplibre.org/maplibre-style-spec/types/#number>) in range `[0, 1]`. Defaults to `1`. Supports [feature-state](<https://maplibre.org/maplibre-style-spec/expressions/#feature-state>) and [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions. [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

The opacity at which the line will be drawn.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.10.0 | 2.0.1 | 2.0.0 |
| data-driven styling | 0.29.0 | 5.0.0 | 3.5.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-layer-opacity

*[Paint](<#paint>) property. Optional [number](<https://maplibre.org/maplibre-style-spec/types/#number>) in range `[0, 1]`. Defaults to `1`. Supports [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions. [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

Opacity applied to the layer as a whole. Unlike `line-opacity` and alpha values in `line-color`, which are applied per feature and accumulate where lines overlap, `line-layer-opacity` is applied once so overlapping lines appear as a single surface at the given opacity. When both `line-opacity` and `line-layer-opacity` are set, the per-feature, overlap accumulation is preserved, then layer-opacity composites the result. This property affects only the layer it is set on and cannot be used to composite multiple layers together or control how this layer blends with layers above or below it.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 6.0.0 | ❌ ([\#4298](<https://github.com/maplibre/maplibre-native/issues/4298>)) | ❌ ([\#4298](<https://github.com/maplibre/maplibre-native/issues/4298>)) |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 6.0.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-color

*[Paint](<#paint>) property. Optional [color](<https://maplibre.org/maplibre-style-spec/types/#color>). Defaults to `"#000000"`. Disabled by [`line-pattern`](<#line-pattern>). Supports [feature-state](<https://maplibre.org/maplibre-style-spec/expressions/#feature-state>) and [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions. [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

The color with which the line will be drawn.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.10.0 | 2.0.1 | 2.0.0 |
| data-driven styling | 0.23.0 | 5.0.0 | 3.5.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-translate

*[Paint](<#paint>) property. Optional [array](<https://maplibre.org/maplibre-style-spec/types/#array>). Units in pixels. Defaults to `[0,0]`. Supports [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions. [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

The geometry's offset. Values are `[x, y]` where negatives indicate left and up, respectively.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.10.0 | 2.0.1 | 2.0.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-translate-anchor

*[Paint](<#paint>) property. Optional [enum](<https://maplibre.org/maplibre-style-spec/types/#enum>). Possible values: `map`, `viewport`. Defaults to `"map"`. Requires [`line-translate`](<#line-translate>).*

Controls the frame of reference for `line-translate`.

- `map`: The line is translated relative to the map.
- `viewport`: The line is translated relative to the viewport.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.10.0 | 2.0.1 | 2.0.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-width

*[Paint](<#paint>) property. Optional [number](<https://maplibre.org/maplibre-style-spec/types/#number>) in range `[0, ∞)`. Units in pixels. Defaults to `1`. Supports [feature-state](<https://maplibre.org/maplibre-style-spec/expressions/#feature-state>) and [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions. [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

Stroke thickness.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.10.0 | 2.0.1 | 2.0.0 |
| data-driven styling | 0.39.0 | 5.2.0 | 3.7.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-gap-width

*[Paint](<#paint>) property. Optional [number](<https://maplibre.org/maplibre-style-spec/types/#number>) in range `[0, ∞)`. Units in pixels. Defaults to `0`. Supports [feature-state](<https://maplibre.org/maplibre-style-spec/expressions/#feature-state>) and [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions. [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

Draws a line casing outside of a line's actual path. Value indicates the width of the inner gap.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.10.0 | 2.0.1 | 2.0.0 |
| data-driven styling | 0.29.0 | 5.0.0 | 3.5.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-offset

*[Paint](<#paint>) property. Optional [number](<https://maplibre.org/maplibre-style-spec/types/#number>). Units in pixels. Defaults to `0`. Supports [feature-state](<https://maplibre.org/maplibre-style-spec/expressions/#feature-state>) and [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions. [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

The line's offset. For linear features, a positive value offsets the line to the right, relative to the direction of the line, and a negative value to the left. For polygon features, a positive value results in an inset, and a negative value results in an outset.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.12.1 | 3.0.0 | 3.1.0 |
| data-driven styling | 0.29.0 | 5.0.0 | 3.5.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-blur

*[Paint](<#paint>) property. Optional [number](<https://maplibre.org/maplibre-style-spec/types/#number>) in range `[0, ∞)`. Units in pixels. Defaults to `0`. Supports [feature-state](<https://maplibre.org/maplibre-style-spec/expressions/#feature-state>) and [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions. [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

Blur applied to the line, in pixels.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.10.0 | 2.0.1 | 2.0.0 |
| data-driven styling | 0.29.0 | 5.0.0 | 3.5.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-dasharray

*[Paint](<#paint>) property. Optional [array](<https://maplibre.org/maplibre-style-spec/types/#array>) in range `[0, ∞)`. Units in line widths. Disabled by [`line-pattern`](<#line-pattern>). [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

Specifies the lengths of the alternating dashes and gaps that form the dash pattern. The lengths are later scaled by the line width. To convert a dash length to pixels, multiply the length by the current line width. GeoJSON sources with `lineMetrics: true` specified won't render dashed lines to the expected scale. Zoom-dependent expressions will be evaluated only at integer zoom levels. The only way to create an array value is using `["literal", [...]]`; arrays cannot be read from or derived from feature properties.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.10.0 | 2.0.1 | 2.0.0 |
| data-driven styling | 5.8.0 | ❌ ([\#744](<https://github.com/maplibre/maplibre-native/issues/744>)) | ❌ ([\#744](<https://github.com/maplibre/maplibre-native/issues/744>)) |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-pattern

*[Paint](<#paint>) property. Optional [resolvedImage](<https://maplibre.org/maplibre-style-spec/types/#resolvedimage>). [Transitionable](<https://maplibre.org/maplibre-style-spec/transition/index.md>).*

Name of image in sprite to use for drawing image lines. For seamless patterns, image width must be a factor of two (2, 4, 8, ..., 512). Note that zoom-dependent expressions will be evaluated only at integer zoom levels.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.10.0 | 2.0.1 | 2.0.0 |
| data-driven styling | 0.49.0 | 6.5.0 | 4.4.0 |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |

### line-gradient

*[Paint](<#paint>) property. Optional [color](<https://maplibre.org/maplibre-style-spec/types/#color>). Disabled by [`line-dasharray`](<#line-dasharray>). Disabled by [`line-pattern`](<#line-pattern>). Requires source to be [`geojson`](<https://maplibre.org/maplibre-style-spec/sources/#geojson>). Supports [interpolate](<https://maplibre.org/maplibre-style-spec/expressions/#interpolate>) expressions.*

Defines a gradient with which to color a line feature. Can only be used with GeoJSON sources that specify `"lineMetrics": true`.

| SDK Support | MapLibre GL JS | MapLibre Native<br>Android | MapLibre Native<br>iOS |
| --- | --- | --- | --- |
| basic functionality | 0.45.0 | 6.5.0 | 4.4.0 |
| data-driven styling | Not supported yet | Not supported yet | Not supported yet |
| [`global-state`](<https://maplibre.org/maplibre-style-spec/expressions/#global-state>) expression | 5.6.0 | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) | ❌ ([\#3302](<https://github.com/maplibre/maplibre-native/issues/3302>)) |



---

# MapLibre Map class excerpts (selected methods)

Source: https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/

# Map

Defined in: [ui/map.ts:601](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L601>)

The `Map` object represents the map on your page. It exposes methods and properties that enable you to programmatically change the map, and fires events as users interact with it.

You create a `Map` by specifying a `container` and other options, see [MapOptions](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/index.md>) for the full list. Then MapLibre GL JS initializes the map on the page and returns your `Map` object.

## Example

```ts
const map = new Map({
  container: 'map',
  center: [-122.420679, 37.772537],
  zoom: 13,
  style: style_object,
  hash: true,
  transformRequest: (url, resourceType) => {
    if (resourceType === 'Source' && url.startsWith('http://myHost')) {
      return {
       url: url.replace('http', 'https'),
       headers: { 'my-custom-header': true},
       credentials: 'include', // Include cookies for cross-origin requests
     }
    }
  }
});
```

## See
### off()

#### Call Signature

> **off**\<`T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\>(`type`: `T`, `layer`: `string`, `listener`: (`ev`: [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void`): `this`

Defined in: [ui/map.ts:2473](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2473>)

Removes an event listener for events previously added with `{@link Map.on}`.

##### Type Parameters

| Type Parameter |
| --- |
| `T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>) |

##### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | `T` | The event type previously used to install the listener. |
| `layer` | `string` | The layer ID or listener previously used to install the listener. |
| `listener` | (`ev`: [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void` | The function previously installed as a listener. |

##### Returns

`this`

##### Overrides

[`Evented`](<https://maplibre.org/maplibre-gl-js/docs/API/classes/Evented/index.md>).[`off`](<https://maplibre.org/maplibre-gl-js/docs/API/classes/Evented/#off>)

#### Call Signature

> **off**\<`T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\>(`type`: `T`, `layers`: `string`\[\], `listener`: (`ev`: [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void`): `this`

Defined in: [ui/map.ts:2486](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2486>)

Overload of the `off` method that allows to remove an event created with multiple layers. Provide the same layer IDs as to `on` or `once`, when the listener was registered.

##### Type Parameters

| Type Parameter |
| --- |
| `T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>) |

##### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | `T` | The type of the event. |
| `layers` | `string`\[\] | The layer IDs previously used to install the listener. |
| `listener` | (`ev`: [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void` | The function previously installed as a listener. |

##### Returns

`this`

##### Overrides

`Evented.off`

#### Call Signature

> **off**\<`T` *extends* keyof [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>)\>(`type`: `T`, `listener`: (`ev`: [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void`): `this`

Defined in: [ui/map.ts:2497](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2497>)

Overload of the `off` method that allows to remove an event created without specifying a layer.

##### Type Parameters

| Type Parameter |
| --- |
| `T` *extends* keyof [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>) |

##### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | `T` | The type of the event. |
| `listener` | (`ev`: [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void` | The function previously installed as a listener. |

##### Returns

`this`

##### Overrides

`Evented.off`

#### Call Signature

> **off**(`type`: keyof [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>), `listener`: [`Listener`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/Listener/index.md>)): `this`

Defined in: [ui/map.ts:2504](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2504>)

Overload of the `off` method that allows to remove an event created without specifying a layer.

##### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | keyof [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>) | The type of the event. |
| `listener` | [`Listener`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/Listener/index.md>) | The function previously installed as a listener. |

##### Returns

`this`

##### Overrides

`Evented.off`

---

### on()

#### Call Signature

> **on**\<`T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\>(`type`: `T`, `layer`: `string`, `listener`: (`ev`: [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void`): [`Subscription`](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/Subscription/index.md>)

Defined in: [ui/map.ts:2325](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2325>)

Adds a listener for events of a specified type, optionally limited to features in a specified style layer(s). See [MapEventType](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>) and [MapLayerEventType](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>) for a full list of events and their description.

| Event | Compatible with `layerId` |
| --- | --- |
| `mousedown` | yes |
| `mouseup` | yes |
| `mouseover` | yes |
| `mouseout` | yes |
| `mousemove` | yes |
| `mouseenter` | yes (required) |
| `mouseleave` | yes (required) |
| `click` | yes |
| `dblclick` | yes |
| `contextmenu` | yes |
| `touchstart` | yes |
| `touchend` | yes |
| `touchcancel` | yes |
| `wheel` |  |
| `resize` |  |
| `remove` |  |
| `touchmove` |  |
| `movestart` |  |
| `move` |  |
| `moveend` |  |
| `dragstart` |  |
| `drag` |  |
| `dragend` |  |
| `zoomstart` |  |
| `zoom` |  |
| `zoomend` |  |
| `rotatestart` |  |
| `rotate` |  |
| `rotateend` |  |
| `pitchstart` |  |
| `pitch` |  |
| `pitchend` |  |
| `boxzoomstart` |  |
| `boxzoomend` |  |
| `boxzoomcancel` |  |
| `webglcontextlost` |  |
| `webglcontextrestored` |  |
| `load` |  |
| `render` |  |
| `idle` |  |
| `error` |  |
| `data` |  |
| `styledata` |  |
| `sourcedata` |  |
| `dataloading` |  |
| `styledataloading` |  |
| `sourcedataloading` |  |
| `styleimagemissing` |  |
| `dataabort` |  |
| `sourcedataabort` |  |

##### Type Parameters

| Type Parameter |
| --- |
| `T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>) |

##### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | `T` | The event type to listen for. Events compatible with the optional `layerId` parameter are triggered when the cursor enters a visible portion of the specified layer from outside that layer or outside the map canvas. |
| `layer` | `string` | The ID of a style layer or a listener if no ID is provided. Event will only be triggered if its location is within a visible feature in this layer. The event will have a `features` property containing an array of the matching features. If `layer` is not supplied, the event will not have a `features` property. Please note that many event types are not compatible with the optional `layer` parameter. |
| `listener` | (`ev`: [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void` | The function to be called when the event is fired. |

##### Returns

[`Subscription`](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/Subscription/index.md>)

##### Examples

```ts
// Set an event listener that will fire
// when the map has finished loading
map.on('load', () => {
  // Once the map has finished loading,
  // add a new layer
  map.addLayer({
    id: 'points-of-interest',
    source: {
      type: 'vector',
      url: 'https://maplibre.org/maplibre-style-spec/'
    },
    'source-layer': 'poi_label',
    type: 'circle',
    paint: {
      // MapLibre Style Specification paint properties
    },
    layout: {
      // MapLibre Style Specification layout properties
    }
  });
});
```

```ts
// Set an event listener that will fire
// when a feature on the countries layer of the map is clicked
map.on('click', 'countries', (e) => {
  new Popup()
    .setLngLat(e.lngLat)
    .setText(`Country name: ${e.features[0].properties.name}`)
    .addTo(map);
});
```

##### See

- [Display popup on click](<https://maplibre.org/maplibre-gl-js/docs/examples/display-a-popup-on-click/>)
- [Center the map on a clicked symbol](<https://maplibre.org/maplibre-gl-js/docs/examples/center-the-map-on-a-clicked-symbol/>)
- [Create a hover effect](<https://maplibre.org/maplibre-gl-js/docs/examples/create-a-hover-effect/>)
- [Create a draggable marker](<https://maplibre.org/maplibre-gl-js/docs/examples/create-a-draggable-point/>)

##### Overrides

[`Evented`](<https://maplibre.org/maplibre-gl-js/docs/API/classes/Evented/index.md>).[`on`](<https://maplibre.org/maplibre-gl-js/docs/API/classes/Evented/#on>)

#### Call Signature

> **on**\<`T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\>(`type`: `T`, `layerIds`: `string`\[\], `listener`: (`ev`: [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void`): [`Subscription`](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/Subscription/index.md>)

Defined in: [ui/map.ts:2337](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2337>)

Overload of the `on` method that allows to listen to events specifying multiple layers.

##### Type Parameters

| Type Parameter |
| --- |
| `T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>) |

##### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | `T` | The type of the event. |
| `layerIds` | `string`\[\] | The array of style layer IDs. |
| `listener` | (`ev`: [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void` | The listener callback. |

##### Returns

[`Subscription`](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/Subscription/index.md>)

##### Overrides

`Evented.on`

#### Call Signature

> **on**\<`T` *extends* keyof [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>)\>(`type`: `T`, `listener`: (`ev`: [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void`): [`Subscription`](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/Subscription/index.md>)

Defined in: [ui/map.ts:2348](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2348>)

Overload of the `on` method that allows to listen to events without specifying a layer.

##### Type Parameters

| Type Parameter |
| --- |
| `T` *extends* keyof [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>) |

##### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | `T` | The type of the event. |
| `listener` | (`ev`: [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void` | The listener callback. |

##### Returns

[`Subscription`](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/Subscription/index.md>)

##### Overrides

`Evented.on`

#### Call Signature

> **on**(`type`: keyof [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>), `listener`: [`Listener`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/Listener/index.md>)): [`Subscription`](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/Subscription/index.md>)

Defined in: [ui/map.ts:2355](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2355>)

Overload of the `on` method that allows to listen to events without specifying a layer.

##### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | keyof [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>) | The type of the event. |
| `listener` | [`Listener`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/Listener/index.md>) | The listener callback. |

##### Returns

[`Subscription`](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/Subscription/index.md>)

##### Overrides

`Evented.on`

---

### once()

#### Call Signature

> **once**\<`T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\>(`type`: `T`, `layer`: `string`, `listener`: (`ev`: [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void`): `this`

Defined in: [ui/map.ts:2389](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2389>)

Adds a listener that will be called only once to a specified event type, optionally limited to features in a specified style layer.

##### Type Parameters

| Type Parameter |
| --- |
| `T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>) |

##### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | `T` | The event type to listen for; one of `'mousedown'`, `'mouseup'`, `'click'`, `'dblclick'`, `'mousemove'`, `'mouseenter'`, `'mouseleave'`, `'mouseover'`, `'mouseout'`, `'contextmenu'`, `'touchstart'`, `'touchend'`, or `'touchcancel'`. `mouseenter` and `mouseover` events are triggered when the cursor enters a visible portion of the specified layer from outside that layer or outside the map canvas. `mouseleave` and `mouseout` events are triggered when the cursor leaves a visible portion of the specified layer, or leaves the map canvas. |
| `layer` | `string` | The ID of a style layer or a listener if no ID is provided. Only events whose location is within a visible feature in this layer will trigger the listener. The event will have a `features` property containing an array of the matching features. |
| `listener` | (`ev`: [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void` | The function to be called when the event is fired. |

##### Returns

`this`

`this` if listener is provided, promise otherwise to allow easier usage of async/await

##### Overrides

[`Evented`](<https://maplibre.org/maplibre-gl-js/docs/API/classes/Evented/index.md>).[`once`](<https://maplibre.org/maplibre-gl-js/docs/API/classes/Evented/#once>)

#### Call Signature

> **once**\<`T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\>(`type`: `T`, `layer`: `string`): `Promise`\<[`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`\>

Defined in: [ui/map.ts:2401](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2401>)

Overload of the `once` method that, with a single layer and no listener, returns a promise resolving with the event for easier usage of async/await.

##### Type Parameters

| Type Parameter |
| --- |
| `T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>) |

##### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | `T` | The type of the event. |
| `layer` | `string` | The ID of the style layer. |

##### Returns

`Promise`\<[`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`\>

##### Overrides

[`Evented`](<https://maplibre.org/maplibre-gl-js/docs/API/classes/Evented/index.md>).[`once`](<https://maplibre.org/maplibre-gl-js/docs/API/classes/Evented/#once>)

#### Call Signature

> **once**\<`T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\>(`type`: `T`, `layerIds`: `string`\[\], `listener`: (`ev`: [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void`): `this`

Defined in: [ui/map.ts:2412](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2412>)

Overload of the `once` method that allows to listen to events specifying multiple layers.

##### Type Parameters

| Type Parameter |
| --- |
| `T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>) |

##### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | `T` | The type of the event. |
| `layerIds` | `string`\[\] | The array of style layer IDs. |
| `listener` | (`ev`: [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void` | The listener callback. |

##### Returns

`this`

##### Overrides

`Evented.once`

#### Call Signature

> **once**\<`T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\>(`type`: `T`, `layerIds`: `string`\[\]): `Promise`\<[`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`\>

Defined in: [ui/map.ts:2424](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2424>)

Overload of the `once` method that, with multiple layers and no listener, returns a promise resolving with the event for easier usage of async/await.

##### Type Parameters

| Type Parameter |
| --- |
| `T` *extends* keyof [`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>) |

##### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | `T` | The type of the event. |
| `layerIds` | `string`\[\] | The array of style layer IDs. |

##### Returns

`Promise`\<[`MapLayerEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapLayerEventType/index.md>)\[`T`\] &amp; `Object`\>

##### Overrides

`Evented.once`

#### Call Signature

> **once**\<`T` *extends* keyof [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>)\>(`type`: `T`, `listener`: (`ev`: [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void`): `this`

Defined in: [ui/map.ts:2434](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2434>)

Overload of the `once` method that allows to listen to events without specifying a layer.

##### Type Parameters

| Type Parameter |
| --- |
| `T` *extends* keyof [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>) |

##### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | `T` | The type of the event. |
| `listener` | (`ev`: [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>)\[`T`\] &amp; `Object`) =\> `void` | The listener callback. |

##### Returns

`this`

##### Overrides

`Evented.once`

#### Call Signature

> **once**\<`T` *extends* keyof [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>)\>(`type`: `T`): `Promise`\<[`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>)\[`T`\] &amp; `Object`\>

Defined in: [ui/map.ts:2441](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2441>)

Overload of the `once` method that returns a promise resolving with the event, for easier usage of async/await, when no listener is provided.

##### Type Parameters

| Type Parameter |
| --- |
| `T` *extends* keyof [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>) |

##### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | `T` | The type of the event. |

##### Returns

`Promise`\<[`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>)\[`T`\] &amp; `Object`\>

##### Overrides

`Evented.once`

#### Call Signature

> **once**(`type`: keyof [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>), `listener?`: [`Listener`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/Listener/index.md>)): `Promise`\<`any`\> | `Map`

Defined in: [ui/map.ts:2448](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2448>)

Overload of the `once` method that allows to listen to events without specifying a layer.

##### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `type` | keyof [`MapEventType`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapEventType/index.md>) | The type of the event. |
| `listener?` | [`Listener`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/Listener/index.md>) | The listener callback. |

##### Returns

`Promise`\<`any`\> | `Map`

##### Overrides

`Evented.once`

### addControl()

> **addControl**(`control`: [`IControl`](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/IControl/index.md>), `position?`: [`ControlPosition`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/ControlPosition/index.md>)): `this`

Defined in: [ui/map.ts:949](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L949>)

Adds an [IControl](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/IControl/index.md>) to the map, calling `control.onAdd(this)`.

An [ErrorEvent](<https://maplibre.org/maplibre-gl-js/docs/API/classes/ErrorEvent/index.md>) will be fired if the control is invalid.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `control` | [`IControl`](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/IControl/index.md>) | The [IControl](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/IControl/index.md>) to add. |
| `position?` | [`ControlPosition`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/ControlPosition/index.md>) | position on the map to which the control will be added. Valid values are `'top-left'`, `'top-right'`, `'bottom-left'`, and `'bottom-right'`. Defaults to `'top-right'`. |

#### Returns

`this`

#### Example

Add zoom and rotation controls to the map.

```ts
map.addControl(new NavigationControl());
```

#### See

[Display map navigation controls](<https://maplibre.org/maplibre-gl-js/docs/examples/display-map-navigation-controls/>)

---

### addLayer()

> **addLayer**(`layer`: [`AddLayerObject`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/AddLayerObject/index.md>), `beforeId?`: `string`): `this`

Defined in: [ui/map.ts:3529](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L3529>)

Adds a [MapLibre style layer](<https://maplibre.org/maplibre-style-spec/layers>) to the map's style.

A layer defines how data from a specified source will be styled. Read more about layer types and available paint and layout properties in the [MapLibre Style Specification](<https://maplibre.org/maplibre-style-spec/layers>).

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `layer` | [`AddLayerObject`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/AddLayerObject/index.md>) | The layer to add, conforming to either the MapLibre Style Specification's [layer definition](<https://maplibre.org/maplibre-style-spec/layers>) or, less commonly, the [CustomLayerInterface](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/index.md>) specification. Can also be a layer definition with an embedded source definition. The MapLibre Style Specification's layer definition is appropriate for most layers. |
| `beforeId?` | `string` | The ID of an existing layer to insert the new layer before, resulting in the new layer appearing visually beneath the existing layer. If this argument is not specified, the layer will be appended to the end of the layers array and appear visually above all other layers. |

#### Returns

`this`

#### Examples

Add a circle layer with a vector source

```ts
map.addLayer({
  id: 'points-of-interest',
  source: {
    type: 'vector',
    url: 'https://demotiles.maplibre.org/tiles/tiles.json'
  },
  'source-layer': 'poi_label',
  type: 'circle',
  paint: {
    // MapLibre Style Specification paint properties
  },
  layout: {
    // MapLibre Style Specification layout properties
  }
});
```

Define a source before using it to create a new layer

```ts
map.addSource('state-data', {
  type: 'geojson',
  data: 'path/to/data.geojson'
});

map.addLayer({
  id: 'states',
  // References the GeoJSON source defined above
  // and does not require a `source-layer`
  source: 'state-data',
  type: 'symbol',
  layout: {
    // Set the label content to the
    // feature's `name` property
    text-field: ['get', 'name']
  }
});
```

Add a new symbol layer before an existing layer

```ts
map.addLayer({
  id: 'states',
  // References a source that's already been defined
  source: 'state-data',
  type: 'symbol',
  layout: {
    // Set the label content to the
    // feature's `name` property
    text-field: ['get', 'name']
  }
// Add the layer before the existing `cities` layer
}, 'cities');
```

#### See

- [Create and style clusters](<https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/>)
- [Add a vector tile source](<https://maplibre.org/maplibre-gl-js/docs/examples/add-a-vector-tile-source/>)
- [Add a WMS source](<https://maplibre.org/maplibre-gl-js/docs/examples/add-a-wms-source/>)

---

### addSource()

> **addSource**(`id`: `string`, `source`: [`SourceSpecification`](<https://maplibre.org/maplibre-style-spec/sources/>) | [`CanvasSourceSpecification`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CanvasSourceSpecification/index.md>)): `this`

Defined in: [ui/map.ts:2939](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2939>)

Adds a source to the map's style.

Events triggered:

Triggers the `source.add` event.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | `string` | The ID of the source to add. Must not conflict with existing sources. |
| `source` | [`SourceSpecification`](<https://maplibre.org/maplibre-style-spec/sources/>) \| [`CanvasSourceSpecification`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CanvasSourceSpecification/index.md>) | The source object, conforming to the MapLibre Style Specification's [source definition](<https://maplibre.org/maplibre-style-spec/sources>) or [CanvasSourceSpecification](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CanvasSourceSpecification/index.md>). |

#### Returns

`this`

#### Examples

```ts
map.addSource('my-data', {
  type: 'vector',
  url: 'https://demotiles.maplibre.org/tiles/tiles.json'
});
```

```ts
map.addSource('my-data', {
  "type": "geojson",
  "data": {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [-77.0396, 38.8891]
    },
    "properties": {
      "title": "Washington DC",
      "marker-symbol": "monument"
    }
  }
});
```

#### See

GeoJSON source: [Add live realtime data](<https://maplibre.org/maplibre-gl-js/docs/examples/add-live-realtime-data/>)

---

### easeTo()

> **easeTo**(`options`: [`EaseToOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/EaseToOptions/index.md>), `eventData?`: `any`): `this`

Defined in: [ui/map.ts:1492](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L1492>)

Changes any combination of `center`, `zoom`, `bearing`, `pitch`, `roll`, and `padding` with an animated transition between old and new values. The map will retain its current values for any details not specified in `options`.

> [!NOTE]
>
> **Reduced Motion**
>
> The transition will happen instantly if the user has enabled the `reduced motion` accessibility feature enabled in their operating system, unless `options` includes `essential: true`.

Triggers the following events: `movestart`, `move`, `moveend`, `zoomstart`, `zoom`, `zoomend`, `pitchstart`, `pitch`, `pitchend`, `rollstart`, `roll`, `rollend`, and `rotate`.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `options` | [`EaseToOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/EaseToOptions/index.md>) | Options describing the destination and animation of the transition. Accepts [CameraOptions](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CameraOptions/index.md>) and [AnimationOptions](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/AnimationOptions/index.md>). |
| `eventData?` | `any` | Additional properties to be added to event objects of events triggered by this method. |

#### Returns

`this`

#### See

[Navigate the map with game-like controls](<https://maplibre.org/maplibre-gl-js/docs/examples/navigate-the-map-with-game-like-controls/>)

---

### fitBounds()

> **fitBounds**(`bounds`: [`LngLatBoundsLike`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/LngLatBoundsLike/index.md>), `options?`: [`FitBoundsOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FitBoundsOptions/index.md>), `eventData?`: `any`): `this`

Defined in: [ui/map.ts:1383](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L1383>)

Pans and zooms the map to contain its visible area within the specified geographical bounds. This function will also reset the map's bearing to 0 if bearing is nonzero.

Triggers the following events: `movestart` and `moveend`.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `bounds` | [`LngLatBoundsLike`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/LngLatBoundsLike/index.md>) | Center these bounds in the viewport and use the highest zoom level up to and including [Map.getMaxZoom](<#getmaxzoom>) that fits them in the viewport. Bounds will be taken in `[sw, ne]` order. Southwest point will always be to the left of the northeast point. |
| `options?` | [`FitBoundsOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FitBoundsOptions/index.md>) | Options supports all properties from [AnimationOptions](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/AnimationOptions/index.md>) and [CameraOptions](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CameraOptions/index.md>) in addition to the fields below. |
| `eventData?` | `any` | Additional properties to be added to event objects of events triggered by this method. |

#### Returns

`this`

#### Example

```ts
let bbox = [[-79, 43], [-73, 45]];
map.fitBounds(bbox, {
  padding: {top: 10, bottom:25, left: 15, right: 5}
});
```

#### See

[Fit a map to a bounding box](<https://maplibre.org/maplibre-gl-js/docs/examples/fit-a-map-to-a-bounding-box/>)

---

### flyTo()

> **flyTo**(`options`: [`FlyToOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FlyToOptions/index.md>), `eventData?`: `any`): `this`

Defined in: [ui/map.ts:1529](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L1529>)

Changes any combination of center, zoom, bearing, pitch, and roll, animating the transition along a curve that evokes flight. The animation seamlessly incorporates zooming and panning to help the user maintain her bearings even after traversing a great distance.

> [!NOTE]
>
> **Reduced Motion**
>
> The animation will be skipped, and this will behave equivalently to `jumpTo` if the user has the `reduced motion` accessibility feature enabled in their operating system, unless 'options' includes `essential: true`.

Triggers the following events: `movestart`, `move`, `moveend`, `zoomstart`, `zoom`, `zoomend`, `pitchstart`, `pitch`, `pitchend`, `rollstart`, `roll`, `rollend`, and `rotate`.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `options` | [`FlyToOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FlyToOptions/index.md>) | Options describing the destination and animation of the transition. Accepts [CameraOptions](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CameraOptions/index.md>), [AnimationOptions](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/AnimationOptions/index.md>), and the following additional options. |
| `eventData?` | `any` | Additional properties to be added to event objects of events triggered by this method. |

#### Returns

`this`

#### Example

```ts
// fly with default options to null island
map.flyTo({center: [0, 0], zoom: 9});
// using flyTo options
map.flyTo({
  center: [0, 0],
  zoom: 9,
  speed: 0.2,
  curve: 1,
  easing(t) {
    return t;
  }
});
```

#### See

- [Fly to a location](<https://maplibre.org/maplibre-gl-js/docs/examples/fly-to-a-location/>)
- [Slowly fly to a location](<https://maplibre.org/maplibre-gl-js/docs/examples/slowly-fly-to-a-location/>)
- [Fly to a location based on scroll position](<https://maplibre.org/maplibre-gl-js/docs/examples/fly-to-a-location-based-on-scroll-position/>)

---

### getCanvas()

> **getCanvas**(): `HTMLCanvasElement`

Defined in: [ui/map.ts:4079](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L4079>)

Returns the map's `<canvas>` element.

#### Returns

`HTMLCanvasElement`

The map's `<canvas>` element.

#### See

- [Measure distances](<https://maplibre.org/maplibre-gl-js/docs/examples/measure-distances/>)
- [Display a popup on hover](<https://maplibre.org/maplibre-gl-js/docs/examples/display-a-popup-on-hover/>)
- [Center the map on a clicked symbol](<https://maplibre.org/maplibre-gl-js/docs/examples/center-the-map-on-a-clicked-symbol/>)

---

### getLayer()

> **getLayer**(`id`: `string`): [`StyleLayer`](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/StyleLayer/index.md>)

Defined in: [ui/map.ts:3584](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L3584>)

Returns the layer with the specified ID in the map's style.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | `string` | The ID of the layer to get. |

#### Returns

[`StyleLayer`](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/StyleLayer/index.md>)

The layer with the specified ID, or `undefined` if the ID corresponds to no existing layers.

#### Example

```ts
let stateDataLayer = map.getLayer('state-data');
```

#### See

- [Filter symbols by toggling a list](<https://maplibre.org/maplibre-gl-js/docs/examples/filter-symbols-by-toggling-a-list/>)
- [Filter symbols by text input](<https://maplibre.org/maplibre-gl-js/docs/examples/filter-symbols-by-text-input/>)

---

### getSource()

> **getSource**\<`TSource` *extends* [`Source`](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/Source/index.md>)\>(`id`: `string`): `TSource`

Defined in: [ui/map.ts:3120](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L3120>)

Returns the source with the specified ID in the map's style.

This method is often used to update a source using the instance members for the relevant source type as defined in classes that derive from [Source](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/Source/index.md>). For example, setting the `data` for a GeoJSON source or updating the `url` and `coordinates` of an image source.

#### Type Parameters

| Type Parameter |
| --- |
| `TSource` *extends* [`Source`](<https://maplibre.org/maplibre-gl-js/docs/API/interfaces/Source/index.md>) |

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | `string` | The ID of the source to get. |

#### Returns

`TSource`

The style source with the specified ID or `undefined` if the ID corresponds to no existing sources. The shape of the object varies by source type. A list of options for each source type is available on the MapLibre Style Specification's [Sources](<https://maplibre.org/maplibre-style-spec/sources/>) page.

#### Example

```ts
let sourceObject = map.getSource('points');
```

#### See

- [Create a draggable point](<https://maplibre.org/maplibre-gl-js/docs/examples/create-a-draggable-point/>)
- [Animate a point](<https://maplibre.org/maplibre-gl-js/docs/examples/animate-a-point/>)
- [Add live realtime data](<https://maplibre.org/maplibre-gl-js/docs/examples/add-live-realtime-data/>)

---

### isStyleLoaded()

> **isStyleLoaded**(): `boolean` | `void`

Defined in: [ui/map.ts:2894](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2894>)

Returns a Boolean indicating whether the map's style is fully loaded.

#### Returns

`boolean` | `void`

A Boolean indicating whether the style is fully loaded.

#### Example

```ts
let styleLoadStatus = map.isStyleLoaded();
```

---

### jumpTo()

> **jumpTo**(`options`: [`JumpToOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/JumpToOptions/index.md>), `eventData?`: `any`): `this`

Defined in: [ui/map.ts:1432](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L1432>)

Changes any combination of center, zoom, bearing, pitch, and roll, without an animated transition. The map will retain its current values for any details not specified in `options`.

Triggers the following events: `movestart`, `move`, `moveend`, `zoomstart`, `zoom`, `zoomend`, `pitchstart`, `pitch`, `pitchend`, `rollstart`, `roll`, `rollend` and `rotate`.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `options` | [`JumpToOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/JumpToOptions/index.md>) | Options object |
| `eventData?` | `any` | Additional properties to be added to event objects of events triggered by this method. |

#### Returns

`this`

#### Example

```ts
// jump to coordinates at current zoom
map.jumpTo({center: [0, 0]});
// jump with zoom, pitch, and bearing options
map.jumpTo({
  center: [0, 0],
  zoom: 8,
  pitch: 45,
  bearing: 90
});
```

#### See

- [Jump to a series of locations](<https://maplibre.org/maplibre-gl-js/docs/examples/jump-to-a-series-of-locations/>)
- [Update a feature in realtime](<https://maplibre.org/maplibre-gl-js/docs/examples/update-a-feature-in-realtime/>)

---

### project()

> **project**(`lnglat`: [`LngLatLike`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/LngLatLike/index.md>)): `Point`

Defined in: [ui/map.ts:2080](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2080>)

Returns a [Point](<https://github.com/mapbox/point-geometry>) representing pixel coordinates, relative to the map's `container`, that correspond to the specified geographical location.

A location behind the camera has no corresponding pixel. For such a location the returned point is outside the viewport, on the side through which the location left the screen, one viewport width or height away from the edge.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `lnglat` | [`LngLatLike`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/LngLatLike/index.md>) | The geographical location to project. |

#### Returns

`Point`

The [Point](<https://github.com/mapbox/point-geometry>) corresponding to `lnglat`, relative to the map's `container`.

#### Example

```ts
let coordinate = [-122.420679, 37.772537];
let point = map.project(coordinate);
```

---

### queryRenderedFeatures()

> **queryRenderedFeatures**(`geometryOrOptions?`: [`QueryRenderedFeaturesOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/QueryRenderedFeaturesOptions/index.md>) | [`PointLike`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/PointLike/index.md>) | \[[`PointLike`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/PointLike/index.md>), [`PointLike`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/PointLike/index.md>)\], `options?`: [`QueryRenderedFeaturesOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/QueryRenderedFeaturesOptions/index.md>)): [`MapGeoJSONFeature`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapGeoJSONFeature/index.md>)\[\]

Defined in: [ui/map.ts:2596](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2596>)

Returns an array of MapGeoJSONFeature objects representing visible features that satisfy the query parameters.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `geometryOrOptions?` | [`QueryRenderedFeaturesOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/QueryRenderedFeaturesOptions/index.md>) \| [`PointLike`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/PointLike/index.md>) \| \[[`PointLike`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/PointLike/index.md>), [`PointLike`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/PointLike/index.md>)\] | (optional) The geometry of the query region in pixel points within the map viewport: either a single pixel point or a pair of top-left and bottom-right pixel points describing a bounding box. The origin of the pixel points is at the top-left of the map viewport. Omitting this parameter (i.e. calling [Map.queryRenderedFeatures](<#queryrenderedfeatures>) with zero arguments, or with only a `options` argument) is equivalent to passing a bounding box encompassing the entire map viewport. The geometryOrOptions can receive a [QueryRenderedFeaturesOptions](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/QueryRenderedFeaturesOptions/index.md>) only to support a situation where the function receives only one parameter which is the options parameter. |
| `options?` | [`QueryRenderedFeaturesOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/QueryRenderedFeaturesOptions/index.md>) | (optional) Options object. |

#### Returns

[`MapGeoJSONFeature`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapGeoJSONFeature/index.md>)\[\]

An array of MapGeoJSONFeature objects.

The `properties` value of each returned feature object contains the properties of its source feature. For GeoJSON sources, only string and numeric property values are supported (i.e. `null`, `Array`, and `Object` values are not supported).

Each feature includes top-level `layer`, `source`, and `sourceLayer` properties. The `layer` property is an object representing the style layer to which the feature belongs. Layout and paint properties in this object contain values which are fully evaluated for the given zoom level and feature.

Only features that are currently rendered are included. Some features will **not** be included, like:

- Features from layers whose `visibility` property is `"none"`.
- Features from layers whose zoom range excludes the current zoom level.
- Symbol features that have been hidden due to text or icon collision.

Features from all other layers are included, including features that may have no visible contribution to the rendered result; for example, because the layer's opacity or color alpha component is set to 0.

The topmost rendered feature appears first in the returned array, and subsequent features are sorted by descending z-order. Features that are rendered multiple times (due to wrapping across the antemeridian at low zoom levels) are returned only once (though subject to the following caveat).

Because features come from tiled vector data or GeoJSON data that is converted to tiles internally, feature geometries may be split or duplicated across tile boundaries and, as a result, features may appear multiple times in query results. For example, suppose there is a highway running through the bounding rectangle of a query. The results of the query will be those parts of the highway that lie within the map tiles covering the bounding rectangle, even if the highway extends into other tiles, and the portion of the highway within each map tile will be returned as a separate feature. Similarly, a point feature near a tile boundary may appear in multiple tiles due to tile buffering.

#### Examples

Find all features at a point

```ts
let features = map.queryRenderedFeatures(
  [20, 35],
  { layers: ['my-layer-name'] }
);
```

Find all features within a static bounding box

```ts
let features = map.queryRenderedFeatures(
  [[10, 20], [30, 50]],
  { layers: ['my-layer-name'] }
);
```

Find all features within a bounding box around a point

```ts
let width = 10;
let height = 20;
let features = map.queryRenderedFeatures([
  [point.x - width / 2, point.y - height / 2],
  [point.x + width / 2, point.y + height / 2]
], { layers: ['my-layer-name'] });
```

Query all rendered features from a single layer

```ts
let features = map.queryRenderedFeatures({ layers: ['my-layer-name'] });
```

#### See

[Get features under the mouse pointer](<https://maplibre.org/maplibre-gl-js/docs/examples/get-features-under-the-mouse-pointer/>)

---

### remove()

> **remove**(): `void`

Defined in: [ui/map.ts:4556](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L4556>)

Clean up and release all internal resources associated with this map.

This includes DOM elements, event bindings, web workers, and WebGL resources.

Use this method when you are done using the map and wish to ensure that it no longer consumes browser resources. Afterwards, you must not call any other methods on the map.

#### Returns

`void`

---

### removeFeatureState()

> **removeFeatureState**(`target`: [`FeatureIdentifier`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FeatureIdentifier/index.md>), `key?`: `string`): `this`

Defined in: [ui/map.ts:4010](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L4010>)

Removes the `state` of a feature, setting it back to the default behavior. If only a `target.source` is specified, it will remove the state for all features from that source. If `target.id` is also specified, it will remove all keys for that feature's state. If `key` is also specified, it removes only that key from that feature's state. Features are identified by their `feature.id` attribute, which can be any number or string.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `target` | [`FeatureIdentifier`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FeatureIdentifier/index.md>) | Identifier of where to remove state. It can be a source, a feature, or a specific key of feature. Feature objects returned from [Map.queryRenderedFeatures](<#queryrenderedfeatures>) or event handlers can be used as feature identifiers. |
| `key?` | `string` | (optional) The key in the feature state to reset. |

#### Returns

`this`

#### Examples

Reset the entire state object for all features in the `my-source` source

```ts
map.removeFeatureState({
  source: 'my-source'
});
```

When the mouse leaves the `my-layer` layer, reset the entire state object for the feature under the mouse

```ts
map.on('mouseleave', 'my-layer', (e) => {
  map.removeFeatureState({
    source: 'my-source',
    sourceLayer: 'my-source-layer',
    id: e.features[0].id
  });
});
```

When the mouse leaves the `my-layer` layer, reset only the `hover` key-value pair in the state for the feature under the mouse

```ts
map.on('mouseleave', 'my-layer', (e) => {
  map.removeFeatureState({
    source: 'my-source',
    sourceLayer: 'my-source-layer',
    id: e.features[0].id
  }, 'hover');
});
```

---

### resize()

> **resize**(`eventData?`: `any`, `constrainTransform?`: `boolean`): `this`

Defined in: [ui/map.ts:1607](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L1607>)

Resizes the map according to the dimensions of its `container` element.

Checks if the map container size changed and updates the map if it has changed. With the default `trackResize: true`, container size changes are picked up automatically, including a container that becomes visible after being hidden with CSS. Call this method explicitly when `trackResize` is `false`, or when the map's size changes in a way the container's `ResizeObserver` cannot observe.

Triggers the following events: `movestart`, `move`, `moveend`, and `resize`.

#### Parameters

| Parameter | Type | Default value | Description |
| --- | --- | --- | --- |
| `eventData?` | `any` | `undefined` | Additional properties to be passed to `movestart`, `move`, `resize`, and `moveend` events that get triggered as a result of resize. This can be useful for differentiating the source of an event (for example, user-initiated or programmatically-triggered events). |
| `constrainTransform?` | `boolean` | `true` | \- |

#### Returns

`this`

#### Example

Resize a map with `trackResize` disabled when its container is shown after being hidden with CSS.

```ts
let mapDiv = document.getElementById('map');
if (mapDiv.style.visibility === 'visible') map.resize();
```

---

### rotateTo()

> **rotateTo**(`bearing`: `number`, `options?`: [`EaseToOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/EaseToOptions/index.md>), `eventData?`: `any`): `this`

Defined in: [ui/map.ts:1286](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L1286>)

Rotates the map to the specified bearing, with an animated transition. The bearing is the compass direction that is "up"; for example, a bearing of 90° orients the map so that east is up.

Triggers the following events: `movestart`, `moveend`, and `rotate`.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `bearing` | `number` | The desired bearing. |
| `options?` | [`EaseToOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/EaseToOptions/index.md>) | Options object |
| `eventData?` | `any` | Additional properties to be added to event objects of events triggered by this method. |

#### Returns

`this`

---

### setBearing()

> **setBearing**(`bearing`: `number`, `eventData?`: `any`): `this`

Defined in: [ui/map.ts:1241](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L1241>)

Sets the map's bearing (rotation). The bearing is the compass direction that is "up"; for example, a bearing of 90° orients the map so that east is up.

Equivalent to `jumpTo({bearing: bearing})`.

Triggers the following events: `movestart`, `moveend`, and `rotate`.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `bearing` | `number` | The desired bearing. |
| `eventData?` | `any` | Additional properties to be added to event objects of events triggered by this method. |

#### Returns

`this`

#### Example

Rotate the map to 90 degrees

```ts
map.setBearing(90);
```

---

### setFeatureState()

> **setFeatureState**(`feature`: [`FeatureIdentifier`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FeatureIdentifier/index.md>), `state`: `any`): `this`

Defined in: [ui/map.ts:3959](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L3959>)

Sets the `state` of a feature. A feature's `state` is a set of user-defined key-value pairs that are assigned to a feature at runtime. When using this method, the `state` object is merged with any existing key-value pairs in the feature's state. Features are identified by their `feature.id` attribute, which can be any number or string.

This method can only be used with sources that have a `feature.id` attribute. The `feature.id` attribute can be defined in three ways:

- For vector or GeoJSON sources, including an `id` attribute in the original data file.
- For vector or GeoJSON sources, using the [`promoteId`](<https://maplibre.org/maplibre-style-spec/sources/#promoteid>) option at the time the source is defined.
- For GeoJSON sources, using the [`generateId`](<https://maplibre.org/maplibre-style-spec/sources/#generateid>) option to auto-assign an `id` based on the feature's index in the source data. If you change feature data using `map.getSource('some id').setData(..)`, you may need to re-apply state taking into account updated `id` values.

> [!NOTE]
>
> You can use the [`feature-state` expression](<https://maplibre.org/maplibre-style-spec/expressions/#feature-state>) to access the values in a feature's state object for the purposes of styling.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `feature` | [`FeatureIdentifier`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FeatureIdentifier/index.md>) | Feature identifier. Feature objects returned from [Map.queryRenderedFeatures](<#queryrenderedfeatures>) or event handlers can be used as feature identifiers. |
| `state` | `any` | A set of key-value pairs. The values should be valid JSON types. |

#### Returns

`this`

#### Example

```ts
// When the mouse moves over the `my-layer` layer, update
// the feature state for the feature under the mouse
map.on('mousemove', 'my-layer', (e) => {
  if (e.features.length > 0) {
    map.setFeatureState({
      source: 'my-source',
      sourceLayer: 'my-source-layer',
      id: e.features[0].id,
    }, {
      hover: true
    });
  }
});
```

#### See

[Create a hover effect](<https://maplibre.org/maplibre-gl-js/docs/examples/create-a-hover-effect/>)

---

### setFilter()

> **setFilter**(`layerId`: `string`, `filter?`: `FilterSpecification`, `options?`: [`StyleSetterOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/StyleSetterOptions/index.md>)): `this`

Defined in: [ui/map.ts:3661](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L3661>)

Sets the filter for the specified style layer.

Filters control which features a style layer renders from its source. Any feature for which the filter expression evaluates to `true` will be rendered on the map. Those that are false will be hidden.

Use `setFilter` to show a subset of your source data.

To clear the filter, pass `null` or `undefined` as the second parameter.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `layerId` | `string` | The ID of the layer to which the filter will be applied. |
| `filter?` | `FilterSpecification` | The filter, conforming to the MapLibre Style Specification's [filter definition](<https://maplibre.org/maplibre-style-spec/layers/#filter>). If `null` or `undefined` is provided, the function removes any existing filter from the layer. |
| `options?` | [`StyleSetterOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/StyleSetterOptions/index.md>) | Options object. |

#### Returns

`this`

#### Examples

Display only features with the 'name' property 'USA'

```ts
map.setFilter('my-layer', ['==', ['get', 'name'], 'USA']);
```

Display only features with five or more 'available-spots'

```ts
map.setFilter('bike-docks', ['>=', ['get', 'available-spots'], 5]);
```

Remove the filter for the 'bike-docks' style layer

```ts
map.setFilter('bike-docks', null);
```

#### See

[Create a timeline animation](<https://maplibre.org/maplibre-gl-js/docs/examples/create-a-time-slider/>)

---

### setLayoutProperty()

> **setLayoutProperty**\<`K` *extends* keyof `AllLayoutProperties`\>(`layerId`: `string`, `name`: `K`, `value`: `AllLayoutProperties`\[`K`\], `options?`: [`StyleSetterOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/StyleSetterOptions/index.md>)): `this`

Defined in: [ui/map.ts:3720](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L3720>)

Sets the value of a layout property in the specified style layer.

#### Type Parameters

| Type Parameter |
| --- |
| `K` *extends* keyof `AllLayoutProperties` |

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `layerId` | `string` | The ID of the layer to set the layout property in. |
| `name` | `K` | The name of the layout property to set. |
| `value` | `AllLayoutProperties`\[`K`\] | The value of the layout property. Must be of a type appropriate for the property, as defined in the [MapLibre Style Specification](<https://maplibre.org/maplibre-style-spec/>). |
| `options` | [`StyleSetterOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/StyleSetterOptions/index.md>) | The options object. |

#### Returns

`this`

#### Example

```ts
map.setLayoutProperty('my-layer', 'visibility', 'none');
```

---

### setPaintProperty()

> **setPaintProperty**\<`K` *extends* keyof `AllPaintProperties`\>(`layerId`: `string`, `name`: `K`, `value`: `AllPaintProperties`\[`K`\], `options?`: [`StyleSetterOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/StyleSetterOptions/index.md>)): `this`

Defined in: [ui/map.ts:3692](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L3692>)

Sets the value of a paint property in the specified style layer.

#### Type Parameters

| Type Parameter |
| --- |
| `K` *extends* keyof `AllPaintProperties` |

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `layerId` | `string` | The ID of the layer to set the paint property in. |
| `name` | `K` | The name of the paint property to set. |
| `value` | `AllPaintProperties`\[`K`\] | The value of the paint property to set. Must be of a type appropriate for the property, as defined in the [MapLibre Style Specification](<https://maplibre.org/maplibre-style-spec/>). Pass `null` to unset the existing value. |
| `options` | [`StyleSetterOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/StyleSetterOptions/index.md>) | Options object. |

#### Returns

`this`

#### Example

```ts
map.setPaintProperty('my-layer', 'fill-color', '#faafee');
```

#### See

- [Change a layer's color with buttons](<https://maplibre.org/maplibre-gl-js/docs/examples/change-a-layers-color-with-buttons/>)
- [Create a draggable point](<https://maplibre.org/maplibre-gl-js/docs/examples/create-a-draggable-point/>)

---

### setPitch()

> **setPitch**(`pitch`: `number`, `eventData?`: `any`): `this`

Defined in: [ui/map.ts:1329](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L1329>)

Sets the map's pitch (tilt). Equivalent to `jumpTo({pitch: pitch})`.

Triggers the following events: `movestart`, `moveend`, `pitchstart`, and `pitchend`.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `pitch` | `number` | The pitch to set, measured in degrees away from the plane of the screen (0-60). |
| `eventData?` | `any` | Additional properties to be added to event objects of events triggered by this method. |

#### Returns

`this`

---

### setStyle()

> **setStyle**(`style`: `string` | `StyleSpecification`, `options?`: [`StyleSwapOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/StyleSwapOptions/index.md>) &amp; [`StyleOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/StyleOptions/index.md>)): `this`

Defined in: [ui/map.ts:2703](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2703>)

Updates the map's MapLibre style object with a new value.

If a style is already set when this is used and options.diff is set to true, the map renderer will attempt to compare the given style against the map's current state and perform only the changes necessary to make the map style match the desired state. Changes in sprites (images used for icons and patterns) and glyphs (fonts for label text) **cannot** be diffed. If the sprites or fonts used in the current style and the given style are different in any way, the map renderer will force a full update, removing the current style and building the given one from scratch.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `style` | `string` \| `StyleSpecification` | A JSON object conforming to the schema described in the [MapLibre Style Specification](<https://maplibre.org/maplibre-style-spec/>), or a URL to such JSON. |
| `options?` | [`StyleSwapOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/StyleSwapOptions/index.md>) &amp; [`StyleOptions`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/StyleOptions/index.md>) | The options object. |

#### Returns

`this`

#### Example

```ts
map.setStyle("https://demotiles.maplibre.org/style.json");

map.setStyle('https://demotiles.maplibre.org/style.json', {
  transformStyle: (previousStyle, nextStyle) => ({
      ...nextStyle,
      sources: {
          ...nextStyle.sources,
          // copy a source from previous style
          'osm': previousStyle.sources.osm
      },
      layers: [
          // background layer
          nextStyle.layers[0],
          // copy a layer from previous style
          previousStyle.layers[0],
          // other layers from the next style
          ...nextStyle.layers.slice(1).map(layer => {
              // hide the layers we don't need from demotiles style
              if (layer.id.startsWith('geolines')) {
                  layer.layout = {...layer.layout || {}, visibility: 'none'};
              // filter out US polygons
              } else if (layer.id.startsWith('coastline') || layer.id.startsWith('countries')) {
                  layer.filter = ['!=', ['get', 'ADM0_A3'], 'USA'];
              }
              return layer;
          })
      ]
  })
});

map.setStyle('https://demotiles.maplibre.org/style.json', {
  globalState: {
    showCircles: true,
  }
});
```

---

### triggerRepaint()

> **triggerRepaint**(): `void`

Defined in: [ui/map.ts:4597](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L4597>)

Trigger the rendering of a single frame. Use this method with custom layers to repaint the map when the layer changes. Calling this multiple times before the next frame is rendered will still result in only a single frame being rendered.

#### Returns

`void`

#### Example

```ts
map.triggerRepaint();
```

#### See

- [Add 3D Tiles, 3D objects and models using Three.js](<https://maplibre.org/maplibre-gl-js/docs/examples/add-3d-tiles-3d-objects-and-models-using-threejs/>)
- [Add an animated icon to the map](<https://maplibre.org/maplibre-gl-js/docs/examples/add-an-animated-icon-to-the-map/>)

---

### unproject()

> **unproject**(`point`: [`PointLike`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/PointLike/index.md>)): [`LngLat`](<https://maplibre.org/maplibre-gl-js/docs/API/classes/LngLat/index.md>)

Defined in: [ui/map.ts:2098](<https://github.com/maplibre/maplibre-gl-js/blob/638b3f9ecab4b743fd4d086d3bfd19bce7b7b032/src/ui/map.ts#L2098>)

Returns a [LngLat](<https://maplibre.org/maplibre-gl-js/docs/API/classes/LngLat/index.md>) representing geographical coordinates that correspond to the specified pixel coordinates.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `point` | [`PointLike`](<https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/PointLike/index.md>) | The pixel coordinates to unproject. |

#### Returns

[`LngLat`](<https://maplibre.org/maplibre-gl-js/docs/API/classes/LngLat/index.md>)

The [LngLat](<https://maplibre.org/maplibre-gl-js/docs/API/classes/LngLat/index.md>) corresponding to `point`.

#### Example

```ts
map.on('click', (e) => {
  // When the map is clicked, get the geographic coordinate.
  let coordinate = map.unproject(e.point);
});
```

---
