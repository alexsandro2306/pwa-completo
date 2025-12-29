const User = require('../models/User');
const TrainerRequest = require('../models/TrainerRequest');

// @desc    Obtém o perfil do utilizador logado
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('trainer', 'firstName lastName email phone')
            .populate('clients', 'firstName lastName email phone');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilizador não encontrado.' });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter utilizador.', error: error.message });
    }
};

// @desc    Atualiza o perfil do utilizador logado
exports.updateProfile = async (req, res) => {
    const { firstName, lastName, phone, theme, email } = req.body;

    try {
        const user = req.user;

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone) user.phone = phone;

        if (theme && ['light', 'dark'].includes(theme)) {
            user.theme = theme;
        }

        const updatedUser = await user.save();

        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            user: {
                id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                phone: updatedUser.phone,
                theme: updatedUser.theme
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao atualizar perfil', error: error.message });
    }
};

// @desc    Solicita alteração de Personal Trainer (Apenas Cliente)
exports.requestTrainerChange = async (req, res) => {
    const { newTrainerId, reason } = req.body;

    try {
        const client = req.user;

        if (client.role !== 'client') {
            return res.status(403).json({ success: false, message: 'Apenas clientes podem solicitar a troca de treinador.' });
        }

        const newTrainer = await User.findOne({ _id: newTrainerId, role: 'trainer', isValidated: true });

        if (!newTrainer) {
            return res.status(404).json({ success: false, message: 'Novo Personal Trainer inválido ou não validado.' });
        }

        const existingRequest = await TrainerRequest.findOne({ client: client._id, status: 'pending' });

        if (existingRequest) {
            return res.status(400).json({ success: false, message: 'Já existe um pedido de alteração de treinador pendente.' });
        }

        const request = await TrainerRequest.create({
            client: client._id,
            currentTrainer: client.trainer,
            newTrainer: newTrainerId,
            reason: reason,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Pedido de alteração de treinador enviado para aprovação do administrador.',
            data: request
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao solicitar alteração de treinador', error: error.message });
    }
};

// @desc    Obtém a lista de clientes do Personal Trainer
exports.getMyClients = async (req, res) => {
    if (req.user.role !== 'trainer') {
        return res.status(403).json({ success: false, message: 'Apenas Personal Trainers podem aceder a esta lista.' });
    }

    try {
        const clients = await User.find({ trainer: req.user._id, role: 'client' })
            .select('-password -qrCodeSecret -clients -trainer');

        res.status(200).json({
            success: true,
            results: clients.length,
            data: clients
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter lista de clientes.', error: error.message });
    }
};

// @desc    Obtém lista pública de trainers validados (SEM AUTENTICAÇÃO)
// ✅ ENDPOINT PÚBLICO - Usado pela página /trainers
exports.getValidatedTrainers = async (req, res) => {
    try {
        const trainers = await User.find({
            role: 'trainer',
            isValidated: true
        })
            .select('firstName lastName email avatar bio')
            .lean();

        const trainersWithCount = await Promise.all(
            trainers.map(async (trainer) => {
                const clientCount = await User.countDocuments({
                    trainer: trainer._id,
                    role: 'client'
                });
                return { ...trainer, clientCount };
            })
        );

        res.json({
            success: true,
            results: trainersWithCount.length,
            trainers: trainersWithCount
        });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao carregar trainers'
        });
    }
};

// @desc    Obtém trainers validados (COM AUTENTICAÇÃO - para uso interno)
exports.getTrainers = async (req, res) => {
    try {
        const trainers = await User.find({
            role: 'trainer',
            isValidated: true
        })
            .select('firstName lastName email avatar bio phone clients')
            .populate('clients', 'firstName lastName email');

        res.json({
            success: true,
            results: trainers.length,
            trainers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar trainers',
            error: error.message
        });
    }
};