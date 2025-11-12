import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'limitLength',
    standalone: false
})
export class LimitLengthPipe implements PipeTransform {
  transform(value: string, length?: number) {
    if(value?.length > length) {
      const newString = value.substring(0, length ? 150 : length).padEnd(length + 3, '.');
      return newString
    } else {
      return value;
    }
  }
}

@Pipe({
    name: 'removeMarkDown',
    standalone: false
})
export class RemoveMarkDownPipe implements PipeTransform {
  transform(value: string) {
    return value.replace(/(?:__|[*#])|\[(.*?)\]\(.*?\)/gm, '');
  }
}

@Pipe({
    name: 'removeIconPath',
    standalone: false
})
export class RemoveIconPathPipe implements PipeTransform {
  transform(value: string) {
    return value.substring(value.lastIndexOf('/')+1);
  }
}