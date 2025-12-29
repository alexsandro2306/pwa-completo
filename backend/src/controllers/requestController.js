const Request = require('../models/Request');
const User = require('../models/User');

// @desc    Criar pedido de associação
// @route   POST /api/requests
// @access  Private (Client)
exports.createRequest = async (req, res) => {
    try {
        console.log('📥 Pedido recebido:', req.body);

        // ✅ Aceitar ambos os campos
        const trainer = req.body.trainer || req.body.trainerId;
        const { reason } = req.body;
        const clientId = req.user.id;

        console.log('🔍 Dados extraídos:', { trainer, reason, clientId });

        // Validação
        if (!trainer || !reason) {
            console.log('❌ Campos em falta');
            return res.status(400).json({
                success: false,
                message: 'Trainer ID e motivo são obrigatórios'
            });
        }

        // Verificar se o trainer existe e está validado
        const trainerUser = await User.findOne({
            _id: trainer,
            role: 'trainer',
            isValidated: true
        });

        console.log('🔍 Trainer encontrado:', trainerUser ? {
            id: trainerUser._id,
            nome: trainerUser.firstName + ' ' + trainerUser.lastName,
            isValidated: trainerUser.isValidated
        } : 'NÃO ENCONTRADO');

        if (!trainerUser) {
            console.log('❌ Trainer inválido ou não validado');
            return res.status(400).json({
                success: false,
                message: 'Trainer inválido ou não validado'
            });
        }

        // Verificar se cliente já tem trainer
        const client = await User.findById(clientId);
        console.log('🔍 Cliente encontrado:', client ? {
            id: client._id,
            nome: client.firstName + ' ' + client.lastName,
            temTrainer: !!client.trainer
        } : 'NÃO ENCONTRADO');

        if (client.trainer) {
            console.log('❌ Cliente já tem trainer');
            return res.status(400).json({
                success: false,
                message: 'Já possui um Personal Trainer associado'
            });
        }

        // Verificar pedido duplicado
        const existingRequest = await Request.findOne({
            client: clientId,
            trainer: trainer,
            status: 'pending'
        });

        if (existingRequest) {
            console.log('❌ Pedido duplicado');
            return res.status(400).json({
                success: false,
                message: 'Já existe um pedido pendente para este trainer'
            });
        }

        // Criar pedido
        const request = await Request.create({
            client: clientId,
            trainer: trainer,
            reason,
            type: 'association',
            status: 'pending'
        });

        console.log('✅ Pedido criado com sucesso:', request._id);

        await request.populate([
            { path: 'client', select: 'firstName lastName email username' },
            { path: 'trainer', select: 'firstName lastName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Pedido enviado com sucesso',
            data: request
        });
    } catch (error) {
        console.error('❌ Erro ao criar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao processar pedido',
            error: error.message
        });
    }
};

// @desc    Listar pedidos do cliente
// @route   GET /api/requests/my
// @access  Private (Client)
exports.getMyRequests = async (req, res) => {
    try {
        const requests = await Request.find({ client: req.user.id })
            .populate('trainer', 'firstName lastName email avatar')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            results: requests.length,
            data: requests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar pedidos',
            error: error.message
        });
    }
};

// @desc    Listar pedidos pendentes (Admin/Trainer)
// @route   GET /api/requests
// @access  Private (Admin/Trainer)
exports.getAllRequests = async (req, res) => {
    try {
        const filter = {};

        // Se for trainer, ver apenas seus pedidos
        if (req.user.role === 'trainer') {
            filter.trainer = req.user.id;
        }

        const requests = await Request.find(filter)
            .populate('client', 'firstName lastName email username avatar')
            .populate('trainer', 'firstName lastName email avatar')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            results: requests.length,
            data: requests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar pedidos',
            error: error.message
        });
    }
};

// @desc    Aceitar pedido (Admin)
// @route   PATCH /api/requests/:id/accept
// @access  Private (Admin)
exports.acceptRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('client')
            .populate('trainer');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Este pedido já foi processado'
            });
        }

        // ✅ Associar cliente ao trainer
        await User.findByIdAndUpdate(request.client._id, {
            trainer: request.trainer._id
        });

        // ✅ Adicionar cliente à lista do trainer
        await User.findByIdAndUpdate(request.trainer._id, {
            $addToSet: { clients: request.client._id }
        });

        // ✅ Atualizar status do pedido
        request.status = 'accepted';
        await request.save();

        res.json({
            success: true,
            message: 'Pedido aceite com sucesso',
            data: request
        });

    } catch (error) {
        console.error('Erro ao aceitar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao processar pedido',
            error: error.message
        });
    }
};

// @desc    Rejeitar pedido (Admin)
// @route   PATCH /api/requests/:id/reject
// @access  Private (Admin)
exports.rejectRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
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

        res.json({
            success: true,
            message: 'Pedido rejeitado',
            data: request
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao processar pedido',
            error: error.message
        });
    }
};

// @desc    Apagar pedido
// @route   DELETE /api/requests/:id
// @access  Private (Admin/Owner)
exports.deleteRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        // Apenas admin ou o próprio cliente pode apagar
        if (req.user.role !== 'admin' && request.client.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Não autorizado'
            });
        }

        await request.deleteOne();

        res.json({
            success: true,
            message: 'Pedido removido'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao remover pedido',
            error: error.message
        });
    }
};