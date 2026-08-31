import React, { useState, useEffect } from 'react';
import { Mail, Phone, MessageCircle, Save, CheckCircle2, AlertCircle, Loader2, Globe, Landmark, ToggleLeft, ToggleRight, DollarSign } from 'lucide-react';
import { api } from '../../lib/api';
import { ContactSettings, PaymentMethod } from '../../types/index';
import { usePublicData } from '../../context/PublicDataContext';

export function ContactBankSettings() {
  const { refreshPublicData } = usePublicData();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Contact State
  const [contact, setContact] = useState<ContactSettings | null>(null);

  // Grey Bank Wire State
  const [greyMethod, setGreyMethod] = useState<PaymentMethod | null>(null);
  
  // Grey USD Bank Wire
  const [usdActive, setUsdActive] = useState(true);
  const [usdBeneficiary, setUsdBeneficiary] = useState('');
  const [usdBankName, setUsdBankName] = useState('');
  const [usdAccountNumber, setUsdAccountNumber] = useState('');
  const [usdAccountType, setUsdAccountType] = useState('Checking');
  const [usdRoutingNumber, setUsdRoutingNumber] = useState('');
  const [usdBankAddress, setUsdBankAddress] = useState('');

  // Grey GBP Bank Wire
  const [gbpActive, setGbpActive] = useState(true);
  const [gbpBeneficiary, setGbpBeneficiary] = useState('');
  const [gbpBankName, setGbpBankName] = useState('');
  const [gbpAccountNumber, setGbpAccountNumber] = useState('');
  const [gbpSortCode, setGbpSortCode] = useState('');
  const [gbpBankAddress, setGbpBankAddress] = useState('');

  // Grey EUR Bank Wire
  const [eurActive, setEurActive] = useState(true);
  const [eurBeneficiary, setEurBeneficiary] = useState('');
  const [eurBankName, setEurBankName] = useState('');
  const [eurIban, setEurIban] = useState('');
  const [eurSwift, setEurSwift] = useState('');
  const [eurBankAddress, setEurBankAddress] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [contactData, methods] = await Promise.all([
        api.getContactSettings().catch((err) => {
          console.warn('Failed to load contact settings:', err);
          return null;
        }),
        api.getPaymentMethods().catch((err) => {
          console.warn('Failed to load payment methods:', err);
          return [];
        }),
      ]);

      if (contactData) {
        setContact(contactData);
      } else {
        setContact({
          id: 'contact_01',
          businessEmail: 'info@apexgrowth.digital',
          supportEmail: 'support@apexgrowth.digital',
          phone: '+15550192834',
          whatsappNumber: '+15550192834',
          whatsappUrl: 'https://wa.me/15550192834',
          whatsappPrefilledMessage: 'Hello ApexGrowth, I would like to inquire about your digital growth services.',
          whatsappButtonText: 'Chat on WhatsApp',
          floatingWhatsappEnabled: true,
          heroCtaEnabled: true,
          pricingCtaEnabled: true,
        } as any);
      }

      const grey = (methods || []).find(m => m.provider === 'grey');
      if (grey) {
        setGreyMethod(grey);
        const config = grey.configMetadata || {};
        
        // USD
        const usd = config.usd || {};
        setUsdBeneficiary(usd.beneficiary || '');
        setUsdBankName(usd.bankName || '');
        setUsdAccountNumber(usd.accountNumber || '');
        setUsdAccountType(usd.accountType || 'Checking');
        setUsdRoutingNumber(usd.routingNumber || '');
        setUsdBankAddress(usd.bankAddress || '');
        setUsdActive(config.usdEnabled !== false);

        // GBP
        const gbp = config.gbp || {};
        setGbpBeneficiary(gbp.beneficiary || '');
        setGbpBankName(gbp.bankName || '');
        setGbpAccountNumber(gbp.accountNumber || '');
        setGbpSortCode(gbp.routingNumber || ''); // map sort code
        setGbpBankAddress(gbp.bankAddress || '');
        setGbpActive(config.gbpEnabled !== false);

        // EUR
        const eur = config.eur || {};
        setEurBeneficiary(eur.beneficiary || '');
        setEurBankName(eur.bankName || '');
        setEurIban(eur.accountNumber || ''); // map IBAN
        setEurSwift(eur.routingNumber || ''); // map SWIFT
        setEurBankAddress(eur.bankAddress || '');
        setEurActive(config.eurEnabled !== false);
      } else {
        const dummyGrey: PaymentMethod = {
          id: 'pay_grey',
          provider: 'grey',
          displayName: 'Grey Bank Wire Gateway',
          type: 'bank_transfer',
          paymentUrl: '',
          currency: 'USD',
          description: 'Direct local and international USD, GBP, and EUR receiving accounts.',
          instructions: 'Initiate a bank transfer or wire to the receiving account matching your currency.',
          active: true,
          displayOrder: 3,
          isDirectLink: false,
          configMetadata: {
            usd: { beneficiary: '', bankName: '', accountNumber: '', accountType: 'Checking', routingNumber: '', bankAddress: '' },
            gbp: { beneficiary: '', bankName: '', accountNumber: '', accountType: '', routingNumber: '', bankAddress: '' },
            eur: { beneficiary: '', bankName: '', accountNumber: '', accountType: '', routingNumber: '', bankAddress: '' },
            enabled: true
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setGreyMethod(dummyGrey);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact || !greyMethod) return;
    setSaving(true);

    try {
      // Save Contact info
      await api.updateContactSettings(contact);

      // Save Grey Bank Details into configMetadata
      const updatedConfig = {
        usdEnabled: usdActive,
        usd: {
          beneficiary: usdBeneficiary,
          bankName: usdBankName,
          accountNumber: usdAccountNumber,
          accountType: usdAccountType,
          routingNumber: usdRoutingNumber,
          bankAddress: usdBankAddress,
        },
        gbpEnabled: gbpActive,
        gbp: {
          beneficiary: gbpBeneficiary,
          bankName: gbpBankName,
          accountNumber: gbpAccountNumber,
          routingNumber: gbpSortCode, // Map sort code to routing field
          bankAddress: gbpBankAddress,
        },
        eurEnabled: eurActive,
        eur: {
          beneficiary: eurBeneficiary,
          bankName: eurBankName,
          accountNumber: eurIban, // Map IBAN to accountNumber field
          routingNumber: eurSwift, // Map SWIFT to routingNumber field
          bankAddress: eurBankAddress,
        },
        enabled: true,
      };

      if (greyMethod.id === 'pay_grey') {
        try {
          await api.createPaymentMethod({
            ...greyMethod,
            configMetadata: updatedConfig,
            active: usdActive || gbpActive || eurActive,
          });
        } catch (err) {
          await api.updatePaymentMethod(greyMethod.id, {
            configMetadata: updatedConfig,
            active: usdActive || gbpActive || eurActive,
          });
        }
      } else {
        await api.updatePaymentMethod(greyMethod.id, {
          configMetadata: updatedConfig,
          active: usdActive || gbpActive || eurActive,
        });
      }

      setFeedback({ type: 'success', text: 'Contact routes and bank wire settings saved successfully!' });
      await refreshPublicData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save configuration' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  if (loading || !contact) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Contact &amp; Bank Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage business support channels and global receiving accounts for client checkout wire options.
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact Support Routing */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Mail className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-display">Part 1: Contact &amp; Support channels</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Support Email *</label>
              <input
                type="email"
                required
                value={contact.supportEmail || ''}
                onChange={(e) => setContact({ ...contact, supportEmail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                placeholder="e.g. support@apexgrowth.co"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp Number *</label>
              <input
                type="text"
                required
                value={contact.whatsappUrl || ''}
                onChange={(e) => setContact({ ...contact, whatsappUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none"
                placeholder="e.g. +44700000000 or wa.me link"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp Button CTA Text *</label>
              <input
                type="text"
                required
                value={contact.whatsappButtonText || ''}
                onChange={(e) => setContact({ ...contact, whatsappButtonText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                placeholder="e.g. Discuss on WhatsApp"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pre-filled Message *</label>
              <input
                type="text"
                required
                value={contact.whatsappPrefilledMessage || ''}
                onChange={(e) => setContact({ ...contact, whatsappPrefilledMessage: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                placeholder="e.g. Hello ApexGrowth, I would like to inquire about..."
              />
            </div>
          </div>
        </div>

        {/* Global Receiving Accounts (Grey Bank Wire Details) */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-8">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Landmark className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-display">Part 2: Global Receiving Bank Details</h3>
          </div>

          {/* USD Bank Account */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/20">$</span>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">USD Wire Account details</h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">{usdActive ? 'Enabled' : 'Disabled'}</span>
                <button
                  type="button"
                  onClick={() => setUsdActive(!usdActive)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {usdActive ? (
                    <ToggleRight className="w-9 h-5 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-9 h-5 text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {usdActive && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Beneficiary Name</label>
                  <input
                    type="text"
                    value={usdBeneficiary}
                    onChange={(e) => setUsdBeneficiary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    placeholder="Beneficiary or Company Name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={usdBankName}
                    onChange={(e) => setUsdBankName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    placeholder="e.g. Silicon Valley Bank"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={usdAccountNumber}
                    onChange={(e) => setUsdAccountNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    placeholder="USD Account Number"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Routing Number / ABA</label>
                  <input
                    type="text"
                    value={usdRoutingNumber}
                    onChange={(e) => setUsdRoutingNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    placeholder="9-digit routing"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Bank Physical Address</label>
                  <input
                    type="text"
                    value={usdBankAddress}
                    onChange={(e) => setUsdBankAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    placeholder="Street, City, State, ZIP"
                  />
                </div>
              </div>
            )}
          </div>

          {/* GBP Bank Account */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-xs border border-blue-500/20">£</span>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">GBP Local Account details</h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">{gbpActive ? 'Enabled' : 'Disabled'}</span>
                <button
                  type="button"
                  onClick={() => setGbpActive(!gbpActive)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {gbpActive ? (
                    <ToggleRight className="w-9 h-5 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-9 h-5 text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {gbpActive && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Beneficiary Name</label>
                  <input
                    type="text"
                    value={gbpBeneficiary}
                    onChange={(e) => setGbpBeneficiary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    placeholder="Beneficiary or Company Name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={gbpBankName}
                    onChange={(e) => setGbpBankName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    placeholder="e.g. Barclays Bank"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={gbpAccountNumber}
                    onChange={(e) => setGbpAccountNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    placeholder="8-digit account number"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Sort Code</label>
                  <input
                    type="text"
                    value={gbpSortCode}
                    onChange={(e) => setGbpSortCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    placeholder="6-digit sort code"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Bank Address</label>
                  <input
                    type="text"
                    value={gbpBankAddress}
                    onChange={(e) => setGbpBankAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    placeholder="Bank City & Country"
                  />
                </div>
              </div>
            )}
          </div>

          {/* EUR Bank Account */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 font-bold flex items-center justify-center text-xs border border-purple-500/20">€</span>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">EUR SEPA Account details</h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">{eurActive ? 'Enabled' : 'Disabled'}</span>
                <button
                  type="button"
                  onClick={() => setEurActive(!eurActive)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {eurActive ? (
                    <ToggleRight className="w-9 h-5 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-9 h-5 text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {eurActive && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Beneficiary Name</label>
                  <input
                    type="text"
                    value={eurBeneficiary}
                    onChange={(e) => setEurBeneficiary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    placeholder="Beneficiary or Company Name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={eurBankName}
                    onChange={(e) => setEurBankName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    placeholder="e.g. BNP Paribas"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">IBAN</label>
                  <input
                    type="text"
                    value={eurIban}
                    onChange={(e) => setEurIban(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    placeholder="EUR IBAN code"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">SWIFT / BIC</label>
                  <input
                    type="text"
                    value={eurSwift}
                    onChange={(e) => setEurSwift(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    placeholder="SWIFT / BIC code"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Bank Address</label>
                  <input
                    type="text"
                    value={eurBankAddress}
                    onChange={(e) => setEurBankAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    placeholder="Bank City & Country"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving Settings...' : 'Save All Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
