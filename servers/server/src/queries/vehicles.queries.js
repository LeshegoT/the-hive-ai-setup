const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const addUserVehicle = async (upn, vehicleDetails) => {
  const query = `
    INSERT INTO Vehicles (LicensePlateNumber, Colour, Make, Model, UPN)
    VALUES (@LicensePlateNumber, @Colour, @Make, @Model, @UPN) 
  `;
  const connection = await db();
  await connection
    .input('LicensePlateNumber', vehicleDetails.licensePlateNumber)
    .input('Colour', vehicleDetails.colour)
    .input('Make', vehicleDetails.make)
    .input('Model', vehicleDetails.model)
    .input('UPN', upn)
    .timed_query(query, 'addUserVehicle');
};

const getUserVehicles = async (upn) => {
  const query = `
    SELECT VehicleId, LicensePlateNumber, Colour, Make, Model, UPN
    FROM Vehicles 
    WHERE UPN = @UPN
  `;
  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .timed_query(query, 'getUserVehicles');
  return fixCase(results.recordset);
};

const updateUserVehicle = async (vehicleDetails) => {
  const query = `
  UPDATE Vehicles
  SET LicensePlateNumber = COALESCE(@LicensePlateNumber, LicensePlateNumber),
      Colour = COALESCE(@Colour, Colour),
      Make = COALESCE(@Make, Make),
      Model = COALESCE(@Model, Model)
  WHERE VehicleId = @VehicleId  
  `;
  const connection = await db();
  await connection
    .input('LicensePlateNumber', vehicleDetails.licensePlateNumber)
    .input('Colour', vehicleDetails.colour)
    .input('Make', vehicleDetails.make)
    .input('Model', vehicleDetails.model)
    .input('vehicleId', vehicleDetails.vehicleId)
    .timed_query(query, 'updateUserVehicle');
};

module.exports = {
  addUserVehicle,
  getUserVehicles,
  updateUserVehicle,
};
