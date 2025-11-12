import '../shared/stubs/globals';
import { html, fixture, expect } from '@open-wc/testing';
import { auth_service_stubs } from '../shared/stubs/auth.service.stub';
import { user_service_stubs } from '../shared/stubs/user.service.stub';
import '../../../src/components/leaderboard-hero.component';

describe('Component - LeaderboardHero', () => {
  let hero = {
    position: 1,
    userPrincipleName: 'test@bbd.co.za',
    realName: 'abc xyz',
    pointsTotal: 100,
    lastRanking: {
      lastPosition: 1,
      lastPoints: 100
    }
  };

  auth_service_stubs.uses_select_hero('test@bbd.co.za');

  afterEach(async () => {
    user_service_stubs.getActiveDirectoryProfile.reset();
  });

  it('should initialise properly.', async () => {
    let displayName = 'Random Test Dude(ette)';
    user_service_stubs.getActiveDirectoryProfile.returns(
      Promise.resolve({
        displayName
      })
    );
    
    let el = await fixture(
      html`
        <e-leaderboard-hero .hero=${hero}></e-leaderboard-hero>
      `
    );
    expect(el).to.be.ok;
    expect(auth_service_stubs.getUserPrincipleName.called).to.be.ok;
    expect(el.hero).to.deep.equal(hero);
  });

  it('should have last ranking data.', async () => {
    let displayName = 'Random Test Dude(ette)';
    user_service_stubs.getActiveDirectoryProfile.returns(
      Promise.resolve({
        displayName
      })
    );
    
    let el = await fixture(
      html`
        <e-leaderboard-hero .hero=${hero}></e-leaderboard-hero>
      `
    );

    expect(el).to.be.ok;
    expect(el.hero.lastRanking).to.deep.equal(hero.lastRanking);
  });

  it('should set the display name from only a userPrincipleName.', async () => {
    let displayName = 'Random Test Dude(ette)';
    user_service_stubs.getActiveDirectoryProfile.returns(
      Promise.resolve({
        displayName
      })
    );

    let el = await fixture(
      html`
        <e-leaderboard-hero .hero=${hero}></e-leaderboard-hero>
      `
    );

    expect(user_service_stubs.getActiveDirectoryProfile.calledOnce).to.be.ok;
    expect(el.displayName).to.equal(displayName);
  });

  it(`should set the display name and profile picture if it's passed in, and not fetch it.`, async () => {
    let displayName = 'Random Test Dude(ette)';
    let profilePictureData = 'BASE_64_STRING';

    let heroWithDisplayName = {
      ...hero,
      displayName,
      profilePictureData
    };

    let el = await fixture(
      html`
        <e-leaderboard-hero .hero=${heroWithDisplayName}></e-leaderboard-hero>
      `
    );

    expect(user_service_stubs.getActiveDirectoryProfile.called).to.not.be.ok;
    expect(el.displayName).to.equal(displayName);
    expect(el.profilePictureData).to.equal(profilePictureData);
  });

  it(`should display properly.`, async () => {
    let displayName = 'Random Test Dude(ette)';
    let profilePictureData = 'BASE_64_STRING';

    let heroWithDisplayName = {
      ...hero,
      displayName,
      profilePictureData
    };

    let el = await fixture(
      html`
        <e-leaderboard-hero .hero=${heroWithDisplayName}></e-leaderboard-hero>
      `
    );

    expect(user_service_stubs.getActiveDirectoryProfile.called).to.not.be.ok;
    expect(el).shadowDom.to.equal(`
      <div class="position position-${heroWithDisplayName.position}">
        <span>${heroWithDisplayName.position}</span>
        <e-hex></e-hex>
      </div>
      <e-profile></e-profile>
      <div class="person-name">
        <span>${heroWithDisplayName.realName}</span>
      </div>
      <div class="rank">
        <div>${heroWithDisplayName.lastRanking.lastPosition}</div>
        <div class="rank same"></div>
      </div>
      <div class="points-total"><span>${heroWithDisplayName.pointsTotal}</span></div>
    `);
  });
});
