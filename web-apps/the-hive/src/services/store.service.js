import { post } from './shared';
import { get } from './shared.js';
import { BaseService } from './base.service';
import {
  stockReceived,
  cartUpdated,
  purchaseState,
  pickupLocationsReceived,
  balanceReceived,
  orderHistoryReceived,
  stockSortUpdated
} from '../actions/store-data-received.action';
import announcementService from './announcement.service';

export class StoreService extends BaseService {
  constructor() {
    super();
  }

  async GetBalance() {
    let response = await get(this.buildApiUrl(`spendBalance`));
    let data = await response.json();
    this.store.dispatch(balanceReceived(data));
  }

  async GetStock() {
    let response = await get(this.buildApiUrl(`stock`));
    let data = await response.json();
    this.store.dispatch(stockReceived(data));
  }

  async GetPickupLocations() {
    const response = await get(this.buildApiUrl(`pickupLocations`));
    const data = await response.json();
    this.store.dispatch(pickupLocationsReceived(data));
  }

  async ConfirmAvailability() {
    let request = {
      locationId,
      orderItems,
    };

    const response = await post('itemsAvailable', request);
    const result = await response.json();
    return result;
  }

  async PlaceOrder(locationId, orderItems) {
    let request = {
      locationId,
      orderItems
    };

    let response = await post(this.buildApiUrl('placeOrder'), request);
    let placedOrder = await response.json();

    if (response.status === 200) {
      this.ClearCart();
      announcementService.createAnnouncement('store', {
        title: 'Order Placed',
        body: 'Details can be found in Transaction History',
      });

      return this.UpdatePurchaseState('history');
    }

    announcementService.createAnnouncement('store', { title: 'Order Failed', body: placedOrder });
    return this.UpdatePurchaseState('store');
  }

  async CancelOrder(orderId) {
    let request = { orderId };
    let response = await post(this.buildApiUrl('cancelOrder'), request);

    if (response.status === 200) {
      this.ClearCart();
      announcementService.createAnnouncement('store', {
        title: 'Order Canceled',
        body: 'Details can be found in Transaction History',
      });
    }
    else
      announcementService.createAnnouncement('store', { title: 'Something went wrong. Check History.', body: placedOrder });
    return this.UpdatePurchaseState('store');
  }

  async GetOrderHistory() {
    const response = await get(this.buildApiUrl(`orderHistory`));
    const data = await response.json();
    this.store.dispatch(orderHistoryReceived(data));
    this.GetBalance();
  }

  async TransferBucks(amount, recipient) {
    const response = await post(this.buildApiUrl('transferBucks'), { amount, recipient });
    const result = await response.json();

    if (response.status === 200) {
      announcementService.createAnnouncement('store', {
        title: 'BBD-Bucks Transferred',
        body: result,
      });
    }
    else
      announcementService.createAnnouncement('store', {
        title: 'BBD-Bucks Transfer FAILED',
        body: result,
      });

    return this.UpdatePurchaseState('history');
  }

  AddToCart(itemId, variant) {
    const storedCart = JSON.parse(localStorage.getItem('cart'));
    let cart = storedCart ? storedCart : [];

    let cartItem = cart.find(i => i.itemId === itemId);
    if (!!cartItem) {
      cartItem.quantity++;
      if (variant && cartItem.variant) {
        cartItem.variant = variant;
      }
    } else {
      if (variant) {
        cart.push({
          itemId,
          quantity: 1,
          variant
        });
      } else {
        cart.push({
          itemId,
          quantity: 1,
        });
      }
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    this.GetCart();
  }

  ClearCart() {
    localStorage.removeItem('cart');
    this.GetCart();
  }

  GetCart() {
    const cart = JSON.parse(localStorage.getItem('cart'));
    this.store.dispatch(cartUpdated(!!cart ? cart : []));
  }

  UpdatePurchaseState(newState) {
    window.scrollTo(0, 0);
    this.store.dispatch(purchaseState(newState));
  }

  SortStock(sortField, sortOrder) {
    this.store.dispatch(stockSortUpdated({ sortField, sortOrder }));
  }
  GetCartItemQuantity(itemId) {
    let cart = JSON.parse(localStorage.getItem('cart'));
    let item = cart.find(i => i.itemId === itemId);
    return item ? item.quantity : 0;
  }

  SubtractFromCart(itemId) {
    let cart = JSON.parse(localStorage.getItem('cart'));
    let item = cart ? cart.find(i => i.itemId === itemId) : undefined;
    if (!item) return;

    if (item.quantity > 1)
      item.quantity--;
    else
      cart = cart.filter(i => i.itemId !== itemId);

    localStorage.setItem('cart', JSON.stringify(cart));
    this.GetCart();
  }

  UpdateItemVariant(itemId, variant) {
    const storedCart = JSON.parse(localStorage.getItem('cart'));
    let cart = storedCart ? storedCart : [];

    let cartItem = cart.find((i) => i.itemId === itemId);
    cart[cart.indexOf(cartItem)].variant = variant;

    localStorage.setItem('cart', JSON.stringify(cart));
    this.GetCart();
  }

  get cart() {
    return JSON.parse(localStorage.getItem('cart'));
  }
}

export const STORE_HISTORY_STATE = 'history';
export const STORE_CHECKOUT_STATE = 'checkout';
export const STORE_SHOP_STATE = 'shop';
export const STORE_HOME_STATE = 'home';
export const STORE_RAFFLE_STATE = 'raffle';

export default new StoreService();
