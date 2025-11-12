import { html, fixture, expect } from '@open-wc/testing';
import sinon from 'sinon';
import { auth_service_stubs } from '../shared/stubs/auth.service.stub';

describe('Page - Leaderboard', () => {
  let fetch_leaderboard_stub;

  auth_service_stubs.uses_select_hero('test@bbd.co.za');

  before(async () => {
    let module = await import('../../../src/services/leaderboard.service');
    fetch_leaderboard_stub = sinon.stub(module.default, 'fetch_leaderboard').returns([1]);

    await import('../../../src/pages/leaderboard.page');
  });

  it('should initialise properly.', async () => {
    let el = await fixture(
      html`
        <e-leaderboard></e-leaderboard>
      `
    );
    expect(el).to.be.ok;
    expect(fetch_leaderboard_stub.called).to.be.ok;
    expect(el.leaderboard).to.deep.equal([]);
  });

  it('should set the leaderboard correctly', async () => {
    let el = await fixture(
      html`
        <e-leaderboard></e-leaderboard>
      `
    );

    let leaderboard = [
      {
        position: 1,
        userPrincipleName: 'one@bbd.co.za',
        pointsTotal: 100
      },
      {
        position: 2,
        userPrincipleName: 'two@bbd.co.za',
        pointsTotal: 50
      },
      {
        position: 3,
        userPrincipleName: 'three@bbd.co.za',
        pointsTotal: 1
      }
    ];

    el.stateChanged({
      app: {},
      leaderboard: {
        heroes: leaderboard
      }
    });

    expect(el.leaderboard).to.deep.equal(leaderboard);
  });
});
