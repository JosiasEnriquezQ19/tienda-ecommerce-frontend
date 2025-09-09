import React, { useState, useEffect } from 'react';
import './Filtros.css';

export default function Filtros({ onFilter }) {
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [tempPriceRange, setTempPriceRange] = useState([0, 1000]);
  const [tempSelectedCategories, setTempSelectedCategories] = useState([]);
  const [tempRating, setTempRating] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showFilterResults, setShowFilterResults] = useState(false);

  // Canonical categories for the store
  const categories = [
    'Tecnologia',
    'Audífonos',
    'Laptops',
    'Celulares',
    'Otros'
  ];
  
  // Efecto para detectar si es dispositivo móvil
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Inicializar valores temporales
  useEffect(() => {
    setTempPriceRange([...priceRange]);
    setTempSelectedCategories([...selectedCategories]);
  }, []);

  const handleCategoryChange = (category) => {
    let newCategories;
    if ((isMobile ? tempSelectedCategories : selectedCategories).includes(category)) {
      newCategories = (isMobile ? tempSelectedCategories : selectedCategories).filter(c => c !== category);
    } else {
      newCategories = [...(isMobile ? tempSelectedCategories : selectedCategories), category];
    }
    
    if (isMobile) {
      setTempSelectedCategories(newCategories);
    } else {
      setSelectedCategories(newCategories);
      // emit 'categorias' (array) for ListaProductos compatibility; also keep 'categoria' for single-value backcompat
      onFilter && onFilter({ categorias: newCategories, categoria: newCategories[0] || '' });
    }
  };

  const handlePriceChange = (index, value) => {
    const newPriceRange = isMobile ? [...tempPriceRange] : [...priceRange];
    newPriceRange[index] = Number(value);
    
    if (isMobile) {
      setTempPriceRange(newPriceRange);
    } else {
      setPriceRange(newPriceRange);
      onFilter && onFilter({ precioMin: newPriceRange[0], precioMax: newPriceRange[1] });
    }
  };
  
  // Aplicar filtros en móvil
  const applyFilters = () => {
    setPriceRange([...tempPriceRange]);
    setSelectedCategories([...tempSelectedCategories]);
    
    onFilter && onFilter({ 
      categorias: tempSelectedCategories, 
      categoria: tempSelectedCategories[0] || '', 
      precioMin: tempPriceRange[0], 
      precioMax: tempPriceRange[1],
      ratingMin: tempRating
    });
    
    // Mostrar mensaje de resultados de filtros
    setShowFilterResults(true);
    setTimeout(() => {
      setShowFilterResults(false);
    }, 3000);
  };
  
  // Limpiar filtros
  const clearFilters = () => {
    const clearedPriceRange = [0, 1000];
    const clearedCategories = [];
    
    if (isMobile) {
      setTempPriceRange(clearedPriceRange);
      setTempSelectedCategories(clearedCategories);
      setTempRating(null);
    } else {
      setPriceRange(clearedPriceRange);
      setSelectedCategories(clearedCategories);
      onFilter && onFilter({ categorias: [], precioMin: 0, precioMax: 1000, ratingMin: null });
    }
  };

  return (
    <aside className="ae-filters">
      {showFilterResults && isMobile && (
        <div className="ae-filter-results">
          Filtros aplicados correctamente
        </div>
      )}
      
      <div className="ae-filters-header">
        <h3 className="ae-filters-title">Filtros</h3>
        <button 
          className="ae-clear-filters" 
          onClick={clearFilters}
        >
          Limpiar todo
        </button>
      </div>

      <div className="ae-filter-section">
        <h4 className="ae-filter-section-title">Categorías</h4>
        <div className="ae-category-filters">
          {categories.map(category => (
            <label key={category} className="ae-category-checkbox">
              <input
                type="checkbox"
                checked={isMobile ? tempSelectedCategories.includes(category) : selectedCategories.includes(category)}
                onChange={() => handleCategoryChange(category)}
              />
              <span className="ae-checkmark"></span>
              {category}
            </label>
          ))}
        </div>
      </div>

      <div className="ae-filter-section">
        <h4 className="ae-filter-section-title">Rango de precio</h4>
        <div className="ae-price-range">
          <div className="ae-price-inputs">
            <input
              type="number"
              value={isMobile ? tempPriceRange[0] : priceRange[0]}
              onChange={(e) => handlePriceChange(0, e.target.value)}
              min="0"
              className="ae-price-input"
            />
            <span className="ae-price-separator">-</span>
            <input
              type="number"
              value={isMobile ? tempPriceRange[1] : priceRange[1]}
              onChange={(e) => handlePriceChange(1, e.target.value)}
              min={isMobile ? tempPriceRange[0] : priceRange[0]}
              className="ae-price-input"
            />
          </div>
          <div className="ae-price-slider">
            <input
              type="range"
              min="0"
              max="1000"
              value={isMobile ? tempPriceRange[0] : priceRange[0]}
              onChange={(e) => handlePriceChange(0, e.target.value)}
              className="ae-range-min"
            />
            <input
              type="range"
              min="0"
              max="1000"
              value={isMobile ? tempPriceRange[1] : priceRange[1]}
              onChange={(e) => handlePriceChange(1, e.target.value)}
              className="ae-range-max"
            />
          </div>
        </div>
      </div>

      <div className="ae-filter-section">
        <h4 className="ae-filter-section-title">Calificación</h4>
        <div className="ae-rating-filters">
          {[4, 3, 2, 1].map(rating => (
            <label key={rating} className="ae-rating-option">
              <input 
                type="radio" 
                name="rating" 
                checked={isMobile ? tempRating === rating : false}
                onChange={() => {
                  if (isMobile) {
                    setTempRating(rating);
                  } else {
                    onFilter && onFilter({ ratingMin: rating });
                  }
                }} 
              />
              <div className="ae-stars">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`ae-star ${i < rating ? 'active' : ''}`}>★</span>
                ))}
              </div>
              <span className="ae-rating-text">y más</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Botones para móvil */}
      {isMobile && (
        <div className="ae-mobile-filter-buttons">
          <button className="ae-filter-apply" onClick={applyFilters}>
            Aplicar filtros
          </button>
          <button className="ae-filter-clear" onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>
      )}
    </aside>
  );
}