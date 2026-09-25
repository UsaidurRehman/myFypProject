# RaahBar Planner — Implementation Plan v3 (Final)

## Your Table: Complete Gap Analysis

> Research verdict on every category — what exists, what doesn't, and how we cover it.

---

### 1. Pass Closures & Road Conditions
**Requested**: NHMP / NHA Alerts API

| Reality | Our Approach |
| :--- | :--- |
| ❌ **No public API exists.** NHMP Travel Advisory portal is manually updated HTML — not machine-readable. NHA has no developer portal. | ✅ **stepfun `web_search` tool** — already in the plan. When generating itinerary, the AI is given the `web_search` tool and instructed to search: *"Babusar Pass road status [current month] [year]"*, *"KKH landslide updates [destination]"*, *"NHMP travel advisory northern Pakistan"*. It retrieves current news, NHMP advisories, and rider community posts in real-time. |

**Status: ✅ Already covered in plan (via web_search).**

---

### 2. Hyper-Local Weather & Forecasts
**Requested**: PMD API or OpenWeatherMap

| Reality | Our Approach |
| :--- | :--- |
| ❌ **PMD has no public REST API.** Their data is available on their website as reports, not as an endpoint. | ✅ **OpenWeatherMap Standard API** — already planned. Uses `/data/2.5/weather` and `/data/2.5/forecast` endpoints. Free plan, **no credit card required**. Returns temperature, rain probability, wind speed, snow flags. We query for the destination coordinates. |
| ✅ OWM is actually better than PMD — PMD data is delayed; OWM updates every 10 minutes. | |

**Status: ✅ Already covered in plan (OpenWeatherMap Standard, free).**

---

### 3. Fuel Station Availability
**Requested**: PSO / Attock / Shell API

| Reality | Our Approach |
| :--- | :--- |
| ❌ **No API from any fuel company exists** — PSO Fuelink is a closed fleet system, Attock's fuel locator is consumer-only website, Shell Pakistan has no developer portal. | **Two-layer approach:** |
| | **Layer 1 — Curated Static Knowledge Base** (most reliable): Expand `constants.ts` with a hand-verified table of critical fuel gaps along KKH, Babusar route, Skardu road, and N-35. Example entries: *"Chilas → last reliable fuel before Gilgit (120km)"*, *"Shatial → no fuel for 200km to Skardu"*. This is injected directly into the AI prompt. |
| | **Layer 2 — Overpass API (OSM)**: Free, no key required. Query `amenity=fuel` nodes near each day's endpoint coordinates. Returns whatever fuel stations are mapped in that area on OSM. Remote areas may have gaps (OSM volunteer mapping is sparse in Kohistan), so Layer 1 static data is the safety net. |

**Status: ⚠️ Not in previous plan — now ADDED. Uses static knowledge base + Overpass API.**

---

### 4. Permits & Restricted Zones
**Requested**: GB Tourist Police / Interior Ministry Portals

| Reality | Our Approach |
| :--- | :--- |
| ❌ **No public API.** GB Tourist Police, Interior Ministry, and Nadra-linked NOC systems are manual, window-based processes with no machine-readable endpoint. | ✅ **Two layers already in plan:** |
| | **Layer 1**: Domain knowledge hardcoded in `prompts.js` system prompt (Naltar, Shimshal, Khunjerab NOC rules, Deosai and Astore restricted areas, foreigners vs. Pakistani nationals rules). |
| | **Layer 2**: stepfun `web_search` to check *"NOC required [destination] 2026"* or *"permit [restricted valley] current status"* for any recent policy changes. |

**Status: ✅ Already covered in plan (AI knowledge + web_search).**

---

### 5. Terrain & Elevation Profiles
**Requested**: Google Elevation API / Open-Elevation API

