"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  Cart,
  CartItem,
  CartContacto,
  CartInstalacion,
  CartUnidadVehiculo,
  CartFactura,
  CartPago,
  CartStep,
} from "@/types/cart";
import { CotizacionResultado } from "@/lib/pricing";

interface CartContextType {
  cart: Cart | null;
  items: CartItem[];
  calculo?: CotizacionResultado;
  currentStep: CartStep;
  isSaving: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, cantidad: number) => Promise<void>;
  clearCart: () => void;
  updateContacto: (contacto: Partial<CartContacto>, saveImmediately?: boolean) => void;
  updateInstalacion: (instalacion: Partial<CartInstalacion>, saveImmediately?: boolean) => void;
  updateUnidades: (unidades: CartUnidadVehiculo[], saveImmediately?: boolean) => void;
  updateUnidadSingle: (unidad: CartUnidadVehiculo, saveImmediately?: boolean) => void;
  updateFactura: (factura: Partial<CartFactura>, saveImmediately?: boolean) => void;
  updatePago: (pago: Partial<CartPago>, saveImmediately?: boolean) => void;
  goToStep: (step: CartStep) => Promise<void>;
  saveCurrentState: (overrides?: Partial<Cart>) => Promise<Cart | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "cosotec_cart_id";

function generateClientCartId(): string {
  return "crt_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const isSavingRef = useRef(false);

  // Inicialización o recuperación de carrito persistido
  useEffect(() => {
    let cartId = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!cartId) {
      cartId = generateClientCartId();
      localStorage.setItem(LOCAL_STORAGE_KEY, cartId);
    }

    const fetchCart = async () => {
      try {
        const res = await fetch(`/api/cart/${cartId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.cart) {
            setCart(json.cart);
            return;
          }
        }
      } catch (e) {
        console.warn("No se pudo cargar el carrito previo:", e);
      }

      // Si no existe en backend aún, inicializar objeto local
      setCart({
        id: cartId,
        pasoActual: 1,
        estado: "activo",
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    };

    fetchCart();
  }, []);

  // Función núcleo de guardado a Firestore vía /api/cart/save
  const persistToServer = useCallback(async (cartToSave: Cart): Promise<Cart | null> => {
    try {
      isSavingRef.current = true;
      setSaveStatus("saving");

      const res = await fetch("/api/cart/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartToSave),
      });

      if (!res.ok) {
        throw new Error("Error en servidor al guardar carrito");
      }

      const json = await res.json();
      if (json.cart) {
        setCart(json.cart);
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        return json.cart;
      }
      return null;
    } catch (err) {
      console.error("[CartProvider] Error guardando carrito:", err);
      setSaveStatus("error");
      return null;
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  const saveCurrentState = useCallback(async (overrides?: Partial<Cart>): Promise<Cart | null> => {
    if (!cart) return null;
    const target: Cart = {
      ...cart,
      ...overrides,
      updatedAt: new Date().toISOString(),
    };
    return await persistToServer(target);
  }, [cart, persistToServer]);

  // Modificadores de items
  const addItem = useCallback(async (item: CartItem) => {
    if (!cart) return;
    const existingIndex = cart.items.findIndex((i) => i.id === item.id);
    let updatedItems = [...cart.items];

    if (existingIndex >= 0) {
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        cantidad: updatedItems[existingIndex].cantidad + item.cantidad,
      };
    } else {
      updatedItems.push(item);
    }

    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    setCart(updatedCart);
    await persistToServer(updatedCart);
  }, [cart, persistToServer]);

  const removeItem = useCallback(async (id: string) => {
    if (!cart) return;
    const updatedItems = cart.items.filter((i) => i.id !== id);
    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    setCart(updatedCart);
    await persistToServer(updatedCart);
  }, [cart, persistToServer]);

  const updateQuantity = useCallback(async (id: string, cantidad: number) => {
    if (!cart) return;
    if (cantidad <= 0) {
      await removeItem(id);
      return;
    }
    const updatedItems = cart.items.map((i) =>
      i.id === id ? { ...i, cantidad } : i
    );
    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    setCart(updatedCart);
    await persistToServer(updatedCart);
  }, [cart, persistToServer, removeItem]);

  const clearCart = useCallback(() => {
    const newId = generateClientCartId();
    localStorage.setItem(LOCAL_STORAGE_KEY, newId);
    const freshCart: Cart = {
      id: newId,
      pasoActual: 1,
      estado: "activo",
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCart(freshCart);
    persistToServer(freshCart);
  }, [persistToServer]);

  // Actualizaciones de campos con guardado opcional inmediato (usado en onBlur)
  const updateContacto = useCallback((contacto: Partial<CartContacto>, saveImmediately = false) => {
    setCart((prev) => {
      if (!prev) return prev;
      const updated: Cart = {
        ...prev,
        contacto: { ...prev.contacto, ...contacto } as CartContacto,
      };
      if (saveImmediately) {
        persistToServer(updated);
      }
      return updated;
    });
  }, [persistToServer]);

  const updateInstalacion = useCallback((instalacion: Partial<CartInstalacion>, saveImmediately = false) => {
    setCart((prev) => {
      if (!prev) return prev;
      const updated: Cart = {
        ...prev,
        instalacion: { ...prev.instalacion, ...instalacion } as CartInstalacion,
      };
      if (saveImmediately) {
        persistToServer(updated);
      }
      return updated;
    });
  }, [persistToServer]);

  const updateUnidades = useCallback((unidades: CartUnidadVehiculo[], saveImmediately = false) => {
    setCart((prev) => {
      if (!prev) return prev;
      const updated: Cart = {
        ...prev,
        unidades,
      };
      if (saveImmediately) {
        persistToServer(updated);
      }
      return updated;
    });
  }, [persistToServer]);

  const updateUnidadSingle = useCallback((unidad: CartUnidadVehiculo, saveImmediately = false) => {
    setCart((prev) => {
      if (!prev) return prev;
      const list = prev.unidades ? [...prev.unidades] : [];
      const idx = list.findIndex((u) => u.id === unidad.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...unidad };
      } else {
        list.push(unidad);
      }
      const updated: Cart = {
        ...prev,
        unidades: list,
      };
      if (saveImmediately) {
        persistToServer(updated);
      }
      return updated;
    });
  }, [persistToServer]);

  const updateFactura = useCallback((factura: Partial<CartFactura>, saveImmediately = false) => {
    setCart((prev) => {
      if (!prev) return prev;
      const updated: Cart = {
        ...prev,
        factura: { ...prev.factura, ...factura } as CartFactura,
      };
      if (saveImmediately) {
        persistToServer(updated);
      }
      return updated;
    });
  }, [persistToServer]);

  const updatePago = useCallback((pago: Partial<CartPago>, saveImmediately = false) => {
    setCart((prev) => {
      if (!prev) return prev;
      const updated: Cart = {
        ...prev,
        pago: { ...prev.pago, ...pago } as CartPago,
      };
      if (saveImmediately) {
        persistToServer(updated);
      }
      return updated;
    });
  }, [persistToServer]);

  const goToStep = useCallback(async (step: CartStep) => {
    if (!cart) return;
    const updated: Cart = {
      ...cart,
      pasoActual: step,
      updatedAt: new Date().toISOString(),
    };
    setCart(updated);
    await persistToServer(updated);
  }, [cart, persistToServer]);

  return (
    <CartContext.Provider
      value={{
        cart,
        items: cart?.items || [],
        calculo: cart?.calculo,
        currentStep: cart?.pasoActual || 1,
        isSaving: isSavingRef.current,
        saveStatus,
        lastSavedAt,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        updateContacto,
        updateInstalacion,
        updateUnidades,
        updateUnidadSingle,
        updateFactura,
        updatePago,
        goToStep,
        saveCurrentState,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe ser utilizado dentro de un CartProvider");
  }
  return ctx;
}

