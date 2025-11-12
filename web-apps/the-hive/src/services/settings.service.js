import { post, get, patch } from './shared';
import { BaseService } from './base.service';

export class SettingsService extends BaseService{
  constructor() {
    super();
  }

  async savePreference(preference){
    await patch(this.buildApiUrl('/setting'), preference);
  }

  async saveInvitationPreference(preference){
    await post(this.buildApiUrl('settings/invitation-preference'), preference);
  }

  async saveInvitationPreferences(preferences){
    await patch(this.buildApiUrl('settings/invitation-preferences'), preferences);
  }

  async getAllPreferences() {
    let response = await get(this.buildApiUrl('settings'));
    let results = await response.json();
    return results;
  }

  async getLookupTableData(tableName) {
    let response = await get(this.buildApiUrl(`lookup-tables?tableName=${tableName}`));
    let results = await response.json();
    return results;
  }

  async getInvitationOptions() {
    let response = await get(this.buildApiUrl('settings/invitation-preference'));
    let results = await response.json();
    return results;
  }

  async getEventCategories() {
    const response = await get(this.buildApiUrl('event-categories'));
    const results = await response.json();
    return results;
  }

  async getOffices() {
    const response = await get(this.buildApiUrl('offices'));
    const results = await response.json();
    return results;
  }

}

export default new SettingsService();
