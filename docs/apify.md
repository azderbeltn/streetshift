# Apify — saved reference for StreetShift

Sources (fetched 2026-10-24):
- Google Maps Scraper Actor page (markdown): https://apify.com/compass/crawler-google-places.md  (README, output example, input schema, API examples — copied verbatim below)
- Actor metadata / pricing: https://api.apify.com/v2/acts/compass~crawler-google-places ; input schema JSON (enums/defaults) from latest build https://api.apify.com/v2/actor-builds/EH35UvIrsV0hnZG0Y (build 0.14.775, 2026-10-21)
- Apify docs index: https://docs.apify.com/llms.txt ; pages fetched as .md from docs.apify.com (each section has its own Source: line)

## KEY FACTS (summary written by the doc fetcher)
- Current versions (2026-10-24): Python `apify-client` **3.3.0** (`pip install apify-client` / `uv add apify-client`), Python Actor SDK `apify` **4.1.0**, `apify-cli` (npm) **1.10.0** (requires Node ^20.19.0 || >=22.12.0).
- Actor ID: `compass/crawler-google-places` (in API paths use `compass~crawler-google-places`).
- Python usage: `from apify_client import ApifyClient; client = ApifyClient(token); run = client.actor("compass/crawler-google-places").call(run_input={...}); for item in client.dataset(run.default_dataset_id).iterate_items(): ...`
  (in the current client `call()` returns a typed `Run` object: use the attribute `run.default_dataset_id`, NOT `run["defaultDatasetId"]` which was the 1.x dict style — verbatim example in the Actor page "API" section below.)
- Key input fields: `searchStringsArray` (array), `locationQuery` (string) OR `customGeolocation` (GeoJSON object; **coordinate order [longitude, latitude]**; supports Point with `radiusKm`, Polygon, etc. — see "Custom search area" in README), `maxCrawledPlacesPerSearch` (int), `language` ("en"), `maxReviews` (int, default 0 = no reviews), `reviewsSort` (enum: `newest` | `mostRelevant` | `highestRanking` | `lowestRanking`, default `newest`), `reviewsStartDate`, `scrapePlaceDetailPage` (bool, default false; **required for popular times fields**), `skipClosedPlaces`.
- Output fields (see JSON example below): `title`, `categoryName`, `categories`, `location.lat` / `location.lng`, `totalScore`, `reviewsCount`, `placeId`, `address`, `popularTimesHistogram` (structure NOT shown in the fetched docs; from prior knowledge it is an object keyed `Mo`..`Su`, each a list of `{hour, occupancyPercent}` — VERIFY against a real cached result before parsing; often missing because Google shows it mostly to logged-in users), `popularTimesLiveText`, `popularTimesLivePercent`, `reviews[]` with `publishedAtDate`, `text`, `stars`, ...
- Pricing (pay-per-event, FREE-tier price): $0.004 per place scraped; +$0.002 per place for "additional place details" (charged when scrapePlaceDetailPage or reviews/images are requested); $0.0005 per review; $0.001 per place per filter applied; $0.00005 per actor start. Example: 50 places × 50 reviews with details ≈ 50×(0.004+0.002) + 2500×0.0005 = $0.30 + $1.25 = $1.55.
- Build/publish your own Actor: `npm install -g apify-cli` → `apify login` → `apify create my-actor -t python-start` (template names in CLI reference) → edit `src/main.py`, `.actor/actor.json`, `.actor/input_schema.json` → `apify run` locally → `apify push` → publish from Console (Actor > Publication tab), see "Publishing" below.

## Pricing table (from API pricingInfos, USD per event)

| event | title | FREE tier USD | BRONZE | GOLD |
|---|---|---|---|---|
| place-scraped | Scraped place | 0.004 | 0.003 | 0.0015 |
| filter-applied | Add-on: Filter applied | 0.001 | 0.001 | 0.000525 |
| place-details-scraped | Add-on: Additional place details scraped | 0.002 | 0.002 | 0.00105 |
| contact-details-scraped | Add-on: Company contacts enrichment | 0.002 | 0.002 | 0.00105 |
| lead-scraped | Add-on: Business leads enrichment | 0.1 | 0.005 | 0.004 |
| lead-email-verified | Add-on: Email verification | 0.1 | 0.004 | 0.002 |
| social-profile-scraped | Add-on: Social media profile enrichment | 0.1 | 0.008 | 0.006 |
| review-scraped | Add-on: Review scraped | 0.0005 | 0.0005 | 0.00026 |
| image-scraped | Add-on: Image scraped | 0.0005 | 0.0005 | 0.00026 |
| competitor-analyzed | Single Competitor AI Analysis | 0.025 | 0.02 | 0.016 |
| apify-actor-start | Actor Start | 5e-05 | 5e-05 | 5e-05 |



---

# Google Maps Scraper — input schema JSON details (types, defaults, enums; descriptions removed, long enums truncated)

Source: https://api.apify.com/v2/actor-builds/EH35UvIrsV0hnZG0Y (inputSchema)

- `searchStringsArray`: {"title": "🔍 Search term(s)", "type": "array", "editor": "stringList", "items": {"type": "string"}, "prefill": ["restaurant"], "example": ["restaurant"]}
- `locationQuery`: {"title": "📍 Location (use only one location per run)", "type": "string", "editor": "textfield", "prefill": "New York, USA", "example": "New York, USA"}
- `maxCrawledPlacesPerSearch`: {"title": "💯 Number of places to extract (per each search term or URL)", "type": "integer", "prefill": 50, "example": 50, "minimum": 1}
- `language`: {"title": "🌍 Language", "enum": ["en", "af", "az", "id", "ms", "bs", "ca", "cs", "da", "de", "et", "es", "es-419", "eu", "fil", "...(74 total)"], "enumTitles": ["English", "Afrikaans", "azərbaycan", "BahasaIndonesia", "BahasaMelayu", "bosanski", "català", "Čeština", "Dansk", "Deutsch (Deutschland)", "eesti", "Español (España)", "Español (Latinoamérica)", "euskara", "Filipino", "...(74 total)"], "type": "string", "editor": "select", "default": "en", "example": "en", "prefill": "en"}
- `categoryFilterWords`: {"title": "🎢 Place categories ($)", "type": "array", "editor": "select", "items": {"type": "string", "enum": ["abbey", "accountant", "accounting", "acupuncturist", "aeroclub", "agriculture", "airline", "airport", "airstrip", "allergist", "amphitheater", "amphitheatre", "anesthesiologist", "appraiser", "aquarium", "...(4036 total)"]}, "example": ["pizza", "italian"], "sectionCaption": "🔍 Add-on: Search filters & categories"}
- `searchMatching`: {"title": "Get exact name matches (no similar results) ($)", "enum": ["all", "only_includes", "only_exact"], "enumTitles": ["Scrape all places as provided by Google", "Scrape only places that include the search term in their title", "Scrape only places that match the search term exactly with their title"], "type": "string", "editor": "select", "default": "all", "example": "all"}
- `placeMinimumStars`: {"title": "Set a minimum star rating ($)", "enum": ["", "two", "twoAndHalf", "three", "threeAndHalf", "four", "fourAndHalf"], "enumTitles": ["All", "⭐️ 2+ star", "⭐️ 2.5+ stars", "⭐️ 3+ stars", "⭐️ 3.5+ stars", "⭐️ 4+ stars", "⭐️ 4.5+ stars"], "type": "string", "editor": "select", "default": "", "example": ""}
- `website`: {"title": "Scrape places with/without a website ($)", "enum": ["allPlaces", "withWebsite", "withoutWebsite"], "enumTitles": ["Scrape all places", "Scrape only places with a website", "Scrape only places without a website"], "type": "string", "editor": "select", "default": "allPlaces", "example": "allPlaces"}
- `skipClosedPlaces`: {"title": "⏩ Skip closed places ($)", "type": "boolean", "default": false, "example": false}
- `scrapePlaceDetailPage`: {"title": "Scrape place detail page ($)", "type": "boolean", "default": false, "example": false, "sectionCaption": "📌 Add-on: Additional place details scraping"}
- `scrapeTableReservationProvider`: {"title": "Scrape table reservation provider data ($)", "type": "boolean", "default": false, "example": false}
- `scrapeOrderOnline`: {"title": "🛵 Scrape order online widget data ($)", "type": "boolean", "default": false, "example": false}
- `includeWebResults`: {"title": "🌐 Include \"Web results\" ($)", "type": "boolean", "default": false, "example": false}
- `scrapeDirectories`: {"title": "🛍 Scrape inside places (e.g. malls or shopping center) ($)", "type": "boolean", "default": false, "example": false}
- `maxQuestions`: {"title": "Number of questions to extract ($)", "type": "integer", "default": 0, "minimum": 0, "unit": "questions per place", "example": 0}
- `scrapeContacts`: {"title": "⏩ Add-on: Company contacts enrichment (from website) ($)", "type": "boolean", "default": false, "example": false, "sectionCaption": "🏢 Add-on: Company contacts enrichment"}
- `scrapeSocialMediaProfiles`: {"title": "🔍 Add-on: Social media profile enrichment ($)", "type": "object", "editor": "schemaBased", "default": {"facebooks": false, "instagrams": false, "youtubes": false, "tiktoks": false, "twitters": false}, "prefill": {"facebooks": false, "instagrams": false, "youtubes": false, "tiktoks": false, "twitters": false}, "properties": {"facebooks": {"title": "Enable Facebook profile scraping", "type": "boolean", "description": "Enable scraping detailed Facebook profile information for discovered Facebook URLs. This will provide additional data like follower counts, profile pictures, and more."}, "instagrams": {"title": "Enable Instagram profile scraping", "type": "boolean", "description": "Enable scraping detailed Instagram profile information for discovered Instagram URLs. This will provide additional data like follower counts, profile pictures, and more."}, "youtubes": {"title": "Enable YouTube channel scraping", "type": "boolean", "description": "Enable scraping detailed YouTube channel information for discovered YouTube URLs. This will provide additional data like subscriber counts, channel descriptions, and more."}, "tiktoks": {"title": "Enable TikTok profile scraping", "type": "boolean", "description": "Enable scraping detailed TikTok profile information for discovered TikTok URLs. This will provide additional data like follower counts, profile pictures, and more."}, "twitters": {"title": "Enable X (Twitter) profile scraping", "type": "boolean", "description": "Enable scraping detailed Twitter profile information for discovered X (Twitter) URLs. This will provide additional data like follower counts, profile pictures, and more."}}, "example": {"facebooks": false, "instagrams": false, "youtubes": false, "tiktoks": false, "twitters": false}}
- `maximumLeadsEnrichmentRecords`: {"title": "⏩ Add-on: Extract business leads information - Maximum leads per place ($)", "type": "integer", "default": 0, "minimum": 0, "example": 0, "prefill": 0, "sectionCaption": "👥 Add-on: Business leads enrichment"}
- `leadsEnrichmentDepartments`: {"title": "Leads departments selection", "type": "array", "editor": "select", "items": {"type": "string", "enum": ["c_suite", "product", "engineering_technical", "design", "education", "finance", "human_resources", "information_technology", "legal", "marketing", "medical_health", "operations", "sales", "consulting"], "enumTitles": ["C-Suite", "Product", "Engineering & Technical", "Design", "Education", "Finance", "Human Resources", "Information Technology", "Legal", "Marketing", "Medical & Health", "Operations", "Sales", "Consulting"]}, "example": ["sales", "marketing"]}
- `verifyLeadsEnrichmentEmails`: {"title": "⏩ Add-on: Email verification ($)", "type": "boolean", "default": false}
- `maxReviews`: {"title": "Number of reviews to extract ($)", "type": "integer", "default": 0, "example": 0, "minimum": 0, "unit": "reviews per place", "sectionCaption": "⭐️ Add-on: Reviews"}
- `reviewsStartDate`: {"title": "Only scrape reviews newer than [date]", "type": "string", "editor": "datepicker", "example": "2024-01-01", "dateType": "absoluteOrRelative", "pattern": "^(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])(T[0-2]\\d:[0-5]\\d(:[0-5]\\d)?(\\.\\d+)?Z?)?$|^(\\d+)\\s*(minute|hour|day|week|month|year)s?$"}
- `reviewsSort`: {"title": "Sort reviews by", "type": "string", "editor": "select", "default": "newest", "enum": ["newest", "mostRelevant", "highestRanking", "lowestRanking"], "enumTitles": ["Newest", "Most relevant", "Highest ranking", "Lowest ranking"], "example": "newest"}
- `reviewsFilterString`: {"title": "Filter reviews by keywords", "type": "string", "default": "", "maxLength": 500, "editor": "textarea", "example": ""}
- `reviewsOrigin`: {"title": "Reviews origin", "type": "string", "editor": "select", "default": "all", "example": "all", "enum": ["all", "google"], "enumTitles": ["All reviews", "Google"]}
- `scrapeReviewsPersonalData`: {"title": "🧛‍♂️ Include reviewers' data", "type": "boolean", "default": true, "example": true}
- `maxImages`: {"title": "Number of additional images to extract ($)", "type": "integer", "default": 0, "minimum": 0, "unit": "images per place", "example": 0, "sectionCaption": "🖼️ Add-on: Images"}
- `scrapeImageAuthors`: {"title": "🧑‍🎨 Include the image authors", "type": "boolean", "default": false, "example": false}
- `enableCompetitorAnalysis`: {"title": "Enable competitor analysis ($)", "type": "boolean", "default": false, "sectionCaption": "🤖 Add-on: Competitor analysis ($)"}
- `maxCompetitorsToAnalyze`: {"title": "Max competitors to analyze", "type": "integer", "default": 30, "minimum": 0, "maximum": 100, "example": 30, "prefill": 30}
- `countryCode`: {"title": "🗺 Country", "type": "string", "editor": "select", "enum": ["", "us", "af", "al", "dz", "as", "ad", "ao", "ai", "aq", "ag", "ar", "am", "aw", "au", "...(241 total)"], "enumTitles": ["", "United States", "Afghanistan", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antarctica", "Antigua and Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "...(241 total)"], "example": "US", "sectionCaption": "📡 Geolocation parameters*"}
- `city`: {"title": "🌇 City", "type": "string", "editor": "textfield", "example": "New York"}
- `state`: {"title": "State", "type": "string", "editor": "textfield", "example": "New York"}
- `county`: {"title": "County", "type": "string", "editor": "textfield", "example": "New York County"}
- `postalCode`: {"title": "Postal code", "type": "string", "editor": "textfield", "example": "10001"}
- `customGeolocation`: {"title": "🛰 Custom search area (coordinate order must be: [↕ longitude, ↔ latitude])", "type": "object", "editor": "json", "properties": {"type": {"title": "GeoJSON type", "type": "string", "description": "One of: Polygon, MultiPolygon, LineString, MultiLineString, Point, MultiPoint, Feature, FeatureCollection."}}, "required": ["type"], "example": {"type": "Point", "coordinates": [-73.9857, 40.7484]}}
- `startUrls`: {"title": "Google Maps URLs", "type": "array", "editor": "requestListSources", "items": {"type": "object", "properties": {"url": {"title": "URL", "type": "string", "description": "A single Google Maps URL to scrape."}}}, "example": [{"url": "https://www.google.com/maps/place/Yellowstone+National+Park/@44.5857951,-110.5140571,9z/data=!3m1!4b1!4m5!3m4!1s0x5351e55555555555:0xaca8f930348fe1bb!8m2!3d44.427963!4d-110.588455?hl=en-GB"}], "sectionCaption": "🔗 Scrape with Google Maps URLs or place IDs*"}
- `placeIds`: {"title": "🗃 Place IDs", "type": "array", "editor": "stringList", "items": {"type": "string", "pattern": "\\S+"}, "example": ["ChIJabcdEFGHijklMNOPqrstUVWX"]}
- `allPlacesNoSearchAction`: {"title": "Scrape all places", "enum": ["", "all_places_no_search_ocr", "all_places_no_search_mouse"], "enumTitles": ["Not applied (normal search or direct places)", "Scrape all places visible on the map (ignore search terms)", "DEPRECATED: Scrape by Moving mouse (very slow)"], "type": "string", "editor": "select", "default": "", "example": "", "sectionCaption": "🧭 Scraping places without search terms or URLs*"}

---

# Google Maps Scraper — Actor page (verbatim)

Source: https://apify.com/compass/crawler-google-places.md

# Google Maps Scraper (`compass/crawler-google-places`) Actor

Extract data from thousands of Google Maps locations and businesses, including reviews, reviewer details, images, contact info, including full name, email, and job title, opening hours, prices & more. Export data, run via API, schedule and monitor runs, or integrate with other tools.

- **URL**: https://apify.com/compass/crawler-google-places.md
- **Developed by:** [Compass](https://apify.com/compass) (Apify)
- **Categories:** Lead generation, Travel
- **Stats:** 664,809 total users, 44,931 monthly users, 98.0% runs succeeded, 5,225 bookmarks
- **User rating**: 4.71 out of 5 stars

## Pricing

from $1.50 / 1,000 scraped places

This Actor is paid per event. You are not charged for the Apify platform usage, but only a fixed price for specific events.
Since this Actor supports Apify Store discounts, the price gets lower the higher subscription plan you have.

Learn more: https://docs.apify.com/actors/running/actors-in-store.md#pay-per-event

## What's an Apify Actor?

An Actor is a serverless cloud program that runs on the Apify platform. It has two run modes.
In Batch mode, an Actor accepts a well-defined JSON input, performs an action which can take anything from a few seconds to a few hours,
and optionally produces a well-defined JSON output, datasets with results, or files in key-value store.
In Standby mode, an Actor provides a web server which can be used as a website, API, or an MCP server.

Apify vocabulary and the platform model are defined once, in the agent quickstart at https://apify.com/agents.md.

## How to integrate an Actor?

If asked about integration, you help developers integrate Actors into their projects.
You adapt to their stack and deliver integrations that are safe, well-documented, and production-ready.

Do not guess an integration path. Every one of them is in the agent quickstart at https://apify.com/agents.md: the Apify MCP server, Agent Skills with the Apify CLI, the JavaScript and Python clients, the REST API, and the account-free path for an agent with no human to sign in. It also carries the rule on stating cost before the first paid run.

For examples already wired to this Actor's own input schema, see the [API](#api) section below.

Each client library has reference documentation the quickstart does not restate: [JavaScript/TypeScript](https://docs.apify.com/api/client/js/docs.md) (`npm install apify-client`) and [Python](https://docs.apify.com/api/client/python/docs.md) (`pip install apify-client`).

# README

### 📍 What is Google Maps Scraper?

**Google Maps Scraper** lets you extract business data from Google Maps, helping you generate leads, analyze competitors, and fuel growth with just a few clicks.

- **Generate qualified leads:** extract business names, websites, emails, and phone numbers to build prospect lists for your sales team
- **Track competitors across regions:** monitor where competitors operate, how they’re rated, and how many reviews they’ve received
- **Perform market analysis:** analyze market saturation, identify service gaps, or benchmark local businesses by size, rating, and visibility
- **Support partnerships:** discover top-rated or high-volume locations for outreach and collaboration
- **Automate research workflows:** replace manual search tasks with repeatable workflows that keep datasets fresh and consistent.

**The scraper expands Google Maps data extraction beyond the limitations of the official [Google Places API](https://developers.google.com/maps/documentation/places/web-service/search) and bypasses the [limitation of Google Maps](https://blog.apify.com/google-places-api-limits/#%E2%9B%94-what-are-google-maps-limitations-for-scraping) of displaying (and scraping) no more than 120 places per area.**

#### What data does Google Maps Scraper extract?

|                                                                                                         |                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 🔗 Title/place name                                                                                     | 📝 Subtitle, category, place ID, and URL                                                                                         |
| 📍 Address                                                                                              | 🌍 Location, plus code and exact coordinates                                                                                     |
| ☎️ Phone number                                                                                         | 🌐 Website, if available                                                                                                         |
| 📝 Company contact details from website (company email, phone number, and social media profiles)        | 🏛️ Impressum contacts from German, Austrian, and Swiss websites (owner and managing director names, VAT ID, and register number) |
| 🎯 Business leads enrichment (full name, work email address, phone number, job title, LinkedIn profile) | 📱 Social media profile enrichment (detailed profile data for Facebook, Instagram, YouTube, TikTok, Twitter)                     |
| ➕ List of detailed characteristics (`additionalInfo`)                                                  | 🌐 Search results                                                                                                                |
| 📊 Review count and review distribution                                                                 | ⭐️ Average rating (`totalScore`)                                                                                                 |
| 📸 List of images                                                                                       | 🏨 Hotel booking URL and price + nearby hotels                                                                                   |
| 🔒 Temporarily or permanently closed status                                                             | 🙋 Updates from customers & Questions and answers                                                                                |
| 🔍 People also search                                                                                   | 🏷 Menu                                                                                                                          |
| 💲 Price bracket                                                                                        | 🧑‍🍳 Opening hours                                                                                                                 |
| ⌚️ Popular times - histogram & live occupancy                                                           | 🪑 Table reservation provider                                                                                                    |
| 🛍 Multiple businesses located within indoor venues, such as malls or shopping centers.                 | 🤖 Competitor analysis report                                                                                                    |
| 🗺 Interactive map visualization of analyzed competitors                                                |                                                                                                                                  |

> ⚠️ **Note: Google shows some place details mostly to logged-in users, so they are often missing:** image categories (`imageCategories`), People also search (`peopleAlsoSearch`), popular times (`popularTimesHistogram`, `popularTimesLiveText`, `popularTimesLivePercent`), web results (`webResults`), updates from customers (`updatesFromCustomers`) and most of additional info (`additionalInfo`). Without image categories, images come only from the "All" category, so you may get far fewer images than `maxImages`.

For maximum usefulness, Google Maps Scraper has the following abilities:

- **Extract anything:** names, addresses, websites, phone numbers, ratings, review counts, categories, or opening hours
- **Flexible search:** scrape using any number of criteria, including search query, category, location, coordinates, or URL
- **Define the area to scrape:** focus on specific locations, or set a wide area using coordinates or geolocation parameters
- **Flexible output format:** export data into almost any format, with multiple views available
- **Integrate with other tools:** use webhooks or the Apify MCP server to set up workflows with other Actors or third-party tools like Make or Zapier
- **Use add-ons for further enrichment:** use paid add-ons to further enrich your data with contact details, images, reviews, or an AI-powered competitor analysis report

***

### ⬇️ Input

The input for Google Maps Scraper should be **either a Google Maps URL or a location in combination with a search term.** You can also extract any details such as images, reviews, amenities, and so on. You can set up the input programmatically or use the fields in the scraper’s interface.

#### Search terms

Using multiple similar search terms can increase the number of scraped places, but it also increases the time a run takes. We recommend using a combination of search terms that are distinct or overlap only slightly in meaning. Using a long list of duplicate search terms will just increase the time of a run without providing more results.

Example of a good list of search terms: \[`restaurant`, `bar`, `pub`, `cafe`, `buffet`, `ice cream`, `tea house`]

Example of a bad list of search terms: \[`restaurant`, `restaurants`, `chinese restaurant`, `cafe`, `coffee`, `coffee shop`, `takeout`]

Google search results often include categories adjacent to your search, e.g. `restaurant` might also capture some `cafe` or `bar` places, but you will get better results if you use them as separate search terms, as well.

#### Categories

**Using categories can be dangerous!**

Search terms can introduce false positives, extracting some irrelevant places. Categories can be used to narrow down the results to just the ones you select.

Categories can also be dangerous because they can cause false negatives, excluding places you might want in the results. Google has thousands of categories, and many are synonymous. You must list all the categories you want to match, including all synonyms; for example, Divorce lawyer, Divorce service, and Divorce attorney are three distinct categories, and some places might be classified as only one of them, meaning you should input all of them. For this reason, we recommend going through the categories list carefully. For some use cases, you might want to select as many as 100 categories to ensure you don't miss any relevant places.

To help with this, Google Maps Scraper tries to increase the chance of a match by doing the following:

- If any category of a place (each can have several categories) matches any category from your input, it will be included.
- If all words from your input are contained in a category name, it will be included. E.g. `restaurant` will match `Chinese restaurant` and `Pan Asian restaurant`.

> ⚠️ If categories are used **without search terms**, they will be used both as search terms and as category filters. However, for the above reasons, using categories without search terms is **not recommended**. We generally recommend fewer search terms and many categories.

#### Search without geolocation

Rather than using the standard search term and location inputs, you may also opt to use only the search term (e.g. "restaurants in Berlin") or a direct Google Maps search URL (e.g. https://www.google.com/maps/search/restaurants/@52.5190603,13.388574,13z/) without the location input field. However, **this approach will limit the number of results to a maximum of 120** because it only opens a single map screen on Google with a finite scroll. We only recommend skipping location input if you don't need more than 120 results, you need the lowest possible latency, or you want to get the results in the same order as Google would provide.

#### Direct Place IDs or URLs

Alternatively, you can also upload a direct Google Maps Place ID or URL (or a list of them) to Google Maps Scraper, which will extract the place details directly without going through the search step first. Be aware that if you provide direct place IDs or URLs, you will be charged extra as this is part of a paid add-on, namely that for Additional place details scraped.

***

### ⬆️ Output

The results will be wrapped into a dataset which you can find in the **Output** or **Storage** tab. Note that the output is organized in tables and tabs for viewing convenience. You can view results as a table, JSON, or as a map.

Once the run is finished, you can also download the dataset in various data formats (JSON, CSV, Excel, XML, HTML). Before exporting, you can pick or omit specific output fields; alternatively, you can also choose to download the whole view, which includes thematically connected data.

`Reviews` and `Leads enrichment` views spread each review or lead to a separate row for easier data processing.

#### Table view

The table view can be manipulated in different ways. There is a general overview, but you can also sort the table by contact info, location rating, reviews, or other fields.

![image](https://i.imgur.com/ldi6i4t.png)

#### JSON file

Here's the amount of data you'd get for a single scraped place ([this one 📍](https://www.google.com/maps/place/Kim's+Island/@40.5107736,-74.2482624,17z/data=!4m6!3m5!1s0x89c3ca9c11f90c25:0x6cc8dba851799f09!8m2!3d40.5107736!4d-74.2482624!16s%2Fg%2F1tmgdcj8?hl=en\&entry=ttu) so you can compare).
Example of 1 scraped restaurant in New York:

```json
{
    "searchString": "Direct Detail URL: https://www.google.com/maps/place/Kim's+Island/@40.5107736,-74.2482624,17z/data=!4m6!3m5!1s0x89c3ca9c11f90c25:0x6cc8dba851799f09!8m2!3d40.5107736!4d-74.2482624!16s%2Fg%2F1tmgdcj8?hl=en&entry=ttu",
    "rank": null,
    "searchPageUrl": null,
    "searchPageLoadedUrl": null,
    "isAdvertisement": false,
    "title": "Kim's Island",
    "subTitle": null,
    "description": null,
    "price": "$10–20",
    "categoryName": "Chinese restaurant",
    "address": "175 Main St, Staten Island, NY 10307",
    "neighborhood": "Tottenville",
    "street": "175 Main St",
    "city": "Staten Island",
    "postalCode": "10307",
    "state": "New York",
    "countryCode": "US",
    "website": "http://kimsislandsi.com/",
    "phone": "(718) 356-5168",
    "phoneUnformatted": "+17183565168",
    "claimThisBusiness": false,
    "location": {
        "lat": 40.5107736,
        "lng": -74.2482624
    },
    "locatedIn": null,
    "plusCode": "GQ62+8M Staten Island, New York",
    "menu": "http://kimsislandsi.com/",
    "servicesLink": null,
    "totalScore": 4.5,
    "permanentlyClosed": false,
    "temporarilyClosed": false,
    "placeId": "ChIJJQz5EZzKw4kRCZ95UajbyGw",
    "categories": ["Chinese restaurant", "Delivery Restaurant"],
    "fid": "0x89c3ca9c11f90c25:0x6cc8dba851799f09",
    "cid": "7838756667406262025",
    "reviewsCount": 91,
    "reviewsDistribution": {
        "oneStar": 4,
        "twoStar": 3,
        "threeStar": 3,
        "fourStar": 10,
        "fiveStar": 71
    },
    "imagesCount": 28,
    "imageCategories": ["All", "Menu", "Food & drink", "Vibe", "By owner", "Street View & 360°"],
    "scrapedAt": "2024-11-28T12:28:50.519Z",
    "reserveTableUrl": null,
    "googleFoodUrl": null,
    "hotelStars": null,
    "hotelDescription": null,
    "checkInDate": null,
    "checkOutDate": null,
    "similarHotelsNearby": null,
    "hotelReviewSummary": null,
    "hotelAds": [],
    "openingHours": [
        {
            "day": "Monday",
            "hours": "Closed"
        },
        {
            "day": "Tuesday",
            "hours": "11 AM to 9:30 PM"
        },
        {
            "day": "Wednesday",
            "hours": "11 AM to 9:30 PM"
        },
        {
            "day": "Thursday",
            "hours": "11 AM to 12 AM"
        },
        {
            "day": "Friday",
            "hours": "12 to 9:30 AM, 11 AM to 10:30 PM"
        },
        {
            "day": "Saturday",
            "hours": "11 AM to 10:30 PM"
        },
        {
            "day": "Sunday",
            "hours": "12 to 9:30 PM"
        }
    ],
    "wasOpenAtScrapeTime": true,
    "peopleAlsoSearch": [
        {
            "category": "People also search for",
            "title": "Island Kitchen Chinese",
            "reviewsCount": 70,
            "totalScore": 3.4
        },
        {
            "category": "People also search for",
            "title": "New Island",
            "reviewsCount": 116,
            "totalScore": 3.9
        },
        {
            "category": "People also search for",
            "title": "Islander Taste Chinese Restaurant",
            "reviewsCount": 119,
            "totalScore": 4.2
        },
        {
            "category": "People also search for",
            "title": "Kum Fung",
            "reviewsCount": 168,
            "totalScore": 3.8
        }
    ],
    "placesTags": [],
    "reviewsTags": [
        {
            "title": "prices",
            "count": 6
        },
        {
            "title": "delivery",
            "count": 4
        },
        {
            "title": "spareribs",
            "count": 3
        },
        {
            "title": "dumpling",
            "count": 2
        },
        {
            "title": "lo mein",
            "count": 2
        }
    ],
    "additionalInfo": {
        "Service options": [
            {
                "Takeout": true
            },
            {
                "Dine-in": true
            }
        ],
        "Popular for": [
            {
                "Lunch": true
            },
            {
                "Dinner": true
            },
            {
                "Solo dining": true
            }
        ],
        "Accessibility": [
            {
                "Wheelchair accessible entrance": true
            },
            {
                "Wheelchair accessible seating": true
            },
            {
                "Assistive hearing loop": false
            },
            {
                "Wheelchair accessible parking lot": false
            },
            {
                "Wheelchair accessible restroom": false
            }
        ],
        "Offerings": [
            {
                "Comfort food": true
            },
            {
                "Healthy options": true
            },
            {
                "Quick bite": true
            },
            {
                "Small plates": true
            }
        ],
        "Dining options": [
            {
                "Lunch": true
            },
            {
                "Dinner": true
            }
        ],
        "Amenities": [
            {
                "Restroom": false
            }
        ],
        "Atmosphere": [
            {
                "Casual": true
            }
        ],
        "Planning": [
            {
                "Accepts reservations": false
            }
        ],
        "Payments": [
            {
                "Credit cards": true
            },
            {
                "Debit cards": true
            },
            {
                "NFC mobile payments": true
            },
            {
                "Credit cards": true
            }
        ],
        "Children": [
            {
                "Good for kids": true
            }
        ]
    },
    "gasPrices": [],
    "questionsAndAnswers": [],
    "updatesFromCustomers": null,
    "ownerUpdates": [],
    "url": "https://www.google.com/maps/search/?api=1&query=Kim's%...",
    "imageUrl": "https://lh5.googleusercontent.com/p/AF1Q...",
    "kgmid": "/g/1tmgdcj8",
    "webResults": [],
    "parentPlaceUrl": null,
    "tableReservationLinks": [],
    "bookingLinks": [],
    "images": [
        {
            "imageUrl": "https://lh5.googleusercontent.com/p/AF1Q...",
            "authorName": "Sebastian Sinisterra (CitySeby)",
            "authorUrl": "https://maps.google.com/maps/contrib/103...",
            "uploadedAt": "2017-05-30T00:00:00.000Z"
        }
    ],
    "imageUrls": ["https://lh5.googleusercontent.com/p/AF1Q..."],
    "reviews": [
        {
            "name": "Rocco Castellano",
            "text": "Excellent  food great service n always  on time",
            "textTranslated": null,
            "publishAt": "a month ago",
            "publishedAtDate": "2024-10-11T01:23:42.544Z",
            "likesCount": 0,
            "reviewId": "ChdDSUhNMG9nS0VJQ0FnSURuNV9DVnFRRRAB",
            "reviewUrl": "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6...",
            "reviewerId": "108813127648936384314",
            "reviewerUrl": "https://www.google.com/maps/contrib/108...",
            "reviewerPhotoUrl": "https://lh3.googleusercontent.com/a-/ALV...",
            "reviewerNumberOfReviews": 74,
            "isLocalGuide": true,
            "reviewOrigin": "Google",
            "stars": 5,
            "rating": null,
            "responseFromOwnerDate": null,
            "responseFromOwnerText": null,
            "reviewImageUrls": [],
            "reviewContext": {},
            "reviewDetailedRating": {
                "Food": 5,
                "Service": 5,
                "Atmosphere": 5
            }
        }
    ],
    "userPlaceNote": null,
    "restaurantData": {}
}
```

**🏢 Company contacts enrichment**

```json
{
    "title": "Daniel's Jewelers",
    "instagrams": ["https://www.instagram.com/danielsjewelers/"],
    "facebooks": ["https://www.facebook.com/DanielsJewelers"],
    "linkedIns": [],
    "youtubes": ["https://www.youtube.com/channel/UCUgzkwhbbodMnOwDIPJj0_g"],
    "tiktoks": ["https://www.tiktok.com/@DanielsJewelers"],
    "twitters": ["https://twitter.com/danielsjewelers"],
    "pinterests": ["https://www.pinterest.com/daniel_jewelers/"]
}
```

**🏛️ Impressum contacts**

If the website has an Impressum (legal notice) page, it is scraped automatically whenever you enable Company contacts enrichment, at no extra cost. The `impressum` object contains the owners and managing directors, legal company name, registered address, VAT ID, and commercial register number. Impressum pages are mandatory for businesses in Germany and Austria and common in Switzerland, which makes them the most reliable source of named decision-makers there. Fields that aren't on the page are left out.

Each person has a `roleType`: `managing_director`, `owner`, `board_member`, `supervisory_board`, `content_responsible`, `data_protection_officer`, or `other`. Filter on it to keep only decision-makers.

```json
{
    "title": "Bäckerei Mustermann",
    "impressum": {
        "url": "https://www.baeckerei-mustermann.de/impressum",
        "company": { "name": "Bäckerei Mustermann GmbH", "legalForm": "GmbH" },
        "people": [
            { "name": "Max Mustermann", "role": "Geschäftsführer", "roleType": "managing_director" },
            { "name": "Erika Mustermann", "role": "Verantwortlich für den Inhalt", "roleType": "content_responsible" }
        ],
        "emails": [{ "value": "info@baeckerei-mustermann.de", "type": "generic" }],
        "phones": [{ "value": "+49 30 1234567", "type": "generic" }],
        "addresses": [{ "street": "Musterstraße 1", "postalCode": "10115", "city": "Berlin", "country": "Germany" }],
        "vatId": "DE123456789",
        "registrations": [{ "number": "HRB 123456", "court": "Amtsgericht Charlottenburg" }]
    }
}
```

**👥 Business leads enrichment**

```json
{
    "city": "Seattle",
    "state": "Washington",
    "personId": "2746893668571939229",
    "firstName": "Benjamin",
    "lastName": "White",
    "fullName": "Benjamin White",
    "linkedinProfile": "https://www.linkedin.com/in/benjamin-white-2562a3212",
    "email": null,
    "mobileNumber": null,
    "headline": "Influencer a Content Creator (IG, TT)",
    "jobTitle": "Sales Manager",
    "department": ["Marketing"],
    "industry": "Food&Beverage",
    "seniority": ["entry"],
    "country": "United States",
    "photoUrl": "https://media.licdn.com/dms/image/v2/...",
    "companyId": "23734538243567720",
    "companyName": "Happy Eating",
    "companyWebsite": "happyeating.com",
    "companySize": "51 - 200",
    "companyLinkedin": "https://www.linkedin.com/company/62543",
    "twitter": null,
    "companyCity": null,
    "companyState": null,
    "companyCountry": null,
    "companyPhoneNumber": null
}
```

**✅ Add-on: Email verification**

When `verifyLeadsEnrichmentEmails` is enabled, each lead's email address is verified and an `emailVerification` object is added to the lead output. Requires Business leads enrichment to be active.

**Charged (decisive results):**

- `ok` - Valid, deliverable email address
- `invalid` - Invalid or non-existent email address
- `disposable` - Disposable or temporary email address

**Not charged:**

- `catch_all` - The domain accepts all addresses; individual deliverability cannot be confirmed
- `unknown` - Verification result could not be determined
- `error` - Verification encountered a technical error

```json
{
    "email": "james.hill@apify.com",
    "quality": "good",
    "result": "ok",
    "subResult": "accepted_email",
    "free": false,
    "role": false,
    "error": ""
}
```

**📱 Social media profile enrichment**

When Social media profile enrichment is enabled, Google Maps Scraper can enrich discovered social media URLs with detailed profile information (follower counts, descriptions, and verification status...). The enriched profiles are included directly in the place output.

**Important notes:**

- Social media profile enrichment requires the **Company contacts enrichment feature to be enabled** (this is automatically enabled when you enable Social media profile enrichment)
- Each enriched social media profile is a separate billable event
- You can enable enrichment for specific platforms only (e.g., only Facebook and Instagram)
- All enrichment options are disabled by default
- Enriched profiles are available in the **Social profiles** output view tab

**🤖 Competitor analysis add-on**

When `enableCompetitorAnalysis` is enabled, the scraper caps the total scraped places to `maxCompetitorsToAnalyze` (default: 30, max: 100) across all search terms combined, runs an AI-powered analysis on all of them after the crawl finishes, and pushes a single report to the dedicated `competitorAnalysis` named dataset. Set `maxCompetitorsToAnalyze` to 0 to skip the analysis even if the flag is on.

> ⚠️ **Use a single, focused search term for best results.** The final report ranks and compares all collected places against each other - they need to be in the same business category and market segment (e.g. `italian restaurants Vienna`). Using multiple search terms that span different categories (e.g. `restaurants` + `coffee shops` + `hair salons`) will produce a meaningless comparison because the AI will rank and contrast fundamentally different types of businesses. Multiple search terms are fine if they all target the same segment (e.g. `sushi restaurants NYC` + `japanese restaurants NYC`).

Enabling this add-on automatically forces:

- Full place detail scraping for all places (`scrapePlaceDetailPage` is overridden to `true`)
- At least 100 reviews per place (overrides a lower `maxReviews` setting)
- Social media profile enrichment for all places

**Example cost: 100 competitors analyzed**

The table below shows the additional cost of enabling this add-on for 100 places, assuming 100 reviews per place and 1 social media profile found per place. The base `place-scraped` cost applies regardless of this add-on.

| Event                           | Count        | FREE        | SILVER     |
| ------------------------------- | ------------ | ----------- | ---------- |
| Additional place details        | 100          | $0.20       | $0.15      |
| Company contacts enrichment     | 100          | $0.20       | $0.15      |
| Reviews (100 per place)         | 10,000       | $5.00       | $3.70      |
| Social media profile enrichment | 100 profiles | $10.00      | $0.70      |
| Competitor analysis event       | 100          | $2.50       | $1.80      |
| **Total**                       |              | **~$17.90** | **~$6.50** |

Reviews are the largest cost driver. Social media profile enrichment on the FREE plan is priced significantly higher than on paid plans. The exact cost depends on how many social profiles are actually found per business.

The report covers:

- **Per-place analysis** - review-backed strengths, weaknesses, and unique selling propositions (each claim cited to a specific review); sentiment breakdown; social media presence summary
- **Comparative ranking** - all analyzed places ranked with justification
- **Aspect-by-aspect comparison** - who leads and who lags on dimensions like customer sentiment, price positioning, and operational quality
- **Strategic market overview** - main competitive battlegrounds, market opportunities, and threats
- **Map visualization** - interactive HTML map stored in the Key-Value Store

**🏩 External places (hotels)**

Google sometimes shows these places when searching in certain locations, mainly for hotels. They are however not regular places with pins on the map and offer only some of the regular output fields. These places are marked with 3 extra output fields:

```json
{
    "url": "https://www.google.com/maps/place/Al Eairy Furnished Apartments Al Madinah 9/@24.48...",
    "isExternalServicePlace": true,
    "externalServiceProvider": "SuperTravel",
    "externalId": "/g/11pkhzvq1s"
}
```

**🏩 Hotel-specific info**

```json
{
    "hotelStars": "4-star hotel",
    "hotelDescription": "This old-world-style luxury hotel is in a historic property that dates from 1874; it's a 1-minute walk from the Long Island Railroad and 19 miles from Manhattan.\n The posh rooms have flat-screen TVs, Italian furniture, Wi-Fi (surcharge) and 24-hour room service. Upgraded suites add kitchenettes and living areas, while some feature an additional bathroom and private outdoor patios.\n Perks include 25,000 sq ft of event space, an indoor pool, a spa and sauna, a fitness center and an upscale steakhouse, plus a seasonal patio bar, and lounge. Pet walking and feeding services are available. Parking is free.",
    "checkInDate": "2025-06-14",
    "checkOutDate": "2025-06-16",
    "similarHotelsNearby": [
        {
            "name": "Residence Inn Long Island Garden City",
            "rating": 4.4,
            "reviews": 343,
            "description": "3-star hotel for $106 less",
            "price": "$314"
        }
    ],
    "hotelAds": [
        {
            "title": "The Garden City Hotel",
            "googleUrl": "https://www.google.com/travel/clk?pc=AA8...",
            "isOfficialSite": true,
            "price": "$501",
            "url": "https://linkcenter.derbysoftca.com/dplatform-linkcenter/booking..."
        }
    ]
}
```

**🍽️ Restaurant-specific info**

```json
{
    "price": "$$",
    "menu": "https://www.carminesnyc.com/menus/menus-clv-q420-dining",
    "reserveTableUrl": "https://www.google.com/maps/reserve/v/dine/...",
    "tableReservationLinks": [
        {
            "name": "carminesnyc.com",
            "url": "https://www.carminesnyc.com/locations/times-square"
        }
    ],
    "bookingLinks": [],
    "restaurantData": {
        "tableReservationProvider": {
            "name": "Resy",
            "reserveTableUrl": "https://www.google.com/maps/reserve/v/dine/...r"
        }
    }
}
```

#### **Map view**

Google Maps Scraper provides a zoomable map that shows all the places scraped. The map is shown in the `Live View` tab on the Actor run page and also stored in the Key-Value Store as `results-map.html` record.

![](https://images.apifyusercontent.com/ByTaALp6MrNdHFl4RsdrF6lrlMgK3pCvn0jJ0u-7QJA/w:1800/cb:1/aHR0cHM6Ly9pLmltZ3VyLmNvbS9ZU1dSbHlPLnBuZw.webp)

***

### 📍📡 Using geolocation for pinpoint accuracy

#### Location, country, state, county, city, and postal code

Using free text in the **Location** field should normally be enough to start scraping. For a more precise search, you can also use the **Geolocation parameters** field and use a combination of `country`, `state`, `county`, `city`, and `postalCode`.

Google Maps Scraper uses OpenStreetMap as its geolocation API. You can easily check the location matching your geolocation input on the [official OpenStreetMap page](https://nominatim.openstreetmap.org/ui/search.html?city=new%20york).

#### 🛰 Custom search area

If your location can’t be found on Google Maps or you want to customize it for a specific area, you can use the **Custom search area** function. You’ll have to provide coordinate pairs for an area and the scraper will create start URLs out of them. As an example, see the `geojson field` in [Nominatim API](https://nominatim.openstreetmap.org/) ([example of Cambridge in Great Britain](https://nominatim.openstreetmap.org/search?country=united%20kingdom\&state=\&city=cambridge\&postalcode=\&format=json\&polygon_geojson=1\&limit=1\&polygon_threshold=0.005)).

There are several types of search area geometry that you can use in Google Maps Scraper: `Polygon`, `MultiPolygon` and `Point` (a circle with a radius of 5 kilometers by default). All of them follow the official [GeoJSON](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.2) and all types are supported. We’ve found the polygons and circle to be the most useful ones when it comes to scraping.

> Note that the order of longitude and latitude is reversed in GeoJSON 🔄 compared to the Google Maps website. The first field must be longitude ↕️, the second field must be latitude ↔️.

We recommend using [Geojson.io](https://geojson.io/#map=2/0/20) to create `customGeolocation` of any type/shape in the correct format. You can [watch this video](https://www.tiktok.com/@apifytech/video/7231446296006020379?embed_source=121352282%2C121351166%2C121331973%2C120811592%2C120810756%3Bnull%3B) on how to use it together with the scraper.

**💠 Polygon**

The most common type is a polygon, which is a set of points that define the scraped area. Note that **the first and last pair of coordinates must be identical** (to close the polygon). This example covers most of the city of London, UK:

```json
{
    "type": "Polygon",
    "coordinates": [
        [
            [
                // Must be the same as last one
                -0.322813, // Longitude
                51.597165 // Latitude
            ],
            [-0.31499, 51.388023],
            [0.060493, 51.389199],
            [0.051936, 51.60036],
            [
                // Must be the same as the first one
                -0.322813, 51.597165
            ]
            // ...
        ]
    ]
}
```

**💠💠 MultiPolygon**

MultiPolygon can combine multiple polygons that are not contiguous (for example, an island close to the mainland). Same as with the polygon, make sure the first and the last pair of coordinates in each polygon are identical.

```json
{
    "type": "MultiPolygon",
    "coordinates": [
        [
            // first polygon
            [
                [
                    12.0905752, // Longitude
                    50.2524063 // Latitude
                ],
                [12.1269337, 50.2324336]
                // ...
            ]
        ],
        [
            // second polygon
            // ...
        ]
    ]
}
```

**🔘 Circle**

For a circle, we can use the `Point` type with a custom parameter `radiusKm`. Don't forget to change the radius to fit your needs. This example covers the city of Basel in Switzerland:

```json
{
    "type": "Point",
    "coordinates": ["7.5503", "47.5590"],
    "radiusKm": 8
}
```

***

### ❓FAQ

#### How does Google Maps Scraper work?

It works exactly as if you were searching through Google Maps and copying information from each page you find. It opens the Google Maps website, goes to a specified location, then writes your search query into the search bar. Then it scrolls down until it reaches the end of the scroll bar or `maxCrawledPlacesPerSearch`. It enqueues all the places as separate pages and then copies and pastes all visible data into an organized document. This process is repeated for many map pages inside the input location. To understand the process fully, just try it out in your browser - the scraper does exactly the same thing, only much faster.

#### What are the disadvantages of the Google Maps API?

With the Google Maps API, you get $200 worth of credit usage every month free of charge. That means 28,500 map loads per month. However, the Google Maps API caps your search results to 60, regardless of the radius you specify. So, if you want to scrape data for bars in New York, for example, you'll get results for only 60 of the thousands of bars in the area.
**Google Maps Scraper imposes no rate limits or quotas** and provides more cost-effective, comprehensive results, and also scrapes histograms for popular times, which aren't available in the official API.

#### Can I scrape places from multiple locations?

In most cases, you don't need multiple locations at all. A single broad location, such as an entire country or state, works fine on its own, since Google Maps Scraper automatically covers the whole area for you instead of requiring you to search city by city or neighborhood by neighborhood.

Google Maps Scraper does support only a single location query per run, so if you genuinely need separate, non-contiguous locations (e.g. Paris and Tokyo in the same run), you can use [Google Maps Scraper Orchestrator](https://apify.com/lukaskrivka/google-maps-scraper-orchestrator) to scrape multiple locations with a single list. It will automatically run Google Maps Scraper for each location in the list and merge the results, and it also fully uses your Apify account memory for maximum speed. If you want to use only Google Maps Scraper, you can add multiple locations using `customGeolocation` with multiple polygons.

#### How can I increase the speed of the scraper?

You can increase the run memory up to 8 GB per run. To speed up the scraping even more, you can run several runs at once to fully utilize all your account memory. To make this simpler, you can use the [Google Maps Scraper Orchestrator](https://apify.com/lukaskrivka/google-maps-scraper-orchestrator) to split locations or search terms over multiple runs, deduplicate the results, and collect them to a single dataset.

#### Can I use the Google Maps Scraper to extract Google reviews?

Yes. This Google Maps Scraper also supports the extraction of detailed information about reviews on Google Maps. Reviewers' personal data (name, ID, URL, and photo) is included by default. You can turn it off with the **Include reviewers' data** input setting. You're responsible for having a legal basis to collect and use it under privacy laws (see the [Legality of scraping Google Maps](https://apify.com/compass/crawler-google-places#is-it-legal-to-scrape-google-maps) section).

|                                   |                                 |
| --------------------------------- | ------------------------------- |
| 📝 Review text                    | 📅 Published date               |
| 🌟 Stars                          | 🆔 Review ID & URL              |
| ✅ Response from the owner - text | 📷 List of review images        |
| 💬 Review context                 | 📊 Detailed rating per service  |
| 🧛 Reviewer’s name                | ✍️ Reviewer’s number of reviews |
| 🖼 Reviewer’s ID, URL & photo     | 👋 `isLocalGuide`               |

#### How can I get one review per row in the output?

If you need to view reviews in a table with each review in a separate row, you can click on the **Reviews (if any)** Export dataset view.

To use this view via API, you need to add `&view=reviews` to the dataset export URL. E.g. `https://api.apify.com/v2/datasets/DATASET_ID/items?clean=true&format=json&view=reviews`

If you don't use the **Reviews (if any)** view, each output place item will contain a maximum of 5,000 reviews (in table format, it means a lot of columns). So if there are more reviews for that place, a duplicate place will be stored with the next 5,000 reviews, and so on. For instance, in a case of 50,000 reviews, the resulting dataset will have 10 items for the same place. We have this limitation due to the size limit of a single item in the Apify dataset.

#### Can I integrate Google Maps Scraper with other apps?

Yes. The Google Maps Scraper can be connected with almost any cloud service or web app thanks to [**integrations**](https://apify.com/integrations) on the Apify platform. You can **integrate your Google Maps data with Zapier, Slack, Make, Airbyte, GitHub, Google Sheets, Asana, LangChain,** and more.

You can also use [**webhooks**](https://docs.apify.com/integrations/webhooks) to carry out an action whenever an event occurs, for example, get a notification whenever Google Maps Scraper successfully finishes a run.

#### **Can I use Google Maps Scraper as its own API?**

Yes, you can use the Apify API to access Google Maps Scraper programmatically. The API allows you to manage, schedule, and run Apify Actors, access datasets, monitor performance, get results, create and update Actor versions, and more.

To access the API using Node.js, you can use the `apify-client` [NPM package](https://apify.com/compass/crawler-google-places/api/client/nodejs).
To access the API using Python, you can use the `apify-client` [PyPI package](https://apify.com/compass/crawler-google-places/api/client/python).

For detailed information and code examples, see the [**API tab**](https://apify.com/compass/crawler-google-places/api) or refer to the [**Apify API documentation**](https://docs.apify.com/api/v2).

#### Can I use this Google Maps Scraper API in Python?

Yes, you can use the Apify API with Python. To access the Google Maps Scraper [API with Python](https://apify.com/compass/crawler-google-places/api/client/python), use the `apify-client` PyPI package.
You can find more details about the client in our [Python Client documentation](https://docs.apify.com/api/client/python/).

#### What are other tools I can use with Google Maps?

Use the dedicated scrapers below and combine them with Google Maps Scraper for more comprehensive analysis.

|                                                                                                       |                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 🪢 [Google Maps Scraper Orchestrator](https://apify.com/lukaskrivka/google-maps-scraper-orchestrator) | ⭐️ [AI Text Analyzer for Google Reviews](https://apify.com/geneea-analytics/reviews-text-nlp-analyzer) |
| [🤖 Competitor Analysis Agent](https://apify.com/apify/competitor-analysis-agent)                     | [🤖 Market Expansion Agent](https://apify.com/apify/market-expansion-agent)                            |

#### Is it legal to scrape Google Maps data?

Web scraping is legal if you are extracting publicly available data, which is most data on Google Maps. However, you should **respect boundaries such as personal data** and intellectual property regulations. You should only scrape personal data if you have a legitimate reason to do so, and you should also factor in Google's [Terms of Use](https://policies.google.com/terms?hl=en).

***

#### Your feedback

We’re always working on improving the performance of Apify’s Actors. So if you’ve got any technical feedback for Google Maps Scraper or simply found a bug, please create an issue on the Actor’s [Issues tab](https://apify.com/compass/crawler-google-places/issues/open).

# Changelog

This Actor's version history is a separate document: https://apify.com/compass/crawler-google-places/changelog.md

# Actor input Schema

## `searchStringsArray` (type: `array`):

Type what you'd normally search for in the Google Maps search bar, like <b>English breakfast</b> or <b>pet shelter</b>. Aim for unique terms for faster processing. Using similar terms (e.g., <b>bar</b> vs. <b>restaurant</b> vs. <b>cafe</b>) may slightly increase your capture rate but is less efficient.<br><br>⚠️ <b>Searching for a specific place?</b> If you're looking for a particular business or location (e.g., <b>M\&M Indian Thai Halal Restaurant</b>), make sure to also specify the city or country in the <b>📍 Location</b> field below to get more accurate and reliable results. Without location context, Google Maps may return results from unexpected areas.<br><br>⚠️ Heads up: Adding a location directly to the search, e.g., <b>restaurant Pittsburgh</b>, can limit you to a maximum of 120 results per search term due to <a href='https://blog.apify.com/google-places-api-limits/#%E2%9B%94-what-are-google-maps-limitations-for-scraping'>Google Maps' scrolling limit</a>.<br><br>You can also use direct place IDs here in the format <code>place_id:ChIJ8_JBApXMDUcRDzXcYUPTGUY</code>. See the [detailed description](https://apify.com/compass/crawler-google-places#search-terms).

## `locationQuery` (type: `string`):

Define location using free text. Simpler formats work best; e.g., use City + Country rather than City + Country + State. <br><br>🌍 You can just set the whole country or state as the location: Google Maps Scraper intelligently splits it into subregions internally, so there's no need to search city by city or neighborhood by neighborhood yourself. <br><br>Verify with the <a href='https://nominatim.openstreetmap.org/ui/search.html'>OpenStreetMap webapp</a> for visual validation of the exact area you want to cover. <br><br>💡 <b>Pro tip:</b> Always specify a location when searching for specific place names in the <b>🔍 Search terms</b> field above. This helps narrow down results to the geographic area you're interested in and prevents getting results from unrelated locations.<br><br>⚠️ Automatically defined City polygons may be smaller than expected (e.g., they don't include agglomeration areas). If you need to define the whole city area, head over to the 📡 <b>Geolocation parameters\*</b> section instead to select Country, State, County, City, or Postal code.<br>For an even more precise location definition (especially when using City name as a starting point), head over to <b>🛰 Custom search area</b> section to create polygon shapes of the areas you want to scrape. Note that 📍 <b>Location</b> settings always take priority over <b>📡 Geolocation\*</b> (so use either section but not both at the same time). <br><br>For guidance and tricks on location definition, check the <a href='https://blog.apify.com/google-places-api-limits/#2-choose-the-location-using-regular-toponomy%F0%9F%93%8D'>Apify tutorial</a>.

## `maxCrawledPlacesPerSearch` (type: `integer`):

Number of results you expect to get per each Search term, Category or URL. The higher the number, the longer it will take. <br><br>If you want to scrape all the places available, <b>leave this field empty</b>.

## `language` (type: `string`):

Results will be scraped in this language.

## `categoryFilterWords` (type: `array`):

You can limit the places that are scraped based on the Category filter; you can choose as many categories for one flat fee for the whole field. ⚠️ Using categories can sometimes lead to false negatives, as many places do not properly categorize themselves, and there are over <a href='https://api.apify.com/v2/key-value-stores/epxZwNRgmnzzBpNJd/records/categories'> 4,000</a> available categories which Google Maps has. Using categories might filter out places that you’d like to scrape. To avoid this problem, you must list all categories that you want to scrape, including synonyms, e.g., divorce lawyer, divorce attorney, divorce service, etc. See the [detailed description](https://apify.com/compass/crawler-google-places#categories).

## `searchMatching` (type: `string`):

Restrict what places are scraped based on matching their name with provided 🔍 <b>Search term</b>. E.g., all places that have <b>chicken</b> in their name vs. places called <b>Kentucky Fried Chicken</b>.

## `placeMinimumStars` (type: `string`):

Scrape only places with a rating equal to or above the selected stars. Places without reviews will also be skipped. Keep in mind, filtering by reviews reduces the number of places found per credit spent, as many will be excluded.

## `website` (type: `string`):

Use this to exclude places without a website, or vice versa. This option is turned off by default.

## `skipClosedPlaces` (type: `boolean`):

Skip places that are marked as temporary or permanently closed. Ideal for focusing on currently open places.

## `scrapePlaceDetailPage` (type: `boolean`):

Scrape detail pages of each place the Actor finds. This will slow down the Actor since it needs to open another page for each place individually.<br><br> The fields available only when scrapePlaceDetailPage is enabled include: `reviewsRemovedNotice`, `imageCategories`, popularTimes fields, `BusinessConfirmationText`, `peopleAlsoSearch`, `reviewsTags`, `updatesFromCustomers`, `questionsAndAnswers`, `tableReservationLinks`, `ownerUpdates` and hotel fields. <br><br>⚠️ <b>Note: Google shows some details mostly to logged-in users</b>, so `imageCategories`, `peopleAlsoSearch`, popularTimes fields, `updatesFromCustomers` and most of `additionalInfo` are often missing. <br><br>This option needs to be enabled if you wish to use any of the options below.

## `scrapeTableReservationProvider` (type: `boolean`):

Scrape table reservation provider data like name, address, email or phone. This data is present only in restaurants that have a blue "RESERVE A TABLE" button.

## `scrapeOrderOnline` (type: `boolean`):

Scrape the 'Order online' section of restaurants to get pickup and delivery providers (Uber Eats, DoorDash, etc.), along with fees and estimated times.

## `includeWebResults` (type: `boolean`):

Extract the "Web results" section located at the bottom of every place listing.<br><br>⚠️ <b>Note: Google shows web results mostly to logged-in users, so they are often missing.</b>

## `scrapeDirectories` (type: `boolean`):

Some places (e.g. malls) can have multiple businesses located inside them. This option will scrape inside the "Directory" or "At this place" as per different categories (example <a href='https://www.google.com/maps/place/Forum+Karlín/@50.0914263,14.4522411,532m/data=!3m1!1e3!4m7!3m6!1s0x470b94a14fd738ff:0x6a75e391416ab4fa!8m2!3d50.0914263!4d14.454816!10e3!16s%2Fg%2F1ptxlz77_?entry=ttu&g_ep=EgoyMDI1MDQwMi4xIKXMDSoASAFQAw%3D%3D'>here</a>). Turn this toggle on to include those places in your results.<br><br> ⚠️ Note that full place details need to be scraped in order to scrape directories.

## `maxQuestions` (type: `integer`):

Set the number of questions per place you expect to scrape. If you fill in <b>0</b> or leave the field empty, only the first question and answer will be scraped. To extract all questions, type <b>999</b> into the field.<br><br>⚠️ This returns personal data. You're responsible for having a legal basis to collect and use it under privacy laws.

## `scrapeContacts` (type: `boolean`):

Enrich Google Maps places with contact details extracted from the business website, including business emails and social media profiles (Meta, LinkedIn, X, etc.). Also returns Impressum (legal notice) contacts in the <code>impressum</code> field - see the section description.<br><br>⚠️ This returns personal data. You're responsible for having a legal basis to collect and use it under privacy laws.<br><br>We exclude contacts of big chains: mcdonalds, starbucks, dominos, pizzahut, burgerking, kfc, subway, wendys, dunkindonuts, tacobell.

## `scrapeSocialMediaProfiles` (type: `object`):

Enable enrichment for any social media profiles found. This add-on retrieves detailed public data for each profile, including <b>profile names, follower/following counts, descriptions, post/video counts, and verification status</b>.<br><br>⚠️ This returns personal data. You're responsible for having a legal basis to collect and use it under privacy laws.<br><br>You are charged a flat rate for the <b>total number of profiles enriched</b>, regardless of how many platforms (Facebook, YouTube, etc.) you select.<hr><b>Feature dependency:</b><br>To use this feature, the <b>Company contacts enrichment (from website)</b> add-on is enabled automatically. This ensures the enriched social media data is combined with the main contact record for each domain.<br><br><b>Output:</b> Enriched profiles are available in the <b>Social profiles</b> output view tab.

## `maximumLeadsEnrichmentRecords` (type: `integer`):

Enrich your results with detailed contact and company information, including employee names, job titles, emails, phone numbers, LinkedIn profiles, and key company data like industry and number of employees. <br><br> This setting allows you to set the maximum number of leads records you want to scrape per each place found on the map (that has a website). By default, it's set to 0 which means that no leads information will be scraped. <br><br>⚠️ This returns personal data. You're responsible for having a legal basis to collect and use it under privacy laws. <br><br>We exclude leads of big chains as these are not related to the local places: mcdonalds, starbucks, dominos, pizzahut, burgerking, kfc, subway, wendys, dunkindonuts, tacobell.

## `leadsEnrichmentDepartments` (type: `array`):

You can use this filter to include only specific departments (like Sales, Marketing, or C-Suite). Note: This will only work if the ⏩ Add-on: Extract business leads information - Maximum leads per place (maximumLeadsEnrichmentRecords) option is enabled. Please note that some job titles are sometimes miscategorized in the wrong departments.

## `verifyLeadsEnrichmentEmails` (type: `boolean`):

When enabled, verifies the email address of each lead extracted during business leads enrichment. Each lead receives an <b>emailVerification</b> object with the verification result and quality assessment.<br><br><b>Charged (decisive results):</b> valid (<code>ok</code>), invalid, and disposable email addresses.<br><b>Not charged:</b> catch-all, unknown, and error results.<br><br>⚠️ This add-on requires business leads enrichment to be enabled.

## `maxReviews` (type: `integer`):

Set the number of reviews you expect to get per place.<br> <br>Please be aware that the `Add-on: additional place details scraped` charge applies to each place you scrape for reviews, as the Actor must access the detail page first. All prices are determined by your subscription plan.<br> <br>To extract all reviews, set this to <b>99999</b>. If left empty, no reviews will be scraped. <br> <br>Each output place item can contain maximum 5,000 reviews so in case more reviews are extracted, a duplicate place is stored with the next 5,000 reviews and so on. <br>⚠️ Enabling this feature might slow the search down.

## `reviewsStartDate` (type: `string`):

Either absolute date (e.g. `2024-05-03`) or relative date from now into the past (e.g. `8 days`, `3 months`). JSON input also supports adding time in both absolute (ISO standard, e.g. `2024-05-03T20:00:00`) and relative (e.g. `3 hours`) formats. Absolute time is always interpreted in the UTC timezone, not your local timezone - please convert accordingly. Supported relative date & time units: `minutes`, `hours`, `days`, `weeks`, `months`, `years`. <br><br> ⚠️ Heads up: If this parameter is specified, you must choose the 'Newest' sort by value. The reason for this is that with this parameter entered, the Actor stops scraping reviews as soon as it finds the first review that's older than the specified date. If the sorting is not set to 'Newest', it might encounter a review older than the specified date before it reaches the desired review count and not scrape the desired amount of reviews.

## `reviewsSort` (type: `string`):

Define how reviews are sorted.

## `reviewsFilterString` (type: `string`):

If you enter keywords, only reviews containing those keywords will be scraped. Google limits the filter to 500 bytes (fewer characters for non-Latin text). Leave it blank to scrape all reviews.

## `reviewsOrigin` (type: `string`):

Select whether you want all reviews (from Google, Tripadvisor, etc.) or only reviews from Google.

## `scrapeReviewsPersonalData` (type: `boolean`):

This setting allows you to get personal data about the reviewer (their ID, name, URL, and photo URL) and about the review (URL). Note: review ID (<code>reviewId</code>) is always included regardless of this setting. <br><br>⚠️ This returns personal data. You're responsible for having a legal basis to collect and use it under privacy laws.

## `maxImages` (type: `integer`):

Set the number of images per place you expect to scrape. <br> <br>Please be aware that the `Add-on: additional place details scraped` charge applies to each place you scrape for images, as the Actor must access the detail page first. All prices are determined by your subscription plan.<br> <br>To extract all images, set this to <b>99999</b>. If left empty, no images will be scraped. The higher the number, the slower the search.<br> <br>⚠️ <b>Note: Google shows image categories mostly to logged-in users.</b> Without them, images come only from the "All" category, so you may get far fewer images than requested.

## `scrapeImageAuthors` (type: `boolean`):

Include the author name for each image. <br><br>⚠️ Enabling this toggle may slow down processing as it requires fetching information for each image individually.<br><br>⚠️ This returns personal data. You're responsible for having a legal basis to collect and use it under privacy laws.

## `enableCompetitorAnalysis` (type: `boolean`):

When enabled, runs an AI-powered competitor analysis on the top scraped places and stores a report in the <code>competitorAnalysis</code> named dataset. The report includes a ranked comparison, per-place strengths/weaknesses analysis with review-backed claims, social media insights, and a strategic market overview.<br><br>⚠️ <b>Best results with a single, focused search term.</b> The analysis ranks and compares all collected places against each other, so they should all be in the same business category and market segment (e.g. <b>italian restaurants Vienna</b>). Using multiple search terms that span different categories (e.g. <b>restaurants</b> + <b>coffee shops</b> + <b>hair salons</b>) will produce a meaningless comparison. Multiple search terms are fine as long as they target the same segment (e.g. <b>sushi restaurants NYC</b> + <b>japanese restaurants NYC</b>).<br><br>⚙️ <b>What gets charged when you enable this (for all scraped places, capped at 100 max):</b><ul><li>($) <b>Additional place details</b> - for <b>all places</b> in the run.</li><li>($) <b>Company contacts enrichment</b> - for <b>all places</b> in the run (used to discover social media profiles).</li><li>($) <b>At least 100 reviews</b> - per <b>place</b>. Reviews provide sources and citations in the report. The AI uses the first 100 reviews for analysis; any extras are included in the output but not used for analysis.</li><li>($) <b>Social media profile enrichment</b> - for <b>all places</b> in the run.</li><li>($) <b>Competitor analysis event</b> - one per place.</li></ul>

## `maxCompetitorsToAnalyze` (type: `integer`):

Total number of places to scrape and analyze, capped across all search terms combined. Capped at 100 - this directly bounds your total analysis cost, since every scraped place generates charges. Set to 0 to skip the analysis even if <code>enableCompetitorAnalysis</code> is on.

## `countryCode` (type: `string`):

Set the country, e.g., <b>United States</b>.

## `city` (type: `string`):

Enter the city, e.g., <b>Pittsburgh</b>.<br><br>⚠️ <b>Do not include State or Country names here.</b><br><br>⚠️ Automatic City polygons may be smaller than expected (e.g., they don't include agglomeration areas).

## `state` (type: `string`):

Set a state, e.g., <b>Massachusetts</b> (mainly for the US addresses).

## `county` (type: `string`):

Set the county, e.g., <b>New York County</b>.<br><br>⚠️ Note that <b>county</b> may represent different administrative areas in different countries: a county (e.g., US), regional district (e.g., Canada) or département (e.g., France).

## `postalCode` (type: `string`):

Set the postal code, e.g., <b>10001</b>. <br><br>⚠️ <b>Combine Postal code only with 🗺 Country, never with 🌇 City. You can only input one postal code at a time.</b>

## `customGeolocation` (type: `object`):

Use this field to define the exact search area if other search area parameters don't work for you. See <a href='https://apify.com/compass/crawler-google-places#custom-search-area' target='_blank' rel='noopener'>readme</a> or <a href='https://blog.apify.com/google-places-api-limits/#1-create-a-custom-area-by-using-pairs-of-coordinates-%F0%9F%93%A1' target='_blank' rel='noopener'>the Apify guide</a> for details.

## `startUrls` (type: `array`):

Max 300 results per search URL. Valid format for URLs contains <code>https://google.com/maps/</code>. This feature also supports uncommon URL formats such as: <code>https://google.com/maps?cid=***</code>, <code>https://goo.gl/maps/***</code>, and custom place list URL.

## `placeIds` (type: `array`):

List of place IDs. Add them one by one or upload a list using the <b>Bulk edit</b> option. A <b>place ID</b> has the format <code>ChIJreV9aqYWdkgROM_boL6YbwA</code> - only 27-character IDs starting with <code>ChIJ</code> or <code>GhIJ</code> are supported.

## `allPlacesNoSearchAction` (type: `string`):

Extract all places visible on the map. A good zoom is chosen automatically based on the area size. If you want to override it, set `zoom` (a number from 1 to 21) in JSON input. Higher zoom will scrape more places but will take longer to finish. You can test what place pins are visible with a specific zoom by changing the <a href="https://www.google.com/maps/@40.745204,-73.9390184,16z">16z</a> part of the Google Maps URL.

## Actor input object example

```json
{
  "searchStringsArray": [
    "restaurant"
  ],
  "locationQuery": "New York, USA",
  "maxCrawledPlacesPerSearch": 50,
  "language": "en",
  "categoryFilterWords": [
    "pizza",
    "italian"
  ],
  "searchMatching": "all",
  "placeMinimumStars": "",
  "website": "allPlaces",
  "skipClosedPlaces": false,
  "scrapePlaceDetailPage": false,
  "scrapeTableReservationProvider": false,
  "scrapeOrderOnline": false,
  "includeWebResults": false,
  "scrapeDirectories": false,
  "maxQuestions": 0,
  "scrapeContacts": false,
  "scrapeSocialMediaProfiles": {
    "facebooks": false,
    "instagrams": false,
    "youtubes": false,
    "tiktoks": false,
    "twitters": false
  },
  "maximumLeadsEnrichmentRecords": 0,
  "leadsEnrichmentDepartments": [
    "sales",
    "marketing"
  ],
  "verifyLeadsEnrichmentEmails": false,
  "maxReviews": 0,
  "reviewsStartDate": "2024-01-01",
  "reviewsSort": "newest",
  "reviewsFilterString": "",
  "reviewsOrigin": "all",
  "scrapeReviewsPersonalData": true,
  "maxImages": 0,
  "scrapeImageAuthors": false,
  "enableCompetitorAnalysis": false,
  "maxCompetitorsToAnalyze": 30,
  "countryCode": "US",
  "city": "New York",
  "state": "New York",
  "county": "New York County",
  "postalCode": "10001",
  "customGeolocation": {
    "type": "Point",
    "coordinates": [
      -73.9857,
      40.7484
    ]
  },
  "startUrls": [
    {
      "url": "https://www.google.com/maps/place/Yellowstone+National+Park/@44.5857951,-110.5140571,9z/data=!3m1!4b1!4m5!3m4!1s0x5351e55555555555:0xaca8f930348fe1bb!8m2!3d44.427963!4d-110.588455?hl=en-GB"
    }
  ],
  "placeIds": [
    "ChIJabcdEFGHijklMNOPqrstUVWX"
  ],
  "allPlacesNoSearchAction": ""
}
```

# Actor output Schema

## `dataset` (type: `string`):

Dataset containing all scraped places

## `resultsMap` (type: `string`):

No description

## `competitorAnalysis` (type: `string`):

Dataset containing competitor analysis

# API

You can run this Actor programmatically using our API. Below are code examples in JavaScript, Python, and CLI, as well as the OpenAPI specification and MCP server setup.

## JavaScript example

```javascript
import { ApifyClient } from 'apify-client';

// Initialize the ApifyClient with your Apify API token
// Replace the '<YOUR_API_TOKEN>' with your token
const client = new ApifyClient({
    token: '<YOUR_API_TOKEN>',
});

// Prepare Actor input
const input = {
    "searchStringsArray": [
        "restaurant"
    ],
    "locationQuery": "New York, USA",
    "maxCrawledPlacesPerSearch": 50,
    "language": "en",
    "scrapeSocialMediaProfiles": {
        "facebooks": false,
        "instagrams": false,
        "youtubes": false,
        "tiktoks": false,
        "twitters": false
    },
    "maximumLeadsEnrichmentRecords": 0,
    "maxCompetitorsToAnalyze": 30
};

// Run the Actor and wait for it to finish
const run = await client.actor("compass/crawler-google-places").call(input);

// Fetch and print Actor results from the run's dataset (if any)
console.log('Results from dataset');
console.log(`💾 Check your data here: https://console.apify.com/storage/datasets/${run.defaultDatasetId}`);
const { items } = await client.dataset(run.defaultDatasetId).listItems();
items.forEach((item) => {
    console.dir(item);
});

// 📚 Want to learn more 📖? Go to → https://docs.apify.com/api/client/js/docs

```

## Python example

```python
from apify_client import ApifyClient

# Initialize the ApifyClient with your Apify API token
# Replace '<YOUR_API_TOKEN>' with your token.
client = ApifyClient("<YOUR_API_TOKEN>")

# Prepare the Actor input
run_input = {
    "searchStringsArray": ["restaurant"],
    "locationQuery": "New York, USA",
    "maxCrawledPlacesPerSearch": 50,
    "language": "en",
    "scrapeSocialMediaProfiles": {
        "facebooks": False,
        "instagrams": False,
        "youtubes": False,
        "tiktoks": False,
        "twitters": False,
    },
    "maximumLeadsEnrichmentRecords": 0,
    "maxCompetitorsToAnalyze": 30,
}

# Run the Actor and wait for it to finish
run = client.actor("compass/crawler-google-places").call(run_input=run_input)

# Fetch and print Actor results from the run's dataset (if there are any)
print(f"💾 Check your data here: https://console.apify.com/storage/datasets/{run.default_dataset_id}")
for item in client.dataset(run.default_dataset_id).iterate_items():
    print(item)

# 📚 Want to learn more 📖? Go to → https://docs.apify.com/api/client/python/docs/quick-start

```

## CLI example

```bash
echo '{
  "searchStringsArray": [
    "restaurant"
  ],
  "locationQuery": "New York, USA",
  "maxCrawledPlacesPerSearch": 50,
  "language": "en",
  "scrapeSocialMediaProfiles": {
    "facebooks": false,
    "instagrams": false,
    "youtubes": false,
    "tiktoks": false,
    "twitters": false
  },
  "maximumLeadsEnrichmentRecords": 0,
  "maxCompetitorsToAnalyze": 30
}' |
apify call compass/crawler-google-places --silent --output-dataset

```

## MCP server setup

```json
{
    "mcpServers": {
        "apify": {
            "type": "http",
            "url": "https://mcp.apify.com/?tools=fetch-actor-details,compass/crawler-google-places"
        }
    }
}
```

The hosted server signs you in with OAuth on first connect, so no API token belongs in this config. Clients without OAuth support can send an `Authorization: Bearer <APIFY_API_TOKEN>` header instead, using a token from API & Integrations in Apify Console (https://console.apify.com/settings/integrations).

## OpenAPI specification

Download the OpenAPI definition: https://api.apify.com/v2/actors/nwua9Gu5YrADL7ZDj/builds/EH35UvIrsV0hnZG0Y/openapi.json


---

Source: https://docs.apify.com/api/client/python/docs

# Overview

Copy for LLM

The Apify API client for Python is the official library to access the [Apify REST API](https://docs.apify.com/api/v2) from your Python applications. It provides useful features like automatic retries and convenience functions that improve the experience of using the Apify API.

The client simplifies interaction with the Apify platform by providing:

* Intuitive methods for working with [Actors](https://docs.apify.com/platform/actors), [Datasets](https://docs.apify.com/platform/storage/dataset), [Key-value stores](https://docs.apify.com/platform/storage/key-value-store), and other Apify resources
* Both synchronous and asynchronous interfaces for flexible integration
* Built-in [retries with exponential backoff](https://docs.apify.com/api/client/python/docs/concepts/retries.md) for failed requests
* Comprehensive API coverage with JSON encoding (UTF-8) for all requests and responses

## Prerequisites[](#prerequisites)

`apify-client` requires Python 3.11 or higher. Python is available for download on the [official website](https://www.python.org/downloads/). Check your current Python version by running:

```
python --version
```

## Installation[](#installation)

The Apify client is available as the `apify-client` package [on PyPI](https://pypi.org/project/apify-client/) or [on conda-forge](https://anaconda.org/conda-forge/apify-client).

* PyPI
* conda-forge

```
pip install apify-client
```

```
conda install conda-forge::apify-client
```

For better request-body compression, opt in to `brotli`, which compresses better than `gzip`, especially for large payloads. Install the optional extra:

* PyPI
* conda-forge

```
pip install "apify-client[brotli]"
```

```
conda install conda-forge::apify-client
```

For details, see [HTTP compression](https://docs.apify.com/api/client/python/docs/concepts/http-compression.md).

The client uses [Impit](https://github.com/apify/impit) as its default HTTP transport. To use the built-in [HTTPX2](https://github.com/pydantic/httpx2) transport, install the optional `httpx2` extra, which provides Pydantic's maintained continuation of HTTPX:

* PyPI
* conda-forge

```
pip install "apify-client[httpx2]"
```

```
conda install conda-forge::apify-client conda-forge::httpx2
```

For synchronous and asynchronous examples and details about the shared architecture, see [HTTP clients](https://docs.apify.com/api/client/python/docs/concepts/custom-http-clients.md).

## Quick example[](#quick-example)

The following example shows how to run an Actor and retrieve its results:

* Async client
* Sync client

```
from apify_client import ApifyClientAsync



# You can find your API token at https://console.apify.com/settings/integrations.

TOKEN = 'MY-APIFY-TOKEN'





async def main() -> None:

    apify_client = ApifyClientAsync(TOKEN)



    # Start an Actor and wait for it to finish.

    actor_client = apify_client.actor('john-doe/my-cool-actor')

    call_result = await actor_client.call()



    if call_result is None:

        print('Actor run failed.')

        return



    # Fetch results from the Actor run's default dataset.

    dataset_client = apify_client.dataset(call_result.default_dataset_id)

    list_items_result = await dataset_client.list_items()

    print(f'Dataset: {list_items_result}')
```

```
from apify_client import ApifyClient



# You can find your API token at https://console.apify.com/settings/integrations.

TOKEN = 'MY-APIFY-TOKEN'





def main() -> None:

    apify_client = ApifyClient(TOKEN)



    # Start an Actor and wait for it to finish.

    actor_client = apify_client.actor('john-doe/my-cool-actor')

    call_result = actor_client.call()



    if call_result is None:

        print('Actor run failed.')

        return



    # Fetch results from the Actor run's default dataset.

    dataset_client = apify_client.dataset(call_result.default_dataset_id)

    list_items_result = dataset_client.list_items()

    print(f'Dataset: {list_items_result}')
```

> You can find your API token in the [Integrations section](https://console.apify.com/account/integrations) of Apify Console. See the [Quick start guide](https://docs.apify.com/api/client/python/docs/introduction/quick-start.md) for more details on authentication.


---

Source: https://docs.apify.com/api/client/python/docs/introduction/quick-start

# Quick start

Copy for LLM

Learn how to authenticate, run Actors, and retrieve results using the Apify API client for Python.

***

## Step 1: Authenticate the client[](#step-1-authenticate-the-client)

To use the client, you need an [API token](https://docs.apify.com/platform/integrations/api#api-token). You can find your token under the [Integrations](https://console.apify.com/account/integrations) tab in Apify Console. Copy the token and initialize the client by providing it (`MY-APIFY-TOKEN`) as a parameter to the `ApifyClient` constructor.

* Async client
* Sync client

```
from apify_client import ApifyClientAsync



TOKEN = 'MY-APIFY-TOKEN'





async def main() -> None:

    # Client initialization with the API token.

    apify_client = ApifyClientAsync(TOKEN)
```

```
from apify_client import ApifyClient



TOKEN = 'MY-APIFY-TOKEN'





def main() -> None:

    # Client initialization with the API token.

    apify_client = ApifyClient(TOKEN)
```

Secure access

The API token is used to authorize your requests to the Apify API. You can be charged for the usage of the underlying services, so do not share your API token with untrusted parties or expose it on the client side of your applications.

## Step 2: Run an Actor[](#step-2-run-an-actor)

To start an Actor, call the [`apify_client.actor()`](https://docs.apify.com/api/client/python/reference/class/ActorClient.md) method with the Actor's ID (e.g., `john-doe/my-cool-actor`). The Actor's ID is a combination of the Actor owner's username and the Actor name. You can run both your own Actors and Actors from [Apify Store](https://apify.com/store).

To define the Actor's input, pass a dictionary to the [`call()`](https://docs.apify.com/api/client/python/reference/class/ActorClient.md#call) method that matches the Actor's [input schema](https://docs.apify.com/platform/actors/development/actor-definition/input-schema). The input can include URLs to scrape, search terms, or other configuration data.

* Async client
* Sync client

```
from apify_client import ApifyClientAsync



TOKEN = 'MY-APIFY-TOKEN'





async def main() -> None:

    apify_client = ApifyClientAsync(TOKEN)

    actor_client = apify_client.actor('username/actor-name')



    # Define the input for the Actor.

    run_input = {

        'some': 'input',

    }



    # Start an Actor and wait for it to finish.

    call_result = await actor_client.call(run_input=run_input)
```

```
from apify_client import ApifyClient



TOKEN = 'MY-APIFY-TOKEN'





def main() -> None:

    apify_client = ApifyClient(TOKEN)

    actor_client = apify_client.actor('username/actor-name')



    # Define the input for the Actor.

    run_input = {

        'some': 'input',

    }



    # Start an Actor and wait for it to finish.

    call_result = actor_client.call(run_input=run_input)
```

## Step 3: Get results from the dataset[](#step-3-get-results-from-the-dataset)

To get the results from the dataset, call the [`apify_client.dataset()`](https://docs.apify.com/api/client/python/reference/class/DatasetClient.md) method with the dataset ID, then call [`list_items()`](https://docs.apify.com/api/client/python/reference/class/DatasetClient.md#list_items) to retrieve the data. You can get the dataset ID from the `default_dataset_id` attribute of the [`Run`](https://docs.apify.com/api/client/python/reference/class/Run.md) object returned by `call()`.

* Async client
* Sync client

```
from apify_client import ApifyClientAsync



TOKEN = 'MY-APIFY-TOKEN'





async def main() -> None:

    apify_client = ApifyClientAsync(TOKEN)

    dataset_client = apify_client.dataset('dataset-id')



    # Lists items from the Actor's dataset.

    dataset_items = (await dataset_client.list_items()).items
```

```
from apify_client import ApifyClient



TOKEN = 'MY-APIFY-TOKEN'





def main() -> None:

    apify_client = ApifyClient(TOKEN)

    dataset_client = apify_client.dataset('dataset-id')



    # Lists items from the Actor's dataset.

    dataset_items = dataset_client.list_items().items
```

Dataset access

Running an Actor might take time, depending on the Actor's complexity and the amount of data it processes. If you want only to get data and have an immediate response, you should access the existing dataset of the finished [Actor run](https://docs.apify.com/platform/actors/running/runs-and-builds#runs).

## Next steps[](#next-steps)

### Concepts[](#concepts)

To learn more about how the client works, check out the Concepts section in the sidebar:

* [Asyncio support](https://docs.apify.com/api/client/python/docs/concepts/asyncio-support.md) - asynchronous programming with the client
* [Single and collection clients](https://docs.apify.com/api/client/python/docs/concepts/single-and-collection-clients.md) - resource clients and collection clients
* [Error handling](https://docs.apify.com/api/client/python/docs/concepts/error-handling.md) - automatic data extraction and error debugging
* [Retries](https://docs.apify.com/api/client/python/docs/concepts/retries.md) - automatic retries with exponential backoff
* [Pagination](https://docs.apify.com/api/client/python/docs/concepts/pagination.md) - iterating through large result sets

### Guides[](#guides)

For practical examples of common tasks, see the Guides section:

* [Pass input to an Actor](https://docs.apify.com/api/client/python/docs/guides/passing-input-to-actor.md)
* [Retrieve Actor data](https://docs.apify.com/api/client/python/docs/guides/retrieve-actor-data.md)
* [Integrate with data libraries](https://docs.apify.com/api/client/python/docs/guides/integration-with-data-libraries.md)


---

Source: https://docs.apify.com/api/client/python/docs/guides/passing-input-to-actor

# Pass input to an Actor

Copy for LLM

You can pass input data directly to the `call` method to configure and run an Actor in a single step.

The following example shows how to pass input to the `apify/instagram-hashtag-scraper` Actor and wait for it to finish.

* Async client
* Sync client

```
import asyncio

from datetime import timedelta



from apify_client import ApifyClientAsync



TOKEN = 'MY-APIFY-TOKEN'





async def main() -> None:

    # Client initialization with the API token

    apify_client = ApifyClientAsync(token=TOKEN)



    # Get the Actor client

    actor_client = apify_client.actor('apify/instagram-hashtag-scraper')



    input_data = {'hashtags': ['rainbow'], 'resultsLimit': 20}



    # Run the Actor and wait up to 60 seconds for it to finish.

    # Input is not persisted for next runs.

    run_result = await actor_client.call(

        run_input=input_data, wait_duration=timedelta(seconds=60)

    )





if __name__ == '__main__':

    asyncio.run(main())
```

```
from datetime import timedelta



from apify_client import ApifyClient



TOKEN = 'MY-APIFY-TOKEN'





def main() -> None:

    # Client initialization with the API token

    apify_client = ApifyClient(token=TOKEN)



    # Get the Actor client

    actor_client = apify_client.actor('apify/instagram-hashtag-scraper')



    input_data = {'hashtags': ['rainbow'], 'resultsLimit': 20}



    # Run the Actor and wait up to 60 seconds for it to finish.

    # Input is not persisted for next runs.

    run_result = actor_client.call(

        run_input=input_data, wait_duration=timedelta(seconds=60)

    )





if __name__ == '__main__':

    main()
```


---

Source: https://docs.apify.com/api/client/python/docs/guides/retrieve-actor-data

# Retrieve Actor data

Copy for LLM

Actor output data is stored in [datasets](https://docs.apify.com/platform/storage/dataset), which can be retrieved from individual Actor runs. Dataset items support pagination for efficient retrieval, and multiple datasets can be merged into a single dataset for further analysis. This merged dataset can then be exported into various formats such as CSV, JSON, XLSX, or XML. Additionally, [integrations](https://docs.apify.com/platform/integrations) provide powerful tools to automate data workflows.

The following example shows how to fetch datasets from an Actor's runs, paginate through their items, and merge them into a single dataset for unified analysis:

* Async client
* Sync client

```
import asyncio



from apify_client import ApifyClientAsync



TOKEN = 'MY-APIFY-TOKEN'





async def main() -> None:

    # Client initialization with the API token

    apify_client = ApifyClientAsync(token=TOKEN)

    actor_client = apify_client.actor('apify/instagram-hashtag-scraper')

    runs_client = actor_client.runs()



    # See pagination to understand how to get more datasets

    actor_datasets = await runs_client.list(limit=20)



    datasets_client = apify_client.datasets()

    merging_dataset = await datasets_client.get_or_create(name='merge-dataset')



    for dataset_item in actor_datasets.items:

        # Dataset items can be handled here. Dataset items can be paginated

        dataset_client = apify_client.dataset(dataset_item.id)

        dataset_items = await dataset_client.list_items(limit=1000)



        # Items can be pushed to single dataset

        merging_dataset_client = apify_client.dataset(merging_dataset.id)

        await merging_dataset_client.push_items(dataset_items.items)



        # ...





if __name__ == '__main__':

    asyncio.run(main())
```

```
from apify_client import ApifyClient



TOKEN = 'MY-APIFY-TOKEN'





def main() -> None:

    # Client initialization with the API token

    apify_client = ApifyClient(token=TOKEN)

    actor_client = apify_client.actor('apify/instagram-hashtag-scraper')

    runs_client = actor_client.runs()



    # See pagination to understand how to get more datasets

    actor_datasets = runs_client.list(limit=20)



    datasets_client = apify_client.datasets()

    merging_dataset = datasets_client.get_or_create(name='merge-dataset')



    for dataset_item in actor_datasets.items:

        # Dataset items can be handled here. Dataset items can be paginated

        dataset_client = apify_client.dataset(dataset_item.id)

        dataset_items = dataset_client.list_items(limit=1000)



        # Items can be pushed to single dataset

        merging_dataset_client = apify_client.dataset(merging_dataset.id)

        merging_dataset_client.push_items(dataset_items.items)



        # ...





if __name__ == '__main__':

    main()
```

## Read items while the run is going[](#read-items-while-the-run-is-going)

To process a run's output before the run finishes, use [`RunClient.iterate_dataset_items`](https://docs.apify.com/api/client/python/reference/class/RunClient.md#iterate_dataset_items). It yields the items of the run's default dataset shortly after the run pushes them, and it returns once the run has finished and every item is read.

Note that:

* Between polls, the iterator waits up to `poll_interval` (5 seconds by default) for the run to finish. Once it finishes, the iterator reads the remaining items right away. An explicit `timeout` has to leave room for that wait.
* The item options are the same as in [`DatasetClient.iterate_items`](https://docs.apify.com/api/client/python/reference/class/DatasetClient.md#iterate_items), except for `desc` and `signature`.
* `offset` and `limit` count dataset rows, not the items you get back. With `clean`, `skip_empty` or `unwind`, the iterator can yield fewer or more items than `limit`.
* A run that's `ABORTING` or `TIMING-OUT` can still push items, so the iterator keeps polling until the run reaches a terminal status.

The following example starts an Actor and prints its items as the run produces them:

* Async client
* Sync client

```
import asyncio



from apify_client import ApifyClientAsync



TOKEN = 'MY-APIFY-TOKEN'





async def main() -> None:

    apify_client = ApifyClientAsync(TOKEN)



    # Start the Actor without waiting for it to finish

    actor_client = apify_client.actor('username/actor-name')

    run = await actor_client.start(run_input={'query': 'web scraping'})



    # Each item arrives shortly after the run pushes it. The loop ends once the run

    # has finished and every item is read.

    async for item in apify_client.run(run.id).iterate_dataset_items(skip_empty=True):

        print(item)





if __name__ == '__main__':

    asyncio.run(main())
```

```
from apify_client import ApifyClient



TOKEN = 'MY-APIFY-TOKEN'





def main() -> None:

    apify_client = ApifyClient(TOKEN)



    # Start the Actor without waiting for it to finish

    actor_client = apify_client.actor('username/actor-name')

    run = actor_client.start(run_input={'query': 'web scraping'})



    # Each item arrives shortly after the run pushes it. The loop ends once the run

    # has finished and every item is read.

    for item in apify_client.run(run.id).iterate_dataset_items(skip_empty=True):

        print(item)





if __name__ == '__main__':

    main()
```


---

Source: https://docs.apify.com/api/client/python/docs/concepts/convenience-methods

# Convenience methods

Copy for LLM

The Apify client provides several convenience methods to handle actions that the API alone cannot perform efficiently, such as waiting for an Actor run to finish without running into network timeouts. These methods simplify common tasks and enhance the usability of the client.

* [`ActorClient.call`](https://docs.apify.com/api/client/python/reference/class/ActorClient.md#call) - Starts an Actor and waits for it to finish, handling network timeouts internally. Waits indefinitely by default, or up to the specified `wait_duration`.
* [`ActorClient.start`](https://docs.apify.com/api/client/python/reference/class/ActorClient.md#start) - Starts an Actor and immediately returns the Run object without waiting for it to finish.
* [`RunClient.wait_for_finish`](https://docs.apify.com/api/client/python/reference/class/RunClient.md#wait_for_finish) - Waits for an already-started run to reach a terminal status.
* [`RunClient.iterate_dataset_items`](https://docs.apify.com/api/client/python/reference/class/RunClient.md#iterate_dataset_items) - Yields the items of the run's default dataset as the run pushes them, and returns once the run has finished and every item is read.

Additionally, storage-related resources offer flexible options for data retrieval:

* [Key-value store](https://docs.apify.com/platform/storage/key-value-store) records can be retrieved as objects, buffers, or streams.
* [Dataset](https://docs.apify.com/platform/storage/dataset) items can be fetched as individual objects, serialized data, or iterated asynchronously.

- Async client
- Sync client

```
from apify_client import ApifyClientAsync



TOKEN = 'MY-APIFY-TOKEN'





async def main() -> None:

    apify_client = ApifyClientAsync(TOKEN)

    actor_client = apify_client.actor('username/actor-name')



    # Start an Actor and wait for it to finish.

    finished_actor_run = await actor_client.call()



    # Start an Actor and wait up to 60 seconds for it to finish.

    actor_run = await actor_client.start(wait_for_finish=60)
```

```
from apify_client import ApifyClient



TOKEN = 'MY-APIFY-TOKEN'





def main() -> None:

    apify_client = ApifyClient(TOKEN)

    actor_client = apify_client.actor('username/actor-name')



    # Start an Actor and wait for it to finish.

    finished_actor_run = actor_client.call()



    # Start an Actor and wait up to 60 seconds for it to finish.

    actor_run = actor_client.start(wait_for_finish=60)
```

tip

The `call()` method polls internally and may take a long time for long-running Actors. Use `start()` and `wait_for_finish()` separately if you need more control over the waiting behavior.


---

Source: https://docs.apify.com/cli/docs/installation

# Installation

Copy for LLM

Learn how to install Apify CLI.

## Installation scripts[](#installation-scripts)

Installation scripts use [Bun](https://bun.sh/) to create a standalone executable file, so you don't need Node.js.

This approach eliminates Node.js dependency management, which is useful if you're a Python developer or work in non-Node.js environments.

* MacOS/Linux
* Windows

```
curl -fsSL https://apify.com/install-cli.sh | bash
```

```
irm https://apify.com/install-cli.ps1 | iex
```

## Homebrew[](#homebrew)

Homebrew automatically installs Node.js as a dependency.

If you already have Node.js installed through another method, for example, `nvm`, it might create version conflicts. To fix it, modify your `PATH` environment variable to prioritize your preferred Node.js installation over Homebrew's version.

```
brew install apify-cli
```

## NPM[](#npm)

1. Make sure you have [Node.js](https://nodejs.org) version 22 or higher with NPM installed:

   ```
   node --version

   npm --version
   ```

2. Install or upgrade Apify CLI:

   ```
   npm install -g apify-cli
   ```

<br />

Troubleshooting

If you receive a permission error, read npm's [guide on installing packages globally](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally).

## Verify installation[](#verify-installation)

To verify the installation process, run:

```
apify --version
```

The output includes installation details, for example:

```
apify-cli/1.0.1 (0dfcfd8) running on darwin-arm64 with bun-1.2.19 (emulating node 24.3.0), installed via bundle
```

## Upgrade version[](#upgrade-version)

To upgrade Apify CLI to the latest version, run:

```
apify upgrade
```


---

Source: https://docs.apify.com/cli/docs/quick-start

# Quick start

Copy for LLM

Learn how to create, run, and deploy [Actors](https://docs.apify.com/actors) using Apify CLI.

## Before you start[](#before-you-start)

* [Install Apify CLI](https://docs.apify.com/cli/docs/installation.md).
* [Create an Apify account](https://console.apify.com/sign-up).

## 1. Create an Actor[](#1-create-an-actor)

To create an Actor, run the following command in your terminal:

```
apify create
```

The CLI then asks you for the following:

1. Name your Actor. Use lowercase letters, numbers, and hyphens.

2. Select a type of Actor to create: web scraper, AI agent, API and data pipeline, or browser automation. Let's choose **web scraper**.

3. Choose the programming language: JavaScript, TypeScript, or Python. Let's choose **JavaScript**.

4. Based on your choice, the CLI suggests Actor templates. For this tutorial, let's choose **JavaScript Cheerio crawler**.

   Explore Actor templates

   To find a template that best suits your needs, browse the [full list of templates](https://apify.com/templates).

5. Choose where to host the source code of your Actor: on Apify, GitHub, GitLab, or Bitbucket. Let's choose **Apify**.

The CLI creates a new directory with the boilerplate code and installs all project dependencies.

## 2. Run your Actor[](#2-run-your-actor)

When you run the code locally, the results of the Actor run are saved to your disk.

1. Navigate to the Actor directory:

   ```
   cd your-actor-name
   ```

2. Run your Actor:

   ```
   apify run
   ```

### View the results[](#view-the-results)

Local runs store their data in the `storage` directory:

| Path                                | Contents                                                                |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `storage/datasets/default/`         | Results the Actor added to its default dataset. One JSON file per item. |
| `storage/key_value_stores/default/` | Records the Actor read or wrote, including its input.                   |
| `storage/request_queues/default/`   | Requests the Actor enqueued.                                            |

## 3. Deploy your Actor[](#3-deploy-your-actor)

By deploying your Actor to the Apify platform, you can run your code on Apify's infrastructure, schedule runs, and monitor logs and stored data.

Deploy a Git-sourced Actor

If you chose to host the source code on GitHub, GitLab, or Bitbucket, `apify create` created the Actor on the Apify platform and connected it to your repository.

As a result, Git stores and versions your code. To deploy and build your Actor, use `git push`.

### Log in to Apify Console[](#log-in-to-apify-console)

To log in, run:

```
apify login
```

You can then choose one of the following methods:

* *(Recommended)* Sign in through the Apify Console in your browser.
* Provide an [Apify API token](https://console.apify.com/settings/integrations).

### Push your Actor to Apify[](#push-your-actor-to-apify)

To upload your Actor's source code and build it on the Apify platform, run:

```
apify push
```

The CLI creates the Actor in your account, shows the build log, and prints a link to your Actor in Apify Console when the build succeeds.

## Next steps[](#next-steps)

* For a full list of available commands, see the [command reference](https://docs.apify.com/cli/docs/reference.md).
* For details on how to automate the development process, see [Continuous integration](https://docs.apify.com/actors/development/deployment/continuous-integration).
* Once your first Actor is ready, [publish it on Apify Store](https://docs.apify.com/actors/publishing) and set up monetization to start earning.


---

Source: https://docs.apify.com/sdk/python/docs/overview

# Overview

Copy for LLM

The Apify SDK for Python is the official library for creating [Apify Actors](https://docs.apify.com/platform/actors) in Python. It provides everything you need to build an Actor and run it both locally and on the [Apify platform](https://docs.apify.com/platform). It handles the Actor lifecycle, [storage](https://docs.apify.com/platform/storage) access, platform events, [Apify Proxy](https://docs.apify.com/platform/proxy), pay-per-event charging, and more.

```
import asyncio



import httpx2

from bs4 import BeautifulSoup



from apify import Actor





async def main() -> None:

    async with Actor:

        actor_input = await Actor.get_input() or {}

        url = actor_input.get('url', 'https://apify.com')

        async with httpx2.AsyncClient() as client:

            response = await client.get(url)

        soup = BeautifulSoup(response.content, 'html.parser')

        data = {

            'url': url,

            'title': soup.title.string if soup.title else None,

        }

        await Actor.push_data(data)





if __name__ == '__main__':

    asyncio.run(main())
```

## What are Actors?[](#what-are-actors)

Actors are serverless programs that can do almost anything. From simple scripts and web scrapers to complex automation workflows, AI agents, or even always-on services that expose HTTP endpoints.

They can run either locally or on the Apify platform, where you can scale their execution, monitor runs, schedule tasks, integrate them with other services, or even publish and monetize them. If you're new to Apify, learn more about the platform in the [Apify documentation](https://docs.apify.com/platform/about).

For more context, read the [Actor whitepaper](https://whitepaper.actor/).

## Features[](#features)

* Run the full Actor lifecycle inside `async with Actor:`, covering init, exit, failures, status messages, rebooting, and metamorphing ([Actor lifecycle](https://docs.apify.com/sdk/python/docs/concepts/actor-lifecycle.md)).
* Read Actor input validated against your input schema with `Actor.get_input()`, including automatic decryption of secret fields ([Actor input](https://docs.apify.com/sdk/python/docs/concepts/actor-input.md)).
* Read and write datasets, key-value stores, and request queues, locally or on the platform ([Working with storages](https://docs.apify.com/sdk/python/docs/concepts/storages.md)).
* React to platform events such as system info, migration, and abort, and persist state across migrations and restarts ([Actor events](https://docs.apify.com/sdk/python/docs/concepts/actor-events.md)).
* Route requests through Apify Proxy with group selection, country targeting, and rotation, with session and tiered-proxy support ([Proxy management](https://docs.apify.com/sdk/python/docs/concepts/proxy-management.md)).
* Start, call, and abort other Actors and tasks, and attach webhooks to run events ([Interacting with other Actors](https://docs.apify.com/sdk/python/docs/concepts/interacting-with-other-actors.md), [Webhooks](https://docs.apify.com/sdk/python/docs/concepts/webhooks.md)).
* Monetize your Actor with pay-per-event charging ([Pay-per-event](https://docs.apify.com/sdk/python/docs/concepts/pay-per-event.md)).
* Reach the full [Apify API](https://docs.apify.com/api/v2) through a preconfigured `ApifyClient` ([Accessing the Apify API](https://docs.apify.com/sdk/python/docs/concepts/access-apify-api.md)).

## What you can build[](#what-you-can-build)

Almost any Python project can become an Actor, including projects for:

* **Web scraping and crawling** - The SDK is fully compatible with [Crawlee](https://crawlee.dev/python), which makes Apify a natural place to deploy and scale your crawlers (see the [Crawlee guide](https://docs.apify.com/sdk/python/docs/guides/crawlee.md)). It also works with other popular scraping libraries, such as [Scrapy](https://docs.apify.com/sdk/python/docs/guides/scrapy.md), [Scrapling](https://docs.apify.com/sdk/python/docs/guides/scrapling.md), or [Crawl4AI](https://docs.apify.com/sdk/python/docs/guides/crawl4ai.md).
* **Browser automation** - Drive a real browser with [Playwright](https://docs.apify.com/sdk/python/docs/guides/playwright.md) or [Selenium](https://docs.apify.com/sdk/python/docs/guides/selenium.md), or with higher-level tools such as [Browser Use](https://docs.apify.com/sdk/python/docs/guides/browser-use.md).
* **Web servers and APIs** - Run a [web server](https://docs.apify.com/sdk/python/docs/guides/running-webserver.md) inside an Actor to serve HTTP requests, for example to expose your scraper as a live API.
* **AI agents** - Host agents built with your framework of choice (see the [AI agents guide](https://docs.apify.com/sdk/python/docs/guides/ai-agents.md)). Ready-made Actor templates cover [LangGraph](https://apify.com/templates/python-langgraph), [CrewAI](https://apify.com/templates/python-crewai), [PydanticAI](https://apify.com/templates/python-pydanticai), [LlamaIndex](https://apify.com/templates/python-llamaindex-agent), and [Smolagents](https://apify.com/templates/python-smolagents).
* **MCP servers** - Deploy a Python MCP server as an Actor and make its tools available to any MCP client (see the [MCP servers guide](https://docs.apify.com/sdk/python/docs/guides/mcp-servers.md)). Ready-made Actor templates cover the [MCP server](https://apify.com/templates/python-mcp-empty) and [MCP proxy](https://apify.com/templates/python-mcp-proxy).

Whatever you build, the Apify SDK doesn't lock you into a particular framework. Bring the libraries you already use, and let Apify run your project in the cloud.

## Quick start[](#quick-start)

To create and run Actors using Apify Console, check out [Apify Console documentation](https://docs.apify.com/platform/console). For creating and running Python Actors locally, refer to the [quick start guide](https://docs.apify.com/sdk/python/docs/quick-start.md).

Explore the Guides section in the sidebar for a deeper understanding of the SDK's features and best practices.

## Installation[](#installation)

The Apify SDK for Python requires Python version 3.11 or above. It is typically installed when you create a new Actor project using the [Apify CLI](https://docs.apify.com/cli). To install it manually in an existing project, use:

```
pip install apify
```

API client alternative

If you need to interact with the Apify API programmatically without creating Actors, use the [Apify API client for Python](https://docs.apify.com/api/client/python) instead.


---

Source: https://docs.apify.com/sdk/python/docs/quick-start

# Quick start

Copy for LLM

Learn how to create and run Actors using the Apify SDK for Python.

***

<!-- -->

<!-- -->

## Step 1: Create Actors[](#step-1-create-actors)

To create and run Actors in [Apify Console](https://docs.apify.com/platform/console), refer to the [Console documentation](https://docs.apify.com/platform/actors/development/quick-start/web-ide).

To create a new Apify Actor on your computer, you can use the [Apify CLI](https://docs.apify.com/sdk/python/cli), and select one of the [Python Actor templates](https://apify.com/templates?category=python).

For example, to create an Actor from the "Getting started with Python" template, you can use the [`apify create` command](https://docs.apify.com/sdk/python/cli/docs/reference#apify-create-actorname).

```
apify create my-first-actor --template python-start
```

This will create a new folder called `my-first-actor`, download and extract the "Getting started with Python" Actor template there, create a virtual environment in `my-first-actor/.venv`, and install the Actor dependencies in it.

![actor create command run](/sdk/python/assets/images/apify-create-24c1fe5b3ac9fe16a87f7fa00731f303.gif)

## Step 2: Run Actors[](#step-2-run-actors)

To run the Actor, you can use the [`apify run` command](https://docs.apify.com/sdk/python/cli/docs/reference#apify-run):

```
cd my-first-actor

apify run
```

This command:

* Activates the virtual environment in `.venv` (if no other virtual environment is activated yet)
* Starts the Actor with the appropriate environment variables for local running
* Configures it to use local storages from the `storage` folder

The Actor input, for example, will be in `storage/key_value_stores/default/INPUT.json`.

## Step 3: Understand Actor structure[](#step-3-understand-actor-structure)

All Python Actor templates follow the same structure.

The `.actor` directory contains the [Actor configuration](https://docs.apify.com/platform/actors/development/actor-config), such as the Actor's definition and input schema, and the Dockerfile necessary to run the Actor on the Apify platform.

The Actor's runtime dependencies are specified in the `requirements.txt` file, which follows the [standard requirements file format](https://pip.pypa.io/en/stable/reference/requirements-file-format/).

The Actor's source code is in the `src` folder. This folder contains two important files:

* `main.py` - which contains the main function of the Actor
* `__main__.py` - which is the entrypoint of the Actor package, executing the Actor's main function via [`asyncio.run()`](https://docs.python.org/3/library/asyncio-runner.html#asyncio.run).

- main.py
- \_\_main\_\_.py

```
from apify import Actor





async def main() -> None:

    async with Actor:

        actor_input = await Actor.get_input()

        Actor.log.info('Actor input: %s', actor_input)

        await Actor.set_value('OUTPUT', 'Hello, world!')
```

```
import asyncio



from .main import main



if __name__ == '__main__':

    asyncio.run(main())
```

If you want to modify the Actor structure, you need to make sure that your Actor is executable as a module, via `python -m src`, as that is the command started by `apify run` in the Apify CLI. We recommend keeping the entrypoint for the Actor in the `src/__main__.py` file.

## Next steps[](#next-steps)

Now that you can create and run an Actor locally, explore the rest of the SDK's features and its framework integrations.

### Concepts[](#concepts)

To learn more about the features of the Apify SDK and how to use them, check out the Concepts section in the sidebar:

* [Actor lifecycle](https://docs.apify.com/sdk/python/docs/concepts/actor-lifecycle.md)
* [Actor input](https://docs.apify.com/sdk/python/docs/concepts/actor-input.md)
* [Storages](https://docs.apify.com/sdk/python/docs/concepts/storages.md)
* [Actor events & state persistence](https://docs.apify.com/sdk/python/docs/concepts/actor-events.md)
* [Proxy management](https://docs.apify.com/sdk/python/docs/concepts/proxy-management.md)
* [Interacting with other Actors](https://docs.apify.com/sdk/python/docs/concepts/interacting-with-other-actors.md)
* [Creating webhooks](https://docs.apify.com/sdk/python/docs/concepts/webhooks.md)
* [Accessing Apify API](https://docs.apify.com/sdk/python/docs/concepts/access-apify-api.md)
* [Logging](https://docs.apify.com/sdk/python/docs/concepts/logging.md)
* [Actor configuration](https://docs.apify.com/sdk/python/docs/concepts/actor-configuration.md)
* [Pay-per-event monetization](https://docs.apify.com/sdk/python/docs/concepts/pay-per-event.md)
* [Storage clients](https://docs.apify.com/sdk/python/docs/concepts/storage-clients.md)

### Guides[](#guides)

To see how you can integrate the Apify SDK with popular scraping libraries and frameworks, check out these guides:

* [Scraping with BeautifulSoup and HTTPX2](https://docs.apify.com/sdk/python/docs/guides/beautifulsoup-httpx.md)
* [Scraping with Parsel and Impit](https://docs.apify.com/sdk/python/docs/guides/parsel-impit.md)
* [Browser automation with Playwright](https://docs.apify.com/sdk/python/docs/guides/playwright.md)
* [Browser automation with Selenium](https://docs.apify.com/sdk/python/docs/guides/selenium.md)
* [Building crawlers with Crawlee](https://docs.apify.com/sdk/python/docs/guides/crawlee.md)
* [Building crawlers with Scrapy](https://docs.apify.com/sdk/python/docs/guides/scrapy.md)
* [Adaptive scraping with Scrapling](https://docs.apify.com/sdk/python/docs/guides/scrapling.md)
* [LLM-ready scraping with Crawl4AI](https://docs.apify.com/sdk/python/docs/guides/crawl4ai.md)
* [Browser AI agents with Browser Use](https://docs.apify.com/sdk/python/docs/guides/browser-use.md)
* [Hosting AI agents](https://docs.apify.com/sdk/python/docs/guides/ai-agents.md)

For other aspects of Actor development, explore these guides:

* [Project management with uv](https://docs.apify.com/sdk/python/docs/guides/uv.md)
* [Input validation with Pydantic](https://docs.apify.com/sdk/python/docs/guides/input-validation.md)
* [Running a web server](https://docs.apify.com/sdk/python/docs/guides/running-webserver.md)
* [Building MCP servers](https://docs.apify.com/sdk/python/docs/guides/mcp-servers.md)


---

Source: https://docs.apify.com/sdk/python/docs/concepts/actor-lifecycle

# Actor lifecycle

Copy for LLM

This guide explains how an **Apify Actor** starts, runs, and shuts down, describing the complete Actor lifecycle. For information about the core concepts such as Actors, the [Apify Console](https://docs.apify.com/platform/console), storages, and events, check out the [Apify platform documentation](https://docs.apify.com/platform).

## Actor initialization[](#actor-initialization)

During initialization, the SDK prepares all the components required to integrate with the Apify platform. It loads configuration from environment variables, initializes access to platform storages such as the [key-value store, dataset, and request queue](https://docs.apify.com/platform/storage), sets up event handling for [platform events](https://docs.apify.com/platform/integrations/webhooks/events), and configures logging.

The recommended approach in Python is to use the global [`Actor`](https://docs.apify.com/sdk/python/reference/class/Actor.md) class as an asynchronous context manager. This approach automatically manages setup and teardown and keeps your code concise. When entering the context, the SDK loads configuration and initializes clients lazily—for example, a dataset is opened only when it is first accessed. If the Actor runs on the Apify platform, it also begins listening for platform events.

When the Actor exits, either normally or due to an exception, the SDK performs a graceful shutdown. It persists the final Actor state, stops event handling, and sets the terminal exit code together with the [status message](https://docs.apify.com/platform/actors/development/programming-interface/status-messages).

* Actor class with context manager
* Actor class with manual init/exit

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGFzeW5jIHdpdGggQWN0b3I6XFxuICAgICAgICAjIEdldCBpbnB1dFxcbiAgICAgICAgYWN0b3JfaW5wdXQgPSBhd2FpdCBBY3Rvci5nZXRfaW5wdXQoKVxcbiAgICAgICAgQWN0b3IubG9nLmluZm8oJ0FjdG9yIGlucHV0OiAlcycsIGFjdG9yX2lucHV0KVxcblxcbiAgICAgICAgIyBZb3VyIEFjdG9yIGxvZ2ljIGhlcmVcXG4gICAgICAgIGRhdGEgPSB7J21lc3NhZ2UnOiAnSGVsbG8gZnJvbSBBY3RvciEnLCAnaW5wdXQnOiBhY3Rvcl9pbnB1dH1cXG4gICAgICAgIGF3YWl0IEFjdG9yLnB1c2hfZGF0YShkYXRhKVxcblxcbiAgICAgICAgIyBTZXQgc3RhdHVzIG1lc3NhZ2VcXG4gICAgICAgIGF3YWl0IEFjdG9yLnNldF9zdGF0dXNfbWVzc2FnZSgnQWN0b3IgY29tcGxldGVkIHN1Y2Nlc3NmdWxseScpXFxuXFxuXFxuaWYgX19uYW1lX18gPT0gJ19fbWFpbl9fJzpcXG4gICAgYXN5bmNpby5ydW4obWFpbigpKVxcblwifSIsIm9wdGlvbnMiOnsiYnVpbGQiOiJsYXRlc3QiLCJjb250ZW50VHlwZSI6ImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLTgiLCJtZW1vcnkiOjEwMjQsInRpbWVvdXQiOjE4MH19.dfnZ3EM-6xRFUTvMWT1esehu2-lA2PZJmoLBc7BBtgQ\&asrc=run_on_apify)

```
import asyncio



from apify import Actor





async def main() -> None:

    async with Actor:

        # Get input

        actor_input = await Actor.get_input()

        Actor.log.info('Actor input: %s', actor_input)



        # Your Actor logic here

        data = {'message': 'Hello from Actor!', 'input': actor_input}

        await Actor.push_data(data)



        # Set status message

        await Actor.set_status_message('Actor completed successfully')





if __name__ == '__main__':

    asyncio.run(main())
```

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGF3YWl0IEFjdG9yLmluaXQoKVxcblxcbiAgICB0cnk6XFxuICAgICAgICAjIEdldCBpbnB1dFxcbiAgICAgICAgYWN0b3JfaW5wdXQgPSBhd2FpdCBBY3Rvci5nZXRfaW5wdXQoKVxcbiAgICAgICAgQWN0b3IubG9nLmluZm8oJ0FjdG9yIGlucHV0OiAlcycsIGFjdG9yX2lucHV0KVxcblxcbiAgICAgICAgIyBZb3VyIEFjdG9yIGxvZ2ljIGhlcmVcXG4gICAgICAgIGRhdGEgPSB7J21lc3NhZ2UnOiAnSGVsbG8gZnJvbSBBY3RvciEnLCAnaW5wdXQnOiBhY3Rvcl9pbnB1dH1cXG4gICAgICAgIGF3YWl0IEFjdG9yLnB1c2hfZGF0YShkYXRhKVxcblxcbiAgICAgICAgIyBTZXQgc3RhdHVzIG1lc3NhZ2VcXG4gICAgICAgIGF3YWl0IEFjdG9yLnNldF9zdGF0dXNfbWVzc2FnZSgnQWN0b3IgY29tcGxldGVkIHN1Y2Nlc3NmdWxseScpXFxuXFxuICAgIGZpbmFsbHk6XFxuICAgICAgICBhd2FpdCBBY3Rvci5leGl0KClcXG5cXG5cXG5pZiBfX25hbWVfXyA9PSAnX19tYWluX18nOlxcbiAgICBhc3luY2lvLnJ1bihtYWluKCkpXFxuXCJ9Iiwib3B0aW9ucyI6eyJidWlsZCI6ImxhdGVzdCIsImNvbnRlbnRUeXBlIjoiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCIsIm1lbW9yeSI6MTAyNCwidGltZW91dCI6MTgwfX0.fJ1NUD4sv032YWP2SK67VLTacs5vHpqMgqr5Gr3-c3o\&asrc=run_on_apify)

```
import asyncio



from apify import Actor





async def main() -> None:

    await Actor.init()



    try:

        # Get input

        actor_input = await Actor.get_input()

        Actor.log.info('Actor input: %s', actor_input)



        # Your Actor logic here

        data = {'message': 'Hello from Actor!', 'input': actor_input}

        await Actor.push_data(data)



        # Set status message

        await Actor.set_status_message('Actor completed successfully')



    finally:

        await Actor.exit()





if __name__ == '__main__':

    asyncio.run(main())
```

You can also create an [`Actor`](https://docs.apify.com/sdk/python/reference/class/Actor.md) instance directly. This does not change its capabilities but allows you to specify optional parameters during initialization. The key parameters are:

* `configuration` — a custom [`Configuration`](https://docs.apify.com/sdk/python/reference/class/Configuration.md) instance to control storage paths, API URLs, and other settings.
* `configure_logging` — whether to set up default logging configuration (default `True`). Set to `False` if you configure logging yourself.
* `exit_process` — whether the Actor calls `sys.exit()` when the context manager exits. Defaults to `True`, except in IPython and Scrapy environments.
* `event_listeners_timeout` — maximum time to wait for Actor event listeners to complete before exiting.
* `cleanup_timeout` — maximum time to wait for cleanup tasks to finish (default 30 seconds).

The choice between using a context manager or manual initialization depends on how much control you require over the Actor's startup and shutdown sequence.

* Actor instance with context manager
* Actor instance with manual init/exit

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuZnJvbSBkYXRldGltZSBpbXBvcnQgdGltZWRlbHRhXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGFjdG9yID0gQWN0b3IoXFxuICAgICAgICBldmVudF9saXN0ZW5lcnNfdGltZW91dD10aW1lZGVsdGEoc2Vjb25kcz0zMCksXFxuICAgICAgICBjbGVhbnVwX3RpbWVvdXQ9dGltZWRlbHRhKHNlY29uZHM9MzApLFxcbiAgICApXFxuXFxuICAgIGFzeW5jIHdpdGggYWN0b3I6XFxuICAgICAgICAjIEdldCBpbnB1dFxcbiAgICAgICAgYWN0b3JfaW5wdXQgPSBhd2FpdCBhY3Rvci5nZXRfaW5wdXQoKVxcbiAgICAgICAgYWN0b3IubG9nLmluZm8oJ0FjdG9yIGlucHV0OiAlcycsIGFjdG9yX2lucHV0KVxcblxcbiAgICAgICAgIyBZb3VyIEFjdG9yIGxvZ2ljIGhlcmVcXG4gICAgICAgIGRhdGEgPSB7J21lc3NhZ2UnOiAnSGVsbG8gZnJvbSBBY3RvciBpbnN0YW5jZSEnLCAnaW5wdXQnOiBhY3Rvcl9pbnB1dH1cXG4gICAgICAgIGF3YWl0IGFjdG9yLnB1c2hfZGF0YShkYXRhKVxcblxcbiAgICAgICAgIyBTZXQgc3RhdHVzIG1lc3NhZ2VcXG4gICAgICAgIGF3YWl0IGFjdG9yLnNldF9zdGF0dXNfbWVzc2FnZSgnQWN0b3IgY29tcGxldGVkIHN1Y2Nlc3NmdWxseScpXFxuXFxuXFxuaWYgX19uYW1lX18gPT0gJ19fbWFpbl9fJzpcXG4gICAgYXN5bmNpby5ydW4obWFpbigpKVxcblwifSIsIm9wdGlvbnMiOnsiYnVpbGQiOiJsYXRlc3QiLCJjb250ZW50VHlwZSI6ImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLTgiLCJtZW1vcnkiOjEwMjQsInRpbWVvdXQiOjE4MH19.cA8xIbeHNMk88004brHmb9qQGAwxdwuD-BrHZzRAU1A\&asrc=run_on_apify)

```
import asyncio

from datetime import timedelta



from apify import Actor





async def main() -> None:

    actor = Actor(

        event_listeners_timeout=timedelta(seconds=30),

        cleanup_timeout=timedelta(seconds=30),

    )



    async with actor:

        # Get input

        actor_input = await actor.get_input()

        actor.log.info('Actor input: %s', actor_input)



        # Your Actor logic here

        data = {'message': 'Hello from Actor instance!', 'input': actor_input}

        await actor.push_data(data)



        # Set status message

        await actor.set_status_message('Actor completed successfully')





if __name__ == '__main__':

    asyncio.run(main())
```

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuZnJvbSBkYXRldGltZSBpbXBvcnQgdGltZWRlbHRhXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGFjdG9yID0gQWN0b3IoXFxuICAgICAgICBldmVudF9saXN0ZW5lcnNfdGltZW91dD10aW1lZGVsdGEoc2Vjb25kcz0zMCksXFxuICAgICAgICBjbGVhbnVwX3RpbWVvdXQ9dGltZWRlbHRhKHNlY29uZHM9MzApLFxcbiAgICApXFxuXFxuICAgIGF3YWl0IGFjdG9yLmluaXQoKVxcblxcbiAgICB0cnk6XFxuICAgICAgICAjIEdldCBpbnB1dFxcbiAgICAgICAgYWN0b3JfaW5wdXQgPSBhd2FpdCBhY3Rvci5nZXRfaW5wdXQoKVxcbiAgICAgICAgYWN0b3IubG9nLmluZm8oJ0FjdG9yIGlucHV0OiAlcycsIGFjdG9yX2lucHV0KVxcblxcbiAgICAgICAgIyBZb3VyIEFjdG9yIGxvZ2ljIGhlcmVcXG4gICAgICAgIGRhdGEgPSB7J21lc3NhZ2UnOiAnSGVsbG8gZnJvbSBBY3RvciEnLCAnaW5wdXQnOiBhY3Rvcl9pbnB1dH1cXG4gICAgICAgIGF3YWl0IGFjdG9yLnB1c2hfZGF0YShkYXRhKVxcblxcbiAgICAgICAgIyBTZXQgc3RhdHVzIG1lc3NhZ2VcXG4gICAgICAgIGF3YWl0IGFjdG9yLnNldF9zdGF0dXNfbWVzc2FnZSgnQWN0b3IgY29tcGxldGVkIHN1Y2Nlc3NmdWxseScpXFxuXFxuICAgIGZpbmFsbHk6XFxuICAgICAgICBhd2FpdCBhY3Rvci5leGl0KClcXG5cXG5cXG5pZiBfX25hbWVfXyA9PSAnX19tYWluX18nOlxcbiAgICBhc3luY2lvLnJ1bihtYWluKCkpXFxuXCJ9Iiwib3B0aW9ucyI6eyJidWlsZCI6ImxhdGVzdCIsImNvbnRlbnRUeXBlIjoiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCIsIm1lbW9yeSI6MTAyNCwidGltZW91dCI6MTgwfX0.DleIoDi4ZIZlj9zzVKVeoxceUOz4n7wr4QNv0DJlb7E\&asrc=run_on_apify)

```
import asyncio

from datetime import timedelta



from apify import Actor





async def main() -> None:

    actor = Actor(

        event_listeners_timeout=timedelta(seconds=30),

        cleanup_timeout=timedelta(seconds=30),

    )



    await actor.init()



    try:

        # Get input

        actor_input = await actor.get_input()

        actor.log.info('Actor input: %s', actor_input)



        # Your Actor logic here

        data = {'message': 'Hello from Actor!', 'input': actor_input}

        await actor.push_data(data)



        # Set status message

        await actor.set_status_message('Actor completed successfully')



    finally:

        await actor.exit()





if __name__ == '__main__':

    asyncio.run(main())
```

## Error handling[](#error-handling)

Good error handling lets your Actor fail fast on critical errors, retry transient issues safely, and keep data consistent. Normally you rely on the `async with Actor:` block—if it finishes, the run succeeds (exit code 0); if an unhandled exception occurs, the run fails (exit code 91).

The SDK provides helper methods for explicit control:

* [`Actor.exit`](https://docs.apify.com/sdk/python/reference/class/Actor.md#exit) - terminates the run successfully (default exit code 0).
* [`Actor.fail`](https://docs.apify.com/sdk/python/reference/class/Actor.md#fail) - marks the run as failed (default exit code 1).

Any non-zero exit code is treated as a `FAILED` run. You rarely need to call these methods directly unless you want to perform a controlled shutdown or customize the exit behavior.

Catch exceptions only when necessary - for example, to retry network timeouts or map specific errors to exit codes. Keep retry loops bounded with backoff and re-raise once exhausted. Make your processing idempotent so that restarts don't corrupt results. Both [`Actor.exit`](https://docs.apify.com/sdk/python/reference/class/Actor.md#exit) and [`Actor.fail`](https://docs.apify.com/sdk/python/reference/class/Actor.md#fail) perform the same cleanup, so complete any long-running persistence before calling them.

Below is a minimal context-manager example where an unhandled exception automatically fails the run, followed by a manual pattern giving you more control.

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGFzeW5jIHdpdGggQWN0b3I6XFxuICAgICAgICAjIEFueSB1bmhhbmRsZWQgZXhjZXB0aW9uIHRyaWdnZXJzIEFjdG9yLmZhaWwoKSBhdXRvbWF0aWNhbGx5XFxuICAgICAgICByYWlzZSBSdW50aW1lRXJyb3IoJ0Jvb20nKVxcblxcblxcbmlmIF9fbmFtZV9fID09ICdfX21haW5fXyc6XFxuICAgIGFzeW5jaW8ucnVuKG1haW4oKSlcXG5cIn0iLCJvcHRpb25zIjp7ImJ1aWxkIjoibGF0ZXN0IiwiY29udGVudFR5cGUiOiJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04IiwibWVtb3J5IjoxMDI0LCJ0aW1lb3V0IjoxODB9fQ.tsWHKk9HL-cEP63gyZO5gCvcfsjYgA4J7JPEYEnKwyg\&asrc=run_on_apify)

```
import asyncio



from apify import Actor





async def main() -> None:

    async with Actor:

        # Any unhandled exception triggers Actor.fail() automatically

        raise RuntimeError('Boom')





if __name__ == '__main__':

    asyncio.run(main())
```

If you need explicit control over exit codes or status messages, you can manage the Actor manually using [`Actor.init`](https://docs.apify.com/sdk/python/reference/class/Actor.md#init), [`Actor.exit`](https://docs.apify.com/sdk/python/reference/class/Actor.md#exit), and [`Actor.fail`](https://docs.apify.com/sdk/python/reference/class/Actor.md#fail).

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuaW1wb3J0IHJhbmRvbVxcblxcbmZyb20gYXBpZnkgaW1wb3J0IEFjdG9yXFxuXFxuXFxuYXN5bmMgZGVmIGRvX3dvcmsoKSAtPiBOb25lOlxcbiAgICAjIFNpbXVsYXRlIHJhbmRvbSBvdXRjb21lczogc3VjY2VzcyBvciBvbmUgb2YgdHdvIGV4Y2VwdGlvbiB0eXBlcy5cXG4gICAgb3V0Y29tZSA9IHJhbmRvbS5yYW5kb20oKVxcblxcbiAgICBpZiBvdXRjb21lIDwgMC4zMzpcXG4gICAgICAgIHJhaXNlIFZhbHVlRXJyb3IoJ0ludmFsaWQgaW5wdXQgZGF0YSBlbmNvdW50ZXJlZCcpXFxuICAgIGlmIG91dGNvbWUgPCAwLjY2OlxcbiAgICAgICAgcmFpc2UgUnVudGltZUVycm9yKCdVbmV4cGVjdGVkIHJ1bnRpbWUgZmFpbHVyZScpXFxuXFxuICAgICMgU2ltdWxhdGUgc3VjY2Vzc2Z1bCB3b3JrXFxuICAgIEFjdG9yLmxvZy5pbmZvKCdXb3JrIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHknKVxcblxcblxcbmFzeW5jIGRlZiBtYWluKCkgLT4gTm9uZTpcXG4gICAgYXdhaXQgQWN0b3IuaW5pdCgpXFxuICAgIHRyeTpcXG4gICAgICAgIGF3YWl0IGRvX3dvcmsoKVxcbiAgICBleGNlcHQgVmFsdWVFcnJvciBhcyBleGM6ICAjIFNwZWNpZmljIGVycm9yIG1hcHBpbmcgZXhhbXBsZVxcbiAgICAgICAgYXdhaXQgQWN0b3IuZmFpbChleGl0X2NvZGU9MTAsIGV4Y2VwdGlvbj1leGMpXFxuICAgIGV4Y2VwdCBFeGNlcHRpb24gYXMgZXhjOiAgIyBDYXRjaC1hbGwgZm9yIHVuZXhwZWN0ZWQgZXJyb3JzXFxuICAgICAgICBhd2FpdCBBY3Rvci5mYWlsKGV4aXRfY29kZT05MSwgZXhjZXB0aW9uPWV4YylcXG4gICAgZWxzZTpcXG4gICAgICAgIGF3YWl0IEFjdG9yLmV4aXQoc3RhdHVzX21lc3NhZ2U9J0FjdG9yIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHknKVxcblxcblxcbmlmIF9fbmFtZV9fID09ICdfX21haW5fXyc6XFxuICAgIGFzeW5jaW8ucnVuKG1haW4oKSlcXG5cIn0iLCJvcHRpb25zIjp7ImJ1aWxkIjoibGF0ZXN0IiwiY29udGVudFR5cGUiOiJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04IiwibWVtb3J5IjoxMDI0LCJ0aW1lb3V0IjoxODB9fQ.v-eAp4iKOiRP5t_jeg4MaXzUONdmxs_7xM5uZAErtj8\&asrc=run_on_apify)

```
import asyncio

import random



from apify import Actor





async def do_work() -> None:

    # Simulate random outcomes: success or one of two exception types.

    outcome = random.random()



    if outcome < 0.33:

        raise ValueError('Invalid input data encountered')

    if outcome < 0.66:

        raise RuntimeError('Unexpected runtime failure')



    # Simulate successful work

    Actor.log.info('Work completed successfully')





async def main() -> None:

    await Actor.init()

    try:

        await do_work()

    except ValueError as exc:  # Specific error mapping example

        await Actor.fail(exit_code=10, exception=exc)

    except Exception as exc:  # Catch-all for unexpected errors

        await Actor.fail(exit_code=91, exception=exc)

    else:

        await Actor.exit(status_message='Actor completed successfully')





if __name__ == '__main__':

    asyncio.run(main())
```

## Reboot[](#reboot)

Rebooting (available on the Apify platform only) instructs the platform worker to restart your Actor from the beginning of its execution. Use this mechanism only for transient conditions that are likely to resolve after a fresh start — for example, rotating a blocked proxy pool or recovering from a stuck browser environment.

Before triggering a reboot, persist any essential state externally (e.g., to the key-value store or dataset), as all in-memory data is lost after reboot. The example below tracks a reboot counter in the default key-value store and allows at most three restarts before exiting normally.

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGFzeW5jIHdpdGggQWN0b3I6XFxuICAgICAgICAjIFVzZSB0aGUgS1ZTIHRvIHBlcnNpc3QgYSBzaW1wbGUgcmVib290IGNvdW50ZXIgYWNyb3NzIHJlc3RhcnRzLlxcbiAgICAgICAga3ZzID0gYXdhaXQgQWN0b3Iub3Blbl9rZXlfdmFsdWVfc3RvcmUoKVxcbiAgICAgICAgcmVib290X2NvdW50ZXIgPSBhd2FpdCBrdnMuZ2V0X3ZhbHVlKCdyZWJvb3RfY291bnRlcicsIDApXFxuXFxuICAgICAgICAjIExpbWl0IHRoZSBudW1iZXIgb2YgcmVib290cyB0byBhdm9pZCBpbmZpbml0ZSBsb29wcy5cXG4gICAgICAgIGlmIHJlYm9vdF9jb3VudGVyIDwgMzpcXG4gICAgICAgICAgICBhd2FpdCBrdnMuc2V0X3ZhbHVlKCdyZWJvb3RfY291bnRlcicsIHJlYm9vdF9jb3VudGVyICsgMSlcXG4gICAgICAgICAgICBBY3Rvci5sb2cuaW5mbyhmJ1JlYm9vdCBhdHRlbXB0IHtyZWJvb3RfY291bnRlciArIDF9LzMnKVxcbiAgICAgICAgICAgICMgVHJpZ2dlciBhIHBsYXRmb3JtIHJlYm9vdDsgYWZ0ZXIgcmVzdGFydCB0aGUgY29kZSBydW5zIGZyb20gdGhlIGJlZ2lubmluZy5cXG4gICAgICAgICAgICBhd2FpdCBBY3Rvci5yZWJvb3QoKVxcblxcbiAgICAgICAgQWN0b3IubG9nLmluZm8oJ1JlYm9vdCBsaW1pdCByZWFjaGVkLCBmaW5pc2hpbmcgcnVuJylcXG5cXG5cXG5pZiBfX25hbWVfXyA9PSAnX19tYWluX18nOlxcbiAgICBhc3luY2lvLnJ1bihtYWluKCkpXFxuXCJ9Iiwib3B0aW9ucyI6eyJidWlsZCI6ImxhdGVzdCIsImNvbnRlbnRUeXBlIjoiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCIsIm1lbW9yeSI6MTAyNCwidGltZW91dCI6MTgwfX0.zkUzAz4PtCnAuT1nWbo-0HRIvzObMn-69-lX2N96_G0\&asrc=run_on_apify)

```
import asyncio



from apify import Actor





async def main() -> None:

    async with Actor:

        # Use the KVS to persist a simple reboot counter across restarts.

        kvs = await Actor.open_key_value_store()

        reboot_counter = await kvs.get_value('reboot_counter', 0)



        # Limit the number of reboots to avoid infinite loops.

        if reboot_counter < 3:

            await kvs.set_value('reboot_counter', reboot_counter + 1)

            Actor.log.info(f'Reboot attempt {reboot_counter + 1}/3')

            # Trigger a platform reboot; after restart the code runs from the beginning.

            await Actor.reboot()



        Actor.log.info('Reboot limit reached, finishing run')





if __name__ == '__main__':

    asyncio.run(main())
```

## Status message[](#status-message)

[Status messages](https://docs.apify.com/platform/actors/development/programming-interface/status-messages) are lightweight, human-readable progress indicators displayed with the Actor run in Apify Console. Use them to communicate high-level phases or milestones, such as "Fetching list", "Processed 120/500 pages", or "Uploading results". When running locally, the SDK logs the status message instead of sending it to the platform.

Update the status only when the user's understanding of progress changes - avoid frequent updates for every processed item. Detailed information should go to logs or storages (dataset, key-value store) instead.

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGFzeW5jIHdpdGggQWN0b3I6XFxuICAgICAgICBhd2FpdCBBY3Rvci5zZXRfc3RhdHVzX21lc3NhZ2UoJ0hlcmUgd2UgZ28hJylcXG4gICAgICAgICMgRG8gc29tZSB3b3JrLi4uXFxuICAgICAgICBhd2FpdCBhc3luY2lvLnNsZWVwKDMpXFxuICAgICAgICBhd2FpdCBBY3Rvci5zZXRfc3RhdHVzX21lc3NhZ2UoJ1NvIGZhciBzbyBnb29kLi4uJylcXG4gICAgICAgIGF3YWl0IGFzeW5jaW8uc2xlZXAoMylcXG4gICAgICAgICMgRG8gc29tZSBtb3JlIHdvcmsuLi5cXG4gICAgICAgIGF3YWl0IEFjdG9yLnNldF9zdGF0dXNfbWVzc2FnZSgnU3RlYWR5IGFzIHNoZSBnb2VzLi4uJylcXG4gICAgICAgIGF3YWl0IGFzeW5jaW8uc2xlZXAoMylcXG4gICAgICAgICMgRG8gZXZlbiBtb3JlIHdvcmsuLi5cXG4gICAgICAgIGF3YWl0IEFjdG9yLnNldF9zdGF0dXNfbWVzc2FnZSgnQWxtb3N0IHRoZXJlLi4uJylcXG4gICAgICAgIGF3YWl0IGFzeW5jaW8uc2xlZXAoMylcXG4gICAgICAgICMgRmluaXNoIHRoZSBqb2JcXG4gICAgICAgIGF3YWl0IEFjdG9yLnNldF9zdGF0dXNfbWVzc2FnZSgnUGhldyEgVGhhdCB3YXMgbm90IHRoYXQgaGFyZCEnKVxcblxcblxcbmlmIF9fbmFtZV9fID09ICdfX21haW5fXyc6XFxuICAgIGFzeW5jaW8ucnVuKG1haW4oKSlcXG5cIn0iLCJvcHRpb25zIjp7ImJ1aWxkIjoibGF0ZXN0IiwiY29udGVudFR5cGUiOiJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04IiwibWVtb3J5IjoxMDI0LCJ0aW1lb3V0IjoxODB9fQ.iN59lPqRVtg82YPXPHxgaCtSPbwp_m94VdcyUb8nT5Q\&asrc=run_on_apify)

```
import asyncio



from apify import Actor





async def main() -> None:

    async with Actor:

        await Actor.set_status_message('Here we go!')

        # Do some work...

        await asyncio.sleep(3)

        await Actor.set_status_message('So far so good...')

        await asyncio.sleep(3)

        # Do some more work...

        await Actor.set_status_message('Steady as she goes...')

        await asyncio.sleep(3)

        # Do even more work...

        await Actor.set_status_message('Almost there...')

        await asyncio.sleep(3)

        # Finish the job

        await Actor.set_status_message('Phew! That was not that hard!')





if __name__ == '__main__':

    asyncio.run(main())
```


---

Source: https://docs.apify.com/sdk/python/docs/concepts/actor-input

# Actor input

Copy for LLM

The Actor gets its [input](https://docs.apify.com/platform/actors/running/input) from the input record in its default [key-value store](https://docs.apify.com/platform/storage/key-value-store).

To access it, instead of reading the record manually, you can use the [`Actor.get_input`](https://docs.apify.com/sdk/python/reference/class/Actor.md#get_input) convenience method. It gets the input record key from the Actor configuration, reads the record from the default key-value store, and decrypts any [secret input fields](https://docs.apify.com/platform/actors/development/secret-input).

For example, if an Actor received a JSON input with two fields, `{ "firstNumber": 1, "secondNumber": 2 }`, this is how you might process it:

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGFzeW5jIHdpdGggQWN0b3I6XFxuICAgICAgICBhY3Rvcl9pbnB1dCA9IGF3YWl0IEFjdG9yLmdldF9pbnB1dCgpIG9yIHt9XFxuICAgICAgICBmaXJzdF9udW1iZXIgPSBhY3Rvcl9pbnB1dC5nZXQoJ2ZpcnN0TnVtYmVyJywgMClcXG4gICAgICAgIHNlY29uZF9udW1iZXIgPSBhY3Rvcl9pbnB1dC5nZXQoJ3NlY29uZE51bWJlcicsIDApXFxuICAgICAgICBBY3Rvci5sb2cuaW5mbygnU3VtOiAlcycsIGZpcnN0X251bWJlciArIHNlY29uZF9udW1iZXIpXFxuXFxuXFxuaWYgX19uYW1lX18gPT0gJ19fbWFpbl9fJzpcXG4gICAgYXN5bmNpby5ydW4obWFpbigpKVxcblwifSIsIm9wdGlvbnMiOnsiYnVpbGQiOiJsYXRlc3QiLCJjb250ZW50VHlwZSI6ImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLTgiLCJtZW1vcnkiOjEwMjQsInRpbWVvdXQiOjE4MH19.CF_KyX6EAMxLr_mlIpVnOD9pKv7wI53qxf1HWTha69g\&asrc=run_on_apify)

```
import asyncio



from apify import Actor





async def main() -> None:

    async with Actor:

        actor_input = await Actor.get_input() or {}

        first_number = actor_input.get('firstNumber', 0)

        second_number = actor_input.get('secondNumber', 0)

        Actor.log.info('Sum: %s', first_number + second_number)





if __name__ == '__main__':

    asyncio.run(main())
```

## Input file in the working directory[](#input-file-in-the-working-directory)

When you run the Actor locally and its default key-value store holds no input record, `Actor.get_input` reads the input from an `INPUT.json` or a bare `INPUT` file in the current working directory. The file name follows the configured input key. The `.json` file is parsed as JSON. The bare file is parsed as JSON when it's valid JSON and returned as `bytes` otherwise. If both files exist, `Actor.get_input` raises an error. On the Apify platform, the working directory is never read.

## Validating input[](#validating-input)

Reading values straight out of the raw input dictionary works for simple cases, but it gives you no type guarantees, no constraint checks, and no clear error when the input is malformed. For anything beyond a couple of fields, validate the input with [Pydantic](https://docs.pydantic.dev/). Your code then works with a typed, guaranteed-valid object instead. For the recommended approach, see [Validate Actor input with Pydantic](https://docs.apify.com/sdk/python/docs/guides/input-validation.md).

## Loading URLs from Actor input[](#loading-urls-from-actor-input)

Actors commonly receive a list of URLs to process via their input. The [`ApifyRequestList`](https://docs.apify.com/sdk/python/reference/class/ApifyRequestList.md) class (from `apify.request_loaders`) can parse the standard Apify input format for URL sources. It supports both direct URL objects (`{"url": "https://example.com"}`) and remote URL lists (`{"requestsFromUrl": "https://example.com/urls.txt"}`), where the remote file contains one URL per line.

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5mcm9tIGFwaWZ5LnJlcXVlc3RfbG9hZGVycyBpbXBvcnQgQXBpZnlSZXF1ZXN0TGlzdFxcblxcblxcbmFzeW5jIGRlZiBtYWluKCkgLT4gTm9uZTpcXG4gICAgYXN5bmMgd2l0aCBBY3RvcjpcXG4gICAgICAgIGFjdG9yX2lucHV0ID0gYXdhaXQgQWN0b3IuZ2V0X2lucHV0KCkgb3Ige31cXG5cXG4gICAgICAgICMgVGhlIGlucHV0IG1heSBjb250YWluIGEgbGlzdCBvZiBVUkwgc291cmNlcyBpbiB0aGUgc3RhbmRhcmQgQXBpZnkgZm9ybWF0XFxuICAgICAgICByZXF1ZXN0X2xpc3Rfc291cmNlcyA9IGFjdG9yX2lucHV0LmdldCgncmVxdWVzdExpc3RTb3VyY2VzJywgW10pXFxuXFxuICAgICAgICAjIENyZWF0ZSBhIHJlcXVlc3QgbGlzdCBmcm9tIHRoZSBpbnB1dCBzb3VyY2VzLlxcbiAgICAgICAgIyBTdXBwb3J0cyBkaXJlY3QgVVJMcyBhbmQgcmVtb3RlIFVSTCBsaXN0cy5cXG4gICAgICAgIHJlcXVlc3RfbGlzdCA9IGF3YWl0IEFwaWZ5UmVxdWVzdExpc3Qub3BlbihcXG4gICAgICAgICAgICByZXF1ZXN0X2xpc3Rfc291cmNlc19pbnB1dD1yZXF1ZXN0X2xpc3Rfc291cmNlcyxcXG4gICAgICAgIClcXG5cXG4gICAgICAgIHRvdGFsID0gYXdhaXQgcmVxdWVzdF9saXN0LmdldF90b3RhbF9jb3VudCgpXFxuICAgICAgICBBY3Rvci5sb2cuaW5mbyhmJ0xvYWRlZCB7dG90YWx9IHJlcXVlc3RzIGZyb20gaW5wdXQnKVxcblxcbiAgICAgICAgIyBQcm9jZXNzIHJlcXVlc3RzIGZyb20gdGhlIGxpc3RcXG4gICAgICAgIHdoaWxlIHJlcXVlc3QgOj0gYXdhaXQgcmVxdWVzdF9saXN0LmZldGNoX25leHRfcmVxdWVzdCgpOlxcbiAgICAgICAgICAgIEFjdG9yLmxvZy5pbmZvKGYnUHJvY2Vzc2luZyB7cmVxdWVzdC51cmx9JylcXG5cXG5cXG5pZiBfX25hbWVfXyA9PSAnX19tYWluX18nOlxcbiAgICBhc3luY2lvLnJ1bihtYWluKCkpXFxuXCJ9Iiwib3B0aW9ucyI6eyJidWlsZCI6ImxhdGVzdCIsImNvbnRlbnRUeXBlIjoiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCIsIm1lbW9yeSI6MTAyNCwidGltZW91dCI6MTgwfX0.FB4Iil1Mno3Akr67GCOHo4SQPllagefTiQ_MJcK76xE\&asrc=run_on_apify)

```
import asyncio



from apify import Actor

from apify.request_loaders import ApifyRequestList





async def main() -> None:

    async with Actor:

        actor_input = await Actor.get_input() or {}



        # The input may contain a list of URL sources in the standard Apify format

        request_list_sources = actor_input.get('requestListSources', [])



        # Create a request list from the input sources.

        # Supports direct URLs and remote URL lists.

        request_list = await ApifyRequestList.open(

            request_list_sources_input=request_list_sources,

        )



        total = await request_list.get_total_count()

        Actor.log.info(f'Loaded {total} requests from input')



        # Process requests from the list

        while request := await request_list.fetch_next_request():

            Actor.log.info(f'Processing {request.url}')





if __name__ == '__main__':

    asyncio.run(main())
```

## Secret input fields[](#secret-input-fields)

The Apify platform supports [secret input fields](https://docs.apify.com/platform/actors/development/secret-input) that are encrypted before being stored. When you mark an input field as `"isSecret": true` in your Actor's [input schema](https://docs.apify.com/platform/actors/development/input-schema), the platform encrypts the value with the Actor's public key.

No special handling is needed in your code — when you call [`Actor.get_input`](https://docs.apify.com/sdk/python/reference/class/Actor.md#get_input), encrypted fields are automatically decrypted using the Actor's private key, which is provided by the platform via environment variables. You receive the plaintext values directly.


---

Source: https://docs.apify.com/sdk/python/docs/concepts/storages

# Storages

Copy for LLM

The [`Actor`](https://docs.apify.com/sdk/python/reference/class/Actor.md) class provides methods to work either with the default storages of the Actor, or with any other storage, named or unnamed.

For details on storage types, see [Storage](https://docs.apify.com/platform/storage).

## Types of storages[](#types-of-storages)

There are three types of storages available to Actors.

First are [datasets](https://docs.apify.com/platform/storage/dataset), which are append-only tables for storing the results of your Actors. You can open a dataset through the [`Actor.open_dataset`](https://docs.apify.com/sdk/python/reference/class/Actor.md#open_dataset) method, and work with it through the resulting [`Dataset`](https://docs.apify.com/sdk/python/reference/class/Dataset.md) class instance.

Next there are [key-value stores](https://docs.apify.com/platform/storage/key-value-store), which function as a read/write storage for storing file-like objects, typically the Actor state or binary results. You can open a key-value store through the [`Actor.open_key_value_store`](https://docs.apify.com/sdk/python/reference/class/Actor.md#open_key_value_store) method, and work with it through the resulting [`KeyValueStore`](https://docs.apify.com/sdk/python/reference/class/KeyValueStore.md) class instance.

Finally, there are [request queues](https://docs.apify.com/platform/storage/request-queue). These are queues into which you can put the URLs you want to scrape, and from which the Actor can dequeue them and process them. You can open a request queue through the [`Actor.open_request_queue`](https://docs.apify.com/sdk/python/reference/class/Actor.md#open_request_queue) method, and work with it through the resulting [`RequestQueue`](https://docs.apify.com/sdk/python/reference/class/RequestQueue.md) class instance.

Each Actor run has its default dataset, default key-value store and default request queue.

## Local storage emulation[](#local-storage-emulation)

To be able to develop Actors locally, the storages that the Apify platform provides are emulated on the local filesystem.

The storage contents are loaded from and saved to the `storage` folder in the Actor's main folder. Each storage type is stored in its own subfolder, so for example datasets are stored in the `storage/datasets` folder.

Each storage is then stored in its own folder, named after the storage, or called `default` if it's the default storage. For example, a request queue with the name `my-queue` would be stored in `storage/request_queues/my-queue`.

Each dataset item, key-value store record, or request in a request queue is then stored in its own file in the storage folder. Dataset items and request queue requests are always JSON files, and key-value store records can be any file type, based on its content type. For example, the Actor input is typically stored in `storage/key_value_stores/default/INPUT.json`.

## Local Actor run with remote storage[](#local-actor-run-with-remote-storage)

When developing locally, opening any storage will by default use local storage. To change this behavior and to use remote storage you have to use `force_cloud=True` argument in [`Actor.open_dataset`](https://docs.apify.com/sdk/python/reference/class/Actor.md#open_dataset), [`Actor.open_request_queue`](https://docs.apify.com/sdk/python/reference/class/Actor.md#open_request_queue) or [`Actor.open_key_value_store`](https://docs.apify.com/sdk/python/reference/class/Actor.md#open_key_value_store). Proper use of this argument allows you to work with both local and remote storages.

Calling another remote Actor and accessing its default storage is a typical use-case for using `force_cloud=True` argument to open remote Actor's storages.

### Local storage persistence[](#local-storage-persistence)

By default, the storage contents are persisted across multiple Actor runs. To clean up the Actor storages before running the Actor, use the `--purge` flag of the [`apify run`](https://docs.apify.com/cli/docs/reference#apify-run) command of the Apify CLI.

```
apify run --purge
```

## Convenience methods for working with default storages[](#convenience-methods-for-working-with-default-storages)

There are several methods for directly working with the default key-value store or default dataset of the Actor.

* [`Actor.get_value('my-record')`](https://docs.apify.com/sdk/python/reference/class/Actor.md#get_value) reads a record from the default key-value store of the Actor.
* [`Actor.set_value('my-record', 'my-value')`](https://docs.apify.com/sdk/python/reference/class/Actor.md#set_value) saves a new value to the record in the default key-value store.
* [`Actor.get_input`](https://docs.apify.com/sdk/python/reference/class/Actor.md#get_input) reads the Actor input from the default key-value store of the Actor.
* [`Actor.push_data([{'result': 'Hello, world!'}, ...])`](https://docs.apify.com/sdk/python/reference/class/Actor.md#push_data) saves results to the default dataset of the Actor. When using the [pay-per-event pricing model](https://docs.apify.com/sdk/python/docs/concepts/pay-per-event.md), `push_data` returns a `ChargeResult` object that indicates whether the charge limit has been reached. You can also pass a `charged_event_name` parameter to charge for a custom event for each pushed item.

## Opening named and unnamed storages[](#opening-named-and-unnamed-storages)

The [`Actor.open_dataset`](https://docs.apify.com/sdk/python/reference/class/Actor.md#open_dataset), [`Actor.open_key_value_store`](https://docs.apify.com/sdk/python/reference/class/Actor.md#open_key_value_store) and [`Actor.open_request_queue`](https://docs.apify.com/sdk/python/reference/class/Actor.md#open_request_queue) methods can be used to open any storage for reading and writing. You can either use them without arguments to open the default storages, or you can pass a storage ID or name to open another storage.

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3IsIFJlcXVlc3RcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGFzeW5jIHdpdGggQWN0b3I6XFxuICAgICAgICAjIFdvcmsgd2l0aCB0aGUgZGVmYXVsdCBkYXRhc2V0IG9mIHRoZSBBY3RvclxcbiAgICAgICAgZGF0YXNldCA9IGF3YWl0IEFjdG9yLm9wZW5fZGF0YXNldCgpXFxuICAgICAgICBhd2FpdCBkYXRhc2V0LnB1c2hfZGF0YSh7J3Jlc3VsdCc6ICdIZWxsbywgd29ybGQhJ30pXFxuXFxuICAgICAgICAjIFdvcmsgd2l0aCB0aGUga2V5LXZhbHVlIHN0b3JlIHdpdGggSUQgJ21JSlZac1JRckRRZjRyVUFmJ1xcbiAgICAgICAga2V5X3ZhbHVlX3N0b3JlID0gYXdhaXQgQWN0b3Iub3Blbl9rZXlfdmFsdWVfc3RvcmUoaWQ9J21JSlZac1JRckRRZjRyVUFmJylcXG4gICAgICAgIGF3YWl0IGtleV92YWx1ZV9zdG9yZS5zZXRfdmFsdWUoJ3JlY29yZCcsICdIZWxsbywgd29ybGQhJylcXG5cXG4gICAgICAgICMgV29yayB3aXRoIHRoZSByZXF1ZXN0IHF1ZXVlIHdpdGggdGhlIG5hbWUgJ215LXF1ZXVlJ1xcbiAgICAgICAgcmVxdWVzdF9xdWV1ZSA9IGF3YWl0IEFjdG9yLm9wZW5fcmVxdWVzdF9xdWV1ZShuYW1lPSdteS1xdWV1ZScpXFxuICAgICAgICBhd2FpdCByZXF1ZXN0X3F1ZXVlLmFkZF9yZXF1ZXN0KFJlcXVlc3QuZnJvbV91cmwoJ2h0dHBzOi8vYXBpZnkuY29tJykpXFxuXFxuXFxuaWYgX19uYW1lX18gPT0gJ19fbWFpbl9fJzpcXG4gICAgYXN5bmNpby5ydW4obWFpbigpKVxcblwifSIsIm9wdGlvbnMiOnsiYnVpbGQiOiJsYXRlc3QiLCJjb250ZW50VHlwZSI6ImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLTgiLCJtZW1vcnkiOjEwMjQsInRpbWVvdXQiOjE4MH19.Kyo_kGWHonIZHpoiBgmpYFFDn6Wma3zXFeYsbmEXySw\&asrc=run_on_apify)

```
import asyncio



from apify import Actor, Request





async def main() -> None:

    async with Actor:

        # Work with the default dataset of the Actor

        dataset = await Actor.open_dataset()

        await dataset.push_data({'result': 'Hello, world!'})



        # Work with the key-value store with ID 'mIJVZsRQrDQf4rUAf'

        key_value_store = await Actor.open_key_value_store(id='mIJVZsRQrDQf4rUAf')

        await key_value_store.set_value('record', 'Hello, world!')



        # Work with the request queue with the name 'my-queue'

        request_queue = await Actor.open_request_queue(name='my-queue')

        await request_queue.add_request(Request.from_url('https://apify.com'))





if __name__ == '__main__':

    asyncio.run(main())
```

Besides `id` and `name`, the `open_*` methods also accept an `alias` parameter. An alias creates an unnamed storage scoped to the current Actor run — it does not persist across runs, but lets you reference the same storage within a single run using a human-readable label. The `alias` parameter is mutually exclusive with `id` and `name`.

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGFzeW5jIHdpdGggQWN0b3I6XFxuICAgICAgICAjIE9wZW4gYSBkYXRhc2V0IHdpdGggYW4gYWxpYXMg4oCUIHRoaXMgY3JlYXRlcyBhbiB1bm5hbWVkIGRhdGFzZXRcXG4gICAgICAgICMgdGhhdCBjYW4gYmUgcmVmZXJlbmNlZCBieSB0aGlzIGFsaWFzIHdpdGhpbiB0aGUgY3VycmVudCBydW5cXG4gICAgICAgIGRhdGFzZXQgPSBhd2FpdCBBY3Rvci5vcGVuX2RhdGFzZXQoYWxpYXM9J2ludGVybWVkaWF0ZS1yZXN1bHRzJylcXG4gICAgICAgIGF3YWl0IGRhdGFzZXQucHVzaF9kYXRhKHsnc3RlcCc6IDEsICdyZXN1bHQnOiAncGFydGlhbCBkYXRhJ30pXFxuXFxuICAgICAgICAjIExhdGVyLCBvcGVuIHRoZSBzYW1lIGRhdGFzZXQgdXNpbmcgdGhlIHNhbWUgYWxpYXNcXG4gICAgICAgIHNhbWVfZGF0YXNldCA9IGF3YWl0IEFjdG9yLm9wZW5fZGF0YXNldChhbGlhcz0naW50ZXJtZWRpYXRlLXJlc3VsdHMnKVxcbiAgICAgICAgZGF0YSA9IGF3YWl0IHNhbWVfZGF0YXNldC5nZXRfZGF0YSgpXFxuICAgICAgICBBY3Rvci5sb2cuaW5mbyhmJ0l0ZW1zIGluIGRhdGFzZXQ6IHtkYXRhLmNvdW50fScpXFxuXFxuXFxuaWYgX19uYW1lX18gPT0gJ19fbWFpbl9fJzpcXG4gICAgYXN5bmNpby5ydW4obWFpbigpKVxcblwifSIsIm9wdGlvbnMiOnsiYnVpbGQiOiJsYXRlc3QiLCJjb250ZW50VHlwZSI6ImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLTgiLCJtZW1vcnkiOjEwMjQsInRpbWVvdXQiOjE4MH19.KWx_vuzWAHOsb9JliOUQ9zxVwDUjMmICKdmDBxxY6c4\&asrc=run_on_apify)

```
import asyncio



from apify import Actor





async def main() -> None:

    async with Actor:

        # Open a dataset with an alias — this creates an unnamed dataset

        # that can be referenced by this alias within the current run

        dataset = await Actor.open_dataset(alias='intermediate-results')

        await dataset.push_data({'step': 1, 'result': 'partial data'})



        # Later, open the same dataset using the same alias

        same_dataset = await Actor.open_dataset(alias='intermediate-results')

        data = await same_dataset.get_data()

        Actor.log.info(f'Items in dataset: {data.count}')





if __name__ == '__main__':

    asyncio.run(main())
```

## Deleting storages[](#deleting-storages)

To delete a storage, you can use the [`Dataset.drop`](https://docs.apify.com/sdk/python/reference/class/Dataset.md#drop), [`KeyValueStore.drop`](https://docs.apify.com/sdk/python/reference/class/KeyValueStore.md#drop) or [`RequestQueue.drop`](https://docs.apify.com/sdk/python/reference/class/RequestQueue.md#drop) methods.

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGFzeW5jIHdpdGggQWN0b3I6XFxuICAgICAgICAjIE9wZW4gYSBrZXktdmFsdWUgc3RvcmUgd2l0aCB0aGUgbmFtZSAnbXktY29vbC1zdG9yZSdcXG4gICAgICAgIGtleV92YWx1ZV9zdG9yZSA9IGF3YWl0IEFjdG9yLm9wZW5fa2V5X3ZhbHVlX3N0b3JlKG5hbWU9J215LWNvb2wtc3RvcmUnKVxcbiAgICAgICAgYXdhaXQga2V5X3ZhbHVlX3N0b3JlLnNldF92YWx1ZSgncmVjb3JkJywgJ0hlbGxvLCB3b3JsZCEnKVxcblxcbiAgICAgICAgIyBEbyBzb21ldGhpbmcgLi4uXFxuXFxuICAgICAgICAjIE5vdyB3ZSBkb24ndCB3YW50IGl0IGFueW1vcmVcXG4gICAgICAgIGF3YWl0IGtleV92YWx1ZV9zdG9yZS5kcm9wKClcXG5cXG5cXG5pZiBfX25hbWVfXyA9PSAnX19tYWluX18nOlxcbiAgICBhc3luY2lvLnJ1bihtYWluKCkpXFxuXCJ9Iiwib3B0aW9ucyI6eyJidWlsZCI6ImxhdGVzdCIsImNvbnRlbnRUeXBlIjoiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCIsIm1lbW9yeSI6MTAyNCwidGltZW91dCI6MTgwfX0.W2wBx6Lar5dng_IDIi9LVdgd30ehIq9QsIL2dcNKUVA\&asrc=run_on_apify)

```
import asyncio



from apify import Actor





async def main() -> None:

    async with Actor:

        # Open a key-value store with the name 'my-cool-store'

        key_value_store = await Actor.open_key_value_store(name='my-cool-store')

        await key_value_store.set_value('record', 'Hello, world!')



        # Do something ...



        # Now we don't want it anymore

        await key_value_store.drop()





if __name__ == '__main__':

    asyncio.run(main())
```

## Working with datasets[](#working-with-datasets)

In this section we will show you how to work with [datasets](https://docs.apify.com/platform/storage/dataset).

### Reading & writing items[](#reading--writing-items)

To write data into a dataset, you can use the [`Dataset.push_data`](https://docs.apify.com/sdk/python/reference/class/Dataset.md#push_data) method.

To read data from a dataset, you can use the [`Dataset.get_data`](https://docs.apify.com/sdk/python/reference/class/Dataset.md#get_data) method.

To get an iterator of the data, you can use the [`Dataset.iterate_items`](https://docs.apify.com/sdk/python/reference/class/Dataset.md#iterate_items) method.

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGFzeW5jIHdpdGggQWN0b3I6XFxuICAgICAgICAjIE9wZW4gYSBkYXRhc2V0IGFuZCB3cml0ZSBzb21lIGRhdGEgaW4gaXRcXG4gICAgICAgIGRhdGFzZXQgPSBhd2FpdCBBY3Rvci5vcGVuX2RhdGFzZXQobmFtZT0nbXktY29vbC1kYXRhc2V0JylcXG4gICAgICAgIGF3YWl0IGRhdGFzZXQucHVzaF9kYXRhKFt7J2l0ZW1Obyc6IGl9IGZvciBpIGluIHJhbmdlKDEwMDApXSlcXG5cXG4gICAgICAgICMgUmVhZCBiYWNrIHRoZSBmaXJzdCBoYWxmIG9mIHRoZSBkYXRhXFxuICAgICAgICBmaXJzdF9oYWxmID0gYXdhaXQgZGF0YXNldC5nZXRfZGF0YShsaW1pdD01MDApXFxuICAgICAgICBBY3Rvci5sb2cuaW5mbyhmJ1RoZSBmaXJzdCBoYWxmIG9mIGl0ZW1zID0ge2ZpcnN0X2hhbGYuaXRlbXN9JylcXG5cXG4gICAgICAgICMgSXRlcmF0ZSBvdmVyIHRoZSBzZWNvbmQgaGFsZlxcbiAgICAgICAgc2Vjb25kX2hhbGYgPSBbaXRlbSBhc3luYyBmb3IgaXRlbSBpbiBkYXRhc2V0Lml0ZXJhdGVfaXRlbXMob2Zmc2V0PTUwMCldXFxuICAgICAgICBBY3Rvci5sb2cuaW5mbyhmJ1RoZSBzZWNvbmQgaGFsZiBvZiBpdGVtcyA9IHtzZWNvbmRfaGFsZn0nKVxcblxcblxcbmlmIF9fbmFtZV9fID09ICdfX21haW5fXyc6XFxuICAgIGFzeW5jaW8ucnVuKG1haW4oKSlcXG5cIn0iLCJvcHRpb25zIjp7ImJ1aWxkIjoibGF0ZXN0IiwiY29udGVudFR5cGUiOiJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04IiwibWVtb3J5IjoxMDI0LCJ0aW1lb3V0IjoxODB9fQ.vvpj4JD5IeEE_JVcMxMeCY9TUFiPyc8AVjGWaLc63LE\&asrc=run_on_apify)

```
import asyncio



from apify import Actor





async def main() -> None:

    async with Actor:

        # Open a dataset and write some data in it

        dataset = await Actor.open_dataset(name='my-cool-dataset')

        await dataset.push_data([{'itemNo': i} for i in range(1000)])



        # Read back the first half of the data

        first_half = await dataset.get_data(limit=500)

        Actor.log.info(f'The first half of items = {first_half.items}')



        # Iterate over the second half

        second_half = [item async for item in dataset.iterate_items(offset=500)]

        Actor.log.info(f'The second half of items = {second_half}')





if __name__ == '__main__':

    asyncio.run(main())
```

### Exporting items[](#exporting-items)

You can also export the dataset items into a key-value store, as either a CSV or a JSON record, using the [`Dataset.export_to`](https://docs.apify.com/sdk/python/reference/class/Dataset.md#export_to) method with the `content_type` argument set to `'csv'` or `'json'`.

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGFzeW5jIHdpdGggQWN0b3I6XFxuICAgICAgICAjIE9wZW4gYSBkYXRhc2V0IGFuZCB3cml0ZSBzb21lIGRhdGEgaW4gaXRcXG4gICAgICAgIGRhdGFzZXQgPSBhd2FpdCBBY3Rvci5vcGVuX2RhdGFzZXQobmFtZT0nbXktY29vbC1kYXRhc2V0JylcXG4gICAgICAgIGF3YWl0IGRhdGFzZXQucHVzaF9kYXRhKFt7J2l0ZW1Obyc6IGl9IGZvciBpIGluIHJhbmdlKDEwMDApXSlcXG5cXG4gICAgICAgICMgRXhwb3J0IHRoZSBkYXRhIGFzIENTVlxcbiAgICAgICAgYXdhaXQgZGF0YXNldC5leHBvcnRfdG8oXFxuICAgICAgICAgICAgY29udGVudF90eXBlPSdjc3YnLFxcbiAgICAgICAgICAgIGtleT0nZGF0YS5jc3YnLFxcbiAgICAgICAgICAgIHRvX2t2c19uYW1lPSdteS1jb29sLWtleS12YWx1ZS1zdG9yZScsXFxuICAgICAgICApXFxuXFxuICAgICAgICAjIEV4cG9ydCB0aGUgZGF0YSBhcyBKU09OXFxuICAgICAgICBhd2FpdCBkYXRhc2V0LmV4cG9ydF90byhcXG4gICAgICAgICAgICBjb250ZW50X3R5cGU9J2pzb24nLFxcbiAgICAgICAgICAgIGtleT0nZGF0YS5qc29uJyxcXG4gICAgICAgICAgICB0b19rdnNfbmFtZT0nbXktY29vbC1rZXktdmFsdWUtc3RvcmUnLFxcbiAgICAgICAgKVxcblxcbiAgICAgICAgIyBQcmludCB0aGUgZXhwb3J0ZWQgcmVjb3Jkc1xcbiAgICAgICAgc3RvcmUgPSBhd2FpdCBBY3Rvci5vcGVuX2tleV92YWx1ZV9zdG9yZShuYW1lPSdteS1jb29sLWtleS12YWx1ZS1zdG9yZScpXFxuXFxuICAgICAgICBjc3ZfZGF0YSA9IGF3YWl0IHN0b3JlLmdldF92YWx1ZSgnZGF0YS5jc3YnKVxcbiAgICAgICAgQWN0b3IubG9nLmluZm8oZidDU1YgZGF0YToge2Nzdl9kYXRhfScpXFxuXFxuICAgICAgICBqc29uX2RhdGEgPSBhd2FpdCBzdG9yZS5nZXRfdmFsdWUoJ2RhdGEuanNvbicpXFxuICAgICAgICBBY3Rvci5sb2cuaW5mbyhmJ0pTT04gZGF0YToge2pzb25fZGF0YX0nKVxcblxcblxcbmlmIF9fbmFtZV9fID09ICdfX21haW5fXyc6XFxuICAgIGFzeW5jaW8ucnVuKG1haW4oKSlcXG5cIn0iLCJvcHRpb25zIjp7ImJ1aWxkIjoibGF0ZXN0IiwiY29udGVudFR5cGUiOiJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04IiwibWVtb3J5IjoxMDI0LCJ0aW1lb3V0IjoxODB9fQ.xF4h0wYEHBtvFza6xWawolv5xRnxPYIqlTsusB9x7OQ\&asrc=run_on_apify)

```
import asyncio



from apify import Actor





async def main() -> None:

    async with Actor:

        # Open a dataset and write some data in it

        dataset = await Actor.open_dataset(name='my-cool-dataset')

        await dataset.push_data([{'itemNo': i} for i in range(1000)])



        # Export the data as CSV

        await dataset.export_to(

            content_type='csv',

            key='data.csv',

            to_kvs_name='my-cool-key-value-store',

        )



        # Export the data as JSON

        await dataset.export_to(

            content_type='json',

            key='data.json',

            to_kvs_name='my-cool-key-value-store',

        )



        # Print the exported records

        store = await Actor.open_key_value_store(name='my-cool-key-value-store')



        csv_data = await store.get_value('data.csv')

        Actor.log.info(f'CSV data: {csv_data}')



        json_data = await store.get_value('data.json')

        Actor.log.info(f'JSON data: {json_data}')





if __name__ == '__main__':

    asyncio.run(main())
```

## Working with key-value stores[](#working-with-key-value-stores)

In this section we will show you how to work with [key-value stores](https://docs.apify.com/platform/storage/key-value-store).

### Reading and writing records[](#reading-and-writing-records)

To read records from a key-value store, you can use the [`KeyValueStore.get_value`](https://docs.apify.com/sdk/python/reference/class/KeyValueStore.md#get_value) method.

To write records into a key-value store, you can use the [`KeyValueStore.set_value`](https://docs.apify.com/sdk/python/reference/class/KeyValueStore.md#set_value) method. You can set the content type of a record with the `content_type` argument. To delete a record, set its value to `None`.

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGFzeW5jIHdpdGggQWN0b3I6XFxuICAgICAgICAjIE9wZW4gYSBuYW1lZCBrZXktdmFsdWUgc3RvcmVcXG4gICAgICAgIGt2cyA9IGF3YWl0IEFjdG9yLm9wZW5fa2V5X3ZhbHVlX3N0b3JlKG5hbWU9J215LWNvb2wta2V5LXZhbHVlLXN0b3JlJylcXG5cXG4gICAgICAgICMgV3JpdGUgc29tZSBkYXRhIHRvIGl0XFxuICAgICAgICBhd2FpdCBrdnMuc2V0X3ZhbHVlKCdhdXRvbWF0aWNfdGV4dCcsICdhYmNkJylcXG4gICAgICAgIGF3YWl0IGt2cy5zZXRfdmFsdWUoJ2F1dG9tYXRpY19qc29uJywgeydhYic6ICdjZCd9KVxcbiAgICAgICAgYXdhaXQga3ZzLnNldF92YWx1ZSgnZXhwbGljaXRfY3N2JywgJ2EsYlxcXFxuYyxkJywgY29udGVudF90eXBlPSd0ZXh0L2NzdicpXFxuXFxuICAgICAgICAjIEdldCB0aGUgdmFsdWVzIGFuZCBsb2cgdGhlbVxcbiAgICAgICAgYXV0b21hdGljX3RleHQgPSBhd2FpdCBrdnMuZ2V0X3ZhbHVlKCdhdXRvbWF0aWNfdGV4dCcpXFxuICAgICAgICBBY3Rvci5sb2cuaW5mbyhmJ0F1dG9tYXRpYyB0ZXh0OiB7YXV0b21hdGljX3RleHR9JylcXG5cXG4gICAgICAgIGF1dG9tYXRpY19qc29uID0gYXdhaXQga3ZzLmdldF92YWx1ZSgnYXV0b21hdGljX2pzb24nKVxcbiAgICAgICAgQWN0b3IubG9nLmluZm8oZidBdXRvbWF0aWMgSlNPTjoge2F1dG9tYXRpY19qc29ufScpXFxuXFxuICAgICAgICBleHBsaWNpdF9jc3YgPSBhd2FpdCBrdnMuZ2V0X3ZhbHVlKCdleHBsaWNpdF9jc3YnKVxcbiAgICAgICAgQWN0b3IubG9nLmluZm8oZidFeHBsaWNpdCBDU1Y6IHtleHBsaWNpdF9jc3Z9JylcXG5cXG4gICAgICAgICMgRGVsZXRlIHRoZSBgYXV0b21hdGljX3RleHRgIHZhbHVlXFxuICAgICAgICBhd2FpdCBrdnMuc2V0X3ZhbHVlKCdhdXRvbWF0aWNfdGV4dCcsIE5vbmUpXFxuXFxuXFxuaWYgX19uYW1lX18gPT0gJ19fbWFpbl9fJzpcXG4gICAgYXN5bmNpby5ydW4obWFpbigpKVxcblwifSIsIm9wdGlvbnMiOnsiYnVpbGQiOiJsYXRlc3QiLCJjb250ZW50VHlwZSI6ImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLTgiLCJtZW1vcnkiOjEwMjQsInRpbWVvdXQiOjE4MH19.u3JN0vfRXA7eQEQbPiFKvNcnkSYdmbMGA9HQ4dkH9TY\&asrc=run_on_apify)

```
import asyncio



from apify import Actor





async def main() -> None:

    async with Actor:

        # Open a named key-value store

        kvs = await Actor.open_key_value_store(name='my-cool-key-value-store')



        # Write some data to it

        await kvs.set_value('automatic_text', 'abcd')

        await kvs.set_value('automatic_json', {'ab': 'cd'})

        await kvs.set_value('explicit_csv', 'a,b\nc,d', content_type='text/csv')



        # Get the values and log them

        automatic_text = await kvs.get_value('automatic_text')

        Actor.log.info(f'Automatic text: {automatic_text}')



        automatic_json = await kvs.get_value('automatic_json')

        Actor.log.info(f'Automatic JSON: {automatic_json}')



        explicit_csv = await kvs.get_value('explicit_csv')

        Actor.log.info(f'Explicit CSV: {explicit_csv}')



        # Delete the `automatic_text` value

        await kvs.set_value('automatic_text', None)





if __name__ == '__main__':

    asyncio.run(main())
```

### Iterating keys[](#iterating-keys)

To get an iterator of the key-value store record keys, you can use the [`KeyValueStore.iterate_keys`](https://docs.apify.com/sdk/python/reference/class/KeyValueStore.md#iterate_keys) method.

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGFzeW5jIHdpdGggQWN0b3I6XFxuICAgICAgICAjIE9wZW4gYSBuYW1lZCBrZXktdmFsdWUgc3RvcmVcXG4gICAgICAgIGt2cyA9IGF3YWl0IEFjdG9yLm9wZW5fa2V5X3ZhbHVlX3N0b3JlKG5hbWU9J215LWNvb2wta2V5LXZhbHVlLXN0b3JlJylcXG5cXG4gICAgICAgICMgV3JpdGUgc29tZSBkYXRhIHRvIGl0XFxuICAgICAgICBhd2FpdCBrdnMuc2V0X3ZhbHVlKCdhdXRvbWF0aWNfdGV4dCcsICdhYmNkJylcXG4gICAgICAgIGF3YWl0IGt2cy5zZXRfdmFsdWUoJ2F1dG9tYXRpY19qc29uJywgeydhYic6ICdjZCd9KVxcbiAgICAgICAgYXdhaXQga3ZzLnNldF92YWx1ZSgnZXhwbGljaXRfY3N2JywgJ2EsYlxcXFxuYyxkJywgY29udGVudF90eXBlPSd0ZXh0L2NzdicpXFxuXFxuICAgICAgICAjIFByaW50IHRoZSBpbmZvIGZvciBlYWNoIHJlY29yZFxcbiAgICAgICAgQWN0b3IubG9nLmluZm8oJ1JlY29yZHMgaW4gc3RvcmU6JylcXG5cXG4gICAgICAgIGFzeW5jIGZvciBpdGVtIGluIGt2cy5pdGVyYXRlX2tleXMoKTpcXG4gICAgICAgICAgICBBY3Rvci5sb2cuaW5mbyhmJ2tleT17aXRlbS5rZXl9LCBzaXplPXtpdGVtLnNpemV9JylcXG5cXG5cXG5pZiBfX25hbWVfXyA9PSAnX19tYWluX18nOlxcbiAgICBhc3luY2lvLnJ1bihtYWluKCkpXFxuXCJ9Iiwib3B0aW9ucyI6eyJidWlsZCI6ImxhdGVzdCIsImNvbnRlbnRUeXBlIjoiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCIsIm1lbW9yeSI6MTAyNCwidGltZW91dCI6MTgwfX0.iTYfs1diyO5R0BipFu3qs1rsiqwHm8kOFCWvA7PHnD8\&asrc=run_on_apify)

```
import asyncio



from apify import Actor





async def main() -> None:

    async with Actor:

        # Open a named key-value store

        kvs = await Actor.open_key_value_store(name='my-cool-key-value-store')



        # Write some data to it

        await kvs.set_value('automatic_text', 'abcd')

        await kvs.set_value('automatic_json', {'ab': 'cd'})

        await kvs.set_value('explicit_csv', 'a,b\nc,d', content_type='text/csv')



        # Print the info for each record

        Actor.log.info('Records in store:')



        async for item in kvs.iterate_keys():

            Actor.log.info(f'key={item.key}, size={item.size}')





if __name__ == '__main__':

    asyncio.run(main())
```

### Public URLs of records[](#public-urls-of-records)

To get a publicly accessible URL of a key-value store record, you can use the [`KeyValueStore.get_public_url`](https://docs.apify.com/sdk/python/reference/class/KeyValueStore.md#get_public_url) method.

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuXFxuZnJvbSBhcGlmeSBpbXBvcnQgQWN0b3JcXG5cXG5cXG5hc3luYyBkZWYgbWFpbigpIC0-IE5vbmU6XFxuICAgIGFzeW5jIHdpdGggQWN0b3I6XFxuICAgICAgICAjIE9wZW4gYSBuYW1lZCBrZXktdmFsdWUgc3RvcmVcXG4gICAgICAgIHN0b3JlID0gYXdhaXQgQWN0b3Iub3Blbl9rZXlfdmFsdWVfc3RvcmUobmFtZT0nbXktY29vbC1rZXktdmFsdWUtc3RvcmUnKVxcblxcbiAgICAgICAgIyBHZXQgdGhlIHB1YmxpYyBVUkwgb2YgYSByZWNvcmRcXG4gICAgICAgIG15X3JlY29yZF91cmwgPSBhd2FpdCBzdG9yZS5nZXRfcHVibGljX3VybCgnbXlfcmVjb3JkJylcXG4gICAgICAgIEFjdG9yLmxvZy5pbmZvKGYnVVJMIG9mIFxcXCJteV9yZWNvcmRcXFwiOiB7bXlfcmVjb3JkX3VybH0nKVxcblxcblxcbmlmIF9fbmFtZV9fID09ICdfX21haW5fXyc6XFxuICAgIGFzeW5jaW8ucnVuKG1haW4oKSlcXG5cIn0iLCJvcHRpb25zIjp7ImJ1aWxkIjoibGF0ZXN0IiwiY29udGVudFR5cGUiOiJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04IiwibWVtb3J5IjoxMDI0LCJ0aW1lb3V0IjoxODB9fQ.In3DecM8oE05rLcU6qSS1v7IqS40WHBN73rdcf66BQ8\&asrc=run_on_apify)

```
import asyncio



from apify import Actor





async def main() -> None:

    async with Actor:

        # Open a named key-value store

        store = await Actor.open_key_value_store(name='my-cool-key-value-store')



        # Get the public URL of a record

        my_record_url = await store.get_public_url('my_record')

        Actor.log.info(f'URL of "my_record": {my_record_url}')





if __name__ == '__main__':

    asyncio.run(main())
```

## Working with request queues[](#working-with-request-queues)

In this section we will show you how to work with [request queues](https://docs.apify.com/platform/storage/request-queue).

By default, a request queue is optimized for a single consumer. To let multiple Actor runs process the same queue at once, see [single vs. shared request queue](https://docs.apify.com/sdk/python/docs/concepts/storage-clients.md#single-vs-shared-request-queue).

### Adding requests to a queue[](#adding-requests-to-a-queue)

To add a request into the queue, you can use the [`RequestQueue.add_request`](https://docs.apify.com/sdk/python/reference/class/RequestQueue.md#add_request) method.

You can use the `forefront` boolean argument to specify whether the request should go to the beginning of the queue, or to the end.

You can use the `unique_key` of the request to uniquely identify a request. If you try to add more requests with the same unique key, only the first one will be added.

Check out the [`Request`](https://docs.apify.com/sdk/python/reference/class/Request.md) for more information on how to create requests and what properties they have.

### Reading requests[](#reading-requests)

To fetch the next request from the queue for processing, you can use the [`RequestQueue.fetch_next_request`](https://docs.apify.com/sdk/python/reference/class/RequestQueue.md#fetch_next_request) method.

To get info about a specific request from the queue, you can use the [`RequestQueue.get_request`](https://docs.apify.com/sdk/python/reference/class/RequestQueue.md#get_request) method.

### Handling requests[](#handling-requests)

To mark a request as handled, you can use the [`RequestQueue.mark_request_as_handled`](https://docs.apify.com/sdk/python/reference/class/RequestQueue.md#mark_request_as_handled) method.

To mark a request as not handled, so that it gets retried, you can use the [`RequestQueue.reclaim_request`](https://docs.apify.com/sdk/python/reference/class/RequestQueue.md#reclaim_request) method.

To check if all the requests in the queue are handled, you can use the [`RequestQueue.is_finished`](https://docs.apify.com/sdk/python/reference/class/RequestQueue.md#is_finished) method.

### Full example[](#full-example)

[Run on](https://console.apify.com/actors/HH9rhkFXiZbheuq1V?runConfig=eyJ1IjoiRWdQdHczb2VqNlRhRHQ1cW4iLCJ2IjoxfQ.eyJpbnB1dCI6IntcImNvZGVcIjpcImltcG9ydCBhc3luY2lvXFxuaW1wb3J0IHJhbmRvbVxcblxcbmZyb20gYXBpZnkgaW1wb3J0IEFjdG9yLCBSZXF1ZXN0XFxuXFxuRkFJTFVSRV9SQVRFID0gMC4zXFxuXFxuXFxuYXN5bmMgZGVmIG1haW4oKSAtPiBOb25lOlxcbiAgICBhc3luYyB3aXRoIEFjdG9yOlxcbiAgICAgICAgIyBPcGVuIHRoZSBxdWV1ZVxcbiAgICAgICAgcXVldWUgPSBhd2FpdCBBY3Rvci5vcGVuX3JlcXVlc3RfcXVldWUoKVxcblxcbiAgICAgICAgIyBBZGQgc29tZSByZXF1ZXN0cyB0byB0aGUgcXVldWVcXG4gICAgICAgIGZvciBpIGluIHJhbmdlKDEsIDEwKTpcXG4gICAgICAgICAgICBhd2FpdCBxdWV1ZS5hZGRfcmVxdWVzdChSZXF1ZXN0LmZyb21fdXJsKGYnaHR0cDovL2V4YW1wbGUuY29tL3tpfScpKVxcblxcbiAgICAgICAgIyBBZGQgYSByZXF1ZXN0IHRvIHRoZSBzdGFydCBvZiB0aGUgcXVldWUsIGZvciBwcmlvcml0eSBwcm9jZXNzaW5nXFxuICAgICAgICBhd2FpdCBxdWV1ZS5hZGRfcmVxdWVzdChSZXF1ZXN0LmZyb21fdXJsKCdodHRwOi8vZXhhbXBsZS5jb20vMCcpLCBmb3JlZnJvbnQ9VHJ1ZSlcXG5cXG4gICAgICAgICMgSWYgeW91IHRyeSB0byBhZGQgYW4gZXhpc3RpbmcgcmVxdWVzdCBhZ2FpbiwgaXQgd2lsbCBub3QgZG8gYW55dGhpbmdcXG4gICAgICAgIGFkZF9yZXF1ZXN0X2luZm8gPSBhd2FpdCBxdWV1ZS5hZGRfcmVxdWVzdChcXG4gICAgICAgICAgICBSZXF1ZXN0LmZyb21fdXJsKCdodHRwOi8vZXhhbXBsZS5jb20vNScpXFxuICAgICAgICApXFxuICAgICAgICBBY3Rvci5sb2cuaW5mbyhmJ0FkZCByZXF1ZXN0IGluZm86IHthZGRfcmVxdWVzdF9pbmZvfScpXFxuXFxuICAgICAgICAjIEZpbmFsbHksIHByb2Nlc3MgdGhlIHF1ZXVlIHVudGlsIGFsbCByZXF1ZXN0cyBhcmUgaGFuZGxlZFxcbiAgICAgICAgd2hpbGUgbm90IGF3YWl0IHF1ZXVlLmlzX2ZpbmlzaGVkKCk6XFxuICAgICAgICAgICAgIyBGZXRjaCB0aGUgbmV4dCB1bmhhbmRsZWQgcmVxdWVzdCBpbiB0aGUgcXVldWVcXG4gICAgICAgICAgICByZXF1ZXN0ID0gYXdhaXQgcXVldWUuZmV0Y2hfbmV4dF9yZXF1ZXN0KClcXG4gICAgICAgICAgICAjIFRoaXMgY2FuIGhhcHBlbiBkdWUgdG8gdGhlIGV2ZW50dWFsIGNvbnNpc3RlbmN5IG9mIHRoZSB1bmRlcmx5aW5nIHJlcXVlc3RcXG4gICAgICAgICAgICAjIHF1ZXVlIHN0b3JhZ2UsIGJlc3Qgc29sdXRpb24gaXMganVzdCB0byBzbGVlcCBhIGJpdC5cXG4gICAgICAgICAgICBpZiByZXF1ZXN0IGlzIE5vbmU6XFxuICAgICAgICAgICAgICAgIGF3YWl0IGFzeW5jaW8uc2xlZXAoMSlcXG4gICAgICAgICAgICAgICAgY29udGludWVcXG5cXG4gICAgICAgICAgICBBY3Rvci5sb2cuaW5mbyhmJ1Byb2Nlc3NpbmcgcmVxdWVzdCB7cmVxdWVzdC51bmlxdWVfa2V5fS4uLicpXFxuICAgICAgICAgICAgQWN0b3IubG9nLmluZm8oZidTY3JhcGluZyBVUkwge3JlcXVlc3QudXJsfS4uLicpXFxuXFxuICAgICAgICAgICAgIyBEbyBzb21lIGZha2Ugd29yaywgd2hpY2ggZmFpbHMgMzAlIG9mIHRoZSB0aW1lXFxuICAgICAgICAgICAgYXdhaXQgYXN5bmNpby5zbGVlcCgxKVxcbiAgICAgICAgICAgIGlmIHJhbmRvbS5yYW5kb20oKSA-IEZBSUxVUkVfUkFURTpcXG4gICAgICAgICAgICAgICAgIyBJZiBwcm9jZXNzaW5nIHRoZSByZXF1ZXN0IHdhcyBzdWNjZXNzZnVsLCBtYXJrIGl0IGFzIGhhbmRsZWRcXG4gICAgICAgICAgICAgICAgQWN0b3IubG9nLmluZm8oJ1JlcXVlc3Qgc3VjY2Vzc2Z1bC4nKVxcbiAgICAgICAgICAgICAgICBhd2FpdCBxdWV1ZS5tYXJrX3JlcXVlc3RfYXNfaGFuZGxlZChyZXF1ZXN0KVxcbiAgICAgICAgICAgIGVsc2U6XFxuICAgICAgICAgICAgICAgICMgSWYgcHJvY2Vzc2luZyB0aGUgcmVxdWVzdCB3YXMgdW5zdWNjZXNzZnVsLCByZWNsYWltIGl0IHNvIGl0IGNhbiBiZVxcbiAgICAgICAgICAgICAgICAjIHByb2Nlc3NlZCBhZ2Fpbi5cXG4gICAgICAgICAgICAgICAgQWN0b3IubG9nLndhcm5pbmcoJ1JlcXVlc3QgZmFpbGVkLCB3aWxsIHJldHJ5IScpXFxuICAgICAgICAgICAgICAgIGF3YWl0IHF1ZXVlLnJlY2xhaW1fcmVxdWVzdChyZXF1ZXN0KVxcblxcblxcbmlmIF9fbmFtZV9fID09ICdfX21haW5fXyc6XFxuICAgIGFzeW5jaW8ucnVuKG1haW4oKSlcXG5cIn0iLCJvcHRpb25zIjp7ImJ1aWxkIjoibGF0ZXN0IiwiY29udGVudFR5cGUiOiJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04IiwibWVtb3J5IjoxMDI0LCJ0aW1lb3V0IjoxODB9fQ.QW5gOe0--c85jC5Izfb6QX3I7m4M6z22ufbd2AFq4QM\&asrc=run_on_apify)

```
import asyncio

import random



from apify import Actor, Request



FAILURE_RATE = 0.3





async def main() -> None:

    async with Actor:

        # Open the queue

        queue = await Actor.open_request_queue()



        # Add some requests to the queue

        for i in range(1, 10):

            await queue.add_request(Request.from_url(f'http://example.com/{i}'))



        # Add a request to the start of the queue, for priority processing

        await queue.add_request(Request.from_url('http://example.com/0'), forefront=True)



        # If you try to add an existing request again, it will not do anything

        add_request_info = await queue.add_request(

            Request.from_url('http://example.com/5')

        )

        Actor.log.info(f'Add request info: {add_request_info}')



        # Finally, process the queue until all requests are handled

        while not await queue.is_finished():

            # Fetch the next unhandled request in the queue

            request = await queue.fetch_next_request()

            # This can happen due to the eventual consistency of the underlying request

            # queue storage, best solution is just to sleep a bit.

            if request is None:

                await asyncio.sleep(1)

                continue



            Actor.log.info(f'Processing request {request.unique_key}...')

            Actor.log.info(f'Scraping URL {request.url}...')



            # Do some fake work, which fails 30% of the time

            await asyncio.sleep(1)

            if random.random() > FAILURE_RATE:

                # If processing the request was successful, mark it as handled

                Actor.log.info('Request successful.')

                await queue.mark_request_as_handled(request)

            else:

                # If processing the request was unsuccessful, reclaim it so it can be

                # processed again.

                Actor.log.warning('Request failed, will retry!')

                await queue.reclaim_request(request)





if __name__ == '__main__':

    asyncio.run(main())
```

## Storage clients[](#storage-clients)

Behind the scenes, the SDK uses storage clients to communicate with the storage backend. The appropriate client is selected automatically based on the runtime environment. On the Apify platform, data is persisted via the Apify API, while local runs use the filesystem. For most use cases, you don't need to think about storage clients at all. To learn about the available implementations, how to switch between a single and shared request queue, or how to configure a custom client, see [Storage clients](https://docs.apify.com/sdk/python/docs/concepts/storage-clients.md). For a deeper look at how storage clients work internally, see the [Crawlee storage clients guide](https://crawlee.dev/python/docs/guides/storage-clients).


---

Source: https://docs.apify.com/actors/development/quick-start/locally

---
title: Develop Actors locally
url: https://docs.apify.com/actors/development/quick-start/locally.md
parents:
  - [Apify documentation](https://docs.apify.com/llms.txt)
  - [Actors](https://docs.apify.com/actors.md)
  - [Develop](https://docs.apify.com/actors/development.md)
  - [Quick start](https://docs.apify.com/actors/development/quick-start.md)
previous: [Quick start](https://docs.apify.com/actors/development/quick-start.md)
next: [Develop in the web IDE](https://docs.apify.com/actors/development/quick-start/web-ide.md)
---

> ## Documentation index
> Fetch the complete documentation index at: https://docs.apify.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Develop Actors locally

To develop Actors locally, use the [Apify CLI](https://docs.apify.com/cli/docs). You can use your own code editor and version control system. The CLI simulates the Apify environment so you can test the Actor before you deploy it.

## Before you start

* [Install the Apify CLI](https://docs.apify.com/cli/docs/installation).
* [Create an Apify account](https://console.apify.com/sign-in).

## Create and run an Actor

To create and run your new Actor locally, use the following commands:


```bash
apify create my-actor-name

cd my-actor-name

apify run
```


For a detailed tutorial, see the [Apify CLI quick start](https://docs.apify.com/cli/docs/quick-start).

## Explore the Actor

The `apify create` command creates a directory with boilerplate code. The exact structure and contents of the directory depend on the template that you choose.

**JavaScript**


```text
my-actor/

├── .actor/

│   ├── actor.json           # Actor configuration

│   ├── input_schema.json

│   ├── output_schema.json

│   └── dataset_schema.json

├── src/

│   └── main.js              # Main logic of the Actor

├── storage/                 # Local storage

├── Dockerfile               # Container image definition

├── README.md

├── AGENTS.md                # Instructions for coding agents

└── package.json
```


**Python**


```text
my-actor/

├── .actor/

│   ├── actor.json           # Actor configuration

│   ├── input_schema.json

│   ├── output_schema.json

│   └── dataset_schema.json

├── my_actor/

│   └── main.py              # Main logic of the Actor

├── storage/                 # Local storage

├── Dockerfile               # Container image definition

├── README.md

├── AGENTS.md                # Instructions for coding agents

└── requirements.txt
```


### `.actor` directory

The `.actor` directory contains the Actor configuration:

* The [actor.json](https://docs.apify.com/actors/development/actor-definition/actor-json.md) file defines the Actor's name, description, version, and other settings. It links your local development project to an Actor on the Apify platform.
* The [input_schema.json](https://docs.apify.com/actors/development/actor-definition/input-schema.md) file defines the input parameters for an Actor.
* The [output_schema.json](https://docs.apify.com/actors/development/actor-definition/output-schema.md) file specifies where an Actor stores its output and defines templates for accessing that output.
* The [dataset_schema.json](https://docs.apify.com/storage/dataset-schema.md) file defines the structure and presentation of data produced by an Actor.

### Actor's input

Each Actor accepts an `input` object that tells it what to do. The object uses JSON format and lives in `storage/key_value_stores/default/INPUT.json`.

Local input comes from `INPUT.json` that you can edit manually. On the platform, input comes from the form generated by [input_schema.json](https://docs.apify.com/actors/development/actor-definition/input-schema.md). Change the schema first, then update `INPUT.json` to match. Otherwise, the Actor works locally but fails validation on the platform.

### Actor's output

The [output_schema.json](https://docs.apify.com/actors/development/actor-definition/output-schema.md) file defines where the Actor stores its results and how to access them. It builds on the [dataset schema](https://docs.apify.com/storage/dataset-schema.md) and the [key-value store schema](https://docs.apify.com/storage/key-value-store-schema.md).

### Actor's storage

The `storage` directory holds the data your Actor reads and writes when it runs locally. It mirrors the three storage types the Apify platform creates for every run:

| Path                                | Platform equivalent                                                                    | Contents                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `storage/datasets/default/`         | The run's default [dataset](https://docs.apify.com/storage/dataset.md)                 | Structured results, one JSON file per item.                                                        |
| `storage/key_value_stores/default/` | The run's default [key-value store](https://docs.apify.com/storage/key-value-store.md) | Files and data records. Works well for screenshots, PDFs, or persisting Actor state as JSON files. |
| `storage/request_queues/default/`   | The run's default [request queue](https://docs.apify.com/storage/request-queue.md)     | Requests the Actor enqueued.                                                                       |

Local storage persists between runs. To clear the default storages, run `apify run --purge`.

## Deploy to the Apify platform

How to deploy your Actor code to the Apify platform depends on the source type you choose:

* If you host your Actor's source code on Apify, run the `apify push` command. To control to which version the build belongs, use `--version` and `--build-tag` flags.
* If you host your Actor's source code in a [Git repository](https://docs.apify.com/actors/development/deployment/source-types.md#git-repository), run the `git push` command. Automated builds are on by default, so every push to the repository rebuilds the Actor.

## Next steps

* For a full list of commands, see the [Apify CLI command reference](https://docs.apify.com/cli/docs/reference).
* For Actor configuration details, see [Actor definition](https://docs.apify.com/actors/development/actor-definition.md).
* To automate your Actor development process, see [Continuous integration](https://docs.apify.com/actors/development/deployment/continuous-integration.md).


---

Source: https://docs.apify.com/actors/development/actor-definition/actor-json

---
title: Actor definition file (actor.json)
url: https://docs.apify.com/actors/development/actor-definition/actor-json.md
parents:
  - [Apify documentation](https://docs.apify.com/llms.txt)
  - [Actors](https://docs.apify.com/actors.md)
  - [Develop](https://docs.apify.com/actors/development.md)
  - [Actor definition](https://docs.apify.com/actors/development/actor-definition.md)
previous: [Actor definition](https://docs.apify.com/actors/development/actor-definition.md)
next: [Source code](https://docs.apify.com/actors/development/actor-definition/source-code.md)
---

> ## Documentation index
> Fetch the complete documentation index at: https://docs.apify.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Actor definition file (actor.json)

Your main Actor configuration is in the `.actor/actor.json` file at the root of your Actor's directory. This file links your local development project to an Actor on the Apify platform. It should include details like the Actor's name, version, build tag, and environment variables. Make sure to commit this file to your Git repository.

For example, the `.actor/actor.json` file can look like this:

<!-- -->

**Full actor.json**


```json
{

    "actorSpecification": 1, // always 1

    "name": "name-of-my-scraper",

    "title": "My Web Scraper",

    "description": "Extract data from example.com.",

    "version": "0.0",

    "buildTag": "latest",

    "meta": {

        "templateId": "ts-crawlee-playwright-chrome"

    },

    "defaultMemoryMbytes": "get(input, 'startUrls.length', 1) * 1024",

    "minMemoryMbytes": 256,

    "maxMemoryMbytes": 4096,

    "environmentVariables": {

        "MYSQL_USER": "my_username",

        "MYSQL_PASSWORD": "@mySecretPassword"

    },

    "usesStandbyMode": false,

    "dockerfile": "./Dockerfile",

    "readme": "./ACTOR.md",

    "input": "./input_schema.json",

    "output": "./output_schema.json",

    "storages": {

        "dataset": "./dataset_schema.json",

        "keyValueStore": "./key_value_store_schema.json"

    },

    "webServerSchema": "./web_server_openapi.json",

    "webServerMcpPath": "/mcp"

}
```


**Minimal actor.json**


```json
{

    "actorSpecification": 1, // always 1

    "name": "name-of-my-scraper",

    "version": "0.0"

}
```


## Reference

Deployment metadata

Actor `name`, `version`, `buildTag`, and `environmentVariables` are currently only used when you deploy your Actor using the [Apify CLI](https://docs.apify.com/cli) and not when deployed, for example, via GitHub integration. There, it serves for informative purposes only.

| Property                 | Type     | Description                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actorSpecification`     | Required | The version of the Actor specification. This property must be set to `1`, which is the only version available.                                                                                                                                                                                                                                                                                                      |
| `name`                   | Required | The name of the Actor.                                                                                                                                                                                                                                                                                                                                                                                              |
| `title`                  | Optional | The `title` property defines the human-readable display title of the Actor, shown in Apify Console and Apify Store. If not specified, the `name` property is used as the title.                                                                                                                                                                                                                                     |
| `description`            | Optional | The description of the Actor.                                                                                                                                                                                                                                                                                                                                                                                       |
| `version`                | Required | The version of the Actor, specified in the format `[Number].[Number]`, e.g., `0.1`, `0.3`, `1.0`, `1.3`, etc.                                                                                                                                                                                                                                                                                                       |
| `buildTag`               | Optional | The tag name to be applied to a successful build of the Actor. If not specified, defaults to `latest`. Refer to the [builds](https://docs.apify.com/actors/development/builds-and-runs/builds.md) for more information.                                                                                                                                                                                             |
| `meta`                   | Optional | Metadata object containing additional information about the Actor. Currently supports `templateId` field to identify the template from which the Actor was created.                                                                                                                                                                                                                                                 |
| `environmentVariables`   | Optional | A map of environment variables to be used during local development. These variables will also be applied to the Actor when deployed on the Apify platform. For more details, see the [environment variables](https://docs.apify.com/cli/docs/vars) section of the Apify CLI documentation.                                                                                                                          |
| `dockerfile`             | Optional | The path to the Dockerfile to be used for building the Actor on the platform. If not specified, the system will search for Dockerfiles in the `.actor/Dockerfile` and `Dockerfile` paths, in that order. Refer to the [Dockerfile](https://docs.apify.com/actors/development/actor-definition/dockerfile.md) section for more information.                                                                          |
| `dockerContextDir`       | Optional | The path to the directory to be used as the Docker context when building the Actor. The path is relative to the location of the `actor.json` file. This property is useful for monorepos containing multiple Actors. Refer to the [Actor monorepos](https://docs.apify.com/actors/development/deployment/source-types.md#actor-monorepos) section for more details.                                                 |
| `readme`                 | Optional | The path to the README file to be used on the platform. If not specified, the system will look for README files in the `.actor/README.md` and `README.md` paths, in that order of preference. For details, see [Create an Actor README](https://docs.apify.com/actors/publishing/actor-readme.md).                                                                                                                  |
| `input`                  | Optional | You can embed your [input schema](https://docs.apify.com/actors/development/actor-definition/input-schema.md) object directly in `actor.json` under the `input` field. You can also provide a path to a custom input schema. If not provided, the input schema at `.actor/INPUT_SCHEMA.json` or `INPUT_SCHEMA.json` is used, in this order of preference. You can also use the `inputSchema` alias interchangeably. |
| `output`                 | Optional | You can embed your [output schema](https://docs.apify.com/actors/development/actor-definition/output-schema.md) object directly in `actor.json` under the `output` field. You can also provide a path to a custom output schema. [Read more](https://docs.apify.com/actors/development/actor-definition/output-schema.md) about Actor output schemas. You can also use the `outputSchema` alias interchangeably.    |
| `changelog`              | Optional | The path to the CHANGELOG file displayed in the Information tab of the Actor in Apify Console next to Readme. If not provided, the CHANGELOG at `.actor/CHANGELOG.md` or `CHANGELOG.md` is used, in this order of preference. Your Actor doesn't need to have a CHANGELOG but it is a good practice to keep it updated for published Actors.                                                                        |
| `storages.dataset`       | Optional | The `storages.dataset` property defines the schema for the Actor's default dataset. Set the property to an embedded dataset schema object or a path to a dataset schema file. [Read about Actor dataset schemas](https://docs.apify.com/storage/dataset-schema.md).                                                                                                                                                 |
| `storages.datasets`      | Optional | The `storages.datasets` property defines multiple datasets for the Actor. Set the property to an object that maps dataset aliases to embedded dataset schema objects or paths to dataset schema files. [Read about multiple dataset schemas](https://docs.apify.com/storage/dataset-schema/multiple-datasets.md).                                                                                                   |
| `storages.keyValueStore` | Optional | The `storages.keyValueStore` property defines the schema for the Actor's default key-value store. Set the property to an embedded key-value store schema object or a path to a key-value store schema file. [Read about Actor key-value store schemas](https://docs.apify.com/storage/key-value-store-schema.md).                                                                                                   |
| `defaultMemoryMbytes`    | Optional | Specifies the default amount of memory in megabytes to be used when the Actor is started. Can be an integer or a [dynamic memory expression string](https://docs.apify.com/actors/development/actor-definition/dynamic-actor-memory.md).                                                                                                                                                                            |
| `minMemoryMbytes`        | Optional | Specifies the minimum amount of memory in megabytes required by the Actor to run. Requires an *integer* value. If both `minMemoryMbytes` and `maxMemoryMbytes` are set, then `minMemoryMbytes` must be equal or lower than `maxMemoryMbytes`. Refer to the [Usage and resources](https://docs.apify.com/actors/running/usage-and-resources#memory) for more details about memory allocation.                        |
| `maxMemoryMbytes`        | Optional | Specifies the maximum amount of memory in megabytes required by the Actor to run. It can be used to control the costs of run. Requires an *integer* value. Refer to the [Usage and resources](https://docs.apify.com/actors/running/usage-and-resources#memory) for more details about memory allocation.                                                                                                           |
| `usesStandbyMode`        | Optional | Boolean specifying whether the Actor will have [Standby mode](https://docs.apify.com/actors/development/programming-interface/standby.md) enabled.                                                                                                                                                                                                                                                                  |
| `webServerSchema`        | Optional | The `webServerSchema` property defines an OpenAPI v3 schema for the web server running in the Actor. Set the property to an embedded OpenAPI schema object or a path to a JSON schema file. Define the schema when your Actor starts its own HTTP server and you want to describe its interface. See [Actor web server schema](https://docs.apify.com/actors/development/actor-definition/web-server-schema.md).    |
| `webServerMcpPath`       | Optional | The HTTP endpoint path where the Actor exposes its MCP (Model Context Protocol) server functionality. When set, the Actor is recognized as an MCP server. For example, setting `"/mcp"` designates the `/mcp` endpoint as the MCP interface. This path becomes part of the Actor's stable URL when [Standby mode](https://docs.apify.com/actors/development/programming-interface/standby.md) is enabled.           |


---

Source: https://docs.apify.com/actors/development/actor-definition/input-schema

---
title: Actor input schema
url: https://docs.apify.com/actors/development/actor-definition/input-schema.md
parents:
  - [Apify documentation](https://docs.apify.com/llms.txt)
  - [Actors](https://docs.apify.com/actors.md)
  - [Develop](https://docs.apify.com/actors/development.md)
  - [Actor definition](https://docs.apify.com/actors/development/actor-definition.md)
children:
  - [Input schema specification](https://docs.apify.com/actors/development/actor-definition/input-schema/specification/v1.md)
  - [Secret input](https://docs.apify.com/actors/development/actor-definition/input-schema/secret-input.md)
  - [Custom error messages](https://docs.apify.com/actors/development/actor-definition/input-schema/custom-error-messages.md)
previous: [Source code](https://docs.apify.com/actors/development/actor-definition/source-code.md)
next: [Input schema specification](https://docs.apify.com/actors/development/actor-definition/input-schema/specification/v1.md)
---

> ## Documentation index
> Fetch the complete documentation index at: https://docs.apify.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Actor input schema

The input schema defines the input parameters for an Actor. It's a `JSON` object comprising various field types supported by the Apify platform. Based on the input schema, the Apify platform automatically generates a user interface for the Actor. It also validates the input data passed to the Actor when it's executed through the API or the Apify Console UI.

To [publish your Actor to Apify Store](https://docs.apify.com/actors/publishing/publish.md), an input schema is required.

The following is an example of an auto-generated UI for the [Website Content Crawler](https://apify.com/apify/website-content-crawler) Actor.

![Website Content Crawler input UI](/assets/images/input-ui-website-content-crawler-bdcadc69b124e19dd086b2225b501379.png)

With an input schema defined as follows:


```json5
{

    "title": "Input schema for Website Content Crawler",

    "description": "Enter the start URL(s) of the website(s) to crawl, configure other optional settings, and run the Actor to crawl the pages and extract their text content.",

    "type": "object",

    "schemaVersion": 1,

    "properties": {

        "startUrls": {

            "title": "Start URLs",

            "type": "array",

            "description": "One or more URLs of the pages where the crawler will start. Note that the Actor will additionally only crawl sub-pages of these URLs. For example, for the start URL `https://www.example.com/blog`, it will crawl pages like `https://example.com/blog/article-1`, but will skip `https://example.com/docs/something-else`.",

            "editor": "requestListSources",

            "prefill": [{ "url": "https://docs.apify.com/" }]

        },

        "crawlerType": {

            "sectionCaption": "Crawler settings",

            "title": "Crawler type",

            "type": "string",

            "enum": ["playwright:chrome", "cheerio", "jsdom"],

            "enumTitles": ["Headless web browser (Chrome+Playwright)", "Raw HTTP client (Cheerio)", "Raw HTTP client with JS execution (JSDOM) (experimental!)"],

            "description": "Select the crawling engine:\n- **Headless web browser** (default) - Useful for modern websites with anti-scraping protections and JavaScript rendering. It recognizes common blocking patterns like CAPTCHAs and automatically retries blocked requests through new sessions. However, running web browsers is more expensive as it requires more computing resources and is slower. It is recommended to use at least 8 GB of RAM.\n- **Raw HTTP client** - High-performance crawling mode that uses raw HTTP requests to fetch the pages. It is faster and cheaper, but it might not work on all websites.",

            "default": "playwright:chrome"

        },

        "maxCrawlDepth": {

            "title": "Max crawling depth",

            "type": "integer",

            "description": "The maximum number of links starting from the start URL that the crawler will recursively descend. The start URLs have a depth of 0, the pages linked directly from the start URLs have a depth of 1, and so on.\n\nThis setting is useful to prevent accidental crawler runaway. By setting it to 0, the Actor will only crawl start URLs.",

            "minimum": 0,

            "default": 20

        },

        "maxCrawlPages": {

            "title": "Max pages",

            "type": "integer",

            "description": "The maximum number pages to crawl. It includes the start URLs, pagination pages, pages with no content, etc. The crawler will automatically finish after reaching this number. This setting is useful to prevent accidental crawler runaway.",

            "minimum": 0,

            "default": 9999999

        },

        // ...

    }

}
```


The actual input object passed from the autogenerated input UI to the Actor then looks like this:


```json
{

    "debugMode": false,

    "proxyConfiguration": {

        "useApifyProxy": true

    },

    "saveHtml": false,

    "saveMarkdown": false,

    "saveScreenshots": false,

    "startUrls": [

        {

            "url": "https://docs.apify.com/"

        }

    ]

}
```


Next, let's take a look at [input schema specification](https://docs.apify.com/actors/development/actor-definition/input-schema/specification/v1.md), the possibility of using input schema to enable users to pass [secrets](https://docs.apify.com/actors/development/actor-definition/input-schema/secret-input.md), and how to define [custom error messages](https://docs.apify.com/actors/development/actor-definition/input-schema/custom-error-messages.md) for input validation.


---

Source: https://docs.apify.com/actors/publishing

---
title: Publish Actors
url: https://docs.apify.com/actors/publishing.md
parents:
  - [Apify documentation](https://docs.apify.com/llms.txt)
  - [Actors](https://docs.apify.com/actors.md)
children:
  - [Publish your Actor](https://docs.apify.com/actors/publishing/publish.md)
  - [Publish your Actor task](https://docs.apify.com/actors/publishing/publish-task.md)
  - [Automated testing](https://docs.apify.com/actors/publishing/test.md)
  - [Actor status badge](https://docs.apify.com/actors/publishing/status-badge.md)
  - [Actor quality score](https://docs.apify.com/actors/publishing/quality-score.md)
  - [Monitor your Actor's rating](https://docs.apify.com/actors/publishing/actor-rating.md)
  - [Display Actor status](https://docs.apify.com/actors/publishing/actor-status.md)
previous: [Performance](https://docs.apify.com/actors/development/performance.md)
next: [Publish your Actor](https://docs.apify.com/actors/publishing/publish.md)
---

> ## Documentation index
> Fetch the complete documentation index at: https://docs.apify.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Publish Actors

> Sharing is caring but you can also make money from your Actors. Check out the [blog post](https://blog.apify.com/make-regular-passive-income-developing-web-automation-actors-b0392278d085/) for more context.

## Publish process

To build & publish an Actor on [Apify Store](https://apify.com/store), you'll go through the following main stages:

1. [Development](https://docs.apify.com/actors/development.md).
2. [Publication](https://docs.apify.com/actors/publishing/publish.md) and set up of [monetization](https://docs.apify.com/actors/monetize.md).
3. [Testing](https://docs.apify.com/actors/development/automated-tests.md).
4. [Promotion](https://apify.notion.site/3fdc9fd4c8164649a2024c9ca7a2d0da?v=6d262c0b026d49bfa45771cd71f8c9ab).

## Benefits of publishing your Actor

Publishing your Actor on Apify Store transforms your code, eliminating traditional SaaS development overhead. When you publish your Actor you gain access to:

* Streamlined product delivery

  <!-- -->

  * Dedicated landing page for your Actor
  * Built-in documentation hosting through seamless README integration
  * Direct exposure to organic user traffic through Apify Store

* Reduced operational burden

  <!-- -->

  * No need for separate domains or websites
  * Built-in cloud infrastructure with automatic scaling
  * Multiple payment options with automated billing & transactions
  * Minimal marketing efforts required due to marketplace presence

Packaging your software as an Actor allows you to launch new SaaS product faster and earn income through monetization that matches your Actor's value proposition.

To learn more, visit the [Actors in Store](https://docs.apify.com/actors/running/actors-in-store.md#pricing-models) page.

## Maintain public Actors

While private Actors don't necessarily require ongoing maintenance, public Actors demand a higher level of responsibility. Since public Actors are available on the [Apify Store](https://apify.com/store) and may be used by other users, an unmaintained public Actor could negatively impact those who depend on it.

To ensure long-term quality and improve your chances of successfully monetizing your Actors, we recommend reserving approximately 2 hours per week for maintenance tasks, such as:

* Addressing bug reports and issues
* Implementing updates and improvements
* Responding to user inquiries and feedback

If you decide to make your Actor's code publicly available on [GitHub](https://github.com), code quality becomes even more crucial, as your Actor may be the first experience some users have with Apify.

### Handle breaking changes

While refactoring and updating your Actor's code is encouraged, be cautious of making changes that could break the Actor for existing users. If you plan to introduce breaking change, please contact us at [community@apify.com](mailto:community@apify.com) beforehand, and we'll assist you in communicating the change to your users.

### Documentation and testing

Pay special attention to your Actor's documentation ([README](https://docs.apify.com/actors/publishing/actor-readme.md)). It should be clear, detailed, concise and, readable, using simple language and avoiding technical jargon whenever possible, as your users may not be developers.

Ensure periodic testing, either manually or by [setting up automatic testing](https://docs.apify.com/actors/development/automated-tests.md) and [monitoring](https://apify.com/apify/monitoring). This can help prevent users from encountering issues with your Actor.

## Inspiration for new Actors

To find ideas for new Actor, consider the following sources:

* Your own experiences with friends, colleagues, and customers
* SEO tools to identify search terms, websites related to web scraping, web automation, or web integrations (see the [SEO article](https://apify.notion.site/SEO-990259fe88a84fd0a85ce6d3b394d8c1) for more details)
* The [Actor ideas page](https://apify.com/ideas) to find Actors in demand by the Apify community
* The [Discord community](https://discord.com/invite/jyEM2PRvMU), especially the [#hire-freelancers](https://discord.com/channels/801163717915574323/1022804760484659210) channel can offer great insights

Additionally, you can refer to the [Apify blog](https://blog.apify.com/) for examples of how we write about and present Actors, such as the:

* [Content Checker article](https://blog.apify.com/set-up-alert-when-webpage-changes/)
* [Kickstarter scraper article](https://blog.apify.com/kickstarter-search-actor-create-your-own-kickstarter-api/)
* [Google Sheets Actor article](https://blog.apify.com/google-sheets-import-data/)

## Compete with other Actors

Apify Store allows for competition between Actors. You can publish a scraper for a specific website even if similar Actors are already available.

However, Apify penalizes copyright infringement. If someone copies elements of your Actor, [contact Apify support](https://apify.com/contact).


---

Source: https://docs.apify.com/actors/publishing/publish

---
title: Publish your Actor
url: https://docs.apify.com/actors/publishing/publish.md
parents:
  - [Apify documentation](https://docs.apify.com/llms.txt)
  - [Actors](https://docs.apify.com/actors.md)
  - [Publish](https://docs.apify.com/actors/publishing.md)
children:
  - [Create an Actor README](https://docs.apify.com/actors/publishing/actor-readme.md)
previous: [Publish](https://docs.apify.com/actors/publishing.md)
next: [Create an Actor README](https://docs.apify.com/actors/publishing/actor-readme.md)
---

> ## Documentation index
> Fetch the complete documentation index at: https://docs.apify.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Publish your Actor

By publishing your Actor, you make it available to the public on [Apify Store](https://apify.com/store). Publishing turns your Actor into a product with its own dedicated page, where users can read its documentation, run it, and review it.

## Before you start

To publish an Actor on Apify Store, you must first:

* Accept the [Store Publishing Terms and Conditions](https://docs.apify.com/legal/store-publishing-terms-and-conditions.md).
* Build and run your Actor at least once.
* Update your [Actor README](https://docs.apify.com/actors/publishing/actor-readme.md).
* Define the [input](https://docs.apify.com/actors/development/actor-definition/input-schema.md) and [output](https://docs.apify.com/actors/development/actor-definition/output-schema.md) schemas of your Actor.

If your Actor requires [full permissions](https://docs.apify.com/actors/development/permissions.md), or you want to publish more than 10 Actors, you must also [verify your identity](https://docs.apify.com/actors/monetize/monthly-payouts.md#verify-your-identity).

## Make your Actor public

To make your Actor available on Apify Store:

1. Log in to [Apify Console](https://console.apify.com).
2. In the left-side panel, go to **Development** > **My Actors**.
3. From the table, select the Actor you want to publish.
4. Go to the **Publishing** tab.

Complete all required fields in the following sections:

1. In the **Display information** section, add an Actor logo and [description](https://docs.apify.com/academy/actor-marketing-playbook/actor-basics/actor-description.md).

2. In the **Monetization** section, [set up monetization](https://docs.apify.com/actors/monetize.md) for your Actor.

3. In the **Sample output** section, add a sample output for your Actor. If the [input schema](https://docs.apify.com/actors/development/actor-definition/input-schema.md) already includes the sample output, it's added automatically.

4. In the **Output schema** section, define the [output schema](https://docs.apify.com/actors/development/actor-definition/output-schema.md) of your Actor. Optionally, define also the following schemas:

   <!-- -->

   * [Dataset schema](https://docs.apify.com/storage/dataset-schema.md)
   * [Key-value store schema](https://docs.apify.com/storage/key-value-store-schema.md)
   * [Live-view web server OpenAPI schema](https://docs.apify.com/actors/development/actor-definition/web-server-schema.md)

5. In **Actor permissions**, define the [permission level](https://docs.apify.com/actors/development/permissions.md) that your Actor requires.

Once all sections are marked as completed, select **Publish on Store**.

## Verify the publication

To verify that your Actor has been published, use one of these methods:

* Open `https://apify.com/YOUR_USERNAME/YOUR_ACTOR_NAME` in a private browser window. If the Actor's page loads, your Actor is published.
* Call the [Get Actor](https://docs.apify.com/api/v2/actor-get.md) API endpoint. If the `isPublic` property in the response is `true`, your Actor is published.

## Publish Actor's source code

By default, the source code of your Actor is hidden from the public.

By making the source files and non-secret [environment variables](https://docs.apify.com/actors/development/programming-interface/environment-variables.md) of your Actor publicly visible, you make your Actor open source and eligible for payouts through the [Apify Open Source Fair Share program](https://apify.com/partners/open-source-fair-share).

To publish your Actor's source code:

1. Log in to [Apify Console](https://console.apify.com).
2. In the left-side panel, go to **Development** > **My Actors**.
3. From the table, select the Actor whose source code you want to publish.
4. Go to the **Publishing** tab.
5. In **Display information**, uncheck **Hide source files from Actor detail**.

You can't publish the source code of an Actor that you build from a private repository. Secret environment variables are never exposed.


---

Source: https://docs.apify.com/cli/docs/reference

# Command reference

Copy for LLM

The Apify CLI provides tools for managing your Apify projects and resources from the command line. Use these commands to develop Actors locally, deploy them to Apify platform, manage storage, orchestrate runs, and handle account configuration.

This reference guide documents available commands, their options, and common usage patterns, to efficiently work with Apify platform.

### General[](#general)

The general commands provide basic functionality for getting help and information about the Apify CLI.

##### `apify help`[](#apify-help)

```
DESCRIPTION

  Prints out help about a command, or all available commands.



USAGE

  $ apify help [commandString] [--skill]



ARGUMENTS

  commandString  The command to get help for.



FLAGS

      --skill  Print the Apify CLI agent skill (guidance for driving

               `apify` from agents).
```

##### `apify upgrade`[](#apify-upgrade)

```
DESCRIPTION

  Checks that installed Apify CLI version is up to date.



USAGE

  $ apify upgrade [-f] [--version <value>]



FLAGS

  -f, --force            [DEPRECATED] This flag is now

                         ignored, as running the command manually will always check

                         for the latest version.

      --version=<value>  The version of the CLI to upgrade to. If

                         not provided, the latest version will be used.
```

##### `apify api`[](#apify-api)

```
DESCRIPTION

  Makes an authenticated HTTP request to the Apify API and prints the response.

  The endpoint can be a relative path (e.g. "acts", "v2/acts", or "/v2/acts"); 

  the "v2/" prefix is added automatically if omitted.



  Use --list-endpoints to see all available API endpoints.



USAGE

  $ apify api [methodOrEndpoint] [endpoint] [-d <value>]

              [--describe <value> | -l | -s <value>] [-H <value>]

              [-X GET|POST|PUT|PATCH|DELETE] [-p <value>]



ARGUMENTS

  methodOrEndpoint  The API endpoint path (e.g. "acts",

                    "v2/acts", "/v2/users/me"), or an HTTP method followed by the

                    endpoint (e.g. "GET /v2/users/me").

  endpoint          The API endpoint path when the first

                    argument is an HTTP method.



FLAGS

  -d, --body=<value>      The request body (JSON string).

                          Use "-" to read from stdin.

      --describe=<value>  Print a reference for an endpoint

                          path: its HTTP methods, summary, and path parameters.

                          Leading slashes and a version prefix in the path are

                          optional. For example, "actor-runs/{runId}" and

                          "/v2/actor-runs/{runId}" are both accepted.

      -H, --header=<value>    Additional HTTP header(s). Pass a

                          single "key:value" string, or a JSON object like

                          '{"X-Foo": "bar", "X-Baz": "qux"}' to send multiple

                          headers. The flag can only be used once; use the JSON form

                          for multiple headers.

  -l, --list-endpoints    List all available Apify API

                          endpoints.

      -X, --method=<option>   The HTTP method to use. Defaults

                          to GET.

                          <options: GET|POST|PUT|PATCH|DELETE>

  -p, --params=<value>    Query parameters as a JSON object,

                          e.g. '{"limit": 1, "desc": true}'.

  -s, --search=<value>    Filter results returned by

                          --list-endpoints. The query is case-insensitive and split

                          into tokens by spaces. For an endpoint to be returned,

                          every token must appear in that endpoint's method, path,

                          or summary.
```

##### `apify telemetry`[](#apify-telemetry)

```
DESCRIPTION

  Enable or disable anonymous telemetry. We use this data to improve the CLI and

   the Apify platform.



SUBCOMMANDS

  telemetry enable   Enables telemetry.

  telemetry disable  Disables telemetry.
```

##### `apify telemetry enable`[](#apify-telemetry-enable)

```
DESCRIPTION

  Enables telemetry.



USAGE

  $ apify telemetry enable
```

##### `apify telemetry disable`[](#apify-telemetry-disable)

```
DESCRIPTION

  Disables telemetry.



USAGE

  $ apify telemetry disable
```

### Authentication & Account management[](#authentication--account-management)

Use these commands to manage your Apify account authentication, access tokens, and configuration settings. These commands control how you interact with Apify platform and manage sensitive information.

##### `apify auth`[](#apify-auth)

```
DESCRIPTION

  Log in, log out, and inspect your stored Apify API token. Also available as 

  `apify login` / `apify logout`.



SUBCOMMANDS

  auth login   Authenticates your Apify account and saves credentials

               to '~/.apify/auth.json'.

  auth logout  Removes authentication by deleting your API token and

               account information from '~/.apify/auth.json'.

  auth token   Prints the current API token for the Apify CLI.
```

##### `apify auth login` / `apify login`[](#apify-auth-login--apify-login)

```
DESCRIPTION

  Authenticates your Apify account and saves credentials to 

  '~/.apify/auth.json'.

  All other commands use these stored credentials.



  Run 'apify logout' to remove authentication.



USAGE

  $ apify auth login [-m console|manual] [-t <value>]



FLAGS

  -m, --method=<option>  Method of logging in to Apify.

                         <options: console|manual>

  -t, --token=<value>    Apify API token.
```

##### `apify auth logout` / `apify logout`[](#apify-auth-logout--apify-logout)

```
DESCRIPTION

  Removes authentication by deleting your API token and account information from

   '~/.apify/auth.json'.

  Run 'apify login' to authenticate again.



USAGE

  $ apify auth logout
```

##### `apify auth token`[](#apify-auth-token)

```
DESCRIPTION

  Prints the current API token for the Apify CLI.



USAGE

  $ apify auth token
```

##### `apify info`[](#apify-info)

```
DESCRIPTION

  Prints details about your currently authenticated Apify account.



USAGE

  $ apify info
```

##### `apify secrets`[](#apify-secrets)

```
DESCRIPTION

  Manage locally stored secrets that can be referenced from '.actor/actor.json' 

  environment variables using the "@" prefix (e.g. "@mySecret"). Secrets are 

  uploaded alongside the Actor and stored encrypted on the Apify platform.



SUBCOMMANDS

  secrets add  Adds a new secret to '~/.apify' for use in Actor

               environment variables.

  secrets ls   Lists all secret keys stored in your local

               configuration.

  secrets rm   Permanently deletes a secret from your stored

               credentials.
```

##### `apify secrets add`[](#apify-secrets-add)

```
DESCRIPTION

  Adds a new secret to '~/.apify' for use in Actor environment variables.



USAGE

  $ apify secrets add <name> <value>



ARGUMENTS

  name   Name of the secret.

  value  Value of the secret.
```

##### `apify secrets ls`[](#apify-secrets-ls)

```
DESCRIPTION

  Lists all secret keys stored in your local configuration.



USAGE

  $ apify secrets ls [--json]



FLAGS

      --json  Format the command output as JSON.
```

##### `apify secrets rm`[](#apify-secrets-rm)

```
DESCRIPTION

  Permanently deletes a secret from your stored credentials.



USAGE

  $ apify secrets rm <name>



ARGUMENTS

  name  Name of the secret.
```

### Actor development[](#actor-development)

These commands help you develop Actors locally. Use them to create new Actor projects, initialize configurations, run Actors in development mode, and validate input schemas. This section also includes commands used within running Actors to interact with the Apify platform, such as reading input, storing values, and pushing data.

##### `apify create`[](#apify-create)

```
DESCRIPTION

  Creates an Actor project from a template in a new directory. The command 

  automatically initializes a git repository in the newly created Actor 

  directory.



USAGE

  $ apify create [actorName] [--auto-build on|off]

                 [--git-repo <value>] [--json]

                 [-l javascript|js|typescript|ts|python|py]

                 [--omit-optional-deps] [--skip-dependency-install]

                 [--skip-git-init] [--source apify|github|gitlab|bitbucket]

                 [-t <value>]

                 [-u web-scraper|ai-agent|data-pipeline|browser-automation]



ARGUMENTS

  actorName  Name of the Actor and its directory.



FLAGS

      --auto-build=<option>      Whether a push to the

                                 repository rebuilds the Actor. On by default.

                                 Turning it on registers a push webhook on the new

                                 repository, which needs admin rights on it. Only

                                 used when --source is a Git provider.

                                 <options: on|off>

      --git-repo=<value>         Repository to create, as

                                 "workspace/name" — a workspace being an account or

                                 organization you have given Apify access to. A bare

                                 value is read as the name, not the workspace. The

                                 name defaults to the Actor name, and the workspace

                                 is asked for when you have more than one. List

                                 yours with "apify api integrations/git". Only used

                                 when --source is a Git provider.

      --json                     Format the command

                                 output as JSON.

  -l, --language=<option>        Filter templates by

                                 programming language. Ignored when --template is

                                 provided.

                                 <options: javascript|js|typescript|ts|python|py>

      --omit-optional-deps       Skip installing optional

                                 dependencies.

      --skip-dependency-install  Skip installing Actor

                                 dependencies.

      --skip-git-init            Skip initializing a git

                                 repository in the Actor directory.

      --source=<option>          Where the Actor source

                                 code will live. With a Git provider, Apify creates

                                 the repository on your connected account from the

                                 template, clones it here, and creates an Actor that

                                 builds from it.

                                 <options: apify|github|gitlab|bitbucket>

  -t, --template=<value>         Template for the

                                 Actor. If not provided, the command will prompt for

                                 it. Visit

                                 https://raw.githubusercontent.com/apify/actor-templates/master/templates/manifest.json

                                 to find available template names.

  -u, --use-case=<option>        Filter templates by

                                 use case. Ignored when --template is provided. To

                                 see the use cases each template supports, run

                                 "apify templates ls".

                                 <options:

                                 web-scraper|ai-agent|data-pipeline|browser-automation>
```

##### `apify templates`[](#apify-templates)

```
DESCRIPTION

  Explore the Actor templates used by "apify create".



SUBCOMMANDS

  templates ls  Prints all available Actor templates, including the

                use cases and language each one supports.
```

##### `apify templates ls`[](#apify-templates-ls)

```
DESCRIPTION

  Prints all available Actor templates, including the use cases and language 

  each one supports.



USAGE

  $ apify templates ls [--json]



FLAGS

      --json  Format the command output as JSON.
```

##### `apify init`[](#apify-init)

```
DESCRIPTION

  Sets up an Actor project in your current directory by creating actor.json and 

  storage files.

  If the directory contains a Scrapy project in Python, the command 

  automatically creates wrappers so that you can run your scrapers without 

  changes.

  Creates the '.actor/actor.json' file and the 'storage' directory in the 

  current directory, but does not touch any other existing files or directories.



  WARNING: Overwrites existing 'storage' directory.



USAGE

  $ apify init [actorName] [--dockerfile <value>] [-y]



ARGUMENTS

  actorName  Name of the Actor. If not provided, you will be prompted

             for it.



FLAGS

      --dockerfile=<value>  Path to a Dockerfile to use for

                            the Actor (e.g., "./Dockerfile" or

                            "./docker/Dockerfile").

  -y, --yes                 Automatic yes to prompts;

                            assume "yes" as answer to all prompts.
```

##### `apify run`[](#apify-run)

```
DESCRIPTION

  Executes Actor locally with simulated Apify environment variables.

  Stores data in local 'storage' directory.



  NOTE: For Node.js Actors, customize behavior by modifying the 'start' script 

  in package.json file.



USAGE

  $ apify run [--allow-missing-secrets] [--entrypoint <value>]

              [-i <value> | --input-file <value>] [-p | --resurrect]



FLAGS

      --allow-missing-secrets  Allow the command to

                               continue even when secret values are not found in the

                               local secrets storage.

      --entrypoint=<value>     Optional entrypoint for

                               running with injected environment variables.

                               For Python, it is the module name, or a path to a

                               file.

                               For Node.js, it is the npm script name, or a path to

                               a JS/MJS file. You can also pass in a directory name,

                               provided that directory contains an "index.js" file.

  -i, --input=<value>          Optional JSON input to

                               be given to the Actor.

      --input-file=<value>     Optional path to a file with

                               JSON input to be given to the Actor. The file must be

                               a valid JSON file. You can also specify `-` to read

                               from standard input.

  -p, --purge                  Whether to purge the

                               default request queue, dataset and key-value store

                               before the run starts.

                               For crawlee projects, this is the default behavior,

                               and the flag is optional.

                               Use `--no-purge` to keep the storage folder intact.

      --resurrect              Whether to keep the default

                               request queue, dataset and key-value store before the

                               run starts.
```

##### `apify validate-schema`[](#apify-validate-schema)

```
DESCRIPTION

  Validates Actor schemas.



  When a path argument is provided, validates only the input schema at that 

  path.



  When no path is provided, validates all schemas found in '.actor/actor.json':

    - Input schema (from "input" key or default locations)

    - Dataset schema (from "storages.dataset")

    - Output schema (from "output")

    - Key-Value Store schema (from "storages.keyValueStore")



USAGE

  $ apify validate-schema [path]



ARGUMENTS

  path  Optional path to your INPUT_SCHEMA.json file. If not provided,

        validates all schemas in '.actor/actor.json'.
```

##### `apify actor`[](#apify-actor)

```
DESCRIPTION

  Runtime data operations intended to be called from inside a running Actor: 

  read input, push data, get/set records in the default key-value store, charge 

  pay-per-event, generate schema types.



  For platform-level management (deploy, list, call Actors), see 'apify actors' 

  (plural).



SUBCOMMANDS

  actor set-value              Sets or removes a

                               record in the default key-value store associated

                               with the Actor run.

  actor push-data              Saves data to Actor's

                               run default dataset.

  actor get-value              Gets a value from the

                               default key-value store associated with the Actor

                               run.

  actor get-public-url         Get an HTTP URL that

                               allows public access to a key-value store item.

  actor get-input              Gets the Actor input

                               value from the default key-value store associated

                               with the Actor run.

  actor charge                 Charge for a specific

                               event in a pay-per-event Actor run.

  actor calculate-memory       Calculates the Actor’s

                               dynamic memory usage based on a memory expression

                               from actor.json, input data, and run options.

  actor generate-schema-types  Generate TypeScript

                               types from Actor schemas.
```

##### `apify actor calculate-memory`[](#apify-actor-calculate-memory)

```
DESCRIPTION

  Calculates the Actor’s dynamic memory usage based on a memory expression from 

  actor.json, input data, and run options.



USAGE

  $ apify actor calculate-memory [--build <value>]

                                 [--default-memory-mbytes <value>]

                                 [--input <value>] [--max-items <value>]

                                 [--max-total-charge-usd <value>]

                                 [--timeout-secs <value>]



FLAGS

      --build=<value>                  Actor build

                                       version or build tag to evaluate the

                                       expression with.

      --default-memory-mbytes=<value>

                                       Memory-calculation expression (in MB). If

                                       omitted, the value is loaded from the

                                       actor.json file.

      --input=<value>                  Path to the

                                       input JSON file used for the calculation.

      --max-items=<value>              Maximum

                                       number of items Actor can output.

      --max-total-charge-usd=<value>   Maximum

                                       total charge in USD.

      --timeout-secs=<value>           Maximum run

                                       timeout, in seconds.
```

##### `apify actor charge`[](#apify-actor-charge)

```
DESCRIPTION

  Charge for a specific event in a pay-per-event Actor run.



USAGE

  $ apify actor charge <eventName> [--count <value>]

                       [--idempotency-key <value>] [--test-pay-per-event]



ARGUMENTS

  eventName  Name of the event to charge for.



FLAGS

      --count=<value>            Number of events to

                                 charge.

      --idempotency-key=<value>  Idempotency key for the

                                 charge request.

      --test-pay-per-event       Test pay-per-event

                                 charging without actually charging.
```

##### `apify actor generate-schema-types`[](#apify-actor-generate-schema-types)

```
DESCRIPTION

  Generate TypeScript types from Actor schemas.



  Generates types from the input schema and, when no custom path is provided,

  also from the Dataset, Output (experimental), and Key-Value Store 

  (experimental)

  schemas defined in '.actor/actor.json'.



  Reads the input schema from one of these locations (in priority order):

    1. Object in '.actor/actor.json' under "input" key

    2. JSON file path in '.actor/actor.json' "input" key

    3. .actor/INPUT_SCHEMA.json

    4. INPUT_SCHEMA.json



  Optionally specify a custom schema file path, or a directory path.

  When a directory is provided, all schemas are discovered from it

  just as if the command were run from that directory with no argument.



USAGE

  $ apify actor generate-schema-types [path]

                                      [--all-optional] [-o <value>] [--strict]



ARGUMENTS

  path  Optional path to an input schema file or a directory containing

        Actor schemas. If a directory is given, all schema types are generated

        from it. If not provided, searches default locations in the current

        directory.



FLAGS

      --all-optional    Mark all properties as optional in

                        generated types.

  -o, --output=<value>  Directory where the generated files

                        should be outputted. Defaults to src/__generated__/actor/ to

                        stay within the typical tsconfig rootDir.

      --strict          Whether generated interfaces should be

                        strict (no index signature [key: string]: unknown).
```

##### `apify actor get-input`[](#apify-actor-get-input)

```
DESCRIPTION

  Gets the Actor input value from the default key-value store associated with 

  the Actor run.



USAGE

  $ apify actor get-input
```

##### `apify actor get-public-url`[](#apify-actor-get-public-url)

```
DESCRIPTION

  Get an HTTP URL that allows public access to a key-value store item.



USAGE

  $ apify actor get-public-url <key>



ARGUMENTS

  key  Key of the record in the key-value store.
```

##### `apify actor get-value`[](#apify-actor-get-value)

```
DESCRIPTION

  Gets a value from the default key-value store associated with the Actor run.



USAGE

  $ apify actor get-value <key>



ARGUMENTS

  key  Key of the record in the key-value store.
```

##### `apify actor push-data`[](#apify-actor-push-data)

```
DESCRIPTION

  Saves data to Actor's run default dataset.



USAGE

  $ apify actor push-data [item]



ARGUMENTS

  item  JSON string with one object or array of objects containing data to

        be stored in the default dataset.
```

##### `apify actor set-value`[](#apify-actor-set-value)

```
DESCRIPTION

  Sets or removes a record in the default key-value store associated with the 

  Actor run.



USAGE

  $ apify actor set-value <key> [value] [-c <value>]



ARGUMENTS

  key    Key of the record in key-value store.

  value  Record data, which can be one of the following values:

         - If empty, the record in the key-value store is deleted.

         - If no `contentType` flag is specified, value is expected to be any JSON

         string value.

         - If options.contentType is set, value is taken as is.



FLAGS

  -c, --content-type=<value>  Specifies a custom MIME

                              content type of the record. By default

                              "application/json" is used.
```

### Actor management[](#actor-management)

These commands let you manage Actors on Apify platform. They provide functionality for deployment, execution, monitoring, and maintenance of your Actors in the cloud environment.

##### `apify actors`[](#apify-actors)

```
DESCRIPTION

  Search, list, deploy, and call Actors on the Apify platform.

  For runtime operations inside a running Actor (push-data, get-input, 

  set-value...), see 'apify actor' (singular).



SUBCOMMANDS

  actors start   Starts Actor remotely and returns run details

                 immediately.

  actors rm      Permanently removes an Actor from your account.

  actors search  Searches Actors in the Apify Store.

  actors push    Deploys Actor to Apify platform using settings

                 from '.actor/actor.json'.

  actors pull    Download Actor code to current directory. Clones

                 Git repositories or fetches Actor files based on the source type.

  actors ls      Prints a list of recently executed Actors or

                 Actors you own.

  actors info    Get information about an Actor.

  actors call    Executes Actor remotely using your authenticated

                 account.

  actors build   Creates a new build of the Actor.
```

##### `apify actors ls`[](#apify-actors-ls)

```
DESCRIPTION

  Prints a list of recently executed Actors or Actors you own.



USAGE

  $ apify actors ls [--desc] [--json] [--limit <value>] [--my]

                    [--offset <value>]



FLAGS

      --desc            Sort Actors in descending order.

      --json            Format the command output as JSON.

      --limit=<value>   Number of Actors that will be listed.

      --my              Whether to list Actors made by the logged

                        in user.

      --offset=<value>  Number of Actors that will be skipped.
```

##### `apify actors search`[](#apify-actors-search)

```
DESCRIPTION

  Searches Actors in the Apify Store.



  Searches the Apify Store for Actors matching the given query. Results can be 

  filtered by category, author, pricing model, and more. This command does not 

  require authentication.



USAGE

  $ apify actors search [query] [--category <value>]

                        [--json] [--limit <value>] [--offset <value>]

                        [--pricing-model

                        FREE|FLAT_PRICE_PER_MONTH|PRICE_PER_DATASET_ITEM|PAY_PER_EVENT]

                        [--sort-by relevance|popularity|newest|lastUpdate]

                        [--username <value>]



ARGUMENTS

  query  Search query to find Actors by title, name, description, username,

         or readme.



FLAGS

      --category=<value>        Filter by category (e.g.

                                AI).

      --json                    Format the command output

                                as JSON.

      --limit=<value>           Maximum number of results

                                to return.

      --offset=<value>          Number of results to skip

                                for pagination.

      --pricing-model=<option>  Filter by pricing model.

                                <options:

                                FREE|FLAT_PRICE_PER_MONTH|PRICE_PER_DATASET_ITEM|PAY_PER_EVENT>

      --sort-by=<option>        Sort order for the

                                results.

                                <options: relevance|popularity|newest|lastUpdate>

      --username=<value>        Filter by Actor author

                                username.
```

##### `apify actors rm`[](#apify-actors-rm)

```
DESCRIPTION

  Permanently removes an Actor from your account.



USAGE

  $ apify actors rm <actorId> [-y]



ARGUMENTS

  actorId  The Actor ID to delete.



FLAGS

  -y, --yes  Automatic yes to prompts; assume "yes" as answer to all

             prompts.
```

#### Actor deployment[](#actor-deployment)

These commands handle the deployment workflow of Actors to Apify platform. Use them to push local changes, pull remote Actors, and manage Actor versions and builds.

##### `apify actors push` / `apify push`[](#apify-actors-push--apify-push)

```
DESCRIPTION

  Deploys Actor to Apify platform using settings from '.actor/actor.json'.

  Files under '3' MB upload as "Multiple source files"; larger projects upload 

  as ZIP file.

  Files matched by .gitignore and .actorignore are excluded. Use negation 

  patterns (e.g. !dist/) in .actorignore to force-include git-ignored files.

  Use --force to override newer remote versions.



USAGE

  $ apify actors push [actorId] [--allow-missing-secrets]

                      [-b <value>] [--dir <value>] [-f] [--json] [--open]

                      [-v <value>] [-w <value>]



ARGUMENTS

  actorId  Name or ID of the Actor to push (e.g. "apify/hello-world" or

           "E2jjCZBezvAZnX8Rb"). If not provided, the command will create or

           modify the Actor with the name specified in '.actor/actor.json' file.



FLAGS

      --allow-missing-secrets    Allow the command to

                                 continue even when secret values are not found in

                                 the local secrets storage.

  -b, --build-tag=<value>        Build tag to be

                                 applied to the successful Actor build. By default,

                                 it is taken from the '.actor/actor.json' file.

      --dir=<value>              Directory where the

                                 Actor is located.

  -f, --force                    Push an Actor even

                                 when the local files are older than the Actor on

                                 the platform, or when the Actor builds from a Git

                                 repository.

      --json                     Format the command

                                 output as JSON.

      --open                     Whether to open the

                                 browser automatically to the Actor details page.

  -v, --version=<value>          Actor version number

                                 to which the files should be pushed. By default, it

                                 is taken from the '.actor/actor.json' file.

  -w, --wait-for-finish=<value>  In seconds, how long

                                 to wait for the build to finish. If no value

                                 passed, it waits forever. To return as soon as the

                                 build is queued (fire-and-forget), pass 0. The exit

                                 code reflects the build outcome only — if the wait

                                 elapses with the build still running, the command

                                 exits 0; check status via the printed link or

                                 --json output.
```

##### `apify actors pull` / `apify pull`[](#apify-actors-pull--apify-pull)

```
DESCRIPTION

  Download Actor code to current directory. Clones Git repositories or fetches 

  Actor files based on the source type.



USAGE

  $ apify actors pull [actorId] [--dir <value>] [-v <value>]



ARGUMENTS

  actorId  Name or ID of the Actor to run (e.g. "apify/hello-world" or

           "E2jjCZBezvAZnX8Rb"). If not provided, the command will update the

           Actor in the current directory based on its name in ".actor/actor.json"

           file.



FLAGS

      --dir=<value>      Directory where the Actor should be

                         pulled to.

  -v, --version=<value>  Actor version number which will be

                         pulled, e.g. 1.2. Default: the highest version.
```

##### `apify actors call` / `apify call`[](#apify-actors-call--apify-call)

```
DESCRIPTION

  Executes Actor remotely using your authenticated account.

  Reads input from local key-value store by default.

  To inspect the input schema before creating a JSON input, use "apify actors 

  info <actor> --input".



USAGE

  $ apify actors call [actorId] [-b <value>]

                      [-i <value> | -f <value>] [--json] [-m <value>] [-o] [-s]

                      [-t <value>]



ARGUMENTS

  actorId  Name or ID of the Actor to run (e.g. "my-actor",

           "apify/hello-world" or "E2jjCZBezvAZnX8Rb"). If not provided, the

           command runs the remote Actor specified in the '.actor/actor.json'

           file.



FLAGS

  -b, --build=<value>       Tag or number of the build to

                            run (e.g. "latest" or "1.2.34").

  -i, --input=<value>       Optional inline JSON object

                            input for the Actor. To avoid shell parsing issues, wrap

                            the JSON in quotes. For JSON files, use --input-file.

  -f, --input-file=<value>  Optional path to a file with

                            JSON input to be given to the Actor. The file must be a

                            valid JSON file. You can also specify `-` to read from

                            standard input.

      --json                Format the command output as JSON.

  -m, --memory=<value>      Amount of memory allocated for

                            the Actor run, in megabytes.

  -o, --output-dataset      Prints out the entire default

                            dataset on successful run of the Actor.

  -s, --silent              Prevents printing the logs of

                            the Actor run to the console.

  -t, --timeout=<value>     Timeout for the Actor run in

                            seconds. Zero value means there is no timeout.
```

##### `apify actors start`[](#apify-actors-start)

```
DESCRIPTION

  Starts Actor remotely and returns run details immediately.

  Uses authenticated account and local key-value store for input.



USAGE

  $ apify actors start [actorId] [-b <value>]

                       [-i <value> | --input-file <value>] [--json] [-m <value>]

                       [-t <value>]



ARGUMENTS

  actorId  Name or ID of the Actor to run (e.g. "my-actor",

           "apify/hello-world" or "E2jjCZBezvAZnX8Rb"). If not provided, the

           command runs the remote Actor specified in the '.actor/actor.json'

           file.



FLAGS

  -b, --build=<value>       Tag or number of the build to

                            run (e.g. "latest" or "1.2.34").

  -i, --input=<value>       Optional JSON input to be

                            given to the Actor.

      --input-file=<value>  Optional path to a file with JSON

                            input to be given to the Actor. The file must be a valid

                            JSON file. You can also specify `-` to read from

                            standard input.

      --json                Format the command output as JSON.

  -m, --memory=<value>      Amount of memory allocated for

                            the Actor run, in megabytes.

  -t, --timeout=<value>     Timeout for the Actor run in

                            seconds. Zero value means there is no timeout.
```

##### `apify actors info`[](#apify-actors-info)

```
DESCRIPTION

  Get information about an Actor.



USAGE

  $ apify actors info <actorId> [--input | --readme] [--json]



ARGUMENTS

  actorId  The ID of the Actor to return information about.



FLAGS

      --input   Return the Actor input schema.

      --json    Format the command output as JSON.

      --readme  Return the Actor README.
```

#### Actor builds[](#actor-builds)

Use these commands to manage Actor build processes. They help you create, monitor, and maintain versioned snapshots of your Actors that can be executed on Apify platform.

##### `apify builds`[](#apify-builds)

```
DESCRIPTION

  Create, inspect, tag, and delete Actor builds on the Apify platform.



SUBCOMMANDS

  builds add-tag     Adds a tag to a specific Actor build.

  builds remove-tag  Removes a tag from a specific Actor build.

  builds rm          Permanently removes an Actor build from

                     the Apify platform.

  builds ls          Lists all builds of the Actor.

  builds log         Prints the log of a specific build.

  builds info        Prints information about a specific build.

  builds create      Creates a new build of the Actor.

  builds wait        Waits for an Actor build to reach a

                     terminal status (SUCCEEDED, FAILED, ABORTED, TIMED-OUT).
```

##### `apify builds add-tag`[](#apify-builds-add-tag)

```
DESCRIPTION

  Adds a tag to a specific Actor build.



USAGE

  $ apify builds add-tag -b <value> -t <value>



FLAGS

  -b, --build=<value>  The build ID to tag.

  -t, --tag=<value>    The tag to add to the build.
```

##### `apify builds create` / `apify actors build`[](#apify-builds-create--apify-actors-build)

```
DESCRIPTION

  Creates a new build of the Actor.



USAGE

  $ apify builds create [actorId] [--json] [--log]

                        [--tag <value>] [--version <value>] [--wait]



ARGUMENTS

  actorId  Optional Actor ID or Name to trigger a build for. By default,

           it will use the Actor from the current directory.



FLAGS

      --json             Format the command output as JSON.

      --log              Whether to print out the build log after

                         the build is triggered.

      --tag=<value>      Build tag to be applied to the

                         successful Actor build. By default, this is "latest".

      --version=<value>  Optional Actor Version to build. By

                         default, this will be inferred from the tag, but this flag

                         is required when multiple versions have the same tag.

      --wait             Wait for the build to reach a terminal

                         status. Returns exit code 0 only when the build SUCCEEDED.
```

##### `apify builds info`[](#apify-builds-info)

```
DESCRIPTION

  Prints information about a specific build.



USAGE

  $ apify builds info <buildId> [--json]



ARGUMENTS

  buildId  The build ID to get information about.



FLAGS

      --json  Format the command output as JSON.
```

##### `apify builds log`[](#apify-builds-log)

```
DESCRIPTION

  Prints the log of a specific build.



USAGE

  $ apify builds log <buildId>



ARGUMENTS

  buildId  The build ID to get the log from.
```

##### `apify builds ls`[](#apify-builds-ls)

```
DESCRIPTION

  Lists all builds of the Actor.



USAGE

  $ apify builds ls [actorId] [-c] [--desc] [--json]

                    [--limit <value>] [--offset <value>]



ARGUMENTS

  actorId  Optional Actor ID or Name to list runs for. By default, it

           will use the Actor from the current directory.



FLAGS

  -c, --compact         Display a compact table.

      --desc            Sort builds in descending order.

      --json            Format the command output as JSON.

      --limit=<value>   Number of builds that will be listed.

      --offset=<value>  Number of builds that will be skipped.
```

##### `apify builds remove-tag`[](#apify-builds-remove-tag)

```
DESCRIPTION

  Removes a tag from a specific Actor build.



USAGE

  $ apify builds remove-tag -b <value> -t <value> [-y]



FLAGS

  -b, --build=<value>  The build ID to remove the tag from.

  -t, --tag=<value>    The tag to remove from the build.

  -y, --yes            Automatic yes to prompts; assume "yes"

                       as answer to all prompts.
```

##### `apify builds rm`[](#apify-builds-rm)

```
DESCRIPTION

  Permanently removes an Actor build from the Apify platform.



USAGE

  $ apify builds rm <buildId> [-y]



ARGUMENTS

  buildId  The build ID to delete.



FLAGS

  -y, --yes  Automatic yes to prompts; assume "yes" as answer to all

             prompts.
```

##### `apify builds wait`[](#apify-builds-wait)

```
DESCRIPTION

  Waits for an Actor build to reach a terminal status (SUCCEEDED, FAILED, 

  ABORTED, TIMED-OUT).

  Returns exit code 0 only when the build SUCCEEDED. Designed for CI and agentic

   workflows.



USAGE

  $ apify builds wait <buildId> [--json]

                      [--poll-interval <value>] [-t <value>]



ARGUMENTS

  buildId  The build ID to wait for.



FLAGS

      --json                   Format the command output as

                               JSON.

      --poll-interval=<value>  In seconds, how often to

                               poll the platform. Defaults to 2.

  -t, --timeout=<value>        In seconds, how long to

                               wait before giving up. If skipped, it waits

                               indefinitely.
```

#### Actor runs[](#actor-runs)

These commands control Actor execution on Apify platform. Use them to start, monitor, and manage Actor runs, including accessing logs and handling execution states.

##### `apify runs`[](#apify-runs)

```
DESCRIPTION

  Inspect, abort, resurrect, or delete existing Actor runs.

  Does not start new runs — use 'apify call' (synchronous) or 'apify actors 

  start' (asynchronous) for that.



SUBCOMMANDS

  runs abort      Aborts an Actor run.

  runs info       Prints information about an Actor run.

  runs log        Prints the log of a specific run.

  runs ls         Lists all runs of the Actor.

  runs resurrect  Resurrects an aborted or finished Actor Run.

  runs rm         Deletes an Actor Run.

  runs wait       Waits for an Actor run to reach a terminal

                  status (SUCCEEDED, FAILED, ABORTED, TIMED-OUT).
```

##### `apify runs abort`[](#apify-runs-abort)

```
DESCRIPTION

  Aborts an Actor run.



USAGE

  $ apify runs abort <runId> [-f] [--json]



ARGUMENTS

  runId  The run ID to abort.



FLAGS

  -f, --force  Whether to force the run to abort immediately, instead

               of gracefully.

      --json   Format the command output as JSON.
```

##### `apify runs info`[](#apify-runs-info)

```
DESCRIPTION

  Prints information about an Actor run.



USAGE

  $ apify runs info <runId> [--json] [-v]



ARGUMENTS

  runId  The run ID to print information about.



FLAGS

      --json     Format the command output as JSON.

  -v, --verbose  Prints more in-depth information about the Actor

                 run.
```

##### `apify runs log`[](#apify-runs-log)

```
DESCRIPTION

  Prints the log of a specific run.



USAGE

  $ apify runs log <runId>



ARGUMENTS

  runId  The run ID to get the log from.
```

##### `apify runs ls`[](#apify-runs-ls)

```
DESCRIPTION

  Lists all runs of the Actor.



USAGE

  $ apify runs ls [actorId] [-c] [--desc] [--json]

                  [--limit <value>] [--offset <value>]



ARGUMENTS

  actorId  Optional Actor ID or Name to list runs for. By default, it

           will use the Actor from the current directory.



FLAGS

  -c, --compact         Display a compact table.

      --desc            Sort runs in descending order.

      --json            Format the command output as JSON.

      --limit=<value>   Number of runs that will be listed.

      --offset=<value>  Number of runs that will be skipped.
```

##### `apify runs resurrect`[](#apify-runs-resurrect)

```
DESCRIPTION

  Resurrects an aborted or finished Actor Run.



USAGE

  $ apify runs resurrect <runId> [--json]



ARGUMENTS

  runId  The run ID to resurrect.



FLAGS

      --json  Format the command output as JSON.
```

##### `apify runs rm`[](#apify-runs-rm)

```
DESCRIPTION

  Deletes an Actor Run.



USAGE

  $ apify runs rm <runId> [-y]



ARGUMENTS

  runId  The run ID to delete.



FLAGS

  -y, --yes  Automatic yes to prompts; assume "yes" as answer to all

             prompts.
```

##### `apify runs wait`[](#apify-runs-wait)

```
DESCRIPTION

  Waits for an Actor run to reach a terminal status (SUCCEEDED, FAILED, ABORTED,

   TIMED-OUT).

  Returns exit code 0 only when the run SUCCEEDED. Designed for CI and agentic 

  workflows.



USAGE

  $ apify runs wait <runId> [--json] [--poll-interval <value>]

                    [-t <value>]



ARGUMENTS

  runId  The run ID to wait for.



FLAGS

      --json                   Format the command output as

                               JSON.

      --poll-interval=<value>  How often to poll the

                               platform, in seconds. Defaults to 2.

  -t, --timeout=<value>        Maximum seconds to wait

                               before giving up. Without this flag the command waits

                               indefinitely.
```

### Storage[](#storage)

These commands manage data storage on Apify platform. Use them to work with datasets, key-value stores, and request queues for persistent data storage and retrieval.

#### Datasets[](#datasets)

Use these commands to manage datasets, which provide structured storage for tabular data. They enable creation, modification, and data manipulation within datasets.

##### `apify datasets`[](#apify-datasets)

```
DESCRIPTION

  Manage Apify datasets — create, list, rename, delete, push items, and download

   items in various formats.



SUBCOMMANDS

  datasets create      Creates a new dataset for storing

                       structured data on your account.

  datasets get-items   Retrieves dataset items in specified

                       format (JSON, CSV, etc).

  datasets ls          Prints all datasets on your account.

  datasets info        Prints information about a specific

                       dataset.

  datasets rm          Permanently removes a dataset.

  datasets rename      Change the dataset name or remove the

                       name with --unname flag.

  datasets push-items  Adds data items to specified dataset.

                       Accepts single object or array of objects.
```

##### `apify datasets create`[](#apify-datasets-create)

```
DESCRIPTION

  Creates a new dataset for storing structured data on your account.



USAGE

  $ apify datasets create [datasetName] [--json]



ARGUMENTS

  datasetName  Optional name for the Dataset.



FLAGS

      --json  Format the command output as JSON.
```

##### `apify datasets get-items`[](#apify-datasets-get-items)

```
DESCRIPTION

  Retrieves dataset items in specified format (JSON, CSV, etc).



USAGE

  $ apify datasets get-items <datasetId>

                             [--format json|jsonl|csv|html|rss|xml|xlsx]

                             [--limit <value>] [--offset <value>]



ARGUMENTS

  datasetId  The ID of the Dataset to export the items for.



FLAGS

      --format=<option>  The format of the returned output. By

                         default, it is set to 'json'.

                         <options: json|jsonl|csv|html|rss|xml|xlsx>

      --limit=<value>    The amount of elements to get from the

                         dataset. By default, it will return all available items.

      --offset=<value>   The offset in the dataset where to start

                         getting items.
```

##### `apify datasets info`[](#apify-datasets-info)

```
DESCRIPTION

  Prints information about a specific dataset.



USAGE

  $ apify datasets info <storeId> [--json]



ARGUMENTS

  storeId  The dataset store ID to print information about.



FLAGS

      --json  Format the command output as JSON.
```

##### `apify datasets ls`[](#apify-datasets-ls)

```
DESCRIPTION

  Prints all datasets on your account.



USAGE

  $ apify datasets ls [--desc] [--json] [--limit <value>]

                      [--offset <value>] [--unnamed]



FLAGS

      --desc            Sorts datasets in descending order.

      --json            Format the command output as JSON.

      --limit=<value>   Number of datasets that will be listed.

      --offset=<value>  Number of datasets that will be skipped.

      --unnamed         Lists datasets that don't have a name set.
```

##### `apify datasets push-items`[](#apify-datasets-push-items)

```
DESCRIPTION

  Adds data items to specified dataset. Accepts single object or array of 

  objects.



USAGE

  $ apify datasets push-items <nameOrId> [item]



ARGUMENTS

  nameOrId  The dataset ID or name to push the objects to.

  item      The object or array of objects to be pushed.
```

##### `apify datasets rename`[](#apify-datasets-rename)

```
DESCRIPTION

  Change the dataset name or remove the name with --unname flag.



USAGE

  $ apify datasets rename <nameOrId> [newName] [--unname]



ARGUMENTS

  nameOrId  The dataset ID or name to delete.

  newName   The new name for the dataset.



FLAGS

      --unname  Removes the unique name of the dataset.
```

##### `apify datasets rm`[](#apify-datasets-rm)

```
DESCRIPTION

  Permanently removes a dataset.



USAGE

  $ apify datasets rm <datasetNameOrId> [-y]



ARGUMENTS

  datasetNameOrId  The dataset ID or name to delete.



FLAGS

  -y, --yes  Automatic yes to prompts; assume "yes" as answer to all

             prompts.
```

#### Key-value stores[](#key-value-stores)

These commands handle key-value store operations. Use them to create stores, manage key-value pairs, and handle persistent storage of arbitrary data types.

##### `apify key-value-stores`[](#apify-key-value-stores)

```
DESCRIPTION

  Manage Apify key-value stores — create, list, rename, delete stores, and 

  get/set/delete individual records.



  Alias: kvs.



SUBCOMMANDS

  key-value-stores create        Creates a new

                                 key-value store on your account.

  key-value-stores delete-value  Delete a value

                                 from a key-value store.

  key-value-stores get-value     Retrieves stored

                                 value for specified key. Use --only-content-type

                                 to check MIME type.

  key-value-stores info          Shows information

                                 about a key-value store.

  key-value-stores keys          Lists all keys in

                                 a key-value store.

  key-value-stores ls            Lists all

                                 key-value stores on your account.

  key-value-stores rename        Renames a

                                 key-value store, or removes its unique name.

  key-value-stores rm            Permanently

                                 removes a key-value store.

  key-value-stores set-value     Stores value with

                                 specified key. Set content-type with

                                 --content-type flag.
```

##### `apify key-value-stores create`[](#apify-key-value-stores-create)

```
DESCRIPTION

  Creates a new key-value store on your account.



USAGE

  $ apify key-value-stores create

                                  [key-value store name] [--json]



ARGUMENTS

  key-value store name  Optional name for the key-value

                        store.



FLAGS

      --json  Format the command output as JSON.
```

##### `apify key-value-stores delete-value`[](#apify-key-value-stores-delete-value)

```
DESCRIPTION

  Delete a value from a key-value store.



USAGE

  $ apify key-value-stores delete-value

                                        <store id> <itemKey> [-y]



ARGUMENTS

  store id  The key-value store ID to delete the value from.

  itemKey   The key of the item in the key-value store.



FLAGS

  -y, --yes  Automatic yes to prompts; assume "yes" as answer to all

             prompts.
```

##### `apify key-value-stores get-value`[](#apify-key-value-stores-get-value)

```
DESCRIPTION

  Retrieves stored value for specified key. Use --only-content-type to check 

  MIME type.



USAGE

  $ apify key-value-stores get-value

                                     <keyValueStoreId> <itemKey>

                                     [--only-content-type]



ARGUMENTS

  keyValueStoreId  The key-value store ID to get the value from.

  itemKey          The key of the item in the key-value store.



FLAGS

      --only-content-type  Only return the content type of the

                           specified key.
```

##### `apify key-value-stores info`[](#apify-key-value-stores-info)

```
DESCRIPTION

  Shows information about a key-value store.



USAGE

  $ apify key-value-stores info <storeId> [--json]



ARGUMENTS

  storeId  The key-value store ID to print information about.



FLAGS

      --json  Format the command output as JSON.
```

##### `apify key-value-stores keys`[](#apify-key-value-stores-keys)

```
DESCRIPTION

  Lists all keys in a key-value store.



USAGE

  $ apify key-value-stores keys <storeId>

                                [--exclusive-start-key <value>] [--json]

                                [--limit <value>]



ARGUMENTS

  storeId  The key-value store ID to list keys for.



FLAGS

      --exclusive-start-key=<value>  The key to start

                                     the list from.

      --json                         Format the

                                     command output as JSON.

      --limit=<value>                The maximum

                                     number of keys to return.
```

##### `apify key-value-stores ls`[](#apify-key-value-stores-ls)

```
DESCRIPTION

  Lists all key-value stores on your account.



USAGE

  $ apify key-value-stores ls [--desc] [--json]

                              [--limit <value>] [--offset <value>] [--unnamed]



FLAGS

      --desc            Sorts key-value stores in descending

                        order.

      --json            Format the command output as JSON.

      --limit=<value>   Number of key-value stores that will be

                        listed.

      --offset=<value>  Number of key-value stores that will be

                        skipped.

      --unnamed         Lists key-value stores that don't have a

                        name set.
```

##### `apify key-value-stores rename`[](#apify-key-value-stores-rename)

```
DESCRIPTION

  Renames a key-value store, or removes its unique name.



USAGE

  $ apify key-value-stores rename

                                  <keyValueStoreNameOrId> [newName] [--unname]



ARGUMENTS

  keyValueStoreNameOrId  The key-value store ID or name to

                         delete.

  newName                The new name for the key-value

                         store.



FLAGS

      --unname  Removes the unique name of the key-value store.
```

##### `apify key-value-stores rm`[](#apify-key-value-stores-rm)

```
DESCRIPTION

  Permanently removes a key-value store.



USAGE

  $ apify key-value-stores rm <keyValueStoreNameOrId>

                              [-y]



ARGUMENTS

  keyValueStoreNameOrId  The key-value store ID or name to

                         delete.



FLAGS

  -y, --yes  Automatic yes to prompts; assume "yes" as answer to all

             prompts.
```

##### `apify key-value-stores set-value`[](#apify-key-value-stores-set-value)

```
DESCRIPTION

  Stores value with specified key. Set content-type with --content-type flag.



USAGE

  $ apify key-value-stores set-value <storeId>

                                     <itemKey> [value] [--content-type <value>]



ARGUMENTS

  storeId  The key-value store ID to set the value in.

  itemKey  The key of the item in the key-value store.

  value    The value to set.



FLAGS

      --content-type=<value>  The MIME content type of the

                              value. By default, "application/json" is assumed.
```

#### Request queues[](#request-queues)

These commands manage request queues, which handle URL processing for web scraping and automation tasks. Use them to maintain lists of URLs with automatic retry mechanisms and state management.

##### `apify request-queues`[](#apify-request-queues)

```
DESCRIPTION

  Manage Apify request queues. No subcommands are available yet.



USAGE

  $ apify request-queues
```

### Tasks[](#tasks)

These commands help you manage scheduled and configured Actor runs. Use them to create, modify, and execute predefined Actor configurations as tasks.

##### `apify task`[](#apify-task)

```
DESCRIPTION

  Run and publish saved Apify tasks (named Actor configurations). Create and 

  manage tasks in Apify Console.



SUBCOMMANDS

  task run        Executes predefined Actor task remotely using

                  local key-value store for input.

  task publish    Publishes the task on its public landing page.

  task unpublish  Unpublishes the task from its public landing

                  page.
```

##### `apify task run`[](#apify-task-run)

```
DESCRIPTION

  Executes predefined Actor task remotely using local key-value store for input.

  Customize with --memory and --timeout flags.



USAGE

  $ apify task run <taskId> [-b <value>] [--json] [-m <value>]

                   [-t <value>]



ARGUMENTS

  taskId  Name or ID of the Task to run (e.g. "my-task" or

          "E2jjCZBezvAZnX8Rb").



FLAGS

  -b, --build=<value>    Tag or number of the build to run

                         (e.g. "latest" or "1.2.34").

      --json             Format the command output as JSON.

  -m, --memory=<value>   Amount of memory allocated for the

                         Task run, in megabytes.

  -t, --timeout=<value>  Timeout for the Task run in seconds.

                         Zero value means there is no timeout.
```

##### `apify task publish`[](#apify-task-publish)

```
DESCRIPTION

  Publishes the task on its public landing page.

  The task must belong to a public Actor and have its public display 

  configuration set up on the task Publication tab in Apify Console. Requires 

  write access to the task and to its Actor.



USAGE

  $ apify task publish <taskId>



ARGUMENTS

  taskId  Name of the task to publish. For example, "my-task" or

          "username/my-task".
```

##### `apify task unpublish`[](#apify-task-unpublish)

```
DESCRIPTION

  Unpublishes the task from its public landing page.

  The public display configuration is preserved, so the task can be published 

  again later. Requires write access to the task and to its Actor.



USAGE

  $ apify task unpublish <taskId>



ARGUMENTS

  taskId  Name of the task to unpublish. For example, "my-task" or

          "username/my-task".
```

### MCP[](#mcp)

Use these commands to configure the Apify MCP server in your AI client.

##### `apify mcp`[](#apify-mcp)

```
DESCRIPTION

  Configure the Apify MCP server in your AI client: Claude Code, Cursor, VS 

  Code, Codex CLI, Kiro, or Antigravity.



SUBCOMMANDS

  mcp install  Configure a local MCP client to use the Apify MCP

               server. Writes or merges a server entry named 'apify' into the

               client's config file, or runs the client's own 'mcp add' command

               when available.
```

##### `apify mcp install`[](#apify-mcp-install)

```
DESCRIPTION

  Configure a local MCP client to use the Apify MCP server. Writes or merges a 

  server entry named 'apify' into the client's config file, or runs the client's

   own 'mcp add' command when available.



USAGE

  $ apify mcp install <client> [-t <value>] [--tools <value>]

                      [--url <value>] [-y]



ARGUMENTS

  client  Target MCP client. One of: claude-code, cursor, vscode,

          vscode-insiders, codex, kiro, antigravity.



FLAGS

  -t, --token=<value>  Apify API token to embed in the config.

                       Defaults to the token from 'apify login'.

      --tools=<value>  Comma-separated tool IDs or Actor full names

                       to expose. Forwarded as a '?tools=' query parameter.

      --url=<value>    Apify MCP server URL.

  -y, --yes            Overwrite an existing 'apify' entry

                       without prompting.
```


---

Source: https://docs.apify.com/actors/development/actor-definition/input-schema/specification/v1

---
title: Actor input schema specification
url: https://docs.apify.com/actors/development/actor-definition/input-schema/specification/v1.md
parents:
  - [Apify documentation](https://docs.apify.com/llms.txt)
  - [Actors](https://docs.apify.com/actors.md)
  - [Develop](https://docs.apify.com/actors/development.md)
  - [Actor definition](https://docs.apify.com/actors/development/actor-definition.md)
  - [Actor input schema](https://docs.apify.com/actors/development/actor-definition/input-schema.md)
previous: [Actor input schema](https://docs.apify.com/actors/development/actor-definition/input-schema.md)
next: [Secret input](https://docs.apify.com/actors/development/actor-definition/input-schema/secret-input.md)
---

> ## Documentation index
> Fetch the complete documentation index at: https://docs.apify.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Actor input schema specification

Actor input schema is a JSON file which defines the schema and description of the input object and its properties accepted by the Actor on start. The file adheres to [JSON schema](https://json-schema.org/) with our extensions, and describes a single Actor input object and its properties, including documentation, default value, and user interface definition.

The Actor input schema file is used to:

* Validate the passed input JSON object on Actor run, so that Actors don't need to perform input validation and error handling in their code.
* Render user interface for Actors to make it easy for users to run and test them manually.
* Generate Actor API documentation and integration code examples on the web or in CLI, making Actors easy to integrate for users.
* Simplify integration of Actors into automation workflows such as Zapier or Make, by providing smart connectors that smartly pre-populate and link Actor input properties.

To define an input schema for an Actor, set `input` field in the `.actor/actor.json` file to an input schema object (described below), or path to a JSON file containing the input schema object. For backwards compatibility, if the `input` field is omitted, the system looks for an `INPUT_SCHEMA.json` file either in the `.actor` directory or the Actor's top-level directory - but note that this functionality is deprecated and might be removed in the future. The maximum allowed size for the input schema file is 500 kB.

When you provide an input schema, the Apify platform will validate the input data passed to the Actor on start (via the API or Apify Console) to ensure compliance before starting the Actor. If the input object doesn't conform the schema, the caller receives an error and the Actor is not started.

Validation aid

You can use our [visual input schema editor](https://apify.github.io/input-schema-editor-react/) to guide you through the creation of the `INPUT_SCHEMA.json` file.

To ensure the input schema is valid, here's a corresponding [JSON schema file](https://github.com/apify/apify-shared-js/blob/master/packages/json_schemas/schemas/input.schema.json).

You can also use the [apify validate-schema](https://docs.apify.com/cli/docs/reference#apify-validate-schema-path) command in the Apify CLI.

## Example

Imagine a simple web crawler that accepts an array of start URLs and a JavaScript function to execute on each visited page. The input schema for such a crawler could be defined as follows:


```json5
{

    "title": "Cheerio Crawler input",

    "description": "To update crawler to another site, you need to change startUrls and pageFunction options!",

    "type": "object",

    "schemaVersion": 1,

    "properties": {

        "startUrls": {

            "title": "Start URLs",

            "type": "array",

            "description": "URLs to start with",

            "prefill": [

                { "url": "http://example.com" },

                { "url": "http://example.com/some-path" }

            ],

            "editor": "requestListSources"

        },

        "pageFunction": {

            "title": "Page function",

            "type": "string",

            "description": "Function executed for each request",

            "prefill": "async () => { return $('title').text(); }",

            "editor": "javascript"

        }

    },

    "required": ["startUrls", "pageFunction"]

}
```


The generated input UI will be:

![Apify Actor input schema example](/assets/images/input-schema-example-fa0b2cfdecdbe9dcdb2580759b8d1b12.png)

If you switch the input to the **JSON** display using the toggle, then you will see the entered input stringified to `JSON`, as it will be passed to the Actor:


```json
{

    "startUrls": [

    {

        "url": "http://example.com"

    },

    {

        "url": "http://example.com/some-path"

    }

    ],

    "pageFunction": "async () => { return $('title').text(); }"

}
```


## Structure


```json
{

    "title": "Cheerio Crawler input",

    "type": "object",

    "schemaVersion": 1,

    "properties": { /* define input fields here */ },

    "required": []

}
```


| Property               | Type    | Required | Description                                                                                                                                    |
| ---------------------- | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`                | String  | Yes      | Any text describing your input schema.                                                                                                         |
| `description`          | String  | No       | Help text for the input that will be displayed above the UI fields.                                                                            |
| `type`                 | String  | Yes      | This is fixed and must be set to string `object`.                                                                                              |
| `schemaVersion`        | Integer | Yes      | The version of the input schema specification against which your schema is written. Currently, only version `1` is out.                        |
| `properties`           | Object  | Yes      | This is an object mapping each field key to its specification.                                                                                 |
| `required`             | String  | No       | An array of field keys that are required.                                                                                                      |
| `additionalProperties` | Boolean | No       | Controls if properties not listed in `properties` are allowed. Defaults to `true`. Set to `false` to make requests with extra properties fail. |

Input schema differences

Even though the structure of the Actor input schema is similar to JSON schema, there are some differences. We cannot guarantee that JSON schema tooling will work on input schema documents. For a more precise technical understanding of the matter, feel free to browse the code of the [@apify/input_schema](https://github.com/apify/apify-shared-js/tree/master/packages/input_schema/src) package.

## Input fields

Each field of your input is described under its key in the `inputSchema.properties` object. The field might have `integer`, `string`, `array`, `object`, or `boolean` type, and its specification contains the following properties:

| Property             | Value                                                          | Required | Description                                                                                                                                                                                                                                                           |
| -------------------- | -------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`               | One of - `string` - `array` - `object` - `boolean` - `integer` | Yes      | Allowed type for the input value. Cannot be mixed.                                                                                                                                                                                                                    |
| `title`              | String                                                         | Yes      | Title of the field in UI.                                                                                                                                                                                                                                             |
| `description`        | String                                                         | Yes      | Description of the field that will be displayed as help text in Actor input UI.                                                                                                                                                                                       |
| `default`            | Must match `type` property.                                    | No       | Default value that will be used when no value is provided.                                                                                                                                                                                                            |
| `prefill`            | Must match `type` property.                                    | No       | Value that will be prefilled in the Actor input interface.                                                                                                                                                                                                            |
| `example`            | Must match `type` property.                                    | No       | Sample value of this field for the Actor to be displayed when Actor is published in Apify Store.                                                                                                                                                                      |
| `errorMessage`       | Object                                                         | No       | Custom error messages for validation keywords. See [custom error messages](https://docs.apify.com/actors/development/actor-definition/input-schema/custom-error-messages.md) for more details.                                                                        |
| `sectionCaption`     | String                                                         | No       | If this property is set, then all fields following this field (this field included) will be separated into a collapsible section with the value set as its caption. The section ends at the last field or the next field which has the `sectionCaption` property set. |
| `sectionDescription` | String                                                         | No       | If the `sectionCaption` property is set, then you can use this property to provide additional description to the section. The description will be visible right under the caption when the section is open.                                                           |

### Prefill vs. default vs. required

Here is a rule of thumb for whether an input field should have a `prefill`, `default`, or be required:

* **Prefill** - Use for fields that don't have a reasonable default. The provided value is prefilled for the user to show them an example of using the field and to make it easy to test the Actor (e.g., search keyword, start URLs). In other words, this field is only used in the user interface but does not affect the Actor functionality and API. Note that if you add a new input option to your Actor, the Prefill value won't be used by existing integrations such as Actor tasks or API calls, but the Default will be if specified. This is useful for keeping backward compatibility when introducing a new flag or feature that you prefer new users to use.
* **Required** - Use for fields that don't have a reasonable default and MUST be entered by the user (e.g., API token, password).
* **Default** - Use for fields that MUST be set for the Actor run to some value, but where you don't need the user to change the default behavior (e.g., max pages to crawl, proxy settings). If the user omits the value when starting the Actor via any means (API, CLI, scheduler, or user interface), the platform automatically passes the Actor this default value.
* **No particular setting** - Use for purely optional fields where it makes no sense to prefill any value (e.g., flags like debug mode or download files).

In summary, you can use each option independently or use a combination of **Prefill + Required** or **Prefill + Default**, but the combination of **Default + Required** doesn't make sense to use.

## Input types

Most types also support additional properties defining, for example, the UI input editor.

### String

String is the most common input field type, and provide a number of editors and validations properties:

| Property              | Value                                                                                                            | Required                         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `editor`              | One of: - `textfield` - `textarea` - `javascript` - `python` - `select` - `datepicker` - `fileupload` - `hidden` | Yes                              | Visual editor used for the input field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `pattern`             | String                                                                                                           | No                               | Regular expression that will be used to validate the input. If validation fails, the Actor will not run.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `minLength`           | Integer                                                                                                          | No                               | Minimum length of the string.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `maxLength`           | Integer                                                                                                          | No                               | Maximum length of the string.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `enum`                | \[String]                                                                                                        | Required if `editor` is `select` | Using this field, you can limit values to the given array of strings. Input will be displayed as select box. Values are strictly validated against this list.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `enumSuggestedValues` | \[String]                                                                                                        | No                               | Similar to `enum`, but only suggests values in the UI without enforcing validation. Users can select from the dropdown or enter custom value. Works only with the `select` editor.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `enumTitles`          | \[String]                                                                                                        | No                               | Displayed titles for the `enum` or `enumSuggestedValues` properties.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `nullable`            | Boolean                                                                                                          | No                               | Specifies whether `null` is an allowed value.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `isSecret`            | Boolean                                                                                                          | No                               | Specifies whether the input field will be stored encrypted. Only available with `textfield`, `textarea` and `hidden` editors.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `dateType`            | One of - `absolute` - `relative` - `absoluteOrRelative`                                                          | No                               | This property, which is only available with `datepicker` editor, specifies what date format should visual editor accept (The JSON editor accepts any string without validation.). - `absolute` value enables date input in `YYYY-MM-DD` format. To parse returned string regex like this can be used: `^(\d{4})-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$`. - `relative` value enables relative date input in `{number} {unit}` format. Supported units are: days, weeks, months, years. The input is passed to the Actor as plain text (e.g., "3 weeks"). To parse it, regex like this can be used: `^(\d+)\s*(day\|week\|month\|year)s?$`. - `absoluteOrRelative` value enables both absolute and relative formats and user can switch between them. It's up to Actor author to parse a determine actual used format - regexes above can be used to check whether the returned string match one of them. Defaults to `absolute`. |

Regex escape

When using escape characters `\` for the regular expression in the `pattern` field, be sure to escape them to avoid invalid JSON issues. For example, the regular expression `https:\/\/(www\.)?apify\.com\/.+` would become `https:\\/\\/(www\\.)?apify\\.com\\/.+`.

#### Select editor for strings

The `select` editor for strings allows users to choose a value from a dropdown list. You can either only allow users to select from a set of predefined values, or allow them to specify custom values in addition to suggested values.

##### Select from predefined values

When you need to restrict input to a specific set of values, use the `enum` property:


```json
{

    "title": "Country",

    "type": "string",

    "description": "Select your country",

    "editor": "select",

    "default": "us",

    "enum": ["us", "de", "fr"],

    "enumTitles": ["USA", "Germany", "France"]

}
```


The `select` editor is rendered as drop-down in user interface:

![Apify Actor input schema - country input](/assets/images/input-schema-country-139862e35224e1f1458b2ab8f1386b42.png)

##### Select with custom input

When you want to suggest values but still allow custom input, use the `enumSuggestedValues` property:


```json
{

    "title": "Tag",

    "type": "string",

    "description": "Select or enter a custom tag",

    "editor": "select",

    "default": "web",

    "enumSuggestedValues": ["web", "scraping", "automation"],

    "enumTitles": ["Web", "Scraping", "Automation"]

}
```


This creates a select dropdown with suggested values, but users can also enter custom values:

![Apify Actor input schema - tag input suggestion](/assets/images/input-schema-tag-suggestion-4eeb02caca475587e779598abd027279.png)

#### Code editor

If the input string is code, you can use either `javascript` or `python` editor for syntax highlighting.

For example:


```json
{

    "title": "Page function",

    "type": "string",

    "description": "Function executed for each request",

    "editor": "javascript",

    "prefill": "async () => { return $('title').text(); }"

}
```


Rendered input:

![Apify Actor input schema page function](data:image/png;base64,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)

#### Date picker

Example of date selection using absolute and relative `datepicker` editor:


```json
{

    "absoluteDate": {

        "title": "Date",

        "type": "string",

        "description": "Select absolute date in format YYYY-MM-DD",

        "editor": "datepicker",

        "pattern": "^(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$"

    },

    "relativeDate": {

        "title": "Relative date",

        "type": "string",

        "description": "Select relative date in format: {number} {unit}",

        "editor": "datepicker",

        "dateType": "relative",

        "pattern": "^(\\d+)\\s*(day|week|month|year)s?$"

    },

    "anyDate": {

        "title": "Any date",

        "type": "string",

        "description": "Select date in format YYYY-MM-DD or {number} {unit}",

        "editor": "datepicker",

        "dateType": "absoluteOrRelative",

        "pattern": "^(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$|^(\\d+)\\s*(day|week|month|year)s?$"

    }

}
```


The `absoluteDate` property renders a date picker that allows selection of a specific date and returns string value in `YYYY-MM-DD` format. Validation is ensured thanks to `pattern` field. In this case the `dateType` property is omitted, as it defaults to `"absolute"`.

![Apify Actor input schema - country input](/assets/images/input-schema-date-absolute-8dc55da08b38b38bcf29b531d7c11e5d.png)

The `relativeDate` property renders an input field that enables the user to choose the relative date and returns the value in `{number} {unit}` format, for example `"2 days"`. The `dateType` parameter is set to `"relative"` to restrict input to relative dates only.

![Apify Actor input schema - country input](/assets/images/input-schema-date-relative-d22597d97577947def822c41950040c3.png)

The `anyDate` property renders a date picker that accepts both absolute and relative dates. The Actor author is responsible for parsing and interpreting the selected date format.

![Apify Actor input schema - country input](/assets/images/input-schema-date-both-7331f7016c1256412af2ccfa05c96aa4.png)

#### Advanced date and time handling

While the `datepicker` editor doesn't support setting time values visually, you can allow users to handle more complex datetime formats and pass them via JSON. The following regex allows users to optionally extend the date with full ISO datetime format or pass `hours` and `minutes` as a relative date:

`"pattern": "^(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])(T[0-2]\\d:[0-5]\\d(:[0-5]\\d)?(\\.\\d+)?Z?)?$|^(\\d+)\\s*(minute|hour|day|week|month|year)s?$"`

When implementing time-based fields, make sure to explain to your users through the description that the time values should be provided in UTC. This helps prevent timezone-related issues.

#### File upload

The `fileupload` editor enables users to specify a file as input. The input is passed to the Actor as a string. It is the Actor author's responsibility to interpret this string, including validating its existence and format.

The editor makes it easier to users to upload the file to a key-value store of their choice.

![Apify Actor input schema - fileupload input](/assets/images/input-schema-fileupload-input-f11ad6ffde04eb7892fd96c5cfc68002.png)

The user provides either a URL or uploads the file to a key-value store (existing or new).

![Apify Actor input schema - fileupload input options](/assets/images/input-schema-fileupload-modal-fe1ec6bbc2752b95f5848b0a03f7e32e.png)

### Boolean type

Example options with group caption:


```json5
{

    "verboseLog": {

        "title": "Verbose log",

        "type": "boolean",

        "description": "Debug messages will be included in the log.",

        "default": true,

        "groupCaption": "Options",

        "groupDescription": "Various options for this Actor"

    },

    "lightspeed": {

        "title": "Lightspeed",

        "type": "boolean",

        "description": "If checked then actors runs at the

            speed of light.",

        "prefill": true

    }

}
```


Rendered input:

![Apify Actor input schema options](/assets/images/input-schema-options-7eae6d4ce07ec3adc9e10890f952db0f.png)

Properties:

| Property           | Value                          | Required | Description                                                                                   |
| ------------------ | ------------------------------ | -------- | --------------------------------------------------------------------------------------------- |
| `editor`           | One of - `checkbox` - `hidden` | No       | Visual editor used for the input field.                                                       |
| `groupCaption`     | String                         | No       | If you want to group multiple checkboxes together, add this option to the first of the group. |
| `groupDescription` | String                         | No       | Description displayed as help text displayed of group title.                                  |
| `nullable`         | Boolean                        | No       | Specifies whether null is an allowed value.                                                   |

### Numeric types

There are two numeric types supported in the input schema: `integer` and `number`.

* The `integer` type represents whole numbers.
* The `number` type can represent both integers and floating-point numbers.

Example:


```json
{

    "title": "Memory",

    "type": "integer",

    "description": "Select memory in megabytes",

    "default": 64,

    "maximum": 1024,

    "unit": "MB"

}
```


Rendered input:

![Apify Actor input schema memory](data:image/png;base64,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)

Properties:

| Property   | Value                                   | Required | Description                                                                   |
| ---------- | --------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| `type`     | One of - `integer` - `number`           | Yes      | Defines the type of the field - either an integer or a floating-point number. |
| `editor`   | One of: - `number` - `hidden`           | No       | Visual editor used for input field.                                           |
| `maximum`  | Integer or Number (based on the `type`) | No       | Maximum allowed value.                                                        |
| `minimum`  | Integer or Number (based on the `type`) | No       | Minimum allowed value.                                                        |
| `unit`     | String                                  | No       | Unit displayed next to the field in UI, for example *second*, *MB*, etc.      |
| `nullable` | Boolean                                 | No       | Specifies whether null is an allowed value.                                   |

### Object type

Example of proxy configuration:


```json
{

    "title": "Proxy configuration",

    "type": "object",

    "description": "Select proxies to be used by your crawler.",

    "prefill": { "useApifyProxy": true },

    "editor": "proxy"

}
```


Rendered input:

![Apify Actor input schema proxy](/assets/images/input-schema-proxy-5407b712ef88623fe43dff44904786d1.png)

The object where the proxy configuration is stored has the following structure:


```json5
{

    // Indicates whether Apify Proxy was selected.

    "useApifyProxy": Boolean,



    // Array of Apify Proxy groups. Is missing or null if

    // Apify Proxy's automatic mode was selected

    // or if proxies are not used.

    "apifyProxyGroups": String[],



    // Array of custom proxy URLs.

    // Is missing or null if custom proxies were not used.

    "proxyUrls": String[],

}
```


Example of a black box object:


```json
{

    "title": "User object",

    "type": "object",

    "description": "Enter object representing user",

    "prefill": {

        "name": "John Doe",

        "email": "janedoe@gmail.com"

    },

    "editor": "json"

}
```


Rendered input:

![Apify Actor input schema user object](data:image/png;base64,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)

Properties:

| Property               | Value                                                | Required | Description                                                                                                                                                                                                                |
| ---------------------- | ---------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `editor`               | One of - `json` - `proxy` - `schemaBased` - `hidden` | Yes      | UI editor used for input.                                                                                                                                                                                                  |
| `maxProperties`        | Integer                                              | No       | Maximum number of properties the object can have.                                                                                                                                                                          |
| `minProperties`        | Integer                                              | No       | Minimum number of properties the object can have.                                                                                                                                                                          |
| `nullable`             | Boolean                                              | No       | Specifies whether null is an allowed value.                                                                                                                                                                                |
| `isSecret`             | Boolean                                              | No       | Specifies whether the input field will be stored encrypted. Only available with `json` and `hidden` editors.                                                                                                               |
| `properties`           | Object                                               | No       | Defines the sub-schema properties for the object used for validation and UI rendering (`schemaBased` editor). See more info below.                                                                                         |
| `additionalProperties` | Boolean                                              | No       | Controls if sub-properties not listed in `properties` are allowed. Defaults to `true`. Set to `false` to make requests with extra properties fail.                                                                         |
| `required`             | String array                                         | No       | An array of sub-properties keys that are required. Note: This applies only if the object field itself is present. If the object field is optional and not included in the input, its required subfields are not validated. |

#### Object fields validation

Like root-level input schemas, you can define a schema for sub-properties of an object using the `properties` field.

Each sub-property within this sub-schema can define the same fields as those available at the root level of the input schema, except for the fields that apply only at the root level: `sectionCaption` and `sectionDescription`.

Validation is performed both in the UI and during Actor execution via the API. Sub-schema validation works independently of the editor selected for the parent object. It also respects the `additionalProperties` and `required` fields, giving you precise control over whether properties not defined in `properties` are permitted and which properties are mandatory.

Recursive nesting

Object sub-properties can define their own sub-schemas recursively with no nesting depth limit.

Example of an object property with sub-schema properties


```json
{

    "title": "Configuration",

    "type": "object",

    "description": "Advanced configuration options",

    "editor": "json",

    "properties": {

        "locale": {

            "title": "Locale",

            "type": "string",

            "description": "Locale identifier.",

            "pattern": "^[a-z]{2,3}-[A-Z]{2}$"

        },

        "timeout": {

            "title": "Timeout",

            "type": "integer",

            "description": "Request timeout in seconds",

            "minimum": 1,

            "maximum": 300

        },

        "debugMode": {

            "title": "Debug Mode",

            "type": "boolean",

            "description": "Enable verbose logging during scraping"

        }

    },

    "required": ["locale", "timeout"],

    "additionalProperties": false

}
```


Rendered input: ![Apify Actor input schema with sub-schema](/assets/images/sub-schema-json-91af0cd8d42e82b8cadabf8bb9f18fb8.png)

In this example, the object has validation rules for its properties:

* The `timeout` property must be an integer between 1 and 300
* The `locale` property must be a string matching the pattern `^[a-z]{2,3}-[A-Z]{2}$`
* The `debugMode` property is optional and can be either `true` or `false`
* The `timeout` and `locale` properties are required
* No additional properties beyond those defined are allowed

##### Handling default and prefill values for object sub-properties

When defining object with sub-properties, it's possible to set `default` and `prefill` values in two ways:

1. *At the parent object level*: You can provide a complete object as the `default` or `prefill` value, which will set values for all sub-properties at once.
2. *At the individual sub-property level*: You can specify `default` or `prefill` values for each sub-property separately within the `properties` definition.

When both methods are used, the values defined at the parent object level take precedence over those defined at the sub-property level. For example, in the input schema like this:


```json
{

    "title": "Configuration",

    "type": "object",

    "description": "Advanced configuration options",

    "editor": "schemaBased",

    "default": {

        "timeout": 60

    },

    "properties": {

        "locale": {

            "title": "Locale",

            "type": "string",

            "description": "Locale identifier.",

            "pattern": "^[a-z]{2,3}-[A-Z]{2}$",

            "editor": "textfield",

            "default": "en-US"

        },

        "timeout": {

            "title": "Timeout",

            "type": "integer",

            "description": "Request timeout in seconds",

            "minimum": 1,

            "maximum": 300,

            "editor": "number",

            "default": 120

        }

    }

}
```


The `timeout` sub-property will have a default value of `60` (from the parent object), while the `locale` sub-property will have a default value of `"en-US"` (from its own definition).

#### Schema-based editor

Object with sub-schema defined can use the `schemaBased` editor, which provides a user-friendly interface for editing each property individually. It renders all properties based on their type (and `editor` field), providing a user-friendly interface for complex objects. This feature works for objects (and arrays of objects), enabling each property to have its own input field in the UI.

Objects with a defined sub-schema can use the `schemaBased` editor, which provides a user-friendly interface for editing each property individually. It renders all properties based on their type (and optionally the `editor` field), making it ideal for visually managing complex object structures. This editor supports both single objects and arrays of objects (see below), allowing each property to be represented with an appropriate input field in the UI.

Example of an object property with sub-schema properties using schemaBased editor


```json
{

    "title": "Configuration",

    "type": "object",

    "description": "Advanced configuration options",

    "editor": "schemaBased",

    "properties": {

        "locale": {

            "title": "Locale",

            "type": "string",

            "description": "Locale identifier.",

            "pattern": "^[a-z]{2,3}-[A-Z]{2}$",

            "editor": "textfield"

        },

        "timeout": {

            "title": "Timeout",

            "type": "integer",

            "description": "Request timeout in seconds",

            "minimum": 1,

            "maximum": 300,

            "editor": "number"

        },

        "debugMode": {

            "title": "Debug Mode",

            "type": "boolean",

            "description": "Enable verbose logging during scraping",

            "editor": "checkbox"

        }

    },

    "required": ["locale", "timeout"],

    "additionalProperties": false

}
```


Rendered input: ![Apify Actor input schema with sub-schema editor](/assets/images/sub-schema-ui-085aef2f89d03bd16e94159ade1735a5.png)

Each sub-property is rendered with its own input field according to its type and `editor` configuration:

* The `locale` property is rendered as a text field.
* The `timeout` property is rendered as a numeric input with validation limits.
* The `debugMode` property is rendered as a checkbox toggle.

##### Limitations

The `schemaBased` editor supports only **top-level sub-properties** (level 1 nesting). While deeper nested properties can still define sub-schemas for validation, they cannot use the `schemaBased` editor for rendering. For example, if the Configuration object above included a property that was itself an object with its own sub-properties, those deeper levels would need to use a different editor, such as `json`.

### Array

Example of request list sources configuration:


```json
{

    "title": "Start URLs",

    "type": "array",

    "description": "URLs to start with",

    "prefill": [{ "url": "https://apify.com" }],

    "editor": "requestListSources"

}
```


Rendered input:

![Apify Actor input schema start urls array](/assets/images/input-schema-start-urls-bef8993a2dd7f9700624e248f733f2e3.png)

Example of an array:


```json
{

    "title": "Colors",

    "type": "array",

    "description": "Enter colors you know",

    "prefill": ["Red", "White"],

    "editor": "json"

}
```


Rendered input:

![Apify Actor input schema colors array](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABm4AAAFcCAMAAAD29bGYAAABcVBMVEX////MzMzd3d1WmTvl7+URGBygoKC5ubne3t4ahP8Uf/8SFx2Ojo79/f3v7+/29fbg4OBjoUr4+fjq6upYmz78/P3j4+NWVlYkeJP7/Pvn5+cwMDDl5eWFtnJXmTzx8fHu9eyBtG3y8vOqq6t1fHttplX39/fs7Oy/2bWYm5y41KyLunkpMDTh7NuytLWWwIV0q15fn0YxNzva6dR7g4H09PSJuHZbnEAih//p6enHx8dbXV3k5OSwsbKho6MdJCf6+vqjx5RopE/b3NxwqVlPVFcxODrV1dWUlZWcw4vS09Ocn6AsfZd8sGhbYWJsplVobW9gZWh3rWFdnULO0NGRvX88PDz1+fMuf5glLDDi4uJwdXc2PD/M4MOw0KNITlE/RUjZ2tumydO/wMDG3b20ureJjY/CxMW7vb6py5yPkpR7f4K917Kkp6lspbeEh4nS5MrX59HX5uu+19/EzcY3hZ3O4ed+sL9Ok6k5hZ4zgZtN2BAyAAARcklEQVR42uzBgQAAAACAoP2pF6kCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABm3/5e04aiAI4fL1yajvwoN8RhEIRkKELpw5gwXbWCDGVCWaEv1UJbZHaslP7/bzvZuTdp2ms7dQ42zufBpElQ+tIv5/bKGGOMMcb+Tapa6fUqVQWMMcb+F7UarMdL1KYfRK+vqfZdrV8Fxhhjf0lrce9Ov/mwyqWUe7AxX4gA1nIgRAfW1xDCB4iEiOFFKnXdQW9UrY56A9dNecJhjLG/wplLctYCu/dSHsGmPEdU4bdEkUdDihAi3Dg30BWiCS8IJ24a5j+k7iQExhhjO3d7Io3D8Q5yE9Nf/9dFQhzk002wYW6ob7OXa1P6NcfcG8YYy33c1z5armylJ9HJ/OHsQqLFH8+NEmIGa+YGmkPYNDc03iSwipq4IygZuRNeT2OMMbL/Rtu3XNlG8xIjMw/wLFri2UXyp3PTwgaslRuyTW4CIeqwSqpnm8Yi7Y+Vnm9SYIwxttPctLExV3qWGOD5FMjN3qBfGT7PTby4T29988No1IDoS/odMsF5enQTWf7tb655HT/0Ew9IECh88Vt+k24GvhBOEGTlG+IriRJ8IAAtCGr4XMvvRGCoBN/AK+cGHCE8sKu6qVlSQ+1QJ4j3pzHGWB4X22La1rm5kvKkDiQ6lPITZHrXMnPRfpKb+FQiGofQZynb6YmUh3ju61s/ysGpFSOL74iM06K84A01E5lZlN0VmgdQF6JGn0eXnAD01BL6dEEHr+PQA2E5N/HqnW19N6TMuhXV2HNT3aA+MMYYo9zsr7y+hRgD8QDG7XI5BfRFGpNSbvxLqZ1GOjdfJcLc3BxK7XMEBlUkNrOH4evcCEeQ6orcxEJzFOWm0KE3N2KTm+JDrZQ70IHZAzRwG0BHYIwxtsPc3GIfUnjCOcGrZ9N3F3i4f5Sb4CqryWR5jYe5R7lBb9/dAczxZHp+lNXnOzwSUgKoFce+atR1KzyadIJOV9dCdbKsqCHkuQmzO0nTP8AbNZObOFANR49MeDxOhip7h+hxbppUMIuq26OTkQK0cOm5Hq+mMcbYTnPTxzx8sSywyXM8drJhplvkZok/tgFlUfmmc3MaAIqwUH1966t1G/SBScAxxoNyo2+18GRYbBUwuSm+fhM5FKTAXGjSEKQcZ+bpD0lMbsxCHVhVytvS2nq6GbkVYIwxtqvc0E6BAMqOqSroBs8GeW48PJx6gALs0Bnl5jCCTGKZkkxchno/tEOPeg5mhnLj588kltz4FCjqjFMc0EwIBYWEMqRzg4QQYFMeYxp9Ny2GHsYYY7vLzdSSmyO8dkCn1zSrUG7CIil3Ul5QbuaQPynvKgpWbUxLqB06Jj7lZpj/fye05CYWogWEnsXcHJdnJuRFQxWXc0Nb017NzcJ1B4pzwxhjT77m+XHV9W0X084tCfIA9NLY2zw34+LZezyNaGda0ajMVbsLRvGH3ySFhJgRyg3kw0vdkht8TSCfZgJ8Ln+Prs5NEjuCmNwUkXs1N+32GF95MY0xxnbOvlXgh5TvgTxIeZ3npoLPxnowwNPE5IbsXUry4Nly06JRpSgP5sYBorAzltxUs8aQuj03sUBr5GblGLPgrQKMMbZTXezDBzBa4/GIvu05pAtnUn7Kc3OD1yuA6BHP5MY4X76VmR/PFtPKe5O7+WKaDlOC9+zTTaN4l+bz3Pi/NrslgWpZFtNWb4Qu443QjDG2e/Q1z5/s3U1L40AAxvHJQNwozQsJydIQWKiyQdiTIGhNX6CHBQ9LC720Luhldwuy7Pe/7YzzNIkmBA9aqj6/y6ZNVvH0Z5KZSVD7cCfEJ5WMWfnmgZsyNx7mRSsnZmknclPxxyvb/ikA5QiRlEAYiZQDk5uw2uemJTcR6mKu7Tdyoy+7FJrXnCrgdC7zrHCZJxHRThzYKjGhOd6o498mK/flrbZRmRtxt730cmUyVOUmur52ygc/oaikuCMWSxwIX7fDJCQzMQnUKVxSz82gnMyW6xA1c+Nsg5XUc4NwdWxiAyP9p3ETGyKinZjqRy5zTx25pzYezixQmUJVZTJAbpCSExWAUK+3GSI31UyBDeas3Qqo5gVguU0fi2gSjFhkjjPSxTd+LTcurhTnuLJldOPhU5UbFK3o2qLTsCwhuEUnEdGOLG1tcXO10v/+LfeqOZvf2qjKNjfu3Fb9WfzA7jb13ExXulrjgyvs8lka1Mcwskh1W4IYcVGHWerI7TMafZTlyA1WczpZusY4qPXZzTqKgsZUgVx95gsIiIj2izWxtyZ/cAfsmw2/Hu2ZNr2y4V6UuTE2ExvmvijVJ6D1HWk4U5wICmmgDfnTPdMGEtZuW27cRBrFk9xk6jRfr0ZEtGey+4mJzSIV4Mxt7XaDGQPb7vj/Hi49O3WF9rk2lEkXD6fujpvbCoQYAaVSS8NqoxnPMds7w5dEOshNbH5fIRUnMr/ua5mbCD/0Uv//4Fx1KDd18rBvgfPcl0cnfHk0EdHrL/OEc2s03mSizp9Z33PRFK+Xy9QVraJl83U3mDUG/bgvwMVimzAWXdxp3HlBHLsCABOrO4THvd54OEuS2XDc6x3zThoR0fM2sdlr7UMN5OY14F5ap2TUgxHnpBERvYvc6OHNYKe5CTG46RQm1nBosTVERO8mNyKQjrvL3BR6uQ4REX203PhB4LdVKMjEa4iDwBNERPThckNERG/G4ZHqinZRzUnTjpgbIiJ6ydzA4eNvmBsiImJuiIjobbk4hIuWb4iIiIiIiIiIiIiI6D+7dlDDMAwEUXQHQGSfzMQkzKL8SRRAesjmVuk9El8jDQAAAAAAAAAAAAC/7HkCAI+cueuVGQBomPXCJ1njKgB44Bor+VTbzBkFAI+N0983O1EbAFpGstvjZhUAtKz2vDnGDQBdI6d6Ei8BAJqupJ2bAoAmuQHgTm4A+EdyA8Cd3HzZtWOVhoE4juM3FC30ARxEUHAQDje3gtBZKBisT1CE+v4P4Am9knBDO+b+/XyWLEnIb7nvEgB6JDcAtOQGgB7JDQAtuQGgR3IDQEtuAOiR3ADQkhsAeiQ3ALSuPTe3E6ljcZYAVF/fY+sJubmMJQBnLe/H7ia6y83ipO9DOs4SALmZsThLAORmxuIsAaiWN2Od/yoQ5ZCOswRAbmYszhKAsLl53xY/fR/SZcnvtviQGyCMcLl5WxXr/0N6n/NLSoucN+lS+2F4LJdDzq/1+cYu7+otrYdh09z/dEjnHD+zvrws+VwVz3IDf+zdz2vaYBzH8Q98dthlh8hz0ENCHAScTkwYNMdhkIFsIaAbbgd7EHvYKKP7/eOv3/MkT52Z1jasgiTf1+FpbZP26yVvIg9E1MZJ5ab149e3n/+dm+cXF1/NRdolu0CPdKCFcy1KZj0cMCWfAXDIvj1/l0duDunOo0ewzubzBRQn+EfMANf8qyvsZ8f0yOKdfL24eCe5EULUyAnl5vHHtvbqv3PzVK+7uXFoJYv7y01qjrcSergtNyNyeLfcaC8kN0KIGjmd3Hxva0fNjeumCcnJ/eVmZFYr4nxvbtxwKrkRQojTyc2Xdvv36u0Rc+PZyzqH95abHjmFpZjY3OyQ3AghxAnl5tsKOHpuMCHfw3g0TpPEXaKwGE2c7rpqbvy/h7TINM/NYhw6sx5yD0ZG37ZsMMjI7kDD9gSSGyFEE5xObnLHz41LvoH2KaJmX2A4pzGplht7NxORPVyRI/M6c2hMbUSMADnFDZQmkNwIIRqgcbkJirsbX5FOOtPrGFpERmlCVs1NRAcdkgOck5dFUqJZQqoOtGdBEHjXuemGoUMGYRjOUJ5AciOEqL8a56bj+x0Avr/Yys05qXwAs+Ku4oGiauU/zQCMbG4Wvv/Inr/L9/3NIQgYm1IwMOf6eW5SACHZP7wzrTyBHdOsvuRGCFFLNc5NmUNmWTJncTPhkwkMNw9DVmQGsflahUsPAyrGSKkAKCpTjSU5OpSbnQm2SG6EELXUpNzknDW0SzIKjYAc2E3M2qxqbsakH9DN1yjPjQNtQbqHc1OeQHIjhKi9JuUmy+a0HRjxr3RTCZxVzc2SXMe8jPjeyauimMEgu4dzU55AciOEqL0G5cYDMIzJXtGV8MzqAx4TGG+q5qZFTsnWjN2Yrt2pdpfclCeQD9OEEPXXsNxc7wAbk2P8FTOC0a2aGygmjDCm43FcJTflCSQ3Qojaa1pukJHnwJJ0S79UMIIbcvP6w4cPr7GPQ3KGIbXlXXJj/34xgeRGCNEcjcvNkoyAjt1CprUApHmD4Hs35OalfhrAE+wTkhwDimTr9tycm/9jlCeQ3Agh6u+EcvN5tVq9arf1+vmIuUGSX/KnZLQEOv1MARiS6gq+w8q5GZB8AASkwu25+URG6xa00gSSGyFE/Z1Qbj62r308Zm4uyQhARlIp2kyk5hvyptw8uTE378m42GPg7OZmyI140zoD2J5AciOEaIDm5QYO2QMwVTTmLowzatEbcog9zLM1H2KfZ2QGYE2G5dy45dwo5Pw09mxutiaQ3Agh6u+EcnOPD4/+w94doyYQRWEYfWVA0qRIkTpVYNYgqUQE0VIEV+D+a0cQFC7KFCPOvZ6zgGH+5n7l2w460t1h+de1i6/jf9fu+JzPZvs2mvgHccnG49FALTVzsx73SC/6T363J4pLtnID1FIuN73Rj/Sqv/ztgTxLAIaSmxcc6d/57qc9kGcJwFBy8wZHus4SALmZsDpLAORmwuosASiZm6vcR7rOEgC5mbA6SwAK5gaA6fpot+QGgDO5ASAjuQEgkhsAMpIbACK5ASAjuQEgkhsAMpIbACK5ASAjuQEgkhsAMpIbACK5ASAjuQEgkhsAMpIbACK5ASAjuQEgkhsAMpIbACK5ASAjuQEgkhsAMpIbACK5ASAjuQEgkhtO7NUBDQAAAMKg/q0NYIJvUAKAIt0A8HQDQJFuAHi6AaBINwA83QBQpBsAnm4AKNINAE83ABTpBoCnGwCKdAPA0w0ARboB4OkGgCLdAPB0A0CRbgB4ugGgSDcAPN0AUKQbAJ5uACjSDQBPNwAU6QaApxsAinQDwNMNAEW6AeDpBoAi3QDwdANAkW4AeLoBoEg3jL06oAEAAEAY1L+1AZ7ADUoAULoB4JFuACjdAPBINwCUbgB4pBsASjcAPNINAKUbAB7pBoDSDQCPdANA6QaAR7oBoHQDwCPdAFC6AeCRbgAo3QDwSDcAlG4AeKQbAEo3ADzSDQClGwAe6QaA0g0Aj3QDQOkGgEe6AaB0A8Aj3QBQugHgkW4AKN0A8Eg3AJRuYOzVAQ0AAADCoP6tDWCCb1ACoEg3ADzdAFCkGwCebgAo0g0ATzcAFOkGgKcbAIp0A8DTDQBFugHg6QaAIt0A8HQDQJFuAHi6AaBINwA83QBQpBsAnm4AKNINAE83ABTpBoCnGwCKdAPA0w0ARboB4OkGgCLdAPB0A0CRbgB4ugGgSDcAPN0AUKQbAJ5uACjSDYy9OqABAABAGNS/tQGewA1KAJRuAHikGwBKNwA80g0ApRsAHukGgNINAI90A0DpBoBHugGgdAPAI90AULoB4JFuACjdAPBINwCUbgB4pBsASjcAPNINAKUbAB7pBoDSDQCPdANA6QaAR7oBoHQDwCPdAFC6AeCRbgAo3QDwSDcAlG4AeKQbAEo3ADzSDQClG2Ds1UENgDAMAMDioGZmYv4FIaA86EJImtyZOJhINwBUugFgIt0AUOkGgIl0A0ClGwAm0g0AlW4AmEg3AFS6AWAi3QBQ6QaAiXQDQKUbACbSDQCVbgCY6NNutm4A6Hezoyd1A0C/m4yepRsA+t2saMoAgKdu5AFA9U835/ICgIaMIyv3BQCv7FwBAAAAAAAAAAAAAAAAAAAAAAAAAAAA3O3BAQkAAACAoP+v+xEqAAAAAAAAAAAAAAAAAAAAAAAAAAAAALAXmqX8a95ntpsAAAAASUVORK5CYII=)

Properties:

| Property           | Value                                                                                                                                            | Required | Description                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `editor`           | One of - `json` - `requestListSources` - `pseudoUrls` - `globs` - `keyValue` - `stringList` - `fileupload` - `select` - `schemaBased` - `hidden` | Yes      | UI editor used for input.                                                                                            |
| `placeholderKey`   | String                                                                                                                                           | No       | Placeholder displayed for key field when no value is specified. Works only with `keyValue` editor.                   |
| `placeholderValue` | String                                                                                                                                           | No       | Placeholder displayed in value field when no value is provided. Works only with `keyValue` and `stringList` editors. |
| `maxItems`         | Integer                                                                                                                                          | No       | Maximum number of items the array can contain.                                                                       |
| `minItems`         | Integer                                                                                                                                          | No       | Minimum number of items the array can contain.                                                                       |
| `uniqueItems`      | Boolean                                                                                                                                          | No       | Specifies whether the array should contain only unique values.                                                       |
| `nullable`         | Boolean                                                                                                                                          | No       | Specifies whether null is an allowed value.                                                                          |
| `items`            | object                                                                                                                                           | No       | Specifies format of the items of the array, useful mainly for multiselect and for `schemaBased` editor (see below).  |
| `isSecret`         | Boolean                                                                                                                                          | No       | Specifies whether the input field will be stored encrypted. Only available with `json` and `hidden` editors.         |

Usage of this field is based on the selected editor:

* `requestListSources` - value from this field can be used as input for the [RequestList](https://crawlee.dev/api/core/class/RequestList) class from Crawlee.
* `pseudoUrls` - is intended to be used with a combination of the [PseudoUrl](https://crawlee.dev/api/core/class/PseudoUrl) class and the [enqueueLinks()](https://crawlee.dev/api/core/function/enqueueLinks) function from Crawlee.

Editor type `requestListSources` supports input in formats defined by the [sources](https://crawlee.dev/api/core/interface/RequestListOptions#sources) property of [RequestListOptions](https://crawlee.dev/api/core/interface/RequestListOptions).

Editor type `globs` maps to the Crawlee's [GlobInput](https://crawlee.dev/api/core#GlobInput) used by the [UrlPatterObject](https://crawlee.dev/api/core#UrlPatternObject).

Editor type `fileupload` enables users to specify a list of files as input. The input is passed to the Actor as an array of strings. The Actor author is responsible for interpreting the strings, including validating file existence and format. This editor simplifies the process for users to upload files to a key-value store of their choice.

#### Select editor for arrays

The `select` editor for arrays allows users to pick multiple items from a dropdown list. This creates a multiselect field in the UI. You can either only allow users to select from a set of predefined values, or allow them to specify custom values in addition to suggested values.

To correctly define options for multiselect, you need to define the `items` property and then provide values in `enum`/`enumSuggestedValues` and (optionally) labels in `enumTitles` properties.

##### Select from predefined values

When you need to restrict selections to a specific set of values, use the `enum` property:


```json
{

    "title": "Countries",

    "description": "Select multiple countries",

    "type": "array",

    "editor": "select",

    "items": {

        "type": "string",

        "enum": ["us", "de", "fr", "uk", "jp"],

        "enumTitles": ["United States", "Germany", "France", "United Kingdom", "Japan"]

    }

}
```


This creates a multiselect dropdown where users can only select from the predefined values:

![Apify Actor input schema - multiselect with predefined values](/assets/images/input-schema-country-multi-06939f93e101392f15ef95bc0626c812.png)

##### Select with custom input

When you want to suggest values but still allow custom input, use the `enumSuggestedValues` property:


```json
{

    "title": "Tags",

    "description": "Select or enter custom tags",

    "type": "array",

    "editor": "select",

    "items": {

        "type": "string",

        "enumSuggestedValues": ["web", "scraping", "automation", "data", "api"],

        "enumTitles": ["Web", "Scraping", "Automation", "Data", "API"]

    }

}
```


This creates a multiselect dropdown with suggested values, but users can also enter custom values:

![Apify Actor input schema - multiselect with custom values](/assets/images/input-schema-tags-multi-suggestion-cdbf9727cfc9537f5be4c115c967b7dd.png)

#### Array items validation

Arrays in the input schema can define an `items` field to specify the type and validation rules for each item. Each array item is validated according to its `type` and inside the `items` field it's also possible to define additional validation rules such as `pattern`, `minimum`, `maximum`, etc., depending on the item type.

If the item type is an `object`, it can define its own `properties`, `required`, and `additionalProperties` fields, working in the same way as a single object field (see Object fields validation).

Validation is performed both in the UI and during Actor execution via the API. Array items can themselves be objects with sub-schemas, and objects within objects, recursively, without any limit on nesting depth.

Example of an array of objects property with sub-schema


```json
{

    "title": "Request Headers",

    "type": "array",

    "description": "List of custom HTTP headers",

    "editor": "json",

    "items": {

        "type": "object",

        "properties": {

            "name": {

                "title": "Header Name",

                "description": "Name of the HTTP header",

                "type": "string",

                "minLength": 1

            },

            "value": {

                "title": "Header Value",

                "description": "Value of the HTTP header",

                "type": "string",

                "minLength": 1

            }

        },

        "required": ["name", "value"],

        "additionalProperties": false

    },

    "minItems": 1,

    "maxItems": 20

}
```


Rendered input: ![Apify Actor input schema with sub-schema array](/assets/images/sub-schema-array-json-ac43c1fad076eaf2840856a5b46462e0.png)

In this example:

* The array must contain between 1 and 20 items.
* Each item must be an object with `name` and `value` properties.
* Both `name` and `value` are required.
* No additional properties beyond those defined are allowed.
* The validation of each object item works the same as for a single object field (see Object fields validation).

##### Handling default and prefill values array with object sub-properties

When defining an array of objects with sub-properties, it's possible to set `default` and `prefill` values in two ways:

1. *At the parent array level*: You can provide an array of complete objects as the `default` or `prefill` value, which will be used only if there is no value specified for the field.
2. *At the individual sub-property level*: You can specify `default` or `prefill` values for each sub-property within the `properties` definition of the object items. These values will be applied to each object in the array value.

For example, having an input schema like this:


```json
{

    "title": "Requests",

    "type": "array",

    "description": "List of HTTP requests",

    "editor": "schemaBased",

    "default": [

        { "url": "https://apify.com", "port": 80 }

    ],

    "items": {

        "type": "object",

        "properties": {

            "url": {

                "title": "URL",

                "type": "string",

                "description": "Request URL",

                "editor": "textfield"

            },

            "port": {

                "title": "Port",

                "type": "integer",

                "description": "Request port",

                "editor": "number",

                "default": 8080

            }

        },

        "required": ["url", "port"],

        "additionalProperties": false

    }

}
```


If there is no value specified for the field, the array will default to containing one object:


```json
[

    { "url": "https://apify.com", "port": 80 }

]
```


However, if the user adds a new item to the array, the `port` sub-property of that new object will default to `8080`, as defined in the sub-property itself.

#### `schemaBased` editor

Arrays can use the `schemaBased` editor to provide a user-friendly interface for editing each item individually. It works for arrays of primitive types (like strings or numbers) as well as arrays of objects, rendering each item according to its type and optional `editor` configuration.

This makes it easy to manage complex arrays in the UI while still enforcing validation rules defined in the items field.

Example of an array of strings property with sub-schema


```json
{

    "title": "Start URLs",

    "type": "array",

    "description": "List of URLs for the scraper to visit",

    "editor": "schemaBased",

    "items": {

        "type": "string",

        "pattern": "^https?:\\/\\/(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}(?:\\/\\S*)?$"

    },

    "minItems": 1,

    "maxItems": 50,

    "uniqueItems": true

}
```


Rendered input: ![Apify Actor input schema with sub-schema array string](/assets/images/sub-schema-array-string-268b62ea2a270343ab448873958ade84.png)

* Each item is rendered as a text field.
* The array must contain between 1 and 50 items.
* Duplicate values are not allowed.

Example of an array of objects property with sub-schema


```json
{

    "title": "Request Headers",

    "type": "array",

    "description": "List of custom HTTP headers",

    "editor": "schemaBased",

    "items": {

        "type": "object",

        "properties": {

            "name": {

                "title": "Header Name",

                "description": "Name of the HTTP header",

                "type": "string",

                "minLength": 1,

                "editor": "textfield"

            },

            "value": {

                "title": "Header Value",

                "description": "Value of the HTTP header",

                "type": "string",

                "minLength": 1,

                "editor": "textfield"

            }

        },

        "required": ["name", "value"],

        "additionalProperties": false

    },

    "minItems": 1,

    "maxItems": 20

}
```


Rendered input: ![Apify Actor input schema with sub-schema array object](/assets/images/sub-schema-array-object-915f0b98cacb4a2518251f611da6d4a6.png)

* Each array item is represented as a group of input fields (`name` and `value`).
* Validation ensures all required sub-properties are filled and no extra properties are allowed.
* New items can be added up to the `maxItems` limit, and each item is validated individually.

##### Limitations

As with objects, the sub-schema feature for arrays only works for level 1 sub-properties. While the objects in the array can have properties with their own schema definitions, those properties cannot themselves use the `schemaBased` editor.

### Resource type

Resource type identifies what kind of Apify Platform object is referred to in the input field. For example, the Key-value store resource type can be referred to using a string ID.

Supported resource types are storage resources (dataset, key-value store, request queue) and [MCP connectors](https://docs.apify.com/integrations/mcp-connectors.md), which let an Actor call third-party MCP servers using credentials the user has authorized in their account.

For Actor developers, the resource input value is a string representing either the resource ID or (unique) name. The type of the property is either `string` or `array`. In case of `array` (for multiple resources) the return value is an array of IDs or names. In the user interface, a picker (`resourcePicker` editor) is provided for easy selection, where users can search and choose from their own resources or those they have access to.

Example of a Dataset input:


```json
{

    "title": "Dataset",

    "type": "string",

    "description": "Select a dataset",

    "resourceType": "dataset"

}
```


Rendered input:

![Apify Actor input schema dataset](/assets/images/input-schema-dataset-2c784c5238066c743fd2c4fb28d34fed.png)

The returned value is resource reference, in this example it's the dataset ID as can be seen in the JSON tab:

![Apify Actor input schema dataset](/assets/images/input-schema-dataset-json-1b7772d96d7ddb0a8be8604841754274.png)

Example of multiple datasets input:


```json
{

    "title": "Datasets",

    "type": "array",

    "description": "Select multiple datasets",

    "resourceType": "dataset",

    "resourcePermissions": ["READ"]

}
```


Rendered input:

![Apify Actor input schema datasets](/assets/images/input-schema-datasets-40376f5fbddb49389c41f2d34699de26.png)

#### Single value properties

| Property              | Value                                                                  | Required                                               | Description                                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                | `string`                                                               | Yes                                                    | Specifies the type of input - `string` for single value.                                                                                          |
| `editor`              | One of - `resourcePicker` - `textfield` - `hidden`                     | No                                                     | Visual editor used for the input field. Defaults to `resourcePicker`.                                                                             |
| `resourceType`        | One of - `dataset` - `keyValueStore` - `requestQueue` - `mcpConnector` | Yes                                                    | Type of Apify Platform resource. Use `mcpConnector` to accept an [MCP connector](https://docs.apify.com/integrations/mcp-connectors.md) as input. |
| `resourcePermissions` | Array of strings; allowed values: - `READ` - `WRITE`                   | Yes for storage resources; not used for `mcpConnector` | Permissions requested for the referenced resource. Use \["READ"] for read-only access, or \["READ", "WRITE"] to allow writes.                     |
| `pattern`             | String                                                                 | No                                                     | Regular expression that will be used to validate the input. If validation fails, the Actor will not run.                                          |
| `minLength`           | Integer                                                                | No                                                     | Minimum length of the string.                                                                                                                     |
| `maxLength`           | Integer                                                                | No                                                     | Maximum length of the string.                                                                                                                     |

#### Multiple values properties

| Property              | Value                                                                  | Required                                               | Description                                                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                | `array`                                                                | Yes                                                    | Specifies the type of input - `array` for multiple values.                                                                                                        |
| `editor`              | One of - `resourcePicker` - `hidden`                                   | No                                                     | Visual editor used for the input field. Defaults to `resourcePicker`.                                                                                             |
| `resourceType`        | One of - `dataset` - `keyValueStore` - `requestQueue` - `mcpConnector` | Yes                                                    | Type of Apify Platform resource. Use `mcpConnector` to accept [MCP connectors](https://docs.apify.com/integrations/mcp-connectors.md) as input.                   |
| `resourcePermissions` | Array of strings; allowed values: - `READ` - `WRITE`                   | Yes for storage resources; not used for `mcpConnector` | Permissions requested for the referenced resources. Use \["READ"] for read-only access, or \["READ", "WRITE"] to allow writes. Applies to each selected resource. |
| `minItems`            | Integer                                                                | No                                                     | Minimum number of items the array can contain.                                                                                                                    |
| `maxItems`            | Integer                                                                | No                                                     | Maximum number of items the array can contain.                                                                                                                    |

#### Resource permissions

If your Actor runs with limited permissions, it must declare what access it needs to resources supplied via input. The `resourcePermissions` field defines which operations your Actor can perform on user-selected storages. This field is evaluated at run start and expands the Actor's [limited permissions](https://docs.apify.com/actors/development/permissions.md) scope to access resources sent via input.

* `["READ"]` - The Actor can read from the referenced resources.
* `["READ", "WRITE"]` - The Actor can read from and write to the referenced resources.

Runtime behavior

This setting defines runtime access only and doesn't change field visibility or whether the field is required in the UI. For array fields (`type: array`), the same permissions apply to each selected resource. Your Actor's run will fail with an insufficient-permissions error if it attempts an operation without the required permission, such as writing with read-only access. Users can see the required permissions in the [input field's tooltip](https://docs.apify.com/actors/running/permissions.md#view-permission-levels-in-apify-console-and-apify-store).

#### MCP connector resource type

When `resourceType` is `mcpConnector`, the input field accepts one or more [MCP connectors](https://docs.apify.com/integrations/mcp-connectors.md) the user has authorized in their account. The Actor receives the connector ID (or an array of IDs) as the input value and connects to the upstream MCP server through the Apify MCP Proxy at runtime.

The `mcpConnector` resource type does not use `resourcePermissions`. Instead, eligibility and per-tool access are declared through a required `mcpServers` field, which lists the upstream MCP server URLs and tool constraints the Actor accepts:


```json
{

    "slackConnector": {

        "title": "Slack connector",

        "description": "Read-only access to your Slack workspace",

        "type": "string",

        "resourceType": "mcpConnector",

        "mcpServers": [

            {

                "url": "https://mcp.slack.com/mcp",

                "tools": {

                    "required": ["list_*", "get_*", "read_*"],

                    "readOnly": true

                }

            }

        ]

    }

}
```


The same declaration acts as both eligibility filter (the input picker only offers compatible connectors) and runtime ceiling (the proxy rejects tool calls outside the declared set). For the full `mcpServers` schema, behavioral hints, and code samples, see [Build Actors with MCP connectors](https://docs.apify.com/integrations/mcp-connectors/use-in-actors.md).

### Removal of `patternKey` and `patternValue`

Removed properties

**The following properties were deprecated, with support ending on June 30, 2026, and are no longer supported:**

* `patternKey` - Used to validate keys in objects and arrays
* `patternValue` - Used to validate values in objects and arrays

Building an Actor whose input schema contains them fails with a validation error. Existing builds are not affected, but you need to migrate your input schema before you build the Actor again.

These properties were removed to better align with the JSON schema specification. By moving to standard JSON schema, a more consistent experience is provided that matches industry standards while enabling more powerful validation capabilities through the ability to define sub-properties.

#### Alternatives for arrays

For arrays, you can replace `patternKey` and `patternValue` by using the `items` property with a subschema.

Example of replacing `patternValue` for an array of strings:

Old approach with patternValue


```json
{

    "title": "Tags",

    "type": "array",

    "description": "Enter tags",

    "editor": "stringList",

    "patternValue": "^[a-zA-Z0-9-_]+$"

}
```


New approach with items subschema


```json
{

    "title": "Tags",

    "type": "array",

    "description": "Enter tags",

    "editor": "stringList",

    "items": {

        "type": "string",

        "pattern": "^[a-zA-Z0-9-_]+$"

    }

}
```


Example of replacing both `patternKey` and `patternValue` for an array with key-value pairs:

Old approach with patternKey and patternValue


```json
{

    "title": "Headers",

    "type": "array",

    "description": "HTTP headers",

    "editor": "keyValue",

    "patternKey": "^[a-zA-Z0-9-]+$",

    "patternValue": "^.+$"

}
```


New approach with items subschema


```json
{

    "title": "Headers",

    "type": "array",

    "description": "HTTP headers",

    "editor": "keyValue",

    "items": {

        "type": "object",

        "properties": {

            "key": {

                "title": "Name",

                "type": "string",

                "description": "Header name",

                "pattern": "^[a-zA-Z0-9-]+$"

            },

            "value": {

                "title": "Value",

                "type": "string",

                "description": "Header value",

                "pattern": "^.+$"

            }

        },

        "required": ["key", "value"]

    }

}
```


#### Alternatives for objects

For objects, there is no direct replacement for `patternKey` and `patternValue` properties.

If you need to validate object properties, consider using a predefined schema with the `properties` field instead of allowing arbitrary properties with validation patterns.
