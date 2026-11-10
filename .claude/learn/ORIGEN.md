Adaptación para Claude Code del sistema de aprendizaje https://github.com/amosblomqvist/learn
(commit 7cfd894), creado por Amos Blomqvist para el agente `pi`.

El repo original no publica licencia, así que aquí NO se copia su código ni su texto:
se reescribieron en español las ideas (los dos principios y el proceso sondear → planear → enseñar)
usando las herramientas de Claude Code.

Instalado:
- .claude/skills/teach/SKILL.md  (la skill principal)
- .claude/agents/researcher.md   (subagente de verificación con WebSearch/WebFetch)

No incluido (depende de extensiones TypeScript de `pi` que no funcionan en Claude Code):
- extensión quiz           -> reemplazada por AskUserQuestion + corrección en el chat
- extensión ask-user-question -> reemplazada por AskUserQuestion
- extensión md-log (bitácora en Obsidian)
- visual-tools, mermaid-maker, svg-maker -> reemplazados por bloques mermaid o un Artifact
