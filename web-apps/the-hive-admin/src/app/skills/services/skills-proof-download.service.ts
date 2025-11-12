import { Injectable } from '@angular/core';
import { SkillsService } from './skills.service';
import { Observable, catchError, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SkillsProofDownloadService {
  constructor(private readonly skillService: SkillsService) {}

  downloadProof(storagePath: string, saveAsName: string): Observable<string> {
    return this.skillService.getProofBlob(storagePath).pipe(
      map((pdfBlob) => {
        const fileUrl = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = `${saveAsName || 'proof'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(fileUrl);
        return 'Proof successfully downloaded';
      }),
      catchError(() => {
        throw 'Failed to download proof';
      })
    );
  }
}
