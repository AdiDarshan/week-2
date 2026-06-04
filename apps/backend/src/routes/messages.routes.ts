
import { Router } from 'express';
import {
  listMessages,
  postMessage,
} from '../controllers/messages.controller.js';

export const messagesRouter = Router({ mergeParams: true });

messagesRouter.get('/', listMessages);
messagesRouter.post('/', postMessage);
