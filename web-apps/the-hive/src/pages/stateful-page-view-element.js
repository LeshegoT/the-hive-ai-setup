import { PageViewElement } from './page-view-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';

export class StatefulPage extends connect(store)(PageViewElement) {
  constructor(){
    super();
  }

  stateChanged(state) {
    this.routeData = state.app.routeData;
    this._loggedIn=state.app.loggedIn;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }
}
