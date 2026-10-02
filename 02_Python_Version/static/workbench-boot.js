import { mountWorkbench } from './app.js';
const workbench = mountWorkbench();
await workbench.ready;
if (location.hash === '#knowledge') workbench.showView('knowledge');
