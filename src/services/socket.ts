import { Server } from 'socket.io';
import http from 'http';
import { socketConfig, statusConfig } from '../config/socket';

export const socketWorker = (
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
) => {
  const io = new Server(server, {
    path: '/socket.io',
    cors: {
      origin: '*', // this is for local testing
    },
  });

  io.on('connection', socket => {
    console.log('a user connected : ', socket.id);
    socket.on('join', (data: string) => {
      const requestData = JSON.parse(data);
      console.log(requestData, requestData['clientId']);
      socketConfig[requestData['clientId']] = socket.id;
      console.log(socketConfig);
    });
    socket.on('disconnect', () => {
      const key = Object.keys(socketConfig).find(key => socketConfig[key] === socket.id);
      if (key) delete socketConfig[key];
      console.log('user disconnected');
    });
    socket.on('get_status', (data: string) => {
      //TODO: could also get client ID and return status of all messages
      const { apiKey } = JSON.parse(data);
      if (!apiKey) {
        socket.emit('status', { status: 'error', message: 'send apiKey to get the status' });
        return;
      }
      const status = statusConfig[apiKey.toString()];
      socket.emit('status', status);
    });
  });
  return io;
};
