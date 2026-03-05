import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import qrDefault from '../frame.png'
import './PagoQR.css'

export default function PagoQR() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const pedidoId = state?.pedidoId || null
  const total = state?.total ?? 0
  const qrUrl = state?.qrUrl || qrDefault

  return (
    <div className="pqr-page">
      <div className="pqr-wrapper">

        {/* Left: QR Section */}
        <div className="pqr-qr-section">
          <div className="pqr-qr-card">
            <div className="pqr-qr-frame">
              {qrUrl ? (
                <img src={qrUrl} alt="QR de pago" className="pqr-qr-img" />
              ) : (
                <div className="pqr-qr-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" /><rect x="18" y="18" width="3" height="3" /></svg>
                  <span>QR pendiente</span>
                </div>
              )}
            </div>
            <div className="pqr-payment-methods">
              <span className="pqr-method-label">Escanea con</span>
              <div className="pqr-methods">
                <img src="https://logosenvector.com/logo/img/yape-37283.png" alt="Yape" />
                <img src="https://images.seeklogo.com/logo-png/38/1/plin-logo-png_seeklogo-386806.png" alt="Plin" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Details Section */}
        <div className="pqr-details-section">
          <div className="pqr-header">
            <div className="pqr-icon-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <h1 className="pqr-title">Realizar pago</h1>
            <p className="pqr-subtitle">Escanea el código QR con tu app de pagos para completar la compra</p>
          </div>

          <div className="pqr-total-box">
            <span className="pqr-total-label">Total a pagar</span>
            <span className="pqr-total-amount">S/ {Number(total).toFixed(2)}</span>
          </div>

          {pedidoId && (
            <div className="pqr-order-ref">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <span>Pedido #{pedidoId}</span>
            </div>
          )}

          <div className="pqr-steps">
            <h3 className="pqr-steps-title">Pasos para confirmar</h3>
            <div className="pqr-step">
              <div className="pqr-step-num">1</div>
              <div className="pqr-step-text">
                <strong>Escanea y paga</strong>
                <span>Abre Yape o Plin, escanea el QR y realiza el pago por el monto exacto.</span>
              </div>
            </div>
            <div className="pqr-step">
              <div className="pqr-step-num">2</div>
              <div className="pqr-step-text">
                <strong>Envía la captura</strong>
                <span>Envía tu comprobante de pago por WhatsApp o correo electrónico.</span>
              </div>
            </div>
            <div className="pqr-step">
              <div className="pqr-step-num">3</div>
              <div className="pqr-step-text">
                <strong>Confirmación</strong>
                <span>Recibirás la confirmación del pago y los detalles de envío.</span>
              </div>
            </div>
          </div>

          <div className="pqr-contact-channels">
            <a href="https://wa.me/51987654321" target="_blank" rel="noreferrer" className="pqr-contact-btn pqr-whatsapp">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.111.546 4.095 1.505 5.822L0 24l6.331-1.463A11.928 11.928 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.886 0-3.63-.506-5.145-1.387l-.369-.219-3.826.884.955-3.486-.24-.38C2.33 15.63 1.75 13.87 1.75 12 1.75 6.34 6.34 1.75 12 1.75S22.25 6.34 22.25 12 17.66 21.75 12 21.75z" /></svg>
              WhatsApp
            </a>
            <a href="mailto:soporte@mitiendaplus.com" className="pqr-contact-btn pqr-email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              Correo
            </a>
          </div>

          <div className="pqr-actions">
            <button className="pqr-btn pqr-btn-outline" onClick={() => navigate('/pedidos')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              Mis pedidos
            </button>
            <button className="pqr-btn pqr-btn-solid" onClick={() => navigate('/')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              Seguir comprando
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
