// CCA — El Gimnasio del Cerebro
// JS: menú móvil, año dinámico del pie de página, y animaciones de entrada/scroll.

// Marca el documento como "JS activo" ANTES de que el CSS de animación pueda ocultar nada:
// las reglas de entrada/revelado en style.css solo aplican bajo html.js-listo, así que sin
// JS (o si este script falla) el contenido queda siempre visible desde el primer momento.
document.documentElement.classList.add("js-listo");

document.addEventListener("DOMContentLoaded", () => {
  // ---------- Menú móvil ----------
  const boton = document.querySelector("[data-nav-toggle]");
  const enlaces = document.querySelector("[data-nav-enlaces]");

  if (boton && enlaces) {
    boton.addEventListener("click", () => {
      const abierto = enlaces.classList.toggle("abierto");
      boton.setAttribute("aria-expanded", abierto ? "true" : "false");
    });

    enlaces.querySelectorAll("a").forEach((enlace) => {
      enlace.addEventListener("click", () => {
        enlaces.classList.remove("abierto");
        boton.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---------- Año dinámico ----------
  document.querySelectorAll("[data-anio]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // ---------- Revelado al hacer scroll ----------
  // Superficie de marketing, no una app de uso diario: se dispara una sola vez por
  // elemento y respeta prefers-reduced-motion (ver skill animate).
  const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const selector = ".encabezado-seccion, .rejilla > article, .fase, .evidencia-lista li, .post-tarjeta";
  const elementos = document.querySelectorAll(selector);

  if (reducirMovimiento || !("IntersectionObserver" in window)) {
    elementos.forEach((el) => el.setAttribute("data-visible", "true"));
    return;
  }

  // Escalonado (30-80ms) por grupo de hermanos, para que una grilla de tarjetas no
  // aparezca toda de golpe.
  const contador = new Map();
  elementos.forEach((el) => {
    const padre = el.parentElement;
    const indice = contador.get(padre) || 0;
    contador.set(padre, indice + 1);
    el.style.setProperty("--retraso-revelado", `${Math.min(indice * 60, 240)}ms`);
  });

  // Nota: el objetivo tiene clip-path aplicado (así se logra el efecto de revelado),
  // y clip-path recorta también el área que IntersectionObserver mide como "visible" —
  // por eso el umbral tiene que ser 0 (cualquier solape cuenta), nunca un porcentaje;
  // con un umbral > 0 la proporción visible jamás lo alcanza y nada se revela.
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          const el = entrada.target;
          el.setAttribute("data-visible", "true");
          observador.unobserve(el);
          // clip-path recorta al ras de la caja del elemento, incluso ya revelado
          // (inset(0 0 0 0) no es "sin recorte", es "recorte exacto en el borde").
          // Eso corta cualquier cosa que sobresalga de la tarjeta, como la insignia
          // "Más popular" de Inversión. Al terminar la transición lo quitamos del
          // todo para que ese tipo de detalles vuelvan a verse completos.
          el.addEventListener(
            "transitionend",
            (ev) => {
              if (ev.propertyName === "clip-path") el.style.clipPath = "none";
            },
            { once: true }
          );
        }
      });
    },
    { threshold: 0, rootMargin: "0px 0px -80px 0px" }
  );

  elementos.forEach((el) => observador.observe(el));
});
