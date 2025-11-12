import '../shared/stubs/globals';
import { html, fixture, expect } from '@open-wc/testing';
import { getSideQuests, registerForSideQuest } from '../shared/stubs/side-quests.service.stub';
import sinon from 'sinon';

// import '../../../src/pages/side-quest.page';

// describe('Page - Side Quest', () => {
//   it('should initialise properly.', async () => {
//     let el = await fixture(
//       html`
//         <e-side-quest></e-side-quest>
//       `
//     );

//     expect(el).to.be.ok;
//     expect(getSideQuests.called).to.be.ok;
//   });

//   it('should render properly.', async () => {

//     let el = await fixture(
//       html`
//         <e-side-quest></e-side-quest>
//       `
//     );

//     el.sideQuest = {
//       id: '1',
//       icon: 'icon',
//       name: 'name',
//       hasAttended: false,
//       hasRSVPed: false,
//       externalEvent: false,
//       userSideQuest: undefined,
//       startDate: new Date(Date.now() * 2)
//     };

//     expect(el).shadowDom.to.equal(``);
//   });

//   it('should call registerForSideQuest when the register button is pressed', async () => {
//     let el = await fixture(
//       html`
//         <e-side-quest></e-side-quest>
//       `
//     );

//     el.sideQuest = {
//       id: '1',
//       icon: 'icon',
//       name: 'name',
//       hasAttended: false,
//       hasRSVPed: false,
//       externalEvent: false,
//       userSideQuest: undefined,
//       startDate: new Date(Date.now() * 2)
//     };

//     el.register(el.sideQuest);

//     expect(registerForSideQuest.called).to.be.ok;
//   });
// });
