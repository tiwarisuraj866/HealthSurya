"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem } from "@/lib/medicine";

const STORAGE_KEY = "healthsurya_medicine_cart";

interface CartCtx {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  updateQty: (medicineId: string, quantity: number) => void;
  removeItem: (medicineId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartCtx | undefined>(undefined);

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function MedicineCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.medicineId === item.medicineId);
      if (existing) {
        return prev.map((i) =>
          i.medicineId === item.medicineId ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const updateQty = (medicineId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.medicineId !== medicineId));
      return;
    }
    setItems((prev) => prev.map((i) => (i.medicineId === medicineId ? { ...i, quantity } : i)));
  };

  const removeItem = (medicineId: string) => {
    setItems((prev) => prev.filter((i) => i.medicineId !== medicineId));
  };

  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, count, subtotal, addItem, updateQty, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useMedicineCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useMedicineCart must be used inside MedicineCartProvider");
  return ctx;
}
