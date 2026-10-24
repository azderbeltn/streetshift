# Forward-looking corridor candidates (STOP GATE 1)

Researched 2026-10-24. Business counts below are from city open data, not Google Maps. The Apify scrape will give the real Google Maps count, so treat these numbers as a floor/sanity check. Dataset IDs were checked live against `data.sf.gov` (SODA `/resource/<id>.json` works with the new domain) and `data.cityofberkeley.info`.

---

## 1. Hayes Street, Hayes Valley, San Francisco

- **Segment:** Hayes St, **Gough St to Octavia St** (the "400 block", the current weekend shared street). For context and overflow modeling, extend to Franklin St to Laguna St.
- **Center:** 37.7768, -122.4237 (from the closure geometry in DataSF `v9cz-kk5i`, CNN 6816000)
- **Why it's a good demo:** It is a **real, recurring closure happening right now**: Fridays 4 to 10 pm and Saturdays 7 am to 10 pm, with a Muni reroute of the 6 Hayes/Parnassus. So the judge can test "what if it went full-time or permanent" against a live policy question. Dense boutiques, cafés and restaurants with Patricia's Green next door give a strong Connection (Meta) story. The overflow streets (Grove, Fell, Oak) and the Muni reroute make the Traffic panel concrete.
- **Debate status (active):**
  - Oct 10, 2023: SFMTA proposed cutting the 3-day closure to Saturday only. Its door-to-door survey found 66% of merchants "preferred or were satisfied" with a one-day closure, 16% wanted all weekend and 11% never. https://www.sfmta.com/blog/whats-next-hayes-street-weekend-street-closure
  - Nov 2023: the SFMTA Board kept weekend pedestrian-only access for another year. https://www.sfexaminer.com/news/transit/sfmta-votes-to-keep-car-free-hayes-street-for-another-year/article_c3758f46-7e5f-11ee-a81d-a7931d7e786f.html
  - May 23, 2025: Supervisor Bilal Mahmood proposed making the 400 block an entertainment zone and "town square", plus an SFCTA study of limiting cars, permanent closure included. The permit holder (HVNA) says the closures caused "minimal impact", the Merchants Council supports the study, and the neighbor group HVSafe opposes it. https://sfstandard.com/2025/05/23/hayes-valley-entertainment-zone-car-free-bilal-mahmood/
  - Feb 24, 2026: the SFCTA Board agenda includes $410,000 from the Market & Octavia fund for a **Hayes Valley Public Life Study**. https://www.sfcta.org/sites/default/files/2026-02/SFCTA_Board_PACKET_2026-02-10.pdf (opposition view: https://www.hvsafe.com/a-study-without-a-decision-why-has-hayes-street-never-been-allowed-to-reopen/)
  - Fall 2026: the closure continues on Fridays and Saturdays and is "expected to continue through the rest of 2026". https://www.sfmta.com/travel-updates/hayes-valley-farmers-market-shared-spaces-fridays-saturdays-october-2026
- **Count / supporting data nearby:**
  - `v9cz-kk5i` Current and Upcoming Events based on Temporary Street Closures. It has the Hayes closure as a permitted "Roadway Shared Spaces" record with dates, hours and line geometry, which makes it a perfect scenario seed.
  - `g8m3-pdis` Registered Business Locations: about **857 active registrations within 300 m** (all types, including offices).
  - `dpch-7nr4` Table and Chairs / Display Merchandise Registrations (Shared Spaces): outdoor seating locations.
  - `27b3-yjjx` SFMTA Metered Street Blocks: parking supply, used for car dependence.
  - Gap: DataSF has **no pedestrian count dataset** and no live vehicle count dataset for this block. Bike Volume Manual Counts (`v4v2-5x7s`, ends 2017) has no Hayes location. Flag traffic and pedestrian volume as estimated.

## 2. Telegraph Avenue, Southside, Berkeley

