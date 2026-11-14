// Datos, constantes y funciones de cálculo (sin nada de interfaz)

export const STORAGE_KEY = "fresas_app_data_v3";
export const OLD_KEY = "fresas_app_data_v2";

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Fecha local (no UTC) para que de noche no marque el día siguiente
export const today = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

export const fmt = (n) =>
  "$" + Math.round(Number(n) || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 });

export const TAMANOS = [
  { key: "pequena", label: "Pequeña", singular: "pequeña", plural: "pequeñas" },
  { key: "mediana", label: "Mediana", singular: "mediana", plural: "medianas" },
  { key: "grande", label: "Grande", singular: "grande", plural: "grandes" },
];

// group = grupo de exclusión: dentro de un mismo grupo solo puede haber una opción
export const OPCIONES = [
  { key: "conTodo", label: "Con todo", group: "todo" },
  { key: "conQueso", label: "Con queso", group: "queso" },
  { key: "sinQueso", label: "Sin queso", group: "queso" },
  { key: "conOreo", label: "Con oreo", group: "oreo" },
  { key: "poquitoOreo", label: "Poquito oreo", group: "oreo" },
  { key: "sinOreo", label: "Sin oreo", group: "oreo" },
  { key: "sinGalleta", label: "Sin galleta", group: "galleta" },
  { key: "masCrema", label: "Más crema que fresas", group: "prop" },
  { key: "masFresa", label: "Más fresa que crema", group: "prop" },
  { key: "pocoDulce", label: "Poco dulce", group: "dulce" },
  { key: "pops", label: "Con pops", group: "pops" },
];

// "Con todo" choca con las opciones de queso, oreo y galleta
const CONFLICTOS = {
  todo: ["queso", "oreo", "galleta"],
  queso: ["todo"],
  oreo: ["todo"],
  galleta: ["todo"],
};

const grupoDe = (key) => OPCIONES.find((o) => o.key === key)?.group;

export function toggleOpcion(actuales, key) {
  if (actuales.includes(key)) return actuales.filter((k) => k !== key);
  const op = OPCIONES.find((o) => o.key === key);
  if (!op) return actuales;
  const quitar = [op.group, ...(CONFLICTOS[op.group] || [])];
  const base = actuales.filter((k) => !quitar.includes(grupoDe(k)));
  return [...base, key];
}

// Texto de las opciones en orden fijo: "sin queso, poco dulce"
export function firma(opciones) {
  return OPCIONES.filter((o) => opciones.includes(o.key))
    .map((o) => o.label.toLowerCase())
    .join(", ");
}

export const INSUMOS_BASE = [
  { key: "fresas", label: "Fresas", unidad: "por libra" },
  { key: "queso", label: "Queso", unidad: "por libra" },
  { key: "cremaLeche", label: "Crema de leche", unidad: "por bolsita" },
  { key: "pops", label: "Pops de fresa", unidad: "por tarro" },
  { key: "empaque", label: "Empaque mediano", unidad: "por docena" },
  { key: "tapitas", label: "Tapitas del envase", unidad: "" },
  { key: "cucharitas", label: "Cucharitas", unidad: "" },
  { key: "oreo", label: "Galletas Oreo", unidad: "bolsita" },
  { key: "capri", label: "Galletas Capri", unidad: "paquete" },
  { key: "estabilizante", label: "Estabilizante", unidad: "bolsita" },
  { key: "lecheCondensada", label: "Leche condensada", unidad: "" },
  { key: "arequipe", label: "Arequipe", unidad: "" },
];

export const DEFAULT_PRICES = { pequena: 9000, mediana: 14000, grande: 19000, pops: 4000 };

export const DEFAULT_DATA = {
  prices: DEFAULT_PRICES,
  orders: [],
  compras: [],
  sobrantes: [],
  notas: [],
};

// ---------- Cálculos de pedidos ----------

