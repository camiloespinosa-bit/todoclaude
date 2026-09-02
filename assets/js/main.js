// CCA — El Gimnasio del Cerebro
// JS mínimo: menú móvil + año dinámico del pie de página.

document.addEventListener("DOMContentLoaded", () => {
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

  document.querySelectorAll("[data-anio]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
});
