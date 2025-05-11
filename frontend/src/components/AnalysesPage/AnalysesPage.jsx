import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AnalysesPage.css';
import { getAnalyses } from '../../api/Api';
import CreateAnalysisForm from './CreateAnalysisForm';

function AnalysesPage({ userRole = 'PATIENT', isProfileView = false }) {
    const navigate = useNavigate();
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const fetchAnalyses = async () => {
            try {
                setLoading(true);
                setError('');

                const data = await getAnalyses();
                if (isMounted) {
                    setAnalyses(data);
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    if (err.response?.status === 401 || err.response?.status === 403) {
                        localStorage.clear();
                        window.location.replace('/login');
                        return;
                    }
                    setError('Ошибка при загрузке анализов');
                    setLoading(false);
                    console.error('Error fetching analyses:', err);
                }
            }
        };

        fetchAnalyses();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleDownload = (analysis) => {
        if (analysis.result_file) {
            window.open(analysis.result_file, '_blank');
        } else {
            alert(`Файл для анализа "${analysis.name}" не найден`);
        }
    };

    if (loading) return <div className="analyses-loading">Загрузка...</div>;
    if (error) return <div className="analyses-error">{error}</div>;

    return (
        <div className={`analyses-page ${isProfileView ? 'profile-view' : ''}`}>
            <div className="analyses-header">
                <h2>Анализы</h2>
                {!isProfileView && (
                    <button 
                        onClick={() => navigate('/profile/analyses')}
                        className="view-all-button"
                    >
                        Перейти в личный кабинет
                    </button>
                )}
            </div>

            {/* Показываем форму только для врача */}
            {userRole === 'DOCTOR' && (
                <div style={{marginBottom: 24}}>
                    <CreateAnalysisForm onCreated={() => window.location.reload()} />
                </div>
            )}

            <div className="analyses-grid">
                {analyses.length === 0 ? (
                    <div className="no-analyses">Нет доступных анализов</div>
                ) : (
                    analyses.map(analysis => (
                        <div key={analysis.id} className="analysis-card">
                            <div className="analysis-info">
                                <h3>{analysis.name}</h3>
                                <p className="analysis-date">
                                    Дата: {new Date(analysis.date_added).toLocaleDateString()}
                                </p>
                                {analysis.doctor && (
                                    <p className="analysis-doctor">
                                        Врач: {analysis.doctor.first_name} {analysis.doctor.last_name}
                                    </p>
                                )}
                                <p className={`analysis-status ${analysis.status === 'READY' ? 'ready' : 'processing'}`}>Статус: {analysis.status === 'READY' ? 'Готов' : 'В обработке'}</p>
                            </div>
                            <div className="analysis-actions">
                                {analysis.status === 'READY' && analysis.result_file ? (
                                    <button
                                        onClick={() => handleDownload(analysis)}
                                        className="download-button ready"
                                    >
                                        Скачать результат
                                    </button>
                                ) : (
                                    <button
                                        className="download-button processing"
                                        disabled
                                    >
                                        В обработке
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default AnalysesPage;