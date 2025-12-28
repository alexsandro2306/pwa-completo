const express = require('express');
const router = express.Router();
const TrainerRequest = require('../models/TrainerRequest');
const User = require('../models/User');
const { protect, authorize } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Cliente envia pedido para ser treinado
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', protect, authorize('client'), async (req, res) => {
    try {
        const { trainerId, reason } = req.body;

        // Verificar se o trainer existe e está validado
        const trainer = await User.findById(trainerId);
        if (!trainer || trainer.role !== 'trainer' || !trainer.isValidated) {
            return res.status(400).json({
                success: false,
                message: 'Trainer inválido ou não validado'
            });
        }

        // Verificar se já tem um pedido pendente para este trainer
        const existingRequest = await TrainerRequest.findOne({
            client: req.user._id,
            newTrainer: trainerId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Já tens um pedido pendente para este trainer'
            });
        }

        // Criar pedido
        const request = await TrainerRequest.create({
            client: req.user._id,
            currentTrainer: req.user.trainerId || null, // null se ainda não tem trainer
            newTrainer: trainerId,
            reason: reason || 'Quero ser treinado por este trainer',
            status: 'pending'
        });

        const populatedRequest = await TrainerRequest.findById(request._id)
            .populate('client', 'name surname email username')
            .populate('newTrainer', 'name surname email');

        res.status(201).json({
            success: true,
            message: 'Pedido enviado com sucesso',
            data: populatedRequest
        });
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar pedido',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/requests/trainer:
 *   get:
 *     summary: Trainer vê pedidos dirigidos a ele
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 */
router.get('/trainer', protect, authorize('trainer'), async (req, res) => {
    try {
        const requests = await TrainerRequest.find({
            newTrainer: req.user._id,
            status: 'pending'
        })
            .populate('client', 'name surname email username phone')
            .populate('currentTrainer', 'name surname')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar pedidos'
        });
    }
});

/**
 * @swagger
 * /api/requests/{id}/accept:
 *   patch:
 *     summary: Trainer aceita pedido de cliente
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/accept', protect, authorize('trainer'), async (req, res) => {
    try {
        const request = await TrainerRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        // Verificar se o pedido é para este trainer
        if (request.newTrainer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Este pedido não é para ti'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Este pedido já foi processado'
            });
        }

        // Aceitar pedido
        request.status = 'approved';
        request.handledAt = new Date();
        await request.save();

        // Atualizar cliente com o novo trainer
        await User.findByIdAndUpdate(request.client, {
            trainerId: req.user._id
        });

        const populatedRequest = await TrainerRequest.findById(request._id)
            .populate('client', 'name surname email username')
            .populate('newTrainer', 'name surname');

        res.json({
            success: true,
            message: 'Pedido aceite! Cliente adicionado à tua lista',
            data: populatedRequest
        });
    } catch (error) {
        console.error('Erro ao aceitar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao aceitar pedido'
        });
    }
});

/**
 * @swagger
 * /api/requests/{id}/reject:
 *   delete:
 *     summary: Trainer rejeita pedido de cliente
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id/reject', protect, authorize('trainer'), async (req, res) => {
    try {
        const request = await TrainerRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        // Verificar se o pedido é para este trainer
        if (request.newTrainer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Este pedido não é para ti'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Este pedido já foi processado'
            });
        }

        // Rejeitar (marcar como rejeitado ou apagar)
        request.status = 'rejected';
        request.handledAt = new Date();
        await request.save();

        // Ou se preferir apagar completamente:
        // await TrainerRequest.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Pedido rejeitado'
        });
    } catch (error) {
        console.error('Erro ao rejeitar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao rejeitar pedido'
        });
    }
});

/**
 * @swagger
 * /api/requests/client:
 *   get:
 *     summary: Cliente vê seus próprios pedidos
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 */
router.get('/client', protect, authorize('client'), async (req, res) => {
    try {
        const requests = await TrainerRequest.find({
            client: req.user._id
        })
            .populate('newTrainer', 'name surname email')
            .populate('currentTrainer', 'name surname')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar pedidos'
        });
    }
});

module.exports = router;