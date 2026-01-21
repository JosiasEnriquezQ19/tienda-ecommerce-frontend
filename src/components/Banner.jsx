import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Banner.css';

// Ejemplo de datos para el carrusel (en producción vendrían de una API o config)
const SLIDES = [
  {
    id: 1,
    title: "Gran Descuento 10% OFF en Apple",
    subtitle: "PROMOCIÓN ESPECIAL",
    description: "Increíbles descuentos en toda nuestra colección de productos tecnológicos Apple. ¡No te lo pierdas!",
    image: "https://pedidos.com/myfotos/Pedidos-com/pagina/apple/principal.png",
    link: "/categoria/tecnologia",
    buttonText: "Ver Ofertas",
    color: "blue" // theme class
  },
  {
    id: 2,
    title: "Nueva Colección de Audífonos",
    subtitle: "SONIDO PREMIUM",
    description: "Experimenta la mejor calidad de sonido con nuestra nueva línea de auriculares inalámbricos.",
    image: "https://resource.logitech.gcp.logitechdirect.com/content/dam/logitech/en/products/headsets/zone-vibe-100/gallery/zone-vibe-100-gallery-1.png",
    link: "/categoria/audifonos",
    buttonText: "Explorar",
    color: "purple"
  },
  {
    id: 3,
    title: "Laptops de Alto Rendimiento",
    subtitle: "PARA GAMERS Y PROS",
    description: "Equipos potentes para trabajo pesado y gaming de última generación. Potencia tu día.",
    image: "https://dlcdnwebimgs.asus.com/gain/49d0dd10-1437-4560-9dc6-0428d02245b7/w800",
    link: "/categoria/laptops",
    buttonText: "Comprar Ahora",
    color: "dark"
  }
];

export default function Banner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Auto-play effect
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SLIDES.length);
    }, 5000); // 5 segundos por slide
    return () => clearInterval(interval);
  }, [isAutoPlay]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    // Pause auto-play briefly on user interaction could be nice, 
    // but for simplicity we just keep it or toggle it. 
    // Let's reset the timer by re-triggering effect implies state change, 
    // but simple set works.
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % SLIDES.length);
    setIsAutoPlay(false); // Stop autoplay on manual interaction
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + SLIDES.length) % SLIDES.length);
    setIsAutoPlay(false);
  };

  return (
    <div
      className="ae-banner-slider"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      <div
        className="ae-slider-track"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {SLIDES.map((slide) => (
          <div key={slide.id} className={`ae-slide ae-theme-${slide.color}`}>
            <div className="ae-slide-content">
              <div className="ae-slide-text">
                <span className="ae-slide-subtitle">{slide.subtitle}</span>
                <h2 className="ae-slide-title">{slide.title}</h2>
                <p className="ae-slide-desc">{slide.description}</p>
                <Link to={slide.link} className="ae-slide-button">
                  {slide.buttonText}
                  <svg className="ae-arrow-icon" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                  </svg>
                </Link>
              </div>
              <div className="ae-slide-image-wrapper">
                <img src={slide.image} alt={slide.title} className="ae-slide-image" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <button className="ae-slider-arrow prev" onClick={prevSlide} aria-label="Anterior">
        <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <button className="ae-slider-arrow next" onClick={nextSlide} aria-label="Siguiente">
        <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
      </button>

      {/* Dots */}
      <div className="ae-slider-dots">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            className={`ae-dot ${currentSlide === idx ? 'active' : ''}`}
            onClick={() => goToSlide(idx)}
            aria-label={`Ir a diapositiva ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}