import { Config } from '../config';
import { requestId } from './routes/support';
import * as base64 from 'base-64';

export class ViewContext {
  constructor(public config: Config, private options: any) {}

  // Returns the page title
  get fullTitle() {
    const titleParts = [this.options.title, this.config.project.name];
    return titleParts.filter((part) => part).join(' - ');
  }

  // Returns a plain object whose properties are accessible from within the
  // template (e.g. returns `{ title: 'Home' }` which can be referenced as
  // `<%= title %>` from within an EJS template).
  get locals() {

    let authInfo;

    if (this.config.web.adminAuth) {
      authInfo = this.config.web.adminAuth.split(':');
      authInfo = base64.encode(authInfo[0] + ":" + authInfo[1]);
    }

    return {
      ...this.options,
      fullTitle: this.fullTitle,
      requestId: requestId(),
      authInfo
    };
  }
}
