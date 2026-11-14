import { STORAGE_KEY, OLD_KEY, DEFAULT_DATA, normalize, migrateV2 } from "./data.js";

// Guarda en el navegador de este dispositivo (localStorage)
function safeGet(key) {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  } catch (e) {
    return null;
  }
}

export function loadData() {
  const raw = safeGet(STORAGE_KEY);
  if (raw) {
    try {
      return normalize(JSON.parse(raw));
    } catch (e) {
      // si está dañado, se intenta con la versión anterior
    }
  }
  const old = safeGet(OLD_KEY);
  if (old) {
    try {
      return migrateV2(JSON.parse(old));
    } catch (e) {
      // sigue con datos vacíos
    }
  }
  return normalize(DEFAULT_DATA);
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

// ---------- Ruta: configuración y direcciones ya buscadas ----------
const RUTA_KEY = "fresas_ruta_cfg_v1";
const GEO_KEY = "fresas_geo_cache_v1";

export function loadRutaCfg() {
  try {
    return { inicio: "", ciudad: "", ...(JSON.parse(localStorage.getItem(RUTA_KEY)) || {}) };
  } catch (e) {
    return { inicio: "", ciudad: "" };
  }
}
export function saveRutaCfg(cfg) {
  try {
    localStorage.setItem(RUTA_KEY, JSON.stringify(cfg));
  } catch (e) {
    // no pasa nada
  }
}

export function loadGeoCache() {
  try {
    return JSON.parse(localStorage.getItem(GEO_KEY)) || {};
  } catch (e) {
    return {};
  }
}
export function saveGeoCache(cache) {
  try {
    localStorage.setItem(GEO_KEY, JSON.stringify(cache));
  } catch (e) {
    // no pasa nada
  }
}
