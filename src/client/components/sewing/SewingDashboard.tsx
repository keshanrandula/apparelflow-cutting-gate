'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../api/client';
import { CuttingOrder } from '../../types';
import { Card, Modal } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge, TrafficBadge } from '../ui/Badges';
import { useToast } from '@/components/ui/Toast';

export const SewingDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<CuttingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'READY' | 'IN_ASSEMBLY'>('READY');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer / Inspection state
  const [inspectingOrder, setInspectingOrder] = useState<CuttingOrder | null>(null);

  // Start Sewing Modal state
  const [orderToStart, setOrderToStart] = useState<CuttingOrder | null>(null);
  const [lineNotes, setLineNotes] = useState('');
  const [starting, setStarting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.sewing.queue();
      setOrders(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load sewing queue.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const readyOrders = useMemo(
    () => orders.filter((o) => o.status === 'VERIFIED'),
    [orders]
  );
  const inAssemblyOrders = useMemo(
    () => orders.filter((o) => o.status === 'SEWING_STARTED'),
    [orders]
  );

  const displayedOrders = useMemo(() => {
    const list = activeTab === 'READY' ? readyOrders : inAssemblyOrders;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (o) =>
        o.orderNo.toLowerCase().includes(q) ||
        o.recipe?.name.toLowerCase().includes(q) ||
        o.fabricRollId.toLowerCase().includes(q) ||
        (o.verifiedBy?.name && o.verifiedBy.name.toLowerCase().includes(q))
    );
  }, [activeTab, readyOrders, inAssemblyOrders, searchQuery]);

  const handleOpenStartModal = (order: CuttingOrder) => {
    setOrderToStart(order);
    setLineNotes('');
    setActionError(null);
  };

  const handleConfirmStartSewing = async () => {
    if (!orderToStart) return;
    try {
      setStarting(true);
      setActionError(null);
      await api.sewing.start(orderToStart.id, lineNotes.trim() || undefined);
      showToast(`Batch ${orderToStart.orderNo} is now IN ASSEMBLY on the sewing floor!`, 'success');
      setOrderToStart(null);
      setLineNotes('');
      if (inspectingOrder?.id === orderToStart.id) {
        setInspectingOrder(null);
      }
      await fetchQueue();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate sewing job.';
      setActionError(msg);
      showToast(msg, 'error');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Station Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-100 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 text-white font-black text-sm shadow-sm">
              SEW
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Sewing Supervisor Floor Workspace
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Gatekeeper Verified Cutting Batches • Line Intake Management • Assembly Operations Floor
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchQueue()}
          loading={loading}
          className="self-start sm:self-auto"
        >
          ↻ Refresh Floor Queue
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-rose-50 border-2 border-rose-300 p-4 text-xs font-bold text-rose-900 flex items-center justify-between"
        >
          <span>⚠️ {error}</span>
          <Button variant="outline" size="sm" onClick={() => fetchQueue()}>
            Retry
          </Button>
        </div>
      )}

      {/* Metric Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tab 1: Ready for Sewing */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('READY')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('READY');
            }
          }}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all text-left ${
            activeTab === 'READY'
              ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/30'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
              Ready for Sewing (Verified Queue)
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-sm shadow-xs">
              {readyOrders.length}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            Batches approved by Gatekeeper, with verified physical piece counts ready for machine line assignment.
          </p>
        </div>

        {/* Tab 2: In Assembly Floor */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('IN_ASSEMBLY')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('IN_ASSEMBLY');
            }
          }}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all text-left ${
            activeTab === 'IN_ASSEMBLY'
              ? 'border-orange-500 bg-orange-50/50 shadow-sm ring-2 ring-orange-500/30'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-orange-950">
              In Assembly Floor (Active Line Jobs)
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-600 text-white font-black text-sm shadow-xs">
              {inAssemblyOrders.length}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            Active sewing jobs currently in production and running on assembly floor lines.
          </p>
        </div>
      </div>

      {/* Orders Table Container */}
      <Card
        title={
          activeTab === 'READY'
            ? `Verified Batches Ready for Sewing Floor (${displayedOrders.length})`
            : `Active Assembly Floor Jobs (${displayedOrders.length})`
        }
        subtitle={
          activeTab === 'READY'
            ? 'Inspect verified component counts, review fabric wastage, and initiate assembly lines'
            : 'Monitor active batches on the floor with assigned line notes and timestamps'
        }
        action={
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search batch #, style, or roll..."
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
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
          </div>
        }
      >
        {displayedOrders.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500 font-medium">
            {activeTab === 'READY'
              ? 'No verified batches waiting in queue. Gatekeeper verifier must approve batches before they appear here.'
              : 'No active sewing jobs currently in assembly.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] tracking-wider border-b border-slate-300">
                <tr>
                  <th className="py-3 px-4">Order Batch #</th>
                  <th className="py-3 px-4">Style & Recipe</th>
                  <th className="py-3 px-4 text-center">Target Units</th>
                  <th className="py-3 px-4 text-center">Fabric Wastage %</th>
                  <th className="py-3 px-4">Gatekeeper Verifier</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {displayedOrders.map((order) => {
                  const isWastageOverCap =
                    order.wastagePct !== null &&
                    order.wastagePct !== undefined &&
                    order.recipe?.wastageCap !== undefined &&
                    order.wastagePct > order.recipe.wastageCap;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        <button
                          onClick={() => setInspectingOrder(order)}
                          className="text-orange-700 hover:text-orange-900 font-black hover:underline"
                        >
                          {order.orderNo}
                        </button>
                        <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                          Roll ID: <strong className="text-slate-700">{order.fabricRollId}</strong>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">
                          {order.recipe?.name}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Code: {order.recipe?.recipeCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-black text-slate-900 text-sm">
                        {order.targetQty} pcs
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {order.wastagePct !== null && order.wastagePct !== undefined ? (
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`font-black text-xs ${
                                isWastageOverCap ? 'text-rose-700' : 'text-emerald-700'
                              }`}
                            >
                              {order.wastagePct > 0
                                ? `+${order.wastagePct}%`
                                : `${order.wastagePct}%`}
                            </span>
                            {isWastageOverCap && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                                ⚠ Over Cap ({order.recipe.wastageCap}%)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">0.0%</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-bold">
                          {order.verifiedBy?.name || 'Gatekeeper Verifier'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {order.verifiedAt
                            ? new Date(order.verifiedAt).toLocaleString([], {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : 'Verified'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={order.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setInspectingOrder(order)}
                          >
                            👁 Inspect Drawer
                          </Button>

                          {order.status === 'VERIFIED' && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleOpenStartModal(order)}
                            >
                              ▶ Start Assembly
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Batch Detail Slide-Over Drawer Modal */}
      <Modal
        isOpen={Boolean(inspectingOrder)}
        onClose={() => setInspectingOrder(null)}
        title={`Batch Inspection: ${inspectingOrder?.orderNo}`}
      >
        {inspectingOrder && (
          <div className="space-y-6 text-xs max-h-[75vh] overflow-y-auto pr-1">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-500 block font-medium">Garment Style:</span>
                <span className="text-sm font-black text-slate-900">
                  {inspectingOrder.recipe?.name}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {inspectingOrder.recipe?.recipeCode}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Target Units:</span>
                <span className="text-base font-black text-slate-900">
                  {inspectingOrder.targetQty} pcs
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Fabric Roll:</span>
                <span className="text-sm font-bold text-slate-900">
                  {inspectingOrder.fabricRollId}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Actual Fabric Used:</span>
                <span className="text-sm font-bold text-slate-900">
                  {inspectingOrder.actualFabricYds} yds
                </span>
              </div>
            </div>

            {/* Verification Metadata & Wastage Card */}
            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-3">
              <div className="flex items-center justify-between border-b border-orange-200 pb-2.5">
                <div>
                  <span className="font-extrabold text-orange-950 block text-xs">
                    Gatekeeper Verified By: {inspectingOrder.verifiedBy?.name || 'Gatekeeper Verifier'}
                  </span>
                  <span className="text-[11px] text-orange-800 block">
                    Verified Timestamp:{' '}
                    {inspectingOrder.verifiedAt
                      ? new Date(inspectingOrder.verifiedAt).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <StatusBadge status={inspectingOrder.status} size="sm" />
              </div>

              {/* Wastage Compliance Section */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-slate-600 block">Calculated Fabric Wastage:</span>
                  <span
                    className={`text-base font-black ${
                      inspectingOrder.wastagePct !== null &&
                      inspectingOrder.wastagePct !== undefined &&
                      inspectingOrder.wastagePct > inspectingOrder.recipe.wastageCap
                        ? 'text-rose-700'
                        : 'text-emerald-800'
                    }`}
                  >
                    {inspectingOrder.wastagePct !== null && inspectingOrder.wastagePct !== undefined
                      ? `${inspectingOrder.wastagePct > 0 ? `+${inspectingOrder.wastagePct}%` : `${inspectingOrder.wastagePct}%`}`
                      : '0.0%'}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Recipe Allowed Cap: {inspectingOrder.recipe.wastageCap}%
                  </span>
                </div>

                {inspectingOrder.wastagePct !== null &&
                inspectingOrder.wastagePct !== undefined &&
                inspectingOrder.wastagePct > inspectingOrder.recipe.wastageCap ? (
                  <div className="px-3 py-1.5 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 font-bold text-xs flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Wastage Cap Exceeded</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-1.5">
                    <span>✓</span>
                    <span>Within Wastage Tolerance</span>
                  </div>
                )}
              </div>
            </div>

            {/* Verified Component Piece Counts Table */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                Physical Component Piece Count Verification:
              </h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Component</th>
                      <th className="py-2.5 px-3 text-center">Multiplier</th>
                      <th className="py-2.5 px-3 text-center">Expected (pcs)</th>
                      <th className="py-2.5 px-3 text-center">Actual Verified (pcs)</th>
                      <th className="py-2.5 px-3 text-center">Compliance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {inspectingOrder.items?.map((item) => {
                      const diff = item.actualQty - item.expectedQty;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {item.component?.componentName}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-500">
                            {item.component?.piecesPerGarment}x / garment
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-900 font-extrabold">
                            {item.expectedQty}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-900">
                            {item.actualQty}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <TrafficBadge status={item.status} diff={diff} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setInspectingOrder(null)}
              >
                Close Drawer
              </Button>

              {inspectingOrder.status === 'VERIFIED' && (
                <Button
                  variant="success"
                  size="md"
                  onClick={() => {
                    const ord = inspectingOrder;
                    setInspectingOrder(null);
                    handleOpenStartModal(ord);
                  }}
                >
                  ▶ Accept & Start Sewing Assembly
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Start Sewing Assembly Confirmation Modal */}
      <Modal
        isOpen={Boolean(orderToStart)}
        onClose={() => setOrderToStart(null)}
        title="Accept Batch to Sewing Assembly Floor"
      >
        {orderToStart && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-700 leading-relaxed">
              You are accepting verified Batch <strong className="text-slate-900 font-extrabold">{orderToStart.orderNo}</strong> ({orderToStart.targetQty} pcs of {orderToStart.recipe.name}) onto the sewing assembly floor.
            </p>

            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-950">
              <span className="font-bold block mb-1">Floor Transition:</span>
              Status will update from <strong className="text-emerald-700 font-extrabold">VERIFIED</strong> → <strong className="text-orange-700 font-extrabold">SEWING_STARTED</strong>.
            </div>

            {actionError && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-800">
                ⚠️ {actionError}
              </div>
            )}

            <div>
              <label
                htmlFor="lineNotes"
                className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1"
              >
                Line Assignment & Floor Notes (Optional):
              </label>
              <textarea
                id="lineNotes"
                rows={3}
                placeholder="e.g. Assigned to Sewing Line #4; Operator Lead: Kamala; Needle Size 14."
                value={lineNotes}
                onChange={(e) => setLineNotes(e.target.value)}
                className="w-full rounded-xl bg-white p-3 text-sm text-[#111827] border border-slate-300 shadow-xs focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                style={{ color: '#111827', backgroundColor: '#ffffff' }}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setOrderToStart(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmStartSewing}
                loading={starting}
              >
                Confirm & Start Sewing Line
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
