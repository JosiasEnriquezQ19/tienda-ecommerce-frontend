import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API } from '../api';
import './Banner.css';

export default function Banner() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await axios.get(`${API}/Banners?soloActivos=true`);
        setBanners(res.data);
      } catch (err) {
        console.error('Error fetching banners:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Auto-slide logic
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  if (loading || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  const handleBannerClick = () => {
    if (currentBanner.linkUrl) {
      // In-app links
      if (currentBanner.linkUrl.startsWith('/')) {
        navigate(currentBanner.linkUrl);
      } else {
        // External links
        window.open(currentBanner.linkUrl, '_blank');
      }
    }
  };

  return (
    <div
      className="ae-banner-container"
      onClick={handleBannerClick}
      style={{ cursor: currentBanner.linkUrl ? 'pointer' : 'default' }}
    >
      <picture>
        <source media="(max-width: 768px)" srcSet={currentBanner.imagenMobileUrl} />
        <img
          src={currentBanner.imagenDesktopUrl}
          alt={currentBanner.nombre}
          className="ae-banner-image"
        />
      </picture>

      {banners.length > 1 && (
        <div className="ae-banner-dots">
          {banners.map((_, idx) => (
            <span
              key={idx}
              className={`ae-banner-dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}