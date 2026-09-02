# todoclaude

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
