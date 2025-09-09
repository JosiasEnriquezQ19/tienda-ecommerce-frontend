import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './PagoQR.css'

export default function PagoQR(){
  const { state } = useLocation()
  const navigate = useNavigate()
  const pedidoId = state?.pedidoId || null
  const total = state?.total ?? 0
  const qrUrl = state?.qrUrl || 'https://pngimg.com/d/qr_code_PNG1.png'
  const correo = state?.correo || ''
  const telefono = state?.telefono || ''

  return (
    <div className="ae-pagoqr-container">
      <div className="ae-pagoqr-card">
        <h1>Realizar pago</h1>
        <p className="ae-pagoqr-sub">Escanea el QR con Yape o Plin y realiza el pago por el monto indicado.</p>

        <div className="ae-pagoqr-total">Total a pagar: <strong>S/ {Number(total).toFixed(2)}</strong></div>

        <div className="ae-pagoqr-logos">
          <img src="https://logosenvector.com/logo/img/yape-37283.png" alt="Yape"/>
          <img src="https://images.seeklogo.com/logo-png/38/1/plin-logo-png_seeklogo-386806.png" alt="Plin"/>
        </div>

        <div className="ae-pagoqr-qr">
          {qrUrl ? (
            <img src={qrUrl} alt="QR de pago" />
          ) : (
            <div className="ae-pagoqr-placeholder">QR pendiente (sube la imagen)</div>
          )}
        </div>

        <p className="ae-pagoqr-instr">Después de pagar, envía la captura del pago a <strong>mitiendaplus@gmail.com</strong> o por WhatsApp al <strong>987654321</strong>. Se confirmará el pago y cambiará el estado del pedido a "procesando".</p>
        
        <p className="ae-pagoqr-thanks"><strong>GRACIAS POR SU CONFIANZA</strong></p>
        <p className="ae-pagoqr-confirm">Se le enviará un mensaje de la confirmación del pago y más detalles del envío.</p>

        <div className="ae-pagoqr-actions">
          <button className="ae-btn ae-btn-secondary" onClick={() => navigate('/pedidos')}>Volver a mis pedidos</button>
          <button className="ae-btn ae-btn-primary" onClick={() => alert('Instrucciones: envía la captura del pago al correo o WhatsApp indicado.')}>He realizado el pago</button>
        </div>
      </div>
    </div>
  )
}
