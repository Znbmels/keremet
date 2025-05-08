import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

const YandexMap = ({ center, zoom = 15, height = '400px' }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const placemarkInstance = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=58437f62-63d6-4ad3-ab0e-6e729384681e&lang=ru_RU`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.ymaps.ready(() => {
        if (mapRef.current && !mapInstance.current) {
          mapInstance.current = new window.ymaps.Map(mapRef.current, {
            center: center,
            zoom: zoom,
            controls: ['zoomControl', 'fullscreenControl'],
          });

          placemarkInstance.current = new window.ymaps.Placemark(
            center,
            {
              balloonContent: `
                <div style="padding: 10px;">
                  <h3 style="margin: 0 0 10px 0;">Клиника Керемет</h3>
                  <p style="margin: 0;">Алматы, ул. Примерная, 123</p>
                  <p style="margin: 5px 0;">Телефон: +7 (777) 123-45-67</p>
                  <p style="margin: 5px 0;">Email: info@keremet.kz</p>
                  <button
                    onclick="window.open('https://yandex.ru/maps/?rtext=~${center[0]},${center[1]}', '_blank')"
                    style="
                      background-color: #00A6B4;
                      color: white;
                      border: none;
                      padding: 8px 16px;
                      border-radius: 4px;
                      cursor: pointer;
                      margin-top: 10px;
                    "
                  >
                    Построить маршрут
                  </button>
                </div>
              `,
            },
            {
              preset: 'islands#blueMedicalIcon',
              draggable: false,
            }
          );

          mapInstance.current.geoObjects.add(placemarkInstance.current);
        }
      });
    };

    document.head.appendChild(script);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
      if (placemarkInstance.current) {
        placemarkInstance.current = null;
      }
      document.head.removeChild(script);
    };
  }, [center, zoom, height]);

  return (
    <Box
      ref={mapRef}
      sx={{
        width: '100%',
        height: height,
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
};

export default YandexMap;