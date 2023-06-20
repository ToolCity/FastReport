import http from 'http';
import cors from 'cors';
import express, { Request, Response } from 'express';
import { socketWorker } from './services/socket';
const PORT = process.env.PORT || 5000;
import dotenv from 'dotenv';
import routes from './routes';
import { initialiseRedisQueueManager } from './services/redis_smq';
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors<Request>());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/views/public'));
app.use('/api', routes);

app.get('/', (req: Request, res: Response) => {
  res.sendFile(__dirname + '/views/index.html');
});

const server = http.createServer(app);

server.listen(PORT, async () => {
  try {
    await initialiseRedisQueueManager();
    console.log(`Server is running on port ${PORT}.`);
  } catch (e) {
    console.error(e);
  }
});

server.setTimeout(1000 * 60 * 2);
export const io = socketWorker(server);
