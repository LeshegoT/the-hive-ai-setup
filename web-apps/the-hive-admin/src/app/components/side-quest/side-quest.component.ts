import { Component, OnInit, OnDestroy } from '@angular/core'
import { SideQuestService } from '../../services/side-quest.service';
import { Subscription } from 'rxjs';
import { contentTypeCodes } from '../../shared/enums';
import { SideQuest } from '../../shared/interfaces';
import { TypeInterface } from '../table-type/table-type.component';

@Component({
    selector: 'app-side-quest',
    templateUrl: './side-quest.component.html',
    styleUrls: ['./side-quest.component.css'],
    standalone: false
})
export class SideQuestComponent implements OnInit, OnDestroy{
  dataSubscription: Subscription = new Subscription();
  sideQuests?: SideQuest[];
  types: TypeInterface[] = [];
  public contentTypeCodes = contentTypeCodes;
  constructor(private sideQuestService: SideQuestService){
  }
  ngOnInit() {
    this.refreshSideQuests();
    this.refreshSideQuestsTypes()
  }

  refreshSideQuests() {
    const sideQuestSubscription: Subscription = this.sideQuestService.unfilteredSideQuests().subscribe((sideQuests)=>{
      this.sideQuests = sideQuests
    })
    this.dataSubscription.add(sideQuestSubscription);
  }

  refreshSideQuestsTypes(){
    const sideQuestTypeSubscription: Subscription = this.sideQuestService.getSideQuestTypes().subscribe((types) => {
      this.types = types;
    });
    this.dataSubscription.add(sideQuestTypeSubscription);
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}