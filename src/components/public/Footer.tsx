import React from 'react';
import {
  Zap,
  MessageCircle,
  Mail,
  Phone,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Send,
  Lock,
} from 'lucide-react';
import { usePublicData } from '../../context/PublicDataContext';

interface FooterProps {
  onOpenAdmin?: () => void;
  onNavigate?: (path: string) => void;
}

export function Footer({ onOpenAdmin, onNavigate }: FooterProps) {
  const { business, contact } = usePublicData();

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const activeSocials = [
    {
      name: 'WhatsApp',
      url: contact.whatsappUrl ? `${contact.whatsappUrl}?text=${encodeURIComponent(contact.whatsappPrefilledMessage || '')}` : '',
      icon: MessageCircle,
      active: !!contact.whatsappUrl,
    },
    {
      name: 'Discord',
      url: contact.discordInviteUrl || '',
      username: contact.discordUsername,
      icon: MessageCircle,
      active: !!contact.discordInviteUrl,
    },
    {
      name: 'Telegram',
      url: contact.telegramUrl || '',
      icon: Send,
      active: !!contact.telegramUrl,
    },
    {
      name: 'Instagram',
      url: contact.instagramUrl || '',
      icon: ArrowUpRight,
      active: !!contact.instagramUrl,
    },
    {
      name: 'TikTok',
      url: contact.tiktokUrl || '',
      icon: ArrowUpRight,
      active: !!contact.tiktokUrl,
    },
    {
      name: 'X (Twitter)',
      url: contact.twitterUrl || '',
      icon: ArrowUpRight,
      active: !!contact.twitterUrl,
    },
    {
      name: 'LinkedIn',
      url: contact.linkedinUrl || '',
      icon: ArrowUpRight,
      active: !!contact.linkedinUrl,
    },
  ].filter((s) => s.active && s.url);

  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-16 pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-900">
          {/* Col 1 & 2: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <span className="text-xl font-bold font-display text-white">
                {business.businessName || 'ApexGrowth Digital'}
              </span>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              {business.tagline || 'High-Converting Funnels & Video Ad Scripts'}. Engineered for high-velocity customer acquisition and seamless checkout conversion.
            </p>

            <div className="pt-2 text-xs text-slate-400 space-y-1.5">
              {business.businessHours && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{business.businessHours}</span>
                </div>
              )}
              {contact.businessEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{contact.businessEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Col 3: Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="/services"
                  onClick={(e) => handleLinkClick(e, '/services')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  Services Catalog
                </a>
              </li>
              <li>
                <a
                  href="/pricing"
                  onClick={(e) => handleLinkClick(e, '/pricing')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  Pricing Packages
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleLinkClick(e, '/contact')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  Contact &amp; Audit
                </a>
              </li>
              <li>
                <a
                  href="/#demos"
                  onClick={(e) => handleLinkClick(e, '/#demos')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  Interactive Demos
                </a>
              </li>
              <li>
                <a
                  href="/#faq"
                  onClick={(e) => handleLinkClick(e, '/#faq')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  Knowledge Base / FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Active Channels */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              Direct Channels
            </h4>
            {activeSocials.length > 0 ? (
              <ul className="space-y-2.5 text-sm">
                {activeSocials.map((social, idx) => (
                  <li key={idx}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
                    >
                      <social.icon className="w-3.5 h-3.5" />
                      <span>{social.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">Channels managed via Admin</p>
            )}
          </div>

          {/* Col 5: Security & Admin Access */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              System &amp; Security
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Protected administration interface with session verification, RBAC, and secure OAuth and database audit trails.
            </p>
          </div>
        </div>

        {/* Bottom Legal & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {business.businessName || 'ApexGrowth Digital'}. All rights reserved.</p>
          <p className="text-center sm:text-right max-w-lg text-[11px] text-slate-400">
            Performance figures and conversion results depend on product market fit, audience quality, and budget. No guarantees are made.
          </p>
        </div>
      </div>
    </footer>
  );
}
