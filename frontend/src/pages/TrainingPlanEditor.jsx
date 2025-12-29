import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Calendar,
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    Video,
    Search,
    BookOpen,
    Filter,
    X,
    CalendarDays
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const TrainingPlanEditor = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const [client, setClient] = useState(null);
    const [planName, setPlanName] = useState('');
    const [frequency, setFrequency] = useState(3);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [weeklyPlan, setWeeklyPlan] = useState([
        { dayOfWeek: 1, exercises: [] },
        { dayOfWeek: 3, exercises: [] },
        { dayOfWeek: 5, exercises: [] }
    ]);
    const [loading, setLoading] = useState(true);

    // Exercise Library State
    const [showLibrary, setShowLibrary] = useState(false);
    const [exercisesLib, setExercisesLib] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMuscle, setFilterMuscle] = useState('');
    const [currentDayTarget, setCurrentDayTarget] = useState(0);

    // Import State
    const [showImportModal, setShowImportModal] = useState(false);
    const [otherClients, setOtherClients] = useState([]);
    const [selectedClientToCopy, setSelectedClientToCopy] = useState('');

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const res = await api.get(`/users/${clientId}`);
                setClient(res.data.data);
            } catch (err) {
                console.error('Erro ao carregar cliente');
            } finally {
                setLoading(false);
            }
        };
        fetchClient();
    }, [clientId]);

    useEffect(() => {
        const fetchExercises = async () => {
            try {
                const params = {};
                if (searchQuery) params.search = searchQuery;
                if (filterMuscle) params.category = filterMuscle;
                const res = await api.get('/exercises', { params });
                setExercisesLib(res.data.data);
            } catch (err) {
                console.error('Erro ao carregar biblioteca');
            }
        };
        if (showLibrary) fetchExercises();
    }, [showLibrary, searchQuery, filterMuscle]);

    const handleImportFromAthlete = async () => {
        if (!selectedClientToCopy) return;
        try {
            const res = await api.get('/workouts', { params: { clientId: selectedClientToCopy } });
            const plans = res.data.data;
            if (plans.length === 0) {
                addNotification('info', 'Este atleta não possui planos anteriores.');
                return;
            }
            const latestPlan = plans[0]; // Most recent
            setPlanName(`${latestPlan.name} (Cópia)`);
            setFrequency(latestPlan.frequency);
            // We map the incoming weeklyPlan to our state
            const mappedPlan = latestPlan.weeklyPlan.map(day => ({
                dayOfWeek: day.dayOfWeek,
                exercises: day.exercises.map(ex => ({ ...ex }))
            }));
            setWeeklyPlan(mappedPlan);
            setShowImportModal(false);
            addNotification('success', 'Estrutura do plano importada!');
        } catch (err) {
            addNotification('error', 'Erro ao importar plano.');
        }
    };

    const fetchOtherClients = async () => {
        try {
            const res = await api.get('/users/my-clients');
            setOtherClients(res.data.data.filter(c => c._id !== clientId));
            setShowImportModal(true);
        } catch (err) {
            addNotification('error', 'Erro ao procurar atletas.');
        }
    };

    // Ensure weeklyPlan size matches frequency
    useEffect(() => {
        const currentCount = weeklyPlan.length;
        if (currentCount < frequency) {
            const diff = frequency - currentCount;
            const newDays = [...weeklyPlan];
            for (let i = 0; i < diff; i++) {
                // Find first available day
                const usedDays = new Set(newDays.map(d => d.dayOfWeek));
                let foundDay = -1;
                for (let d = 1; d <= 6; d++) {
                    if (!usedDays.has(d)) { foundDay = d; break; }
                }
                if (foundDay === -1) foundDay = 0; // Default to Sunday if all others used
                newDays.push({ dayOfWeek: foundDay, exercises: [] });
            }
            setWeeklyPlan(newDays);
        } else if (currentCount > frequency) {
            setWeeklyPlan(weeklyPlan.slice(0, frequency));
        }
    }, [frequency]);

    const addExercise = (dayIndex) => {
        const newWeeklyPlan = [...weeklyPlan];
        if (newWeeklyPlan[dayIndex].exercises.length >= 10) {
            addNotification('warning', 'Limite de 10 exercícios por sessão atingido.');
            return;
        }
        newWeeklyPlan[dayIndex].exercises.push({
            name: '',
            sets: 3,
            reps: '12',
            instructions: '',
            videoUrl: '',
            order: newWeeklyPlan[dayIndex].exercises.length + 1
        });
        setWeeklyPlan(newWeeklyPlan);
    };

    const addFromLibrary = (exercise) => {
        const newWeeklyPlan = [...weeklyPlan];
        if (newWeeklyPlan[currentDayTarget].exercises.length >= 10) {
            addNotification('warning', 'Limite atingido.');
            return;
        }
        newWeeklyPlan[currentDayTarget].exercises.push({
            name: exercise.name,
            sets: 3,
            reps: '12',
            instructions: exercise.description || '',
            videoUrl: exercise.videoLink || '',
            order: newWeeklyPlan[currentDayTarget].exercises.length + 1
        });
        setWeeklyPlan(newWeeklyPlan);
        setShowLibrary(false);
        addNotification('success', `${exercise.name} adicionado!`);
    };

    const removeExercise = (dayIndex, exerciseIndex) => {
        const newWeeklyPlan = [...weeklyPlan];
        newWeeklyPlan[dayIndex].exercises.splice(exerciseIndex, 1);
        // Re-order
        newWeeklyPlan[dayIndex].exercises.forEach((ex, idx) => ex.order = idx + 1);
        setWeeklyPlan(newWeeklyPlan);
    };

    const updateExercise = (dayIndex, exerciseIndex, field, value) => {
        const newWeeklyPlan = [...weeklyPlan];
        let finalValue = value;
        if (field === 'sets') finalValue = parseInt(value) || 0;
        newWeeklyPlan[dayIndex].exercises[exerciseIndex][field] = finalValue;
        setWeeklyPlan(newWeeklyPlan);
    };

    const updateDay = (dayIndex, newDay) => {
        const newWeeklyPlan = [...weeklyPlan];
        newWeeklyPlan[dayIndex].dayOfWeek = parseInt(newDay);
        setWeeklyPlan(newWeeklyPlan);
    };

    const handleSave = async () => {
        if (!planName || !startDate || !endDate) {
            addNotification('warning', 'Por favor preencha todos os campos obrigatórios.');
            return;
        }

        try {
            const payload = {
                client: clientId,
                name: planName,
                frequency: parseInt(frequency),
                startDate,
                endDate,
                weeklyPlan
            };
            await api.post('/workouts', payload);
            addNotification('success', 'Plano de treino criado e ativado!');
            navigate('/trainer/clients');
        } catch (err) {
            addNotification('error', err.response?.data?.message || 'Erro ao guardar plano.');
        }
    };

    const getDayName = (day) => {
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return days[day];
    };

    if (loading) return <div className="loading">A carregar editor...</div>;

    const availableDays = [
        { val: 1, label: 'Segunda' }, { val: 2, label: 'Terça' }, { val: 3, label: 'Quarta' },
        { val: 4, label: 'Quinta' }, { val: 5, label: 'Sexta' }, { val: 6, label: 'Sábado' }, { val: 0, label: 'Domingo' }
    ];

    return (
        <div className="plan-editor animate-fade">
            <header className="page-header">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <div className="header-text">
                    <h1>Plano: {client?.firstName}</h1>
                    <p>Configure a rotina semanal (Frequência: {frequency}x)</p>
                </div>
                <div className="header-actions">
                    <button className="btn-text" onClick={fetchOtherClients}>
                        Importar de Outro Atleta
                    </button>
                    <button className="btn-primary save-btn" onClick={handleSave}>
                        <Save size={20} /> Guardar Plano
                    </button>
                </div>
            </header>

            <div className="editor-controls glass">
                <div className="input-group">
                    <label>Nome do Plano</label>
                    <input
                        type="text"
                        placeholder="Ex: Hipertrofia Fase 1"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                    />
                </div>
                <div className="form-row">
                    <div className="input-group">
                        <label>Frequência (Dias/Semana)</label>
                        <select value={frequency} onChange={(e) => setFrequency(parseInt(e.target.value))}>
                            <option value={3}>3x por semana</option>
                            <option value={4}>4x por semana</option>
                            <option value={5}>5x por semana</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Data Início</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label>Data Fim</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="weekly-grid">
                {weeklyPlan.map((day, dIdx) => (
                    <div key={dIdx} className="glass day-column">
                        <div className="day-header">
                            <div className="day-selector">
                                <CalendarDays size={18} />
                                <select value={day.dayOfWeek} onChange={(e) => updateDay(dIdx, e.target.value)}>
                                    {availableDays.map(d => (
                                        <option key={d.val} value={d.val}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                            <button className="btn-icon" onClick={() => { setCurrentDayTarget(dIdx); setShowLibrary(true); }}>
                                <BookOpen size={18} />
                            </button>
                        </div>

                        <div className="exercise-list">
                            {day.exercises.length === 0 ? (
                                <p className="empty-day-info">Sem exercícios adicionados.</p>
                            ) : (
                                day.exercises.map((ex, eIdx) => (
                                    <div key={eIdx} className="exercise-card">
                                        <div className="ex-header">
                                            <span className="ex-order">{ex.order}</span>
                                            <input
                                                type="text"
                                                placeholder="Nome do exercício"
                                                value={ex.name}
                                                onChange={(e) => updateExercise(dIdx, eIdx, 'name', e.target.value)}
                                            />
                                            <button onClick={() => removeExercise(dIdx, eIdx)} className="btn-remove">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="ex-specs">
                                            <div className="mini-input">
                                                <label>Séries</label>
                                                <input
                                                    type="number"
                                                    value={ex.sets}
                                                    onChange={(e) => updateExercise(dIdx, eIdx, 'sets', e.target.value)}
                                                />
                                            </div>
                                            <div className="mini-input">
                                                <label>Reps</label>
                                                <input
                                                    type="text"
                                                    value={ex.reps}
                                                    onChange={(e) => updateExercise(dIdx, eIdx, 'reps', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="ex-video">
                                            <Video size={14} />
                                            <input
                                                type="text"
                                                placeholder="Link do Vídeo"
                                                value={ex.videoUrl}
                                                onChange={(e) => updateExercise(dIdx, eIdx, 'videoUrl', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button onClick={() => addExercise(dIdx)} className="btn-add-ex">
                            <Plus size={16} /> Adicionar Manual
                        </button>
                    </div>
                ))}
            </div>

            {showLibrary && (
                <div className="modal-overlay">
                    <div className="glass library-modal animate-slide-up">
                        <div className="modal-header">
                            <h3><BookOpen size={20} /> Biblioteca de Exercícios</h3>
                            <button className="btn-icon" onClick={() => setShowLibrary(false)}><X size={20} /></button>
                        </div>

                        <div className="filters">
                            <div className="search-box">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select value={filterMuscle} onChange={(e) => setFilterMuscle(e.target.value)}>
                                <option value="">Todos Músculos</option>
                                <option value="Peito">Peito</option>
                                <option value="Costas">Costas</option>
                                <option value="Pernas">Pernas</option>
                                <option value="Ombros">Ombros</option>
                                <option value="Braços">Braços</option>
                                <option value="Core">Core</option>
                                <option value="Cardio">Cardio</option>
                                <option value="Flexibilidade">Flexibilidade</option>
                            </select>
                        </div>

                        <div className="exercises-grid-lib">
                            {exercisesLib.length > 0 ? exercisesLib.map(ex => (
                                <div key={ex._id} className="lib-ex-card" onClick={() => addFromLibrary(ex)}>
                                    <div className="lib-ex-info">
                                        <h4>{ex.name}</h4>
                                        <span className="badge">{ex.category}</span>
                                    </div>
                                    <Plus size={18} />
                                </div>
                            )) : <p>Nenhum exercício encontrado na base de dados.</p>}
                        </div>
                    </div>
                </div>
            )}

            {showImportModal && (
                <div className="modal-overlay">
                    <div className="glass library-modal alert-modal">
                        <h3>Importar de Atleta</h3>
                        <p>Escolha um atleta para copiar o seu plano atual para este novo plano.</p>
                        <div className="input-group">
                            <select value={selectedClientToCopy} onChange={(e) => setSelectedClientToCopy(e.target.value)}>
                                <option value="">Escolher Atleta...</option>
                                {otherClients.map(c => (
                                    <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-actions mt-1">
                            <button className="btn-text" onClick={() => setShowImportModal(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleImportFromAthlete} disabled={!selectedClientToCopy}>Importar</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .plan-editor { display: flex; flex-direction: column; gap: 2rem; }
                .page-header { display: flex; align-items: center; gap: 1.5rem; }
                .btn-icon { background: transparent; border: none; cursor: pointer; color: var(--text-secondary); }
                .save-btn { margin-left: auto; gap: 0.5rem; display: flex; align-items: center; }
                .editor-controls { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
                .weekly-grid { display: flex; gap: 1.5rem; overflow-x: auto; padding-bottom: 2rem; }
                .day-column { min-width: 340px; padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; }
                .day-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; }
                .day-selector { display: flex; align-items: center; gap: 0.5rem; color: var(--accent-primary); }
                .day-selector select { background: transparent; border: none; font-weight: 700; color: var(--text-primary); cursor: pointer; font-size: 1rem; }
                
                .exercise-list { display: flex; flex-direction: column; gap: 1.5rem; min-height: 100px; }
                .empty-day-info { font-size: 0.85rem; color: var(--text-secondary); text-align: center; opacity: 0.5; padding: 1rem; }
                
                .exercise-card { background: var(--bg-primary); padding: 1rem; border-radius: 0.75rem; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 1rem; transition: 0.3s; }
                .exercise-card:hover { border-color: var(--accent-primary); }
                .ex-header { display: flex; gap: 0.75rem; align-items: center; }
                .ex-order { font-size: 0.75rem; font-weight: 800; color: var(--accent-primary); width: 20px; }
                .ex-header input { flex: 1; background: transparent; border: none; border-bottom: 1px solid transparent; font-weight: 600; color: var(--text-primary); }
                .ex-header input:focus { border-bottom-color: var(--accent-primary); outline: none; }
                .ex-specs { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .mini-input { display: flex; flex-direction: column; gap: 0.25rem; }
                .mini-input label { font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; }
                .mini-input input { background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 0.4rem; border-radius: 0.4rem; color: var(--text-primary); }
                
                .ex-video { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text-secondary); }
                .ex-video input { flex: 1; background: transparent; border: none; font-size: 0.75rem; color: var(--accent-primary); }
                
                .btn-remove { background: transparent; border: none; cursor: pointer; color: #ef4444; opacity: 0.6; }
                .btn-remove:hover { opacity: 1; }
                .btn-add-ex { background: var(--bg-secondary); border: 1px dashed var(--border-color); padding: 0.75rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--text-secondary); cursor: pointer; transition: 0.3s; font-weight: 600; }
                .btn-add-ex:hover { border-color: var(--accent-primary); color: var(--accent-primary); }

                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .library-modal { width: 95%; max-width: 600px; padding: 2rem; max-height: 85vh; display: flex; flex-direction: column; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
                .search-box { flex: 1; position: relative; display: flex; align-items: center; border: 1px solid var(--border-color); border-radius: 0.75rem; padding: 0 1rem; background: var(--bg-primary); }
                .search-box input { border: none; background: transparent; padding: 0.75rem; width: 100%; color: var(--text-primary); }
                .search-box select { background: transparent; border: none; color: var(--text-primary); }
                
                .exercises-grid-lib { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; overflow-y: auto; padding-right: 0.5rem; }
                @media (max-width: 600px) { .exercises-grid-lib { grid-template-columns: 1fr; } }
                
                .lib-ex-card { background: var(--bg-primary); padding: 1.25rem; border-radius: 1rem; border: 1px solid var(--border-color); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; }
                .lib-ex-card:hover { border-color: var(--accent-primary); transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
                .lib-ex-info h4 { margin: 0 0 0.25rem 0; font-size: 1rem; }
                .badge { font-size: 0.65rem; background: var(--accent-primary); color: white; padding: 0.15rem 0.5rem; border-radius: 0.5rem; font-weight: 700; }
            `}</style>
        </div>
    );
};

export default TrainingPlanEditor;
