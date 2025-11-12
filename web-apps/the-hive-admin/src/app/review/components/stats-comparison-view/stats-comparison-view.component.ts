import { Component, OnInit, ViewChild} from '@angular/core';
import { FeedbackService } from '../../../review/services/feedback.service';
import { ReportService } from '../../../services/report.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StaffFilterComponent } from '../../../components/staff-filter/staff-filter.component';
export interface DataObject {
  labels: string[] ;
  seriesData: SeriesDataObject[];
}

export interface SeriesDataObject {
  name: string;
  data: string[];
}

@Component({
    selector: 'app-stats-comparison-view',
    templateUrl: './stats-comparison-view.component.html',
    styleUrls: ['./stats-comparison-view.component.css'],
    standalone: false
})
export class StatsComparisonViewComponent implements OnInit {
  userPrincipleName: string;
  data: DataObject  = {
    labels: [],
    seriesData: []
  };
  tagsInComparison: string[] = [];

  @ViewChild(StaffFilterComponent) staffFilterComponent;

  constructor(
    private feedbackService: FeedbackService,
    public reportService: ReportService,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit() {}

  addEmployee() {
    if (this.data === undefined || !this.data.labels.includes(this.userPrincipleName)) {

      this.feedbackService.getBarGraphUserFeedBack(this.userPrincipleName).subscribe((res) => {
        if (!res) {
          this.openSnackBar(this.userPrincipleName + ' has no reviews to display.');
        } else {
          this.setUpGraph(res);
        }
      });
    }   
  }

  setUpGraph(newPerson : DataObject){
    const result = this.data ;

    if(this.tagsInComparison.length != 0){
      //ensure new person has object for all existing tags
      this.tagsInComparison.forEach(compareTag => {
        const tagInNewPerson = newPerson.seriesData.some((personTag) => personTag.name == compareTag);

        if (!tagInNewPerson) {
          newPerson.seriesData.push({
            name: compareTag,
            data: [undefined],
          });
        }
      }
    )
    }

    newPerson.seriesData.forEach((tagItem) =>{
      const checkTagAlreadyExists = this.tagsInComparison.indexOf(tagItem.name); 

      //tag item does not exist and needs to be added to all other tags
      if(checkTagAlreadyExists == -1){
        this.tagsInComparison.push(tagItem.name);

        const numberOfPreExistingPersons = result.labels.length ;
        const undefinedArray = []

        for(let i = 0 ; i < numberOfPreExistingPersons ; i++){
          undefinedArray.push(undefined);
        }

        undefinedArray.push(tagItem.data[0]);

        result.seriesData.push({
          name: tagItem.name,
          data: undefinedArray
        });

      }else{ 
        //tag exists and must be added at this index
        result.seriesData[checkTagAlreadyExists].data.push(tagItem.data[0]);
      }

    });


    result.labels.push(newPerson.labels[0]);

    this.data = { labels: result.labels, seriesData: result.seriesData };
  }

  removeEmployee(person: string) {

    const personToRemoveIndex = this.data.labels.indexOf(person);

    const result = this.data;
    result.labels.splice(personToRemoveIndex, 1); 

    this.tagsInComparison = [];
    const tempSeriesData: SeriesDataObject[] = []; 

    result.seriesData.forEach(tag =>{
      tag.data.splice(personToRemoveIndex, 1);


      if (tag.data.some((item) => item != undefined )){
        this.tagsInComparison.push(tag.name);
        tempSeriesData.push(tag)
      }

    });

    result.seriesData = tempSeriesData; 

    if (result.seriesData[0] != undefined){
      if (result.seriesData[0].data[0] == undefined) {
        for (let i = 0; i < result.seriesData.length; i++) {
          if (result.seriesData[i].data[0] != undefined) {
            const tmp = result.seriesData[0];
            result.seriesData[0] = result.seriesData[i];
            result.seriesData[i] = tmp;
          }
        }
      }
    }



    this.data = { labels: result.labels, seriesData: result.seriesData };

  }

  openSnackBar(message: string) {
    this._snackBar.open(message, 'Dismiss', { duration: 3000 });
  }

  selectStaff() {
      this.userPrincipleName = this.staffFilterComponent.selectedUserPrinciple.userPrincipleName;
      this.addEmployee();
  }
}
