import { useState, useEffect, useCallback, useRef } from "react";
import {
  loadEntries,
  saveEntry,
  deleteEntryById,
  clearAllEntries,
  migrateLocalData,
} from "../storage.js";

function errorMessage(prefix, err) {
  const detail = err?.message ? ` ${err.message}` : "";
  return `${prefix}${detail}`;
}

export function useEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const entriesRef = useRef([]);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        await migrateLocalData();
        const data = await loadEntries();
        setEntries(data);
      } catch (err) {
        console.error("Failed to load entries:", err);
        setError(errorMessage("Database connection failed.", err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addEntry = useCallback(async (entry) => {
    const withTimestamp = { ...entry, timestamp: new Date().toISOString() };
    setError(null);
    setEntries((prev) => [...prev, withTimestamp]);
    try {
      await saveEntry(withTimestamp);
      return withTimestamp;
    } catch (err) {
      console.error("Failed to save entry:", err);
      setEntries((prev) => prev.filter((e) => e.id !== withTimestamp.id));
      setError(errorMessage("Save failed. Your form was kept so you can retry.", err));
      throw err;
    }
  }, []);

  const updateEntry = useCallback(async (index, entry) => {
    const previous = entriesRef.current[index];
    const withTimestamp = { ...entry, timestamp: new Date().toISOString() };
    setError(null);
    setEntries((prev) => prev.map((e, i) => (i === index ? withTimestamp : e)));
    try {
      await saveEntry(withTimestamp);
      return withTimestamp;
    } catch (err) {
      console.error("Failed to update entry:", err);
      setEntries((prev) => prev.map((e, i) => (i === index ? previous : e)));
      setError(errorMessage("Update failed. Your edit form was kept so you can retry.", err));
      throw err;
    }
  }, []);

  const deleteEntry = useCallback(async (index) => {
    const entry = entriesRef.current[index];
    const previousEntries = entriesRef.current;
    setError(null);
    setEntries((prev) => prev.filter((_, i) => i !== index));
    if (entry?.id) {
      try {
        await deleteEntryById(entry.id);
      } catch (err) {
        console.error("Failed to delete entry:", err);
        setEntries(previousEntries);
        setError(errorMessage("Delete failed. Nothing was removed from the database.", err));
        throw err;
      }
    }
  }, []);

  const clearAll = useCallback(async () => {
    const previousEntries = entriesRef.current;
    setError(null);
    setEntries([]);
    try {
      await clearAllEntries();
    } catch (err) {
      console.error("Failed to clear entries:", err);
      setEntries(previousEntries);
      setError(errorMessage("Reset failed. Existing entries were restored on screen.", err));
      throw err;
    }
  }, []);

  const replaceAll = useCallback(async (newEntries) => {
    const previousEntries = entriesRef.current;
    setError(null);
    setEntries(newEntries);
    try {
      await clearAllEntries();
      for (const entry of newEntries) {
        await saveEntry(entry);
      }
    } catch (err) {
      console.error("Failed to replace entries:", err);
      setEntries(previousEntries);
      setError(errorMessage("Import replacement failed. Restore from your JSON backup if needed.", err));
      throw err;
    }
  }, []);

  const mergeEntries = useCallback(async (incoming) => {
    const existingIds = new Set(entriesRef.current.map((e) => e.id));
    const toAdd = incoming.filter((e) => !existingIds.has(e.id));
    if (toAdd.length === 0) return 0;

    setError(null);
    setEntries((prev) => [...prev, ...toAdd]);
    try {
      for (const entry of toAdd) {
        await saveEntry(entry);
      }
      return toAdd.length;
    } catch (err) {
      console.error("Failed to merge entries:", err);
      try {
        const data = await loadEntries();
        setEntries(data);
      } catch {
        setEntries(entriesRef.current);
      }
      setError(errorMessage("Import merge failed.", err));
      throw err;
    }
  }, []);

  return {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    clearAll,
    replaceAll,
    mergeEntries,
  };
}
