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

export interface DeletedAction {
  id: string;
  nombre: string;
  tipo: "item" | "group";
  items: CartItem[];
  timestamp: number;
}

interface CartContextType {
  cart: Cart | null;
  items: CartItem[];
  calculo?: CotizacionResultado;
  currentStep: CartStep;
  isSaving: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
  lastDeleted: DeletedAction | null;
  isCartDrawerOpen: boolean;
  maxUnidadesPorItem: number;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addItem: (item: CartItem) => Promise<void>;
  addItems: (items: CartItem[]) => Promise<void>;
  removeItem: (id: string, grupoId?: string) => Promise<void>;
  removeGroup: (grupoId: string) => Promise<void>;
  updateQuantity: (id: string, cantidad: number, grupoId?: string) => Promise<void>;
  undoDelete: () => Promise<void>;
  dismissUndo: () => void;
  clearCart: () => Promise<void>;
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

function matchItem(item: CartItem, id: string, grupoId?: string): boolean {
  if (grupoId !== undefined) {
    return item.id === id && item.grupoId === grupoId;
  }
  return item.id === id && !item.grupoId;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [lastDeleted, setLastDeleted] = useState<DeletedAction | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [maxUnidadesPorItem, setMaxUnidadesPorItem] = useState<number>(50);
  const isSavingRef = useRef(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const openCartDrawer = useCallback(() => setIsCartDrawerOpen(true), []);
  const closeCartDrawer = useCallback(() => setIsCartDrawerOpen(false), []);

  const dismissUndo = useCallback(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setLastDeleted(null);
  }, []);

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
            if (json.maxUnidadesPorItem) {
              setMaxUnidadesPorItem(json.maxUnidadesPorItem);
            }
            return;
          }
        }
      } catch (e) {
        console.warn("No se pudo cargar el carrito previo:", e);
      }

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
        if (json.maxUnidadesPorItem) {
          setMaxUnidadesPorItem(json.maxUnidadesPorItem);
        }
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

  // Si proviene de cotización de vendedor (snapshot), las ediciones están bloqueadas
  const isLocked = Boolean(cart?.isQuoteSnapshot || cart?.quoteFolio);

  // Agregar un solo item
  const addItem = useCallback(async (item: CartItem) => {
    if (!cart || isLocked) return;
    const existingIndex = cart.items.findIndex((i) => matchItem(i, item.id, item.grupoId));
    let updatedItems = [...cart.items];

    if (existingIndex >= 0) {
      const nuevaCantidad = Math.min(
        maxUnidadesPorItem,
        updatedItems[existingIndex].cantidad + item.cantidad
      );
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        cantidad: nuevaCantidad,
      };
    } else {
      updatedItems.push({
        ...item,
        cantidad: Math.min(maxUnidadesPorItem, item.cantidad),
      });
    }

    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    setCart(updatedCart);
    await persistToServer(updatedCart);
  }, [cart, isLocked, maxUnidadesPorItem, persistToServer]);

  // Agregar varios items juntos (ej. nivel de solución completo)
  const addItems = useCallback(async (newItems: CartItem[]) => {
    if (!cart || isLocked || newItems.length === 0) return;
    let updatedItems = [...cart.items];

    for (const item of newItems) {
      const existingIndex = updatedItems.findIndex((i) => matchItem(i, item.id, item.grupoId));
      if (existingIndex >= 0) {
        const nuevaCantidad = Math.min(
          maxUnidadesPorItem,
          updatedItems[existingIndex].cantidad + item.cantidad
        );
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          cantidad: nuevaCantidad,
        };
      } else {
        updatedItems.push({
          ...item,
          cantidad: Math.min(maxUnidadesPorItem, item.cantidad),
        });
      }
    }

    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    setCart(updatedCart);
    await persistToServer(updatedCart);
  }, [cart, isLocked, maxUnidadesPorItem, persistToServer]);

  // Eliminar un item individual con opción de deshacer
  const removeItem = useCallback(async (id: string, grupoId?: string) => {
    if (!cart || isLocked) return;
    const found = cart.items.find((i) => matchItem(i, id, grupoId));
    if (!found) return;

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setLastDeleted({
      id,
      nombre: found.nombre,
      tipo: "item",
      items: [found],
      timestamp: Date.now(),
    });
    undoTimerRef.current = setTimeout(() => {
      setLastDeleted(null);
    }, 6000);

    const updatedItems = cart.items.filter((i) => !matchItem(i, id, grupoId));
    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    setCart(updatedCart);
    await persistToServer(updatedCart);
  }, [cart, isLocked, persistToServer]);

  // Eliminar un grupo completo (ej. nivel de solución) con opción de deshacer
  const removeGroup = useCallback(async (grupoId: string) => {
    if (!cart || isLocked) return;
    const itemsInGroup = cart.items.filter((i) => i.grupoId === grupoId);
    if (itemsInGroup.length === 0) return;

    const groupName = itemsInGroup[0]?.grupoNombre || "Nivel de solución";

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setLastDeleted({
      id: grupoId,
      nombre: groupName,
      tipo: "group",
      items: itemsInGroup,
      timestamp: Date.now(),
    });
    undoTimerRef.current = setTimeout(() => {
      setLastDeleted(null);
    }, 6000);

    const updatedItems = cart.items.filter((i) => i.grupoId !== grupoId);
    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    setCart(updatedCart);
    await persistToServer(updatedCart);
  }, [cart, isLocked, persistToServer]);

  // Actualizar cantidad de un item. Si es <= 0, elimina el item
  const updateQuantity = useCallback(async (id: string, cantidad: number, grupoId?: string) => {
    if (!cart || isLocked) return;
    if (cantidad <= 0) {
      await removeItem(id, grupoId);
      return;
    }

    const capped = Math.min(maxUnidadesPorItem, cantidad);
    const updatedItems = cart.items.map((i) =>
      matchItem(i, id, grupoId) ? { ...i, cantidad: capped } : i
    );

    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    setCart(updatedCart);
    await persistToServer(updatedCart);
  }, [cart, isLocked, maxUnidadesPorItem, persistToServer, removeItem]);

  // Deshacer última eliminación
  const undoDelete = useCallback(async () => {
    if (!cart || !lastDeleted || isLocked) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    let updatedItems = [...cart.items];
    for (const restored of lastDeleted.items) {
      const idx = updatedItems.findIndex((i) => matchItem(i, restored.id, restored.grupoId));
      if (idx >= 0) {
        updatedItems[idx] = {
          ...updatedItems[idx],
          cantidad: updatedItems[idx].cantidad + restored.cantidad,
        };
      } else {
        updatedItems.push(restored);
      }
    }

    setLastDeleted(null);
    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    setCart(updatedCart);
    await persistToServer(updatedCart);
  }, [cart, lastDeleted, isLocked, persistToServer]);

  // Vaciar carrito con snapshot para deshacer
  const clearCart = useCallback(async () => {
    if (!cart || isLocked || cart.items.length === 0) return;

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setLastDeleted({
      id: "all",
      nombre: "Carrito vaciado",
      tipo: "group",
      items: [...cart.items],
      timestamp: Date.now(),
    });
    undoTimerRef.current = setTimeout(() => {
      setLastDeleted(null);
    }, 6000);

    const updatedCart: Cart = {
      ...cart,
      items: [],
      calculo: undefined,
      updatedAt: new Date().toISOString(),
    };
    setCart(updatedCart);
    await persistToServer(updatedCart);
  }, [cart, isLocked, persistToServer]);

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
        lastDeleted,
        isCartDrawerOpen,
        maxUnidadesPorItem,
        openCartDrawer,
        closeCartDrawer,
        addItem,
        addItems,
        removeItem,
        removeGroup,
        updateQuantity,
        undoDelete,
        dismissUndo,
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
