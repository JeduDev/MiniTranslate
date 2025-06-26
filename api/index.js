const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const translateRoutes = require('./routes/translateRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const historyRoutes = require('./routes/historyRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/history', historyRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Global error handler - asegura que todas las respuestas sean JSON
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  
  const statusCode = err.status || 500;
  
  // Asegurarse de que la respuesta siempre sea JSON
  res.status(statusCode).json({
    error: true,
    message: err.message || 'Error interno del servidor',
    status: statusCode,
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 