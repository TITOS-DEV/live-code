# Live Code

Sitio donde cada persona ingresa su nombre y su celular colombiano y recibe un código de 4 dígitos que siempre empieza por 7, para comprar en el Live. Los registros se guardan en Cloudflare D1.

## Estructura

- `public/index.html` — la página.
- `src/index.js` — Worker: sirve la página y atiende `POST /api/codigo` (genera el código y lo guarda).
- `wrangler.toml` — configuración del Worker, de la carpeta `public` y de la base D1.
- `schema.sql` — la tabla `registros`, solo como referencia: el Worker la crea solo la primera vez.

## Despliegue

El repo está conectado a Cloudflare (Workers Builds): cada push a `main` ejecuta `npx wrangler deploy`. La base D1 `live-code-db` se crea sola en el primer despliegue.

## Probar en local

```bash
npx wrangler dev
```

## Ver los registros

En Cloudflare: Storage & Databases → D1 → `live-code-db` → tabla `registros`. O por terminal:

```bash
npx wrangler d1 execute live-code-db --remote --command "SELECT * FROM registros ORDER BY creado_en DESC"
```
