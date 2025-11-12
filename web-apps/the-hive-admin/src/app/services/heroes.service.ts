import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';
import { Hero } from '../shared/interfaces';

@Injectable({
  providedIn: 'root'
})
export class HeroesService {
  constructor(private sharedService: SharedService) {}

  getHeroDetails(hero: string): Observable<any> {
    return this.sharedService.get(`heroDetails?upn=${hero}`);
  }

  getAllHeroMessages(upn: string): Observable<any> {
    return this.sharedService.get(`allHeroMessages?upn=${upn}`);
  }

  updateHerosGuide(hero: Hero): Observable<any> {
    return this.sharedService.patch(`hero/${hero.heroUserPrincipleName}/reassign-guide`, hero);
  }
}
