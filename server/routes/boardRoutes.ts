import { Router } from 'express';
import {
  BoardController,
  createBoardSchema,
  updateBoardSchema,
  inviteMemberSchema,
} from '../controllers/boardController.ts';
import { StatsController } from '../controllers/statsController.ts';
import { validateBody } from '../middleware/validate.ts';
import { authenticate, authorizeBoardMember } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

router.get('/', BoardController.listBoards);
router.post('/', validateBody(createBoardSchema), BoardController.createBoard);
router.get('/:id', authorizeBoardMember, BoardController.getBoard);
router.patch('/:id', authorizeBoardMember, validateBody(updateBoardSchema), BoardController.updateBoard);
router.delete('/:id', authorizeBoardMember, BoardController.deleteBoard);
router.post('/:id/invite', authorizeBoardMember, validateBody(inviteMemberSchema), BoardController.inviteMember);
router.get('/:id/stats', authorizeBoardMember, StatsController.getBoardStats);

export default router;
