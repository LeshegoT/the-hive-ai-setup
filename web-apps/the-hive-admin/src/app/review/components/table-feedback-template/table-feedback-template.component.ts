import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FeedbackService } from '../../../review/services/feedback.service';
import { TableService } from '../../../services/table.service';

export interface TemplateInterface {
  feedbackAssignmentTemplateId: string,
  templateName: string,
  subjectLineTemplate: string,
  textContentTemplate: string,
  urlTemplate: string, 
  titleTemplate: string
}

@Component({
    selector: 'app-table-feedback-template',
    templateUrl: './table-feedback-template.component.html',
    styleUrls: ['./table-feedback-template.component.css'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    standalone: false
})

export class TableFeedbackTemplateComponent implements OnInit, AfterViewInit {
  templateData = new MatTableDataSource<TemplateInterface>()
  templateColumns = [
    'FeedbackAssignmentTemplateId',
    'TemplateName',
    'SubjectLineTemplate', 
    'TitleTemplate'
  ];
  defaultTemplate: TemplateInterface;
  newTemplateValues: TemplateInterface;
  expandedTemplate: TemplateInterface | null = null;
  cachedTemplate: TemplateInterface | null;
  creating: boolean;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private feedbackService: FeedbackService,
    public tableService: TableService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.creating = false;
    this.refresh();
    this.defaultTemplate = {
      templateName: "New Template",
      subjectLineTemplate: "",
      textContentTemplate: "",
      urlTemplate: "", 
      titleTemplate: "",
      feedbackAssignmentTemplateId: undefined
    }
  }

  updateSelected(template: TemplateInterface) {
    const sameTemplate = this.expandedTemplate === template;
    this.creating = false;
    this.expandedTemplate = sameTemplate ? null : template;
    this.cachedTemplate = { ...this.expandedTemplate };
  }

  checkCreateExpand() {
    if (this.creating) {
      return 'expanded';
    } else {
      return 'collapsed';
    }
  }

  checkDetailExpand(template: TemplateInterface) {
    if (template === this.expandedTemplate) {
      return 'expanded';
    } else {
      return 'collapsed';
    }
  }

  ngAfterViewInit() {
    this.templateData.paginator = this.paginator;
    this.templateData.sort = this.sort;
  }

  createNewTemplate() {
    this.creating = true;
    this.newTemplateValues = {...this.defaultTemplate};
  }

  cancelCreateTemplate() {
    this.creating = false;
  }

  onSave(data) {
    const result = this.creating
      ? this.feedbackService.createNewFeedbackTemplate(data)
      : this.feedbackService.updateFeedbackTemplate(data);
    result.subscribe({
      next: () => this.updateDisplayedTemplates(data.feedbackAssignmentTemplateId),
      error: (error) =>
        this.snackBar.open(
          `An Error has occured while 
        ${data.feedbackAssignmentTemplateId != undefined ? 'updating' : 'creating'} the template: ${error}`,
          '',
          { duration: 2000 }
        ),
    });
    this.expandedTemplate = null;
    this.creating = false;
  }

  updateDisplayedTemplates(templateId : number){
    this.refresh();
    this.snackBar.open(`Template Successfully ${templateId != undefined ? 'Updated' : 'Created'}!`, '', {
      duration: 2000,
    });
  }

  refresh(){
    this.feedbackService.getFeedbackAssignmentTemplates().subscribe((templates) => {
      this.templateData.data = templates;
    });
  }
}