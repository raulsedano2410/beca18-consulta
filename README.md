# Beca 18 — Consulta de Resultados y Simulador de Puntaje 2026

**Pagina web gratuita y sin anuncios** para que los postulantes a Beca 18 consulten su resultado de preseleccion, conozcan su ranking y simulen su puntaje de seleccion eligiendo diferentes opciones de IES y carrera.

**En vivo:** [beca18-consulta.vercel.app](https://beca18-consulta.vercel.app)

---

## Por que hice esta pagina

Soy **Raul Sedano Molina**, programador. Mi hija fue preseleccionada a Beca 18 y va a estudiar Economia en la PUCP. Cuando salio la lista de preseleccionados, me di cuenta de que no habia una forma facil de entender los resultados: tu ranking, que tan lejos estas del corte, que puntaje te daria cada IES y carrera. Asi que la construi para ella y decidi compartirla con todas las familias que estan en la misma situacion.

Toda la informacion proviene exclusivamente de documentos oficiales publicados por PRONABEC. No se almacenan datos personales.

---

## Que puedes hacer en la pagina

### 1. Consultar tu resultado de preseleccion

Ingresa tu DNI o nombre completo en el buscador y accede a tu resultado en segundos.

**Si fuiste preseleccionado veras:**
- Tu puntaje ENP y condiciones priorizables
- Tu ranking global entre los 16,148 preseleccionados
- Tu ranking por modalidad de beca
- Tu ranking por region
- Tu percentil (en que posicion estas respecto al total)
- Cuantas personas tienen tu mismo puntaje (empates)
- Grafico de distribucion de puntajes
- Cuanto te falta o sobra respecto al puntaje de corte

**Si no fuiste preseleccionado:** veras tu puntaje y cuanto te falto para pasar el corte.

**Si fuiste descalificado:** veras el motivo exacto de la descalificacion.

### 2. Simular tu puntaje de seleccion

El simulador te permite estimar cuantos puntos obtendrias eligiendo diferentes combinaciones de IES y carrera. Es la herramienta mas importante si fuiste preseleccionado, porque **la seleccion final depende de a donde postules**.

**Como usar el simulador paso a paso:**

1. **Busca tu nombre o DNI** — el sistema carga automaticamente tu puntaje ENP y condiciones priorizables
2. **Elige una IES** — puedes buscar por nombre entre las 5,541 opciones elegibles
3. **Elige un programa academico** — selecciona la carrera y sede
4. **Indica si estudiaras en tu misma region** — esto define si aplica Permanencia Regional (PR) o Movilidad Estudiantil (ME)
5. **Mira tu puntaje estimado** — con el desglose completo de cada componente

### 3. Ver estadisticas generales

- Total de postulantes: 97,582
- Preseleccionados: 16,148
- No preseleccionados: 73,162
- Descalificados: 8,272
- Puntajes de corte por modalidad
- Top 10 puntajes mas altos
- Distribucion por region

### 4. Explorar las IES elegibles

Catalogo completo de las 5,541 opciones de programas academicos elegibles, con filtros por departamento, tipo de IES (universidad, instituto, escuela), gestion (publica/privada) y nombre del programa.

---

## Como se calcula el puntaje de seleccion

La formula oficial (Tabla 14 de las Bases 2026):

```
Puntaje = ENP + (CP x 0.5) + C + G + (PR o ME) + (EST o EP)
```

| Componente | Que es | Puntaje maximo |
|------------|--------|----------------|
| **ENP** | Tu puntaje del Examen Nacional de Preseleccion | 120 |
| **CP** | Condiciones priorizables (pobreza, extracurriculares, etc.) x 50% | 20 |
| **C** | Clasificacion de la IES (Grupo 1 = 10, Grupo 2 = 8, Grupo 3 = 6) | 10 |
| **G** | Gestion de la IES (Publica = 10, Privada = 5) | 10 |
| **PR** | Permanencia Regional — si estudias en tu misma region | 10 |
| **ME** | Movilidad Estudiantil — si te mudas a otra region (excluyente con PR) | 10 |
| **EST** | Carrera de alta demanda en instituto tecnologico (+10 pts) | 10 |
| **EP** | Carrera de educacion, solo para BEAHD (+10 pts) | 10 |
| **TOTAL** | | **180** |

### Puntos por region (PR y ME)

Los puntos por region dependen del quintil de cada departamento. **PR y ME tienen quintiles diferentes** (Anexos 2 y 3 de las Bases):

**Permanencia Regional (PR) — Anexo 2:**
- Q1 (10 pts): Ayacucho, Moquegua, Amazonas, Lima Provincias, Huancavelica
- Q2 (8 pts): Pasco, Apurimac, Cajamarca, Tumbes, Loreto
- Q3 (6 pts): Ucayali, Puno, San Martin, Madre de Dios, Ancash
- Q4 (4 pts): Huanuco, Cusco, Tacna, Junin, Ica
- Q5 (0 pts): Lambayeque, Lima Metropolitana, Callao, Piura, La Libertad, Arequipa

**Movilidad Estudiantil (ME) — Anexo 3:**
- Q1 (10 pts): Loreto, Puno, Ancash, Tumbes, Cajamarca
- Q2 (8 pts): Piura, Lima Provincias, Apurimac, Cusco, Tacna
- Q3 (6 pts): Ayacucho, Huancavelica, Madre de Dios, Moquegua, La Libertad
- Q4 (4 pts): San Martin, Pasco, Ica, Ucayali, Huanuco
- Q5 (0 pts): Amazonas, Junin, Lima Metropolitana, Callao, Lambayeque, Arequipa

### Puntos extra por carrera de alta demanda (EST)

Si eliges un **instituto o escuela tecnologica** con una carrera de alta demanda segun la EDO del Ministerio de Trabajo, sumas **10 puntos extra**. Las 10 familias de carreras son:

1. Mecanica y Metalurgia
2. Gestion y Administracion
3. Contabilidad e Impuestos
4. Electricidad y Energia
5. Sistemas y Computo
6. Marketing y Publicidad
7. Enfermeria
8. Construccion e Ingenieria Civil
9. Hoteleria y Gastronomia
10. Salud y Proteccion Laboral

**Importante:** Estos 10 puntos **solo aplican para institutos tecnologicos**, no para universidades ni escuelas pedagogicas. Si postulas a una universidad privada con carrera de alta demanda, no sumas puntos pero PRONABEC te da prioridad en el orden de seleccion (a igual puntaje, va primero quien eligio carrera EDO).

---

## Secciones de la pagina

| Seccion | URL | Que encuentras |
|---------|-----|----------------|
| Inicio | `/` | Buscador, estadisticas, puntajes de corte, fuentes oficiales |
| Resultado | `/resultado/[dni]` | Tu resultado detallado con rankings y graficos |
| Simulador | `/simulador` | Calcula tu puntaje de seleccion con diferentes opciones |
| Estadisticas | `/estadisticas` | Graficos y datos generales del concurso |
| IES Elegibles | `/ies` | Catalogo de 5,541 programas elegibles con filtros |

---

## Tecnologias

- [Next.js 16](https://nextjs.org/) — Framework React con App Router
- [React 19](https://react.dev/) — Interfaz de usuario
- [Tailwind CSS 4](https://tailwindcss.com/) — Estilos responsive
- [Supabase](https://supabase.com/) — Base de datos PostgreSQL (97,600+ registros)
- [Chart.js](https://www.chartjs.org/) — Graficos interactivos
- [Vercel](https://vercel.com/) — Hosting y deploy

---

## Usar el codigo

El codigo es libre. Si quieres correrlo en tu maquina:

```bash
# Clonar el repositorio
git clone https://github.com/raulsedano2410/beca18-consulta.git
cd beca18-consulta

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crea un archivo .env.local con tus credenciales de Supabase:
# NEXT_PUBLIC_SUPABASE_URL=tu_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key

# Iniciar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y listo.

---

## Feedback y contacto

Si encontraste un error, tienes una sugerencia o simplemente quieres comentarme algo, escribeme a **raulsedanomolina@gmail.com**. Siempre respondo.

Tambien puedes abrir un [issue en GitHub](https://github.com/raulsedano2410/beca18-consulta/issues) si prefieres.

---

## Apoya el proyecto

Esta pagina es gratis y sin anuncios. Si te fue util, puedes:

- Dejar tu estrellita en el repo — me motiva a seguir mejorando la pagina
- Compartirla con otros postulantes que la necesiten
- Invitarme un cafe por Yape (el QR esta en la pagina)

---

## Fuentes oficiales

Todos los datos provienen de documentos publicados por PRONABEC:

- RJ N° 509-2026 — Resultados de Preseleccion
- Anexo 1 — Lista de Preseleccionados (16,148)
- Anexo 2 — Lista de No Preseleccionados (73,162)
- RDE N° 033-2026 — Bases del Concurso 2026
- RJ N° 508-2026 — IES Elegibles (5,541 programas)
- Clasificacion de Universidades, Institutos y EESP
- Anexos 2 y 3 — Quintiles de Permanencia Regional y Movilidad Estudiantil

Documentos disponibles en [pronabec.gob.pe/beca-18](https://www.pronabec.gob.pe/beca-18/)

---

Hecho con cariño para los postulantes de Beca 18 y sus familias.

**Raul Sedano Molina** — Programador
