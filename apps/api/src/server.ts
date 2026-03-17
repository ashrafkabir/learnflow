import { createApp } from './app.js';

const PORT = parseInt(process.env.PORT || '3002', 10);
const app = createApp({ devMode: true });

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LearnFlow API running on http://0.0.0.0:${PORT}`);
});
