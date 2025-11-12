import { Component, Inject, EventEmitter} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-level-up-warning-dialog',
    templateUrl: './level-up-warning-dialog.component.html',
    styleUrls: ['./level-up-warning-dialog.component.css'],
    standalone: false
})
export class LevelUpWarningDialogComponent {
    onConfirmClicked = new EventEmitter<string>();
    confirm = "Confirm";

    constructor(
      public dialogRef: MatDialogRef<LevelUpWarningDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: {warningMessage: string},
    ) {}

    public setProperties(insertWarningMessage: string){
      this.data = { warningMessage: insertWarningMessage };
    }

    handleClose(confirm: string) {
      this.onConfirmClicked.emit(confirm);
      this.dialogRef.close();
    }
}
