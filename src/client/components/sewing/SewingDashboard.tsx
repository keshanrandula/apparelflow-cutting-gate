'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useOrders } from '../../hooks/useOrders';
import { Card, Modal } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/Badges';

export const SewingDashboard: React.FC = () => {
  const { orders, loading, error, startSewing, refreshOrders } = useOrders();

  const [activeTab, setActiveTab] = useState<'READY' | 'IN_PRODUCTION'>('READY');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [starting, setStarting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const readyOrders = orders.filter((o) => o.status === 'VERIFIED');
  const inProductionOrders = orders.filter((o) => o.status === 'SEWING_STARTED');

  const displayedOrders = activeTab === 'READY' ? readyOrders : inProductionOrders;

  const handleStartSewing = async () => {
    if (!selectedOrderId) return;
    try {
      setStarting(true);
      setActionError(null);
      await startSewing(selectedOrderId, notes.trim() || undefined);
      setSelectedOrderId(null);
      setNotes('');
      refreshOrders();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to start sewing job.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Sewing Production Intake Floor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Accept verified cut batches from Gatekeeper inspection and initiate assembly line operations.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refreshOrders()} loading={loading}>
          ↻ Refresh Floor
        </Button>
      </div>

      {actionError && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800">
          ⚠️ {actionError}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => setActiveTab('READY')}
          className={`cursor-pointer rounded-xl p-5 border transition ${
            activeTab === 'READY'
              ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-600'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Verified & Ready for Sewing
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-sm">
              {readyOrders.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Batches approved by Gatekeeper, ready for line assignment.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('IN_PRODUCTION')}
          className={`cursor-pointer rounded-xl p-5 border transition ${
            activeTab === 'IN_PRODUCTION'
              ? 'border-purple-600 bg-purple-50/40 shadow-xs ring-1 ring-purple-600'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
              Active Sewing Jobs
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-800 font-extrabold text-sm">
              {inProductionOrders.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Batches currently running on sewing machine lines.
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <Card
        title={activeTab === 'READY' ? 'Orders Ready for Sewing Floor' : 'Orders in Sewing Production'}
        subtitle={
          activeTab === 'READY'
            ? 'Select an approved order to start assembly'
            : 'Active assembly lines and batch timestamps'
        }
      >
        {displayedOrders.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {activeTab === 'READY'
              ? 'No verified orders waiting for intake. Gatekeeper must approve batches first.'
              : 'No sewing jobs started yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order No</th>
                  <th className="py-3 px-4">Style / Recipe</th>
                  <th className="py-3 px-4 text-center">Units</th>
                  <th className="py-3 px-4 text-center">Approved Wastage %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-indigo-600">
                      <Link href={`/orders/${order.id}`} className="hover:underline">
                        {order.orderNo}
                      </Link>
                      <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                        Verified:{' '}
                        {order.verifiedAt
                          ? new Date(order.verifiedAt).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-semibold">
                      {order.recipe?.name}
                      <span className="block text-[10px] text-slate-500 font-normal">
                        Roll: {order.fabricRollId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-900 font-bold">
                      {order.targetQty}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {order.wastagePct !== null && order.wastagePct !== undefined
                        ? `${order.wastagePct > 0 ? `+${order.wastagePct}%` : `${order.wastagePct}%`}`
                        : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {order.status === 'VERIFIED' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          ▶ Start Sewing Floor
                        </Button>
                      )}
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
                      >
                        View Timeline
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Start Sewing Modal */}
      <Modal
        isOpen={Boolean(selectedOrderId)}
        onClose={() => setSelectedOrderId(null)}
        title="Start Sewing Production Job"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            You are accepting this verified batch onto the sewing floor. The order status will transition to <strong className="text-purple-700 font-bold">SEWING_STARTED</strong>.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Line Assignment / Production Notes (Optional):
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Assigned to Sewing Line #4; Operator Team Alpha."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg bg-white p-3 text-sm text-[#111827] border border-slate-300 shadow-sm focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              style={{ color: '#111827', backgroundColor: '#ffffff' }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setSelectedOrderId(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleStartSewing} loading={starting}>
              Confirm & Start Sewing
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
