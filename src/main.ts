import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

const baseHref = document.querySelector('base')?.getAttribute('href') ?? '/';
console.log(baseHref, 'baseHerf');

const configUrl = `${baseHref}assets/config.client.json`;

// Use config from index.html if already loaded (from config.client.json), else fetch
function bootstrapWithConfig(config: any) {
  (window as any)['appConfig'] = config;
  return bootstrapApplication(AppComponent, appConfig);
}

const existing = (window as any)['appConfig'];
if (existing) {
  bootstrapWithConfig(existing);
} else {
  fetch(configUrl)
    .then((response) => {
      if (!response.ok) console.error(`Config not found at ${configUrl}`);
      console.log(response, 'response');
      return response.json();
    })
    .then((config) => bootstrapWithConfig(config))
    .catch((err) => {
      bootstrapWithConfig({
        apiBaseUrl: '',
        clientName: 'DefaultClient',
      });
    });
}
