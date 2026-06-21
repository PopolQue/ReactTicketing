import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useDebouncedSearch<T>(
  searchQuery: string,
  tableName: string,
  searchColumn: string,
  orderBy: string,
  delay: number = 300,
  skipCondition?: () => boolean
) {
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (skipCondition && skipCondition()) {
      setResults((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    if (!searchQuery) {
      setResults((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      const { data } = await supabase
        .from(tableName)
        .select('*')
        .ilike(searchColumn, `%${searchQuery}%`)
        .order(orderBy, { ascending: false })
        .limit(5);

      if (data) {
        setResults(data as T[]);
      }
      setLoading(false);
    };

    const debounce = setTimeout(fetchResults, delay);
    return () => clearTimeout(debounce);
  }, [searchQuery, tableName, searchColumn, orderBy, delay, skipCondition]);

  return { results, loading, setResults };
}
