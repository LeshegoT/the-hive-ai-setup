const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');
const sql = require('mssql');

const get_spend_balance = async (upn) => {
  const query = `
    SELECT a.TotalAwarded,s.TotalSpend, t.TotalTransferred, r.TotalEntries, (a.TotalAwarded - s.TotalSpend - t.TotalTransferred - r.TotalEntries) AS Balance FROM (
      SELECT
        ISNULL( SUM (Price * ItemQuantity), 0) as TotalSpend
      FROM Orders o
      INNER JOIN OrderItems i on o.OrderId = i.OrderId
      INNER JOIN StockItems s on i.ItemId = s.ItemId
      WHERE UserPrincipleName = @UPN AND o.StatusId <> 5
    ) AS s, (
      SELECT ISNULL( SUM(Amount), 0) AS TotalAwarded FROM SpendAwarded
      WHERE AwardedTo = @UPN
    ) AS a, (
      SELECT ISNULL( SUM(Amount), 0) AS TotalTransferred FROM BucksTransfers t
      INNER JOIN SpendAwarded sa on sa.AwardId = t.SpendAwardId
      WHERE UPN = @UPN
    ) as t, (
      SELECT ISNULL(SUM(BucksSpent),0) AS TotalEntries FROM RaffleParticipants
      WHERE Participant = @UPN
    ) as r
  `;

  const connection = await db();
  const results = await connection
    .input('UPN', upn)
    .timed_query(query, 'get_spend_balance');

  return fixCase(results.recordset)[0];
};
const get_stock = async () => {
  const query = `
    SELECT ItemId, ItemName, ItemDescription, Thumbnail, Price, QuantityAvailable FROM StockItems
    WHERE QuantityAvailable > 0 OR QuantityAvailable IS NULL
  `;

  const connection = await db();
  const results = await connection.timed_query(query, 'get_stock');

  return fixCase(results.recordset);
};

const get_pickup_locations = async () => {
  const query = `
    SELECT LocationId, LocationName,  LocationAddress, LocationCity, LocationCountry, LocationRegion FROM PickupLocations
  `;

  const connection = await db();
  const results = await connection.timed_query(query, 'get_pickup_locations');

  return fixCase(results.recordset);
};

const place_order = async (upn, locationId, orderItems, tx) => {
  const orderId = await addOrderRecord(upn, locationId, tx);
  const itemsOrdered = await addOderItems(orderId, orderItems, tx);
  return itemsOrdered;
};

const cancel_order = async (tx, orderId) => {
  const q = `
    UPDATE Orders SET StatusId = 5
    WHERE OrderId = @OrderId
  `;

  const connection = await db();
  const result = await connection
    .input('OrderId', orderId)
    .timed_query(q, 'cancel_order');
  return result.rowsAffected[0];
};

const addOderItems = async (orderId, orderItems, tx) => {
  const table = new sql.Table('OrderItems');
  table.create = false;
  table.columns.add('OrderId', sql.Int, { nullable: false });
  table.columns.add('ItemId', sql.Int, { nullable: false });
  table.columns.add('ItemQuantity', sql.Int, { nullable: false });
  table.columns.add('StockItemVariantId', sql.Int, { nullable: true });

  orderItems.forEach((item) => {
    table.rows.add(
      orderId,
      item.itemId,
      item.quantity,
      item.variant ? item.variant.stockItemVariantId : null
    );
  });

  const connection = tx ? await tx.timed_request() : await db();
  const response = await connection.bulk(table);
  return response.rowsAffected;
};

const get_order_total = async (orderItems) => {
  const query = `
    SELECT
      SUM (Price * quantity) AS OrderCost,
      SUM (quantity ) AS ItemsOrdered
    FROM #tempItems i
    INNER JOIN StockItems s on i.id = s.ItemId
  `;

  const table = new sql.Table('#tempItems');
  table.create = true;
  table.columns.add('id', sql.Int, { nullable: false });
  table.columns.add('quantity', sql.Int, { nullable: false });
  orderItems.forEach((item) => {
    table.rows.add(item.itemId, item.quantity);
  });
  const request = await db();
  await request.bulk(table);
  const results = await request.query(query, 'get_order_total');

  return fixCase(results.recordset)[0];
};
const addOrderRecord = async (upn, locationId, tx) => {
  const q = `
    INSERT INTO Orders (UserPrincipleName, PickupLocationId)
    VALUES (LOWER(@UPN), @LOCATION );

    SELECT @@IDENTITY AS OrderId
  `;

  const connection = tx ? await tx.timed_request() : await db();
  const results = await connection
    .input('UPN', upn)
    .input('LOCATION', locationId)
    .query(q, 'addOrderRecord');
  return results.recordset[0].OrderId;
};

