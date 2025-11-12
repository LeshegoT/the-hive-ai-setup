const router = require('express').Router();
const { handle_errors, logger } = require('@the-hive/lib-core');
const { withTransaction } = require('../shared/db');

const {
  get_stock,
  get_pickup_locations,
  place_order,
  cancel_order,
  get_spend_balance,
  validateOrderPossibility,
  get_user_full_orderHistory,
  get_stock_for_item,
  get_stock_variants,
  get_stock_for_item_variant,
  transferBucks,
  get_bucks_transfer_history,
  get_raffle_entries_history,
  update_stock_availability,
  update_stock_variant_availability,
  get_order_details,
  get_user_orders,
} = require('../queries/store.queries');

router.get(
  '/stock',
  handle_errors(async (req, res) => {
    const stock = await get_stock();
    const variants = await get_stock_variants();
    const result = addVariantsToStock(stock, variants);
    res.json(result);
  })
);

router.get(
  '/spendBalance',
  handle_errors(async (req, res) => {
    const balance = await get_spend_balance(res.locals.upn);
    res.json(balance);
  })
);

router.get(
  '/pickupLocations',
  handle_errors(async (req, res) => {
    const locations = await get_pickup_locations();
    res.json(locations);
  })
);

router.post(
  '/placeOrder',
  handle_errors(async (req, res) => {
    const { locationId, orderItems } = req.body;
    const orderValidity = await validateOrderPossibility(
      res.locals.upn,
      orderItems
    );

    if (!orderValidity.canPlaceOrder)
      return res
        .status(401)
        .send(
          `Insufficient balance! Order total of ${orderValidity.orderCost} is higher than user balance of ${orderValidity.balance}.`
        );
    else {
      const result = await withTransaction((tx) =>
        tryPlaceOrder(tx, res.locals.upn, locationId, orderItems)
      );

      if (result === 'success') {
        return res
          .status(200)
          .json(
            `${orderValidity.itemsOrdered} item(s) worth ${orderValidity.orderCost} bucks ordered. Order details can be found in Order History`
          );
      }

      return res
        .status(404)
        .json(
          `Insufficient stock for the following items: ${getItemsInOrder(
            result
          )}. Please update your cart accordingly.`
        );
    }
  })
);

const updateStockAvailability = async (tx, orders, cancel = false) => {
  const factor = cancel ? -1 : 1;
  for (const order of orders) {
    await update_stock_availability(tx, factor * order.quantity, order.itemId);
    await update_stock_variant_availability(
      tx,
      factor * order.quantity,
      order?.variant?.stockItemVariantId
    );
  }
};

router.post(
  '/cancelOrder',
  handle_errors(async (req, res) => {
    const { orderId } = req.body;
    const order = (await get_user_orders(res.locals.upn)).find(
      (order) => order.orderId === orderId
    );

    if (!order)
      return res
        .status(404)
        .send(
          `Order was not found. Contact ATC if you believe this is an error.`
        );
    if (order.statusId === 5)
      return res.status(304).send(`Order is already cancelled. Nothing to do.`);

    const orderDetails = await get_order_details(orderId);

    await withTransaction(async (tx) => {
      await cancel_order(tx, orderId);
      const stockToIncrease = orderDetails.map((item) => {
        return {
          quantity: item.itemQuantity,
          itemId: item.orderItemId,
        };
      });
      await updateStockAvailability(tx, stockToIncrease, true);
    });

    res.status(200).json({ message: `Order has been cancelled.` });
  })
);

router.get(
  '/orderHistory',
  handle_errors(async (req, res) => {
    const history = await get_user_full_orderHistory(res.locals.upn);
    const bucksTransferHistory = await get_bucks_transfer_history(
      res.locals.upn
    );
    const raffleEntriesHistory = await get_raffle_entries_history(
      res.locals.upn
    );
    bucksTransferHistory.forEach((t) => {
      history.push({
        ...t,
        type: 'transfer',
      });
    });

    raffleEntriesHistory.forEach((r) => {
      history.push({
        ...r,
        type: 'raffle',
      });
    });

    history.sort(
      (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
    );

    const groupedByYearHistory = await structuredOrderHistory(history);
    res.status(200).json(groupedByYearHistory);
  })
);

const structuredOrderHistory = async (orderHistory) => {
  const groups = orderHistory.reduce((groups, transaction) => {
    const year = new Date(transaction.transactionDate).getFullYear();
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(transaction);
    return groups;
  }, {});

  return Object.keys(groups).map((year) => {
    return {
      year,
      transactions: groups[year],
    };
  });
};

router.post(
  '/transferBucks',
  handle_errors(async (req, res) => {
    const { amount, recipient } = req.body;
    const upn = res.locals.upn;
    const spend = await get_spend_balance(upn);

    if (!amount || amount <= 0)
      return res
        .status(400)
        .send(
          `The transfer amount provided must be a valid number greater than zero.`
        );

    if (!recipient) return res.status(400).send(`No recipient specified.`);

    if (upn === recipient)
      return res
        .status(403)
        .send(
          `You cannot transfer bucks to yourself. NB: suspicious bucks-transfer activity is noted.`
        );

    if (!spend)
      return res.status(403)
        .send(`Apologies, we could not confirm your balance at this point.
      Please try again in a few second or contact ATC via atcteam@bbd.co.za if the matter persists.`);

    if (amount > spend.balance)
      return res
        .status(401)
        .send(
          `Insufficient balance! You cannot transfer ${amount} because you only have ${spend.balance} BBD bucks.`
        );

    try {
      await withTransaction((tx) => transferBucks(tx, upn, recipient, amount));
      res
        .status(200)
        .json(`success: ${amount} bbd-bucks transferred to ${recipient}`);
    } catch (error) {
      logger.error({message:"unexpeteted error during bucks transfer",error});
      res.status(500)
        .json(
          'An error occurred during bucks transfer. Please try again in a few second or contact ATC via atcteam@bbd.co.za if the matter persists.'
        );
    }
  })
);

const checkAvailability = async (tx, orderItems) => {
  const unavailableStock = [];
  for (const item of orderItems) {
    if (item.variant) {
      const result = await get_stock_for_item_variant(
        tx,
        item.itemId,
        item.variant.stockItemVariantId
      );
      if (
        result.variantQuantityAvailable != null &&
        result.variantQuantityAvailable < item.quantity
      )
        unavailableStock.push(result);
    } else {
      const result = await get_stock_for_item(tx, item.itemId);
      if (
        result.quantityAvailable != null &&
        result.quantityAvailable < item.quantity
      )
        unavailableStock.push(result);
    }
  }

  return unavailableStock;
};

const tryPlaceOrder = async (tx, upn, locationId, orderItems) => {
  const unavailableStock = await checkAvailability(tx, orderItems);

  if (unavailableStock.length > 0) {
    return unavailableStock;
  }

  await place_order(upn, locationId, orderItems, tx);
  await updateStockAvailability(tx, orderItems);
  return 'success';
};

const getItemsInOrder = (items) => {
  let resultString = '';
  items.forEach((element, index) => {
    if (index > 0) {
      resultString += `, ${element.itemName}`;
    } else {
      resultString += `${element.itemName}`;
    }
  });

  return resultString;
};

const addVariantsToStock = (stock, variants) => {
  const result = stock.map((item) => {
    return {
      ...item,
      variants: variants.filter(
        (variant) => variant.stockItemId === item.itemId
      ),
    };
  });

  return result;
};

module.exports = router;
