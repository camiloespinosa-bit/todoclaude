# todoclaude

## Sitio web — CCA / El Gimnasio del Cerebro

Sitio estático (HTML/CSS/JS puro, sin build ni dependencias) para la marca CCA — El Gimnasio del Cerebro. Para verlo localmente basta con abrir `index.html` en el navegador; para publicarlo, sirve la raíz del repo en cualquier hosting estático (GitHub Pages, Netlify, Vercel, etc.).

**Páginas:**
- `index.html` — Inicio
- `fases.html` — Fases del Programa (Sensorial, Lúdica, Lógica, Crítica + Programa Adulto Vital)
- `nosotros.html` — Sobre Nosotros
- `blog/index.html` + `blog/*.html` — Blog (2 artículos iniciales)

**Estilos y assets:**
- `assets/css/style.css` — hoja de estilos compartida, con los tokens de color/tipografía oficiales de CCA (ver skill `cca-marca`)
- `assets/js/main.js` — menú móvil + año dinámico del pie de página
- `assets/img/oki/` — carpeta reservada para los SVG oficiales de Oki (ver `assets/img/oki/README.md`); mientras tanto el sitio usa un ícono genérico neutro, **nunca** una versión de Oki generada por IA

**Contacto:** WhatsApp 301 494 6120 (confirmado con Camilo el 2026-09-02; usar siempre este número, no otro).

**Pendiente:**
- Reemplazar el ícono genérico del hero por los SVG oficiales de Oki en cuanto Camilo los envíe.
- Definir si "Sobre Nosotros" incorpora la historia personal del fundador (se dejó fuera intencionalmente por tratarse de información personal/familiar sensible — ver conversación del 2026-09-02).
- Agregar fotos reales de la sede cuando estén disponibles.

## Skills instaladas

### UI/UX Pro Max

