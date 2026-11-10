// POST /api/codigo  { nombre, celular }
// Devuelve un código de 4 dígitos que siempre empieza por 7 (7000–7999)
// y lo guarda en D1 junto al nombre y el celular.

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

function numeroAleatorio(max) {
  // Entero uniforme en [0, max) usando el generador criptográfico.
  const limite = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limite);
  return buf[0] % max;
}

// Crea la tabla la primera vez, así no hay que ejecutar schema.sql a mano.
let tablaLista = false;
async function prepararTabla(db) {
  if (tablaLista) return;
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS registros (
       id        INTEGER PRIMARY KEY AUTOINCREMENT,
       nombre    TEXT NOT NULL,
       celular   TEXT NOT NULL UNIQUE,
       codigo    TEXT NOT NULL UNIQUE,
       creado_en TEXT NOT NULL DEFAULT (datetime('now'))
     )`
  ).run();
  tablaLista = true;
}

async function generarCodigo(request, env) {
  if (!env.DB) return json({ error: "La base de datos no está configurada." }, 500);
  await prepararTabla(env.DB);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Solicitud inválida." }, 400);
  }

  const nombre = String(body.nombre ?? "").trim().replace(/\s+/g, " ");
  // Se acepta con o sin el indicativo de Colombia (+57).
  let celular = String(body.celular ?? "").replace(/\D/g, "");
  if (celular.length === 12 && celular.startsWith("57")) celular = celular.slice(2);

  if (nombre.length < 2 || nombre.length > 80) {
    return json({ error: "Escribe tu nombre (entre 2 y 80 caracteres)." }, 400);
  }
  // Celular colombiano: 10 dígitos que empiezan por 3. Sin esto no hay código.
  if (!/^3\d{9}$/.test(celular)) {
    return json({ error: "Ese no parece un celular colombiano. Deben ser 10 dígitos y empezar por 3." }, 400);
  }

  // Si el celular ya tiene código, se devuelve el mismo.
  const existente = await env.DB.prepare(
    "SELECT nombre, codigo FROM registros WHERE celular = ?"
  ).bind(celular).first();
  if (existente) {
    return json({ codigo: existente.codigo, nombre: existente.nombre, existente: true });
  }

  // Se elige al azar entre los códigos libres. Si dos personas chocan
  // en el mismo instante, el UNIQUE de la tabla lo detecta y se reintenta.
  for (let intento = 0; intento < 5; intento++) {
    const { results } = await env.DB.prepare("SELECT codigo FROM registros").all();
    const usados = new Set(results.map((r) => r.codigo));
    const libres = [];
    for (let n = 0; n < 1000; n++) {
      const c = "7" + String(n).padStart(3, "0");
      if (!usados.has(c)) libres.push(c);
    }
    if (libres.length === 0) {
      return json({ error: "Ya se entregaron todos los códigos disponibles." }, 409);
    }

    const codigo = libres[numeroAleatorio(libres.length)];
    try {
      await env.DB.prepare(
        "INSERT INTO registros (nombre, celular, codigo) VALUES (?, ?, ?)"
      ).bind(nombre, celular, codigo).run();
      return json({ codigo, nombre, existente: false });
    } catch (e) {
      if (!String(e?.message ?? e).includes("UNIQUE")) {
        return json({ error: "No se pudo guardar. Intenta de nuevo." }, 500);
      }
      // Choque: puede ser el mismo celular enviado dos veces.
      const ya = await env.DB.prepare(
        "SELECT nombre, codigo FROM registros WHERE celular = ?"
      ).bind(celular).first();
      if (ya) return json({ codigo: ya.codigo, nombre: ya.nombre, existente: true });
    }
  }
  return json({ error: "Hay mucha demanda en este momento. Intenta de nuevo." }, 503);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/codigo") {
      if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);
      try {
        return await generarCodigo(request, env);
      } catch {
        return json({ error: "No se pudo generar el código. Intenta de nuevo." }, 500);
      }
    }
    // Todo lo demás es la página.
    return env.ASSETS.fetch(request);
  },
};
