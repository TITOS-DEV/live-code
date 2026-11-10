-- Tabla de registros: un código por celular, y cada código es único.
CREATE TABLE IF NOT EXISTS registros (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre    TEXT NOT NULL,
  celular   TEXT NOT NULL UNIQUE,
  codigo    TEXT NOT NULL UNIQUE,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
