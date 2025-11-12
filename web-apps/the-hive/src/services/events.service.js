import { BaseService } from './base.service';
import { get, post, putBinary, patch } from './shared';

export class EventsService extends BaseService {
  constructor() {
    super();
  }

  async listRSVPs(eventId) {
    const response = await get(this.buildApiUrl(`/${eventId}/rsvps`, 'eventsApiUrl'));
    return response.json();
  }

  async getTemplates() {
    const response = await get(this.buildApiUrl('/templates', 'eventsApiUrl'));
    return response.json();
  }

  async createEvent(event) {
    const response = await post(this.buildApiUrl('/', 'eventsApiUrl'), event);
    return response.json();
  }

  async getEventbyId(eventId) {
    const response = await get(this.buildApiUrl(`/${eventId}`, 'eventsApiUrl'));
    return response.json();
  }

  async rsvpForEvent(eventId, accepted) {
    const request = {
      accepted,
    };

    const response = await post(this.buildApiUrl(`/${eventId}/rsvps`, 'eventsApiUrl'), request);
    return response.json();
  }

  async getRsvp(eventId) {
    const response = await get(this.buildApiUrl(`/${eventId}/rsvp/mine`, 'eventsApiUrl'));
    return response.json();
  }

  async getEventsByOrganiser() {
    const response = await get(this.buildApiUrl('/organisers/me/events', 'eventsApiUrl'));
    return response.json();
  }

  async getCategories() {
    const response = await get(this.buildApiUrl('/categories', 'eventsApiUrl'));
    return response.json();
  }

  async getEvents() {
    const response = await get(this.buildApiUrl('/', 'eventsApiUrl'));
    return response.json();
  }

  async getEventsByCategoryAndStartDate(categoryId, startDateTime) {
    let route;
    if (categoryId && startDateTime) {
      route = `/?categoryId=${categoryId}&startDateTime=${startDateTime}`;
    } else if (categoryId) {
      route = `/?categoryId=${categoryId}`;
    } else if (startDateTime) {
      route = `/?startDateTime=${startDateTime}`;
    } else {
      route = '/';
    }

    const response = await get(this.buildApiUrl(route, 'eventsApiUrl'));
    return response.json();
  }

  async getOffices() {
    const response = await get(this.buildApiUrl('/offices', 'eventsApiUrl'));
    return response.json();
  }

  async getUploadedImages() {
    const response = await get(this.buildApiUrl(`/event-images/blob-paths`, 'eventsApiUrl'));
    return response.json();
  }

  async uploadImage(blob, filename) {
    const response = await putBinary(this.buildApiUrl(`/event-images/${filename}`, 'eventsApiUrl'), blob);
    const body = await response.json()
    return {
      message: body.message ?? 'Image uploaded successfully.',
      status: response.ok
    }
  }

  async createTemplate(template) {
    const response = await post(this.buildApiUrl('/templates', 'eventsApiUrl'), template);
    return response.json();
  }

  getImageDownloadUrl(imagePath) {
    return `${this.config.storageAccountBaseUrl}/${this.config.eventImagesStorageContainer}/${imagePath}`;
  }

  async getEventOrganiser() {
    const response = await get(this.buildApiUrl('/organisers/me', 'eventsApiUrl'));
    return response.json();
  }

  async updateEvent(eventId, event) {
    const response = await patch(this.buildApiUrl(`/${eventId}`, 'eventsApiUrl'), event);
    return response.json();
  }
}

export default new EventsService();
