import express from 'express';

import { authRouter } from './routes/auth.routes.js';
import { conversationsRouter } from './routes/conversations.routes.js';
import { corsMiddleware, allowedCorsOrigins } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logging.js';

const app = express();

app.use(requestLogger);
app.use(corsMiddleware);
app.use(express.json());

app.use('/auth', authRouter);
app.use('/conversations', conversationsRouter);

app.use(errorHandler);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`backend listening on http://localhost:${port}`);
  console.log(`CORS allowed origins: ${allowedCorsOrigins.join(', ')}`);
});
