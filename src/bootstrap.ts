import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { buildAppConfig } from './app/app.config';
import { RuntimeConfig } from './app/core/config/runtime-config';

export function bootstrap(config: RuntimeConfig): Promise<unknown> {
  return bootstrapApplication(AppComponent, buildAppConfig(config));
}
