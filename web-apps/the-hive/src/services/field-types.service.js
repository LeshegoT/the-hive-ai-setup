import { get } from './shared.js';
import { BaseService } from './base.service.js';

export class FieldTypeService extends BaseService {
  constructor() {
    super();
		this.cache = {
      skillsFields: undefined,
      jsTypes: undefined,
      jsTypeScale: undefined
    };
  }

  async getSkillsFields() {
		if (this.cache.skillsFields) {
      return this.cache.skillsFields;
    }
    const response = await get(this.buildApiUrl(`/skills-field`));
    const data = await response.json();
		this.cache.skillsFields = data;
    return data;
  }

	async getJSTypes() {
    if (this.cache.jsTypes) {
      return this.cache.jsTypes;
    }
    const response = await get(this.buildApiUrl(`/js-type`));
    const data = await response.json();
    this.cache.jsTypes = data;
    return data;
  }

	async getJSTypeScale() {
    if (this.cache.jsTypeScale) {
      return this.cache.jsTypeScale;
    }
    const response = await get(this.buildApiUrl(`/js-type-scale`));
    const data = await response.json();
    this.cache.jsTypeScale = data;
    return data;
  }
}

export default new FieldTypeService();