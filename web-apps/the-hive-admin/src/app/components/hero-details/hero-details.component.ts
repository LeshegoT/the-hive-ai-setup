import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { GuidesService } from '../../services/guides.service';
import { HeroesService } from '../../services/heroes.service';
import { map, switchMap } from 'rxjs/operators';

import { HeroMessagesComponent } from '../hero-messages/hero-messages.component';
import { HeroQuestsComponent } from '../hero-quests/hero-quests.component';

@Component({
    selector: 'app-hero-details',
    templateUrl: './hero-details.component.html',
    styleUrls: ['./hero-details.component.css'],
    standalone: false
})
export class HeroDetailsComponent implements OnInit {
  heroUPN$;
  hero$;
  guide$;

  constructor(
    private route: ActivatedRoute,
    private guidesService: GuidesService,
    private heroesService: HeroesService
  ) {}

  ngOnInit() {
    this.heroUPN$ = this.route.paramMap.pipe(
      map((params: ParamMap) => atob(params.get('hero')))
    );

    this.hero$ = this.heroUPN$.pipe(
      switchMap((upn: any) => this.heroesService.getHeroDetails(upn))
    );

    this.guide$ = this.hero$.pipe(
      switchMap((hero: any) => this.guidesService.getGuideDetails(hero.guideUserPrincipleName))
    );
  }

  encode(upn) {
    return btoa(upn);
  }
}
