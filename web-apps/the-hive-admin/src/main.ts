import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

fetch('/api/config/admin.json')
  .then((resp) => resp.json())
  .then((json) => {
    const conf = { ...json };
    if (conf.PRODUCTION) {
      enableProdMode();
    }
    platformBrowserDynamic()
      .bootstrapModule(AppModule)
      .catch((err) => console.error('Problem bootstrapping angular project', err));
  });
