import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Import implementations
import { PrismaUserRepository } from './infrastructure/database/prisma.user.repository.js';

// Import services
import { UserService } from './application/services/user.service.js';

// Import controllers
import { UserController } from './presentation/controllers/user.controller.js';

// Import routers
import { createUserRouter } from './route/user.router.js';
import ErrorMiddleware from './middleware/error.middleware.js';

// --- DEPENDENCY INJECTION ---
const prisma = new PrismaClient();

// Repositories
const userRepository = new PrismaUserRepository(prisma);

// Services
const userService = new UserService(userRepository);

// Controllers
const userController = new UserController(userService);

// Routers
const userRouter = createUserRouter(userController);

// --- EXPRESS APP SETUP ---
const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/users', userRouter);
// You can add other routers here, following the same dependency injection pattern

// Route for the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Error Handling Middleware
app.use(ErrorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
});