import React from 'react';
import { MessageCircle } from 'lucide-react';
import { usePublicData } from '../../context/PublicDataContext';

export function FloatingWhatsApp() {
  const { contact } = usePublicData();

  if (!contact.floatingWhatsappEnabled || !contact.whatsappUrl) {
    return null;
  }

  const url = `${contact.whatsappUrl}?text=${encodeURIComponent(
    contact.whatsappPrefilledMessage || "Hi, I'd like to discuss a project with ApexGrowth Digital."
  )}`;

  return (
    <aside aria-label="WhatsApp Chat Support">
      <a
        id="floating-whatsapp-widget"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={contact.whatsappButtonText || 'Chat on WhatsApp'}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs sm:text-sm rounded-full shadow-2xl shadow-[#25D366]/30 hover:shadow-[#25D366]/50 transition-all duration-300 transform hover:-translate-y-1 group"
      >
        <MessageCircle className="w-5 h-5 fill-slate-950 text-slate-950 shrink-0" />
        <span className="hidden sm:inline font-semibold">{contact.whatsappButtonText || 'Chat on WhatsApp'}</span>
      </a>
    </aside>
  );
}
