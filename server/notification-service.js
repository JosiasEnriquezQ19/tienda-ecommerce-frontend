const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.NOTIFICATION_PORT || 4001;

app.use(cors());
app.use(bodyParser.json());

// Configuración del transporter de nodemailer
let transporterConfig;

// Determinar qué servicio de correo usar basado en variables de entorno
const emailService = process.env.EMAIL_SERVICE || 'gmail';

switch (emailService.toLowerCase()) {
  case 'outlook':
  case 'hotmail':
    transporterConfig = {
      service: 'outlook',
      auth: {
        user: process.env.EMAIL_USER || 'tu_correo@outlook.com',
        pass: process.env.EMAIL_PASS || 'tu_contraseña'
      }
    };
    break;

  case 'yahoo':
    transporterConfig = {
      service: 'yahoo',
      auth: {
        user: process.env.EMAIL_USER || 'tu_correo@yahoo.com',
        pass: process.env.EMAIL_PASS || 'tu_contraseña'
      }
    };
    break;

  // Opción alternativa: SMTP genérico
  case 'smtp':
    transporterConfig = {
      host: process.env.EMAIL_HOST || 'smtp.example.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'usuario',
        pass: process.env.EMAIL_PASS || 'contraseña'
      }
    };
    break;

  // Por defecto usar Gmail
  default:
    transporterConfig = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'mitiendaplus@gmail.com',
        pass: process.env.EMAIL_PASS || 'tu_contraseña_de_aplicacion'
      }
    };
}

console.log(`Configurando servicio de correo: ${emailService}`);
const transporter = nodemailer.createTransport(transporterConfig);

// Ruta para enviar notificaciones de nuevos pedidos
app.post('/notify/new-order', async (req, res) => {
  try {
    const { pedidoId, usuarioNombre, usuarioEmail, total, items = [], direccion = {} } = req.body;
    
    if (!pedidoId) {
      return res.status(400).json({ error: 'Se requiere el ID del pedido' });
    }

    // Construir el contenido del correo
    const itemsList = items.map(item => 
      `<tr>
        <td>${item.nombre || 'Producto'}</td>
        <td>${item.cantidad}</td>
        <td>S/ ${Number(item.precio).toFixed(2)}</td>
        <td>S/ ${Number(item.precio * item.cantidad).toFixed(2)}</td>
      </tr>`
    ).join('');

    const direccionStr = direccion.calle 
      ? `${direccion.calle}, ${direccion.ciudad}, ${direccion.codigoPostal || ''}`
      : 'No disponible';

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>¡Nuevo Pedido Recibido!</h2>
        <p>Se ha recibido un nuevo pedido con la siguiente información:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p><strong>Pedido ID:</strong> ${pedidoId}</p>
          <p><strong>Cliente:</strong> ${usuarioNombre || 'Cliente'}</p>
          <p><strong>Email:</strong> ${usuarioEmail || 'No disponible'}</p>
          <p><strong>Dirección:</strong> ${direccionStr}</p>
          <p><strong>Total:</strong> S/ ${Number(total).toFixed(2)}</p>
        </div>
        
        <h3>Productos:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #007bff; color: white;">
              <th style="padding: 10px; text-align: left;">Producto</th>
              <th style="padding: 10px; text-align: left;">Cantidad</th>
              <th style="padding: 10px; text-align: left;">Precio</th>
              <th style="padding: 10px; text-align: left;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
            <tr style="background-color: #e9ecef;">
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 10px;"><strong>S/ ${Number(total).toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <p style="margin-top: 20px;">Este pedido está en estado <strong>pendiente</strong> esperando confirmación de pago.</p>
        <p>Inicia sesión en tu panel de administrador para gestionar este pedido.</p>
      </div>
    `;

    // Enviar el correo electrónico
    const mailOptions = {
      from: process.env.EMAIL_USER || 'mitiendaplus@gmail.com',
      to: process.env.NOTIFICATION_EMAIL || 'mitiendaplus@gmail.com',
      subject: `Nuevo Pedido #${pedidoId} - MiTienda`,
      html: emailContent
    };

    await transporter.sendMail(mailOptions);
    
    return res.json({ 
      success: true, 
      message: 'Notificación enviada correctamente'
    });
  } catch (err) {
    console.error('Error enviando notificación:', err);
    return res.status(500).json({ 
      error: 'Error al enviar la notificación',
      details: err.message
    });
  }
});

// Ruta para probar el servicio
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    provider: 'order-notification-service',
    emailConfigured: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS
  });
});

// Ruta para probar el envío de correos
app.get('/test-email', async (req, res) => {
  try {
    const testEmail = {
      pedidoId: 'TEST-123',
      usuarioNombre: 'Cliente de Prueba',
      total: 199.99
    };
    
    // Usa la misma plantilla de correo que la ruta principal
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">¡Hola Admin!</h2>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Tienes un pedido pendiente que requiere tu atención.
        </p>
        
        <div style="background-color: #fff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
          <p><strong>Pedido ID:</strong> ${testEmail.pedidoId}</p>
          <p><strong>Usuario:</strong> ${testEmail.usuarioNombre}</p>
          <p><strong>Monto total:</strong> <span style="color: #e63946; font-weight: bold;">S/ ${Number(testEmail.total).toFixed(2)}</span></p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Por favor confirma el pago y notifica al cliente lo antes posible.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="http://tutienda.com/admin/pedidos/${testEmail.pedidoId}" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Detalles del Pedido</a>
        </div>
        
        <p style="margin-top: 30px; font-size: 14px; color: #888; text-align: center;">
          Este es un correo de PRUEBA. No responder a este correo.
        </p>
      </div>
    `;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'mitiendaplus@gmail.com',
      to: process.env.NOTIFICATION_EMAIL || 'mitiendaplus@gmail.com',
      subject: `🧪 PRUEBA - Notificación de pedido #${testEmail.pedidoId}`,
      html: emailContent
    };
    
    await transporter.sendMail(mailOptions);
    
    return res.json({
      success: true,
      message: 'Correo de prueba enviado correctamente',
      sentTo: process.env.NOTIFICATION_EMAIL || 'mitiendaplus@gmail.com'
    });
  } catch (err) {
    console.error('Error enviando correo de prueba:', err);
    return res.status(500).json({
      error: 'Error al enviar correo de prueba',
      details: err.message
    });
  }
});

// Verificar conexión al iniciar el servicio
transporter.verify((error, success) => {
  if (error) {
    console.error('Error en la configuración del correo electrónico:');
    console.error(error);
    console.log('\n');
    console.log('SOLUCIÓN PARA GMAIL:');
    console.log('1. Asegúrate de usar una contraseña de aplicación (16 caracteres sin espacios)');
    console.log('2. Crea una en: https://myaccount.google.com/security -> Contraseñas de aplicaciones');
    console.log('3. Actualiza EMAIL_PASS en el archivo .env con esta nueva contraseña');
    console.log('\n');
    console.log('ALTERNATIVA:');
    console.log('Configura otro servicio de correo como Outlook o Yahoo en EMAIL_SERVICE');
  } else {
    console.log('Servidor de correo listo para enviar mensajes');
  }
});

app.listen(PORT, () => {
  console.log(`Servicio de notificaciones escuchando en puerto ${PORT}`);
});
