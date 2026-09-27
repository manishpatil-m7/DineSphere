import { create } from 'zustand';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  image_url?: string;
  is_veg?: boolean;
}

interface CartStore {
  items: CartItem[];
  orderType: 'Dine-in' | 'Takeaway' | 'Delivery';
  tableNumber: number;
  address: string;
  notes: string;
  couponCode: string;
  discount: number;
  isCartOpen: boolean;
  setOrderType: (type: 'Dine-in' | 'Takeaway' | 'Delivery') => void;
  setTableNumber: (table: number) => void;
  setAddress: (addr: string) => void;
  setNotes: (notes: string) => void;
  setCoupon: (code: string, discount: number) => void;
  setIsCartOpen: (open: boolean) => void;
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  orderType: 'Dine-in',
  tableNumber: 1,
  address: '',
  notes: '',
  couponCode: '',
  discount: 0,
  isCartOpen: false,

  setOrderType: (orderType) => set({ orderType }),
  setTableNumber: (tableNumber) => set({ tableNumber }),
  setAddress: (address) => set({ address }),
  setNotes: (notes) => set({ notes }),
  setCoupon: (couponCode, discount) => set({ couponCode, discount }),
  setIsCartOpen: (isCartOpen) => set({ isCartOpen }),

  addItem: (newItem) => set((state) => {
    const existingIndex = state.items.findIndex(i => i.menuItemId === newItem.menuItemId);
    if (existingIndex > -1) {
      const updated = [...state.items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + newItem.quantity
      };
      return { items: updated };
    }
    return { items: [...state.items, newItem] };
  }),

  removeItem: (menuItemId) => set((state) => ({
    items: state.items.filter(i => i.menuItemId !== menuItemId)
  })),

  updateQuantity: (menuItemId, quantity) => set((state) => {
    if (quantity <= 0) {
      return { items: state.items.filter(i => i.menuItemId !== menuItemId) };
    }
    return {
      items: state.items.map(i => 
        i.menuItemId === menuItemId ? { ...i, quantity } : i
      )
    };
  }),

  clearCart: () => set({ items: [], couponCode: '', discount: 0, notes: '' }),

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().discount;
    return Math.max(0, subtotal - discount);
  }
}));
