import levelUpService from './level-up.service';
import sideQuestService from './side-quests.service';
import leaderboardService from './leaderboard.service';
import coursesService from './courses.service';

export class CardService {
  constructor(levelUpService, sideQuestService, leaderboardService, coursesService) {
    this.levelUpService = levelUpService;
    this.sideQuestService = sideQuestService;
    this.leaderboardService = leaderboardService;
    this.coursesService = coursesService;
  }

  fetchCards() {
    this.levelUpService.getLevelUps();
    this.sideQuestService.getSideQuests();
    this.leaderboardService.fetch_last_month_points();
    this.coursesService.getPrescribedTraining();
  }
}

export default new CardService(levelUpService, sideQuestService, leaderboardService, coursesService);
