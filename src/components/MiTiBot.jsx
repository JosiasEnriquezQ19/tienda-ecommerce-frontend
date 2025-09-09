import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../api';
import './MiTiBot.css';

const ROBOT_IMG = 'https://i.pinimg.com/474x/fc/8d/8d/fc8d8d43a5f624568b77baf34e61bcc6.jpg';

export default function MiTiBot({ open = false, incoming = '', onClose = () => {} }){
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const endRef = useRef(null);
  const [shownIntro, setShownIntro] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Local system FAQ/responder for system questions (registration, envío, pagos, facturas, miTiBOT help)
  const SYSTEM_FAQ = [
    { patterns: [/registro/i, /registrar/i, /como me registro/i, /crear cuenta/i], answer: 'Para registrarte ve a la página de Registro (Menú → Registro). Completa tus datos y acepta los términos. Después podrás iniciar sesión con tu email y contraseña.' },
    { patterns: [/iniciar sesi/i, /login/i, /entrar/i, /como inicio/i], answer: 'Para iniciar sesión usa el botón «Iniciar sesión» en la cabecera. Si olvidaste tu contraseña, usa la opción de recuperación en la página de login.' },
    { patterns: [/env[ií]o/i, /envio gratis/i, /costo de envio/i], answer: 'El envío puede ser gratuito para compras mayores a ciertos montos o cuando se aplican promociones. En el carrito verás el subtotal y el envío calculado antes de pagar.' },
    { patterns: [/pago/i, /metodo de pago/i, /como pago/i], answer: 'Aceptamos tarjetas de crédito/débito y otros métodos configurados por el backend. En la página de pago podrás seleccionar el método y ver el resumen antes de confirmar.' },
    { patterns: [/factura/i, /recibo/i, /comprobante/i], answer: 'Después de completar un pedido recibirás una factura en la sección Facturas o en la página de detalle del pedido. También puedes descargarla desde tu perfil si el backend lo permite.' },
    { patterns: [/devoluci/i, /reembolso/i, /garant/i], answer: 'Las devoluciones y reembolsos dependen de la política de la tienda. Revisa la página de Política de Devoluciones o contacta con soporte desde la sección de ayuda.' },
    { patterns: [/mitibot/i, /mi ti bot/i, /bot/i, /como funciona mitibot/i], answer: 'miTiBOT es un asistente que puede buscar productos, sugerir ofertas y responder preguntas. Puedes escribir lo que buscas y, si está disponible, te ofreceré un resultado o una búsqueda dentro de la tienda.' },
    { patterns: [/promoci/i, /descuento/i, /cupon/i], answer: 'Las promociones se muestran en el banner y en la sección de ofertas. Si compras más de 5 unidades del mismo producto se aplica un descuento automático del 30% y puedes ganar un cupón según las reglas de la tienda.' },
    { patterns: [/contacto/i, /soporte/i, /ayuda/i], answer: 'Puedes contactar al soporte desde la página de Contacto o usando el chat si está habilitado; también revisa la sección Ayuda en el pie de página.' }
  ];

  function localSystemAnswer(q){
    if(!q) return null;
    const text = String(q).toLowerCase();
    for(const item of SYSTEM_FAQ){
      for(const p of item.patterns){
        if(p.test(text)) return item.answer;
      }
    }
    return null;
  }

  useEffect(()=>{
    if(open){
      if(!shownIntro){
        setMessages([
          { from: 'bot', text: 'Hola — soy miTiBOT. Puedo ayudarte a buscar productos, recomendar ofertas y responder preguntas sobre la tienda.' },
          { from: 'bot', text: 'Puedes pedirme que busque un producto, mostrar ofertas, o preguntarme sobre políticas y métodos de pago. También puedo intentar usar un servicio AI si está configurado.' },
          { from: 'bot', text: 'Prueba escribiendo: "zapatos deportivos talla 42" o pulsa "Buscar ofertas".' , action: 'none' }
        ]);
        setShownIntro(true);
      }
    }
  },[open]);

  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // when incoming prop changes, push it into messages
  useEffect(()=>{
    if(incoming && incoming.trim()){
      setMessages(m => [...m, { from: 'bot', text: incoming }]);
    }
  }, [incoming]);

  // Función simplificada que solo usa respuestas locales
  async function askAI(question){
    const q = (question || '').trim();
    if(!q) return;
    setAiLoading(true);
    // Insert a temporary typing indicator message and remember its id so we can replace it
    const tempId = `t-${Date.now()}`;
    setMessages(m => [...m, { id: tempId, from: 'bot', text: '...', temp: true }]);
    
    try {
      // First, check local system FAQ/responder
      const sys = localSystemAnswer(q);
      if(sys){
        // insert the answer immediately replacing the temp id
        setMessages(prev => prev.map(msg => msg.id === tempId ? ({ ...msg, text: sys, temp: false }) : msg));
        return;
      }

      // Si no hay respuesta en el sistema local, usar el fallback
      const fallbackText = localFallbackAnswer(q);
      const suggested = tryExtractQuery(fallbackText) || tryExtractQuery(q);
      setMessages(prev => prev.map(msg => msg.id === tempId ? ({ 
        ...msg, 
        text: fallbackText, 
        temp: false, 
        suggestedQuery: suggested || q // Si no hay query sugerida, usar la pregunta como query
      }) : msg));
    } finally {
      setAiLoading(false);
    }
  }

  function localFallbackAnswer(q){
    const s = q.toLowerCase();
    if(s.includes('precio') || s.includes('cost') || s.includes('cuesta')){
      return 'Puedo ayudarte con precios — intenta abrir la página del producto o dime cuál producto te interesa para mostrar opciones.';
    }
    if(s.includes('oferta') || s.includes('descuento') || s.includes('promoc')){
      return 'Actualmente tenemos promociones destacadas en la sección Promociones; dime qué categoría o producto te interesa y buscaré ofertas.';
    }
    if(s.includes('envío') || s.includes('envio')){
      return 'El envío puede ser gratis para compras superiores a ciertos montos. Dime los productos que quieres y calculo el envío estimado.';
    }
    // generic fallback
    return `¿Quieres buscar productos relacionados con "${q}"? Puedo ayudarte a encontrarlos en nuestra tienda.`;
  }

  // Try to extract a concise search query from AI text
  function tryExtractQuery(text){
    if(!text) return null;
    const t = String(text);
  // 1) look for any quoted substring (double or single quotes)
  const generalQuote = t.match(/"([^"']{2,}?)"/) || t.match(/'([^"']{2,}?)'/);
  if (generalQuote) return generalQuote[1].trim();

  // 2) common Spanish phrasing: 'relacionados con "..."' or 'productos relacionados con ...'
  const relMatch = t.match(/relacionad[oa]s? con[:]?\s*"?([\w\s\-]{2,80})"?/i);
  if (relMatch) return relMatch[1].trim();

  // 3) explicit buscar patterns: Buscar: "..." or Buscar ...
  const quoteMatch = t.match(/[Bb]uscar[:]?\s*"([^"]{2,80})"/i) || t.match(/[Bb]uscar[:]?\s*'([^']{2,80})'/i);
  if(quoteMatch) return quoteMatch[1].trim();

  const buscarMatch = t.match(/[Bb]uscar[:]?\s*([\w\s\-]{2,50})/i);
  if(buscarMatch) return buscarMatch[1].trim();

  const searchFor = t.match(/search for[:]?\s*([\w\s\-]{2,50})/i);
  if(searchFor) return searchFor[1].trim();
    // fallback: if the reply repeats the user's query or mentions product types, return short snippet
    // take first sentence (up to 8 words) as a safe query
    const firstSentence = t.split(/[\.\n\!\?]/)[0] || '';
    const words = firstSentence.split(/\s+/).filter(Boolean);
    if(words.length >= 2){
      return words.slice(0,8).join(' ');
    }
    return null;
  }

  function close(){ onClose && onClose(); }

  function send(){
    const q = (input || '').trim();
    if(!q) return;
    setMessages(m => [...m, { from: 'user', text: q }]);
    setInput('');
    // prefer AI answer if available; otherwise fall back to search
    setTimeout(()=>{
      // try AI first
      askAI(q);
    }, 300);
  }

  if(!open) return null;

  return (
    <div className="mitibot-overlay" role="dialog" aria-label="miTiBOT chat">
      <div className="mitibot-panel">
        <div className="mitibot-header">
          <strong>miTiBOT</strong>
          <button className="mitibot-close" onClick={close} aria-label="Cerrar">✕</button>
        </div>
        <div className="mitibot-body">
          {messages.map((m,i) => (
            m.from === 'bot' ? (
              <div key={i} className={`mitibot-message bot`}>
                <div className={`mitibot-bubble bot`}>
                  <span>{m.text}</span>
                  {m.suggestedQuery ? (
                    <div className="mitibot-suggested">
                      <small>¿Quieres buscar esto en la tienda?</small>
                      <button className="mitibot-suggested-btn" onClick={()=>{ navigate(`/buscar?search=${encodeURIComponent(m.suggestedQuery)}`); close(); }}>
                        Buscar: {m.suggestedQuery}
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="mitibot-avatar"><img src={ROBOT_IMG} alt="miTiBOT" /></div>
              </div>
            ) : (
              <div key={i} className={`mitibot-message user`}>
                <div className={`mitibot-bubble user`}>
                  <span>{m.text}</span>
                </div>
              </div>
            )
          ))}
          <div ref={endRef} />
        </div>
        <form className="mitibot-compose" onSubmit={(e)=>{ e.preventDefault(); send(); }}>
          <input placeholder="Escribe aquí lo que buscas..." value={input} onChange={e=>setInput(e.target.value)} />
          <button type="submit" className="mitibot-send">Buscar</button>
        </form>
      </div>
    </div>
  );
}
