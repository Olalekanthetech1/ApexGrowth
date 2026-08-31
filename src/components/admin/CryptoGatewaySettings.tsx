import React, { useState, useEffect } from 'react';
import { Sparkles, Save, CheckCircle2, AlertCircle, Loader2, ToggleLeft, ToggleRight, Key, Coins, HelpCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { PaymentMethod } from '../../types/index';
import { usePublicData } from '../../context/PublicDataContext';

export function CryptoGatewaySettings() {
  const { refreshPublicData } = usePublicData();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bybit API Credentials State
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [testMode, setTestMode] = useState(true);
  const [active, setActive] = useState(true);

  // Wallet Addresses State (For fallbacks and direct deposits)
  const [usdtAddress, setUsdtAddress] = useState('');
  const [usdtNetwork, setUsdtNetwork] = useState('TRC20');
  const [usdcAddress, setUsdcAddress] = useState('');
  const [usdcNetwork, setUsdcNetwork] = useState('Arbitrum');
  const [btcAddress, setBtcAddress] = useState('');
  const [ethAddress, setEthAddress] = useState('');

  useEffect(() => {
    loadCryptoSettings();
  }, []);

  const loadCryptoSettings = async () => {
    try {
      setLoading(true);
      const methods = await api.getPaymentMethods();
      const crypto = methods.find(m => m.provider === 'bybit');
      if (crypto) {
        setMethod(crypto);
        const metadata = crypto.configMetadata || {};
        setApiKey(metadata.apiKey || '');
        setApiSecret(metadata.apiSecret || '');
        setTestMode(metadata.testMode !== false);
        setActive(crypto.active);

        // Map addresses
        const addrs = metadata.addresses || {};
        setUsdtAddress(addrs.usdt?.address || '');
        setUsdtNetwork(addrs.usdt?.network || 'TRC20');
        setUsdcAddress(addrs.usdc?.address || '');
        setUsdcNetwork(addrs.usdc?.network || 'Arbitrum');
        setBtcAddress(addrs.btc?.address || '');
        setEthAddress(addrs.eth?.address || '');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load Crypto Gateway settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method) return;
    setSaving(true);

    try {
      const updatedMetadata = {
        apiKey,
        apiSecret,
        testMode,
        addresses: {
          usdt: { address: usdtAddress, network: usdtNetwork },
          usdc: { address: usdcAddress, network: usdcNetwork },
          btc: { address: btcAddress, network: 'Bitcoin' },
          eth: { address: ethAddress, network: 'ERC20' },
        }
      };

      await api.updatePaymentMethod(method.id, {
        active,
        configMetadata: updatedMetadata,
      });

      setFeedback({ type: 'success', text: 'Bybit Crypto Gateway configuration saved successfully' });
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save configuration' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-display text-white">Bybit Crypto Gateway Settings</h1>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase font-mono">
            BYBIT
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Automate deposits and check blockchain states for Bitcoin, USDT, and popular networks with the Bybit Web3 protocol.
        </p>
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Part 1: Credentials */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Bybit Web3 API Integration</h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium">Gateway Active:</span>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {active ? (
                    <ToggleRight className="w-10 h-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-10 h-6 text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bybit API Key</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none"
                  placeholder="e.g. b_apiKey_91823ab..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bybit Private API Secret</label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none"
                  placeholder="••••••••••••••••••••••••••••"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Environment Mode</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Toggle between Bybit Testnet Sandbox and Live Spot Account.</p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                  testMode 
                    ? 'bg-amber-950/50 text-amber-400 border border-amber-500/20' 
                    : 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {testMode ? 'TESTNET' : 'MAINNET'}
                </span>
                <button
                  type="button"
                  onClick={() => setTestMode(!testMode)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {testMode ? (
                    <ToggleRight className="w-10 h-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-10 h-6 text-slate-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Part 2: Hot Wallet Address Destinations */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
              <Coins className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Merchant Wallet Destinations (Receiving Addresses)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* USDT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">USDT Receiving Address</label>
                  <select
                    value={usdtNetwork}
                    onChange={(e) => setUsdtNetwork(e.target.value)}
                    className="bg-slate-950 text-[10px] text-emerald-400 border border-slate-800 rounded-lg px-2 py-1 font-bold outline-none"
                  >
                    <option value="TRC20">TRC20 (Tron)</option>
                    <option value="ERC20">ERC20 (Ethereum)</option>
                    <option value="BSC">BEP20 (Binance)</option>
                    <option value="Arbitrum">Arbitrum</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={usdtAddress}
                  onChange={(e) => setUsdtAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white font-mono outline-none"
                  placeholder="e.g. Ty82Xb8aW91Kls9P2as08..."
                />
              </div>

              {/* USDC */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">USDC Receiving Address</label>
                  <select
                    value={usdcNetwork}
                    onChange={(e) => setUsdcNetwork(e.target.value)}
                    className="bg-slate-950 text-[10px] text-emerald-400 border border-slate-800 rounded-lg px-2 py-1 font-bold outline-none"
                  >
                    <option value="Arbitrum">Arbitrum One</option>
                    <option value="ERC20">ERC20 (Ethereum)</option>
                    <option value="Polygon">Polygon POS</option>
                    <option value="Solana">Solana</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={usdcAddress}
                  onChange={(e) => setUsdcAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white font-mono outline-none"
                  placeholder="e.g. 0x91823abce101f3..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* BTC */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white">BTC Address (Legacy or SegWit)</label>
                <input
                  type="text"
                  value={btcAddress}
                  onChange={(e) => setBtcAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white font-mono outline-none"
                  placeholder="e.g. bc1q98abch2910l..."
                />
              </div>

              {/* ETH */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white">ETH Address (Ethereum L1)</label>
                <input
                  type="text"
                  value={ethAddress}
                  onChange={(e) => setEthAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white font-mono outline-none"
                  placeholder="e.g. 0x91823abce101f3..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Bybit Configuration'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