| Reality | Our Approach |
| :--- | :--- |
| ❌ Google Elevation API requires billing. | ✅ **Open-Meteo Elevation API** — completely free, no API key, no registration. Endpoint: `https://api.open-meteo.com/v1/elevation?latitude=X&longitude=Y`. Uses Copernicus DEM 90m resolution data. |
| ✅ Open-Meteo Elevation is more reliable than open-elevation.com (which has a 1,000 req/month public limit). | |

**This is a NEW addition to the plan.**

**What it enables:**
- Real altitude at each day's destination (e.g., "Day 4 endpoint: Karimabad = **2,438m**")
- Altitude delta between consecutive days (e.g., "Day 3→4 jumps 1,900m — flag acclimatization")
- Engine performance warning: AI instructed to warn if day's altitude > 3,500m for 125cc/150cc bikes (power loss ~20-25% at altitude)
- Automatic "acclimatization day" suggestion if jump > 1,500m in elevation in one day

**Status: ⚠️ Not in previous plan — now ADDED (Open-Meteo Elevation API, free, no key).**

---

### 6. Crowdsourced Landslide & Traffic Incidents
**Requested**: WhatsApp Bots / Facebook Groups (Karakoram Club etc.)

| Reality | Our Approach |
| :--- | :--- |
| ❌ **Facebook Graph API** is heavily restricted — public group posts are not accessible. **WhatsApp Business API** prohibits scraping/bot listening on non-business accounts. Direct access to Karakoram Club's group wall is impossible programmatically. | ✅ **stepfun `web_search`** — already in plan. The model searches for: *"Kohistan landslide [current month]"*, *"Besham road blocked"*, *"KKH blockage today"*. These incidents are rapidly posted on rider forums (PakWheels, KarakoramClub.pk, Pakbikes.com), news outlets (Dawn, Geo), and shared on public Twitter/X pages — all of which are indexed and reachable by web search. |

**Status: ✅ Already covered (web_search finds these from public news/forums). Direct Facebook/WhatsApp API is technically impossible.**

---

### 7. Medical & Repair Infrastructure
**Requested**: Rescue 1122 Data / Local Mechanic Mapping

| Reality | Our Approach |
| :--- | :--- |
| ❌ **Rescue 1122 has no public API.** Their operational GIS data is internal. | **Two-layer approach (NEW addition):** |
| | **Layer 1 — Curated Static Emergency Data** in `constants.ts`: A hand-built table of key emergency contacts per region: *Gilgit DHQ Hospital*, *Rescue 1122 Gilgit (1122)*, *CMH Rawalpindi*, *Aga Khan Hospital Gilgit*, major mechanic markets (Gilgit Chowk, Chilas Bazar, Besham). Injected into AI prompt. |
| | **Layer 2 — Overpass API**: Query `amenity=hospital`, `amenity=clinic`, `shop=motorcycle` near each day's endpoint coordinates. Returns mapped hospitals, clinics, and motorcycle shops from OSM. Note: rural Pakistan OSM coverage is sparse — static data (Layer 1) is the real safety net here. |

**Status: ⚠️ Not in previous plan — now ADDED. Uses static knowledge base + Overpass API.**

---

## Complete API Stack (Final — 100% Free, No Billing)

| Service | Purpose | Key Required? | Cost |
| :--- | :--- | :--- | :--- |
| **Nominatim (OSM)** | Geocode city names → lat/lng | No | Free |
| **OpenRouteService** | Real road distances, waypoints per day | Free signup (no billing) | Free tier |
| **Open-Meteo Weather** | Current weather + 5-day forecast | No | Free |
| **Open-Meteo Elevation** | Real altitude at each day endpoint | No | Free |
| **Overpass API (OSM)** | Nearby fuel stations, hospitals, mechanics | No | Free |
| **stepfun web_search** | Live road conditions, pass status, incidents | Existing OpenRouter key | No extra cost |

**New keys needed from you: 1** (OpenRouteService — free signup at openrouteservice.org)
**OpenWeatherMap dropped from plan** — Open-Meteo covers both weather AND elevation, with zero keys required. Simpler stack.

---

## Revised Agent Pipeline

