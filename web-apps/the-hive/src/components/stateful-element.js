import { connect } from 'pwa-helpers/connect-mixin';
import { store } from '../store';
import { html, LitElement, css } from 'lit';

export class StatefulElement extends connect(store)(LitElement) {
  stateChanged(state) {
    this.routeData = state.app.routeData;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }
}
