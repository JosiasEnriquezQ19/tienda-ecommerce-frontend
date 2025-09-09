import React, { useState } from 'react';
import './Filtros.css';

export default function Filtros({ onFilter }) {
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Canonical categories for the store
  const categories = [
    'Tecnologia',
    'Audífonos',
    'Laptops',
    'Celulares',
    'Otros'
  ];

  const handleCategoryChange = (category) => {
    let newCategories;
    if (selectedCategories.includes(category)) {
      newCategories = selectedCategories.filter(c => c !== category);
    } else {
      newCategories = [...selectedCategories, category];
    }
    setSelectedCategories(newCategories);
  // emit 'categorias' (array) for ListaProductos compatibility; also keep 'categoria' for single-value backcompat
  onFilter && onFilter({ categorias: newCategories, categoria: newCategories[0] || '' });
  };

  const handlePriceChange = (index, value) => {
    const newPriceRange = [...priceRange];
    newPriceRange[index] = Number(value);
    setPriceRange(newPriceRange);
    onFilter && onFilter({ precioMin: newPriceRange[0], precioMax: newPriceRange[1] });
  };

  return (
    <aside className="ae-filters">
      <div className="ae-filters-header">
        <h3 className="ae-filters-title">Filtros</h3>
        <button 
          className="ae-clear-filters" 
          onClick={() => {
            setSelectedCategories([]);
            setPriceRange([0, 1000]);
            onFilter && onFilter({ categorias: [], precioMin: 0, precioMax: 1000, ratingMin: null });
          }}
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
                checked={selectedCategories.includes(category)}
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
              value={priceRange[0]}
              onChange={(e) => handlePriceChange(0, e.target.value)}
              min="0"
              className="ae-price-input"
            />
            <span className="ae-price-separator">-</span>
            <input
              type="number"
              value={priceRange[1]}
              onChange={(e) => handlePriceChange(1, e.target.value)}
              min={priceRange[0]}
              className="ae-price-input"
            />
          </div>
          <div className="ae-price-slider">
            <input
              type="range"
              min="0"
              max="1000"
              value={priceRange[0]}
              onChange={(e) => handlePriceChange(0, e.target.value)}
              className="ae-range-min"
            />
            <input
              type="range"
              min="0"
              max="1000"
              value={priceRange[1]}
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
              <input type="radio" name="rating" onChange={() => onFilter && onFilter({ ratingMin: rating })} />
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
    </aside>
  );
}