const validateOrderPossibility = async (upn, orderItems) => {
  const userBalance = await get_spend_balance(upn);
  const orderDetails = await get_order_total(orderItems);

  return (orderPossibility = {
    canPlaceOrder: orderDetails.orderCost <= userBalance.balance,
    ...userBalance,
    ...orderDetails,
  });
};

const get_order_details = async (orderId) => {
  const query = `
    SELECT
        o.OrderId
        OrderItemId,
        ItemQuantity,
        ItemName,
        Thumbnail,
        Price
    FROM Orders o
    INNER JOIN OrderItems i ON i.OrderId = o.OrderId
    INNER JOIN StockItems si ON si.ItemId = i.ItemId
    WHERE o.OrderId = @ORDERID
  `;

  const request = await db();
  const results = await request
    .input('ORDERID', orderId)
    .timed_query(query, 'get_order_details');

  return fixCase(results.recordset);
};

const get_user_orders = async (upn) => {
  const query = `
    SELECT
        UserPrincipleName,
        OrderId,
        os.Code as StatusCode,
        os.[Description] as StatusDescription,
        o.StatusId,
        Placed as PlacedOn,
        FulfilledBy,
        FulfilledOn
    FROM Orders o
    INNER JOIN OrderStatus os ON os.StatusId = o.StatusId
    INNER JOIN PickupLocations l ON o.PickupLocationId = l.LocationId
    WHERE UserPrincipleName = @upn
  `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .timed_query(query, 'get_user_orders');

  return fixCase(results.recordset);
};

const get_user_full_orderHistory = async (upn) => {
  const query = `
    SELECT
        UserPrincipleName,
        o.OrderId,
        os.Code as StatusCode,
        os.[Description] as StatusDescription,
        os.ShortDescription as StatusShortDescription,
        Placed AS TransactionDate,
        FulfilledBy,
        FulfilledOn,
        OrderItemId,
        ItemQuantity,
        ItemName,
        Thumbnail,
        Price
    FROM Orders o
    INNER JOIN OrderItems i ON i.OrderId = o.OrderId
    INNER JOIN StockItems si ON si.ItemId = i.ItemId
    INNER JOIN OrderStatus os ON os.StatusId = o.StatusId
    WHERE UserPrincipleName = @UPN
    ORDER BY Placed DESC
  `;

  const request = await db();
  const results = await request
    .input('UPN', upn)
    .timed_query(query, 'get_user_full_orderHistory');

  const fullHistory = fixCase(results.recordset);
  const structuredHistory = fullHistory.reduce((acc, curr) => {
    if (!acc.find((i) => i.orderId === curr.orderId))
      acc.push({
        type: 'order',
        orderId: curr.orderId,
        statusCode: curr.statusCode,
        statusDescription: curr.statusDescription,
        statusShortDescription: curr.statusShortDescription,
        transactionDate: curr.transactionDate,
        fulfilledBy: curr.fulfilledBy,
        fulfilledOn: curr.fulfilledOn,
        orderTotal: 0,
        orderItems: [],
      });

    const order = acc.find((i) => i.orderId === curr.orderId);
    order.orderTotal += curr.price * curr.itemQuantity;
    order.orderItems.push({
      itemName: curr.itemName,
      itemId: curr.orderItemId,
      thumbnail: curr.thumbnail,
      price: curr.price,
      quantity: curr.itemQuantity,
    });

    return acc;
  }, []);

  return fixCase(structuredHistory);
};

const get_bucks_transfer_history = async (upn) => {
  const q = `
    SELECT AwardedTo, Amount, AwardedOn AS TransactionDate, s.* FROM BucksTransfers t
    INNER JOIN SpendAwarded a on a.AwardId = t.SpendAwardId
    INNER JOIN OrderStatus s on s.StatusId = 4
    WHERE UserPrincipleName = @UPN
  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'get_bucks_transfer_history');
  return fixCase(result.recordset);
};

const get_stock_for_item = async (tx, stockId) => {
  const q = `
    SELECT ItemId, ItemName, ItemDescription, Thumbnail, Price, QuantityAvailable FROM StockItems
    WHERE ItemId = @StockId
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('StockId', stockId)
    .timed_query(q, 'get_stock_for_item');
  return fixCase(result.recordset)[0];
};

