# Una vuelta más 🍅

Timer Pomodoro con fondo personalizable, alarmas configurables, reproductor de
Spotify/YouTube embebido y cuenta opcional para sincronizar tu configuración
entre dispositivos. Gratis de punta a punta: sin backend propio, sin
suscripciones, sin archivos de audio con licencia.

## Índice

- [Funcionalidades](#funcionalidades)
- [Cómo funciona el timer](#cómo-funciona-el-timer)
- [Stack técnico](#stack-técnico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Puesta en marcha](#puesta-en-marcha)
- [Scripts disponibles](#scripts-disponibles)
- [Tests](#tests)
- [Límites y decisiones de diseño](#límites-y-decisiones-de-diseño)
- [Pendiente / ideas a futuro](#pendiente--ideas-a-futuro)

## Funcionalidades

- **Timer Pomodoro editable**: duración de enfoque, descanso corto y
  descanso largo configurables, con un ciclo de 4 sesiones antes del
  descanso largo (indicado con puntitos que se pintan al iniciar cada
  ciclo).
- **Fondo personalizable**: color sólido, gradiente, o imagen — con un pool
  de imágenes curadas por defecto y subida propia (con cuenta) limitada en
  tamaño y cantidad para evitar abuso.
- **Contraste automático**: el color del texto y de los paneles se adapta
  según qué tan clara/oscura sea la imagen o color de fondo (con override
  manual: Auto / Claro / Oscuro, por si la detección automática falla en
  una imagen específica).
- **Alarmas opcionales**: sonidos sintetizados en el navegador (sin
  archivos de audio, sin licencias que gestionar), configurables por
  separado para fin de enfoque y fin de descanso, con control de volumen.
- **Reproductor de música embebido**: pega un link de una playlist/álbum/track
  de Spotify o un video/playlist de YouTube — sin login, sin cuenta Premium,
  sin backend propio.
- **Cuenta opcional (Supabase)**: sin cuenta, todo vive en `localStorage`
  del navegador. Con cuenta, la configuración se sincroniza entre
  dispositivos. Al crear una cuenta nueva, tu configuración local se adopta
  automáticamente (una sola vez, no vuelve a pisar cambios en logins
  posteriores).
- **Diseño responsivo**: menú hamburguesa desplegable (capa flotante que no
  mueve el timer) con los 4 paneles de configuración en modo acordeón (uno
  abierto a la vez).

## Cómo funciona el timer

El estado del timer vive en un `useReducer` (`src/hooks/useTimer.js`), no en
varios `useState` sueltos — esto evita un bug real que tuvimos con
`setState` anidados con efectos secundarios (React puede invocarlos más de
una vez y duplicaba el conteo de sesiones).

Reglas del ciclo:

1. Presionas **Iniciar** en Enfoque → arranca la cuenta regresiva y se
   pinta el punto de esa sesión. Si solo estás reanudando después de una
   pausa, no se pinta un punto nuevo.
2. Al llegar a 0:00, el timer **se pausa solo**, suena la alarma
   correspondiente, y el botón vuelve a decir "Iniciar" con el título
   actualizado (Descanso corto / Descanso largo / Enfoque). Nunca avanza
   solo a la siguiente fase — siempre esperas tu click.
3. Cada 4ta sesión de enfoque, el descanso es **largo** en vez de corto.
4. Al terminar el descanso largo, los puntos se resetean a cero.
5. **Saltar** fuerza la misma transición sin sonar la alarma (es una acción
   manual, no una notificación).

## Stack técnico

| Pieza | Herramienta | Por qué |
|---|---|---|
| Framework UI | [React 19](https://react.dev) + [Vite](https://vite.dev) | HMR rápido, ecosistema grande, fácil de desplegar gratis (Vercel/Netlify) |
| Estilos | [Tailwind CSS v4](https://tailwindcss.com) | utility-first, variables CSS (`--tone-*`, `--accent`) para el tema claro/oscuro dinámico |
| Backend / datos | [Supabase](https://supabase.com) (free tier) | Auth + Postgres + Storage sin tener que mantener un servidor propio |
| Tests | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) | mismo motor que Vite, rápido, API familiar de React Testing Library |
| Lint | [oxlint](https://oxc.rs) | rápido, ya vinculado al template de Vite |
| Audio de alarmas | Web Audio API (nativo) | tonos sintetizados en el navegador, cero archivos, cero licencias |
| Música | iframes oficiales de Spotify/YouTube | sin SDK, sin OAuth, sin restricción de cuenta Premium |
| Gestor de paquetes | [pnpm](https://pnpm.io) | — |

Sin backend propio: todo lo que no es estático corre contra la API pública
de Supabase directamente desde el navegador, protegido por Row Level
Security (RLS).

## Estructura del proyecto

```
src/
├─ App.jsx                 Orquesta hooks + layout general
├─ components/              Un componente por responsabilidad, cada uno con su .test.jsx
│  ├─ Timer.jsx              Dial del timer (SVG con marcas, aro de progreso, puntos de ciclo)
│  ├─ MenuDropdown.jsx       Menú hamburguesa: acordeón con los 4 paneles, capa flotante
│  ├─ PanelToggleButton.jsx  Botón "pastilla" reutilizable para abrir/cerrar un panel
│  ├─ PanelContent.jsx       Wrapper con animación de expandir/colapsar (CSS grid-rows)
│  ├─ SettingsPanel.jsx      Duraciones de enfoque/descansos
│  ├─ BackgroundPicker.jsx   Color / gradiente / imagen (pool default + subida propia)
│  ├─ AlarmPanel.jsx         Selección de sonido + volumen
│  ├─ MusicPanel.jsx         Input de link + embed de Spotify/YouTube
│  └─ AuthPanel.jsx          Login/signup/logout, spinner de carga, indicador de error de sync
├─ hooks/
│  ├─ useTimer.js            Máquina de estados del timer (useReducer)
│  ├─ useSettings.js         Config local (localStorage) o remota (Supabase) según sesión
│  ├─ useAuth.js             Wrapper de Supabase Auth
│  └─ useBackgroundTone.js   Calcula si el fondo actual es "claro" u "oscuro"
├─ lib/
│  ├─ alarm.js                Pool de sonidos sintetizados + reproductor (Web Audio API)
│  ├─ contrast.js             Cálculo de luminancia (color/gradiente/imagen vía canvas)
│  ├─ theme.js                Tokens de color por tono (glass claro/oscuro + acento fijo)
│  ├─ musicEmbed.js           Parser de links de Spotify/YouTube → URL de embed
│  ├─ defaultImages.js        Carga automática de src/assets/img/* como pool default
│  └─ supabaseClient.js       Cliente de Supabase (modo local si no hay .env configurado)
└─ test/setup.js              jest-dom matchers para Vitest

supabase/schema.sql          Tabla user_settings + buckets de Storage + límites, RLS
```

## Puesta en marcha

```bash
pnpm install
cp .env.example .env   # completa con tu Project URL y Publishable key de Supabase
pnpm dev
```

Sin `.env` configurado, la app funciona igual pero en **modo local**: cada
quien guarda su configuración solo en su navegador, sin cuenta ni
sincronización (no requiere Supabase para nada del resto de las
funcionalidades).

Para habilitar cuentas y sincronización:

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. Copia la **Project URL** y la **Publishable key** (antes llamada "anon
   key") desde *Project Settings → API* a tu `.env`.
3. Corre el contenido completo de `supabase/schema.sql` en el SQL Editor
   del proyecto. Es seguro volver a correrlo si agregamos columnas nuevas
   más adelante (usa `add column if not exists`).

## Scripts disponibles

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con HMR |
| `pnpm build` | Build de producción a `dist/` |
| `pnpm preview` | Sirve el build de producción localmente |
| `pnpm test` | Corre toda la suite de tests una vez |
| `pnpm test:watch` | Tests en modo watch |
| `pnpm lint` | oxlint sobre todo el proyecto |

## Tests

84 tests en 15 archivos (Vitest + React Testing Library + jsdom), cubriendo:

- **Lógica pura**: máquina de estados del timer (`useTimer`), cálculo de
  contraste (`contrast.js`), parseo de links de Spotify/YouTube
  (`musicEmbed.js`), pool de sonidos (`alarm.js`).
- **Sincronización**: `useSettings` — modo local, modo con cuenta, migración
  de configuración a una cuenta nueva, y que los errores de Supabase se
  reporten en vez de fallar en silencio.
- **Componentes**: interacción de cada panel (cambiar valores, subir
  imágenes, seleccionar sonido, guardar un link), el acordeón del menú
  (un panel abierto a la vez, cierre al hacer click afuera), y el flujo de
  login/signup (spinner de carga, mostrar/ocultar contraseña, indicador de
  error de sincronización).

Las llamadas a Supabase se mockean en los tests (no pegan contra una base
real). El Web Audio API y los `fetch`/`Image` de canvas también se evitan o
se prueban con manejo defensivo, ya que jsdom no los implementa.

## Límites y decisiones de diseño

- **Pool de imágenes**: subida propia limitada a 2MB por archivo y 10
  imágenes por cuenta, reforzado en la base de datos (trigger + política de
  bucket en `schema.sql`), no solo en el frontend — así nadie puede
  saturar el Storage aunque se salte la UI.
- **Alarmas sintetizadas, no archivos de audio**: evita tener que elegir y
  alojar sonidos con licencia. Si más adelante se prefieren grabaciones
  reales, `playAlarm` en `src/lib/alarm.js` es el único lugar a cambiar.
- **Música por iframe, no por SDK**: se eligió deliberadamente sobre el
  Spotify Web Playback SDK porque ese SDK solo reproduce audio para cuentas
  **Premium** y requiere OAuth + una app registrada en
  developer.spotify.com. El iframe embebido funciona para cualquier
  usuario, sin login.
- **Selects nativos con mejora progresiva**: los `<select>` (panel de
  Alarmas) tienen colores explícitos como base (legibles en cualquier
  navegador) y usan el estándar nuevo de `<select>` personalizable
  (`appearance: base-select`) vía `@supports` en navegadores que ya lo
  soportan, para que el desplegable combine con el estilo del resto del
  menú.

## Pendiente / ideas a futuro

- Temas visuales opcionales (cafetería, jardín, magia) — por ahora solo
  hay assets simples (color/gradiente/imagen).
- Reemplazar los sonidos sintetizados por grabaciones reales, si se
  prefiere ese estilo.