export function precioUnitario(item, prices, original) {
  const pops = item.opciones.includes("pops");
  // Si el item ya existía y no cambió tamaño ni pops, se respeta el precio con el que se guardó
  if (
    original &&
    original.precio != null &&
    original.size === item.size &&
    original.opciones.includes("pops") === pops
  ) {
    return original.precio;
  }
  return (Number(prices[item.size]) || 0) + (pops ? Number(prices.pops) || 0 : 0);
}

const precioGuardado = (item, prices) =>
  item.precio != null ? item.precio : precioUnitario(item, prices, null);

export const totalPedido = (o, prices) =>
  o.items.reduce((s, i) => s + precioGuardado(i, prices) * (Number(i.qty) || 0), 0);

export const unidadesPedido = (o) =>
  o.items.reduce((s, i) => s + (Number(i.qty) || 0), 0);

export const debePedido = (o, prices) => (o.pagado ? 0 : totalPedido(o, prices));

// Resumen de lo que hay que preparar: por tamaño y, dentro de cada tamaño, por combinación de opciones
export function resumenPreparacion(orders) {
  const res = {};
  for (const o of orders) {
    for (const it of o.items) {
      const q = Number(it.qty) || 0;
      if (!res[it.size]) res[it.size] = { total: 0, firmas: {} };
      res[it.size].total += q;
      const f = firma(it.opciones) || "normal";
      res[it.size].firmas[f] = (res[it.size].firmas[f] || 0) + q;
    }
  }
  return TAMANOS.filter((t) => res[t.key]).map((t) => ({
    size: t,
    total: res[t.key].total,
    firmas: Object.entries(res[t.key].firmas).sort((a, b) => b[1] - a[1]),
  }));
}

export function textoPreparacion(resumen, titulo) {
  const total = resumen.reduce((s, r) => s + r.total, 0);
  const lineas = [`Por hacer${titulo ? ` — ${titulo}` : ""} (${total}):`];
  for (const r of resumen) {
    lineas.push(`${r.total} ${r.total === 1 ? r.size.singular : r.size.plural}`);
    for (const [f, n] of r.firmas) lineas.push(`   - ${n} ${f}`);
  }
  return lineas.join("\n");
}

// ---------- Normalizar / migrar datos guardados ----------

export function normalize(raw) {
  const r = raw || {};
  return {
    prices: { ...DEFAULT_PRICES, ...(r.prices || {}) },
    orders: (r.orders || []).map((o) => ({
      id: o.id || uid(),
      cliente: o.cliente || "",
      telefono: o.telefono || "",
      direccion: o.direccion || "",
      fecha: o.fecha || today(),
      fechaEntrega: o.fechaEntrega || "", // día para el que es el pedido ("" = sin fecha)
      nota: o.nota || "",
      pagado: !!o.pagado,
      entregado: !!o.entregado,
      items: (o.items || []).map((i) => ({
        id: i.id || uid(),
        size: i.size || "mediana",
        qty: Number(i.qty) || 1,
        opciones: Array.isArray(i.opciones) ? i.opciones : [],
        nota: i.nota || "",
        precio: i.precio != null ? i.precio : undefined,
      })),
    })),
    compras: r.compras || [],
    sobrantes: r.sobrantes || [],
    notas: r.notas || [],
  };
}

// Convierte los datos de la versión anterior (solo mediano, "sin/con pops")
export function migrateV2(old) {
  const p = old.prices || {};
  const sin = Number(p.sinPops) || DEFAULT_PRICES.mediana;
  const con = Number(p.conPops) || sin + DEFAULT_PRICES.pops;
  return normalize({
    prices: { mediana: sin, pops: Math.max(con - sin, 0) },
    orders: (old.orders || []).map((o) => {
      const conPops = o.tipo === "con";
      return {
        id: o.id,
        cliente: o.cliente,
        telefono: o.telefono,
        direccion: o.direccion,
        fecha: o.fecha,
        nota: "",
        pagado: false,
        entregado: o.estado === "entregado",
        items: [
          {
            id: uid(),
            size: "mediana",
            qty: o.cantidad || 1,
            opciones: conPops ? ["pops"] : [],
            nota: "",
            precio: conPops ? con : sin,
          },
        ],
      };
    }),
    compras: old.compras,
    sobrantes: old.sobrantes,
  });
}

