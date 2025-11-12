import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import skillsService from '../../../src/services/skills.service';
import { fetch_stub, fetch_stub_returns_json } from '../shared/stubs/fetch.stub';

describe('Service - SkillService', () => {
  it('should initialise correctly.', () => {
    expect(skillsService.config).to.be.ok;
  });


  describe('Skill service API calls', () => {
    beforeEach(() => fetch_stub_returns_json({}));
    afterEach(() => fetch_stub.reset());
    it('Should return error message when deleting fails', async () => {
      let deleted = await skillsService.deleteAttribute('JavaScript');
  
      // TODO: RE - we should stub the staffId and check the correct API URL was called 
      // with the correct body and headers et
      expect(deleted).to.deep.equal({"error": "Failed to delete JavaScript. Please try again later"});
    });

    it('Should return success message when deleting succeeds', async () => {
      const attribute = 'JavaScript';
      const attributeType = 'programming';
      const expectedResponse = `${attribute} has been removed from your portfolio.`;
    
      fetch_stub.resolves({
        ok: true, 
        json: () => Promise.resolve({}), 
      });

      const deleted = await skillsService.deleteAttribute(attribute, attributeType);
      expect(deleted).to.deep.equal({ success: expectedResponse });
      fetch_stub.reset()
    });

    it('Should upload file', async () => {
      let upload = await skillsService.uploadUserFile('JavaScript');
      // TODO: RE - we should stub the file object and check the correct API URL was called 
      // with the correct body and headers etc
      expect(upload).to.be.ok;
    });

    it('Should search', async () => {
      let search = await skillsService.getAttributeSearchResults('test');
      // TODO: RE - we should check the correct API URL was called with the correct body and headers etc
      expect(search).to.be.ok;
    });

    it('Should get skill levels', async () => {
      let levels = await skillsService.getSkillLevels();
      // TODO: RE - we should check the correct API URL was called with the correct body and headers etc
      expect(levels).to.be.ok; 
    });

    it('Should get institutions', async () => {
      let institutions = await skillsService.getInstitutions();
      // TODO: RE - we should check the correct API URL was called with the correct body and headers etc
      expect(institutions).to.be.ok; 
    });

    it('Should add new institution', async () => {
      let newInstitution = await skillsService.addNewInstitution('test');
      // TODO: RE - we should check the correct API URL was called with the correct body and headers etc
      expect(newInstitution).to.be.ok; 
    });

    it('Should get attribute data', async () => {
      let attributeData = await skillsService.getAttributeData('test');
      // TODO: RE - we should check the correct API URL was called with the correct body and headers etc
      expect(attributeData).to.be.ok; 
    });

    it('Should return error message when adding user skill fails', async () => {
      let newSkill = await skillsService.addUserSkill('test', {});
      // TODO: RE - we should check the correct API URL was called with the correct body and headers etc
      expect(newSkill).to.deep.equal({"error": "Failed to add test to your portfolio. Please try again later."});
    });

    it('Should return success message when adding attribute succeeds', async () => {
      fetch_stub.resolves({
        ok: true, 
        json: () => Promise.resolve({}), 
      });

      const newSkill = await skillsService.addUserSkill('test', {});
      expect(newSkill).to.deep.equal({ "success": "test has been successfully added to your portfolio."});
      fetch_stub.reset()
    });

  });

});