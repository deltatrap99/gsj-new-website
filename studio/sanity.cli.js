import {defineCliConfig} from 'sanity/cli';
import {projectId, dataset} from './project.js';

export default defineCliConfig({
  api: {projectId, dataset},
  deployment: {appId: 'es34iq98mxc9m3iktz07mwnb', autoUpdates: false},
});
