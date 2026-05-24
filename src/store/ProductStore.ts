import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  image: string;
  desc: string;
};

type ProductStore = {
  products: Product[];
  addProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
};

export const useProductStore = create<ProductStore>()(
  persist(
    (set) => ({
      products: [
        {
          id: "iphone-15-pro",
          name: "iPhone 15 Pro",
          category: "iPhone",
          price: "Rp 18.999.000",
          image:
            "https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-bluetitanium?wid=512&hei=512&fmt=png-alpha&.v=1692845699311",
          desc: "Titanium. So strong. So Pro.",
        },
        {
          id: "iphone-15",
          name: "iPhone 15",
          category: "iPhone",
          price: "Rp 14.999.000",
          image:
            "https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-pink?wid=512&hei=512&fmt=png-alpha&.v=1692923777972",
          desc: "New camera. New design. Newphoria.",
        },
        {
          id: "macbook-air-m3",
          name: "MacBook Air M3",
          category: "Mac",
          price: "Rp 17.999.000",
          image:
            "https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/macbook-air-13-m3-midnight-select-202402?wid=512&hei=512&fmt=png-alpha&.v=1708367688034",
          desc: "Supercharged by M3.",
        },
        {
          id: "ipad-air",
          name: "iPad Air",
          category: "iPad",
          price: "Rp 10.999.000",
          image:
            "https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/ipad-air-13-select-wifi-blue-202405?wid=512&hei=512&fmt=png-alpha&.v=1713308272877",
          desc: "Powerful. Colorful. Wonderful.",
        },
      ],

      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, product],
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((item) => item.id !== id),
        })),
    }),
    {
      name: "markas-iphone-products",
    }
  )
);