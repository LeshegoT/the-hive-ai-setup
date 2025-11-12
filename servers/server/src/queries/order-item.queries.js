const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');

const updateOrderItem = async (orderItemId, orderItemStatusId) => {
  const query = `
  UPDATE OrderItems 
  SET 
  OrderItemStatusId = @orderItemStatusId
  WHERE OrderItemId = @orderItemId;
  `;
  const connection = await db();
  const result = await connection
    .input('orderItemId', orderItemId)
    .input('orderItemStatusId', orderItemStatusId)
    .timed_query(query, 'updateOrderItem');
  return result.recordset;
};

const retrieveFilteredOrderItems = async (
  page,
  size,
  status,
  userPrincipleName
) => {
  const q = `
WITH OrderItemsDetail AS (SELECT oi.OrderItemId
                               , oi.ItemQuantity
                               , oi.OrderItemStatusId
                               , o.UserPrincipleName
                               , s.DisplayName
                               , si.ItemName
                               , siv.VariantName
                               , o.OrderId
                               , o.Placed AS OrderDate
                               , p.LocationCity AS City
                          FROM OrderItems oi
                                   INNER JOIN Orders o ON o.OrderId = oi.OrderId
                                   INNER JOIN PickupLocations p ON o.PickupLocationId = p.LocationId
                                   INNER JOIN Staff s ON LOWER(s.UserPrincipleName) = LOWER(o.UserPrincipleName)
                                   INNER JOIN StockItems si ON si.ItemId = oi.ItemId       
                                   LEFT JOIN StockItemVariants siv ON siv.StockItemVariantId = oi.StockItemVariantId
                                   INNER JOIN OrderStatus os ON o.StatusId = os.StatusId)  
SELECT overallCount = COUNT(*) OVER()
     , oc.OrderItemId
     , oc.ItemQuantity
     , oc.OrderItemStatusId
     , oc.UserPrincipleName
     , oc.DisplayName
     , oc.ItemName
     , oc.VariantName
     , oc.OrderId
     , oc.OrderDate
     , oc.City
FROM OrderItemsDetail oc
WHERE (oc.UserPrincipleName = @userPrincipleName or @userPrincipleName is null)
ORDER BY oc.OrderId
OFFSET (((CAST(@page AS INT)) - 1) * (CAST(@size AS INT))) ROWS FETCH NEXT (CAST(@size AS INT)) ROWS ONLY
  `;
  const connection = await db();
  const result = await connection
    .input('page', page)
    .input('size', size)
    .input('status', status)
    .input('userPrincipleName', userPrincipleName)
    .timed_query(q, 'retrieveFilteredOrderItems');
  return fixCase(result.recordset);
};

const retrieveOrderItemStatuses = async () => {
  const q = `
SELECT OrderItemStatusId
       , Code
       , Description
       , ShortDescription
FROM OrderItemStatus
  `;
  const connection = await db();
  const result = await connection.timed_query(q, 'retrieveOrderItemStatuses');
  return fixCase(result.recordset);
};
module.exports = {
  updateOrderItem,
  retrieveFilteredOrderItems,
  retrieveOrderItemStatuses,
};
