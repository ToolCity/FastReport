import http from 'http';
import express from 'express';
import { socketWorker } from './services/socket';
const PORT = process.env.PORT || 5000;
import dotenv from 'dotenv';
import routes from './routes';
dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

server.setTimeout(1000 * 60 * 2);
export const io = socketWorker(server);
