'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useOrders } from '../../hooks/useOrders';
import { api } from '../../api/client';
import { CuttingOrder, OrderStatus, Recipe } from '../../types';
import { Card, Modal } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badges';
import { EmptyState } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';

export const CuttingDashboard: React.FC = () => {
  const { orders, recipes, loading, error, createOrder, resubmitOrder, refreshOrders } =
    useOrders();
  const { showToast } = useToast();

  // Status Filter state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Create Order Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [targetQtyStr, setTargetQtyStr] = useState<string>('');
  const [fabricRollId, setFabricRollId] = useState<string>('');
  const [actualFabricYdsStr, setActualFabricYdsStr] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Re-cut Resubmit Modal state
  const [resubmitOrderTarget, setResubmitOrderTarget] = useState<CuttingOrder | null>(null);
  const [resubmitFabricStr, setResubmitFabricStr] = useState<string>('');
  const [resubmitError, setResubmitError] = useState<string | null>(null);
  const [resubmitting, setResubmitting] = useState(false);

  // Default select first recipe when list loads
  useEffect(() => {
    if (recipes.length > 0 && !selectedRecipeId) {
      setSelectedRecipeId(recipes[0].id);
    }
  }, [recipes, selectedRecipeId]);

  const selectedRecipe = useMemo<Recipe | undefined>(() => {
    return recipes.find((r) => r.id === selectedRecipeId);
  }, [recipes, selectedRecipeId]);

  // Client-side validation mirroring server Zod schema
  const validateCreateForm = () => {
    const errs: Record<string, string> = {};

    if (!selectedRecipeId) {
      errs.recipeId = 'Please select a garment recipe style';
    }

    // Target Qty validation (Strict integer, 1..100,000, rejects decimals/negatives/non-numeric)
    const trimmedQty = targetQtyStr.trim();
    if (!trimmedQty) {
      errs.targetQty = 'Target quantity is required';
    } else if (!/^\d+$/.test(trimmedQty)) {
      errs.targetQty = 'Target quantity must be a whole positive integer (no decimals or symbols)';
    } else {
      const qtyNum = parseInt(trimmedQty, 10);
      if (qtyNum < 1) {
        errs.targetQty = 'Target quantity must be at least 1 unit';
      } else if (qtyNum > 100000) {
        errs.targetQty = 'Target quantity cannot exceed 100,000 units';
      }
    }

    // Fabric Roll ID validation
    const trimmedRoll = fabricRollId.trim();
    if (!trimmedRoll) {
      errs.fabricRollId = 'Fabric Roll ID is required';
    } else if (trimmedRoll.length > 50) {
      errs.fabricRollId = 'Fabric Roll ID cannot exceed 50 characters';
    }

    // Actual Fabric Yards validation (Positive number, max 2 decimals)
    const trimmedYards = actualFabricYdsStr.trim();
    if (!trimmedYards) {
      errs.actualFabricYds = 'Actual fabric consumed is required';
    } else if (!/^\d+(\.\d{1,2})?$/.test(trimmedYards)) {
      errs.actualFabricYds = 'Enter a valid positive number with at most 2 decimal places (e.g. 182.50)';
    } else {
      const yardsNum = parseFloat(trimmedYards);
      if (yardsNum <= 0) {
        errs.actualFabricYds = 'Actual fabric must be greater than 0';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateCreateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const created = await createOrder({
        recipeId: selectedRecipeId,
        targetQty: parseInt(targetQtyStr.trim(), 10),
        fabricRollId: fabricRollId.trim(),
        actualFabricYds: parseFloat(actualFabricYdsStr.trim()),
      });

      showToast(`Cut batch ${created.orderNo} created and submitted for verification!`, 'success');
      setIsCreateModalOpen(false);

      // Reset form fields
      setTargetQtyStr('');
      setFabricRollId('');
      setActualFabricYdsStr('');
      setErrors({});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create cutting order';
      setServerError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmitConfirm = async () => {
    if (!resubmitOrderTarget) return;

    let parsedYards: number | undefined = undefined;
    if (resubmitFabricStr.trim()) {
      if (!/^\d+(\.\d{1,2})?$/.test(resubmitFabricStr.trim())) {
        setResubmitError('Fabric yards must be a positive number with max 2 decimals');
        return;
      }
      parsedYards = parseFloat(resubmitFabricStr.trim());
      if (parsedYards <= 0) {
        setResubmitError('Fabric yards must be greater than 0');
        return;
      }
    }

    try {
      setResubmitting(true);
      setResubmitError(null);
      await resubmitOrder(resubmitOrderTarget.id, parsedYards);
      showToast(`Order ${resubmitOrderTarget.orderNo} resubmitted for verification!`, 'success');
      setResubmitOrderTarget(null);
      setResubmitFabricStr('');
      refreshOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resubmit order';
      setResubmitError(msg);
      showToast(msg, 'error');
    } finally {
      setResubmitting(false);
    }
  };

  // Dynamic Live BOM Calculations
  const liveQty = useMemo(() => {
    const trimmed = targetQtyStr.trim();
    if (/^\d+$/.test(trimmed)) {
      const val = parseInt(trimmed, 10);
      return val > 0 && val <= 100000 ? val : 0;
    }
    return 0;
  }, [targetQtyStr]);

  const liveExpectedFabric = useMemo(() => {
    if (selectedRecipe && liveQty > 0) {
      return Number((selectedRecipe.stdFabricYards * liveQty).toFixed(2));
    }
    return 0;
  }, [selectedRecipe, liveQty]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <div className="space-y-8">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Cutting Supervisor Workspace
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Log fabric cut batches, compute real-time bill-of-materials, and track gatekeeper verification progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refreshOrders()} loading={loading}>
            ↻ Refresh Orders
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setIsCreateModalOpen(true);
              setServerError(null);
            }}
          >
            + Create Cutting Order
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-rose-50 border border-rose-300 p-4 text-xs font-bold text-rose-900">
          ⚠️ {error}
        </div>
      )}

      {/* Orders Table Card with Status Filters */}
      <Card
        title="Active Cut Batches"
        subtitle="Manage and track order progress across the factory floor"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold py-1.5 px-3 rounded-lg border border-[#6b7280] bg-white text-[#111827]"
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
            >
              <option value="ALL">All Batches ({orders.length})</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected (Needs Re-cut)</option>
              <option value="SEWING_STARTED">Sewing Started</option>
              <option value="IN_PROGRESS">In Progress</option>
            </select>
          </div>
        }
      >
        {loading && orders.length === 0 ? (
          /* Loading Skeletons */
          <div className="space-y-3 py-4 animate-pulse">
            <div className="h-10 bg-slate-200 rounded-lg" />
            <div className="h-12 bg-slate-100 rounded-lg" />
            <div className="h-12 bg-slate-100 rounded-lg" />
            <div className="h-12 bg-slate-100 rounded-lg" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            title="No Cutting Orders Found"
            description={
              statusFilter === 'ALL'
                ? "You haven't created any cutting orders yet. Click 'Create Cutting Order' above to log your first batch."
                : `No orders currently match status: ${statusFilter}.`
            }
            icon="✂️"
            action={
              statusFilter === 'ALL' ? (
                <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                  + Log First Cut Batch
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setStatusFilter('ALL')}>
                  Show All Orders
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Order No</th>
                  <th className="py-3.5 px-4">Style / Recipe</th>
                  <th className="py-3.5 px-4 text-center">Target Qty</th>
                  <th className="py-3.5 px-4 text-center">Fabric (Yds)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-indigo-700">
                      <Link href={`/orders/${order.id}`} className="hover:underline">
                        {order.orderNo}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-bold">
                      {order.recipe?.name}
                      <span className="block text-[10px] text-slate-500 font-normal">
                        Roll: {order.fabricRollId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-900">
                      {order.targetQty}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                      {order.actualFabricYds}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <StatusBadge status={order.status} size="sm" />
                        {order.status === 'REJECTED' && order.verificationLogs?.[0]?.rejectionNote && (
                          <span
                            className="text-[10px] text-rose-800 bg-rose-100 px-2 py-0.5 rounded-sm max-w-[200px] truncate"
                            title={order.verificationLogs[0].rejectionNote}
                          >
                            Reason: {order.verificationLogs[0].rejectionNote}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {order.status === 'REJECTED' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setResubmitOrderTarget(order);
                            setResubmitFabricStr(order.actualFabricYds.toString());
                            setResubmitError(null);
                          }}
                        >
                          Re-cut & Resubmit
                        </Button>
                      )}
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition shadow-xs"
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

      {/* CREATE ORDER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Cutting Order"
      >
        <form onSubmit={handleCreateOrderSubmit} className="space-y-4">
          {serverError && (
            <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-[#b91c1c] text-xs font-bold text-[#b91c1c]">
              ⚠️ {serverError}
            </div>
          )}

          {/* Recipe Select */}
          <Select
            label="Garment Recipe / Style"
            value={selectedRecipeId}
            onChange={(e) => {
              setSelectedRecipeId(e.target.value);
              if (errors.recipeId) setErrors((prev) => ({ ...prev, recipeId: '' }));
            }}
            error={errors.recipeId}
            required
          >
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.recipeCode}) - {r.stdFabricYards} yds/unit (Wastage Cap: {r.wastageCap}%)
              </option>
            ))}
          </Select>

          {/* Target Quantity Input with strict manual validation */}
          <Input
            label="Target Quantity (Whole Integer Units)"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 100"
            value={targetQtyStr}
            onChange={(e) => {
              setTargetQtyStr(e.target.value);
              if (errors.targetQty) setErrors((prev) => ({ ...prev, targetQty: '' }));
            }}
            error={errors.targetQty}
            helperText="Whole integer between 1 and 100,000"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fabric Roll ID */}
            <Input
              label="Fabric Roll ID"
              placeholder="e.g. ROLL-2026-901"
              maxLength={50}
              value={fabricRollId}
              onChange={(e) => {
                setFabricRollId(e.target.value);
                if (errors.fabricRollId) setErrors((prev) => ({ ...prev, fabricRollId: '' }));
              }}
              error={errors.fabricRollId}
              required
            />

            {/* Actual Fabric Yards */}
            <Input
              label="Actual Fabric Used (Yds)"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 182.50"
              value={actualFabricYdsStr}
              onChange={(e) => {
                setActualFabricYdsStr(e.target.value);
                if (errors.actualFabricYds) setErrors((prev) => ({ ...prev, actualFabricYds: '' }));
              }}
              error={errors.actualFabricYds}
              helperText="Positive number with max 2 decimals"
              required
            />
          </div>

          {/* LIVE BILL-OF-MATERIALS PREVIEW PANEL */}
          <div className="mt-4 p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                ⚡ Live Bill-of-Materials (BOM) Preview
              </span>
              {liveQty > 0 && (
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  Target: {liveQty} Units
                </span>
              )}
            </div>

            {selectedRecipe && liveQty > 0 ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-white border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Expected Standard Fabric:</span>
                    <span className="font-extrabold text-slate-900">{liveExpectedFabric} yds</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Style Wastage Cap:</span>
                    <span className="font-extrabold text-slate-900">{selectedRecipe.wastageCap}%</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    Required Component Pieces Breakdown:
                  </span>
                  <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
                    {selectedRecipe.components?.map((comp) => (
                      <div
                        key={comp.id}
                        className="flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-50"
                      >
                        <span className="font-bold text-slate-900">{comp.componentName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[11px]">
                            {comp.piecesPerGarment}x / unit
                          </span>
                          <span className="font-extrabold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-sm border border-indigo-200">
                            {liveQty * comp.piecesPerGarment} pcs
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                Enter a valid target quantity above to see real-time component piece counts and standard fabric requirement.
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              Generate & Submit Batch
            </Button>
          </div>
        </form>
      </Modal>

      {/* RESUBMIT MODAL */}
      <Modal
        isOpen={Boolean(resubmitOrderTarget)}
        onClose={() => setResubmitOrderTarget(null)}
        title={`Re-cut & Resubmit Order: ${resubmitOrderTarget?.orderNo}`}
      >
        <div className="space-y-4 text-xs">
          {resubmitError && (
            <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-[#b91c1c] text-xs font-bold text-[#b91c1c]">
              ⚠️ {resubmitError}
            </div>
          )}

          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
            <strong className="block mb-1 text-rose-950 font-bold">Previous Verifier Rejection Reason:</strong>
            {resubmitOrderTarget?.verificationLogs?.[0]?.rejectionNote || 'Defect/shortage found during inspection.'}
          </div>

          <p className="text-slate-700">
            Resubmitting will reset all component counts to uncounted (RED) and transition the order back to <strong className="text-slate-900 font-extrabold">PENDING_VERIFICATION</strong> for fresh gatekeeper inspection.
          </p>

          <Input
            label="Updated Actual Fabric Consumed (Yards)"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 185.00"
            value={resubmitFabricStr}
            onChange={(e) => {
              setResubmitFabricStr(e.target.value);
              setResubmitError(null);
            }}
            helperText="Adjust if extra fabric was consumed during re-cutting"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setResubmitOrderTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleResubmitConfirm} loading={resubmitting}>
              Confirm Re-cut & Resubmit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
