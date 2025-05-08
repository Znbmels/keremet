import React from 'react';
import './ContactUsPage.css';
import YandexMap from './YandexMap';
import ContactForm from './ContactForm'; // Импортируем компонент ContactForm

function ContactUsPage() {
  const companyCoordinates = [55.75, 37.62]; // Замените на реальные координаты

  return (
    <div className="contact-us-page">
      <h2>Контакты</h2>
      <div className="contact-container">
        <div className="contact-info-card">
          <div className="contact-details">
            <div className="detail-item">
              <h3>Адрес</h3>
              <p>Алматы, ул. Примерная, 123</p>
            </div>
            <div className="detail-item">
              <h3>Часы работы</h3>
              <p>Понедельник — Пятница: 9:00 — 18:00</p>
              <p>Суббота: 9:00 — 14:00</p>
              <p>Воскресенье: выходной</p>
            </div>
            <div className="detail-item">
              <h3>Телефон</h3>
              <p>+7 (777) 123-45-67</p>
            </div>
            <div className="detail-item">
              <h3>Email</h3>
              <p><a href="mailto:info@keremet.kz">info@keremet.kz</a></p>
            </div>
            <div className="detail-item">
              <h3>Социальные сети</h3>
              {/* Ссылки на социальные сети можно добавить здесь */}
            </div>
          </div>
        </div>
        <div className="contact-form-container">
          <ContactForm />
        </div>
      </div>
      <div className="yandex-map-container">
        <YandexMap center={companyCoordinates} zoom={16} height="400px" />
      </div>
    </div>
  );
}

export default ContactUsPage;