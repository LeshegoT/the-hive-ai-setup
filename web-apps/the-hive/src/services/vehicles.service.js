import { post, get, patch } from './shared';
import { BaseService } from './base.service';

export class VehiclesService extends BaseService {
  constructor() {
    super();
  }

  async postUserVehicle(vehicle) {
    const response = await post(this.buildApiUrl('vehicles'), vehicle);
    if (response.ok) {
      return 'Vehicle added successfully!';
    } else {
      const responseBody = await response.json();
      return responseBody.message;
    }
  }

  async getUserVehicles() {
    const response = await get(this.buildApiUrl('vehicles'));
    const results = await response.json();
    return results;
  }

  async updateUserVehicle(vehicle){
    const response = await patch(this.buildApiUrl(`vehicles/${vehicle.vehicleId}`), vehicle);
    return response.json();
  }
}

export default new VehiclesService();
