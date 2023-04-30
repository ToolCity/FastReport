import { Server } from 'socket.io';
import http from 'http';

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
    socket.on('join', (data: Record<string, string>) => {
      socket.join(data.room);
    });
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
    socket.on('get_status', (data: Record<string, unknown>) => {
      // get id from the data and find the status of the message from queue
      const { ids } = data;
      if (!ids) {
        console.log('ids not found');
        socket.emit('status', { status: 'error', message: 'ids not found' });
        return;
      }
      console.log('ids', ids);
      // get status from redis-smq
      // send via socket
    });
  });
  return io;
};
