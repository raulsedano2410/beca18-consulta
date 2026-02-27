# Correccion de Quintiles PR/ME — 2025-02-27

## Que estaba mal

El simulador usaba **un solo mapa de quintiles** para calcular tanto Permanencia Regional (PR) como Movilidad Estudiantil (ME). Segun las Bases oficiales del concurso Beca 18 - Convocatoria 2026, existen **dos tablas distintas**:

- **Anexo 2**: Quintiles para Permanencia Regional (PR)
- **Anexo 3**: Quintiles para Movilidad Estudiantil (ME)

Ademas, el codigo solo contemplaba Quintiles 1 a 4 (10, 8, 6, 4 pts). Las Bases incluyen **Quintil 5 = 0 puntos**.

Algunas regiones estaban asignadas al quintil incorrecto. Ejemplo: Moquegua estaba en Q4 (4 pts) cuando oficialmente es Q1 (10 pts) en PR.

## Que se corrigio

1. Se separaron los quintiles en dos mapas: `quintilesPR` y `quintilesME`
2. Se agrego Quintil 5 (0 puntos) a ambos mapas
3. Se corrigieron las regiones segun los Anexos oficiales
4. Fallback cambiado de Q4 (4 pts) a Q5 (0 pts) para regiones no encontradas

## Tablas oficiales

### Anexo 2 — Permanencia Regional (PR)

| Quintil | Puntos | Regiones |
|---------|--------|----------|
| Q1 | 10 | Ayacucho, Moquegua, Amazonas, **Lima Provincias**, Huancavelica |
| Q2 | 8 | Pasco, Apurimac, Cajamarca, Tumbes, Loreto |
| Q3 | 6 | Ucayali, Puno, San Martin, Madre de Dios, Ancash |
| Q4 | 4 | Huanuco, Cusco, Tacna, Junin, Ica |
| Q5 | 0 | Lambayeque, **Lima Metropolitana**, **Callao**, Piura, La Libertad, Arequipa |

### Anexo 3 — Movilidad Estudiantil (ME)

| Quintil | Puntos | Regiones |
|---------|--------|----------|
| Q1 | 10 | Loreto, Puno, Ancash, Tumbes, Cajamarca |
| Q2 | 8 | Piura, **Lima Provincias**, Apurimac, Cusco, Tacna |
| Q3 | 6 | Ayacucho, Huancavelica, Madre de Dios, Moquegua, La Libertad |
| Q4 | 4 | San Martin, Pasco, Ica, Ucayali, Huanuco |
| Q5 | 0 | Amazonas, Junin, **Lima Metropolitana**, **Callao**, Lambayeque, Arequipa |

## Lima Provincias, Lima Metropolitana y Callao

Los Anexos oficiales separan "Lima Metropolitana y Callao" de "Lima Provincias" (el texto del Anexo 2 dice: "La region de Lima y Callao han sido separadas en Lima Metropolitana y Callao, y Lima Provincias").

**En la base de datos** existen 3 valores:
- `LIMA` (4,368 preseleccionados) → Lima Metropolitana → PR: Q5, ME: Q5
- `LIMA PROVINCIAS` (505 preseleccionados) → PR: **Q1** (10 pts), ME: Q2 (8 pts)
- `CALLAO` (518 preseleccionados) → agrupado con Lima Metropolitana → PR: Q5, ME: Q5

**Callao** no aparece como entrada separada en ninguno de los dos Anexos. Segun el texto oficial, se agrupa con Lima Metropolitana, por lo que recibe Q5 (0 pts) en ambos mapas.

En `ies_elegibles`, solo existen `LIMA` y `CALLAO` como departamentos (no hay `LIMA PROVINCIAS`), por lo que para ME siempre se usan esos valores.

## Archivos modificados

- `app/api/simulador/route.ts` — Logica de calculo (quintiles separados, Q5 agregado)
- `app/simulador/page.tsx` — Textos de ayuda, escala visual, FAQ, banner de correccion, nota Lima
- `app/page.tsx` — Quitar "e ingeniero" del texto bio

## Agradecimiento

Gracias a los postulantes que nos escribieron por correo reportando que los quintiles estaban mal. Su feedback hizo posible esta correccion.
