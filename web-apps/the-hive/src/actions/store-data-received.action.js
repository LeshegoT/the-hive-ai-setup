export const STOCK_RECEIVED = 'STOCK_RECEIVED';
export const BALANCE_RECEIVED = 'BALANCE_RECEIVED';
export const PICKUP_LOCATIONS_RECEIVED = 'PICKUP_LOCATIONS_RECEIVED';
export const ORDER_HISTORY_RECEIVED = 'ORDER_HISTORY_RECEIVED';
export const CART_UPDATED = 'CART_UPDATED';
export const PURCHASE_STATE_UPDATED = 'PURCHASE_STATE_UPDATED';
export const STOCK_SORT_ORDER_UPDATED = 'STOCK_SORT_ORDER_UPDATED';

export const stockReceived = (stock) => {
    return {
        type: STOCK_RECEIVED,
        stock
    };
};

export const balanceReceived = (balance) => {
    return {
        type: BALANCE_RECEIVED,
        balance
    };
};

export const pickupLocationsReceived = (locations) => {
    return {
        type: PICKUP_LOCATIONS_RECEIVED,
        locations
    };
};

export const orderHistoryReceived = (history) => {
    return {
        type: ORDER_HISTORY_RECEIVED,
        history
    };
};

export const cartUpdated = (cart) => {
    return {
        type: CART_UPDATED,
        cart
    };
};

export const purchaseState = (state) => {
    return {
        type: PURCHASE_STATE_UPDATED,
        state
    };
};

export const stockSortUpdated = (stockSort) => {
    return {
        type: STOCK_SORT_ORDER_UPDATED,
        stockSort
    };
};
