import React, { useState, useEffect, useMemo } from "react";
import {
  Home,
  Package,
  ClipboardList,
  ShoppingBag,
  StickyNote,
  Tag,
  Plus,
  Minus,
  X,
  Trash2,
  Pencil,
  MapPin,
  Phone,
  Copy,
  CheckCircle2,
  CheckSquare,
  Square,
  TrendingUp,
  AlertTriangle,
  Route as RouteIcon,
  Navigation,
  LocateFixed,
  Download,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  TAMANOS,
  OPCIONES,
  INSUMOS_BASE,
  uid,
  today,
  fmt,
  toggleOpcion,
  firma,
  precioUnitario,
  totalPedido,
  unidadesPedido,
  debePedido,
  resumenPreparacion,
  textoPreparacion,
  etiquetaDia,
  esAtrasado,
  agruparPorDia,
  diaInicial,
  filtrarPorDia,
  proximoDiaSemana,
  sumarDias,
  crearRespaldo,
  leerRespaldo,
  resumenRespaldo,
} from "./data.js";
import { loadData, saveData, loadRutaCfg, saveRutaCfg, loadGeoCache, saveGeoCache } from "./storage.js";
import {
  CIUDAD_DEFAULT,
  geocodificar,
  ordenarPorCercania,
  kmTotal,
  linksGoogleMaps,
  linkBuscarEnMaps,
  normalizarDireccion,
} from "./route.js";

// ---------- Colores ----------
const C = {
  bg: "#FFF5F8",
  text: "#4A2540",
  muted: "#B5527A",
  soft: "#8A5169",
  border: "#FFE1EC",
  pink: "#FF6FA5",
  pinkLight: "#FF9AC1",
  deep: "#C2185B",
  pinkBg: "#FFF0F5",
  amber: "#F5A623",
  amberBg: "#FFF4DC",
  amberText: "#9A6200",
  green: "#3EA06B",
  greenBg: "#E4F6EC",
};
const GRADIENT = `linear-gradient(135deg, ${C.pinkLight}, ${C.pink})`;

const sizeLabel = (key) => TAMANOS.find((t) => t.key === key)?.label || key;

// ---------- App ----------
export default function App() {
  const [data, setData] = useState(() => loadData());
  const [tab, setTab] = useState("pedidos");
  const [form, setForm] = useState(null); // { order: pedido | null }

  useEffect(() => {
    saveData(data);
  }, [data]);

  const saveOrder = (order) => {
    setData((d) => {
      const existe = d.orders.some((o) => o.id === order.id);
      return {
        ...d,
        orders: existe
          ? d.orders.map((o) => (o.id === order.id ? order : o))
          : [order, ...d.orders],
      };
    });
    setForm(null);
  };

  const toggleCampo = (id, campo) =>
    setData((d) => ({
      ...d,
      orders: d.orders.map((o) => (o.id === id ? { ...o, [campo]: !o[campo] } : o)),
    }));

  const deleteOrder = (id) => {
    if (window.confirm("¿Eliminar este pedido?")) {
      setData((d) => ({ ...d, orders: d.orders.filter((o) => o.id !== id) }));
    }
  };

  const patch = (cambios) => setData((d) => ({ ...d, ...cambios }));

  return (
    <Shell>
      <Header />
      <div style={{ padding: "16px", paddingBottom: "96px" }}>
        {tab === "resumen" && <Resumen data={data} />}
        {tab === "pedidos" && (
          <Pedidos
            orders={data.orders}
            prices={data.prices}
            onNew={() => setForm({ order: null })}
            onEdit={(o) => setForm({ order: o })}
            onToggle={toggleCampo}
            onDelete={deleteOrder}
          />
        )}
        {tab === "porhacer" && <PorHacer orders={data.orders} />}
        {tab === "ruta" && (
          <Ruta orders={data.orders} prices={data.prices} onToggle={toggleCampo} />
        )}
        {tab === "compras" && (
          <Compras
            compras={data.compras}
            sobrantes={data.sobrantes}
            onChangeCompras={(compras) => patch({ compras })}
            onChangeSobrantes={(sobrantes) => patch({ sobrantes })}
          />
        )}
        {tab === "notas" && (
          <Notas notas={data.notas} onChange={(notas) => patch({ notas })} />
        )}
        {tab === "precios" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Precios prices={data.prices} onSave={(prices) => patch({ prices })} />
            <Respaldo data={data} onRestore={(d) => setData(d)} />
          </div>
        )}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
      {form && (
        <OrderForm
          key={form.order ? form.order.id : "nuevo"}
          order={form.order}
          prices={data.prices}
          onCancel={() => setForm(null)}
          onSave={saveOrder}
        />
      )}
    </Shell>
  );
}

// ---------- Estructura base ----------
function Shell({ children }) {
  return (
    <div
      style={{
        fontFamily: "'Nunito', 'Poppins', sans-serif",
        background: C.bg,
        minHeight: "100vh",
        maxWidth: "420px",
        margin: "0 auto",
        position: "relative",
        color: C.text,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Nunito:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { background: ${C.bg}; }
        .heading { font-family: 'Poppins', sans-serif; }
        button { font-family: inherit; cursor: pointer; }
        input, select, textarea { font-family: inherit; }
        ::placeholder { color: #D8A5BE; }
      `}</style>
      {children}
    </div>
  );
}

function Header() {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FF9AC1 0%, #FF6FA5 100%)",
        padding: "26px 20px 20px",
        borderBottomLeftRadius: "28px",
        borderBottomRightRadius: "28px",
        boxShadow: "0 6px 18px rgba(255, 111, 165, 0.35)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "30px" }}>🍓</span>
        <div>
          <div className="heading" style={{ color: "#fff", fontSize: "20px", fontWeight: 800, lineHeight: 1.1 }}>
            Fresas con Crema
          </div>
          <div style={{ color: "#FFE1EC", fontSize: "13px", fontWeight: 600 }}>
            Panel del negocio
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "18px",
        padding: "16px",
        boxShadow: "0 2px 10px rgba(255, 111, 165, 0.12)",
        border: `1px solid ${C.border}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ fontSize: "12px", fontWeight: 700, color: C.soft, marginBottom: "5px" }}>{label}</div>
      {children}
    </div>
  );
}

// 16px evita que el iPhone haga zoom al tocar un campo
const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: "10px",
  border: `1px solid ${C.border}`,
  fontSize: "16px",
  color: C.text,
  outline: "none",
  background: "#FFFBFC",
};

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? `2px solid ${C.pink}` : `1px solid ${C.border}`,
        background: active ? C.pinkBg : "#fff",
        color: active ? C.deep : C.text,
        borderRadius: "999px",
        padding: active ? "5px 11px" : "6px 12px",
        fontSize: "12.5px",
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

function BigButton({ onClick, children, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        border: "none",
        borderRadius: "14px",
        padding: "14px",
        fontWeight: 800,
        fontSize: "15px",
        color: "#fff",
        background: disabled ? "#F5C2D6" : GRADIENT,
        boxShadow: disabled ? "none" : "0 4px 12px rgba(255,111,165,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (e) {
    try {
      const ta = document.createElement("textarea");
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e2) {
      return false;
    }
  }
}

