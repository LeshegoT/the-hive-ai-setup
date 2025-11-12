import { html } from 'lit';
import iconService from '../services/icon.service';
import { StatefulElement } from './stateful-element';
import { shared, animations, link, material_card } from '../styles';



const styles = html`
  <style>
    ${shared()} ${animations()} ${link()} ${material_card()}  
    

    .event-heading{
        display: flex ;
        justify-content: center ;
    }

    .mdc-card{
        height: auto;
        background-repeat: no-repeat;
        background-position: 1em 3em;
        fill: var(--app-tertiary-color);
        font-weight: lighter;
        margin-bottom: 1em;
        min-height: 15em;
        box-shadow: 2px 3px 4px var(--app-dashboard-shadow);
    }

    .mdc-card:hover {
        box-shadow: 2px 3px 8px var(--app-dashboard-shadow);
    }

    .event-info {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .eventImg {
        display: flex;
        justify-content: center;
    }

    .thumbnail {
        max-width: 100%;
      }

    

  </style>
  `;



export default class VoteEventCard extends StatefulElement{


    render() {
        return html `
        ${styles}
            <div class="mdc-card">
                <div class="event-info">
                    <a href="/vote/${this.card.votingEventId}">         
                            <img class="thumbnail" src="${this.thumbnail}" />
                            <h4 class="event-heading">${this.card.eventName}</h4>
                    </a>
                <div>
            </div>
        `;
    }

    static get properties() {
        return {
          card: Object,
          thumbnail: Object
        };
      }
    
      updated(changedProps) {
        if (changedProps.has('card')) {
          iconService.loadStaticEventImage(this.card.icon).then((pic) => {
            this.thumbnail = pic;
          });
        }
      }
    
      stateChanged(state) {
        //this.canBePurchased = selectCanItemBeAdded(state, this.card.price);
      }
}

window.customElements.define('e-vote-event', VoteEventCard);