<p align="center">
  <a href="https://journione.ai/"><img src="assets/journione-lockup.svg" alt="JourniOne" width="360"></a>
</p>

# JourniOne · Travel Journal Creator

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · **[Español](README.es.md)** · [한국어](README.ko.md) · [Français](README.fr.md) · [العربية](README.ar.md)

**Convierte los lugares que sueñas visitar en un viaje que puedas hacer realidad.**

[Sitio web](https://journione.ai/) · [Instalación](INSTALL.md) · [Ejemplos](EXAMPLES.md) · [Preguntas frecuentes](FAQ.md)

Empieza con una idea. JourniOne te ayuda a organizar cada día, encontrar hoteles que encajen con tu ruta y presupuesto, y reunirlo todo en un **Travel Journal: una guía de viaje interactiva**, bonita, explorable y fácil de compartir, como un libro que puedes hojear. Dedica menos tiempo a recopilar consejos, conoce mejor tu destino y aprovecha más tu presupuesto.

![Portadas de guías de Tokio, Pekín, Gold Coast, Maldivas y otros destinos](assets/readme/journione-travel-journal-covers.webp)

## De una idea a un plan que puedes seguir

Cuéntale a JourniOne adónde quieres ir, qué te gusta y con quién viajas, o comparte un itinerario, fotos y notas. Organiza rutas diarias según tus intereses y ritmo, comprueba lugares y transportes clave, y combina visitas, comidas, desplazamientos y descanso.

![Funciones de planificación: fuentes, hoteles, vuelos y contenido de viaje explorable](assets/readme/journione-planning-features.webp)

Cuando confirmas el plan, se convierte en una guía visual cuyos detalles puedes explorar como en un cuaderno de viaje. En la **vista Journal** encuentras imágenes, textos y planes diarios; en la **vista Map**, lugares y rutas. Abre un lugar para saber más. Conoce el destino antes de salir y consulta lo que viene después durante el viaje.

![Vista Map de Sichuan occidental junto al itinerario diario](assets/readme/journione-map-itinerary.webp)

*Consulta la ubicación de los lugares junto con las actividades y el transporte de cada día.*

Puedes preparar la ruta sin haber elegido fechas ni reservado vuelos u hoteles. Ajústala cuando quieras y, cuando estés listo, di: «Crea la guía con esta versión».

## Compara tarifas de hotel y reserva el alojamiento adecuado

Mediante **TourMind, el servicio de búsqueda y reserva de hoteles**, JourniOne consulta tarifas agregadas de más de 100 canales hoteleros de todo el mundo, incluidos Ctrip, Fliggy, Meituan, Tongcheng, Qunar, Agoda, Expedia y Booking.com. Compara precios en tiempo real de los canales disponibles según tu ruta, preferencias y presupuesto.

La comparación incluye tipo de habitación, comidas, impuestos, cancelación y disponibilidad, además del precio. Las recomendaciones explican por qué encaja el hotel, cuánto cuesta en total y qué revisar antes de reservar. La cobertura, los precios y el inventario dependen de los resultados de cada búsqueda.

Tras elegir un hotel, puedes continuar la reserva a través de un canal compatible. Revisa la habitación, el importe y las condiciones, y completa la autenticación y el pago requeridos; el estado final depende de la confirmación de la reserva. La plataforma y el proveedor correspondientes prestan el servicio según lo acordado. Los cambios, cancelaciones y la atención posventa se rigen por las condiciones de la habitación y la reserva elegidas.

Si necesitas vuelos, JourniOne también puede buscarlos mediante **Kiwi.com** e integrar horarios, traslados al aeropuerto y alojamiento en el mismo itinerario. Solo busca hoteles y vuelos cuando los necesitas. Crear la guía o seleccionar una opción provisional no genera una reserva.

![Panel Bookings con hoteles, vuelos y costes junto a la guía de Sichuan occidental](assets/readme/journione-hotel-flight-bookings.webp)

*Hoteles y vuelos se integran en la misma guía. Los precios y estados de la captura solo ilustran la interfaz.*

## Comparte tus ideas de viaje

Envía la guía, las tarjetas del itinerario o un enlace a tus amigos, o publícalos en redes sociales. Los demás podrán disfrutar de tu idea, entender qué hacer cada día y ver dónde está cada lugar: un punto de partida para planear juntos o inspirar otro viaje.

![Guía ilustrada de Sichuan occidental con resumen del destino y experiencias destacadas](assets/readme/journione-journal-overview.webp)

*Una guía visual que se puede explorar ayuda a tus amigos a entender la ruta y sus atractivos.*

Los enlaces del viaje pueden verse sin iniciar sesión. Al iniciar sesión puedes guardar tu propio diario, seguir ajustándolo y compartirlo desde la página. Las rutas diarias de Google Maps muestran los lugares en orden. Consulta la página para ver la presentación real de imágenes y mapas.

Antes de compartir, elimina los datos personales, fotos y contenidos de documentos que no quieras publicar. Quien tenga el enlace público podría acceder a su contenido. Consulta [Privacidad y uso compartido](PRIVACY.md).

## Cómo empezar

1. Importa [JourniOne-Planning-Skills](https://github.com/JourniOne-ai/JourniOne-Planning-Skills) desde el gestor de Skills de tu cliente o utiliza un paquete siguiendo la [guía de instalación](INSTALL.md). El nombre visible es **Travel Journal Creator**.
2. El agente de instalación comprueba y prepara las dependencias obligatorias: **TourMind Hotel Skill** y **Kiwi MCP**. Reutiliza lo que ya esté disponible y solo te avisa si necesita permiso, una acción manual o una recarga. La inicialización termina cuando el cliente puede detectar ambas.
3. Expresa tus necesidades de viaje sin escribir el nombre del Skill. Explora opciones y planes diarios, ajústalos y confirma cuándo crear la guía. Consulta y reserva servicios según los necesites.

Crear una guía no requiere un token de JourniOne ni un servicio local de JourniOne MCP. La conexión predeterminada es [journione.ai](https://journione.ai/). Los scripts incluidos requieren Node.js 22 o posterior; el cliente necesita búsqueda web, lectura de archivos, peticiones HTTPS y soporte de MCP remoto. La autenticación para reservas y pagos sigue las reglas del canal correspondiente. Consulta [Dependencias](DEPENDENCIES.md).

## Prueba a decir

> Quiero pasar cuatro días en Tokio. Me gustan el jazz y pasear por barrios, pero no quiero un concierto cada día. Primero dame dos opciones; decidiré las fechas después.

> Haz este itinerario de Kioto más relajado, conserva las actividades reservadas y busca hoteles bien comunicados, con cancelación gratuita y adecuados para la ruta.

> Compara el precio total y la cancelación de las habitaciones disponibles en estos hoteles. Recomienda la que mejor me encaje, pero todavía no reserves.

> Crea la guía con esta versión. Quiero enviarla a mis amigos para ver juntos qué haremos cada día.

Más situaciones en [Ejemplos](EXAMPLES.md).

## Versión y ayuda

Versión del paquete: **1.0.1**. La [lista de comprobación del lanzamiento](RELEASE-CHECKLIST.md) recoge la preparación del paquete y las verificaciones históricas en línea. Las comprobaciones fechadas reflejan aquel momento, no el estado actual del servicio. Los resultados de creación, búsqueda y reserva dependen de las respuestas de cada servicio.

[Preguntas frecuentes](FAQ.md) · [Cambios](CHANGELOG.md) · [Dependencias](DEPENDENCIES.md) · [Instrucciones para el agente](SKILL.md)
