import React, { useState, useEffect } from 'react';
import MiTiBot from './MiTiBot';
import './ChatLauncher.css';

const ROBOT_IMG = 'https://i.pinimg.com/474x/fc/8d/8d/fc8d8d43a5f624568b77baf34e61bcc6.jpg';

export default function ChatLauncher(){
  const [open, setOpen] = useState(false);
  const [notify, setNotify] = useState(true);
  const [incoming, setIncoming] = useState('');

  useEffect(()=>{
    // initial small automatic notification pulse for 6s then hide
    const t = setTimeout(()=> setNotify(false), 6000);
    return () => clearTimeout(t);
  },[]);

  useEffect(()=>{
    // every 5 minutes, trigger a subtle notification and deliver a short bot message
    const interval = setInterval(()=>{
      setNotify(true);
      // message text user-facing
      const msg = 'miTiBOT: ¿Necesitas ayuda para encontrar ofertas o productos?';
      setIncoming(msg);
      // auto-hide notify after 8s
      setTimeout(()=> setNotify(false), 8000);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // When user clicks, open chat and clear notification + incoming
  function openChat(){ setOpen(true); setNotify(false); setIncoming(''); }

  return (
    <>
      <div className="chat-launcher" aria-hidden={open}>
        <button className="chat-button" onClick={openChat} aria-label="Abrir miTiBOT">
          <div className="chat-avatar-wrap">
            <img src={ROBOT_IMG} alt="miTiBOT" />
            <span className="chat-wave" aria-hidden></span>
          </div>
          {notify && <span className="chat-notify">miTiBOT está hablando</span>}
        </button>
      </div>
      <MiTiBot open={open} incoming={incoming} onClose={() => { setOpen(false); setIncoming(''); }} />
    </>
  );
}
