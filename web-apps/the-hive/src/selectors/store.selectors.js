import { createSelector } from 'reselect';
export const selectAllStock = (state) => state.stock.all;

export const selectSpendBalance = (state) => state.balance.all ? state.balance.all.balance : 0;
export const selectCartItems = (state) => state.cart.all;
export const selectPickupLocations = (state) => state.pickupLocations.all;
export const selectPurchaseState = (state) => state.purchaseState.current;
export const selectOrderHistory = (state) => state.orderHistory.all;

export const selectStockReference = (state) => {

    if (state.stock && state.stock.all && state.cart && state.cart.all) {

        let stock = state.stock.all.map(stockItem => {
            return {
                ...stockItem,
                quantityInCart: getQuantityInCart(state.cart.all, stockItem.itemId)
            };
        });

        if (!!state.stockSortOrder) {
            const sortField = state.stockSortOrder.sortField;
            const sortOrder = state.stockSortOrder.sortOrder;
            return stock.sort((a, b) => {
                if (a[sortField] < b[sortField]) {
                    return sortOrder === 'des' ? 1 : -1;
                }
                if (a[sortField] > b[sortField]) {
                    return sortOrder === 'des' ? -1 : 1;
                }
                return 0;
            })
        }
        return stock;
    }

    return state.stock.all;
}

export const selectCart = (state) => createSelector(
    selectStockReference,
    selectCartItems,
    (stock, cartItems) => {
        if (!cartItems || !stock || !stock.length) return [];
        let cart = cartItems.map(i => {
            return {
                ...stock.find(s => s.itemId === i.itemId),
                variant: i.variant ? i.variant : null
            }
        });
        let cartTotal = getTotalCost(cart);
        let spendBalance = state.balance.all ? state.balance.all.balance : 0;
        let postOrderBalance = (spendBalance - cartTotal);

        return cart.map(cartItem => {
            return {
                ...cartItem,
                canBePurchased: ((postOrderBalance - cartItem.price) >= 0)
            }
        });

    }
)(state);

export const selectCanItemBeAdded = (state, cost) => createSelector(
    selectBalanceAfterOrder,
    (postOrderBalance) => {
        return ((postOrderBalance - cost) >= 0);
    }
)(state)

export const selectCartTotal = createSelector(
    selectCart,
    (cart) => {
        if (!cart) return undefined;
        return getTotalCost(cart);
    }
);

export const selectBalanceAfterOrder = createSelector(
    selectCartTotal,
    selectSpendBalance,
    (cartTotal, spendBalance) => {
        return (spendBalance - cartTotal);
    }
);

export const selectStock = (state) => createSelector(
    selectStockReference,
    selectBalanceAfterOrder,
    (stockReference, postOrderBalance) => {
        if (stockReference && state.cart && state.cart.all) {
            let stock = stockReference.map(stockItem => {
                return {
                    ...stockItem,
                    canBePurchased: ((postOrderBalance - stockItem.price) >= 0)
                };
            });

            return stock;
        }

        return stockReference;
    }

)(state);

const getQuantityInCart = (cartItems, itemId) => {
    if (!cartItems || !cartItems.length)
        return 0;

    let cartItem = cartItems.find(i => i.itemId === itemId);
    return !!cartItem ? cartItem.quantity : 0;
}

const getTotalCost = (cart) => {
    return cart.reduce(((accumulator, cartItem) => accumulator + (cartItem.price * cartItem.quantityInCart)), 0)
}