-- Supabase PostgreSQL schema for Beca 18

-- Preseleccionados (16,148 rows)
CREATE TABLE IF NOT EXISTS preseleccionados (
  id SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL,
  modalidad VARCHAR(100) NOT NULL,
  dni VARCHAR(8) NOT NULL,
  apellidos_nombres VARCHAR(200) NOT NULL,
  region VARCHAR(50) NOT NULL,
  puntaje_enp INTEGER NOT NULL,
  condiciones_priorizables INTEGER NOT NULL,
  caracteristicas_labor_docente INTEGER,
  puntaje_final INTEGER NOT NULL,
  resultado VARCHAR(30) NOT NULL
);

CREATE INDEX idx_pre_dni ON preseleccionados(dni);
CREATE INDEX idx_pre_modalidad ON preseleccionados(modalidad);
CREATE INDEX idx_pre_region ON preseleccionados(region);
CREATE INDEX idx_pre_nombre ON preseleccionados(apellidos_nombres);

-- No Preseleccionados (73,162 rows)
CREATE TABLE IF NOT EXISTS no_preseleccionados (
  id SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL,
  modalidad VARCHAR(100) NOT NULL,
  dni VARCHAR(8) NOT NULL,
  apellidos_nombres VARCHAR(200) NOT NULL,
  region VARCHAR(50) NOT NULL,
  puntaje_enp INTEGER NOT NULL,
  condiciones_priorizables INTEGER NOT NULL,
  puntaje_final INTEGER NOT NULL,
  resultado VARCHAR(30) NOT NULL
);

CREATE INDEX idx_nopre_dni ON no_preseleccionados(dni);
CREATE INDEX idx_nopre_modalidad ON no_preseleccionados(modalidad);
CREATE INDEX idx_nopre_region ON no_preseleccionados(region);
CREATE INDEX idx_nopre_nombre ON no_preseleccionados(apellidos_nombres);

-- Descalificados (8,272 rows)
CREATE TABLE IF NOT EXISTS descalificados (
  id SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL,
  modalidad VARCHAR(100) NOT NULL,
  dni VARCHAR(8) NOT NULL,
  apellidos_nombres VARCHAR(200) NOT NULL,
  condicion VARCHAR(30) NOT NULL,
  causal VARCHAR(200) NOT NULL
);

CREATE INDEX idx_desc_dni ON descalificados(dni);
CREATE INDEX idx_desc_modalidad ON descalificados(modalidad);

-- IES Elegibles (5,541 rows)
CREATE TABLE IF NOT EXISTS ies_elegibles (
  id SERIAL PRIMARY KEY,
  item INTEGER NOT NULL,
  ies VARCHAR(200) NOT NULL,
  tipo_ies VARCHAR(100) NOT NULL,
  tipo_gestion VARCHAR(20) NOT NULL,
  departamento VARCHAR(50) NOT NULL,
  sede_distrito VARCHAR(100) NOT NULL,
  programa_academico VARCHAR(200) NOT NULL,
  modalidad_estudio VARCHAR(30) NOT NULL,
  es_eib BOOLEAN DEFAULT FALSE,
  grupo INTEGER
);

CREATE INDEX idx_ies_nombre ON ies_elegibles(ies);
CREATE INDEX idx_ies_tipo ON ies_elegibles(tipo_ies);
CREATE INDEX idx_ies_gestion ON ies_elegibles(tipo_gestion);
CREATE INDEX idx_ies_depto ON ies_elegibles(departamento);
CREATE INDEX idx_ies_programa ON ies_elegibles(programa_academico);

-- Reglas de Puntaje (19 rows)
CREATE TABLE IF NOT EXISTS reglas_puntaje (
  id SERIAL PRIMARY KEY,
  etapa VARCHAR(30) NOT NULL,
  concepto VARCHAR(100) NOT NULL,
  criterio VARCHAR(100) NOT NULL,
  indicador VARCHAR(200) NOT NULL,
  puntaje INTEGER NOT NULL,
  puntaje_maximo INTEGER NOT NULL,
  aplica_eib BOOLEAN DEFAULT TRUE,
  notas TEXT
);

-- Puntajes de Corte (10 rows)
CREATE TABLE IF NOT EXISTS puntajes_corte (
  modalidad VARCHAR(100) PRIMARY KEY,
  min_preseleccionado INTEGER NOT NULL,
  max_preseleccionado INTEGER NOT NULL,
  avg_preseleccionado DECIMAL(5,1) NOT NULL,
  max_no_preseleccionado INTEGER NOT NULL,
  vacantes_preseleccion INTEGER NOT NULL,
  becas_disponibles INTEGER NOT NULL
);

-- Causales de Descalificacion (3 rows)
CREATE TABLE IF NOT EXISTS causales_descalificacion (
  causal_codigo VARCHAR(100) PRIMARY KEY,
  causal_descripcion TEXT NOT NULL,
  cantidad INTEGER NOT NULL
);

-- Contador de visitas
CREATE TABLE IF NOT EXISTS visitas (
  id SERIAL PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 557
);
INSERT INTO visitas (count) VALUES (557);

-- RLS: read-only public access
ALTER TABLE preseleccionados ENABLE ROW LEVEL SECURITY;
ALTER TABLE no_preseleccionados ENABLE ROW LEVEL SECURITY;
ALTER TABLE descalificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE ies_elegibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reglas_puntaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE puntajes_corte ENABLE ROW LEVEL SECURITY;
ALTER TABLE causales_descalificacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read preseleccionados" ON preseleccionados FOR SELECT USING (true);
CREATE POLICY "Public read no_preseleccionados" ON no_preseleccionados FOR SELECT USING (true);
CREATE POLICY "Public read descalificados" ON descalificados FOR SELECT USING (true);
CREATE POLICY "Public read ies_elegibles" ON ies_elegibles FOR SELECT USING (true);
CREATE POLICY "Public read reglas_puntaje" ON reglas_puntaje FOR SELECT USING (true);
CREATE POLICY "Public read puntajes_corte" ON puntajes_corte FOR SELECT USING (true);
CREATE POLICY "Public read causales_descalificacion" ON causales_descalificacion FOR SELECT USING (true);
CREATE POLICY "Public read visitas" ON visitas FOR SELECT USING (true);
CREATE POLICY "Public update visitas" ON visitas FOR UPDATE USING (true);

-- Function to atomically increment visit counter
CREATE OR REPLACE FUNCTION increment_visitas()
RETURNS INTEGER AS $$
DECLARE new_count INTEGER;
BEGIN
  UPDATE visitas SET count = count + 1 WHERE id = 1 RETURNING count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
