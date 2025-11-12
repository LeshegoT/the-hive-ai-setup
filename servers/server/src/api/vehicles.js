const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  addUserVehicle,
  getUserVehicles,
  updateUserVehicle,
} = require('../queries/vehicles.queries');

module.exports = router.post(
  '/vehicles',
  handle_errors(async (req, res) => {
    const upn = res.locals.upn;
    const { licensePlateNumber, colour, make, model } = req.body;
    const fieldsToCheck = { licensePlateNumber, colour, make, model };

    const invalidFields = Object.keys(fieldsToCheck)
      .filter((field) => fieldsToCheck[field].trim() === '')
      .map(
        (field) =>
          `${field.charAt(0).toUpperCase() + field.slice(1)} has no value`
      );

    if (invalidFields.length > 0) {
      return res.status(400).send({ message: invalidFields.join(', ') });
    } else {
      await addUserVehicle(upn, req.body);
      return res.status(201).send();
    }
  })
);

module.exports = router.get(
  '/vehicles',
  handle_errors(async (_req, res) => {
    const upn = res.locals.upn;
    const vehicles = await getUserVehicles(upn);
    res.json(vehicles);
  })
);

module.exports = router.patch(
  '/vehicles/:id',
  handle_errors(async (req, res) => {
    const fieldsToValidate = {
      licensePlateNumber: 'License plate number is required.',
      colour: 'Colour is required.',
      make: 'Make is required.',
      model: 'Model is required.',
    };

    const validations = [];
    for (const field in fieldsToValidate) {
      if (req.body[field] !== undefined) {
        validations.push({
          value: req.body[field],
          field: field,
          errorMessage: fieldsToValidate[field],
        });
      }
    }

    const errors = validations
      .filter((item) => item.value.trim() === '')
      .map((invalid) => ({
        field: invalid.field,
        message: invalid.errorMessage,
      }));

    if (errors.length > 0) {
      res.status(400).json({
        errorMessages: errors,
      });
    } else {
      await updateUserVehicle(req.body);
      return res.status(201).json({ message: 'Vehicle updated successfully!' });
    }
  })
);
