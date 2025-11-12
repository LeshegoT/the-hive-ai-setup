import { Component, ElementRef, ViewChild, EventEmitter, Output, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-file-drop',
    templateUrl: './file-drop.component.html',
    styleUrls: ['./file-drop.component.css'],
    standalone: false
})
export class FileDropComponent {
  private _isDragging: boolean;

  constructor() { }

  @ViewChild('fileSelector') public fileSelector: ElementRef;
  @Output() public selectedFiles = new EventEmitter<File[]>();
  @Input() error = false;


  public get isDragging(): boolean { return this._isDragging; }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    this._isDragging = false;

    const result = [];
    for (let item = 0; item < event.dataTransfer.items.length; item++) {
      result.push(event.dataTransfer.items[item].getAsFile());
    }

    this.emitFiles(result);
  }

  public onFilesSelected(files: FileList): void {
    if (files && files.length > 0) {
      const result = [];
      for (let i = 0; i < files.length; i++) {
        result.push(files[i]);
      }
  
      this.fileSelector.nativeElement.value = ''; // required to trigger (change) if user immediately uploads same named file 
      this.emitFiles(result);
    } else {
      // do nothing since the user hasn't uploaded anything
    }
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    this._isDragging = true;
  }

  public stopDrag(event: DragEvent): void {
    this._isDragging = false;
    event.preventDefault();
    event.stopPropagation();
  }


  private emitFiles(files: File[]): void {
    this.selectedFiles.emit(files);
  }
}