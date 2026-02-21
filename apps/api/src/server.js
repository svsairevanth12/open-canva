import express from 'express';
import healthRouter from './routes/healthRoutes.js';
import mediaRouter from './routes/mediaRoutes.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use('/health', healthRouter);
app.use('/media', mediaRouter);

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
