import { Component, OnInit, Input } from '@angular/core';
import { QuestService } from '../../services/quest.service';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-hero-quests',
    templateUrl: './hero-quests.component.html',
    styleUrls: ['./hero-quests.component.css'],
    standalone: false
})
export class HeroQuestsComponent implements OnInit {
  @Input() heroUPN$: Observable<string>;
  quests$;

  constructor(private questService: QuestService) { }

  ngOnInit() {
    this.quests$ = this.heroUPN$.pipe(
      switchMap((upn: any) => this.questService.getAllQuestsForHero(upn)),
      map((quests: any) => quests.map((quest) => {
        return {...quest, missions: this.questService.getQuestMissions(quest.questId)};
      }))
    );
  }

  encode(upn) {
    return btoa(upn);
  }

}
