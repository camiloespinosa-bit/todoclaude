# PRD v1: App de la canasta familiar (nombre por definir)

**Versión:** 1.0 (borrador)
**Fecha:** 20 de noviembre de 2026
**Ciudad piloto:** Rionegro, Antioquia

Convención de este documento:
- **[CONFIRMADO]** lo dijo el fundador.
- **[RECOMENDACIÓN]** propuesta mía, discutible.
- **[POR VALIDAR]** suposición que hay que probar con datos reales antes de darla por cierta.

---

## 1. El problema

Una familia planea gastar entre $300.000 y $350.000 en el mercado y termina gastando $500.000, sin saber bien en qué se fue la diferencia. **[CONFIRMADO, caso real del fundador, noviembre de 2026]**

Hay dos problemas mezclados, y conviene separarlos:

1. **Falta de claridad del gasto:** "no sé en qué se me fue la plata del mercado este mes".
2. **Falta de información de precios:** "no sé en qué supermercado está más barato lo que necesito, ni dónde hay descuento hoy".

**[RECOMENDACIÓN]** El problema 1 lo puede resolver la app desde el primer usuario, sin depender de nadie más. El problema 2 necesita que muchas personas suban precios (efecto de red). Por eso el MVP debe arrancar por el 1 y usar esos mismos datos para alimentar el 2.

## 2. Usuario objetivo

**Persona principal [CONFIRMADO]:** madre (o padre) cabeza de familia que cuida el dinero, hace el mercado mensual en cadenas de supermercado, tiene smartphone y quiere claridad sobre cuánto gasta en la canasta familiar.

- Perfil: profesional o con ingresos estables, compra en cadenas, no en tiendas de barrio ni plazas.
- Momento de dolor: al pagar en caja y ver un total mayor al esperado, y a fin de mes al revisar cuentas.

**[POR VALIDAR]** Cuánto ahorro real logra una familia comparando precios entre cadenas. No tenemos ese dato. Lo mediremos con los primeros usuarios.

## 3. Propuesta de valor

> "Sabe en qué se va tu plata del mercado, y dónde te sale más barato."

Narrativa de marca **[CONFIRMADO]:** ayudar a resolver una necesidad básica (alimentarse) de forma más inteligente. Base de la pirámide de Maslow. Sirve como historia de marca; las métricas del producto son las de la sección 9.

## 4. Alcance del piloto

| Tema | Decisión |
|---|---|
| Ciudad | Rionegro, Antioquia **[CONFIRMADO]** |
| Tiendas | Solo cadenas de supermercado **[CONFIRMADO]** |
| Cadenas iniciales | "El Euro" y "Supermu" (nombres por confirmar, ver preguntas abiertas) |
| Tiendas de barrio y plazas | Fuera de alcance **[CONFIRMADO]** |
| Plataforma | Web app instalable en el celular (PWA) **[CONFIRMADO / RECOMENDACIÓN]** |

## 5. Funcionalidades

### 5.1 MVP (meses 0 a 3)

1. **Escanear la tirilla de compra.** La usuaria toma foto de la factura; la IA lee productos, cantidades, precios, supermercado y fecha.
   - Valor individual: ve su gasto organizado por categoría (granos, aseo, lácteos, carnes, etc.).
   - Valor colectivo: cada tirilla aporta decenas de precios reales y verificables a la base de datos.
2. **Presupuesto del mercado.** Define cuánto quiere gastar al mes y la app le muestra cuánto lleva y cuánto le queda.
3. **Resumen mensual.** "Este mes gastaste $500.000; $120.000 en carnes, 30% más que el mes pasado". Responde directamente la pregunta "¿en qué se me fue la plata?".
4. **Foto de góndola con descuento.** La usuaria fotografía un producto o una oferta en góndola y la publica para la comunidad.
5. **Consulta de precios.** Buscar un producto y ver el último precio reportado en cada cadena de Rionegro, con fecha y nivel de confianza.
6. **Notificaciones push de ofertas.** "El arroz que compras bajó en tal supermercado". En iPhone, las notificaciones de web apps funcionan cuando la app se agrega a la pantalla de inicio (soportado desde iOS 16.4; verificar comportamiento actual antes de construir).

### 5.2 Fase 2 (meses 3 a 6)

- Lista de mercado inteligente: "tu lista completa sale más barata en X".
- Puntos y recompensas por subir tirillas y fotos validadas.
- Referencias de precios del DANE (sistema SIPSA de precios mayoristas de alimentos) para que la usuaria tenga contexto. Verificar cobertura de Rionegro y condiciones de uso de los datos antes de integrar.
- Historial de precios por producto (¿subió o bajó este mes?).

### 5.3 Fase 3 (6 meses en adelante)

- Portal para marcas y productores (arroz, pasta, etc.) que quieran publicar descuentos dirigidos.
- Acuerdos con supermercados.
- Informes de datos agregados y anonimizados (ver sección 8).

## 6. Calidad de los datos de precios

| Fuente | Confianza | Cómo se valida |
|---|---|---|
| Tirilla de compra | Alta | Es un documento de compra real; la IA verifica que el total coincida con la suma de ítems |
| Foto de góndola | Media | Se confirma cuando 2 o más usuarias reportan el mismo precio en la misma tienda **[CONFIRMADO]** |
| Reporte manual | Baja | Solo se muestra marcado como "sin confirmar" |

Reglas **[RECOMENDACIÓN]**:
- Todo precio muestra su fecha. Después de 7 días se marca "puede estar desactualizado" (plazo **[POR VALIDAR]**).
- Reputación por usuaria: quien sube datos que otros confirman gana confianza; quien sube datos falsos la pierde.

