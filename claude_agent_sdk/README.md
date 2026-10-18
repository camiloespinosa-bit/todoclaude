# Chief of Staff Agent (Claude Agent SDK)

Copia del notebook `claude_agent_sdk/01_The_chief_of_staff_agent.ipynb` del repositorio
[anthropics/claude-cookbooks](https://github.com/anthropics/claude-cookbooks) (licencia MIT, ver `LICENSE`),
con solo los archivos que ese notebook necesita:

- `01_The_chief_of_staff_agent.ipynb`: el tutorial.
- `chief_of_staff_agent/`: el agente (CLAUDE.md, subagentes, hooks, comandos, estilos de salida, scripts y datos de ejemplo).
- `utils/`: utilidades de visualización que importa el notebook.

## Cómo correrlo

```bash
cd claude_agent_sdk
uv venv .venv --python 3.12
uv pip install --python .venv/bin/python -r requirements.txt
cp .env.example .env   # y pon tu ANTHROPIC_API_KEY real
```

Abre el notebook con el kernel de `.venv` y ejecútalo desde esta carpeta
(el código usa `cwd="chief_of_staff_agent"`, una ruta relativa).

El SDK de agentes también necesita la CLI de Claude Code instalada en la máquina.
