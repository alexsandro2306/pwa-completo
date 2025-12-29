const express = require('express');
const router = express.Router();

// Middlewares de autenticação
const { protect, authorize } = require('../middlewares/authMiddleware');

// Middleware de upload (já configurado com multer)
const {
    uploadProofImage: uploadProofMiddleware
} = require('../middlewares/uploadMiddleware');

// Controller
const {
    logWorkout,
    getWorkoutLogs,
    getWorkoutLog,
    updateWorkoutLog,
    deleteWorkoutLog,
    getWorkoutStats,
    getClientWorkoutHistory,
    uploadProofImage
} = require('../controllers/workoutController');

/**
 * @desc    Rotas de Workout Logs
 * Todas as rotas requerem autenticação
 */

// POST /api/workouts/log - Registar treino (Client)
router.post(
    '/log',
    protect,
    authorize('client'),
    logWorkout
);

// GET /api/workouts/logs - Obter todos os logs (filtrado por role)
router.get(
    '/logs',
    protect,
    getWorkoutLogs
);

// GET /api/workouts/logs/:id - Obter log específico
router.get(
    '/logs/:id',
    protect,
    getWorkoutLog
);

// PUT /api/workouts/logs/:id - Atualizar log (Client)
router.put(
    '/logs/:id',
    protect,
    authorize('client'),
    updateWorkoutLog
);

// DELETE /api/workouts/logs/:id - Eliminar log (Client/Admin)
router.delete(
    '/logs/:id',
    protect,
    deleteWorkoutLog
);

// GET /api/workouts/stats - Estatísticas (Client/Trainer)
router.get(
    '/stats',
    protect,
    getWorkoutStats
);

// GET /api/workouts/client/:clientId/history - Histórico do cliente (Trainer/Admin)
router.get(
    '/client/:clientId/history',
    protect,
    authorize('trainer', 'admin'),
    getClientWorkoutHistory
);

// POST /api/workouts/upload-proof - Upload imagem de prova (Client)
router.post(
    '/upload-proof',
    protect,
    authorize('client'),
    uploadProofMiddleware, // ✅ multer correto
    uploadProofImage       // controller
);

module.exports = router;