```
User Hits Generate
        │
        ▼
[Parallel Stage 1 — Real Data Fetch]
 ├── Nominatim: geocode start + end
 ├── ORS: real route, daily legs, road names  
 ├── Open-Meteo Weather: destination weather
 ├── Open-Meteo Elevation: altitude per day endpoint
 └── Overpass: fuel stations + hospitals near endpoints
        │
        ▼ (all data injected into prompt)
[Stage 2 — AI Enrichment + Live Search]
  stepfun/step-3.5-flash with web_search tool:
  • Real route data → annotate highlights, tips
  • Elevation data → flag altitude warnings, engine limits
  • Weather data → surface rain/snow/storm alerts
  • Overpass data → confirm/supplement fuel + medical info
  • web_search → current pass status, active landslides, incidents
        │
        ▼
[Rendered Itinerary — Fully Grounded in Real World]
```

All Stage 1 calls run in **parallel** (`Promise.allSettled`) — so 5 data sources are fetched simultaneously, not sequentially. Total pipeline time: ~3–5 seconds for data, ~5–8 seconds for AI response.

---

## New Additions to File Plan

### `src/lib/routing.js` (Updated)
```
geocodeLocation(city)           → Nominatim
getRouteSegments(origin, dest)  → OpenRouteService (driving-car)
getWeather(coords)              → Open-Meteo /forecast
getElevations(coordsArray)      → Open-Meteo /elevation  ← NEW
getNearbyInfrastructure(coords) → Overpass API           ← NEW
  (fuel stations + hospitals within 20km of each day endpoint)
```

### `src/constants.ts` (Updated)
```
CRITICAL_FUEL_GAPS[] — NEW: hand-verified long fuel-free stretches
EMERGENCY_CONTACTS[] — NEW: hospitals + rescue numbers per region
```

### `src/lib/prompts.js` (Updated)
Now receives and injects:
- Real route segments
- Elevation per day
- Weather at destination
- Nearby infrastructure summary
- Fuel gap warnings from static data
- Emergency contacts for that route

---

## What We Cannot Do (Honest Assessment)

| Request | Why Not Possible | What We Do Instead |
| :--- | :--- | :--- |
| NHMP live API | Government system, no public API | web_search for latest advisories |
| PSO/Shell fuel API | Corporate closed system, no API | Curated static gaps + Overpass OSM |
| PMD weather API | No developer API | Open-Meteo (better anyway) |
| Rescue 1122 API | Internal operational system | Curated static + Overpass |
| Facebook/WhatsApp incidents | API restrictions by platform | web_search finds same info from news |
| GB Tourist Police API | No digital infrastructure for this | AI knowledge + web_search |
| Interior Ministry NOC API | Manual government process | AI knowledge of NOC rules |

> The honest truth: most of these Pakistan-specific government systems don't have public APIs anywhere in the world — this is normal for developing-country infrastructure. The combination of **OpenStreetMap data** (Overpass), **curated expert knowledge** (our static database), and **live AI web search** (stepfun) covers the same ground as those systems would, and in most cases more reliably.

---

## Current Status & Next Steps

**Waiting for**: OpenRouteService free API token (only new requirement)

**Everything else is keyless** (Nominatim, Open-Meteo Weather, Open-Meteo Elevation, Overpass API).

**When you provide the ORS key**, say "go ahead" and I'll implement in this sequence:
1. `src/constants.ts` — Add fuel gap + emergency contact knowledge base
2. `src/lib/routing.js` — All 5 data source calls
3. `src/lib/prompts.js` — Prompt upgraded to accept all real data
4. `src/lib/openrouter.js` — Full pipeline + parallel data fetch + AbortController
5. `src/components/TripForm.jsx` — Progressive loading steps
6. `src/components/ItineraryCard.jsx` — Real badges + Maps link + altitude badge
7. `src/components/ItineraryOutput.jsx` — Summary strip + copy button

---

*Status: Awaiting user approval and ORS API key. Do not implement until confirmed.*
