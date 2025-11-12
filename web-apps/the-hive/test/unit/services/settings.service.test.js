import { expect } from '@open-wc/testing';
import { SettingsService } from '../../../src/services/settings.service';
import { fetch_stub_returns_json } from '../shared/stubs/fetch.stub';

describe('Service - SettingsService', () => {
  let settingsService;
  let preferences = [];
  let invitationPreferences = [];
  let lookupTableData = [];

  before(() => {
    fetch_stub_returns_json(preferences);
    fetch_stub_returns_json(invitationPreferences);
    fetch_stub_returns_json(lookupTableData);
    settingsService = new SettingsService();
  });

  it('should get all preferences', async () => {
    const response = await settingsService.getAllPreferences();
    expect(response).to.be.ok;
  });

  it('should get invitation options', async () => {
    const response = await settingsService.getInvitationOptions();
    expect(response).to.be.ok;
  });

  it('should get lookup table data', async () => {
    const tableName = 'TshirtSized';
    const tableData = await settingsService.getLookupTableData(tableName);
    expect(tableData).to.be.ok;
  });


});
