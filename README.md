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
