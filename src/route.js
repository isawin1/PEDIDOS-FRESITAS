// Lógica de la ruta de entregas (sin interfaz): direcciones -> coordenadas -> orden -> link de Google Maps

export const CIUDAD_DEFAULT = "Palmira, Valle del Cauca";

const ABREV = [
  [/\b(cra|cr|kra|kr|carr)\b\.?/gi, "Carrera"],
  [/\b(cll|cl|cale)\b\.?/gi, "Calle"],
  [/\b(diag|dg)\b\.?/gi, "Diagonal"],
  [/\b(trans|transv|tv|tr)\b\.?/gi, "Transversal"],
  [/\b(av|avda)\b\.?/gi, "Avenida"],
];

// "Cra 10 # 20-30" -> "Carrera 10 20-30"
export function normalizarDireccion(dir) {
  let s = String(dir || "").trim();
  for (const [re, rep] of ABREV) s = s.replace(re, rep);
  s = s.replace(/\bn[o°º]\.?\s*(?=\d)/gi, " ").replace(/[#°º]/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

// Solo "Carrera 10" (sin el número de casa), para cuando la dirección exacta no aparece
export function soloCalle(dirNormalizada) {
  const m = dirNormalizada.match(
    /^(Carrera|Calle|Diagonal|Transversal|Avenida)\s+\d+[a-zA-Z]?(?![a-zA-Z])(\s+(bis|sur|norte|este|oeste)(?![a-zA-Z]))?/i
  );
  return m ? m[0].trim() : null;
}

// Búsquedas que se intentan, de la más precisa a la más general
export function variantesBusqueda(dir, ciudad) {
  const c = ciudad || CIUDAD_DEFAULT;
  const norm = normalizarDireccion(dir);
  const calle = soloCalle(norm);
  const lista = [`${norm}, ${c}`];
  if (calle && calle !== norm) lista.push(`${calle}, ${c}`);
  const crudo = String(dir || "").trim();
  if (crudo && crudo !== norm) lista.push(`${crudo}, ${c}`);
  return [...new Set(lista)];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Busca una dirección en OpenStreetMap (Nominatim). Máximo 1 consulta por segundo.
export async function geocodificar(dir, ciudad, fetchFn = fetch) {
  for (const q of variantesBusqueda(dir, ciudad)) {
    const url =
      "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=co&accept-language=es&q=" +
      encodeURIComponent(q);
    try {
      const res = await fetchFn(url);
      if (res.ok) {
        const arr = await res.json();
        if (Array.isArray(arr) && arr.length) {
          return { lat: Number(arr[0].lat), lon: Number(arr[0].lon), q };
        }
      }
    } catch (e) {
      // sin internet o bloqueado: se intenta la siguiente variante
    }
    await sleep(1100);
  }
  return null;
}

// ---------- Distancias y orden ----------
const rad = (g) => (g * Math.PI) / 180;

export function distanciaKm(a, b) {
  const R = 6371;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Siempre va a la parada pendiente más cercana a donde está
export function ordenarPorCercania(inicio, paradas) {
  const pendientes = [...paradas];
  const orden = [];
  let actual = inicio;
  while (pendientes.length) {
    let mejor = 0;
    let mejorD = Infinity;
    pendientes.forEach((p, i) => {
      const d = distanciaKm(actual, p);
      if (d < mejorD) {
        mejorD = d;
        mejor = i;
      }
    });
    const [sig] = pendientes.splice(mejor, 1);
    orden.push(sig);
    actual = sig;
  }
  return orden;
}

export function kmTotal(inicio, orden) {
  let total = 0;
  let prev = inicio;
  for (const p of orden) {
    total += distanciaKm(prev, p);
    prev = p;
  }
  return total;
}

// ---------- Links de Google Maps ----------
const pt = (p) => (p.lat != null ? `${p.lat},${p.lon}` : p.texto);

// Google Maps acepta 1 destino + 9 paradas intermedias; si hay más, se parte en tramos.
export function linksGoogleMaps(inicio, orden, modo = "two-wheeler", maxPorTramo = 10) {
  const tramos = [];
  let origen = inicio ? pt(inicio) : null;
  for (let i = 0; i < orden.length; i += maxPorTramo) {
    const grupo = orden.slice(i, i + maxPorTramo);
    const destino = grupo[grupo.length - 1];
    const intermedias = grupo.slice(0, -1);
    const params = new URLSearchParams({ api: "1", travelmode: modo, destination: pt(destino) });
    if (origen) params.set("origin", origen);
    if (intermedias.length) params.set("waypoints", intermedias.map(pt).join("|"));
    tramos.push({
      desde: i + 1,
      hasta: i + grupo.length,
      url: "https://www.google.com/maps/dir/?" + params.toString(),
    });
    origen = pt(destino);
  }
  return tramos;
}

export const linkBuscarEnMaps = (dir, ciudad) =>
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(`${normalizarDireccion(dir)}, ${ciudad || CIUDAD_DEFAULT}`);
