// Shared display helpers for antenna type, gain, beamwidth, and antenna modes.
const ANTENNA_TYPES = ["Internal", "Directional", "External"];

const BAND_GROUPS = [
  { keys: ["2.4", "2.4GHz"], gain: "2.4", beam: "2.4 GHz" },
  { keys: ["5", "5GHz", "5GHz_full"], gain: "5", beam: "5 GHz" },
  { keys: ["5-lower", "5_low"], gain: "5-lower", beam: "5 GHz lower" },
  { keys: ["5-upper", "5_high", "5GHz_high"], gain: "5-upper", beam: "5 GHz upper" },
  { keys: ["6", "6GHz"], gain: "6", beam: "6 GHz" }
];

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
