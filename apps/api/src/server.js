import express from 'express';
import healthRouter from './routes/healthRoutes.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use('/health', healthRouter);

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
