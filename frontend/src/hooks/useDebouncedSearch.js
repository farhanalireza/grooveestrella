// src/hooks/useDebouncedSearch.js
import { useEffect, useMemo, useRef, useCallback } from "react";
import debounce from "lodash.debounce";
import { API_BASE_URL } from "../lib/apiClient";

const useDebouncedSearch = (searchTerm, searchType, setLoading, setResults) => {
  const abortControllerRef = useRef(null);

  const performSearch = useCallback(async (query, type) => {
    if (!query || !query.trim()) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setResults([]);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/search?q=${encodeURIComponent(query.trim())}&type=${type || 'track'}&limit=20`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error(`Search error ${res.status}`);
      const data = await res.json();
      if (!controller.signal.aborted) {
        setResults(data.results || []);
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      console.error("Search failed:", err);
      if (!controller.signal.aborted) {
        setResults([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [setLoading, setResults]);

  // Immediate search on load if query exists (e.g. from URL query parameters)
  useEffect(() => {
    if (searchTerm && searchTerm.trim() !== "") {
      performSearch(searchTerm, searchType);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const debouncedSearch = useMemo(() => {
    return debounce(async (query, type) => {
      await performSearch(query, type);
    }, 200);
  }, [performSearch]);

  return debouncedSearch;
};

export default useDebouncedSearch;
