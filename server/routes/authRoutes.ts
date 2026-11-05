import { Router } from 'express';
import { AuthController, registerSchema, loginSchema } from '../controllers/authController.ts';
import { validateBody } from '../middleware/validate.ts';
import { authenticate } from '../middleware/auth.ts';

const router = Router();

router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.get('/me', authenticate, AuthController.me);
router.get('/users', authenticate, AuthController.listUsers);

export default router;
