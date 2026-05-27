import { useState, useEffect, useCallback, useRef } from "react";
import {
  loadEntries,
  saveEntry,
  deleteEntryById,
  clearAllEntries,
  migrateLocalData,
} from "../storage.js";

export function useEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const entriesRef = useRef([]);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    (async () => {
      try {
        await migrateLocalData();
        const data = await loadEntries();
        setEntries(data);
      } catch (err) {
        console.error("Failed to load entries:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addEntry = useCallback(async (entry) => {
    const withTimestamp = { ...entry, timestamp: new Date().toISOString() };
    setEntries((prev) => [...prev, withTimestamp]);
    try {
      await saveEntry(withTimestamp);
    } catch (err) {
      console.error("Failed to save entry:", err);
      setEntries((prev) => prev.filter((e) => e.id !== withTimestamp.id));
    }
  }, []);

  const updateEntry = useCallback(async (index, entry) => {
    const withTimestamp = { ...entry, timestamp: new Date().toISOString() };
    setEntries((prev) => prev.map((e, i) => (i === index ? withTimestamp : e)));
    try {
      await saveEntry(withTimestamp);
    } catch (err) {
      console.error("Failed to update entry:", err);
      const data = await loadEntries();
      setEntries(data);
    }
  }, []);

  const deleteEntry = useCallback(async (index) => {
    const entry = entriesRef.current[index];
    setEntries((prev) => prev.filter((_, i) => i !== index));
    if (entry?.id) {
      try {
        await deleteEntryById(entry.id);
      } catch (err) {
        console.error("Failed to delete entry:", err);
      }
    }
  }, []);

  const clearAll = useCallback(async () => {
    setEntries([]);
    try {
      await clearAllEntries();
    } catch (err) {
      console.error("Failed to clear entries:", err);
    }
  }, []);

  const replaceAll = useCallback(async (newEntries) => {
    setEntries(newEntries);
    try {
      await clearAllEntries();
      for (const entry of newEntries) {
        await saveEntry(entry);
      }
    } catch (err) {
      console.error("Failed to replace entries:", err);
    }
  }, []);

  const mergeEntries = useCallback(async (incoming) => {
    const existingIds = new Set(entriesRef.current.map((e) => e.id));
    const toAdd = incoming.filter((e) => !existingIds.has(e.id));
    if (toAdd.length > 0) {
      setEntries((prev) => [...prev, ...toAdd]);
      try {
        for (const entry of toAdd) {
          await saveEntry(entry);
        }
      } catch (err) {
        console.error("Failed to merge entries:", err);
      }
    }
    return toAdd.length;
  }, []);

  return { entries, loading, addEntry, updateEntry, deleteEntry, clearAll, replaceAll, mergeEntries };
}