// ---------- RESUMEN ----------
export function Resumen({ data }) {
  const { orders, prices, compras, sobrantes } = data;

  const stats = useMemo(() => {
    let cobrado = 0;
    let porCobrar = 0;
    let unidades = 0;
    const porTamano = {};
    for (const o of orders) {
      const total = totalPedido(o, prices);
      if (o.pagado) cobrado += total;
      else porCobrar += total;
      unidades += unidadesPedido(o);
      for (const i of o.items) {
        porTamano[i.size] = (porTamano[i.size] || 0) + (Number(i.qty) || 0);
      }
    }
    return { cobrado, porCobrar, unidades, porTamano };
  }, [orders, prices]);

  const invertido = compras.reduce((s, c) => s + (Number(c.total) || 0), 0);
  const ganancia = stats.cobrado - invertido;
  const sobrantesTotal = sobrantes.reduce((s, x) => s + (Number(x.cantidad) || 0), 0);
  const porEntregar = orders.filter((o) => !o.entregado).length;
  const entregados = orders.length - porEntregar;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <StatCard icon={<TrendingUp size={18} color="#fff" />} label="Cobrado" value={fmt(stats.cobrado)} bg="linear-gradient(135deg, #FF9AC1, #FF6FA5)" />
        <StatCard icon={<Tag size={18} color="#fff" />} label="Ganancia (cobrado − invertido)" value={fmt(ganancia)} bg="linear-gradient(135deg, #C2185B, #8E1550)" />
        <StatCard icon={<AlertTriangle size={18} color="#fff" />} label="Por cobrar" value={fmt(stats.porCobrar)} bg="linear-gradient(135deg, #FFC15E, #F5A623)" />
        <StatCard icon={<ShoppingBag size={18} color="#fff" />} label="Invertido en insumos" value={fmt(invertido)} bg="linear-gradient(135deg, #FFB4D2, #FF8FBB)" />
      </div>

      <Card>
        <div className="heading" style={{ fontWeight: 700, fontSize: "15px", marginBottom: "10px" }}>
          Ventas y entregas
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <MiniStat value={stats.unidades} label="Fresas vendidas" color={C.text} />
          <Divider />
          <MiniStat value={porEntregar} label="Pedidos por entregar" color={C.deep} />
          <Divider />
          <MiniStat value={entregados} label="Pedidos entregados" color={C.green} />
        </div>
      </Card>

      {Object.keys(stats.porTamano).length > 0 && (
        <Card>
          <div className="heading" style={{ fontWeight: 700, fontSize: "15px", marginBottom: "10px" }}>
            Vendidas por tamaño
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {TAMANOS.map((t, idx) => (
              <React.Fragment key={t.key}>
                {idx > 0 && <Divider />}
                <MiniStat value={stats.porTamano[t.key] || 0} label={t.label + "s"} color={C.text} />
              </React.Fragment>
            ))}
          </div>
        </Card>
      )}

      {sobrantesTotal > 0 && (
        <Card>
          <div style={{ fontSize: "13px", color: C.soft, fontWeight: 700 }}>
            Sobrantes registrados: <span style={{ color: C.deep }}>{sobrantesTotal}</span>
          </div>
        </Card>
      )}

      {orders.length === 0 && compras.length === 0 && (
        <Card>
          <div style={{ textAlign: "center", padding: "10px 0", color: C.muted, fontSize: "14px" }}>
            Aún no tienes datos registrados.
            <br />
            Empieza en "Pedidos" o "Compras" 🍓
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, bg }) {
  return (
    <div style={{ background: bg, borderRadius: "16px", padding: "14px", color: "#fff", boxShadow: "0 4px 12px rgba(255,111,165,0.25)" }}>
      <div style={{ marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "17px", fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: "12px", opacity: 0.92, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function MiniStat({ value, label, color }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: "20px", fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: "11px", color: C.muted }}>{label}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: "1px", background: C.border }} />;
}

// ---------- Chips de días (se usan en Pedidos, Por hacer y Ruta) ----------
// value: "todo" | "sin" | "YYYY-MM-DD"
export function DiaChips({ orders, value, onChange, minimo = 2 }) {
  const grupos = agruparPorDia(orders);
  if (grupos.length < minimo) return null;
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      <Chip active={value === "todo"} onClick={() => onChange("todo")}>
        Todos los días ({orders.length})
      </Chip>
      {grupos.map((g) => {
        const k = g.key === "" ? "sin" : g.key;
        const atrasado = esAtrasado(g.key);
        return (
          <Chip key={k} active={value === k} onClick={() => onChange(k)}>
            {g.key === "" ? "Sin fecha" : etiquetaDia(g.key, true)}
            {atrasado ? " ⚠️" : ""} ({g.orders.length})
          </Chip>
        );
      })}
    </div>
  );
}

