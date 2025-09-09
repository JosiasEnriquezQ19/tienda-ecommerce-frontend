const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.NOTIFICATION_PORT || 4001;

app.use(cors());
app.use(bodyParser.json());

// Configuración del transporter de nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Puedes cambiar a otro servicio como 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER || 'mitiendaplus@gmail.com',  // Tu correo electrónico
    pass: process.env.EMAIL_PASS || 'tu_contraseña_de_aplicacion'  // Tu contraseña o contraseña de aplicación
  }
});

// Ruta para enviar notificaciones de nuevos pedidos
app.post('/notify/new-order', async (req, res) => {
  try {
    const { pedidoId, usuarioNombre, usuarioEmail, total, items = [], direccion = {} } = req.body;
    
    if (!pedidoId) {
      return res.status(400).json({ error: 'Se requiere el ID del pedido' });
    }

    // Simplificamos el contenido del correo, ya no necesitamos construir listas de productos

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">¡Hola Admin!</h2>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Tienes un pedido pendiente que requiere tu atención.
        </p>
        
        <div style="background-color: #fff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
          <p><strong>Pedido ID:</strong> ${pedidoId}</p>
          <p><strong>Usuario:</strong> ${usuarioNombre || 'Cliente'}</p>
          <p><strong>Monto total:</strong> <span style="color: #e63946; font-weight: bold;">S/ ${Number(total).toFixed(2)}</span></p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Por favor confirma el pago y notifica al cliente lo antes posible.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="http://tutienda.com/admin/pedidos/${pedidoId}" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Detalles del Pedido</a>
        </div>
        
        <p style="margin-top: 30px; font-size: 14px; color: #888; text-align: center;">
          Este es un mensaje automático. No responder a este correo.
        </p>
      </div>
    `;

    // Enviar el correo electrónico
    const mailOptions = {
      from: process.env.EMAIL_USER || 'mitiendaplus@gmail.com',
      to: process.env.NOTIFICATION_EMAIL || 'mitiendaplus@gmail.com',
      subject: `🔔 ¡ALERTA! Nuevo pedido pendiente #${pedidoId} - S/ ${Number(total).toFixed(2)}`,
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

app.listen(PORT, () => {
  console.log(`Servicio de notificaciones escuchando en puerto ${PORT}`);
});

