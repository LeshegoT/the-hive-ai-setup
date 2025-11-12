import { Component, Input, OnInit, SimpleChanges, OnChanges } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css'],
    standalone: true
})
export class ProfileComponent implements OnInit, OnChanges {
  displayName: string;
  imageToShow: SafeUrl;
  isImageLoading: boolean;
  @Input() selectedUpn: string = undefined;

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private domSanitizer: DomSanitizer
  ) {
    // Initialize imageToShow with a default placeholder image
    this.imageToShow = this.domSanitizer.bypassSecurityTrustUrl(
      'assets/images/profilePlaceholder.svg'
    );
  }

  ngOnInit() {
    this.authService.getUser().pipe().subscribe(user => {
      this.displayName = user.substr(0, user.indexOf(' '));
      this.getImageFromService();
    });
  }

  getImageFromService() {
    this.isImageLoading = true;
    this.profileService.getImage(this.selectedUpn ? this.selectedUpn : 'me').then((blob) => {
      if (blob) {
        const image = window.URL.createObjectURL(blob);
        this.imageToShow = this.domSanitizer.bypassSecurityTrustUrl(image);
      } else {
        this.imageToShow = this.domSanitizer.bypassSecurityTrustUrl(
          'assets/images/profilePlaceholder.svg'
        );
      }
      this.isImageLoading = false; // Set loading to false after the image is loaded
    }).catch(() => {
      this.imageToShow = this.domSanitizer.bypassSecurityTrustUrl(
        'assets/images/profilePlaceholder.svg'
      );
      this.isImageLoading = false; // Handle errors by ensuring loading is set to false
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedUpn']) {
      this.getImageFromService();
    } else{
      // The selectedUpn did not change, so no need to update the image
    }
  }
}
