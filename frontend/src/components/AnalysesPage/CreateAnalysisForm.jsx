import React, { useEffect, useState } from 'react';
import { doctorApi } from '../../api/Api';
import './CreateAnalysisForm.css';

export default function CreateAnalysisForm({ onCreated }) {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patient: '',
    name: '',
    description: '',
    status: 'PENDING',
    result_file: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    doctorApi.getAppointmentHistory().then(data => {
      const uniquePatients = [];
      const seen = new Set();
      data.forEach(app => {
        if (app.patient && !seen.has(app.patient.id)) {
          uniquePatients.push(app.patient);
          seen.add(app.patient.id);
        }
      });
      setPatients(uniquePatients);
    });
  }, []);

  const handleChange = e => {
    const { name, value, files } = e.target;
    setForm(f => ({
      ...f,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('patient', form.patient);
    formData.append('name', form.name);
    formData.append('description', form.description);
    formData.append('status', form.status);
    if (form.result_file) formData.append('result_file', form.result_file);

    try {
      await doctorApi.createAnalysis(formData);
      if (onCreated) onCreated();
      setForm({ patient: '', name: '', description: '', status: 'PENDING', result_file: null });
    } catch (err) {
      alert('Ошибка при создании анализа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="create-analysis-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Пациент:
          <select name="patient" value={form.patient} onChange={handleChange} required>
            <option value="">Выберите пациента</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
            ))}
          </select>
        </label>
        <label>
          Название анализа:
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Описание:
          <textarea name="description" value={form.description} onChange={handleChange} />
        </label>
      </div>
      <div className="form-row">
        <label>
          Статус:
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="PENDING">В обработке</option>
            <option value="READY">Готов</option>
          </select>
        </label>
        <label>
          Файл результата:
          <input type="file" name="result_file" onChange={handleChange} />
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" disabled={loading} className="create-btn">
          {loading ? 'Создание...' : 'Создать анализ'}
        </button>
      </div>
    </form>
  );
} 