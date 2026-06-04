
import { Router } from 'express';
import {
  listConversations,
  postConversation,
} from '../controllers/conversations.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { messagesRouter } from './messages.routes.js';

export const conversationsRouter = Router();

conversationsRouter.use(authenticate);

conversationsRouter.get('/', listConversations);
conversationsRouter.post('/', postConversation);
conversationsRouter.use('/:id/messages', messagesRouter);
