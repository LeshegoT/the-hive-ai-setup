import { BaseService } from './base.service.js';
import { del, get, patch, post, postFileUpload } from './shared.js';
import { includeInObjectWhenSet } from '@the-hive/lib-shared';
export class SkillsService extends BaseService {
  constructor() {
    super();
  }

  async getAttributeSearchResults(searchText) {
    searchText = encodeURIComponent(searchText)
    const response = await get(this.buildApiUrl(`/skills?searchText=${searchText}`));
    return await response.json();
  }

  async getExperienceLevelsAndDescriptions() {
    const response = await get(this.buildApiUrl(`experience-levels-and-descriptions`));
    return await response.json();
  }

  async getInstitutionsThatOfferAttribute(attribute) {
    attribute = encodeURIComponent(attribute)
    const response = await get(this.buildApiUrl(`institutions?excludeOffers=true&offers=${attribute}`));
    return await response.json();
  }

  async getInstitutionsSearchResults(searchText, attributeOffered) {
    const queryParameters = new URLSearchParams({
      ...(includeInObjectWhenSet('searchText', searchText)),
      ...(includeInObjectWhenSet('offers', attributeOffered)),
      excludeOffers: true
    });
  
    const url = this.buildApiUrl(`institutions?${queryParameters.toString()}`);
    const response = await get(url);
    return await response.json();
  }

  async addNewInstitution(institutionCanonicalName, attributeCanonicalNameGuid, attributeStandardizedName, attributeCanonicalName){
    const response = await post(this.buildApiUrl('institutions'), {
      canonicalName: institutionCanonicalName,
      attributesOffered: [
        {
          canonicalNameGuid: attributeCanonicalNameGuid,
          standardizedName: attributeStandardizedName,
          canonicalName: attributeCanonicalName
        }
      ]
    });
    return await response.json()
  }

  async getAttributeData(standardizedName) {
    standardizedName = encodeURIComponent(standardizedName)
    const response = await get(this.buildApiUrl(`skills/attribute/${standardizedName}`));
    return await response.json();
  }

  async getSearchExceptions() {
    const response = await get(this.buildApiUrl(`/search-exceptions`));
    return await response.json();
  }

  async getTopLevelTagData(topLevelTag) {
    topLevelTag = encodeURIComponent(topLevelTag);
    const response = await get(this.buildApiUrl(`fields/${topLevelTag}`));
    return await response.json();
  }

  async getTopLevelTags() {
    const response = await get(this.buildApiUrl(`top-level-tags`));
    return await response.json();
  }

  mapStandardizedNameToCanonicalName = (standardizedName) => get(this.buildApiUrl(`skills/canonical-names/${standardizedName}`)).then((response) => response.json());

  mapStaffIdToDisplayName = (staffId) => get(this.buildApiUrl(`staff/${staffId}/displayName`))
    .then((response) => response.json())
    .catch((message) => { return { message }; })

  async getUserAttributes() {
    const response = await get(this.buildApiUrl(`/portfolio`));
    return await response.json();
  }

  async getSkillsRestrictedWords() {
    const response = await get(this.buildApiUrl(`/skills-restricted-words`));
    return await response.json();
  }

  async addUserSkill(attribute, fields) {
    const body = {
      attribute,
      fieldValues : fields
    }
    try {
      const response = await post(this.buildApiUrl(`/portfolio`), body);
      if (!response.ok) {
        const error = await response.json();
        return { error: error.message || `Failed to add ${attribute.canonicalName} to your portfolio. Please try again later.` };
      } else {
        return { success: `${attribute.canonicalName} has been successfully added to your portfolio.`};
      }
    } catch (error) {
      return { error: error.message };
    }
  }

     async addNewAttribute (canonicalName, attributeType,requiredFields) {
    try {
      const response = await post(this.buildApiUrl(`/skills`), {canonicalName,attributeType,requiredFields})
      if (!response.ok) {
        const error = await response.json();
        return { message : error.message  };
      } else {
        return response.json()
      }
    } catch (error) {
      return { message: error.message };
    }
  }

  async deleteAttribute(attribute, edgeId) {
    try {
      const response = await del(this.buildApiUrl(`/portfolio/${edgeId}`));
      if (!response.ok) {
        const error = await response.json();
        return { error: error.message || `Failed to delete ${attribute.canonicalName}. Please try again later` };
      } else {
        return { success:`${attribute.canonicalName} has been removed from your portfolio.`};
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async uploadUserFile(file) {
    const res = await postFileUpload(this.buildApiUrl('/skills-uploads'), file);
    return await res.json();
  }

  async updateUserAttribute(userAttribute, editedFieldValues){
    const body = {
      ...userAttribute,
      fieldValues: editedFieldValues
    };
    const response = await patch(this.buildApiUrl(`/portfolio/${userAttribute.guid}`), body);
    if (!response.ok) {
      const error = await response.json();
      return { error: error.message || `Failed to update ${userAttribute.attribute.canonicalName}. Please try again later` };
    } else {
      return { success:`${userAttribute.attribute.canonicalName} has been updated in your portfolio.`};
    }
  }

  async getInstitutionsByAttributeType(attributeType) {
    const response = await get(this.buildApiUrl(`institutions/old?attributeType=${attributeType}`));
    return await response.json();
  }

  async getAttachment (path) {
    const response = await get(this.buildApiUrl(`attachment/${path}`))
    return await response.blob()
  }
}

export default new SkillsService();
