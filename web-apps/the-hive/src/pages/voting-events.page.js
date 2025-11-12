import { html } from 'lit';
import { StatefulPage } from './stateful-page-view-element.js';
import {
  selectActiveVotingEvents
} from '../selectors/voting.selectors';
import votingService from '../services/voting.service';
import iconService from '../services/icon.service';
import { material_card } from '../styles';

import { shared, animations, hex, link, lists, activities } from '../styles';


import '../components/title.component';
import '../components/side-quest-name.component';
import '../components/icon.component';
import '../components/submit-message.component';
import '../components/sub-title.component';
import '../components/message-list.component';
import '../components/votes.component';
import '../components/vote-event.component';


const styles = html`
  <style>
    ${shared()} ${hex()} ${animations()} ${link()} ${lists()} ${activities()} ${material_card()}  
    
    .events_section{
        display: flex;
        flex-wrap: wrap;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
    }

    .title {
        font-size: var(--readable-font-size);
    }
    
    section{
        padding-top:5em;
        margin:0;
    }

    e-vote-event {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        width: 30%;
        min-width: 17.5em;
        justify-content: center;
      }
    
    .event-heading{
        display: flex ;
        justify-content: center ;
    }

  </style>
`;


class Voting extends StatefulPage{
    render() {
       
        return html`
        ${styles}

            <section>
                <e-title name="Voting Events" icon="images/logos/battle-deck.svg"></e-title>
                    <div class="events_section">
                        ${this.voteEvents && this.voteEvents.length
                            ? this.voteEvents.map(
                                (event) =>
                                {
                                    return html`
                                        <e-vote-event .card="${event}"></e-vote-event>  
                                    `;
                                })
                            : this.showNoEvents()}
                    </div>
                
            </section>
        `;
      }

      showNoEvents() {
          return html `
            <div class="events-heading">
                <h3 class="heading_no_events">No available events to vote for</h3>
            </div>
          `
      }
      
      static get properties() {
        return {
          voteEvents: {type: Array},
          thumbnail: Object
        };
      }
    
      
      firstUpdated() {
        votingService.getActiveVotingEvents();
      }
    
      stateChanged(state) {
        this.voteEvents = selectActiveVotingEvents(state);
      }
}

window.customElements.define('e-voting', Voting);