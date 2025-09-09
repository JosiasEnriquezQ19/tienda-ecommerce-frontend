# Servicio de Notificaciones por Email para Pedidos

Este servicio permite recibir notificaciones por correo electrónico cada vez que un cliente realiza un pedido en la tienda.

## Configuración

1. Instala las dependencias necesarias:
```
npm install
```

2. Configura las variables de entorno:

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
```
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion
NOTIFICATION_EMAIL=correo_donde_recibir_notificaciones@gmail.com
NOTIFICATION_PORT=4001
```

**Nota importante sobre EMAIL_PASS**: 
- Si usas Gmail, debes generar una "contraseña de aplicación" en la configuración de seguridad de tu cuenta de Google.
- No uses tu contraseña regular de Gmail, ya que no funcionará con aplicaciones menos seguras.

## Uso

Para iniciar el servicio de notificaciones:
```
npm run start-notifications
```

## ¿Cómo funciona?

1. Cuando un cliente realiza un pedido, la API envía automáticamente una notificación al servicio.
2. El servicio de notificaciones envía un correo electrónico al administrador de la tienda con los detalles del pedido.
3. El correo incluye información como:
   - ID del pedido
   - Información del cliente
   - Dirección de entrega
   - Lista de productos
   - Total a pagar

## Personalización

Puedes personalizar el contenido y formato del correo electrónico editando la función `sendOrderNotification` en `server/order-notification.js`.

## Solución de problemas

Si no recibes notificaciones por correo:

1. Verifica que el servicio esté ejecutándose (`npm run start-notifications`).
2. Comprueba las credenciales en el archivo `.env`.
3. Si usas Gmail, asegúrate de haber generado una contraseña de aplicación.
4. Revisa la consola del servidor para ver posibles errores.
