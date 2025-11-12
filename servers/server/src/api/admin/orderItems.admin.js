const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const {
  retrieveFilteredOrderItems,
  updateOrderItem,
  retrieveOrderItemStatuses,
} = require('../../queries/order-item.queries');

router.get(
  '/orderItems/',
  handle_errors(async (req, res) => {
    let orderItems = {};
    const { page, size, status = null, userPrincipleName = null } = req.query;

    if (page && size) {
      orderItems = await retrieveFilteredOrderItems(
        page,
        size,
        status,
        userPrincipleName
      );
      const overallOrderItemsCount = orderItems[0]
        ? orderItems[0].overallCount
        : 0;
      const result = {
        pageInfo: {
          pageNumber: page,
          pageSize: size,
          resultSetSize: overallOrderItemsCount,
          totalPages: Math.ceil(overallOrderItemsCount / size),
        },
        data: orderItems,
      };

      res.json(result);
    }

    res.status(404).send();
  })
);

router.get(
  '/orderItemStatuses/',
  handle_errors(async (req, res) => {
    const orderItems = await retrieveOrderItemStatuses();
    res.json(orderItems);
  })
);

router.patch(
  '/orderItems/:id',
  handle_errors(async (req, res) => {
    try {
      const orderItemId = Number(req.params.id);
      if (
        Number.isInteger(orderItemId) &&
        orderItemId > 0 &&
        req.body.orderItemStatusId
      ) {
        await updateOrderItem(orderItemId, req.body.orderItemStatusId);
        res.status(200).send();
      } else {
        throw new Error('Review ID has to be a positive integer');
      }
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

module.exports = router;
