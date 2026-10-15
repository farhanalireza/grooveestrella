// src/hooks/useDebouncedSearch.js
import { useEffect, useMemo } from "react";
import debounce from "lodash.debounce";
import { API_BASE_URL } from "../lib/apiClient";

const useDebouncedSearch = (searchTerm, searchType, setLoading, setResults) => {
  const performSearch = async (query, type) => {
    if (!query || !query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query.trim())}&type=${type || 'track'}&limit=20`);
      if (!res.ok) throw new Error(`Search error ${res.status}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Immediate search on load if query exists (e.g. from URL query parameters)
  useEffect(() => {
    if (searchTerm && searchTerm.trim() !== "") {
      performSearch(searchTerm, searchType);
    }
  }, []);

  const debouncedSearch = useMemo(() => {
    return debounce(async (query, type) => {
      await performSearch(query, type);
    }, 400); // Fast 400ms debounce
  }, []);

  return debouncedSearch;
};

export default useDebouncedSearch;
