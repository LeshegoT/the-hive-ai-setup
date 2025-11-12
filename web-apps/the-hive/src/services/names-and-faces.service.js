import authService from "./auth.service";
import { BaseService } from "./base.service";
import { get } from "./shared";

export class NamesAndFacesService extends BaseService {

    constructor(){
        super();
    }

    async getBBDUsers(filters){
        let parameters = [];
        let employmentDate = {};
        
        for (const key in filters) {
            if(filters[key] != null && filters[key] != ''){
                if(key === 'employmentFrom' || key === 'employmentTo'){
                    employmentDate[key] = filters[key];
                }else {
                    parameters.push(`${key}=${filters[key]}`);
                }
            }
        }

        if(Object.keys(employmentDate).length > 0){
            if(employmentDate?.employmentFrom > employmentDate.employmentTo){
                throw new Error('Employment To date should be later than Employment From');
            }else{
                parameters.push(`employmentDate=${JSON.stringify(employmentDate)}`);
            }
        }

        let response = await get(this.buildApiUrl(`names-and-faces${parameters.length > 0 ? '?'+parameters.join('&') : ''}`));
        if(response.ok){
            return response.json();
        }else {
            let { message } = await response.json();
            throw new Error(message);
        }
    }

    async getAllUnits(){
        let response = await get(this.buildApiUrl(`units`));
        return response.json();
    }

    async getAllOffices(){
        let response = await get(this.buildApiUrl(`offices`));
        return response.json();
    }

    async getBBDGroups(searchGroup) {
        let goNext = true;
        let nextUrl = '';
        let allGroups = [];

        while (goNext) {
          const groupSearchURLParams = new URLSearchParams({ 
            '$filter': `startswith(mail,'${searchGroup}')`,
            '$top': '999',
            '$select': 'displayName,mail'
          });
          const url = nextUrl || groupSearchURLParams.toString();
          const response = await authService
          .getAccessTokenHeader()
          .then((header) => fetch(`${this.config.graphApi}groups?${url}`, { headers: header }))
          .then((response) => response.json());

          if (Array.isArray(response.value)) {
            const groupsWithMail = response.value.filter((groupDetail) => groupDetail.mail !== null);
            allGroups.push(...groupsWithMail);

            nextUrl = response['@odata.nextLink']
              ? response['@odata.nextLink'].replace('https://graph.microsoft.com/beta/groups?', '')
              : '';
            goNext = !!nextUrl;
          } else {
            goNext = false;
          }
        }
        return allGroups.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    async getUserMobilePhone(upn){
        let user = await authService
            .getAccessTokenHeader()
            .then((header) => fetch(`${this.config.graphApi}users/${encodeURIComponent(upn)}?select=mobilePhone`, { headers: header }))
            .then((response) => response.json());
        return user.mobilePhone;
    }

  /**
   * Asynchronously converts an image from a URL to a base64 data URL.
   * @param {string} url - The URL of the image to convert.
   * @returns {Promise<string>} A Promise that resolves with the base64 data URL of the image,
   *                            or rejects with an error if image loading fails.
   */
  async getBase64ImageFromURL(url) {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        let canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        let dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = (error) => {
        reject(error);
      };
      img.src = url;
    });
  }
}

export default new NamesAndFacesService();