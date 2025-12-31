import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Calendar as CalendarIcon,
    CheckCircle2,
    XCircle,
    Camera,
    Info,
    UploadCloud,
    ExternalLink
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const ClientWorkouts = () => {
    const { addNotification } = useNotifications();
    const [logs, setLogs] = useState([]);
    const [activePlan, setActivePlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(new Date().getDay());
    const [logForm, setLogForm] = useState({ isCompleted: true, reasonNotCompleted: '', image: null });
    const [showLogModal, setShowLogModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [workoutsRes, logsRes] = await Promise.all([
                    api.get('/workouts/active'),
                    api.get('/users/logs/me')
                ]);
                setActivePlan(workoutsRes.data.data);
                setLogs(logsRes.data.data || []);
            } catch (err) {
                console.error('Erro ao buscar dados');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getDayWorkouts = (dayNum) => {
        return activePlan?.weeklyPlan?.find(p => p.dayOfWeek === dayNum);
    };

    // Helper to check if day is locked/completed
    const currentDayIndex = new Date().getDay();

    const isDayLocked = (dayNum) => {
        // Lock if day is in the past
        if (dayNum < currentDayIndex) return true;

        // Check if we have a COMPLETED log for this day (assuming weekly recurrence matches current week dates approx)
        // For simplicity in this demo, if we have a log for "today" and it is completed, we lock it?
        // Actually, user wants to see "Past" days locked.
        // If today is done, maybe lock it too?
        // To verify "today", we check if any log corresponds to today's date (YYYY-MM-DD)
        const todayStr = new Date().toISOString().split('T')[0];

        // For recurring weekly plans, matching specific logs to "days of the week" requires checking recent logs
        // But simply: If dayNum < currentDayIndex, it's definitely past -> LOCKED.
        return false;
    };

    const isDayCompleted = (dayNum) => {
        // Check if there is a log for today (if dayNum == today)
        if (dayNum === currentDayIndex) {
            const todayStr = new Date().toISOString().split('T')[0];
            return logs.some(l => l.date && l.date.startsWith(todayStr) && l.isCompleted);
        }
        // For past days, it's harder to say "completed" without checking exact dates of past week
        // Let's assume for UI purposes we stick to today for now
        return false;
    };

    const handleLogSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let proofUrl = '';

            // 1. Upload image if exists
            if (logForm.image) {
                const imgData = new FormData();
                imgData.append('proofImage', logForm.image);
                const uploadRes = await api.post('/upload/training-proof', imgData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                proofUrl = uploadRes.data.proofUrl;
            }

            // 2. Submit log
            const logData = {
                date: new Date().toISOString(), // Backend expects Date
                isCompleted: logForm.isCompleted,
                reasonNotCompleted: logForm.isCompleted ? null : logForm.reasonNotCompleted,
                proofImageURL: proofUrl || null
            };

            await api.post('/users/logs', logData);
            addNotification('success', 'Registo enviado com sucesso!');
            setShowLogModal(false);
            setLogForm({ isCompleted: true, reasonNotCompleted: '', image: null });

            // Optionally update local state to lock today if needed
        } catch (err) {
            addNotification('error', err.response?.data?.message || 'Erro ao registar treino.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const days = [
        { name: 'Dom', num: 0 }, { name: 'Seg', num: 1 }, { name: 'Ter', num: 2 },
        { name: 'Qua', num: 3 }, { name: 'Qui', num: 4 }, { name: 'Sex', num: 5 }, { name: 'Sáb', num: 6 }
    ];

    if (loading) return <div className="loading-spinner">Carregando a sua agenda...</div>;

    const currentDayPlan = getDayWorkouts(selectedDay);
    const locked = isDayLocked(selectedDay);

    return (
        <div className="client-workouts animate-fade">
            <header className="page-header">
                <div>
                    <h1>A Minha Agenda</h1>
                    <p>{activePlan?.name || 'Sem plano de treino ativo.'}</p>
                </div>
            </header>

            <div className="calendar-navigator glass">
                {days.map(day => {
                    const isPast = day.num < currentDayIndex;
                    const completed = isDayCompleted(day.num);
                    // Missed if past and not completed. 
                    // Note: If today is active, we don't show missed yet.
                    const missed = isPast && !completed;

                    return (
                        <button
                            key={day.num}
                            disabled={isPast}
                            className={`day-btn ${selectedDay === day.num ? 'active' : ''} ${getDayWorkouts(day.num) ? 'has-workout' : ''} ${isPast ? 'locked' : ''}`}
                            onClick={() => setSelectedDay(day.num)}
                        >
                            <span className="day-name">{day.name}</span>
                            {/* Icon Logic: Completed -> Check, Missed (Past+NoCheck) -> X, Future/Today -> Dot */}
                            {completed ? (
                                <CheckCircle2 size={16} className="status-icon success" color="#10b981" />
                            ) : missed ? (
                                <XCircle size={16} className="status-icon error" color="#ef4444" />
                            ) : (
                                <span className="day-circle"></span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="workout-details">
                {currentDayPlan ? (
                    <div className="workout-card-container">
                        <div className={`glass workout-info-card ${locked ? 'locked-mode' : ''}`}>
                            <div className="card-header">
                                <div>
                                    <h2>Treino de {days.find(d => d.num === selectedDay).name}</h2>
                                    <span className="frequency-badge">{activePlan?.frequency}x por semana</span>
                                </div>
                                {!locked && !isDayCompleted(selectedDay) && (
                                    <button className="btn-primary" onClick={() => setShowLogModal(true)}>
                                        Registar Treino
                                    </button>
                                )}
                                {(locked || isDayCompleted(selectedDay)) && (
                                    <span className="locked-badge">
                                        {isDayCompleted(selectedDay) ? <CheckCircle2 size={16} /> : <Info size={16} />}
                                        {isDayCompleted(selectedDay) ? 'Treino Realizado' : 'Concluído/Passado'}
                                    </span>
                                )}
                            </div>

                            <div className="exercise-list">
                                {currentDayPlan.exercises.map((ex, idx) => (
                                    <div key={idx} className="exercise-row">
                                        <div className="ex-main">
                                            <span className="ex-order">{ex.order}.</span>
                                            <div>
                                                <h4>{ex.name}</h4>
                                                <p>{ex.sets} séries x {ex.reps} repetições</p>
                                                {ex.instructions && <p className="instructions">{ex.instructions}</p>}
                                            </div>
                                        </div>
                                        {ex.videoUrl && (
                                            <a href={ex.videoUrl} target="_blank" rel="noreferrer" className="video-link">
                                                <ExternalLink size={16} /> Ver Vídeo
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="glass empty-workout">
                        <Info size={48} />
                        <p>Dia de descanso ou sem treino agendado.</p>
                        <span>Dica: Mantenha-se ativo com uma caminhada ou alongamentos!</span>
                    </div>
                )}
            </div>

            {showLogModal && (
                <div className="modal-overlay">
                    <div className="glass log-modal animate-slide-up">
                        <h3>Registar Cumprimento</h3>
                        <form onSubmit={handleLogSubmit}>
                            <div className="toggle-group">
                                <button
                                    type="button"
                                    className={logForm.isCompleted ? 'active success' : ''}
                                    onClick={() => setLogForm({ ...logForm, isCompleted: true })}
                                >
                                    <CheckCircle2 size={18} /> Cumpri
                                </button>
                                <button
                                    type="button"
                                    className={!logForm.isCompleted ? 'active danger' : ''}
                                    onClick={() => setLogForm({ ...logForm, isCompleted: false })}
                                >
                                    <XCircle size={18} /> Falhei
                                </button>
                            </div>

                            {!logForm.isCompleted && (
                                <div className="input-group">
                                    <label>O que aconteceu?</label>
                                    <textarea
                                        placeholder="Indique o motivo da não realização do treino..."
                                        value={logForm.reasonNotCompleted}
                                        onChange={(e) => setLogForm({ ...logForm, reasonNotCompleted: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <div className="input-group">
                                <label>Prova do Treino (Opcional)</label>
                                <div className={`file-upload ${logForm.image ? 'has-file' : ''}`}>
                                    <Camera size={24} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setLogForm({ ...logForm, image: e.target.files[0] })}
                                    />
                                    <span>{logForm.image?.name || 'Anexar foto do treino'}</span>
                                    {logForm.image && <UploadCloud size={16} className="upload-indicator" />}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowLogModal(false)} className="btn-text" disabled={isSubmitting}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'A guardar...' : 'Confirmar Registo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .client-workouts { display: flex; flex-direction: column; gap: 2rem; }
                .calendar-navigator { display: flex; justify-content: space-between; padding: 1rem; overflow-x: auto; gap: 1rem; }
                .day-btn { background: transparent; border: 1px solid transparent; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; border-radius: 1rem; transition: 0.3s; color: var(--text-secondary); min-width: 60px; }
                .day-btn:hover { background: var(--bg-primary); }
                .day-btn.active { background: var(--accent-primary); color: white; box-shadow: 0 4px 15px var(--accent-primary-alpha); }
                .day-btn.has-workout .day-circle { width: 6px; height: 6px; background: var(--accent-secondary); border-radius: 50%; }
                .day-btn.active .day-circle { background: white; }
                .day-btn.locked { opacity: 0.5; cursor: not-allowed; background: var(--bg-secondary); }
                .day-name { font-weight: 700; font-size: 0.9rem; text-transform: uppercase; }
                
                .workout-info-card { padding: 2rem; position: relative; overflow: hidden; }
                .workout-info-card.locked-mode { border-color: var(--border-color); opacity: 0.95; }
                .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; }
                .frequency-badge { font-size: 0.75rem; color: var(--accent-primary); font-weight: 700; }
                .locked-badge { display: flex; align-items: center; gap: 0.5rem; color: #10b981; font-weight: 700; font-size: 0.9rem; background: #ecfdf5; padding: 0.5rem 1rem; border-radius: 2rem; }
                
                .exercise-list { display: flex; flex-direction: column; gap: 1.5rem; }
                .exercise-row { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; background: var(--bg-primary); border-radius: 1rem; border: 1px solid var(--border-color); }
                .ex-main { display: flex; gap: 1rem; align-items: flex-start; }
                .ex-order { font-weight: 800; color: var(--accent-primary); }
                .ex-main h4 { margin: 0; font-size: 1.1rem; color: var(--text-primary); }
                .ex-main p { color: var(--text-secondary); margin: 0; font-size: 0.9rem; }
                .instructions { font-style: italic; opacity: 0.8; margin-top: 0.4rem !important; font-size: 0.85rem !important; }
                .video-link { font-size: 0.8rem; color: var(--accent-primary); text-decoration: none; font-weight: 700; display: flex; align-items: center; gap: 0.4rem; }
                
                .empty-workout { padding: 4rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--text-secondary); }
                .empty-workout span { font-size: 0.8rem; opacity: 0.7; }

                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .log-modal { width: 100%; max-width: 480px; padding: 2.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .toggle-group { display: flex; gap: 1rem; }
                .toggle-group button { flex: 1; padding: 1rem; border-radius: 0.75rem; border: 1px solid var(--border-color); background: var(--bg-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--text-secondary); transition: 0.3s; font-weight: 700; }
                .toggle-group button.active.success { background: #10b981; color: white; border-color: #10b981; }
                .toggle-group button.active.danger { background: #ef4444; color: white; border-color: #ef4444; }
                
                .file-upload { position: relative; border: 2px dashed var(--border-color); padding: 2rem; border-radius: 0.75rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: var(--text-secondary); transition: 0.3s; }
                .file-upload.has-file { border-color: var(--accent-primary); color: var(--accent-primary); background: var(--bg-primary); }
                .file-upload input { position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
                .btn-text { background: transparent; border: none; cursor: pointer; color: var(--text-secondary); font-weight: 600; }
            `}</style>
        </div>
    );
};

export default ClientWorkouts;
