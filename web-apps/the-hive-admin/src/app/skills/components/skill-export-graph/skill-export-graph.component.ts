import { Component } from '@angular/core';
import { SkillsImportExportService } from '../../services/skills-importexport.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { catchError, Observable } from 'rxjs';

type ExportStateType  = 'good' | 'error';

@Component({
    selector: 'skill-export-graph',
    templateUrl: './skill-export-graph.component.html',
    styleUrls: ['./skill-export-graph.component.css'],
    imports: [
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        CommonModule
    ]
})
export class SkillsExportComponent {
    message = "";
    exportState: ExportStateType  = 'good';
    exportResponse$: Observable<string>;

  constructor(private skillsImportExportService: SkillsImportExportService) {
  }

  exportDB(): void {
    this.skillsImportExportService.makeGraphExport()
    .subscribe({
        next: response => { this.setMessage(`Successfully made export ${response.timestamp}`, "good")},
        error: _err => this.setMessage("Failed to export graph", "error")
      });
  }

  setMessage(textToDisplay: string, state: ExportStateType ){
    this.message = textToDisplay;
    this.exportState = state;
  }


}
