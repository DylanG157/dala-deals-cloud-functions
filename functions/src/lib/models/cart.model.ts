import { DalaBag } from './dalaBag.model';

export interface CartItem {
  offer: DalaBag;
  quantity: number;
}

export interface CartContextProps {
  cartItems: CartItem[];
  addToCart: (offer: DalaBag, quantity?: number) => void;
  removeFromCart: (offerId: string) => void;
  clearCart: () => void;
}
