import { Server } from 'socket.io';
import http from 'http';
import { socketConfig, messageConfig } from '../config/socket';

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
      console.log('user disconnected');
    });
    socket.on('get_status', (data: string) => {
      // get id from the data and find the status of the message from queue
      const { ids } = JSON.parse(data);
      if (!ids) {
        console.log('ids not found');
        socket.emit('status', { status: 'error', message: 'ids not found' });
        return;
      }
      socket.emit('status', messageConfig);
      // get status from redis-smq with ids
      // send via socket
    });
  });
  return io;
};
