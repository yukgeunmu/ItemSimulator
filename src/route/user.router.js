import express from 'express';

// This router is now a function that accepts the controller
export const createUserRouter = (userController) => {
  const router = express.Router();

  router.post('/signup', userController.signUp);
  router.post('/login', userController.signIn);

  return router;
};