const get_stock_variants = async () => {
  const q = `
    SELECT StockItemVariantId, StockItemId, VariantName, VariantDescription, VariantQuantityAvailable
    FROM StockItemVariants
    WHERE VariantQuantityAvailable > 0 OR VariantQuantityAvailable IS NULL
  `;

  const connection = await db();
  const result = await connection.timed_query(q, 'get_stock_variants');
  return fixCase(result.recordset);
};

const get_stock_for_item_variant = async (tx, stockId, variantId) => {
  const q = `
    SELECT VariantQuantityAvailable, VariantName,
      (
        SELECT ItemName
        FROM StockItems
        WHERE ItemId = @StockId
      ) AS ItemName
    FROM StockItemVariants
    WHERE StockItemId = @StockId
    AND StockItemVariantId = @VariantId
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('StockId', stockId)
    .input('VariantId', variantId)
    .timed_query(q, 'get_stock_for_item');
  return fixCase(result.recordset)[0];
};

const award_spend = async (tx, upn, recipientUPN, amount, reasonId) => {
  const q = `
    INSERT INTO SpendAwarded(AwardedTo, Amount, AwardedOn, AwardedBy, RewardReasonId)
    VALUES( LOWER(@RECIPIENT), @AMOUNT, GETDATE(), LOWER(@UPN), @REASON)
    Select @@IDENTITY as spendAwardId
  `;

  const connection = await tx.timed_request();
  const result = await connection
    .input('RECIPIENT', recipientUPN)
    .input('AMOUNT', amount)
    .input('UPN', upn)
    .input('REASON', reasonId)
    .timed_query(q, 'award_spend');
  return fixCase(result.recordset)[0].spendAwardId;
};

const transferBucks = async (tx, upn, recipientUPN, amount) => {
  const reasonId = 9; // from table: rewardReasons
  const spendAwardId = await award_spend(tx, upn, recipientUPN, amount, reasonId);

  const q = `
    INSERT INTO BucksTransfers (UserPrincipleName, SpendAwardId)
    VALUES (LOWER(@UPN), @SID)
  `;

  const connection = await tx.timed_request();
  await connection
    .input('UPN', upn)
    .input('SID', spendAwardId)
    .timed_query(q, 'transferBucks');
};

const get_raffle_entries_history = async (upn) => {
  const q = `
    SELECT r.RaffleId, r.Description, r.CreatedBy, r.SpinDate AS TransactionDate, rp.Entries, rp.BucksSpent AS Amount, rs.Status, rs.Description AS StatusDescription
    FROM Raffles r
      INNER JOIN RaffleParticipants rp ON rp.RaffleId = r.RaffleId AND rp.Participant = @UPN AND rp.Entries > 0
      INNER JOIN RaffleStatus rs ON rs.RaffleStatusId = r.RaffleStatusId

  `;

  const connection = await db();
  const result = await connection
    .input('UPN', upn)
    .timed_query(q, 'get_raffle_entries_history');
  return fixCase(result.recordset);
};

const update_stock_availability = async (tx, quantity, itemId) => {
  const q = `
    update StockItems
    set QuantityAvailable =
      (
        select QuantityAvailable - @QUANTITY
        from StockItems
        where ItemId = @ITEMID
      )
    where ItemId = @ITEMID
  `;

  const connection = await tx.timed_request();
  await connection
    .input('QUANTITY', quantity)
    .input('ITEMID', itemId)
    .timed_query(q, 'update_stock_availability');
};

const update_stock_variant_availability = async (
  tx,
  quantity,
  itemVariantId
) => {
  const q = `
    update StockItemVariants
    set VariantQuantityAvailable =
    (
        (
            select  VariantQuantityAvailable
                from StockItemVariants
                where StockItemVariantId = @ITEMID
        )
        - @QUANTITY
    )
    where StockItemVariantId = @ITEMID
  `;

  const connection = await tx.timed_request();
  await connection
    .input('QUANTITY', quantity)
    .input('ITEMID', itemVariantId)
    .timed_query(q, 'update_stock_variant_availability');
};

module.exports = {
  get_stock,
  get_pickup_locations,
  place_order,
  cancel_order,
  get_spend_balance,
  get_order_total,
  validateOrderPossibility,
  get_order_details,
  get_user_orders,
  get_user_full_orderHistory,
  get_stock_for_item,
  get_stock_variants,
  get_stock_for_item_variant,
  transferBucks,
  get_bucks_transfer_history,
  get_raffle_entries_history,
  update_stock_availability,
  update_stock_variant_availability,
};
