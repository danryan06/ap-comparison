// Shared display helpers for antenna type, gain, beamwidth, and antenna modes.
const ANTENNA_TYPES = ["Internal", "Directional", "External"];

const BAND_GROUPS = [
  { keys: ["2.4", "2.4GHz"], gain: "2.4", beam: "2.4 GHz" },
  { keys: ["5", "5GHz", "5GHz_full"], gain: "5", beam: "5 GHz" },
  { keys: ["5-lower", "5_low"], gain: "5-lower", beam: "5 GHz lower" },
  { keys: ["5-upper", "5_high", "5GHz_high"], gain: "5-upper", beam: "5 GHz upper" },
  { keys: ["6", "6GHz"], gain: "6", beam: "6 GHz" }
];

// URL id for an AP: vendor and model, lowercased, non-alphanumerics collapsed to "-".
function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function apSlug(entry) {
  return slugify(`${(entry && entry.vendor) || ""} ${(entry && entry.model) || ""}`);
}

function normalizeForSlug(value) {
  if (!value) return "";
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, " ");
}

function safeUrl(value, options = {}) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const allowRelative = options.allowRelative === true;
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  if (!hasScheme) {
    if (!allowRelative || raw.startsWith("//") || raw.includes("\\")) return "";
    return raw;
  }
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch (err) {
    return "";
  }
}

/** sessionStorage key for Browse/Finder → Detail Back (filters stay on the list URL). */
const DETAIL_BACK_STORAGE_KEY = "apComparison.detailBack";

/** Allowed same-origin return targets for detail Back links (no open redirects). */
const SAFE_RETURN_PAGES = new Set([
  "index.html",
  "finder.html",
  "compare.html",
  "submit.html",
  "edit.html"
]);

/**
 * Validate a relative return path used across Browse/Finder → Detail → Back.
 * Accepts only known HTML pages with a safe query string; rejects schemes,
 * protocol-relative URLs, path traversal, and fragments.
 */
