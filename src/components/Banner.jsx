import React, { useEffect, useState } from 'react';
import './Banner.css'; // Archivo CSS para los estilos

function pad(n){ return String(n).padStart(2, '0') }

export default function Banner(){
  // Default promotion duration: 5 hours from mount (user requested 5 horas)
  const DURATION_HOURS = 5
  // Start exactly at DURATION_HOURS:00:00 (in seconds) and decrement every second
  const TOTAL_START_SECONDS = DURATION_HOURS * 3600

  const [remaining, setRemaining] = useState(() => {
    const s = TOTAL_START_SECONDS
    const h = Math.floor(s/3600)
    const m = Math.floor(s/60)%60
    const sec = s%60
    return { h, m, s: sec, total: s }
  })

  useEffect(()=>{
    let total = TOTAL_START_SECONDS
    setRemaining(() => {
      const h = Math.floor(total/3600)
      const m = Math.floor(total/60)%60
      const sec = total%60
      return { h, m, s: sec, total }
    })
    const id = setInterval(()=>{
      total = Math.max(0, total - 1)
      const h = Math.floor(total/3600)
      const m = Math.floor(total/60)%60
      const sec = total%60
      setRemaining({ h, m, s: sec, total })
      if(total <= 0) clearInterval(id)
    }, 1000)
    return ()=> clearInterval(id)
  }, [])

  const { h, m, s } = remaining
  const [prev, setPrev] = useState({ h, m, s })
  const [flip, setFlip] = useState({ h:false, m:false, s:false })

  useEffect(()=>{
    if(prev.h !== h){ setFlip(f => ({ ...f, h:true })); setTimeout(()=> setFlip(f => ({ ...f, h:false })), 420) }
    if(prev.m !== m){ setFlip(f => ({ ...f, m:true })); setTimeout(()=> setFlip(f => ({ ...f, m:false })), 420) }
    if(prev.s !== s){ setFlip(f => ({ ...f, s:true })); setTimeout(()=> setFlip(f => ({ ...f, s:false })), 420) }
    setPrev({ h, m, s })
  }, [h,m,s])

  return (
    <div className="ae-banner ae-banner-with-countdown">
      <div className="ae-banner-container">
        <div className="ae-banner-content">
          <div className="ae-banner-text">
            <div className="ae-banner-subhead">
              <span className="ae-banner-subtitle">PROMOCIÓN ESPECIAL</span>
              <div className="ae-banner-decor">
                <span className="dot d1" />
                <span className="dot d2" />
                <span className="dot d3" />
              </div>
            </div>
            <h2 className="ae-banner-title">Gran Descuento 10% OFF en toda la colección Apple</h2>
            <p className="ae-banner-description">
              Increíbles descuentos en toda nuestra colección de productos tecnológicos Apple. ¡No te lo pierdas!
            </p>
            <div className="ae-banner-timer" aria-live="polite">
              <span className="ae-termina">Termina en</span>
              <div className="ae-timer ae-animated-timer">
                <div className="ae-timer-segment" aria-label={`Horas ${pad(h)}`}>
                  <span className={`ae-timer-box ae-digit animated ${flip.h ? 'flip' : ''}`}>{pad(h)}</span>
                  <small>Hrs</small>
                </div>
                <div className="ae-colon">:</div>
                <div className="ae-timer-segment" aria-label={`Minutos ${pad(m)}`}>
                  <span className={`ae-timer-box ae-digit animated ${flip.m ? 'flip' : ''}`}>{pad(m)}</span>
                  <small>Min</small>
                </div>
                <div className="ae-colon">:</div>
                <div className="ae-timer-segment" aria-label={`Segundos ${pad(s)}`}>
                  <span className={`ae-timer-box ae-digit animated pulse ${flip.s ? 'flip' : ''}`}>{pad(s)}</span>
                  <small>Seg</small>
                </div>
              </div>
            </div>
            <button className="ae-banner-button">
              Ver Ofertas
              <svg className="ae-arrow-icon" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
          <div className="ae-banner-image">
            <img 
              src="https://pedidos.com/myfotos/Pedidos-com/pagina/apple/principal.png" 
              alt="Oferta Especial 50% Off" 
              className="ae-product-image"
            />
          </div>
        </div>
      </div>
    </div>
  )
}