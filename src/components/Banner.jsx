import React from 'react';
import './Banner.css';
import mobileBannerImg from '../assets/movil-banner.jpeg';

export default function Banner() {
  return (
    <div className="ae-banner-static">
      <picture>
        <source media="(max-width: 768px)" srcSet={mobileBannerImg} />
        <img
          src="https://http2.mlstatic.com/storage/splinter-admin/o:f_webp,q_auto:best/1772167468449-ffe62110-1396-11f1-aa6e-4b8e6365e9a5.jpg"
          alt="Banner Promocional"
          className="ae-banner-image"
        />
      </picture>
    </div>
  );
}