function safeReturnPath(value) {
  const raw = String(value || "").trim();
  if (!raw || raw.includes("\\") || raw.includes("//") || raw.includes("..")) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("/") || raw.includes("#")) return "";
  const match = raw.match(/^(index|finder|compare|submit|edit)\.html(\?[^#]*)?$/i);
  if (!match) return "";
  const page = `${match[1].toLowerCase()}.html`;
  if (!SAFE_RETURN_PAGES.has(page)) return "";
  const qs = match[2] || "";
  // Allow encoded and raw query characters used by Finder/Browse state.
  if (qs && !/^\?[a-zA-Z0-9._~&=%+\-|,/* ]*$/.test(qs)) return "";
  return page + qs;
}

/** Current list page as a validated relative return path (shareable filter URL). */
function currentListReturnPath() {
  if (typeof window === "undefined" || !window.location) return "";
  const file = String(window.location.pathname || "").split("/").pop() || "index.html";
  const page = /\.html$/i.test(file) ? file.toLowerCase() : "index.html";
  const qs = window.location.search || "";
  return safeReturnPath(page + qs);
}

/** Stash a validated list path so Detail Back can restore filters without a long URL. */
function saveDetailBackPath(path) {
  const safe = safeReturnPath(path);
  if (!safe) return;
  try {
    sessionStorage.setItem(DETAIL_BACK_STORAGE_KEY, safe);
  } catch (_) {
    /* private mode / quota — Back falls back to defaults */
  }
}

/** Read the stashed Detail Back path, or "" if missing/invalid. */
function readDetailBackPath() {
  try {
    return safeReturnPath(sessionStorage.getItem(DETAIL_BACK_STORAGE_KEY) || "");
  } catch (_) {
    return "";
  }
}

/** Short detail href: ap.html?id=… only (filters live on the list URL / session back). */
function buildApDetailHref(slug) {
  const params = new URLSearchParams();
  params.set("id", String(slug || ""));
  return `ap.html?${params.toString()}`;
}

/** Save list return path, then return a short detail href. */
function rememberListAndBuildDetailHref(slug, returnPath) {
  saveDetailBackPath(returnPath || currentListReturnPath());
  return buildApDetailHref(slug);
}

function antennaTypes(value) {
  const items = Array.isArray(value) ? value : (value == null || value === "" ? [] : [value]);
  const found = [];
  items.forEach(item => {
    if (item == null) return;
    const text = String(item).trim();
    if (!text) return;
    const exact = ANTENNA_TYPES.find(type => type.toLowerCase() === text.toLowerCase());
    if (exact) {
      found.push(exact);
      return;
    }
    const lower = text.toLowerCase();
    if (lower.includes("omnidirectional") || lower.includes("omni-directional")) {
      found.push("Internal");
    } else if (lower.includes("directional")) {
      found.push("Directional");
    } else if (lower.includes("external") || lower.includes("connector")) {
      found.push("External");
    } else if (lower.includes("internal") || lower.includes("omni")) {
      found.push("Internal");
    }
  });
  return [...new Set(found)];
}

function formatAntennaType(value) {
  const types = antennaTypes(value);
  if (types.length) return types.join(" / ");
  if (Array.isArray(value)) return value.map(item => String(item)).join(" / ");
  return value == null ? "" : String(value);
}

function antennaMatches(value, selected) {
  if (!selected) return true;
  const wanted = String(selected).toLowerCase();
  return antennaTypes(value).some(type => type.toLowerCase() === wanted);
}

function antennaMatchesAny(value, selectedSet) {
  if (!selectedSet || selectedSet.size === 0) return true;
  return antennaTypes(value).some(type => selectedSet.has(type));
}

function flatBandParts(obj, kind) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
  if (Object.values(obj).some(item => item && typeof item === "object")) return null;
  const parts = [];
  const used = new Set();
  BAND_GROUPS.forEach(group => {
    const key = group.keys.find(candidate => Object.prototype.hasOwnProperty.call(obj, candidate));
    if (!key) return;
    used.add(key);
    const suffix = kind === "gain" ? " dBi" : "";
    parts.push({
      label: kind === "gain" ? group.gain : group.beam,
      text: `${kind === "gain" ? group.gain : group.beam}: ${obj[key]}${suffix}`
    });
  });
  Object.keys(obj).forEach(key => {
    if (used.has(key) || BAND_GROUPS.some(group => group.keys.includes(key))) return;
    const suffix = kind === "gain" ? " dBi" : "";
    parts.push({ label: key, text: `${key}: ${obj[key]}${suffix}` });
  });
  return parts;
}

function beamModeLabel(name) {
  const known = {
    wide: "Wide",
    narrow_boresight: "Narrow boresight",
    front_and_back: "Front and back"
  };
  if (Object.prototype.hasOwnProperty.call(known, name)) return known[name];
  return String(name).replace(/[_]+/g, " ").replace(/\b[a-z]/g, character => character.toUpperCase());
}

function formatBandObject(obj, kind) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return "";
  const flat = flatBandParts(obj, kind);
  if (flat) return flat.map(part => part.text).join(", ");
  if (Object.values(obj).some(item => item && typeof item === "object")) {
    return Object.entries(obj).map(([name, bands]) => {
      const inner = formatBandObject(bands, kind);
      const label = kind === "beam" ? beamModeLabel(name) : name;
      return inner ? `${label}: ${inner}` : "";
    }).filter(Boolean).join("; ");
  }
  return "";
}

function beamwidthModeRows(beamwidth) {
  if (!beamwidth || typeof beamwidth !== "object" || Array.isArray(beamwidth)) return [];
  const values = Object.values(beamwidth);
  if (!values.length || !values.every(item => item && typeof item === "object" && !Array.isArray(item))) return [];
  return Object.entries(beamwidth).map(([name, bands]) => ({
    label: beamModeLabel(name),
    value: formatBandObject(bands, "beam")
  })).filter(row => row.value);
}

function formatModeRows(modes) {
  if (!Array.isArray(modes)) return [];
  const rows = [];
  modes.forEach(mode => {
    if (!mode || typeof mode !== "object") return;
    const name = mode.mode || "Mode";
    if (mode.antenna_gain_dbi) {
      rows.push({
        label: `${name} gain`,
        value: formatBandObject(mode.antenna_gain_dbi, "gain")
      });
    }
    if (mode.beamwidth) {
      rows.push({
        label: `${name} beamwidth`,
        value: formatBandObject(mode.beamwidth, "beam")
      });
    }
  });
  return rows.filter(row => row.value);
}

/**
 * Link to the AntennaComparison Finder with this AP pre-selected.
 * The ap_id must match the antenna-compatibility export
 * (makeApId in .github/scripts/lib/ap-rf-common.js): "<vendor>:<model>",
 * each lowercased, spaces to "-", other punctuation dropped.
 * test-antenna-finder-link.js keeps the two in step.
 */
const ANTENNA_FINDER_URL = "https://antennacomparison.com/finder.html";

function antennaCompatIdPart(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function antennaCompatApId(vendor, model) {
  return `${antennaCompatIdPart(vendor)}:${antennaCompatIdPart(model)}`;
}

/** Finder URL for APs that take external antennas; "" for internal-only APs. */
function antennaFinderHref(entry) {
  if (!entry || !antennaTypes(entry.antenna_type).includes("External")) return "";
  const params = new URLSearchParams();
  params.set("ap", antennaCompatApId(entry.vendor, entry.model));
  return `${ANTENNA_FINDER_URL}?${params.toString()}`;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    slugify,
    apSlug,
    normalizeForSlug,
    safeUrl,
    DETAIL_BACK_STORAGE_KEY,
    SAFE_RETURN_PAGES,
    safeReturnPath,
    currentListReturnPath,
    saveDetailBackPath,
    readDetailBackPath,
    buildApDetailHref,
    rememberListAndBuildDetailHref,
    antennaTypes,
    formatAntennaType,
    antennaMatches,
    antennaMatchesAny,
    formatBandObject,
    beamwidthModeRows,
    formatModeRows,
    ANTENNA_FINDER_URL,
    antennaCompatApId,
    antennaFinderHref
  };
}
