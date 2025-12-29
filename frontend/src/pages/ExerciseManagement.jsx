import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Plus,
    Search,
    Filter,
    Trash2,
    Edit,
    Eye,
    Dumbbell,
    MessageCircle,
    Info,
    X,
    ExternalLink
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const ExerciseManagement = () => {
    const { addNotification } = useNotifications();
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Peito',
        description: '',
        videoLink: ''
    });

    const categories = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core', 'Cardio', 'Flexibilidade'];

    useEffect(() => {
        fetchExercises();
    }, [searchTerm, categoryFilter]);

    const fetchExercises = async () => {
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (categoryFilter) params.category = categoryFilter;

            const res = await api.get('/exercises', { params });
            setExercises(res.data.data);
        } catch (err) {
            addNotification('error', 'Erro ao carregar exercícios');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingExercise) {
                await api.patch(`/exercises/${editingExercise._id}`, formData);
                addNotification('success', 'Exercício atualizado!');
            } else {
                await api.post('/exercises', formData);
                addNotification('success', 'Exercício criado com sucesso!');
            }
            setShowModal(false);
            resetForm();
            fetchExercises();
        } catch (err) {
            addNotification('error', err.response?.data?.message || 'Erro ao salvar exercício.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza que deseja remover este exercício?')) return;
        try {
            await api.delete(`/exercises/${id}`);
            addNotification('success', 'Exercício removido!');
            fetchExercises();
        } catch (err) {
            addNotification('error', 'Erro ao remover exercício.');
        }
    };

    const handleEdit = (ex) => {
        setEditingExercise(ex);
        setFormData({
            name: ex.name,
            category: ex.category || 'Peito',
            description: ex.description || '',
            videoLink: ex.videoLink || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category: 'Peito',
            description: '',
            videoLink: ''
        });
        setEditingExercise(null);
    };

    if (loading && exercises.length === 0) return <div className="loading">Carregando biblioteca...</div>;

    return (
        <div className="exercise-mgmt animate-fade">
            <header className="page-header">
                <div>
                    <h1>Biblioteca de Exercícios</h1>
                    <p>Faça a gestão dos exercícios disponíveis no sistema.</p>
                </div>
                <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={20} /> Novo Exercício
                </button>
            </header>

            <div className="glass filters-bar">
                <div className="search-input">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="select-filter">
                    <Filter size={18} />
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="">Todas as Categorias</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div className="exercises-grid">
                {exercises.length === 0 ? (
                    <div className="glass empty-state">
                        <Dumbbell size={48} />
                        <p>Nenhum exercício encontrado na biblioteca.</p>
                    </div>
                ) : (
                    exercises.map(ex => (
                        <div key={ex._id} className="glass ex-card">
                            <div className="ex-badge">{ex.category}</div>
                            <h4>{ex.name}</h4>
                            <p className="description">{ex.description || 'Sem descrição.'}</p>
                            <div className="ex-footer">
                                {ex.videoLink ? (
                                    <a href={ex.videoLink} target="_blank" rel="noreferrer" className="btn-link">
                                        <ExternalLink size={16} /> Ver Vídeo
                                    </a>
                                ) : <span className="no-video">Sem vídeo</span>}
                                <div className="actions">
                                    <button className="btn-icon" onClick={() => handleEdit(ex)}>
                                        <Edit size={16} />
                                    </button>
                                    <button className="btn-icon delete" onClick={() => handleDelete(ex._id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="glass modal-content animate-slide-up">
                        <div className="modal-header">
                            <h3>{editingExercise ? 'Editar Exercício' : 'Registar Exercício'}</h3>
                            <button className="btn-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="input-group">
                                <label>Nome do Exercício</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Categoria</label>
                                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Descrição</label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="input-group">
                                <label>Link de Vídeo (YouTube/Vimeo)</label>
                                <input
                                    type="url"
                                    value={formData.videoLink}
                                    onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-text" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Salvar Exercício</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .exercise-mgmt { display: flex; flex-direction: column; gap: 2rem; }
                .filters-bar { padding: 1rem; display: flex; gap: 1rem; align-items: center; }
                .search-input { flex: 1; display: flex; align-items: center; gap: 0.75rem; background: var(--bg-primary); padding: 0.5rem 1rem; border-radius: 0.75rem; border: 1px solid var(--border-color); }
                .search-input input { border: none; background: transparent; width: 100%; color: var(--text-primary); outline: none; }
                .select-filter { display: flex; align-items: center; gap: 0.5rem; background: var(--bg-primary); padding: 0.5rem 1rem; border-radius: 0.75rem; border: 1px solid var(--border-color); }
                .select-filter select { border: none; background: transparent; color: var(--text-primary); cursor: pointer; }
                
                .exercises-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
                .ex-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
                .ex-badge { font-size: 0.65rem; background: var(--accent-primary); color: white; padding: 0.2rem 0.6rem; border-radius: 1rem; width: fit-content; font-weight: 700; text-transform: uppercase; }
                .description { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                .ex-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
                .btn-link { font-size: 0.8rem; color: var(--accent-primary); text-decoration: none; display: flex; align-items: center; gap: 0.4rem; font-weight: 600; }
                
                .actions { display: flex; gap: 0.5rem; }
                .btn-icon { background: var(--bg-primary); border: 1px solid var(--border-color); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); transition: 0.3s; }
                .btn-icon:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
                .btn-icon.delete:hover { border-color: #ef4444; color: #ef4444; }

                .empty-state { padding: 4rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--text-secondary); }
                
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { width: 100%; max-width: 480px; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; }
                .btn-close { background: transparent; border: none; cursor: pointer; color: var(--text-secondary); }
                .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
                .btn-text { background: transparent; border: none; cursor: pointer; color: var(--text-secondary); font-weight: 500; }
            `}</style>
        </div>
    );
};

export default ExerciseManagement;
