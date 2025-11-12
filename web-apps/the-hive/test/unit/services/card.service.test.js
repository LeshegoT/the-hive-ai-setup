import { expect } from '@open-wc/testing';
import { CardService } from '../../../src/services/card.service';
import sinon from 'sinon';

describe('Service - CardService', () => {
  let level_up_service = { getLevelUps: sinon.stub() };
  let side_quest_service = { getSideQuests: sinon.stub() };
  let leaderboard_service = { fetch_last_month_points: sinon.stub() };
  let courses_service = { getPrescribedTraining: sinon.stub() };
  let card_service = new CardService(level_up_service, side_quest_service, leaderboard_service, courses_service);

  it('should initialise correctly.', async () => {
    expect(card_service.levelUpService).to.be.ok;
    expect(card_service.sideQuestService).to.be.ok;
    expect(card_service.leaderboardService).to.be.ok;
    expect(card_service.coursesService).to.be.ok;
  });

  describe('fetchCards', async () => {
    it('should call all of the card loading methods.', async () => {
      await card_service.fetchCards();

      expect(level_up_service.getLevelUps.called).to.be.ok;
      expect(side_quest_service.getSideQuests.called).to.be.ok;
      expect(leaderboard_service.fetch_last_month_points.called).to.be.ok;
      expect(courses_service.getPrescribedTraining.called).to.be.ok;
    });
  });
});