## 7. Tecnología propuesta [RECOMENDACIÓN]

Construida con IA como herramienta de desarrollo y con IA dentro del producto (lectura de tirillas y fotos).

- **Frontend:** web app instalable (PWA).
- **Backend y base de datos:** un servicio con capa gratuita para el piloto (por ejemplo Supabase o Firebase; revisar límites actuales de sus planes gratuitos).
- **Lectura de tirillas:** modelo de IA con visión. Costo por tirilla **[POR VALIDAR]**: hay que medirlo con 20 tirillas reales antes de prometer que el piloto es gratis de operar.
- **Notificaciones:** Web Push.

**Nota sobre "app nativa":** una web app y una app nativa (de App Store / Play Store) son cosas distintas. Para el piloto recomiendo web app: no paga tiendas de aplicaciones, se actualiza al instante y se construye más rápido. Si funciona, se empaqueta como nativa después.

## 8. Legal y privacidad

Esto es crítico porque la confianza es la base del producto **[CONFIRMADO]**. No soy abogado; esta sección debe revisarla un abogado colombiano antes de lanzar.

- **Ley 1581 de 2012 (protección de datos personales) y su Decreto 1377 de 2013.** Exigen autorización previa, expresa e informada para tratar datos personales, con finalidades claras. La autoridad es la Superintendencia de Industria y Comercio (SIC).
- **Venta de datos:** vender datos personales identificables sin autorización expresa no es viable legalmente y destruiría la confianza. Lo que sí se puede plantear: **informes agregados y anonimizados** (por ejemplo, "en Rionegro el precio promedio del arroz subió 4%"), con autorización clara en los términos de uso.
- **Tirillas:** algunas facturas electrónicas incluyen nombre o cédula del comprador. La app debe descartar esos datos al procesar la imagen y no guardar la foto original más tiempo del necesario.
- **Fotos dentro del supermercado:** algunas cadenas no permiten fotografiar. Hay que informar a las usuarias y priorizar la tirilla, que se fotografía en casa.
- **Política de privacidad y términos de uso** obligatorios desde el día 1.

## 9. Métricas de éxito

| Plazo | Meta | Definición |
|---|---|---|
| 3 meses | 100 usuarias activas **[CONFIRMADO]** | Activa = subió al menos 1 tirilla en los últimos 30 días **[RECOMENDACIÓN]** |
| 6 meses | Uso recurrente **[CONFIRMADO]** | Al menos 40% de las usuarias del mes 3 siguen activas en el mes 6 (cifra **[POR VALIDAR]**) |
| Continuo | Cobertura de precios | Número de productos con precio de menos de 7 días en cada cadena piloto |
| Continuo | Valor percibido | Usuarias que dicen que la app les ayudó a gastar menos o a entender su gasto (encuesta) |

## 10. Modelo de negocio

Fuentes de ingreso mencionadas **[CONFIRMADO]**: publicidad, suscripción premium, venta de datos agregados, comisiones de tiendas, pauta de productores (arroz, pasta, etc.).

**[RECOMENDACIÓN]** No todas al tiempo. Orden sugerido:

1. **Meses 0 a 6: gratis para la usuaria.** El objetivo es confianza y datos, no ingresos. Monetizar antes ahuyenta a las primeras 100.
2. **Cuando haya datos suficientes:** descuentos patrocinados de marcas y productores (la marca paga por llevar compradoras a un producto en un supermercado). Es la que mejor se alinea con la usuaria, porque ella recibe un descuento real.
3. **Después:** premium (por ejemplo, presupuesto familiar avanzado, alertas ilimitadas) e informes agregados para marcas.

Ninguna de estas fuentes tiene precio ni demanda validada todavía. **[POR VALIDAR]**

## 11. Competencia

El fundador no conoce apps parecidas. Yo no tengo información verificada sobre competidores actuales en Colombia. Antes de afirmar que seríamos "la primera de la categoría", hay que hacer una búsqueda: apps de comparación de precios de supermercado, apps de finanzas personales que leen facturas, y las propias apps de las cadenas.

## 12. Riesgos principales

| Riesgo | Mitigación |
|---|---|
| Nadie sube datos (arranque en frío) | La tirilla da valor individual inmediato, sin depender de otros |
| Precios falsos o viejos | Validación cruzada, fecha visible, reputación |
| Costo de la IA por tirilla | Medirlo antes del lanzamiento |
| Supermercados que prohíben fotos | Priorizar la tirilla |
| Problemas legales con datos | Revisión de abogado, solo datos agregados y anonimizados |
| Fundador sin presupuesto ni equipo | Alcance mínimo, herramientas gratuitas, piloto en una sola ciudad |

## 13. Plan de los primeros 30 días [RECOMENDACIÓN]

1. Recoger 20 tirillas reales de familiares y conocidos en Rionegro (sin construir nada todavía) y probar si la IA las lee bien.
2. Entrevistar a 10 madres de familia: ¿les pasa lo mismo que a ustedes? ¿subirían su tirilla?
3. Definir nombre y política de privacidad básica.
4. Construir el MVP mínimo: escanear tirilla + presupuesto + resumen mensual.
5. Lanzar con 10 a 20 usuarias conocidas antes de buscar las 100.

## 14. Preguntas abiertas

1. ¿"El Euro" es Euro Supermercados? ¿"Supermu" cuál es exactamente?
2. ¿Qué otras cadenas hay en Rionegro donde compra el público objetivo?
3. ¿La app es para la familia completa (varias personas comparten un presupuesto) o individual?
4. ¿Cuánto tiempo semanal puede dedicarle el fundador al proyecto?
5. ¿Nombre de la app?
