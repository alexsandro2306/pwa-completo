const Request = require('../models/Request');
const User = require('../models/User');

// @desc    Criar pedido de associação (Cliente → Trainer)
// @route   POST /api/requests
// @access  Private (Client)
exports.createRequest = async (req, res) => {
    try {
        const { trainerId, reason } = req.body;
        const clientId = req.user._id;

        // ✅ VERIFICAR SE CLIENTE JÁ TEM TRAINER ASSOCIADO
        const client = await User.findById(clientId);
        if (client.trainer) {
            return res.status(400).json({
                success: false,
                message: 'Já tens um Personal Trainer associado. Para mudares, solicita ao administrador.'
            });
        }

        // Verificar se trainer existe e está validado
        const trainer = await User.findOne({
            _id: trainerId,
            role: 'trainer',
            isValidated: true
        });

        if (!trainer) {
            return res.status(404).json({
                success: false,
                message: 'Personal Trainer não encontrado ou não validado'
            });
        }

        // Verificar se já existe pedido pendente
        const existingRequest = await Request.findOne({
            client: clientId,
            trainer: trainerId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Já existe um pedido pendente para este trainer'
            });
        }

        // Criar pedido
        const request = await Request.create({
            client: clientId,
            trainer: trainerId,
            reason: reason || 'Pedido de associação',
            type: 'association',
            status: 'pending'
        });

        await request.populate('client', 'firstName lastName email avatar');
        await request.populate('trainer', 'firstName lastName email avatar');

        res.status(201).json({
            success: true,
            request,
            message: 'Pedido enviado com sucesso'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao criar pedido',
            error: error.message
        });
    }
};

// @desc    Obter pedidos (filtrado por role)
// @route   GET /api/requests
// @access  Private
exports.getRequests = async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === 'trainer') {
            filter.trainer = req.user._id;
        } else if (req.user.role === 'client') {
            filter.client = req.user._id;
        }
        // Admin vê todos

        const requests = await Request.find(filter)
            .populate('client', 'firstName lastName email avatar')
            .populate('trainer', 'firstName lastName email avatar')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter pedidos',
            error: error.message
        });
    }
};

// @desc    Aceitar pedido de associação
// @route   PATCH /api/requests/:id/accept
// @access  Private (Trainer)
exports.acceptRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        // Verificar se o trainer é o destinatário
        if (request.trainer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Este pedido já foi processado'
            });
        }

        // ✅ ASSOCIAR CLIENTE AO TRAINER
        const client = await User.findById(request.client);

        if (client.trainer) {
            return res.status(400).json({
                success: false,
                message: 'Este cliente já foi associado a outro trainer'
            });
        }

        client.trainer = req.user._id;
        await client.save();

        // Adicionar cliente à lista do trainer
        await User.findByIdAndUpdate(
            req.user._id,
            { $addToSet: { clients: request.client } }
        );

        // Atualizar pedido
        request.status = 'accepted';
        await request.save();

        await request.populate('client', 'firstName lastName email avatar');
        await request.populate('trainer', 'firstName lastName email avatar');

        res.json({
            success: true,
            request,
            message: `Cliente ${client.firstName} associado com sucesso!`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao aceitar pedido',
            error: error.message
        });
    }
};

// @desc    Rejeitar pedido
// @route   PATCH /api/requests/:id/reject
// @access  Private (Trainer)
exports.rejectRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        if (request.trainer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Este pedido já foi processado'
            });
        }

        request.status = 'rejected';
        await request.save();

        await request.populate('client', 'firstName lastName email avatar');
        await request.populate('trainer', 'firstName lastName email avatar');

        res.json({
            success: true,
            request,
            message: 'Pedido rejeitado'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao rejeitar pedido',
            error: error.message
        });
    }
};

// @desc    Eliminar pedido
// @route   DELETE /api/requests/:id
// @access  Private
exports.deleteRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        // Verificar autorização
        const isOwner = request.client.toString() === req.user._id.toString();
        const isRecipient = request.trainer.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isRecipient && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        await request.deleteOne();

        res.json({
            success: true,
            message: 'Pedido eliminado'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao eliminar pedido',
            error: error.message
        });
    }
};

// @desc    Criar pedido de mudança de trainer (Cliente → Admin)
// @route   POST /api/requests/change-trainer
// @access  Private (Client)
exports.requestTrainerChange = async (req, res) => {
    try {
        const { newTrainerId, reason } = req.body;
        const clientId = req.user._id;

        // ✅ VERIFICAR SE CLIENTE TEM TRAINER ATUAL
        const client = await User.findById(clientId).populate('trainer');
        if (!client.trainer) {
            return res.status(400).json({
                success: false,
                message: 'Não tens um trainer associado. Podes fazer um pedido de associação diretamente.'
            });
        }

        // Verificar se novo trainer existe
        const newTrainer = await User.findOne({
            _id: newTrainerId,
            role: 'trainer',
            isValidated: true
        });

        if (!newTrainer) {
            return res.status(404).json({
                success: false,
                message: 'Novo trainer não encontrado ou não validado'
            });
        }

        if (client.trainer._id.toString() === newTrainerId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Este já é o teu trainer atual'
            });
        }

        // Verificar se já existe pedido pendente
        const existingRequest = await Request.findOne({
            client: clientId,
            type: 'trainer_change',
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Já tens um pedido de mudança pendente'
            });
        }

        // Criar pedido para admin
        const request = await Request.create({
            client: clientId,
            trainer: client.trainer._id,
            newTrainer: newTrainerId,
            reason: reason || 'Pedido de mudança de trainer',
            type: 'trainer_change',
            status: 'pending'
        });

        await request.populate('client', 'firstName lastName email');
        await request.populate('trainer', 'firstName lastName email');
        await request.populate('newTrainer', 'firstName lastName email');

        res.status(201).json({
            success: true,
            request,
            message: 'Pedido de mudança enviado ao administrador'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao criar pedido de mudança',
            error: error.message
        });
    }
};

// @desc    Aprovar mudança de trainer (Admin)
// @route   PATCH /api/requests/:id/approve-change
// @access  Private (Admin)
exports.approveTrainerChange = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request || request.type !== 'trainer_change') {
            return res.status(404).json({
                success: false,
                message: 'Pedido de mudança não encontrado'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Este pedido já foi processado'
            });
        }

        // ✅ TROCAR TRAINER
        const client = await User.findById(request.client);
        const oldTrainerId = client.trainer;

        client.trainer = request.newTrainer;
        await client.save();

        // Remover da lista do trainer antigo
        await User.findByIdAndUpdate(
            oldTrainerId,
            { $pull: { clients: request.client } }
        );

        // Adicionar à lista do novo trainer
        await User.findByIdAndUpdate(
            request.newTrainer,
            { $addToSet: { clients: request.client } }
        );

        request.status = 'accepted';
        await request.save();

        await request.populate('client', 'firstName lastName email');
        await request.populate('trainer', 'firstName lastName email');
        await request.populate('newTrainer', 'firstName lastName email');

        res.json({
            success: true,
            request,
            message: 'Mudança de trainer aprovada!'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao aprovar mudança',
            error: error.message
        });
    }
};