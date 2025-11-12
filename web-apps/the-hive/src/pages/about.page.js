import { html } from 'lit';
import { shared, animations } from '../styles';
import { PageViewElement } from './page-view-element.js';

let styles = html`
  <style>
    ${shared()} ${animations()} h1,
    h3 {
      font-weight: lighter;
    }

    em {
      color: var(--app-primary-color);
      font-style: normal;
    }

    p {
      margin-bottom: 3em;
    }

    .one,
    .two,
    .three {
      display: block;
      height: 12.5em;
      width: 12.5em;
      margin-top: -2em;
      background-repeat: no-repeat;
    }

    .one,
    .three {
      float: left;
      margin-left: 2em;
    }

    .two {
      float: right;
      background-size: 10em;
      margin-right: 2em;
    }

    .three {
      background-size: 22em;
      background-position-x: -7em;
      background-position-y: -8em;
    }

    @media (min-width: 460px) {
      .one,
      .two,
      .three {
        height: 19em;
      }
      .two {
        background-size: 16em;
      }
      .three {
        background-size: 32em;
        background-position-x: -10em;
        background-position-y: -10em;
      }
    }
  </style>
`;

class AboutComponent extends PageViewElement {
  render() {
    return html`
      ${styles}

      <section class="fade-in">
        <span
          class="one"
          style="background-image: url('images/characters/robot.1.svg')"
        ></span>
        <h1>The Hero’s Journey</h1>
        <p>
          BBD’s Continuous Learning Programme (CLP) that has been gamified for ultimate
          learning and engagement. The Programme consists of two tracks; Adventure and
          Level Up. These two tracks run in parallel throughout the year and you can
          partake in both simultaneously. Keeping yourself on top of your game is your
          responsibility, but we are here to support, encourage and mentor you along your
          journey to become your own hero.
        </p>

        <span
          class="two"
          style="background-image: url('images/characters/robot.2.svg')"
        ></span>

        <h3>Adventure</h3>
        <p>
          Tackle the Adventure Quests to build your knowledge and follow the path of the
          Masters in this personalised continuous learning journey. Work through the three
          quest stages with the help of enlightened mission commanders.
        </p>

        <h3>Level up</h3>
        <p>
          Unlock achievements, earn points and raise through the ranks to prove your
          skill, adaptability and knowledge. Complete the 9 core tasks in a mix of single-
          and multi-player modes.
        </p>

        <span
          class="three"
          style="background-image: url('images/characters/robot.3.svg')"
        ></span>

        <h3>Side quests</h3>
        <p>
          No hero’s journey is complete without side quests to fuel your ranking, prove
          your skill, share your wisdom and earn respect as someone who knows things worth
          knowing. There are four side quest categories.
        </p>

        <h3>Quest log</h3>
        <p>
          Record your meta-story and define your character arc throughout your journey to
          become your own learning hero. Keep track of your achievements, rewards, goals,
          touchpoints and the wisdom you gain along the way.
        </p>
      </section>
    `;
  }
}

window.customElements.define('e-about', AboutComponent);
