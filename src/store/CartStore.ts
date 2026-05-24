import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  price: string;
  image: string;
  storage: string;
  qty: number;
};

type CartStore = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, storage: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cart: [],

      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find(
            (cartItem) =>
              cartItem.id === item.id && cartItem.storage === item.storage
          );

          if (existing) {
            return {
              cart: state.cart.map((cartItem) =>
                cartItem.id === item.id && cartItem.storage === item.storage
                  ? { ...cartItem, qty: cartItem.qty + 1 }
                  : cartItem
              ),
            };
          }

          return {
            cart: [...state.cart, item],
          };
        }),

      removeFromCart: (id, storage) =>
        set((state) => ({
          cart: state.cart.filter(
            (item) => !(item.id === id && item.storage === storage)
          ),
        })),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "markas-iphone-cart",
    }
  )
);