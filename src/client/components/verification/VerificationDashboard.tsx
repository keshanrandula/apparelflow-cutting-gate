'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useOrders } from '../../hooks/useOrders';
import { CuttingOrder, ItemStatus } from '../../types';
import { Card, Modal } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { StatusBadge, TrafficBadge } from '../ui/Badges';

export const VerificationDashboard: React.FC = () => {
  const { orders, loading, error, saveCounts, verifyOrder, refreshOrders } = useOrders();

  // Active selected order for gatekeeper inspection
  const [selectedOrder, setSelectedOrder] = useState<CuttingOrder | null>(null);

  // Local editing state for component counts: { [componentId: string]: number }
  const [countsState, setCountsState] = useState<Record<string, number>>({});
  const [savingCounts, setSavingCounts] = useState(false);

  // Verify / Reject state
  const [approving, setApproving] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter orders in PENDING_VERIFICATION queue
  const pendingOrders = orders.filter((o) => o.status === 'PENDING_VERIFICATION');

  // Sync selected order and initialize countsState when an order is selected
  useEffect(() => {
    if (selectedOrder) {
      // Find the latest state of this order in the list
      const fresh = orders.find((o) => o.id === selectedOrder.id) || selectedOrder;
      setSelectedOrder(fresh);

      const counts: Record<string, number> = {};
      fresh.items?.forEach((item) => {
        counts[item.componentId] = item.actualQty;
      });
      setCountsState(counts);
    } else if (pendingOrders.length > 0) {
      // Default select first pending order
      const first = pendingOrders[0];
      setSelectedOrder(first);
      const counts: Record<string, number> = {};
      first.items?.forEach((item) => {
        counts[item.componentId] = item.actualQty;
      });
      setCountsState(counts);
    }
  }, [orders]);

  const handleCountChange = (componentId: string, val: string) => {
    const num = val === '' ? 0 : parseInt(val, 10);
    setCountsState((prev) => ({
      ...prev,
      [componentId]: isNaN(num) ? 0 : num,
    }));
  };

  const handleFillAllExpected = () => {
    if (!selectedOrder) return;
    const filled: Record<string, number> = {};
    selectedOrder.items.forEach((item) => {
      filled[item.componentId] = item.expectedQty;
    });
    setCountsState(filled);
  };

  const handleSaveCounts = async () => {
    if (!selectedOrder) return;
    try {
      setSavingCounts(true);
      setActionError(null);
      const payload = Object.entries(countsState).map(([componentId, actualQty]) => ({
        componentId,
        actualQty,
      }));
      await saveCounts(selectedOrder.id, payload);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to save component counts.');
    } finally {
      setSavingCounts(false);
    }
  };

  const handleApproveOrder = async () => {
    if (!selectedOrder) return;
    try {
      setApproving(true);
      setActionError(null);

      // Save latest counts first before verifying
      const payload = Object.entries(countsState).map(([componentId, actualQty]) => ({
        componentId,
        actualQty,
      }));
      await saveCounts(selectedOrder.id, payload);

      // Trigger server-side approval verification
      await verifyOrder(selectedOrder.id, 'APPROVED');
      refreshOrders();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Approval failed. Verify all items.');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;
    try {
      setRejecting(true);
      setActionError(null);
      await verifyOrder(selectedOrder.id, 'REJECTED', rejectionNote.trim() || undefined);
      setIsRejectModalOpen(false);
      setRejectionNote('');
      refreshOrders();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject order.');
    } finally {
      setRejecting(false);
    }
  };

  // Helper to compute status locally for live visual feedback
  const getComputedItemStatus = (actual: number, expected: number): ItemStatus => {
    if (actual === expected) return 'GREEN';
    if (actual > expected) return 'YELLOW';
    return 'RED';
  };

  // Check if any item is RED
  const hasShortage = selectedOrder?.items.some((item) => {
    const actual = countsState[item.componentId] ?? item.actualQty;
    return actual < item.expectedQty;
  });

  // Calculate Fabric Wastage % for live preview: ((actual - expected) / expected) * 100
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Gatekeeper Verification Terminal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Physical component piece count inspection, automated traffic light compliance, and fabric wastage gatekeeper.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refreshOrders()} loading={loading}>
          ↻ Refresh Queue
        </Button>
      </div>

      {actionError && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800">
          ⚠️ {actionError}
        </div>
      )}

      {/* Main Grid: Pending Queue Sidebar + Active Inspection Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Pending Orders Queue */}
        <div className="lg:col-span-4 space-y-4">
          <Card
            title={`Pending Queue (${pendingOrders.length})`}
            subtitle="Cut orders awaiting gatekeeper physical count"
          >
            {pendingOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No orders pending verification. All batches have been verified or rejected.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order);
                        setActionError(null);
                      }}
                      className={`cursor-pointer rounded-xl p-4 border transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900">
                          {order.orderNo}
                        </span>
                        <StatusBadge status={order.status} size="sm" />
                      </div>
                      <div className="text-xs text-slate-600 mt-2 font-medium">
                        {order.recipe?.name}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                        <span>Target: <strong className="text-slate-800">{order.targetQty} pcs</strong></span>
                        <span>Roll: <strong className="text-slate-800">{order.fabricRollId}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Active Inspection Terminal */}
        <div className="lg:col-span-8 space-y-6">
          {selectedOrder ? (
            <>
              {/* Order Metadata & Wastage KPI Banner */}
              <Card
                title={`Inspecting Order: ${selectedOrder.orderNo}`}
                subtitle={`Supervisor: ${selectedOrder.createdBy?.name || 'N/A'} | Style: ${selectedOrder.recipe.name} (${selectedOrder.recipe.recipeCode})`}
                action={
                  <Button variant="secondary" size="sm" onClick={handleFillAllExpected}>
                    ⚡ Auto Fill Expected Counts
                  </Button>
                }
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block">Target Units:</span>
                    <span className="text-base font-black text-slate-900">{selectedOrder.targetQty}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Actual Fabric Used:</span>
                    <span className="text-base font-black text-slate-900">{selectedOrder.actualFabricYds} yds</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Std Expected Fabric:</span>
                    <span className="text-base font-black text-slate-900">{expectedFabric.toFixed(2)} yds</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Wastage % (Cap: {selectedOrder.recipe.wastageCap}%):</span>
                    <span
                      className={`text-base font-black ${
                        isWastageOverCap ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {wastagePct > 0 ? `+${wastagePct}%` : `${wastagePct}%`}
                    </span>
                  </div>
                </div>

                {/* Gatekeeper Rules Reminder */}
                <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <span className="text-amber-600 font-bold">⚠️ Gatekeeper Rule:</span>
                  <span>
                    Approval is <strong className="underline">strictly rejected</strong> if any component has a shortage (<span className="text-rose-700 font-bold">RED</span>). Surplus (<span className="text-amber-700 font-bold">YELLOW</span>) and Exact (<span className="text-emerald-700 font-bold">GREEN</span>) are permissible.
                  </span>
                </div>
              </Card>

              {/* Physical Component Count Table */}
              <Card
                title="Component Physical Piece Counter"
                subtitle="Enter physical counts verified at gate. Traffic light flags update automatically."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveCounts}
                    loading={savingCounts}
                  >
                    💾 Save Current Counts
                  </Button>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Component Name</th>
                        <th className="py-3 px-4 text-center">Multiplier</th>
                        <th className="py-3 px-4 text-center">Expected (pcs)</th>
                        <th className="py-3 px-4 text-center">Actual Counted (pcs)</th>
                        <th className="py-3 px-4 text-center">Traffic Light</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedOrder.items?.map((item) => {
                        const currentActual = countsState[item.componentId] ?? item.actualQty;
                        const status = getComputedItemStatus(currentActual, item.expectedQty);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {item.component.componentName}
                            </td>
                            <td className="py-3.5 px-4 text-center text-slate-500">
                              {item.component.piecesPerGarment}x / garment
                            </td>
                            <td className="py-3.5 px-4 text-center text-slate-900 font-extrabold text-sm">
                              {item.expectedQty}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={currentActual}
                                onChange={(e) => handleCountChange(item.componentId, e.target.value)}
                                className="w-24 text-center py-1.5 px-2 rounded-lg font-bold text-slate-900 bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 text-sm shadow-xs"
                                style={{ color: '#111827', backgroundColor: '#ffffff' }}
                              />
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <TrafficBadge status={status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Gatekeeper Final Action Buttons */}
                <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    {hasShortage ? (
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                        ❌ Shortages detected: Cannot approve until re-cut or components are complete.
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        ✓ All components complete: Order is ready for verification approval.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                      variant="danger"
                      className="flex-1 sm:flex-none"
                      onClick={() => setIsRejectModalOpen(true)}
                    >
                      Reject Order (Re-cut)
                    </Button>
                    <Button
                      variant="success"
                      className="flex-1 sm:flex-none"
                      onClick={handleApproveOrder}
                      loading={approving}
                      disabled={hasShortage}
                    >
                      ✓ Approve & Release to Sewing
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card title="No Order Selected">
              <div className="py-20 text-center text-xs text-slate-400">
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
        title="Reject Cutting Order"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Rejecting this order will transition its status to <strong className="text-rose-700 font-bold">REJECTED</strong> and notify the cutting supervisor to perform a re-cut. An immutable audit log entry will be saved.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Rejection Note / Defect Reason:
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Defect on Sleeve panel; shortage of 8 pieces on Neck Binding Strip."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              className="w-full rounded-lg bg-white p-3 text-sm text-[#111827] border border-slate-300 shadow-sm focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              onClick={handleRejectOrder}
              loading={rejecting}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
