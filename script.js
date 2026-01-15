const timeNowEl = document.getElementById("timeNow");
const phaseEl = document.getElementById("phase");
const nextChangeEl = document.getElementById("nextChange");
const sourceEl = document.getElementById("source");

/* ===============================
   SOURCES (priority order)
================================ */

const SOURCES = [
  {
    name: "WarframeStat API",
    url: "https://api.warframestat.us/pc/cetusCycle",
    parser: data => ({
      isDay: data.isDay,
      expiry: new Date(data.expiry)
    })
  },
  {
    name: "GitHub RAW",
    url: "https://raw.githubusercontent.com/WFCD/warframe-worldstate-parser/master/data/pc.json",
    parser: data => {
      const cetus = data.SyndicateMissions.find(
        m => m.Tag === "CetusSyndicate"
      );

      return {
        isDay: cetus.Nodes.includes("Day"),
        expiry: new Date(cetus.Expiry.$date)
      };
    }
  }
];

/* ===============================
   LOCAL FALLBACK (never fails)
================================ */

const CYCLE_MS = 8 * 60 * 1000;
const DAY_MS = 4 * 60 * 1000;
const REFERENCE = new Date("2024-01-01T00:00:00Z").getTime();

function localCycle() {
  const now = Date.now();
  const elapsed = (now - REFERENCE) % CYCLE_MS;

  const isDay = elapsed < DAY_MS;
  const remaining = (isDay ? DAY_MS : CYCLE_MS) - elapsed;

  return {
    isDay,
    expiry: new Date(now + remaining),
    source: "Local Calculation"
  };
}

/* ===============================
   FETCH WITH FALLBACK
================================ */

async function fetchCycleData() {
  for (const source of SOURCES) {
    try {
      const res = await fetch(source.url, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP error");

      const text = await res.text();
      if (!text) throw new Error("Empty response");

      const data = JSON.parse(text);
      const parsed = source.parser(data);

      return { ...parsed, source: source.name };
    } catch (err) {
      console.warn(`Source failed: ${source.name}`, err);
    }
  }

  return localCycle();
}

/* ===============================
   UI UPDATE
================================ */

async function updateUI() {
  const now = new Date();
  timeNowEl.textContent =
    "Current Time: " + now.toLocaleTimeString("en-US");

  const cycle = await fetchCycleData();
  const diff = cycle.expiry - now;

  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  phaseEl.textContent =
    "Current Phase: " + (cycle.isDay ? "Day" : "Night");

  nextChangeEl.textContent =
    `Next Change In: ${mins}m ${secs}s`;

  sourceEl.textContent =
    "Source: " + cycle.source;
}

updateUI();
setInterval(updateUI, 1000);
