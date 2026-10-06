'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../../api/client';
import { CuttingOrder } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge, TrafficBadge } from '../ui/Badges';
import { useToast } from '@/components/ui/Toast';

export const OrderDetailView: React.FC<{ orderId: string }> = ({ orderId }) => {
  const { showToast } = useToast();
  const [order, setOrder] = useState<CuttingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetail = useCallback(async (isManualRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.orders.get(orderId);
      setOrder(data);
      if (isManualRefresh) {
        showToast(`Order details for ${data.orderNo} refreshed`, 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load order details';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [orderId, showToast]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">
        Loading order details and audit timeline...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
          ⚠️ {error || 'Order not found'}
        </div>
        <Link href="/" className="text-xs font-bold text-orange-600 hover:underline">
          ← Return to Dashboard
        </Link>
      </div>
    );
  }

  const expectedFabric = order.recipe.stdFabricYards * order.targetQty;

  return (
    <div className="space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Order: {order.orderNo}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Created on {new Date(order.createdAt).toLocaleString()} by{' '}
            <strong className="text-slate-800">{order.createdBy.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => fetchOrderDetail(true)}>
            ↻ Refresh
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">Garment Style:</span>
          <span className="text-sm font-bold text-slate-900 block mt-1">
            {order.recipe.name}
          </span>
          <span className="text-[10px] text-slate-400">Code: {order.recipe.recipeCode}</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">Target Quantity:</span>
          <span className="text-lg font-black text-slate-900 block mt-1">
            {order.targetQty} <span className="text-xs font-normal text-slate-500">units</span>
          </span>
          <span className="text-[10px] text-slate-400">Roll: {order.fabricRollId}</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">Fabric Usage:</span>
          <span className="text-lg font-black text-slate-900 block mt-1">
            {order.actualFabricYds}{' '}
            <span className="text-xs font-normal text-slate-500">yds</span>
          </span>
          <span className="text-[10px] text-slate-400">
            Std Req: {expectedFabric.toFixed(2)} yds
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-500 block">Wastage Tolerance:</span>
          <span
            className={`text-lg font-black block mt-1 ${
              order.wastagePct !== null &&
              order.wastagePct !== undefined &&
              order.wastagePct > order.recipe.wastageCap
                ? 'text-rose-600'
                : 'text-emerald-700'
            }`}
          >
            {order.wastagePct !== null && order.wastagePct !== undefined
              ? `${order.wastagePct > 0 ? `+${order.wastagePct}%` : `${order.wastagePct}%`}`
              : 'Pending Gate'}
          </span>
          <span className="text-[10px] text-slate-400">Cap: {order.recipe.wastageCap}%</span>
        </div>
      </div>

      {/* Component Breakdown Table */}
      <Card
        title="Physical Components Breakdown & Traffic Lights"
        subtitle="Verification pieces inspected by gatekeeper"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Component Name</th>
                <th className="py-3 px-4 text-center">Multiplier</th>
                <th className="py-3 px-4 text-center">Expected Qty</th>
                <th className="py-3 px-4 text-center">Actual Counted</th>
                <th className="py-3 px-4 text-center">Status Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {order.items?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={item.component.imageUrl || '/images/components/default.svg'}
                          alt={item.component.componentName}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/images/components/default.svg';
                          }}
                        />
                      </div>
                      <span className="font-bold text-slate-900">
                        {item.component.componentName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500">
                    {item.component.piecesPerGarment}x
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900 font-extrabold">
                    {item.expectedQty} pcs
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900 font-bold">
                    {item.actualQty} pcs
                  </td>
                  <td className="py-3 px-4 text-center">
                    <TrafficBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Immutable Verification Logs Audit Trail */}
      <Card
        title="Immutable Verification & Gatekeeper Audit Trail"
        subtitle="Append-only compliance log stamped by server clock"
      >
        {(!order.verificationLogs || order.verificationLogs.length === 0) ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No verification decisions recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {order.verificationLogs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-xl border text-xs ${
                  log.decision === 'APPROVED'
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-black px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wider ${
                        log.decision === 'APPROVED'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {log.decision}
                    </span>
                    <span className="font-bold text-slate-900">
                      Verifier: {log.verifier?.name || 'Gatekeeper Verifier'}
                    </span>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                {log.decision === 'APPROVED' && (
                  <div className="mt-2 text-slate-700">
                    Approved with recorded fabric wastage: <strong>{log.wastagePct}%</strong>.
                    Released to sewing floor.
                  </div>
                )}

                {log.decision === 'REJECTED' && (
                  <div className="mt-2 text-rose-900 bg-white/80 p-3 rounded-lg border border-rose-200">
                    <span className="font-bold block text-rose-800 mb-0.5">Rejection Reason:</span>
                    {log.rejectionNote || 'No specific note provided.'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
