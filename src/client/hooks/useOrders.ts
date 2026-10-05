'use client';

import { useState, useCallback, useEffect } from 'react';
import { CuttingOrder, Recipe, Decision } from '../types';
import { api } from '../api/client';

export function useOrders() {
  const [orders, setOrders] = useState<CuttingOrder[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.orders.list();
      setOrders(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecipes = useCallback(async () => {
    try {
      const data = await api.recipes.list();
      setRecipes(data);
    } catch (err: unknown) {
      console.error('Failed to fetch recipes:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchRecipes();
  }, [fetchOrders, fetchRecipes]);

  const createOrder = async (input: {
    recipeId: string;
    targetQty: number;
    fabricRollId: string;
    actualFabricYds: number;
  }) => {
    const created = await api.orders.create(input);
    setOrders((prev) => [created, ...prev]);
    return created;
  };

  const resubmitOrder = async (orderId: string, updatedFabricYds?: number) => {
    const updated = await api.orders.resubmit(orderId, updatedFabricYds);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    return updated;
  };

  const saveCounts = async (orderId: string, counts: Array<{ componentId: string; actualQty: number }>) => {
    const updated = await api.orders.saveCounts(orderId, counts);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    return updated;
  };

  const verifyOrder = async (orderId: string, decision: Decision, rejectionNote?: string) => {
    const updated = await api.orders.verify(orderId, decision, rejectionNote);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    return updated;
  };

  const startSewing = async (orderId: string, notes?: string) => {
    const res = await api.orders.startSewing(orderId, notes);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
    return res.order;
  };

  return {
    orders,
    recipes,
    loading,
    error,
    refreshOrders: fetchOrders,
    createOrder,
    resubmitOrder,
    saveCounts,
    verifyOrder,
    startSewing,
  };
}
