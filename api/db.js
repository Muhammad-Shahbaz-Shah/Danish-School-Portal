import serverless from 'serverless-http';
import serverModule from '../dist/server.cjs';
const app = serverModule.default || serverModule;
export default serverless(app);
