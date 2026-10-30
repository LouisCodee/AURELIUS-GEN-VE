import React, { useState } from 'react';
import {
  VaultItem,
  getWatchModelById,
  getCaseFinishById,
  formatChfPrice,
  calculateVaultSummary,
  validateCommissionForm,
  CommissionFormInput,
} from '../utils/horology';
import { X, Trash2, Plus, Minus, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PrivateVaultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: VaultItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearVault: () => void;
}

const SALON_LOCATIONS = [
  'Geneva — Rue du Rhône 42 Flagship Manufacture',
  'Zurich — Bahnhofstrasse Private Salon',
  'Paris — Place Vendôme Haute Horlogerie Suite',
  'London — New Bond Street Collector Lounge',
  'New York — Madison Avenue Vault',
  'Tokyo — Ginza Six Horological Gallery',
];

export const PrivateVaultDrawer: React.FC<PrivateVaultDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearVault,
}) => {
  const [formInput, setFormInput] = useState<CommissionFormInput>({
    fullName: '',
    email: '',
    phone: '',
    salonCity: SALON_LOCATIONS[0],
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmedDossier, setConfirmedDossier] = useState<{
    referenceNumber: string;
    clientName: string;
    salon: string;
    totalFormatted: string;
    itemCount: number;
  } | null>(null);

  if (!isOpen) return null;

  const summary = calculateVaultSummary(items);

  const handleSubmitCommission = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateCommissionForm(formInput);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const refCode = `AG-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setConfirmedDossier({
      referenceNumber: refCode,
      clientName: formInput.fullName.trim(),
      salon: formInput.salonCity,
      totalFormatted: formatChfPrice(summary.totalChf),
      itemCount: summary.totalQuantity,
    });
    onClearVault();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Private Vault and Bespoke Commission Allocation"
      className="fixed inset-0 z-50 flex justify-end bg-black/75 transition-opacity"
    >
      <div className="relative w-full max-w-xl bg-[#0F1014] border-l border-[#262830] h-full flex flex-col justify-between overflow-y-auto text-[#F4F1EA] p-6 sm:p-8">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-[#22242C]">
            <div>
              <p className="text-xs text-[#A6A49E] tracking-wide">Aurelius Genève · Private Allocation</p>
              <h2 className="text-2xl font-serif-display font-semibold text-[#F4F1EA] mt-0.5">
                Private Collector Vault
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setConfirmedDossier(null);
                onClose();
              }}
              aria-label="Close Private Vault"
              className="p-2 text-[#A6A49E] hover:text-[#F4F1EA] rounded-lg border border-[#252730] hover:border-[#C89D66] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Confirmed Allocation State */}
          {confirmedDossier ? (
            <div className="py-10 space-y-6">
              <div className="p-6 rounded-xl bg-[#15171E] border border-[#C89D66]/50 space-y-4">
                <div className="flex items-center gap-3 text-[#C89D66]">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <span className="text-sm font-medium">Bespoke Commission Registered</span>
                </div>
                <h3 className="text-2xl font-serif-display font-semibold text-[#F4F1EA]">
                  Dossier #{confirmedDossier.referenceNumber} Confirmed
                </h3>
                <p className="text-sm text-[#A6A49E] leading-relaxed">
                  Thank you, <span className="text-[#F4F1EA] font-medium">{confirmedDossier.clientName}</span>. Your
                  allocation for {confirmedDossier.itemCount} bespoke timepiece(s) has been assigned to our master
                  horologist bench in Geneva.
                </p>
                <div className="pt-4 border-t border-[#252730] space-y-2 text-xs text-[#A6A49E]">
                  <div className="flex justify-between">
                    <span>Designated Salon:</span>
                    <span className="text-[#F4F1EA] font-medium">{confirmedDossier.salon}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Allocation Value:</span>
                    <span className="text-[#C89D66] font-mono-tabular font-medium">
                      {confirmedDossier.totalFormatted}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Logistics & Security:</span>
                    <span className="text-[#F4F1EA]">Complimentary Insured Armored Courier</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmedDossier(null);
                  onClose();
                }}
                className="w-full py-3 px-5 rounded-lg bg-[#C89D66] text-[#0A0A0C] font-semibold text-sm hover:bg-[#d8af79] transition-colors cursor-pointer"
              >
                Return to 3D Atelier
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <p className="text-lg font-serif-display text-[#F4F1EA]">Your Private Vault is Currently Empty</p>
              <p className="text-sm text-[#A6A49E] max-w-sm mx-auto leading-relaxed">
                Configure any timepiece in the 3D Atelier or select a reference from the Horological Collection to
                request a private allocation.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-2.5 text-xs font-medium text-[#0A0A0C] bg-[#C89D66] rounded-lg hover:bg-[#d6ac75] transition-colors cursor-pointer"
              >
                Explore 3D Timepieces
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Itemized List */}
              <div className="space-y-4">
                {items.map((item) => {
                  const model = getWatchModelById(item.modelId);
                  const finish = getCaseFinishById(item.finishId);
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[#15171E] border border-[#242630] flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs text-[#A6A49E]">
                            <span>{model.referenceCode}</span>
                            <span className="mx-1.5">·</span>
                            <span>{finish.name}</span>
                          </div>
                          <h3 className="text-lg font-serif-display font-semibold text-[#F4F1EA] mt-0.5">
                            {model.name}
                          </h3>
                          {item.engravingText && (
                            <p className="text-xs text-[#C89D66] mt-1 font-mono-tabular">
                              Caseback Engraving: “{item.engravingText}”
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          aria-label={`Remove ${model.name} from vault`}
                          className="text-[#A6A49E] hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#22242C]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            aria-label={`Decrease quantity of ${model.name}`}
                            className="w-7 h-7 rounded bg-[#1E2029] hover:bg-[#292C38] flex items-center justify-center text-[#F4F1EA] cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono-tabular text-sm px-2">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            aria-label={`Increase quantity of ${model.name}`}
                            className="w-7 h-7 rounded bg-[#1E2029] hover:bg-[#292C38] flex items-center justify-center text-[#F4F1EA] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="font-mono-tabular text-sm font-medium text-[#F4F1EA]">
                          {formatChfPrice(item.unitPriceChf * item.quantity)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Valuation Summary */}
              <div className="p-4 rounded-xl bg-[#13141A] border border-[#22242C] space-y-2 text-sm">
                <div className="flex justify-between text-[#A6A49E]">
                  <span>Insured Armored Delivery & Geneva Hallmark Dossier</span>
                  <span className="text-[#F4F1EA] font-mono-tabular">Complimentary</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-[#22242C]">
                  <span>Total Allocation Value</span>
                  <span className="font-mono-tabular text-[#C89D66]">{formatChfPrice(summary.totalChf)}</span>
                </div>
              </div>

              {/* Bespoke Allocation Registration Form */}
              <form onSubmit={handleSubmitCommission} className="space-y-4 pt-2" noValidate>
                <h3 className="text-base font-serif-display font-semibold text-[#F4F1EA]">
                  Collector Dossier & Salon Appointment
                </h3>

                <div>
                  <label htmlFor="collector-name" className="block text-xs text-[#A6A49E] mb-1">
                    Full Collector Name
                  </label>
                  <input
                    id="collector-name"
                    type="text"
                    value={formInput.fullName}
                    onChange={(e) => setFormInput({ ...formInput, fullName: e.target.value })}
                    placeholder="e.g. Henri de Montfort"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#161820] border border-[#2A2C36] text-[#F4F1EA] focus:outline-none focus:border-[#C89D66]"
                  />
                  {formErrors.fullName && <p className="text-xs text-rose-400 mt-1">{formErrors.fullName}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="collector-email" className="block text-xs text-[#A6A49E] mb-1">
                      Private Email
                    </label>
                    <input
                      id="collector-email"
                      type="email"
                      value={formInput.email}
                      onChange={(e) => setFormInput({ ...formInput, email: e.target.value })}
                      placeholder="collector@domain.ch"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#161820] border border-[#2A2C36] text-[#F4F1EA] focus:outline-none focus:border-[#C89D66]"
                    />
                    {formErrors.email && <p className="text-xs text-rose-400 mt-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="collector-phone" className="block text-xs text-[#A6A49E] mb-1">
                      Direct Telephone
                    </label>
                    <input
                      id="collector-phone"
                      type="tel"
                      value={formInput.phone}
                      onChange={(e) => setFormInput({ ...formInput, phone: e.target.value })}
                      placeholder="+41 22 819 00 00"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#161820] border border-[#2A2C36] text-[#F4F1EA] focus:outline-none focus:border-[#C89D66]"
                    />
                    {formErrors.phone && <p className="text-xs text-rose-400 mt-1">{formErrors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="collector-salon" className="block text-xs text-[#A6A49E] mb-1">
                    Designated Delivery Salon
                  </label>
                  <select
                    id="collector-salon"
                    value={formInput.salonCity}
                    onChange={(e) => setFormInput({ ...formInput, salonCity: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#161820] border border-[#2A2C36] text-[#F4F1EA] focus:outline-none focus:border-[#C89D66]"
                  >
                    {SALON_LOCATIONS.map((salon) => (
                      <option key={salon} value={salon}>
                        {salon}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-5 rounded-lg bg-[#C89D66] text-[#0A0A0C] font-semibold text-sm hover:bg-[#d8af79] transition-colors cursor-pointer"
                  >
                    Confirm Bespoke Allocation
                  </button>
                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#A6A49E] mt-2.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C89D66]" />
                    <span>Zero Deposit Charged Online · Concierge Verification Within 4 Hours</span>
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
