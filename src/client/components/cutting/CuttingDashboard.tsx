'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useOrders } from '../../hooks/useOrders';
import { api } from '../../api/client';
import { ExpectedComponentCalculation } from '../../types';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/Badges';
import { Modal } from '../ui/Card';

export const CuttingDashboard: React.FC = () => {
  const { orders, recipes, loading, error, createOrder, resubmitOrder, refreshOrders } =
    useOrders();

  // New Order Form state
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [targetQty, setTargetQty] = useState<number | ''>('');
  const [fabricRollId, setFabricRollId] = useState<string>('');
  const [actualFabricYds, setActualFabricYds] = useState<number | ''>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Live BOM Preview state
  const [preview, setPreview] = useState<ExpectedComponentCalculation | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  // Re-cut Resubmit Modal state
  const [resubmitOrderId, setResubmitOrderId] = useState<string | null>(null);
  const [updatedFabricYds, setUpdatedFabricYds] = useState<number | ''>('');
  const [resubmitting, setResubmitting] = useState<boolean>(false);

  // Initialize selected recipe when recipes load
  useEffect(() => {
    if (recipes.length > 0 && !selectedRecipeId) {
      setSelectedRecipeId(recipes[0].id);
    }
  }, [recipes, selectedRecipeId]);

  // Fetch live expected BOM preview whenever recipe or targetQty changes
  useEffect(() => {
    if (selectedRecipeId && typeof targetQty === 'number' && targetQty > 0) {
      setPreviewLoading(true);
      api.recipes
        .calculateExpected(selectedRecipeId, targetQty)
        .then((data) => setPreview(data))
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false));
    } else {
      setPreview(null);
    }
  }, [selectedRecipeId, targetQty]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedRecipeId) {
      setFormError('Please select a garment style recipe.');
      return;
    }
    if (!targetQty || targetQty <= 0 || !Number.isInteger(Number(targetQty))) {
      setFormError('Target quantity must be a positive whole integer.');
      return;
    }
    if (!fabricRollId.trim()) {
      setFormError('Please enter a valid Fabric Roll ID.');
      return;
    }
    if (!actualFabricYds || actualFabricYds <= 0) {
      setFormError('Please enter valid actual fabric yards consumed.');
      return;
    }

    try {
      setSubmitting(true);
      await createOrder({
        recipeId: selectedRecipeId,
        targetQty: Number(targetQty),
        fabricRollId: fabricRollId.trim(),
        actualFabricYds: Number(actualFabricYds),
      });

      // Reset form
      setTargetQty('');
      setFabricRollId('');
      setActualFabricYds('');
      setPreview(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create order.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = async () => {
    if (!resubmitOrderId) return;
    try {
      setResubmitting(true);
      const yards = typeof updatedFabricYds === 'number' ? updatedFabricYds : undefined;
      await resubmitOrder(resubmitOrderId, yards);
      setResubmitOrderId(null);
      setUpdatedFabricYds('');
      refreshOrders();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to resubmit order');
    } finally {
      setResubmitting(false);
    }
  };

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Cutting Floor Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Log fabric cut batches, compute real-time bill-of-materials, and submit to Gatekeeper verification.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refreshOrders()} loading={loading}>
          ↻ Refresh Orders
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 font-medium">
          {error}
        </div>
      )}

      {/* Main Grid: Order Entry Form + Live BOM Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Cut Batch Entry */}
        <div className="lg:col-span-6">
          <Card
            title="Log New Cut Batch"
            subtitle="Input order parameters to generate work order & verification items"
          >
            <form onSubmit={handleCreateOrder} className="space-y-4">
              {formError && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium">
                  {formError}
                </div>
              )}

              <Select
                label="Garment Recipe / Style"
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
                required
              >
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name} ({recipe.recipeCode}) - {recipe.stdFabricYards} yds/unit (Cap: {recipe.wastageCap}%)
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Target Quantity (Units)"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 100"
                  value={targetQty}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTargetQty(v === '' ? '' : parseInt(v, 10));
                  }}
                  required
                  helperText="Whole integer garment count"
                />

                <Input
                  label="Fabric Roll ID"
                  placeholder="e.g. ROLL-2026-901"
                  maxLength={50}
                  value={fabricRollId}
                  onChange={(e) => setFabricRollId(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Actual Fabric Consumed (Yards)"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 182.50"
                value={actualFabricYds}
                onChange={(e) => {
                  const v = e.target.value;
                  setActualFabricYds(v === '' ? '' : parseFloat(v));
                }}
                required
                helperText="Total physical yards cut from roll"
              />

              <div className="pt-2">
                <Button type="submit" variant="primary" className="w-full" loading={submitting}>
                  Generate & Submit for Verification
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Panel: Live Bill-of-Materials & Tolerance Preview */}
        <div className="lg:col-span-6">
          <Card
            title="Live Bill-of-Materials (BOM) Preview"
            subtitle="Server-calculated component counts and fabric requirement"
          >
            {previewLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Calculating expected components...
              </div>
            ) : preview ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block">Expected Standard Fabric:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {preview.expectedFabricYds} yds
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Wastage Cap Tolerance:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {preview.recipe.wastageCap}%
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Expected Component Quantities:
                  </h4>
                  <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    {preview.components.map((comp) => (
                      <div
                        key={comp.componentId}
                        className="flex items-center justify-between px-3 py-2 text-xs bg-white hover:bg-slate-50 transition"
                      >
                        <span className="font-medium text-slate-800">{comp.componentName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[11px]">
                            {comp.piecesPerGarment} pc/unit
                          </span>
                          <span className="font-bold px-2 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {comp.expectedQty} pcs
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400">
                Enter a target quantity above to calculate required pieces & standard fabric yardage.
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Orders List Section */}
      <Card
        title="Supervisor Orders History"
        subtitle="Tracking batches across verification, rejection, and sewing floor"
      >
        {loading && orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No cutting orders created yet. Use the form above to log your first cut batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order No</th>
                  <th className="py-3 px-4">Style / Recipe</th>
                  <th className="py-3 px-4 text-center">Target Qty</th>
                  <th className="py-3 px-4 text-center">Fabric (Yds)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-indigo-600">
                      <Link href={`/orders/${order.id}`} className="hover:underline">
                        {order.orderNo}
                      </Link>
                      <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-semibold">
                      {order.recipe?.name}
                      <span className="block text-[10px] text-slate-500 font-normal">
                        Roll: {order.fabricRollId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-800 font-bold">
                      {order.targetQty}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-700">
                      {order.actualFabricYds}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {order.status === 'REJECTED' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setResubmitOrderId(order.id);
                            setUpdatedFabricYds(order.actualFabricYds);
                          }}
                        >
                          Re-cut & Resubmit
                        </Button>
                      )}
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Resubmit Modal */}
      <Modal
        isOpen={Boolean(resubmitOrderId)}
        onClose={() => setResubmitOrderId(null)}
        title="Re-cut & Resubmit Order for Verification"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Resubmitting this order will reset component inspection counts to uncounted (RED) and transition the order back to <strong className="text-slate-900">PENDING_VERIFICATION</strong> for a fresh gatekeeper count.
          </p>

          <Input
            label="Updated Actual Fabric Consumed (Yards)"
            type="number"
            min="0.01"
            step="0.01"
            value={updatedFabricYds}
            onChange={(e) => {
              const v = e.target.value;
              setUpdatedFabricYds(v === '' ? '' : parseFloat(v));
            }}
            helperText="Leave as-is or adjust if extra fabric was consumed in re-cut"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setResubmitOrderId(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleResubmit} loading={resubmitting}>
              Confirm Resubmission
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
