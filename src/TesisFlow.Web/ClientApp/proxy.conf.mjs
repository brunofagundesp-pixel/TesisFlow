const BEARER_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWQiOiIyMzU2MiIsIm5iZiI6MTc4NjQwNzUyMiwiZXhwIjoxNzg2NDkzOTIyLCJpYXQiOjE3ODY0MDc1MjIsImlzcyI6InRlc2lzLmluZi5iciIsImF1ZCI6InRlc2lzLmluZi5iciJ9.RYU_rZjHjZ1j754po0wApA4N3_uBbCBn4FkaerNXJig';

const authHandler = (proxy) => {
  proxy.on('proxyReq', (proxyReq) => {
    proxyReq.setHeader('Authorization', BEARER_TOKEN);
  });
};

const proxyEntry = {
  target: 'https://servico-api.tesiscc.tesis.inf.br',
  secure: false,
  changeOrigin: true,
  configure: authHandler,
};

export default {
  '/odata': proxyEntry,
  '/api/tesiscc': proxyEntry,
  '/api/Diario': proxyEntry,
  '/api/TesisTW': proxyEntry,
  '/api/TesisCc': proxyEntry,
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