// ---------- PEDIDOS ----------
export function Pedidos({ orders, prices, onNew, onEdit, onToggle, onDelete }) {
  const [filtro, setFiltro] = useState("todos");
  const [dia, setDia] = useState("todo");
  const [copiedId, setCopiedId] = useState(null);

  const counts = {
    todos: orders.length,
    entregar: orders.filter((o) => !o.entregado).length,
    cobrar: orders.filter((o) => !o.pagado).length,
    completos: orders.filter((o) => o.pagado && o.entregado).length,
  };

  const porEstado = orders.filter((o) => {
    if (filtro === "entregar") return !o.entregado;
    if (filtro === "cobrar") return !o.pagado;
    if (filtro === "completos") return o.pagado && o.entregado;
    return true;
  });
  // si el día elegido ya no tiene pedidos en esta lista, se muestran todos los días
  const diaValido =
    dia === "todo" || agruparPorDia(porEstado).some((g) => (g.key === "" ? "sin" : g.key) === dia);
  const lista = filtrarPorDia(porEstado, diaValido ? dia : "todo");

  const deudaTotal = orders.reduce((s, o) => s + debePedido(o, prices), 0);

  const copiarDireccion = async (o) => {
    const ok = await copiarTexto(o.direccion);
    if (ok) {
      setCopiedId(o.id);
      setTimeout(() => setCopiedId((c) => (c === o.id ? null : c)), 1600);
    }
  };

  const filtros = [
    { key: "todos", label: "Todos" },
    { key: "entregar", label: "Por entregar" },
    { key: "cobrar", label: "Por cobrar" },
    { key: "completos", label: "Completos" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <BigButton onClick={onNew}>
        <Plus size={18} /> Nuevo pedido
      </BigButton>

      {deudaTotal > 0 && (
        <div
          style={{
            background: C.amberBg,
            border: `1px solid ${C.amber}`,
            borderRadius: "14px",
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "13px",
            fontWeight: 700,
            color: C.amberText,
          }}
        >
          <span>Te deben en total</span>
          <span style={{ fontSize: "17px", fontWeight: 800 }}>{fmt(deudaTotal)}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {filtros.map((f) => (
          <Chip key={f.key} active={filtro === f.key} onClick={() => setFiltro(f.key)}>
            {f.label} ({counts[f.key]})
          </Chip>
        ))}
      </div>

      <DiaChips orders={porEstado} value={diaValido ? dia : "todo"} onChange={setDia} />

      {lista.length === 0 && (
        <Card>
          <div style={{ textAlign: "center", padding: "10px 0", color: C.muted, fontSize: "14px" }}>
            {orders.length === 0 ? "No hay pedidos todavía." : "No hay pedidos en esta lista."}
          </div>
        </Card>
      )}

      {lista.map((o) => {
        const total = totalPedido(o, prices);
        const debe = debePedido(o, prices);
        const completo = o.pagado && o.entregado;
        const borde = !o.pagado ? C.amber : !o.entregado ? C.pink : C.green;
        const fondo = !o.pagado ? "#FFFBF2" : !o.entregado ? "#fff" : "#F6FCF8";

        return (
          <div
            key={o.id}
            style={{
              background: fondo,
              borderRadius: "18px",
              padding: "14px 14px 12px",
              boxShadow: "0 2px 10px rgba(255, 111, 165, 0.12)",
              border: `1px solid ${C.border}`,
              borderLeft: `6px solid ${borde}`,
              opacity: completo ? 0.85 : 1,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
              <div style={{ minWidth: 0 }}>
                <div className="heading" style={{ fontWeight: 700, fontSize: "15px" }}>
                  {o.cliente || "Cliente sin nombre"}
                </div>
                <div style={{ fontSize: "12px", color: C.muted, marginTop: "2px" }}>
                  {unidadesPedido(o)} {unidadesPedido(o) === 1 ? "fresa" : "fresas"} · pedido {o.fecha}
                </div>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "6px",
                    borderRadius: "999px",
                    padding: "2px 10px",
                    fontSize: "12px",
                    fontWeight: 800,
                    background: !o.fechaEntrega ? "#F3EEF1" : esAtrasado(o.fechaEntrega) && !o.entregado ? "#FDE2E2" : C.pinkBg,
                    color: !o.fechaEntrega ? C.soft : esAtrasado(o.fechaEntrega) && !o.entregado ? "#B23B3B" : C.deep,
                  }}
                >
                  🗓 Entrega: {etiquetaDia(o.fechaEntrega)}
                  {esAtrasado(o.fechaEntrega) && !o.entregado ? " (atrasado)" : ""}
                </span>
              </div>
              <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                <button onClick={() => onEdit(o)} aria-label="Editar pedido" style={iconBtn}>
                  <Pencil size={16} />
                </button>
                <button onClick={() => onDelete(o.id)} aria-label="Eliminar pedido" style={iconBtn}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {o.items.map((i) => (
                <div key={i.id} style={{ fontSize: "13px", lineHeight: 1.35 }}>
                  <b>
                    {i.qty} × {sizeLabel(i.size)}
                  </b>
                  {firma(i.opciones) ? <span style={{ color: C.soft }}> — {firma(i.opciones)}</span> : null}
                  {i.nota ? <span style={{ color: C.muted, fontStyle: "italic" }}> ({i.nota})</span> : null}
                </div>
              ))}
            </div>

            {o.nota && (
              <div
                style={{
                  marginTop: "8px",
                  background: "#FFF9E6",
                  border: "1px dashed #F1D58A",
                  borderRadius: "10px",
                  padding: "7px 10px",
                  fontSize: "12.5px",
                  color: "#7A5B10",
                }}
              >
                📝 {o.nota}
              </div>
            )}

            {o.direccion && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", marginTop: "8px" }}>
                <div style={{ fontSize: "12.5px", color: C.soft, display: "flex", alignItems: "center", gap: "4px", minWidth: 0 }}>
                  <MapPin size={13} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.direccion}</span>
                </div>
                <button
                  onClick={() => copiarDireccion(o)}
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: copiedId === o.id ? C.greenBg : C.pinkBg,
                    color: copiedId === o.id ? C.green : C.deep,
                    border: "none",
                    borderRadius: "8px",
                    padding: "5px 8px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {copiedId === o.id ? (
                    <>
                      <CheckCircle2 size={12} /> Copiada
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copiar
                    </>
                  )}
                </button>
              </div>
            )}

            {o.telefono && (
              <a
                href={`tel:${o.telefono.replace(/\s/g, "")}`}
                style={{ marginTop: "5px", fontSize: "12.5px", color: C.soft, display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
              >
                <Phone size={13} /> {o.telefono}
              </a>
            )}

            <div
              style={{
                marginTop: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div style={{ fontSize: "13px", color: C.soft, fontWeight: 700 }}>
                Total <span style={{ color: C.text, fontSize: "15px", fontWeight: 800 }}>{fmt(total)}</span>
              </div>
              {debe > 0 ? (
                <span style={{ background: C.amberBg, color: C.amberText, border: `1px solid ${C.amber}`, borderRadius: "999px", padding: "3px 10px", fontSize: "12px", fontWeight: 800 }}>
                  Debe {fmt(debe)}
                </span>
              ) : (
                <span style={{ background: C.greenBg, color: C.green, borderRadius: "999px", padding: "3px 10px", fontSize: "12px", fontWeight: 800 }}>
                  Pagado ✓
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <CheckButton
                checked={o.pagado}
                onClick={() => onToggle(o.id, "pagado")}
                labelOff="Pagado"
                labelOn="Pagado"
                tone="amber"
              />
              <CheckButton
                checked={o.entregado}
                onClick={() => onToggle(o.id, "entregado")}
                labelOff="Entregado"
                labelOn="Entregado"
                tone="pink"
              />
            </div>
          </div>
        );
      })}

      <div style={{ position: "sticky", bottom: "84px", alignSelf: "flex-end", marginTop: "4px" }}>
        <button
          onClick={onNew}
          aria-label="Nuevo pedido"
          style={{
            width: "54px",
            height: "54px",
            borderRadius: "50%",
            border: "none",
            background: GRADIENT,
            color: "#fff",
            boxShadow: "0 6px 16px rgba(255,111,165,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={26} />
        </button>
      </div>
    </div>
  );
}

const iconBtn = { background: "none", border: "none", padding: "6px", color: "#D89AB0" };

function CheckButton({ checked, onClick, labelOn, labelOff, tone }) {
  const pendingBg = tone === "amber" ? C.amberBg : C.pinkBg;
  const pendingColor = tone === "amber" ? C.amberText : C.deep;
  const pendingBorder = tone === "amber" ? C.amber : C.pinkLight;
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        borderRadius: "12px",
        padding: "10px",
        fontWeight: 800,
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        border: checked ? "1px solid transparent" : `1.5px solid ${pendingBorder}`,
        background: checked ? C.greenBg : pendingBg,
        color: checked ? C.green : pendingColor,
      }}
    >
      {checked ? <CheckSquare size={18} /> : <Square size={18} />}
      {checked ? labelOn : labelOff}
    </button>
  );
}

// ---------- FORMULARIO DE PEDIDO (nuevo / editar) ----------
const nuevoItem = () => ({ id: uid(), size: "mediana", qty: 1, opciones: [], nota: "" });

export function OrderForm({ order, prices, onCancel, onSave }) {
  const editing = !!order;
  const [cliente, setCliente] = useState(order ? order.cliente : "");
  const [telefono, setTelefono] = useState(order ? order.telefono : "");
  const [direccion, setDireccion] = useState(order ? order.direccion : "");
  const [fecha, setFecha] = useState(order ? order.fecha : today());
  const [fechaEntrega, setFechaEntrega] = useState(order ? order.fechaEntrega || "" : "");
  const [nota, setNota] = useState(order ? order.nota : "");
  const [pagado, setPagado] = useState(order ? order.pagado : false);
  const [entregado, setEntregado] = useState(order ? order.entregado : false);
  const [items, setItems] = useState(order && order.items.length ? order.items : [nuevoItem()]);

  const originales = useMemo(
    () => Object.fromEntries((order ? order.items : []).map((i) => [i.id, i])),
    [order]
  );

  const updateItem = (id, cambios) =>
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, ...cambios } : i)));
  const removeItem = (id) => setItems((arr) => arr.filter((i) => i.id !== id));

  const total = items.reduce(
    (s, i) => s + precioUnitario(i, prices, originales[i.id]) * (Number(i.qty) || 0),
    0
  );

  const submit = () => {
    if (!cliente.trim()) return;
    const finalItems = items.map((i) => ({
      ...i,
      qty: Math.max(1, Number(i.qty) || 1),
      precio: precioUnitario(i, prices, originales[i.id]),
    }));
    onSave({
      id: order ? order.id : uid(),
      cliente: cliente.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      fecha,
      fechaEntrega,
      nota: nota.trim(),
      pagado,
      entregado,
      items: finalItems,
    });
  };

  // Botones rápidos: hoy, mañana, próximo sábado y próximo domingo (sin repetir fechas)
  const atajos = useMemo(() => {
    const hoy = today();
    const fechas = [hoy, sumarDias(hoy, 1), proximoDiaSemana(6), proximoDiaSemana(0)];
    return [...new Set(fechas)].sort();
  }, []);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(74,37,64,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", width: "100%", maxWidth: "420px", borderTopLeftRadius: "22px", borderTopRightRadius: "22px", padding: "18px", maxHeight: "94vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div className="heading" style={{ fontWeight: 800, fontSize: "17px", color: C.deep }}>
            {editing ? "Editar pedido" : "Nuevo pedido"}
          </div>
          <button onClick={onCancel} aria-label="Cerrar" style={{ background: C.pinkBg, border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color={C.deep} />
          </button>
        </div>

        <Field label="Nombre del cliente">
          <input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ej: María Pérez" style={inputStyle} />
        </Field>
        <Field label="Teléfono">
          <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 300 123 4567" style={inputStyle} />
        </Field>
        <Field label="Dirección de entrega">
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Ej: Cra 10 # 20-30" style={inputStyle} />
        </Field>
        <Field label="¿Para qué día es la entrega?">
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
            {atajos.map((f) => (
              <Chip key={f} active={fechaEntrega === f} onClick={() => setFechaEntrega(f)}>
                {etiquetaDia(f, true)}
              </Chip>
            ))}
            <Chip active={fechaEntrega === ""} onClick={() => setFechaEntrega("")}>
              Sin fecha
            </Chip>
          </div>
          <input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} style={inputStyle} />
          {fechaEntrega && (
            <div style={{ fontSize: "12px", color: C.deep, fontWeight: 700, marginTop: "5px" }}>
              Entrega: {etiquetaDia(fechaEntrega)}
            </div>
          )}
        </Field>
        <Field label="Fecha en que se hizo el pedido">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
        </Field>

        <div className="heading" style={{ fontWeight: 700, fontSize: "14px", margin: "6px 0 8px", color: C.text }}>
          Fresas del pedido
        </div>

        {items.map((it, idx) => (
          <div
            key={it.id}
            style={{ background: C.pinkBg, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "12px", marginBottom: "10px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: C.deep }}>Fresa #{idx + 1}</span>
              {items.length > 1 && (
                <button onClick={() => removeItem(it.id)} style={{ background: "none", border: "none", color: "#D89AB0", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
                  <Trash2 size={13} /> Quitar
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
              {TAMANOS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => updateItem(it.id, { size: t.key })}
                  style={{
                    flex: 1,
                    padding: "9px 4px",
                    borderRadius: "10px",
                    border: it.size === t.key ? `2px solid ${C.pink}` : `1px solid ${C.border}`,
                    background: it.size === t.key ? "#fff" : "rgba(255,255,255,0.6)",
                    color: C.text,
                    fontWeight: 800,
                    fontSize: "12.5px",
                    lineHeight: 1.2,
                  }}
                >
                  {t.label}
                  <div style={{ fontSize: "11px", fontWeight: 600, color: C.muted }}>{fmt(prices[t.key])}</div>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: C.soft }}>Cantidad</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => updateItem(it.id, { qty: Math.max(1, (Number(it.qty) || 1) - 1) })}
                  style={stepBtn}
                  aria-label="Menos"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={it.qty}
                  onChange={(e) => updateItem(it.id, { qty: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{ ...inputStyle, width: "64px", textAlign: "center", fontWeight: 800 }}
                />
                <button
                  type="button"
                  onClick={() => updateItem(it.id, { qty: (Number(it.qty) || 0) + 1 })}
                  style={stepBtn}
                  aria-label="Más"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div style={{ fontSize: "12px", fontWeight: 700, color: C.soft, marginBottom: "6px" }}>
              Toppings y preferencias
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
              {OPCIONES.map((op) => (
                <Chip
                  key={op.key}
                  active={it.opciones.includes(op.key)}
                  onClick={() => updateItem(it.id, { opciones: toggleOpcion(it.opciones, op.key) })}
                >
                  {op.label}
                  {op.key === "pops" && Number(prices.pops) > 0 ? ` +${fmt(prices.pops)}` : ""}
                </Chip>
              ))}
            </div>

            <input
              value={it.nota}
              onChange={(e) => updateItem(it.id, { nota: e.target.value })}
              placeholder="Nota de esta fresa (opcional)"
              style={inputStyle}
            />
          </div>
        ))}

        <button
          onClick={() => setItems((arr) => [...arr, nuevoItem()])}
          style={{ width: "100%", border: `1px dashed ${C.pinkLight}`, background: "#FFF6F8", borderRadius: "12px", padding: "11px", color: C.deep, fontWeight: 800, fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "14px" }}
        >
          <Plus size={15} /> Agregar otra fresa distinta
        </button>

        <Field label="Notas del pedido (entregar luego, dónde, recordatorios...)">
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: entregar después de las 4pm en la portería"
            style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }}
          />
        </Field>

        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <CheckButton checked={pagado} onClick={() => setPagado((p) => !p)} labelOn="Pagado" labelOff="Pagado" tone="amber" />
          <CheckButton checked={entregado} onClick={() => setEntregado((p) => !p)} labelOn="Entregado" labelOff="Entregado" tone="pink" />
        </div>

        <div style={{ background: C.pinkBg, borderRadius: "12px", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "13px", color: C.soft, fontWeight: 700 }}>
            Total del pedido {!pagado && total > 0 ? "(lo deben)" : ""}
          </span>
          <span style={{ fontSize: "19px", fontWeight: 800, color: C.deep }}>{fmt(total)}</span>
        </div>

        <BigButton onClick={submit} disabled={!cliente.trim()}>
          {editing ? "Guardar cambios" : "Guardar pedido"}
        </BigButton>
      </div>
    </div>
  );
}

const stepBtn = {
  width: "38px",
  height: "38px",
  borderRadius: "10px",
  border: `1px solid ${C.border}`,
  background: "#fff",
  color: C.deep,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// ---------- POR HACER (resumen de preparación, por día) ----------
function BloquesResumen({ resumen }) {
  return (
    <>
      {resumen.map((r) => (
        <Card key={r.size.key}>
          <div className="heading" style={{ fontWeight: 800, fontSize: "17px", color: C.deep, marginBottom: "8px" }}>
            {r.total} {r.total === 1 ? r.size.singular : r.size.plural}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {r.firmas.map(([f, n]) => (
              <div
                key={f}
                style={{ display: "flex", alignItems: "center", gap: "10px", background: C.pinkBg, borderRadius: "10px", padding: "8px 10px" }}
              >
                <span style={{ minWidth: "26px", height: "26px", borderRadius: "8px", background: "#fff", color: C.deep, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                  {n}
                </span>
                <span style={{ fontSize: "13.5px", fontWeight: 600, textTransform: "capitalize" }}>{f}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </>
  );
}

export function PorHacer({ orders }) {
  const [incluirEntregados, setIncluirEntregados] = useState(false);
  const [dia, setDia] = useState(() => diaInicial(orders));
  const [copiado, setCopiado] = useState(false);

  const base = incluirEntregados ? orders : orders.filter((o) => !o.entregado);
  const grupos = agruparPorDia(base);
  const valido = dia === "todo" || grupos.some((g) => (g.key === "" ? "sin" : g.key) === dia);
  const sel = valido ? dia : "todo";
  const seleccion = filtrarPorDia(base, sel);

  const resumen = resumenPreparacion(seleccion);
  const fresasSel = seleccion.reduce((s, o) => s + unidadesPedido(o), 0);
  const fresasTotal = base.reduce((s, o) => s + unidadesPedido(o), 0);
  const titulo = sel === "todo" ? "Todos los días" : sel === "sin" ? "Sin fecha" : etiquetaDia(sel);

  const copiar = async () => {
    const texto =
      sel === "todo"
        ? grupos
            .map((g) => textoPreparacion(resumenPreparacion(g.orders), g.key ? etiquetaDia(g.key) : "Sin fecha"))
            .join("\n\n")
        : textoPreparacion(resumen, titulo);
    const ok = await copiarTexto(texto);
    if (ok) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <DiaChips orders={base} value={sel} onChange={setDia} minimo={1} />

      <div>
        <Chip active={incluirEntregados} onClick={() => setIncluirEntregados((v) => !v)}>
          {incluirEntregados ? "✓ " : ""}Incluir ya entregados
        </Chip>
      </div>

      {base.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "10px 0", color: C.muted, fontSize: "14px" }}>
            No hay fresas por preparar 🎉
          </div>
        </Card>
      ) : (
        <>
          <div style={{ background: GRADIENT, color: "#fff", borderRadius: "16px", padding: "14px 16px", boxShadow: "0 4px 12px rgba(255,111,165,0.3)" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.92 }}>
              {sel === "todo" ? "Total por preparar (todos los días)" : `Por preparar para: ${titulo}`}
            </div>
            <div className="heading" style={{ fontSize: "26px", fontWeight: 800 }}>
              {fresasSel} {fresasSel === 1 ? "fresa" : "fresas"}
            </div>
            {sel !== "todo" && (
              <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.92, marginTop: "2px" }}>
                Total de todos los días: {fresasTotal}
              </div>
            )}
          </div>

          {sel === "todo" ? (
            grupos.map((g) => {
              const n = g.orders.reduce((s, o) => s + unidadesPedido(o), 0);
              return (
                <div key={g.key || "sin"} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div
                    style={{
                      background: C.pinkBg,
                      border: `1.5px solid ${C.pinkLight}`,
                      borderRadius: "12px",
                      padding: "9px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontWeight: 800,
                      color: C.deep,
                      fontSize: "14px",
                    }}
                  >
                    <span>
                      🗓 {g.key ? etiquetaDia(g.key) : "Sin fecha"}
                      {esAtrasado(g.key) ? " ⚠️ atrasado" : ""}
                    </span>
                    <span>
                      {n} {n === 1 ? "fresa" : "fresas"}
                    </span>
                  </div>
                  <BloquesResumen resumen={resumenPreparacion(g.orders)} />
                </div>
              );
            })
          ) : (
            <BloquesResumen resumen={resumen} />
          )}

          {sel === "sin" && (
            <div style={{ fontSize: "12px", color: C.amberText, background: C.amberBg, borderRadius: "10px", padding: "9px 12px", lineHeight: 1.45 }}>
              Estos pedidos no tienen día de entrega. Edítalos (lápiz en Pedidos) y elige el día para que
              no se mezclen con los de hoy.
            </div>
          )}

          <button
            onClick={copiar}
            style={{ border: `1px solid ${C.pinkLight}`, background: "#fff", color: copiado ? C.green : C.deep, borderRadius: "12px", padding: "11px", fontWeight: 800, fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            {copiado ? <CheckCircle2 size={15} /> : <Copy size={15} />}
            {copiado ? "¡Copiado!" : sel === "todo" ? "Copiar resumen de todos los días" : `Copiar resumen: ${titulo}`}
          </button>
        </>
      )}
    </div>
  );
}

// ---------- RUTA DE ENTREGAS ----------
const resumenItems = (o) =>
  o.items
    .map((i) => {
      const t = TAMANOS.find((x) => x.key === i.size);
      const nombre = t ? (i.qty === 1 ? t.singular : t.plural) : i.size;
      const extra = firma(i.opciones);
      return `${i.qty} ${nombre}${extra ? ` (${extra})` : ""}`;
    })
    .join(", ");

export function Ruta({ orders, prices, onToggle }) {
  const [cfg, setCfg] = useState(() => loadRutaCfg());
  const [dia, setDia] = useState(() => diaInicial(orders));
  const [gps, setGps] = useState(null); // { lat, lon }
  const [gpsMsg, setGpsMsg] = useState("");
  const [estado, setEstado] = useState("idle"); // idle | buscando | listo
  const [progreso, setProgreso] = useState("");
  const [error, setError] = useState("");
  const [inicioPt, setInicioPt] = useState(null);
  const [paradas, setParadas] = useState([]); // orden actual

  const ciudad = cfg.ciudad.trim() || CIUDAD_DEFAULT;
  const pendientes = orders.filter((o) => !o.entregado);
  const diaValido =
    dia === "todo" || agruparPorDia(pendientes).some((g) => (g.key === "" ? "sin" : g.key) === dia);
  const diaSel = diaValido ? dia : "todo";
  const delDia = filtrarPorDia(pendientes, diaSel);
  const conDireccion = delDia.filter((o) => o.direccion.trim());
  const sinDireccion = delDia.filter((o) => !o.direccion.trim());

  const cambiarCfg = (cambios) => {
    const nuevo = { ...cfg, ...cambios };
    setCfg(nuevo);
    saveRutaCfg(nuevo);
  };

  const usarGps = () => {
    if (!navigator.geolocation) {
      setGpsMsg("Tu navegador no permite usar la ubicación.");
      return;
    }
    setGpsMsg("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGpsMsg("Ubicación actual lista ✓");
      },
      () => setGpsMsg("No se pudo obtener tu ubicación. Escribe tu punto de partida abajo."),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const calcular = async () => {
    setError("");
    if (conDireccion.length === 0) {
      setError("No hay pedidos por entregar con dirección.");
      return;
    }
    if (!gps && !cfg.inicio.trim()) {
      setError("Dime desde dónde sales: usa tu ubicación o escribe una dirección.");
      return;
    }
    setEstado("buscando");
    const cache = loadGeoCache();
    const claveDe = (dir) => `${ciudad}|${dir.trim().toLowerCase()}`;

    // 1) punto de partida
    let inicio = gps;
    if (!inicio) {
      setProgreso("Buscando tu punto de partida…");
      const k = claveDe(cfg.inicio);
      inicio = cache[k] || (await geocodificar(cfg.inicio, ciudad));
      if (inicio) cache[k] = { lat: inicio.lat, lon: inicio.lon };
    }
    if (!inicio) {
      setEstado("idle");
      setError("No encontré tu punto de partida. Prueba con más detalle (barrio o un lugar conocido) o usa tu ubicación.");
      saveGeoCache(cache);
      return;
    }

    // 2) cada dirección (una por una, el buscador gratuito pide ir despacio)
    const encontradas = [];
    const fallidas = [];
    for (let i = 0; i < conDireccion.length; i++) {
      const o = conDireccion[i];
      setProgreso(`Buscando direcciones… ${i + 1} de ${conDireccion.length}`);
      const k = claveDe(o.direccion);
      let p = cache[k];
      if (!p) {
        p = await geocodificar(o.direccion, ciudad);
        if (p) cache[k] = { lat: p.lat, lon: p.lon };
      }
      const base = {
        id: o.id,
        cliente: o.cliente,
        direccion: o.direccion,
        texto: `${normalizarDireccion(o.direccion)}, ${ciudad}`,
      };
      if (p) encontradas.push({ ...base, lat: p.lat, lon: p.lon });
      else fallidas.push({ ...base, lat: null, lon: null });
    }
    saveGeoCache(cache);

    // 3) orden: la más cercana primero; las que no se encontraron van al final
    const orden = ordenarPorCercania(inicio, encontradas);
    setInicioPt(inicio);
    setParadas([...orden, ...fallidas]);
    setEstado("listo");
    setProgreso("");
  };

  const mover = (idx, delta) =>
    setParadas((arr) => {
      const j = idx + delta;
      if (j < 0 || j >= arr.length) return arr;
      const copia = [...arr];
      [copia[idx], copia[j]] = [copia[j], copia[idx]];
      return copia;
    });

  const pedidoDe = (id) => orders.find((o) => o.id === id);
  const activas = paradas.filter((p) => {
    const o = pedidoDe(p.id);
    return o && !o.entregado;
  });
  const tramos = inicioPt ? linksGoogleMaps(inicioPt, activas, "two-wheeler") : [];
  const encontradasActivas = activas.filter((p) => p.lat != null);
  const km = inicioPt ? kmTotal(inicioPt, encontradasActivas) : 0;
  const calculando = estado === "buscando";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Card>
        <div className="heading" style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>
          Ruta de entregas 🛵
        </div>
        <div style={{ fontSize: "12px", color: C.muted, marginBottom: "12px", lineHeight: 1.5 }}>
          Ordena los pedidos que aún no entregas, empezando por el más cercano a tu punto de partida.
        </div>

        {agruparPorDia(pendientes).length > 1 && (
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: C.soft, marginBottom: "6px" }}>
              ¿Entregas de qué día?
            </div>
            <DiaChips
              orders={pendientes}
              value={diaSel}
              onChange={(v) => {
                setDia(v);
                setEstado("idle");
                setParadas([]);
              }}
            />
          </div>
        )}

        <button
          onClick={usarGps}
          style={{
            width: "100%",
            border: `1.5px solid ${gps ? C.green : C.pinkLight}`,
            background: gps ? C.greenBg : "#fff",
            color: gps ? C.green : C.deep,
            borderRadius: "12px",
            padding: "11px",
            fontWeight: 800,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            marginBottom: "6px",
          }}
        >
          <LocateFixed size={16} /> Usar mi ubicación actual
        </button>
        {gpsMsg && <div style={{ fontSize: "12px", color: C.soft, marginBottom: "8px" }}>{gpsMsg}</div>}
        {gps && (
          <button
            onClick={() => {
              setGps(null);
              setGpsMsg("");
            }}
            style={{ background: "none", border: "none", color: C.muted, fontSize: "12px", fontWeight: 700, marginBottom: "8px", padding: 0 }}
          >
            Quitar ubicación y escribir una dirección
          </button>
        )}

        {!gps && (
          <Field label="…o escribe desde dónde sales">
            <input
              value={cfg.inicio}
              onChange={(e) => cambiarCfg({ inicio: e.target.value })}
              placeholder="Ej: Cra 25 # 30-10, barrio Centro"
              style={inputStyle}
            />
          </Field>
        )}

        <Field label="Ciudad (se agrega a cada búsqueda)">
          <input
            value={cfg.ciudad}
            onChange={(e) => cambiarCfg({ ciudad: e.target.value })}
            placeholder={CIUDAD_DEFAULT}
            style={inputStyle}
          />
        </Field>

        <div style={{ fontSize: "12.5px", color: C.soft, fontWeight: 700, marginBottom: "10px" }}>
          {conDireccion.length} {conDireccion.length === 1 ? "pedido por entregar con dirección" : "pedidos por entregar con dirección"}
          {sinDireccion.length > 0 && (
            <span style={{ color: C.amberText }}> · {sinDireccion.length} sin dirección (no entran en la ruta)</span>
          )}
        </div>

        <BigButton onClick={calcular} disabled={calculando || conDireccion.length === 0}>
          {calculando ? (
            <>
              <Loader2 size={17} style={{ animation: "giro 1s linear infinite" }} /> {progreso || "Calculando…"}
            </>
          ) : (
            <>
              <RouteIcon size={17} /> {estado === "listo" ? "Recalcular ruta" : "Calcular ruta"}
            </>
          )}
        </BigButton>
        <style>{`@keyframes giro { to { transform: rotate(360deg); } }`}</style>

        {error && (
          <div style={{ marginTop: "10px", background: "#FDE2E2", color: "#B23B3B", borderRadius: "10px", padding: "9px 12px", fontSize: "12.5px", fontWeight: 700 }}>
            {error}
          </div>
        )}
      </Card>

      {estado === "listo" && (
        <>
          {activas.length === 0 ? (
            <Card>
              <div style={{ textAlign: "center", padding: "10px 0", color: C.green, fontSize: "14px", fontWeight: 700 }}>
                ¡Todas las entregas de esta ruta están listas! 🎉
              </div>
            </Card>
          ) : (
            <>
              <div style={{ background: GRADIENT, color: "#fff", borderRadius: "16px", padding: "14px 16px", boxShadow: "0 4px 12px rgba(255,111,165,0.3)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.9 }}>Tu ruta</div>
                <div className="heading" style={{ fontSize: "22px", fontWeight: 800 }}>
                  {activas.length} {activas.length === 1 ? "parada" : "paradas"}
                  {km > 0 ? ` · ~${km.toFixed(1)} km en línea recta` : ""}
                </div>
              </div>

              {tramos.map((t, i) => (
                <a
                  key={i}
                  href={t.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: "none",
                    background: "#fff",
                    border: `2px solid ${C.pink}`,
                    color: C.deep,
                    borderRadius: "14px",
                    padding: "13px",
                    fontWeight: 800,
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Navigation size={18} />
                  {tramos.length > 1 ? `Abrir en Google Maps (paradas ${t.desde}–${t.hasta})` : "Abrir en Google Maps"}
                </a>
              ))}
            </>
          )}

          {paradas.map((p, idx) => {
            const o = pedidoDe(p.id);
            if (!o) return null;
            const numero = activas.findIndex((a) => a.id === p.id) + 1;
            const debe = debePedido(o, prices);
            return (
              <Card
                key={p.id}
                style={{
                  opacity: o.entregado ? 0.55 : 1,
                  borderLeft: `6px solid ${o.entregado ? C.green : p.lat == null ? C.amber : C.pink}`,
                }}
              >
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      minWidth: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background: o.entregado ? C.greenBg : C.pinkBg,
                      color: o.entregado ? C.green : C.deep,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                    }}
                  >
                    {o.entregado ? "✓" : numero}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="heading" style={{ fontWeight: 700, fontSize: "15px" }}>
                      {o.cliente || "Cliente sin nombre"}
                    </div>
                    <div style={{ fontSize: "12.5px", color: C.soft, marginTop: "2px", display: "flex", gap: "4px", alignItems: "flex-start" }}>
                      <MapPin size={13} style={{ flexShrink: 0, marginTop: "2px" }} />
                      <span>{o.direccion}</span>
                    </div>
                    <div style={{ fontSize: "12.5px", marginTop: "4px" }}>{resumenItems(o)}</div>
                    {o.nota && (
                      <div style={{ fontSize: "12px", color: "#7A5B10", marginTop: "4px" }}>📝 {o.nota}</div>
                    )}
                    {debe > 0 && (
                      <span style={{ display: "inline-block", marginTop: "6px", background: C.amberBg, color: C.amberText, border: `1px solid ${C.amber}`, borderRadius: "999px", padding: "2px 10px", fontSize: "12px", fontWeight: 800 }}>
                        Cobrar {fmt(debe)}
                      </span>
                    )}
                    {p.lat == null && !o.entregado && (
                      <div style={{ marginTop: "8px", background: C.amberBg, borderRadius: "10px", padding: "8px 10px", fontSize: "12px", color: C.amberText, lineHeight: 1.45 }}>
                        No pude ubicar esta dirección, así que la dejé al final. Revísala en el mapa y
                        acomódala con las flechitas.{" "}
                        <a href={linkBuscarEnMaps(o.direccion, ciudad)} target="_blank" rel="noreferrer" style={{ color: C.deep, fontWeight: 800 }}>
                          Buscarla en Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                  {!o.entregado && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <button onClick={() => mover(idx, -1)} aria-label="Subir parada" style={iconBtn}>
                        <ArrowUp size={16} />
                      </button>
                      <button onClick={() => mover(idx, 1)} aria-label="Bajar parada" style={iconBtn}>
                        <ArrowDown size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <CheckButton checked={o.pagado} onClick={() => onToggle(o.id, "pagado")} labelOn="Pagado" labelOff="Pagado" tone="amber" />
                  <CheckButton checked={o.entregado} onClick={() => onToggle(o.id, "entregado")} labelOn="Entregado" labelOff="Entregado" tone="pink" />
                </div>
              </Card>
            );
          })}

          <div style={{ fontSize: "12px", color: C.muted, lineHeight: 1.5, textAlign: "center" }}>
            El orden es "siempre a la parada más cercana". Si conoces un atajo o un sentido de calle
            que la app no sabe, muévela con las flechitas. Los km son en línea recta, no por calles.
          </div>
        </>
      )}
    </div>
  );
}

// ---------- COMPRAS (insumos) + SOBRANTES ----------
export function Compras({ compras, sobrantes, onChangeCompras, onChangeSobrantes }) {
  const vacio = () => Object.fromEntries(INSUMOS_BASE.map((i) => [i.key, ""]));
  const [fecha, setFecha] = useState(today());
  const [valores, setValores] = useState(vacio);
  const [extras, setExtras] = useState([]);
  const [sobCantidad, setSobCantidad] = useState("");
  const [sobNota, setSobNota] = useState("");

  const setValor = (key, val) => setValores((v) => ({ ...v, [key]: val }));
  const addExtra = () => setExtras((e) => [...e, { id: uid(), name: "", price: "" }]);
  const updateExtra = (id, campo, val) =>
    setExtras((e) => e.map((x) => (x.id === id ? { ...x, [campo]: val } : x)));
  const removeExtra = (id) => setExtras((e) => e.filter((x) => x.id !== id));

  const total =
    INSUMOS_BASE.reduce((s, i) => s + (Number(valores[i.key]) || 0), 0) +
    extras.reduce((s, x) => s + (Number(x.price) || 0), 0);

  const guardarCompra = () => {
    if (total <= 0) return;
    const items = Object.fromEntries(INSUMOS_BASE.map((i) => [i.key, Number(valores[i.key]) || 0]));
    onChangeCompras([
      {
        id: uid(),
        fecha,
        items,
        extras: extras.filter((x) => x.name.trim()).map((x) => ({ name: x.name.trim(), price: Number(x.price) || 0 })),
        total,
      },
      ...compras,
    ]);
    setValores(vacio());
    setExtras([]);
    setFecha(today());
  };

  const borrarCompra = (id) => {
    if (window.confirm("¿Eliminar esta compra?")) onChangeCompras(compras.filter((c) => c.id !== id));
  };

  const guardarSobrante = () => {
    if (!sobCantidad) return;
    onChangeSobrantes([
      { id: uid(), fecha: today(), cantidad: Number(sobCantidad) || 0, nota: sobNota.trim() },
      ...sobrantes,
    ]);
    setSobCantidad("");
    setSobNota("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Card>
        <div className="heading" style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>
          Registrar compra de insumos
        </div>
        <div style={{ fontSize: "12px", color: C.muted, marginBottom: "12px" }}>
          Escribe cuánto pagaste por cada cosa. Deja vacío (o 0) lo que no compraste.
        </div>

        <Field label="Fecha de la compra">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
        </Field>

        {INSUMOS_BASE.map((i) => (
          <Field key={i.key} label={i.unidad ? `${i.label} (${i.unidad})` : i.label}>
            <input type="number" inputMode="numeric" min={0} placeholder="0" value={valores[i.key]} onChange={(e) => setValor(i.key, e.target.value)} style={inputStyle} />
          </Field>
        ))}

        {extras.map((x) => (
          <div key={x.id} style={{ display: "flex", gap: "6px", marginBottom: "12px", alignItems: "flex-end" }}>
            <div style={{ flex: 1.4 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: C.soft, marginBottom: "5px" }}>Nombre</div>
              <input value={x.name} onChange={(e) => updateExtra(x.id, "name", e.target.value)} placeholder="Ej: Chocolate" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: C.soft, marginBottom: "5px" }}>Precio</div>
              <input type="number" inputMode="numeric" min={0} value={x.price} onChange={(e) => updateExtra(x.id, "price", e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <button onClick={() => removeExtra(x.id)} aria-label="Quitar" style={{ background: C.pinkBg, border: "none", borderRadius: "10px", padding: "13px", color: C.deep }}>
              <X size={14} />
            </button>
          </div>
        ))}

        <button
          onClick={addExtra}
          style={{ width: "100%", border: `1px dashed ${C.pinkLight}`, background: "#FFF6F8", borderRadius: "10px", padding: "10px", color: C.deep, fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "14px" }}
        >
          <Plus size={15} /> Agregar otro insumo
        </button>

        <div style={{ background: C.pinkBg, borderRadius: "12px", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "13px", color: C.soft, fontWeight: 700 }}>Total de la compra</span>
          <span style={{ fontSize: "18px", fontWeight: 800, color: C.deep }}>{fmt(total)}</span>
        </div>

        <BigButton onClick={guardarCompra} disabled={total <= 0}>
          Guardar compra
        </BigButton>
      </Card>

      {compras.length > 0 && (
        <Card>
          <div className="heading" style={{ fontWeight: 700, fontSize: "15px", marginBottom: "10px" }}>
            Historial de compras
          </div>
          {compras.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.pinkBg}` }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>{c.fecha}</div>
                <div style={{ fontSize: "12px", color: C.muted }}>Total: {fmt(c.total)}</div>
              </div>
              <button onClick={() => borrarCompra(c.id)} aria-label="Eliminar compra" style={iconBtn}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <div className="heading" style={{ fontWeight: 700, fontSize: "15px", marginBottom: "10px" }}>
          Registrar sobrantes
        </div>
        <Field label="¿Cuántas sobraron / no se vendieron?">
          <input type="number" inputMode="numeric" min={0} placeholder="0" value={sobCantidad} onChange={(e) => setSobCantidad(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Nota (opcional)">
          <input value={sobNota} onChange={(e) => setSobNota(e.target.value)} placeholder="Ej: se dañaron, no se vendieron a tiempo" style={inputStyle} />
        </Field>
        <BigButton onClick={guardarSobrante} disabled={!sobCantidad} style={{ background: sobCantidad ? "linear-gradient(135deg, #FFD3A5, #FDA085)" : "#F3DCC9", fontSize: "14px", padding: "12px" }}>
          Registrar sobrante
        </BigButton>

        {sobrantes.length > 0 && (
          <div style={{ marginTop: "14px" }}>
            {sobrantes.map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.pinkBg}` }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>
                    {s.cantidad} unidades · {s.fecha}
                  </div>
                  {s.nota && <div style={{ fontSize: "12px", color: C.muted }}>{s.nota}</div>}
                </div>
                <button onClick={() => onChangeSobrantes(sobrantes.filter((x) => x.id !== s.id))} aria-label="Eliminar sobrante" style={iconBtn}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------- NOTAS (block de notas) ----------
export function Notas({ notas, onChange }) {
  const [nueva, setNueva] = useState("");

  const agregar = () => {
    if (!nueva.trim()) return;
    onChange([{ id: uid(), texto: nueva.trim(), fecha: today() }, ...notas]);
    setNueva("");
  };

  const editar = (id, texto) => onChange(notas.map((n) => (n.id === id ? { ...n, texto } : n)));
  const borrar = (id) => {
    if (window.confirm("¿Eliminar esta nota?")) onChange(notas.filter((n) => n.id !== id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Card>
        <div className="heading" style={{ fontWeight: 700, fontSize: "15px", marginBottom: "10px" }}>
          Nueva nota
        </div>
        <textarea
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          placeholder="Ej: comprar más fresas el viernes, llamar a Juli..."
          style={{ ...inputStyle, minHeight: "80px", resize: "vertical", marginBottom: "10px" }}
        />
        <BigButton onClick={agregar} disabled={!nueva.trim()} style={{ fontSize: "14px", padding: "12px" }}>
          <Plus size={16} /> Guardar nota
        </BigButton>
      </Card>

      {notas.length === 0 && (
        <Card>
          <div style={{ textAlign: "center", padding: "10px 0", color: C.muted, fontSize: "14px" }}>
            Aquí van tus apuntes sueltos 📝
          </div>
        </Card>
      )}

      {notas.map((n) => (
        <div key={n.id} style={{ background: "#FFF9E6", border: "1px solid #F1D58A", borderRadius: "16px", padding: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#9A7B20" }}>{n.fecha}</span>
            <button onClick={() => borrar(n.id)} aria-label="Eliminar nota" style={{ ...iconBtn, color: "#C9A64A", padding: "2px" }}>
              <Trash2 size={15} />
            </button>
          </div>
          <textarea
            value={n.texto}
            onChange={(e) => editar(n.id, e.target.value)}
            style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "vertical", minHeight: "56px", fontSize: "16px", color: "#5C4510", lineHeight: 1.4 }}
          />
        </div>
      ))}
    </div>
  );
}

// ---------- PRECIOS ----------
export function Precios({ prices, onSave }) {
  const [local, setLocal] = useState({
    pequena: String(prices.pequena),
    mediana: String(prices.mediana),
    grande: String(prices.grande),
    pops: String(prices.pops),
  });
  const [guardado, setGuardado] = useState(false);

  const cambiar = (key, val) => {
    setLocal((l) => ({ ...l, [key]: val }));
    setGuardado(false);
  };

  const guardar = () => {
    onSave({
      pequena: Number(local.pequena) || 0,
      mediana: Number(local.mediana) || 0,
      grande: Number(local.grande) || 0,
      pops: Number(local.pops) || 0,
    });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 1800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Card>
        <div className="heading" style={{ fontWeight: 700, fontSize: "15px", marginBottom: "12px" }}>
          Precios de venta
        </div>
        {TAMANOS.map((t) => (
          <Field key={t.key} label={t.label}>
            <input type="number" inputMode="numeric" value={local[t.key]} onChange={(e) => cambiar(t.key, e.target.value)} style={inputStyle} />
          </Field>
        ))}
        <Field label="Extra por agregar pops (por fresa)">
          <input type="number" inputMode="numeric" value={local.pops} onChange={(e) => cambiar("pops", e.target.value)} style={inputStyle} />
        </Field>
        <div style={{ fontSize: "12px", color: C.muted, lineHeight: 1.5, marginBottom: "14px" }}>
          Si cambias un precio, solo afecta a los pedidos nuevos: los que ya guardaste conservan el precio con el que se vendieron.
        </div>
        <BigButton
          onClick={guardar}
          style={guardado ? { background: C.green, boxShadow: "none" } : undefined}
        >
          {guardado ? "¡Guardado! ✓" : "Guardar cambios"}
        </BigButton>
      </Card>
    </div>
  );
}

// ---------- RESPALDO ----------
export function Respaldo({ data, onRestore }) {
  const [copiado, setCopiado] = useState(false);
  const [texto, setTexto] = useState("");
  const [msg, setMsg] = useState(null); // { ok, texto }

  const r = resumenRespaldo(data);

  const copiar = async () => {
    const ok = await copiarTexto(crearRespaldo(data));
    if (ok) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
      setMsg({ ok: true, texto: "Respaldo copiado. Pégalo en Notas o en un WhatsApp contigo misma." });
    } else {
      setMsg({ ok: false, texto: "No se pudo copiar. Usa el botón de descargar." });
    }
  };

  const descargar = () => {
    try {
      const blob = new Blob([crearRespaldo(data)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fresas-respaldo-${today()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMsg({ ok: true, texto: "Archivo de respaldo descargado." });
    } catch (e) {
      setMsg({ ok: false, texto: "No se pudo descargar. Usa el botón de copiar." });
    }
  };

  const leerArchivo = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setTexto(String(reader.result || ""));
    reader.readAsText(f);
    e.target.value = "";
  };

  const restaurar = () => {
    try {
      const d = leerRespaldo(texto);
      const n = resumenRespaldo(d);
      const ok = window.confirm(
        `Esto REEMPLAZA lo que tienes ahora por el respaldo:\n\n` +
          `• ${n.pedidos} pedidos\n• ${n.compras} compras\n• ${n.notas} notas\n\n` +
          `Lo que tienes ahora (${r.pedidos} pedidos, ${r.compras} compras, ${r.notas} notas) se perderá. ¿Continuar?`
      );
      if (!ok) return;
      onRestore(d);
      setTexto("");
      setMsg({ ok: true, texto: `Listo: se restauraron ${n.pedidos} pedidos, ${n.compras} compras y ${n.notas} notas.` });
    } catch (err) {
      setMsg({ ok: false, texto: err.message });
    }
  };

  return (
    <Card style={{ border: `1px solid ${C.pinkLight}`, background: "#FFF9FB" }}>
      <div className="heading" style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
        <ShieldCheck size={17} color={C.deep} /> Copia de seguridad
      </div>
      <div style={{ fontSize: "12px", color: C.muted, lineHeight: 1.5, marginBottom: "12px" }}>
        Tus datos viven solo en este celular. Si borras los datos del navegador o cambias de teléfono, se
        pierden. Guarda un respaldo de vez en cuando (por ejemplo, al terminar el día).
        <br />
        Ahora tienes: <b>{r.pedidos}</b> pedidos, <b>{r.compras}</b> compras, <b>{r.notas}</b> notas.
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        <button
          onClick={copiar}
          style={{ flex: 1, border: "none", borderRadius: "12px", padding: "12px 6px", fontWeight: 800, fontSize: "13px", color: "#fff", background: copiado ? C.green : GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          {copiado ? <CheckCircle2 size={15} /> : <Copy size={15} />} {copiado ? "¡Copiado!" : "Copiar respaldo"}
        </button>
        <button
          onClick={descargar}
          style={{ flex: 1, border: `1.5px solid ${C.pinkLight}`, borderRadius: "12px", padding: "12px 6px", fontWeight: 800, fontSize: "13px", color: C.deep, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <Download size={15} /> Descargar
        </button>
      </div>

      <Field label="Restaurar desde un respaldo (pega el texto o elige el archivo)">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Pega aquí el respaldo que copiaste antes…"
          style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }}
        />
      </Field>
      <input
        type="file"
        accept=".json,.txt,application/json,text/plain"
        onChange={leerArchivo}
        style={{ fontSize: "12px", marginBottom: "10px", maxWidth: "100%" }}
      />
      <button
        onClick={restaurar}
        disabled={!texto.trim()}
        style={{ width: "100%", border: `1px solid ${C.pinkLight}`, background: "#fff", borderRadius: "12px", padding: "11px", fontWeight: 800, fontSize: "13px", color: texto.trim() ? C.deep : "#D8A5BE" }}
      >
        Restaurar este respaldo
      </button>

      {msg && (
        <div style={{ marginTop: "10px", fontSize: "12.5px", fontWeight: 700, textAlign: "center", color: msg.ok ? C.green : "#B23B3B" }}>
          {msg.texto}
        </div>
      )}
    </Card>
  );
}

// ---------- NAVEGACIÓN ----------
function BottomNav({ tab, setTab }) {
  const items = [
    { key: "resumen", label: "Resumen", icon: Home },
    { key: "pedidos", label: "Pedidos", icon: Package },
    { key: "porhacer", label: "Por hacer", icon: ClipboardList },
    { key: "ruta", label: "Ruta", icon: RouteIcon },
    { key: "compras", label: "Compras", icon: ShoppingBag },
    { key: "notas", label: "Notas", icon: StickyNote },
    { key: "precios", label: "Precios", icon: Tag },
  ];
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "420px",
        background: "#fff",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        padding: "8px 2px calc(env(safe-area-inset-bottom, 0px) + 8px)",
        boxShadow: "0 -4px 14px rgba(255,111,165,0.12)",
        zIndex: 40,
      }}
    >
      {items.map(({ key, label, icon: Icon }) => {
        const active = tab === key;
        return (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "6px 0", color: active ? C.pink : "#D8A5BE" }}
          >
            <Icon size={19} strokeWidth={active ? 2.5 : 2} />
            <span style={{ fontSize: "10px", fontWeight: active ? 800 : 600 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
