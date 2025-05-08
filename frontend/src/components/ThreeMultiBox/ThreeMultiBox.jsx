import React from 'react';
import './ThreeMultiBox.css';

function ThreeMultiBox() {
  return (
    <div className="multi-box-container">
      <div className="mui-card-root mui-paper-elevation1 muipaper-rounded">
        <div className="mui-card-content-root">
          <h5 className="mui-typography-root mui-typography-h5 mui-typography-gutterBottom">О клинике</h5>
          <p className="mui-typography-root mui-typography-body1">Керемет Диагностический Центр - это современное медицинское учреждение, оснащенное передовым оборудованием и укомплектованное опытными специалистами.</p>
          <p></p>
        </div>
      </div>
      <div className="mui-card-root mui-paper-elevation1 muipaper-rounded">
        <div className="mui-card-content-root">
          <h5 className="mui-typography-root mui-typography-h5 mui-typography-gutterBottom">Наши услуги</h5>
          <p className="mui-typography-root mui-typography-body1">Мы предоставляем широкий спектр медицинских услуг, включая консультации специалистов, лабораторные исследования, инструментальную диагностику и многое другое.</p>
          <p></p>
        </div>
      </div>
      <div className="mui-card-root mui-paper-elevation1 muipaper-rounded">
        <div className="mui-card-content-root">
          <h5 className="mui-typography-root mui-typography-h5 mui-typography-gutterBottom">Быстрая запись</h5>
          <p className="mui-typography-root mui-typography-body1">Запишитесь на прием онлайн или по телефону. Мы предлагаем удобное время для посещения и минимальное время ожидания.</p>
          <p></p>
        </div>
      </div>
    </div>
  );
}

export default ThreeMultiBox;