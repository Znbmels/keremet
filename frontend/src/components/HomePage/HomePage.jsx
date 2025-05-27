import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import ThreeMultiBox from '../ThreeMultiBox/ThreeMultiBox';
// import Footer from '../Footer/Footer'; // Удаляем неиспользуемый импорт
import photo from '../../assets/homepage.png'; // Импортируем изображение

function HomePage() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('user_role');

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="homepage">
      <div className="homepage-hero" style={{ minHeight: '900px', backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="homepage-hero-content">
          <h1 className="homepage-title">Добро пожаловать в Керемет Диагностический Центр</h1>
          <p className="homepage-subtitle">
            Ваше здоровье - наш главный приоритет. Мы предоставляем качественные медицинские услуги с использованием современного оборудования.
          </p>
          <div className="homepage-actions">
            <button 
              className="homepage-button homepage-button-primary"
              onClick={() => handleNavigate('/appointment')}
            >
              <span className="button-icon">📅</span> Записаться на прием
            </button>
            <button 
              className="homepage-button homepage-button-secondary"
              onClick={() => handleNavigate('/tests')}
            >
              <span className="button-icon">📊</span> Посмотреть результаты анализов
            </button>
            {userRole !== 'DOCTOR' && (
              <button 
                className="homepage-button homepage-button-secondary"
                onClick={() => handleNavigate('/doctors')}
              >
                <span className="button-icon">🔍</span> Найти врача
              </button>
            )}
          </div>
        </div>
      </div>
      <ThreeMultiBox />
      {/* <Footer /> {/* Footer теперь в App.jsx */}
    </div>
  );
}

export default HomePage;