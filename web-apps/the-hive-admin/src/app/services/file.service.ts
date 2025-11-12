import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { fileTypes } from '../shared/enums';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  constructor() {}

  /*
    file: the blob to download
    fileName: the name of the file with extension
    fileType: MIME type of the file, csv by default
  */
  downloadFile(file, fileName, fileType = 'text/csv') {
    saveAs(file, fileName, { type: fileType });
  }

  generateFile(data, fileName = 'data.csv', exportType: fileTypes = fileTypes.text) {
    const file = new Blob(['\ufeff' + data], { type: exportType });
    this.downloadFile(file, fileName);
  }

  generateCSVFile(headings, content, fileName = 'data') {
    const csvData = this.ConvertToCSV(headings, content);
    this.generateFile(csvData, `${fileName}.csv`, fileTypes.csv);
  }
  generateTextFile(text, fileName = 'data') {
    this.generateFile(text, fileName, fileTypes.text);
  }

  ConvertToCSV(headerList, objArray) {
    const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    let row = 'No,';
    for (const index in headerList) {
      row += headerList[index] + ',';
    }
    row = row.slice(0, -1);
    str += row + '\r\n';
    for (let i = 0; i < array.length; i++) {
      let line = i + 1 + '';
      for (const index in headerList) {
        const head = headerList[index];
        const value = array[i][head];
        line += ',' + (value ?? "")
      }
      str += line + '\r\n';
    }
    return str;
  }

  async setClipboard(text) {
    await navigator.clipboard.writeText(text);
  }

  CopyUPNs(people) {
    let UPNs = '';
    people.forEach((person) => {
      UPNs += person.userPrincipleName + ',';
    });

    this.setClipboard(UPNs);
  }
}
