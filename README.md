# Código 7

Sitio donde cada persona ingresa su nombre y celular y recibe un código de 4 dígitos que siempre empieza por 7. Los registros se guardan en Cloudflare D1.

## Estructura

- `public/index.html` — la página.
- `functions/api/codigo.js` — genera el código y lo guarda (Pages Function).
- `schema.sql` — tabla `registros`.
- `wrangler.toml` — configuración de Pages y de la base D1.

## Probar en local

```bash
npx wrangler d1 execute codigo7 --local --file=schema.sql
npx wrangler pages dev
```

## Desplegar en Cloudflare Pages

1. Crear la base de datos y copiar el `database_id` que devuelve en `wrangler.toml`:
   ```bash
   npx wrangler d1 create codigo7
   ```
2. Crear la tabla en la base real:
   ```bash
   npx wrangler d1 execute codigo7 --remote --file=schema.sql
   ```
3. Subir el repo a GitHub y en Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**. Sin comando de build; directorio de salida `public`.
4. En **Custom domains** del proyecto, agregar el subdominio.

## Ver los registros

```bash
npx wrangler d1 execute codigo7 --remote --command "SELECT * FROM registros ORDER BY creado_en DESC"
```
