import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp({ devMode: true });

app.listen(config.port, () => {
  console.log(`LearnFlow API running on port ${config.port}`);
});
