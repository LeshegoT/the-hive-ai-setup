import { get, post, patch } from './shared.js';
import { syndicateFormationDetailsReceived, syndicateFormationsReceived } from '../actions/syndicate.action.js';
import announcementService from './announcement.service';
import { BaseService } from './base.service.js';

export class SyndicateService extends BaseService {
  constructor() {
    super();
  }

  async submitGitLink(ideaId, gitLink) {
    let response = await patch(this.buildApiUrl(`syndicate/idea/${ideaId}/git`), gitLink);
    return response.ok
  }

  async joinSyndicate(syndicateIdeaId) {
    let response = await patch(this.buildApiUrl(`/syndicate/${syndicateIdeaId}/members/`));
    let responseDetails = await response.json();
    if (!!responseDetails && !response.ok) {
      announcementService.createAnnouncement('warning', {
        title: 'Could not join syndicate',
        body: responseDetails.message
      });
    }
  }

  async getSyndicateFormationDetails(levelUpId) {
    let response = await get(this.buildApiUrl(`syndicateDetails/${levelUpId}`));
    let formationDetails = await response.json();
    this.store.dispatch(syndicateFormationDetailsReceived(formationDetails));
  }

  async getSyndicate(levelUpId) {
    let response = await get(this.buildApiUrl(`syndicate/${levelUpId}`));
    let formations = await response.json();
    this.store.dispatch(syndicateFormationsReceived(formations));
  }

  async removeIdea(idea) {
    let request = {
      ideaId: idea.syndicateIdeaId,
      formationId: idea.syndicateFormationId,
    };

    let response = await post(this.buildApiUrl('removeIdea'), request);
    return response.ok;
  }

  async submitIdea(syndicateFormationId, ideaTitle, ideaDescription, levelUpId) {
    let request = {
      syndicateFormationId,
      ideaTitle,
      ideaDescription,
      levelUpId,
    };
    let response = await post(this.buildApiUrl('submitIdea'), request);
    if (response.ok) {
      this.getSyndicateFormationDetails(levelUpId)
    }
    return response.ok;
  }

  async updateIdea(ideaId, title, description, levelUpId) {
    let response = await patch(this.buildApiUrl(`syndicate/idea/${ideaId}/details`), {title, description});
    if (response.ok) {
      this.getSyndicateFormationDetails(levelUpId)
    }
    return response.ok;
  }

  async rankIdea(levelUpId, ideaRankChanges) {
    let request = {
      levelUpId,
      ideaRankChanges,
    };
    let response = await post(this.buildApiUrl('rankIdea'), request);
    return response.ok;
  }
}

export default new SyndicateService();
