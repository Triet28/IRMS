import { useState, useEffect } from 'react';
import { getAvailableMenu, getAvailableCombos } from '../api/apiClient';

export function useMenu() {
  const [items,   setItems]   = useState([]);
  const [combos,  setCombos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([getAvailableMenu(), getAvailableCombos()])
      .then(([menuItems, comboList]) => {
        setItems(menuItems);
        setCombos(comboList);
      })
      .catch(() => setError('Không thể tải menu'))
      .finally(() => setLoading(false));
  }, []);

  const byCategory = items.reduce((acc, item) => {
    const cat = item.categoryName ?? 'Khác';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return { items, combos, byCategory, loading, error };
}
