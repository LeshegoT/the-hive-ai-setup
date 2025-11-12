const deleteUnit = async (tx, unitId) => {
  const q = `
        DELETE FROM Unit
        WHERE UnitId = @UnitId
    `;
  const connection = await tx.timed_request();
  await connection.input('UnitId', unitId).timed_query(q, 'deleteUnit');
};

module.exports = {
  deleteUnit,
};
