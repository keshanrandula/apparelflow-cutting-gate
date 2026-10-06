'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { CuttingOrder, ItemStatus } from '../../types';
import { Card, Modal } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge, TrafficBadge } from '../ui/Badges';
import { useToast } from '../ui/Toast';

export const VerificationDashboard: React.FC = () => {
  const { orders, loading, error, saveCounts, verifyOrder, refreshOrders } = useOrders();
  const { showToast } = useToast();

  // Active selected order for gatekeeper inspection
  const [selectedOrder, setSelectedOrder] = useState<CuttingOrder | null>(null);

  // Local editing state for component counts: { [componentId: string]: string }
  // We use string in local state to allow clear typing and manual numeric validation
  const [countsInputState, setCountsInputState] = useState<Record<string, string>>({});
  const [savingCounts, setSavingCounts] = useState(false);

  // Verify / Reject action state
  const [approving, setApproving] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [rejectionTouched, setRejectionTouched] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter orders in PENDING_VERIFICATION queue
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => {
      const isPending = o.status === 'PENDING_VERIFICATION';
      if (!isPending) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        o.orderNo.toLowerCase().includes(q) ||
        o.recipe?.name.toLowerCase().includes(q) ||
        o.fabricRollId.toLowerCase().includes(q) ||
        (o.createdBy?.name && o.createdBy.name.toLowerCase().includes(q))
      );
    });
  }, [orders, searchQuery]);

  // Sync selected order and initialize counts when orders list updates or order selection changes
  useEffect(() => {
    if (selectedOrder) {
      const fresh = orders.find((o) => o.id === selectedOrder.id);
      if (fresh) {
        setSelectedOrder(fresh);
        const inputs: Record<string, string> = {};
        fresh.items?.forEach((item) => {
          inputs[item.componentId] = item.actualQty.toString();
        });
        setCountsInputState((prev) => ({ ...inputs, ...prev }));
      }
    } else if (pendingOrders.length > 0) {
      const first = pendingOrders[0];
      setSelectedOrder(first);
      const inputs: Record<string, string> = {};
      first.items?.forEach((item) => {
        inputs[item.componentId] = item.actualQty.toString();
      });
      setCountsInputState(inputs);
    }
  }, [orders]);

  const handleSelectOrder = (order: CuttingOrder) => {
    setSelectedOrder(order);
    setActionError(null);
    const inputs: Record<string, string> = {};
    order.items?.forEach((item) => {
      inputs[item.componentId] = item.actualQty.toString();
    });
    setCountsInputState(inputs);
    showToast(`Loaded order ${order.orderNo} for physical count verification`, 'info');
  };

  const handleCountChange = (componentId: string, val: string) => {
    // Only allow positive integer digits or empty string
    if (val !== '' && !/^\d+$/.test(val)) {
      return;
    }
    setCountsInputState((prev) => ({
      ...prev,
      [componentId]: val,
    }));
  };

  const handleFillAllExpected = () => {
    if (!selectedOrder) return;
    const filled: Record<string, string> = {};
    selectedOrder.items.forEach((item) => {
      filled[item.componentId] = item.expectedQty.toString();
    });
    setCountsInputState(filled);
    showToast('Auto-filled all component counts to exact expected values.', 'info');
  };

  // Compute breakdown stats and traffic light status for all components
  const inspectionAnalysis = useMemo(() => {
    if (!selectedOrder || !selectedOrder.items) {
      return {
        totalComponents: 0,
        countedComponents: 0,
        greenCount: 0,
        yellowCount: 0,
        redCount: 0,
        hasRedShortage: false,
        allCounted: false,
        itemAnalyses: [],
      };
    }

    let counted = 0;
    let green = 0;
    let yellow = 0;
    let red = 0;

    const itemAnalyses = selectedOrder.items.map((item) => {
      const rawInput = countsInputState[item.componentId];
      const isUncounted = rawInput === undefined || rawInput.trim() === '';
      const actualQty = isUncounted ? 0 : parseInt(rawInput, 10);
      const diff = actualQty - item.expectedQty;

      let status: ItemStatus;
      if (isUncounted || actualQty < item.expectedQty) {
        status = 'RED';
        red++;
      } else if (actualQty > item.expectedQty) {
        status = 'YELLOW';
        yellow++;
      } else {
        status = 'GREEN';
        green++;
      }

      if (!isUncounted) {
        counted++;
      }

      return {
        item,
        actualQty,
        isUncounted,
        diff,
        status,
      };
    });

    const total = selectedOrder.items.length;
    const allCounted = counted === total;
    const hasRedShortage = red > 0;

    return {
      totalComponents: total,
      countedComponents: counted,
      greenCount: green,
      yellowCount: yellow,
      redCount: red,
      hasRedShortage,
      allCounted,
      itemAnalyses,
    };
  }, [selectedOrder, countsInputState]);

  // Save counts to server
  const handleSaveProgress = async () => {
    if (!selectedOrder) return;
    try {
      setSavingCounts(true);
      setActionError(null);

      const payload = selectedOrder.items.map((item) => {
        const raw = countsInputState[item.componentId];
        const val = raw !== undefined && raw.trim() !== '' ? parseInt(raw, 10) : 0;
        return {
          componentId: item.componentId,
          actualQty: isNaN(val) ? 0 : val,
        };
      });

      await saveCounts(selectedOrder.id, payload);
      showToast(`Progress saved for order ${selectedOrder.orderNo}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save component counts.';
      setActionError(msg);
      showToast(msg, 'error');
    } finally {
      setSavingCounts(false);
    }
  };

  // Approve batch and release to sewing floor
  const handleApproveBatch = async () => {
    if (!selectedOrder) return;
    try {
      setApproving(true);
      setActionError(null);

      const payload = selectedOrder.items.map((item) => {
        const raw = countsInputState[item.componentId];
        const val = raw !== undefined && raw.trim() !== '' ? parseInt(raw, 10) : 0;
        return {
          componentId: item.componentId,
          actualQty: isNaN(val) ? 0 : val,
        };
      });

      // 1. Save counts first
      await saveCounts(selectedOrder.id, payload);

      // 2. Perform strict server-side gatekeeper approval with counts
      await verifyOrder(selectedOrder.id, 'APPROVED', undefined, payload);
      showToast(`Order ${selectedOrder.orderNo} successfully VERIFIED and released to Sewing!`, 'success');
      await refreshOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gatekeeper approval rejected by server.';
      setActionError(msg);
      showToast(msg, 'error');
    } finally {
      setApproving(false);
    }
  };

  // Reject batch
  const handleConfirmReject = async () => {
    setRejectionTouched(true);
    const trimmed = rejectionNote.trim();
    if (trimmed.length < 5) {
      return;
    }

    if (!selectedOrder) return;
    try {
      setRejecting(true);
      setActionError(null);

      await verifyOrder(selectedOrder.id, 'REJECTED', trimmed);
      showToast(`Order ${selectedOrder.orderNo} REJECTED and returned for re-cut.`, 'warning');
      setIsRejectModalOpen(false);
      setRejectionNote('');
      setRejectionTouched(false);
      await refreshOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject order.';
      setActionError(msg);
      showToast(msg, 'error');
    } finally {
      setRejecting(false);
    }
  };

  // Calculate Fabric Wastage % for live preview
  const expectedFabric = selectedOrder
    ? selectedOrder.recipe.stdFabricYards * selectedOrder.targetQty
    : 0;
  const wastagePct =
    selectedOrder && expectedFabric > 0
      ? Number((((selectedOrder.actualFabricYds - expectedFabric) / expectedFabric) * 100).toFixed(2))
      : 0;

  const isWastageOverCap = selectedOrder && wastagePct > selectedOrder.recipe.wastageCap;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-emerald-600 text-white font-black text-sm">
              GATE
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Gatekeeper Verification Terminal
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Strict Physical Piece Count Verification • Traffic-Light Compliance • Fabric Wastage Gatekeeper
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await refreshOrders();
            showToast('Verification queue refreshed', 'info');
          }}
          loading={loading}
          className="self-start sm:self-auto"
        >
          ↻ Refresh Queue
        </Button>
      </div>

      {/* Global Action Error Alert Banner (Handles 422, 409, 403, etc.) */}
      {actionError && (
        <div
          role="alert"
          className="rounded-xl bg-rose-50 border-2 border-rose-400 p-4 text-xs font-bold text-rose-950 flex items-start justify-between gap-3 shadow-sm animate-in fade-in duration-200"
        >
          <div className="flex items-start gap-2.5">
            <span className="text-base text-rose-600 font-black">⚠️</span>
            <div>
              <span className="font-extrabold uppercase tracking-wide text-rose-900 block mb-0.5">
                Server Gatekeeper Rule Violation
              </span>
              <p className="font-medium text-rose-950 leading-relaxed">{actionError}</p>
            </div>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-700 hover:text-rose-950 text-base font-black px-1"
            title="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Pending Queue Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <Card
            title={`Pending Verification Queue (${pendingOrders.length})`}
            subtitle="Cut orders awaiting gatekeeper physical count"
          >
            {/* Quick Search */}
            <div className="relative mb-3.5">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by Order No, Style, or Fabric Roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-8 py-2 text-slate-900 bg-slate-50/70 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition shadow-xs"
                style={{ color: '#111827' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {pendingOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 font-medium">
                {orders.some((o) => o.status === 'PENDING_VERIFICATION')
                  ? 'No pending orders match your search query.'
                  : '✓ All caught up! No orders currently pending gatekeeper verification.'}
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {pendingOrders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  return (
                    <div
                      key={order.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectOrder(order)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectOrder(order);
                        }
                      }}
                      className={`cursor-pointer rounded-xl p-4 border transition-all text-left w-full ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900">
                          {order.orderNo}
                        </span>
                        <StatusBadge status={order.status} size="sm" />
                      </div>
                      <div className="text-xs text-slate-700 mt-1 font-bold">
                        {order.recipe?.name}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                        <div>
                          Target: <strong className="text-slate-900">{order.targetQty} pcs</strong>
                        </div>
                        <div>
                          Roll: <strong className="text-slate-900">{order.fabricRollId}</strong>
                        </div>
                        <div>
                          Supervisor: <strong className="text-slate-900">{order.createdBy?.name || 'Supervisor'}</strong>
                        </div>
                        <div>
                          Fabric: <strong className="text-slate-900">{order.actualFabricYds} yds</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Verification Screen for Selected Order */}
        <div className="lg:col-span-8 space-y-6">
          {selectedOrder ? (
            <>
              {/* Order Metadata Card */}
              <Card
                title={`Inspecting Batch: ${selectedOrder.orderNo}`}
                subtitle={`Style: ${selectedOrder.recipe.name} (${selectedOrder.recipe.recipeCode}) • Supervisor: ${selectedOrder.createdBy?.name || 'N/A'}`}
                action={
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleFillAllExpected}
                      title="Autofill all actual counts with standard expected quantities"
                    >
                      ⚡ Fill All Expected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveProgress}
                      loading={savingCounts}
                      title="Save counts to database to persist across refresh"
                    >
                      💾 Save Progress
                    </Button>
                  </div>
                }
              >
                {/* KPI Header Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block font-medium">Target Garment Units:</span>
                    <span className="text-base font-black text-slate-900">{selectedOrder.targetQty} pcs</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Actual Fabric Used:</span>
                    <span className="text-base font-black text-slate-900">{selectedOrder.actualFabricYds} yds</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Std Expected Fabric:</span>
                    <span className="text-base font-black text-slate-900">{expectedFabric.toFixed(2)} yds</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Wastage % (Cap: {selectedOrder.recipe.wastageCap}%):</span>
                    <span
                      className={`text-base font-black ${
                        isWastageOverCap ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {wastagePct > 0 ? `+${wastagePct}%` : `${wastagePct}%`}
                    </span>
                  </div>
                </div>

                {/* Summary Bar */}
                <div className="mt-4 p-3.5 rounded-xl bg-white border-2 border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600">Verification Summary:</span>
                    <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">
                      Counted {inspectionAnalysis.countedComponents} / {inspectionAnalysis.totalComponents} components
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-950 font-bold border border-emerald-300">
                      ✓ {inspectionAnalysis.greenCount} Match
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-950 font-bold border border-amber-300">
                      ▲ {inspectionAnalysis.yellowCount} Excess
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-100 text-rose-950 font-black border border-rose-300">
                      ✕ {inspectionAnalysis.redCount} Shortage
                    </span>
                  </div>
                </div>
              </Card>

              {/* Physical Component Count Table */}
              <Card
                title="Component Physical Piece Counter"
                subtitle="Enter physical counts verified at gate. Traffic light flags update automatically."
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] tracking-wider border-b border-slate-300">
                      <tr>
                        <th className="py-3 px-4">Component Name</th>
                        <th className="py-3 px-4 text-center">Multiplier</th>
                        <th className="py-3 px-4 text-center">Expected (pcs)</th>
                        <th className="py-3 px-4 text-center">Actual Counted (pcs)</th>
                        <th className="py-3 px-4 text-center">Traffic Light Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {inspectionAnalysis.itemAnalyses.map(({ item, actualQty, isUncounted, diff, status }) => {
                        const rawInputValue = countsInputState[item.componentId] ?? '';

                        return (
                          <tr
                            key={item.id}
                            className={`transition ${
                              status === 'RED'
                                ? 'bg-rose-50/40 hover:bg-rose-50/70'
                                : status === 'YELLOW'
                                ? 'bg-amber-50/30 hover:bg-amber-50/60'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
                                  <img
                                    src={item.component.imageUrl || '/images/components/default.svg'}
                                    alt={item.component.componentName}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = '/images/components/default.svg';
                                    }}
                                  />
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-900 block text-xs">
                                    {item.component.componentName}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    Pattern Part
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center text-slate-600 font-semibold">
                              {item.component.piecesPerGarment}x / garment
                            </td>
                            <td className="py-3.5 px-4 text-center text-slate-900 font-black text-sm">
                              {item.expectedQty}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center justify-center">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  aria-label={`Actual count for ${item.component.componentName}`}
                                  value={rawInputValue}
                                  placeholder="0"
                                  onChange={(e) => handleCountChange(item.componentId, e.target.value)}
                                  className={`w-28 text-center py-1.5 px-2 rounded-lg font-black text-sm border-2 shadow-xs transition ${
                                    isUncounted || status === 'RED'
                                      ? 'border-rose-400 bg-white text-rose-950 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                                      : 'border-slate-300 bg-white text-slate-950 focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20'
                                  }`}
                                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                                />
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <TrafficBadge
                                status={status}
                                diff={diff}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Gatekeeper Final Action Bar */}
                <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
                  {/* Status compliance banner */}
                  <div>
                    {inspectionAnalysis.hasRedShortage ? (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs font-bold text-rose-900 flex items-center gap-2">
                        <span className="text-base text-rose-600 font-black">🔒</span>
                        <span>
                          <strong>Approval Locked:</strong> {inspectionAnalysis.redCount} component(s) have shortages (<span className="text-rose-700 underline">RED</span>) or are uncounted. All components must meet or exceed expected quantities to approve.
                        </span>
                      </div>
                    ) : !inspectionAnalysis.allCounted ? (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-900 flex items-center gap-2">
                        <span className="text-base text-amber-600 font-black">⚠️</span>
                        <span>
                          <strong>Approval Locked:</strong> Please enter physical piece counts for all {inspectionAnalysis.totalComponents} components.
                        </span>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-900 flex items-center gap-2">
                        <span className="text-base text-emerald-600 font-black">✓</span>
                        <span>
                          <strong>Verification Ready:</strong> All components meet or exceed expected quantities (0 Shortages). Ready for gatekeeper approval release.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div>
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={handleSaveProgress}
                        loading={savingCounts}
                      >
                        💾 Save Progress
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Reject Button (Always Available) */}
                      <Button
                        variant="danger"
                        size="md"
                        onClick={() => {
                          setRejectionNote('');
                          setRejectionTouched(false);
                          setIsRejectModalOpen(true);
                        }}
                      >
                        ✕ Reject Batch (Re-cut)
                      </Button>

                      {/* Approve Batch Button (Disabled when RED or uncounted) */}
                      <div className="relative group">
                        <Button
                          variant="success"
                          size="md"
                          onClick={handleApproveBatch}
                          loading={approving}
                          disabled={inspectionAnalysis.hasRedShortage || !inspectionAnalysis.allCounted}
                          aria-disabled={inspectionAnalysis.hasRedShortage || !inspectionAnalysis.allCounted}
                        >
                          ✓ Approve Batch & Release
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card title="No Order Selected">
              <div className="py-20 text-center text-xs text-slate-500 font-medium">
                Select an order from the pending queue to begin gatekeeper verification.
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Order Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Cutting Order (Requires Re-cut)"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700 font-medium leading-relaxed">
            Rejecting this order will transition its status to <strong className="text-rose-700 font-bold">REJECTED</strong> and notify the cutting supervisor to perform a re-cut. An immutable audit log entry will be permanently recorded.
          </p>

          <div>
            <label
              htmlFor="rejectionNote"
              className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1"
            >
              Rejection Reason / Defect Notes (Mandatory): <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="rejectionNote"
              rows={4}
              placeholder="Provide a specific defect note (e.g. 'Shortage of 8 pieces on Neck Binding Strip; fabric flaw on back panel')."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              onBlur={() => setRejectionTouched(true)}
              className={`w-full rounded-xl bg-white p-3 text-sm text-[#111827] border-2 shadow-xs focus:outline-none ${
                rejectionTouched && rejectionNote.trim().length < 5
                  ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
              }`}
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
              aria-invalid={rejectionTouched && rejectionNote.trim().length < 5}
              aria-describedby="rejection-error"
            />
            
            <div className="flex items-center justify-between mt-1 text-[11px]">
              {rejectionTouched && rejectionNote.trim().length < 5 ? (
                <span id="rejection-error" className="text-rose-600 font-bold">
                  ⚠ Reason is mandatory and must be at least 5 characters.
                </span>
              ) : (
                <span className="text-slate-500">
                  Minimum 5 characters required.
                </span>
              )}
              <span
                className={`font-bold ${
                  rejectionNote.trim().length >= 5 ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {rejectionNote.trim().length}/500 chars
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmReject}
              loading={rejecting}
              disabled={rejectionNote.trim().length < 5}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