Fuente: [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (v2.13.0, MIT).

Es un plugin de Claude Code que agrupa 7 skills de inteligencia de diseño en `.claude/skills/`:

| Skill | Para qué sirve |
|---|---|
| `ui-ux-pro-max` | Skill principal: base de datos consultable de estilos UI, paletas de color, tipografías, gráficas y guías UX para 22 stacks (React, Next.js, Vue, Flutter, SwiftUI, etc). |
| `design-system` | Generación de design tokens (primitivos, semánticos, de componente) y su integración con Tailwind. |
| `ui-styling` | Componentes shadcn/ui, theming y utilidades de Tailwind, más fuentes de Google listas para usar. |
| `brand` | Gestión de identidad de marca: paleta, tipografía, voz, checklist de consistencia. |
| `design` | Generación de logos, iconos, banners y slides con motor de búsqueda propio. |
| `banner-design` | Referencia de tamaños y estilos de banners. |
| `slides` | Plantillas y patrones de copy/layout para presentaciones HTML. |

Claude Code carga automáticamente estas skills cuando la tarea implica diseño de UI/UX (páginas, componentes, paleta de color, tipografía, accesibilidad, animación, gráficas, etc.). No requieren instalación adicional ni dependencias externas más allá de Python 3.x (usado por los scripts de búsqueda).

Licencia de `ui-ux-pro-max-skill`: MIT (ver `.claude/skills/ui-ux-pro-max-skill.LICENSE`). El subdirectorio `ui-styling` incluye su propia licencia Apache 2.0 para los componentes que reutiliza.

### Skills de Emil Kowalski (animación y diseño de UI)

Fuente: [emilkowalski/skill](https://github.com/emilkowalski/skill) (MIT). Basadas en su experiencia en Vercel y Linear, y en su librería de toasts [Sonner](https://sonner.emilkowal.ski).

| Skill | Para qué sirve |
|---|---|
| `emil-design-eng` | Skill principal: filosofía de pulido de UI, diseño de componentes y decisiones de animación. |
| `animate` | Construye una animación desde cero eligiendo curva, duración y propiedades correctas. |
| `animate-expo` | Lo mismo para React Native/Expo: gestos, sheets, haptics, transiciones de pantalla. |
| `review-animations` | Revisa animaciones existentes contra reglas estrictas. |
| `improve-animations` | Audita las animaciones de todo un codebase y genera planes priorizados de mejora. |
| `find-animation-opportunities` | Encuentra dónde falta animación en una UI (y dónde NO se debe animar). |
| `animation-vocabulary` | Diccionario inverso: describe un efecto de animación y obtén su nombre exacto. |
| `apple-design` | Principios de diseño e interacción física de Apple, adaptados a la web. |
| `write-swift` | Swift moderno: value types, concurrencia Swift 6, generics, performance, testing. |
| `pick-ui-library` | Ayuda a elegir la librería de UI correcta en vez de reinventar componentes. |
| `prototype` | Genera varias versiones de una pieza de UI y las alterna con un selector. |
| `ask-sonner` | Guía de uso de Sonner (librería de toasts de Emil Kowalski). |

Licencia: MIT (ver `.claude/skills/emilkowalski-skill.LICENSE`).

### Impeccable (fluencia de diseño para agentes)

Fuente: [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (v4.1.3, MIT), de Paul Bakaus. Nace como evolución del skill `frontend-design` de Anthropic.

Se instaló la skill (`.claude/skills/impeccable`) y sus 4 subagentes (`.claude/agents/impeccable-*.md`): 23 comandos (`/impeccable polish`, `/impeccable audit`, `/impeccable critique`, `/impeccable craft`, etc.) y 61 reglas deterministas anti-patrón para diseño de UI generado por IA (fuentes sobreusadas, gradientes morado-azul genéricos, cards anidadas, texto gris sobre fondos de color, etc.).

**Nota importante:** el repo original también instala un *hook* de Claude Code (`PostToolUse` en Edit/Write + `Stop`) que ejecuta automáticamente `scripts/hook.mjs` con Node después de cada edición de archivos de UI, para correr las 61 reglas deterministas en vivo. Ese hook **no se instaló** aquí porque configurar ejecución automática de código requiere tu confirmación explícita — ver `.claude/skills/impeccable/reference/hooks.md` si quieres activarlo. Sin el hook, la skill funciona igual invocando los comandos manualmente (`/impeccable <comando> <target>`); solo se pierde la comprobación automática en cada edición.

Licencia: MIT (ver `.claude/skills/pbakaus-impeccable.LICENSE`). Los archivos `reference/ios.md` y `reference/android.md` están adaptados del proyecto `platform-design-skills` de ehmo (MIT).

### Taste Skill (librería de "gusto" para diseño frontend)

Fuente: [leonxlnx/taste-skill](https://github.com/leonxlnx/taste-skill) (v1.0.0, MIT). Colección de skills "anti-slop": evitan que el resultado se vea genérico/plantilla y aplican direcciones de diseño concretas.

| Skill | Para qué sirve |
|---|---|
| `taste-skill` (`design-taste-frontend`) | Skill principal v2: lee el brief, infiere la dirección de diseño correcta y evita interfaces con cara de plantilla. |
| `taste-skill-v1` | Versión v1 original, conservada por compatibilidad hacia atrás. |
| `gpt-tasteskill` | Motor UX/UI + GSAP avanzado: estructura AIDA, tipografía editorial ancha, bento grids, ScrollTrigger estricto. |
| `redesign-skill` | Audita un sitio/app existente, detecta patrones genéricos de IA y lo sube de nivel sin romper funcionalidad. |
| `brutalist-skill` (`industrial-brutalist-ui`) | Estética brutalista industrial: grillas rígidas, tipografía extrema, degradación analógica. Para dashboards/portafolios densos. |
| `minimalist-skill` | Interfaces editoriales limpias: monocromo cálido, bento grids planos, sin gradientes ni sombras pesadas. |
| `soft-skill` (`high-end-visual-design`) | Enseña a diseñar como agencia premium: fuentes, espaciado, sombras y estructuras de card que se ven "caras". |
| `stitch-skill` | Genera `DESIGN.md` semánticos para Google Stitch: tipografía, color y layout anti-genéricos. |
| `brandkit` | Generación de brand kits: logos, guías de marca, decks de identidad, mockups premium. |
| `image-to-code-skill` | Genera imágenes de diseño primero y luego implementa el sitio para que coincida (pensado para Codex). |
| `imagegen-frontend-web` | Genera una imagen de referencia por cada sección de una landing page (nunca comprime varias secciones en una). |
| `imagegen-frontend-mobile` | Genera conceptos de pantallas de apps móviles (iOS/Android), con mockups de teléfono. Solo genera imágenes, no código. |
| `output-skill` (`full-output-enforcement`) | Evita truncar código: fuerza salidas completas y prohíbe placeholders. |

Licencia: MIT (ver `.claude/skills/leonxlnx-taste-skill.LICENSE`).
