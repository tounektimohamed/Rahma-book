import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Truck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  checkoutSchema,
  TUNISIAN_GOVERNORATES,
  type CheckoutFormValues,
} from '../../utils/validation';

interface CheckoutFormProps {
  onSubmitOrder: (values: CheckoutFormValues) => Promise<void>;
  submitting: boolean;
  submitError: string | null;
}

export function CheckoutForm({
  onSubmitOrder,
  submitting,
  submitError,
}: CheckoutFormProps) {
  const { lang, t } = useLanguage();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      governorate: '',
      delegation: '',
      address: '',
      notes: '',
      confirmedAccurate: false,
    },
  });

  const selectedGovName = watch('governorate');
  const selectedGov = TUNISIAN_GOVERNORATES.find((g) => g.nameAr === selectedGovName);

  const getGovDisplay = (g: (typeof TUNISIAN_GOVERNORATES)[number]) =>
    lang === 'fr' ? g.nameFr : lang === 'en' ? g.nameEn : g.nameAr;

  const mapError = (code?: string) => {
    switch (code) {
      case 'fullNameRequired':
        return t.validationFullNameRequired;
      case 'phoneInvalid':
        return t.validationPhoneInvalid;
      case 'governorateRequired':
        return t.validationGovernorateRequired;
      case 'delegationRequired':
        return t.validationDelegationRequired;
      case 'addressRequired':
        return t.validationAddressRequired;
      case 'confirmRequired':
        return t.validationConfirmRequired;
      default:
        return code;
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitOrder)}
      noValidate
      className="bg-white rounded-2xl border border-[#EADFD7] p-6 space-y-5"
    >
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-[#443B3B]">{t.checkoutTitle}</h2>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#443B3B] bg-[#F8E8DC] px-3 py-1.5 rounded-xl">
          <Truck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t.codBadge}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="checkout-fullName" className="block text-sm font-semibold text-[#443B3B]">
            {t.fullNameLabel}
          </label>
          <input
            id="checkout-fullName"
            type="text"
            {...register('fullName')}
            className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B] focus:outline-2 focus:outline-[#443B3B]"
          />
          {errors.fullName && (
            <p className="text-xs text-[#993636]">{mapError(errors.fullName.message)}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="checkout-phone" className="block text-sm font-semibold text-[#443B3B]">
            {t.phoneLabel}
          </label>
          <input
            id="checkout-phone"
            type="tel"
            inputMode="numeric"
            dir="ltr"
            placeholder="22123456"
            {...register('phone')}
            className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B] tabular-nums focus:outline-2 focus:outline-[#443B3B]"
          />
          {errors.phone && (
            <p className="text-xs text-[#993636]">{mapError(errors.phone.message)}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="checkout-governorate" className="block text-sm font-semibold text-[#443B3B]">
            {t.governorateLabel}
          </label>
          <select
            id="checkout-governorate"
            {...register('governorate', {
              onChange: () => setValue('delegation', ''),
            })}
            className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B] focus:outline-2 focus:outline-[#443B3B]"
          >
            <option value="">{t.selectGovernorate}</option>
            {TUNISIAN_GOVERNORATES.map((gov) => (
              <option key={gov.nameAr} value={gov.nameAr}>
                {getGovDisplay(gov)}
              </option>
            ))}
          </select>
          {errors.governorate && (
            <p className="text-xs text-[#993636]">{mapError(errors.governorate.message)}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="checkout-delegation" className="block text-sm font-semibold text-[#443B3B]">
            {t.delegationLabel}
          </label>
          <select
            id="checkout-delegation"
            {...register('delegation')}
            disabled={!selectedGov}
            className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B] disabled:opacity-60 focus:outline-2 focus:outline-[#443B3B]"
          >
            <option value="">{t.selectDelegation}</option>
            {(selectedGov?.delegations ?? []).map((del) => (
              <option key={del} value={del}>
                {del}
              </option>
            ))}
          </select>
          {errors.delegation && (
            <p className="text-xs text-[#993636]">{mapError(errors.delegation.message)}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="checkout-address" className="block text-sm font-semibold text-[#443B3B]">
          {t.addressLabel}
        </label>
        <input
          id="checkout-address"
          type="text"
          {...register('address')}
          className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B] focus:outline-2 focus:outline-[#443B3B]"
        />
        {errors.address && (
          <p className="text-xs text-[#993636]">{mapError(errors.address.message)}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="checkout-notes" className="block text-sm font-semibold text-[#443B3B]">
          {t.notesLabel}
        </label>
        <textarea
          id="checkout-notes"
          rows={2}
          {...register('notes')}
          className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B] focus:outline-2 focus:outline-[#443B3B]"
        />
      </div>

      <div className="pt-2 border-t border-[#EADFD7]">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('confirmedAccurate')}
            className="mt-1 w-4 h-4 accent-[#443B3B] rounded cursor-pointer"
          />
          <span className="text-sm text-[#443B3B] leading-relaxed">{t.accuracyCheckbox}</span>
        </label>
        {errors.confirmedAccurate && (
          <p className="mt-1.5 text-xs text-[#993636]">
            {mapError(errors.confirmedAccurate.message)}
          </p>
        )}
      </div>

      {submitError && (
        <div
          role="alert"
          className="rounded-xl border border-[#E7C2C2] bg-[#FCE8E8] px-4 py-3 text-sm text-[#8E2F2F]"
        >
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        data-testid="place-order-button"
        className="w-full py-3.5 px-6 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-sm font-bold hover:bg-[#332B2B] disabled:opacity-60 transition-colors cursor-pointer"
      >
        {submitting ? t.submittingOrder : t.placeOrderBtn}
      </button>
    </form>
  );
}
