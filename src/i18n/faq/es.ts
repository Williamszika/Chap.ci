import type { TexteFaq } from './index'

export const faq: TexteFaq = {
  titre: 'Preguntas frecuentes',
  sous: 'Todo lo que hay que saber para comprar y vender con tranquilidad.',
  recherche: 'Buscar una pregunta…',
  aucunTitre: 'Ninguna respuesta encontrada',
  aucunTexte: 'Pruebe con otras palabras o contáctenos directamente: respondemos rápido.',
  contactTitre: '¿No encontró su respuesta?',
  contactTexte: 'Nuestro equipo está para ayudarle. Escríbanos y le responderemos rápidamente.',
  contactBouton: 'Contáctenos',
  sections: [
    {
      titre: 'General',
      items: [
        {
          q: '¿Qué es Chap.ci?',
          r: 'Chap.ci es el sitio de anuncios clasificados 100 % marfileño. Compre y venda chap-chap (rápido) en toda Costa de Marfil: coches, teléfonos, inmuebles, moda, alimentación, servicios y mucho más.',
        },
        {
          q: '¿Es gratuito?',
          r: 'Sí: la inscripción, la publicación de anuncios y la mensajería son totalmente gratuitas. Puede apoyar la plataforma con una donación por Mobile Money si lo desea, pero nada es obligatorio.',
        },
        {
          q: '¿Tengo que instalar una aplicación?',
          r: 'No. Chap.ci funciona en su navegador, en teléfono, tableta y ordenador. También puede añadirlo a su pantalla de inicio para usarlo como una aplicación: iPhone (Safari → Compartir → « Añadir a pantalla de inicio ») o Android (Chrome → menú ⋮ → « Instalar aplicación »).',
        },
        {
          q: 'El sitio, la instalación en mi teléfono y la aplicación, ¿son lo mismo?',
          r: 'Sí, es el mismo Chap.ci, con los mismos anuncios y la misma cuenta. Tres formas de acceder: el sitio, en su navegador; la instalación en la pantalla de inicio, que le da un icono como una aplicación real sin descargar nada; y la aplicación Android, en preparación en Play Store. Mientras llega, la instalación desde el sitio es más rápida y consume menos datos, y recibe las novedades sin esperar una actualización.',
        },
        {
          q: '¿En qué ciudades funciona Chap.ci?',
          r: 'En toda Costa de Marfil. Puede filtrar los anuncios por distrito, región, ciudad y comuna: de Abiyán a Bouaké, San-Pédro, Yamusukro, Korhogo…',
        },
      ],
    },
    {
      titre: 'Mi cuenta',
      items: [
        {
          q: '¿Cómo creo una cuenta?',
          r: 'Haga clic en « Conexión / Crear una cuenta » e inscríbase con su correo, su teléfono o con Google/Apple. Es gratuito e inmediato.',
        },
        {
          q: '¿Por qué debo crear una cuenta para publicar un anuncio?',
          r: 'Una cuenta permite a los compradores identificarle y escribirle con confianza, y limita los perfiles falsos y los anuncios fraudulentos. Crearla es gratuito y toma menos de un minuto. Para comprar o escribir a un vendedor, en cambio, no se pide ninguna cuenta.',
        },
        {
          q: 'Olvidé mi contraseña, ¿qué hago?',
          r: 'En la página de conexión, haga clic en « ¿Olvidó su contraseña? » y siga las instrucciones recibidas por correo para elegir una nueva.',
        },
        {
          q: '¿Cómo elimino mi cuenta?',
          r: 'Vaya a Cuenta → Ajustes → Eliminar mi cuenta. Se pide una confirmación con contraseña. La eliminación es definitiva: sus anuncios y datos se borran.',
        },
        {
          q: '¿Cómo protejo mi cuenta?',
          r: 'Active la doble autenticación (2FA) desde Cuenta → Ajustes y no comparta nunca su contraseña. Chap.ci nunca le pedirá su contraseña por mensaje.',
        },
      ],
    },
    {
      titre: 'Comprar',
      items: [
        {
          q: '¿Cómo contacto a un vendedor?',
          r: 'Abra el anuncio y haga clic en « Contactar al vendedor ». Conversa por la mensajería integrada, sin revelar su número de teléfono.',
        },
        {
          q: '¿Puedo negociar el precio?',
          r: 'Sí, si el anuncio indica « negociable ». Proponga su precio con cortesía en la mensajería. Sea amable: un buen intercambio suele cerrar un buen negocio.',
        },
        {
          q: '¿Cómo pago con seguridad?',
          r: 'Prefiera el pago contra entrega o la entrega en mano en un lugar público. Verifique siempre el artículo antes de pagar. Evite enviar dinero por adelantado a una persona que no conoce.',
        },
        {
          q: '¿Cómo funciona la entrega?',
          r: 'La entrega se acuerda directamente entre usted y el vendedor en la mensajería: entrega en mano (idealmente en un lugar público y concurrido) o envío si el vendedor lo indicó en el anuncio (insignia « Entrega »). Acuerden de antemano el lugar, la hora y los eventuales gastos de envío. Chap.ci no asegura el transporte y no es parte de la transacción: prefiera pagar en el momento de la entrega.',
        },
        {
          q: '¿Cómo confirmo una compra y dejo una reseña?',
          r: 'Como la transacción se hace de mano a mano (Mobile Money, efectivo…), es usted quien la confirma. En la conversación con el vendedor: pulse « He comprado » y luego « Bien recibido » cuando tenga el artículo. Entonces puede calificar al vendedor ⭐. El vendedor, por su parte, puede calificarle como comprador. Si lo olvida, le enviamos un pequeño recordatorio por correo.',
        },
        {
          q: '¿Cómo guardo una búsqueda para recibir avisos?',
          r: 'En el explorador, ajuste sus filtros y haga clic en « Crear una alerta ». Recibirá un correo en cuanto un nuevo anuncio coincida. Encuentre sus alertas en Cuenta → Ajustes → Mis alertas.',
        },
      ],
    },
    {
      titre: 'Vender',
      items: [
        {
          q: '¿Cómo publico un anuncio?',
          r: 'Haga clic en Publicar, añada fotos, elija la categoría, complete el título, el precio y la descripción, y publique. El formulario se adapta a la categoría (marca, año, superficie…) para anuncios más precisos.',
        },
        {
          q: '¿Cuántas fotos puedo añadir y cómo lograrlas bien?',
          r: 'Se exigen al menos tres fotos para publicar, y cinco como máximo. Tómelas usted mismo, con buena luz y desde distintos ángulos: eso distingue un anuncio real de uno copiado, y evita discusiones cuando el comprador llega. Muestre los defectos si los hay: inspira más confianza que ocultarlos. La primera foto sirve de portada y atrae a muchos más compradores. Las imágenes se optimizan automáticamente al enviarlas.',
        },
        {
          q: '¿Cómo modifico, oculto o elimino mi anuncio?',
          r: 'Desde Cuenta → Mis anuncios, cada anuncio puede modificarse, ocultarse (pausa sin eliminarlo) y volver a mostrarse, o eliminarse definitivamente.',
        },
        {
          q: '¿Cómo vendo más rápido?',
          r: 'Ponga un precio justo, una descripción honesta y completa, buenas fotos, y responda rápido a los mensajes. Un vendedor reactivo y bien calificado inspira confianza y cierra más rápido.',
        },
      ],
    },
    {
      titre: 'Seguridad y confianza',
      items: [
        {
          q: '¿Cómo evito las estafas?',
          r: 'No pague nunca por adelantado a un desconocido, desconfíe de los precios anormalmente bajos, reúnase en un lugar público, verifique el artículo antes de pagar y mantenga sus intercambios en la mensajería de Chap.ci. Ante la duda, no siga adelante.',
        },
        {
          q: '¿Cómo señalo un anuncio o un usuario sospechoso?',
          r: 'En cada anuncio, use el botón « Señalar » e indique el motivo. Nuestro equipo de moderación examina los avisos. Un anuncio muy señalado se oculta automáticamente a la espera de verificación.',
        },
        {
          q: '¿Qué hago en caso de conflicto con un comprador o un vendedor?',
          r: 'Primero mantenga la calma y todo el intercambio en la mensajería de Chap.ci (sirve de prueba). Intente llegar a un acuerdo amistoso. Si la persona no cumple sus compromisos, señale el anuncio o el perfil y escríbanos a contact@chap.ci con los detalles. Chap.ci es un intermediario técnico y no es parte de la transacción: no podemos reembolsar, pero sí sancionar a un miembro de mala fe. En caso de estafa comprobada, presente denuncia ante la PLCC (plataforma marfileña de lucha contra la ciberdelincuencia).',
        },
        {
          q: '¿Para qué sirven las reseñas?',
          r: 'Tras una transacción, el comprador puede dejar una reseña al vendedor. Las reseñas verificadas ayudan a toda la comunidad a comprar con confianza. Un buen historial de reseñas valoriza su perfil de vendedor.',
        },
      ],
    },
    {
      titre: 'Pago y donación',
      items: [
        {
          q: '¿Qué medios de pago se aceptan?',
          r: 'Los pagos se hacen directamente entre comprador y vendedor, generalmente por Mobile Money (Orange Money, MTN MoMo, Wave), en efectivo contra entrega o en mano. Chap.ci no cobra nada por sus ventas.',
        },
        {
          q: '¿Cómo apoyar a Chap.ci?',
          r: 'Chap.ci es gratuito e independiente. Puede apoyarnos con una donación por Mobile Money desde la página « Hacer una donación ». Gracias a quienes ayudan a la plataforma a crecer 🇨🇮',
        },
      ],
    },
  ],
}
