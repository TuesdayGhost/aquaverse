import { useState, useEffect, useCallback } from "react";
import { loadItems, saveItems } from "./storage.js";

export function useItems() {
  const [items, setItems] = useState(() => loadItems());

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const addItem = useCallback((name, startDate) => {
    const item = {
      id: crypto.randomUUID(),
      name: name.trim(),
      startDate,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  return { items, addItem, removeItem };
}
