import React, { useState } from 'react';
import './MedicalCard.css';

export default function MedicalCard() {
  // Моковые данные
  const [medicalRecords] = useState([
    {
      id: 1,
      diagnosis: 'ОРВИ',
      prescription: 'Пить больше жидкости',
      date: '2025-05-01',
      doctor: { first_name: 'Иван', last_name: 'Иванов' }
    },
    {
      id: 2,
      diagnosis: 'Грипп',
      prescription: 'Постельный режим, жаропонижающее',
      date: '2025-04-15',
      doctor: { first_name: 'Анна', last_name: 'Петрова' }
    }
  ]);

  return (
    <section className="medical-records">
      <h2>Медицинская карта</h2>
      {medicalRecords.length > 0 ? (
        <ul className="medical-records-list">
          {medicalRecords.map(record => (
            <li key={record.id} className="medical-record-item">
              <span><b>Диагноз:</b> {record.diagnosis}</span>
              <span><b>Назначение:</b> {record.prescription}</span>
              <span><b>Дата:</b> {new Date(record.date).toLocaleDateString()}</span>
              {record.doctor && (
                <span><b>Врач:</b> {record.doctor.first_name} {record.doctor.last_name}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>Нет медицинских записей.</p>
      )}
    </section>
  );
}
