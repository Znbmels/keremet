import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-section">
        <h3>О нас</h3>
        <p>Керемет - ведущая клиника в Казахстане, предоставляющая качественные медицинские услуги с использованием современного оборудования и инновационных методов лечения.</p>
        <div className="footer-social">
          {/* Иконки социальных сетей */}
        </div>
      </div>
      <div className="footer-section">
        <h3>Контакты</h3>
        <p>ул. Абая 150, Алматы, Казахстан</p>
        <p>+7 (777) 777-77-77</p>
        <p><a href="mailto:info@keremet.kz">info@keremet.kz</a></p>
      </div>
      <div className="footer-section">
        <h3>Часы работы</h3>
        <p>Понедельник - Пятница: 8:00 - 20:00</p>
        <p>Суббота: 9:00 - 18:00</p>
        <p>Воскресенье: 9:00 - 15:00</p>
      </div>
      <div className="footer-copyright">
        © 2025 Керемет. Все права защищены.
      </div>
    </footer>
  );
}

export default Footer;