- **Segment:** Telegraph Ave, **Bancroft Way to Dwight Way** (4 blocks). The Telegraph for People car-free proposal covers Bancroft to Haste. The city's multimodal project runs Dwight to Woolsey.
- **Center:** 37.8668, -122.2588 (Telegraph & Channing Way)
- **Why it's a good demo:** It is the Bay Area's most explicit car-free street proposal, it sits next to the CalHacks venue (UC Berkeley), and the judges know it. Wall-to-wall cheap eats, cafés, bookstores (Moe's, Amoeba) and heavy student foot traffic make Connection likely to "Thrive", which is a nice contrast to a weaker street. AC Transit lines 6 and 51B and loading needs give real tradeoffs for the Traffic and Economy panels.
- **Debate status (active):**
  - 2022: the Council approved a bus lane and told staff to study car-free options. https://www.sfchronicle.com/eastbay/article/A-group-that-wants-a-car-free-Telegraph-Avenue-in-16942175.php , https://www.planetizen.com/news/2022/02/116344-berkeleys-famed-telegraph-avenue-could-go-car-free
  - Oct 2025: staff recommended Concept 3B (lane reduction, protected bike lanes, bus lanes and boarding islands, keeping the most parking). It is not car-free. https://www.dailycal.org/news/city/city-government/berkeley-city-council-weighs-transit-and-pedestrian-safety-changes-for-telegraph-avenue/article_ec8b0131-ff02-4c53-a38a-c799be7ca4ec.html
  - Oct 28, 2025: Council item, Resolution #72,014. Detailed design and construction are **unfunded**. https://berkeleyca.gov/your-government/our-work/capital-projects/telegraph-avenue-multimodal-corridor-project
  - 2025: Telegraph for People (an advocacy group) says Car-Free Telegraph ranked #6 of 50+ council referrals. https://www.telegraphforpeople.com/campaigns/car-free-telegraph
  - Oct 6, 2026: car-free Telegraph is a dividing issue in the **Nov 2026 District 7 Council race**. https://www.berkeleyside.org/2026/10/06/berkeley-city-council-district-7-lunaparras-chosen-successor-faces-off-against-a-peoples-park-activist
- **Count / supporting data nearby:**
  - Berkeley Open Data `rwnf-bu3w` Business Licenses (has address and NAICS but no coordinates, so it needs geocoding): **212 active licenses** with 2000 to 2999 Telegraph addresses.
  - Berkeley's portal has **no traffic or pedestrian count datasets** (only signals `ye5w-tc93`). Counts likely sit in the project's existing-conditions presentations (https://berkeleyca.gov/sites/default/files/documents/TELEGRAPH%20AVE%20TIC%20PRESENTATION.pdf and the 2022 workshop deck). These are PDFs and still need to be checked. Otherwise use Caltrans/MTC counts or estimates, flagged.

## 3. Valencia Street, Mission District, San Francisco

- **Segment:** Valencia St, **16th St to 24th St**. This includes the 2020 car-free blocks (16th to 17th and 23rd to 24th) and the 15th to 23rd Mid-Valencia bikeway segment.
- **Center:** 37.7587, -122.4216 (Valencia & 20th St)
- **Why it's a good demo:** It is SF's most famous street-space fight. A center-running bike lane pilot was ripped out after merchant complaints, even though the city controller found "no statistical basis" linking it to lost sales. That makes it a perfect showcase for evidence beating gut feeling. It has very dense restaurants, bars and shops, plus parklets, and Sunday Streets closes the whole corridor. It is also the only candidate with a **real nearby count** in DataSF.
- **Debate status (recent, now cooler):**
  - Oct 2018: advocates pushed for a pedestrianization trial on 16th to 17th and 23rd to 24th. https://sf.streetsblog.org/2018/10/19/push-for-valencia-pedestrianization-trial
  - Jul 2020: those two blocks went car-free Thursday to Sunday evenings under Shared Spaces. https://sfist.com/2020/07/26/two-blocks-on-valencia-street-go-car-free-this-weekend-to-rejoiced-successes/
  - Nov 19, 2024: the SFMTA Board unanimously voted to replace the center bike lane with curbside lanes. This removes 79 parking and loading spaces, and the merchants association would not endorse it. https://missionlocal.org/2024/11/sfmta-board-approves-new-valencia-bike-lanes-but-few-are-happy/ , https://sf.streetsblog.org/2024/11/19/sfmta-approves-removal-of-valencias-center-running-bike-lane
  - Feb to mid-2025: construction started Feb 10, 2025. The project is now marked "Completed". https://www.sfmta.com/projects/valencia-bikeway-improvements
  - Jul 19, 2026: Sunday Streets closed Valencia from Duboce to 26th. https://www.sfmta.com/project-updates/sunday-streets-mission-district
  - I found **no live 2025 or 2026 proposal to pedestrianize** Valencia. The fight is about bike lanes and parking.
- **Count / supporting data nearby:**
  - `v4v2-5x7s` Bike Volume – Manual Counts (PM peak, 2006–2017). It has locations at Valencia & 17th (1,073 bikes in the 2017 PM peak), Valencia & 18th, 22nd & Valencia, and Market & Valencia.
  - `g8m3-pdis` Registered Business Locations: about **855 active registrations within 300 m**.
  - `dpch-7nr4` Shared Spaces registrations (parklets), `27b3-yjjx` Metered Street Blocks, and `hkz3-itiu` Slow Streets (network context).
  - Gap: there are no pedestrian counts or recent vehicle counts on DataSF.

---

**Recommendation:** Pick **Hayes Street (Gough to Octavia)**. It is the only one with a live, recurring closure and an open 2026 city study of making it permanent, so the demo answers a question the city is actually asking. Use Telegraph as the backup if you want the "next to the venue" story.
