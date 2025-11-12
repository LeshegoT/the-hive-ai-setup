import {
  STOCK_RECEIVED,
  CART_UPDATED,
  PURCHASE_STATE_UPDATED,
  PICKUP_LOCATIONS_RECEIVED,
  BALANCE_RECEIVED,
  ORDER_HISTORY_RECEIVED,
  STOCK_SORT_ORDER_UPDATED
} from '../actions/store-data-received.action';

const INITIAL_STATE = {};

export const stock = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case STOCK_RECEIVED:
      return {
        ...state,
        all: action.stock
      };

    default:
      return state;
  }
};

export const balance = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case BALANCE_RECEIVED:
      return {
        ...state,
        all: action.balance
      };

    default:
      return state;
  }
};
export const pickupLocations = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case PICKUP_LOCATIONS_RECEIVED:
      return {
        ...state,
        all: action.locations
      };

    default:
      return state;
  }
};
export const orderHistory = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ORDER_HISTORY_RECEIVED:
      return {
        ...state,
        all: action.history
      };

    default:
      return state;
  }
};

export const cart = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case CART_UPDATED:
      return {
        ...state,
        all: action.cart
      };

    default:
      return state;
  }
};

export const purchaseState = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case PURCHASE_STATE_UPDATED:
      return {
        ...state,
        current: action.state
      };

    default:
      return state;
  }
};

export const stockSortOrder = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case STOCK_SORT_ORDER_UPDATED:
      return {
        ...state,
        sortField: action.stockSort.sortField,
        sortOrder: action.stockSort.sortOrder
      };

    default:
      return state;
  }
};

