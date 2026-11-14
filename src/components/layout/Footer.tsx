import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useStorefrontSettings } from '../../hooks/useStorefrontSettings';
import { resolveStorefrontCopy } from '../../types/storefront';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function Footer() {
  const { t, lang } = useLanguage();
  const { settings } = useStorefrontSettings();
  const [legalDialog, setLegalDialog] = useState<'terms' | 'privacy' | null>(null);

  const storefront = resolveStorefrontCopy(settings, lang, t);

  return (
    <footer className="bg-[#F8E8DC]/70 border-t border-[#EADFD7] mt-16 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="space-y-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 text-[#443B3B] font-bold text-lg font-['Poppins',sans-serif]"
            >
              <span>My Little Story</span>
            </Link>
            <p className="text-xs font-medium text-[#706464]">{t.brandTagline}</p>
            <p className="text-sm text-[#706464] leading-relaxed max-w-sm">
              {t.footerDesc}
            </p>
          </div>

          {/* Contact Information (from StorefrontSettings / verified admin email) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#443B3B]">{t.footerContactTitle}</h3>
            <ul className="space-y-2.5 text-sm text-[#706464]">
              {storefront.contactLocation && (
                <li className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#443B3B]/70 shrink-0" aria-hidden="true" />
                  <span>{storefront.contactLocation}</span>
                </li>
              )}
              {storefront.contactPhone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#443B3B]/70 shrink-0" aria-hidden="true" />
                  <a
                    href={`tel:${storefront.contactPhone.replace(/\s+/g, '')}`}
                    dir="ltr"
                    className="hover:text-[#443B3B] transition-colors tabular-nums"
                  >
                    {storefront.contactPhone}
                  </a>
                </li>
              )}
              {storefront.contactEmail && (
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#443B3B]/70 shrink-0" aria-hidden="true" />
                  <a
                    href={`mailto:${storefront.contactEmail}`}
                    dir="ltr"
                    className="hover:text-[#443B3B] transition-colors"
                  >
                    {storefront.contactEmail}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Social & Legal */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#443B3B]">{t.footerLegalTitle}</h3>
            <div className="flex flex-col items-start gap-2 text-sm text-[#706464]">
              <button
                type="button"
                onClick={() => setLegalDialog('terms')}
                className="hover:text-[#443B3B] underline underline-offset-4 cursor-pointer"
              >
                {t.footerTerms}
              </button>
              <button
                type="button"
                onClick={() => setLegalDialog('privacy')}
                className="hover:text-[#443B3B] underline underline-offset-4 cursor-pointer"
              >
                {t.footerPrivacy}
              </button>
              <Link
                to="/admin"
                data-testid="footer-admin-link"
                className="hover:text-[#443B3B] underline underline-offset-4"
              >
                {t.footerAdminLink}
              </Link>
              {(storefront.instagramUrl || storefront.facebookUrl) && (
                <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-[#443B3B]/80">
                  {storefront.instagramUrl && (
                    <a
                      href={storefront.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#443B3B] transition-colors"
                    >
                      Instagram
                    </a>
                  )}
                  {storefront.instagramUrl && storefront.facebookUrl && (
                    <span aria-hidden="true">·</span>
                  )}
                  {storefront.facebookUrl && (
                    <a
                      href={storefront.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#443B3B] transition-colors"
                    >
                      Facebook
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#EADFD7] text-xs text-[#706464] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>{t.footerCopy}</p>
          <p className="font-['Poppins',sans-serif]">{t.brandTagline}</p>
        </div>
      </div>

      <ConfirmDialog
        open={legalDialog !== null}
        title={legalDialog === 'terms' ? t.footerTerms : t.footerPrivacy}
        onClose={() => setLegalDialog(null)}
        cancelLabel={t.cancelBtn}
      >
        {legalDialog === 'terms' ? (
          <p>
            {lang === 'ar'
              ? 'تُطبع جميع القصص حسب الطلب وفقاً للاسم والصورة والإهداء الذي يقدمه ولي الأمر. الدفع يتم نقداً عند الاستلام في جميع ولايات الجمهورية التونسية.'
              : lang === 'fr'
              ? 'Chaque livre est imprimé à la demande selon le prénom, la photo et la dédicace fournis par le parent. Le règlement s’effectue en espèces à la livraison partout en Tunisie.'
              : 'Each book is printed to order using the child name, photo, and dedication provided by the parent. Payment is Cash on Delivery across Tunisia.'}
          </p>
        ) : (
          <p>
            {lang === 'ar'
              ? 'نحترم خصوصية أطفالكم: تُضغط صورة الطفل محلياً وتُحفظ بأمان ضمن سجل الطلب المغلق ولا تُعرض للعامة أو تُرسل لأي طرف خارجي.'
              : lang === 'fr'
              ? 'Protection des données : la photo de votre enfant est compressée localement, stockée de manière sécurisée avec votre commande et n’est jamais rendue publique ni partagée.'
              : 'Child privacy guarantee: uploaded photos are compressed locally, stored securely with your private order record, and never exposed publicly or shared with third parties.'}
          </p>
        )}
      </ConfirmDialog>
    </footer>
  );
}
