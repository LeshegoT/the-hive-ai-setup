import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TracksService {

  constructor(private sharedService: SharedService) { }

  getAllTracksWithCourses(): Observable<any> {
    return this.sharedService.get('allTracks');
  }
  getAllTrack(): Observable<any> {
    return this.sharedService.get('track');
  }

  getTracksIcons(): Observable<any> {
    return this.sharedService.get('getTracksIcons');
  }

  updateTrack(updatedTrack) : Observable<any> {
    return this.sharedService.post('updateTrack', {'track' : updatedTrack});
  }
  deleteTrack(trackId): Observable<any> {
    return this.sharedService.delete(`deleteTrack/${trackId}`);
  }
  createTrack(track): Observable<any> {
    return this.sharedService.post('createTrack', track);
  }
}
