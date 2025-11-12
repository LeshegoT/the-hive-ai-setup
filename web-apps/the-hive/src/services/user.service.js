import authService from './auth.service';
import { BaseService } from './base.service';
import { get } from './shared';

export class UserService extends BaseService {
  constructor() {
    super();
    this.imageCache = new Map();
    this.activeDirectoryProfileCache = new Map();
    this.loggedInUserStaffId = undefined;
  }

  async retrieveImage(person){
    let url;
    switch (person) {
      case 'me':
        url = `${this.config.graphApi}me/photo/$value`;
        break;

      case 'System':
      case 'system':
        url = 'images/hive.svg';
        break;

      default:
        url = `${this.config.graphApi}users/${encodeURIComponent(person)}/photo/$value`;
        break;
    }

    return authService.getAccessTokenHeader()
      .then((header) => fetch(url, { headers: header }))
      .then((response) => {
        if (response.status == 404) return;

        return response
          .blob()
          .then((blob) => (window.URL || window.webkitURL).createObjectURL(blob));
      });
  }

  async getImage(person) {
    if(this.imageCache.has(person)){
      return this.imageCache.get(person)
    } else {
      return this.retrieveImage(person).then( blobURL => {
        if(blobURL && !this.imageCache.has(person)){
          this.imageCache.set(person, blobURL);
        }
        return blobURL;
      })
    }
  }

  async getLoggedInUserStaffId(){
    if(this.loggedInUserStaffId){
      return this.loggedInUserStaffId;
    } else {
      const response = await get(this.buildApiUrl('staff/me/id'));
      this.loggedInUserStaffId = (await response.json()).staffId;
      return this.loggedInUserStaffId;
    }
  }

  async getActiveDirectoryProfile(person){
    if (this.activeDirectoryProfileCache.has(person)) {
      return this.activeDirectoryProfileCache.get(person);
    } else {
      return this.retrieveActiveDirectoryProfile(person).then(profile => {
        if (profile && !this.activeDirectoryProfileCache.has(profile)) {
          this.activeDirectoryProfileCache.set(person, profile);
        }
        return profile;
      });
    }
  }

  async retrieveActiveDirectoryProfile(person) {
    if (typeof person === 'string' && person.toLowerCase() === 'system') {
      return Promise.resolve({displayName:"The Hive"});
    } else {
      return authService.getAccessTokenHeader()
      .then((header) => fetch(`${this.config.graphApi}users/${encodeURIComponent(person)}`, { headers: header }))
      .then((response) => response.json());
    }
  }

  findUsers(searchText) {
    return authService.getAccessTokenHeader()
      .then((header) => fetch(`${this.config.graphApi}users/?$filter=startsWith(displayName,'${searchText}') or startswith(userPrincipalName,'${searchText}')&$select=userPrincipalName,displayName,city`, { headers: header }))
      .then((response) => response.json());
  }
}
//displayName city 

export default new UserService();
