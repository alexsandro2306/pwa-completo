const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB conectado com sucesso'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// Importar rotas (baseado nos ficheiros que existem)
const authRoutes = require('./src/routes/auth');
const trainersRoutes = require('./src/routes/trainers');
const adminRoutes = require('./src/routes/admin');
const requestsRoutes = require('./src/routes/requests');
const exerciseRoutes = require('./src/routes/exercises');
const messageRoutes = require('./src/routes/messages');
const notificationRoutes = require('./src/routes/notifications');
const uploadRoutes = require('./src/routes/upload');
const usersRoutes = require('./src/routes/users');
const workoutsRoutes = require('./src/routes/workouts');

// Registar rotas
app.use('/api/auth', authRoutes);
app.use('/api/trainers', trainersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/requests', requestsRoutes); // ← ROTA NOVA
app.use('/api/exercises', exerciseRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/workouts', workoutsRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({
    message: 'FitTrainer API',
    version: '1.0.0',
    routes: [
      '/api/auth',
      '/api/trainers',
      '/api/admin',
      '/api/requests',
      '/api/exercises',
      '/api/messages',
      '/api/notifications',
      '/api/upload',
      '/api/users',
      '/api/workouts'
    ]
  });
});

// WebSocket para Chat e Notificações
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);

  // Join room por userId
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} entrou na sua room`);
  });

  // Enviar mensagem
  socket.on('send_message', (data) => {
    io.to(data.receiverId).emit('receive_message', data);
  });

  // Notificação
  socket.on('send_notification', (data) => {
    io.to(data.userId).emit('receive_notification', data);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
  });
});

// Disponibilizar io globalmente
app.set('io', io);

// Serviço de notificações
try {
  const NotificationService = require('./src/services/notificationService');
  NotificationService.initialize(io);
  console.log('✅ Serviço de notificações inicializado');
} catch (err) {
  console.warn('⚠️ Serviço de notificações não disponível');
}

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🔌 WebSocket pronto para conexões`);
});

module.exports = { app, io };