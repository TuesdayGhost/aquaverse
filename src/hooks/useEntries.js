import { useState, useEffect, useCallback } from "react";
import { loadEntries, saveEntries as persistEntries, clearEntries } from "../storage.js";

export function useEntries() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const save = useCallback((updated) => {
    setEntries(updated);
    persistEntries(updated);
  }, []);

  const addEntry = useCallback((entry) => {
    const updated = [...loadEntries(), { ...entry, timestamp: new Date().toISOString() }];
    save(updated);
  }, [save]);

  const updateEntry = useCallback((index, entry) => {
    const current = loadEntries();
    current[index] = { ...entry, timestamp: new Date().toISOString() };
    save(current);
  }, [save]);

  const deleteEntry = useCallback((index) => {
    const current = loadEntries();
    save(current.filter((_, i) => i !== index));
  }, [save]);

  const clearAll = useCallback(() => {
    setEntries([]);
    clearEntries();
  }, []);

  const replaceAll = useCallback((newEntries) => {
    save(newEntries);
  }, [save]);

  const mergeEntries = useCallback((incoming) => {
    const current = loadEntries();
    const existingIds = new Set(current.map((e) => e.id));
    const toAdd = incoming.filter((e) => !existingIds.has(e.id));
    save([...current, ...toAdd]);
    return toAdd.length;
  }, [save]);

  return { entries, addEntry, updateEntry, deleteEntry, clearAll, replaceAll, mergeEntries };
}
