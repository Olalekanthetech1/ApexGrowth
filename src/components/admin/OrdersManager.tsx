import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  CreditCard,
  Building2,
  Coins,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Loader2,
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone,
  FileText,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Order, PaymentIntent, OrderStatus } from '../../types/index';

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders(statusFilter === 'all' ? undefined : statusFilter);
      setOrders(data);
      if (selectedOrder) {
        const updated = data.find((o) => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load customer orders' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (intentId: string) => {
    if (!window.confirm('Confirm this transaction as PAID? This will update the order status and record an audit verification.')) {
      return;
    }
    try {
      setActionLoading(true);
      await api.confirmPaymentIntent(intentId, adminNotes || 'Admin confirmed via manual verification');
      setFeedback({ type: 'success', text: 'Payment successfully verified & confirmed as PAID!' });
      setAdminNotes('');
      await loadOrders();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to confirm payment' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setActionLoading(true);
      await api.updateOrderStatus(orderId, newStatus, adminNotes || `Status updated to ${newStatus}`);
      setFeedback({ type: 'success', text: `Order status changed to ${newStatus.toUpperCase()}` });
      setAdminNotes('');
      await loadOrders();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update order status' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.packageName.toLowerCase().includes(q) ||
      (o.paymentIntents && o.paymentIntents.some((pi) => pi.reference.toLowerCase().includes(q)))
    );
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PAID</span>
          </span>
        );
      case 'awaiting_payment':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>AWAITING PAYMENT</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <XCircle className="w-3.5 h-3.5" />
            <span>CANCELLED</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-300 border border-red-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>FAILED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'paystack':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'bybit':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'grey':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      default:
        return <DollarSign className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Orders &amp; Checkout Intents</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review USD customer transactions, verify incoming bank wires &amp; crypto transfers, and manage fulfillment.
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors self-start cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/80 border border-red-500/40 text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, customer, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['all', 'awaiting_payment', 'paid', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              {st === 'all' ? 'All Orders' : st.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid & Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className={`space-y-3 ${selectedOrder ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              <span>Loading orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 border border-slate-800">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-sm text-slate-400 font-medium">No orders found</p>
              <p className="text-xs text-slate-500 mt-1">
                Checkout requests placed from the USD pricing cards will appear here.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = selectedOrder?.id === order.id;
              const primaryIntent = order.paymentIntents?.[0];

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`glass-panel rounded-2xl p-5 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500/60 bg-slate-900 shadow-lg'
                      : 'border-slate-800/80 hover:border-slate-700 bg-slate-900/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {order.orderNumber}
                      </span>
                      <h3 className="font-bold text-white text-sm">{order.packageName}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold font-mono text-white">
                        ${order.amountUsd} <span className="text-[10px] text-slate-400 font-normal">USD</span>
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-300 font-medium truncate">{order.customerName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{order.customerEmail}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {getProviderIcon(order.paymentProvider)}
                      <span className="capitalize text-slate-300">
                        {order.paymentProvider === 'paystack'
                          ? 'Paystack USD Card'
                          : order.paymentProvider === 'bybit'
                          ? 'Bybit USDT'
                          : order.paymentProvider === 'grey'
                          ? 'Grey USD Wire'
                          : order.paymentProvider}
                      </span>
                    </div>
                  </div>

                  {primaryIntent && (
                    <div className="mt-3 pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Ref: {primaryIntent.reference}</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected Order Detail Panel */}
        {selectedOrder && (
          <div className="glass-panel rounded-2xl p-6 border border-emerald-500/40 bg-slate-900/95 space-y-6 sticky top-6 self-start">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Order Details
                </span>
                <h3 className="text-base font-bold text-white font-mono">{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer info */}
            <div className="space-y-2.5 text-xs">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer</h4>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span className="text-white font-semibold">{selectedOrder.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email:</span>
                  <a
                    href={`mailto:${selectedOrder.customerEmail}`}
                    className="text-emerald-400 hover:underline"
                  >
                    {selectedOrder.customerEmail}
                  </a>
                </div>
                {selectedOrder.customerWhatsapp && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">WhatsApp:</span>
                    <a
                      href={`https://wa.me/${selectedOrder.customerWhatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline"
                    >
                      {selectedOrder.customerWhatsapp}
                    </a>
                  </div>
                )}
                {selectedOrder.customerNotes && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 block mb-1">Notes:</span>
                    <p className="text-slate-300 italic">{selectedOrder.customerNotes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Package & Payment Intent info */}
            <div className="space-y-2.5 text-xs">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Intent</h4>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Package:</span>
                  <span className="text-white font-bold">{selectedOrder.packageName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="text-emerald-400 font-mono font-bold">${selectedOrder.amountUsd} USD</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status:</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                {selectedOrder.paymentIntents?.map((intent) => (
                  <div key={intent.id} className="pt-2 border-t border-slate-800 space-y-1 font-mono text-[11px]">
                    <div className="text-slate-400">Reference: <span className="text-white">{intent.reference}</span></div>
                    <div className="text-slate-400">Channel: <span className="text-slate-200 capitalize">{intent.provider} ({intent.paymentType})</span></div>
                    {intent.cryptoAddress && (
                      <div className="text-slate-400 break-all">
                        Deposit Address: <span className="text-emerald-400">{intent.cryptoAddress}</span>
                      </div>
                    )}
                    {intent.paymentUrl && (
                      <a
                        href={intent.paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:underline pt-1"
                      >
                        <span>Open Hosted Checkout Session</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {intent.confirmedBy && (
                      <div className="text-emerald-400 font-sans pt-1">
                        ✓ Confirmed by {intent.confirmedBy} on {new Date(intent.confirmedAt || '').toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Verification & Status Actions */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Verification &amp; Management
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Verification Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wire matched on Grey statement ref #..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              {selectedOrder.status !== 'paid' && selectedOrder.paymentIntents?.[0] && (
                <button
                  onClick={() => handleConfirmPayment(selectedOrder.paymentIntents![0].id)}
                  disabled={actionLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>Verify Payment &amp; Mark as PAID</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                {selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                    disabled={actionLoading}
                    className="py-2 rounded-xl bg-slate-950 hover:bg-red-950/40 border border-slate-800 text-slate-400 hover:text-red-400 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
                {selectedOrder.status !== 'awaiting_payment' && selectedOrder.status !== 'paid' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'awaiting_payment')}
                    disabled={actionLoading}
                    className="py-2 rounded-xl bg-slate-950 hover:bg-amber-950/40 border border-slate-800 text-slate-400 hover:text-amber-400 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Set Awaiting
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
