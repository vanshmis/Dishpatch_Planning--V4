import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck } from 'lucide-react';
import { dispatchService } from '../../services/api';
import { ProformaInvoice } from '../../types';

interface ApprovePIModalProps {
  isOpen: boolean;
  pi: ProformaInvoice | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ApprovePIModal: React.FC<ApprovePIModalProps> = ({
  isOpen,
  pi,
  onClose,
  onSuccess,
}) => {
  const [approverName, setApproverName] = useState<string>('Rajesh Sharma');
  const [department, setDepartment] = useState<string>('Sales & Logistics');
  const [approvalNotes, setApprovalNotes] = useState<string>('');

  if (!isOpen || !pi) return null;

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approverName || !department) return;

    // Update PI status or add approval remarks
    dispatchService.updatePIStatus(pi.id, 'APPROVED');

    alert(`PI ${pi.piNumber} Approved successfully!\nApproved By: ${approverName}\nDepartment: ${department}`);
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white">Approve Proforma Invoice</h3>
              <p className="text-xs text-slate-400">PI: {pi.piNumber} ({pi.clientName})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleApprove} className="p-6 space-y-4 text-sm">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Client:</span>
              <span className="font-semibold text-slate-800">{pi.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Invoice Amount:</span>
              <span className="font-bold text-emerald-700">₹{pi.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Weight:</span>
              <span className="font-semibold text-slate-800">{pi.totalWeightKg.toLocaleString()} kg</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Approver Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={approverName}
              onChange={(e) => setApproverName(e.target.value)}
              placeholder="e.g. Rajesh Sharma"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department <span className="text-rose-500">*</span>
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="Sales & Commercial">Sales & Commercial</option>
              <option value="Accounts & Finance">Accounts & Finance</option>
              <option value="Logistics & Dispatch">Logistics & Dispatch</option>
              <option value="Management / Admin">Management / Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Approval Remarks / Notes
            </label>
            <input
              type="text"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="e.g. Credit verified, clear for dispatch planning"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg bg-white hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm PI Approval</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