// ---------- Respaldo ----------

export function crearRespaldo(data) {
  return JSON.stringify(
    { app: "fresas-con-crema", version: 3, fecha: new Date().toISOString(), data },
    null,
    2
  );
}

export function resumenRespaldo(d) {
  return {
    pedidos: d.orders.length,
    compras: d.compras.length,
    notas: d.notas.length,
  };
}

// Acepta el respaldo nuevo, el texto "pelado" de datos, o el de la versión anterior (solo mediano)
export function leerRespaldo(texto) {
  let obj;
  try {
    obj = JSON.parse(String(texto || "").trim());
  } catch (e) {
    throw new Error("No se pudo leer el texto. Revisa que lo hayas copiado completo.");
  }
  const d = obj && obj.app === "fresas-con-crema" && obj.data ? obj.data : obj;
  if (!d || typeof d !== "object" || Array.isArray(d)) {
    throw new Error("Ese texto no parece un respaldo de la app.");
  }
  const tieneAlgo = ["orders", "compras", "prices", "notas", "sobrantes"].some((k) => k in d);
  if (!tieneAlgo) throw new Error("Ese texto no parece un respaldo de la app.");
  const esViejo =
    Array.isArray(d.orders) && d.orders.some((o) => !o.items && (o.cantidad != null || o.tipo));
  return esViejo ? migrateV2(d) : normalize(d);
}

// ---------- Días de entrega ----------
export const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function parseFecha(s) {
  if (!s) return null;
  const [y, m, d] = String(s).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

const aTexto = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function sumarDias(s, n) {
  const d = parseFecha(s);
  d.setDate(d.getDate() + n);
  return aTexto(d);
}

// Próxima fecha (hoy incluido) que cae en ese día de la semana (0 = domingo … 6 = sábado)
export function proximoDiaSemana(dia, desde = today()) {
  const d = parseFecha(desde);
  while (d.getDay() !== dia) d.setDate(d.getDate() + 1);
  return aTexto(d);
}

// "Sábado 15", "Hoy · Sábado 14", "Mañana · Domingo 15", o "Sin fecha"
export function etiquetaDia(s, corta = false, hoy = today()) {
  const d = parseFecha(s);
  if (!d) return "Sin fecha";
  const nombre = corta ? DIAS_SEMANA[d.getDay()].slice(0, 3) : DIAS_SEMANA[d.getDay()];
  let pre = "";
  if (s === hoy) pre = "Hoy · ";
  else if (s === sumarDias(hoy, 1)) pre = "Mañana · ";
  return `${pre}${nombre} ${d.getDate()}`;
}

export const esAtrasado = (s, hoy = today()) => !!s && s < hoy;

// Agrupa pedidos por día de entrega, de la fecha más cercana a la más lejana; "Sin fecha" al final
export function agruparPorDia(orders) {
  const mapa = new Map();
  for (const o of orders) {
    const k = o.fechaEntrega || "";
    if (!mapa.has(k)) mapa.set(k, []);
    mapa.get(k).push(o);
  }
  return [...mapa.entries()]
    .sort((a, b) => (a[0] === "" ? 1 : b[0] === "" ? -1 : a[0] < b[0] ? -1 : 1))
    .map(([key, lista]) => ({ key, orders: lista }));
}

// Qué día mostrar primero: hoy si hay pedidos para hoy; si no, el próximo día con pedidos; si no, todo
export function diaInicial(orders, hoy = today()) {
  const pend = orders.filter((o) => !o.entregado);
  const keys = [...new Set(pend.map((o) => o.fechaEntrega).filter(Boolean))].sort();
  if (keys.includes(hoy)) return hoy;
  const futuro = keys.find((k) => k > hoy);
  return futuro || "todo";
}

// Filtra por la opción elegida: "todo" | "sin" | una fecha
export function filtrarPorDia(orders, sel) {
  if (sel === "todo") return orders;
  if (sel === "sin") return orders.filter((o) => !o.fechaEntrega);
  return orders.filter((o) => o.fechaEntrega === sel);
}
