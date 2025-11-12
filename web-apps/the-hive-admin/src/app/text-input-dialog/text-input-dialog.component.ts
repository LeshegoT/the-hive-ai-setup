import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-text-input-dialog',
    templateUrl: './text-input-dialog.component.html',
    styleUrls: ['./text-input-dialog.component.css'],
    standalone: false
})
export class TextInputDialogComponent implements OnInit {
  currentText = "";
  editable = true;

  constructor(
    private dialogRef: MatDialogRef<TextInputDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      currentText: string,
      editable?: boolean,
      title: string,
      placeholder: string,
      inputLabel?: string,
      warning?: string
    }
  ) {}

  ngOnInit() {
    this.dialogRef.disableClose = true;
    this.currentText = this.data.currentText;
    this.editable = this.data.editable !== false;
  }

  submit() {
    const reasonToSave = this.currentText.trim();
    if(reasonToSave.length === 0) {
      this.dialogRef.close();
    } else {
      this.dialogRef.close(reasonToSave);
    }
  }
}
