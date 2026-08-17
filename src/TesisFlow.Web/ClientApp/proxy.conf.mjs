export default {
  '/hubs': {
    target: 'http://localhost:5051',
    secure: false,
    changeOrigin: true,
    ws: true,
  },
  '/hubs/chamadas': {
    target: 'http://localhost:5051',
    secure: false,
    changeOrigin: true,
    ws: true,
  },
  '/api': {
    target: 'http://localhost:5051',
    secure: false,
    changeOrigin: true,
  },
};
