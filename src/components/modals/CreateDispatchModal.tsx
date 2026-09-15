import React, { useState, useEffect } from 'react';
import { X, Truck, Calendar, Clock, MapPin, CheckSquare, Square, AlertTriangle, ShieldCheck, Save } from 'lucide-react';
import { dispatchService } from '../../services/api';
import { Vehicle, Driver, ProformaInvoice, Warehouse } from '../../types';
import { CapacityBar } from '../common/CapacityBar';

interface CreateDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedPIId?: string;
  onSuccess?: () => void;
}

export const CreateDispatchModal: React.FC<CreateDispatchModalProps> = ({
  isOpen,
  onClose,
  preSelectedPIId,
  onSuccess,
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pendingPIs, setPendingPIs] = useState<ProformaInvoice[]>([]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [dispatchDate, setDispatchDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState<string>('14:00 - 16:00');
  const [selectedPiIds, setSelectedPiIds] = useState<string[]>([]);
  const [routeText, setRouteText] = useState<string>('Thane Hub -> Destination');
  const [freightCost, setFreightCost] = useState<number>(18500);
  const [remarks, setRemarks] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('19.0760° N');
  const [longitude, setLongitude] = useState<string>('72.8777° E');
  const [distanceKm, setDistanceKm] = useState<number>(32);

  // Auto-fill Geo Location and Distance when PIs are selected
  useEffect(() => {
    if (selectedPiIds.length > 0) {
      const clients = dispatchService.getClients();
      const firstPI = pendingPIs.find((p) => selectedPiIds.includes(p.id));
      if (firstPI) {
        const client = clients.find(
          (c) => c.name === firstPI.clientName || c.code === firstPI.clientCode
        );
        if (client) {
          setLatitude(client.latitude || '19.0760° N');
          setLongitude(client.longitude || '72.8777° E');
          setDistanceKm(client.distanceKm || 45);
        }
      }
    }
  }, [selectedPiIds, pendingPIs]);

  useEffect(() => {
    if (isOpen) {
      const whList = dispatchService.getWarehouses();
      const vList = dispatchService.getVehicles();
      const piList = dispatchService.getApprovedPIs();

      setWarehouses(whList);
      setVehicles(vList);
      setPendingPIs(piList);

      if (whList.length > 0) {
        setSelectedWarehouseId(whList[0].id);
        setRouteText(`${whList[0].city} Hub -> Destination`);
      }

      const availableVehicles = vList.filter((v) => v.status === 'AVAILABLE');
      if (availableVehicles.length > 0) {
        setSelectedVehicleId(availableVehicles[0].id);
      } else if (vList.length > 0) {
        setSelectedVehicleId(vList[0].id);
      }

      if (preSelectedPIId) {
        setSelectedPiIds([preSelectedPIId]);
      } else {
        setSelectedPiIds([]);
      }
      setErrorMsg('');
    }
  }, [isOpen, preSelectedPIId]);

  if (!isOpen) return null;

  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // Calculate totals for selected PIs
  const mappedPIs = pendingPIs.filter((pi) => selectedPiIds.includes(pi.id));
  const totalWeight = mappedPIs.reduce((sum, pi) => sum + pi.totalWeightKg, 0);
  const totalVolume = Number(mappedPIs.reduce((sum, pi) => sum + pi.totalVolumeCbm, 0).toFixed(2));

  const maxWeight = currentVehicle?.capacityWeightKg || 10000;
  const maxVolume = currentVehicle?.capacityVolumeCbm || 40;
  const isOverweight = totalWeight > maxWeight;

  const togglePISelection = (piId: string) => {
    if (selectedPiIds.includes(piId)) {
      setSelectedPiIds(selectedPiIds.filter((id) => id !== piId));
    } else {
      setSelectedPiIds([...selectedPiIds, piId]);
    }
  };

  const handleSave = (isDraft: boolean = false) => {
    if (!currentVehicle) {
      setErrorMsg('Please select a valid vehicle');
      return;
    }
    if (selectedPiIds.length === 0) {
      setErrorMsg('Please select at least one Proforma Invoice (PI) to dispatch');
      return;
    }

    const routeStops = routeText.split('->').map((s) => s.trim()).filter(Boolean);

    dispatchService.createDispatchPlan({
      planningDate: new Date().toISOString().split('T')[0],
      dispatchDate,
      scheduledTimeSlot: timeSlot,
      status: isDraft ? 'DRAFT' : 'READY_FOR_LOADING',
      vehicleId: currentVehicle.id,
      vehicleNumber: currentVehicle.vehicleNumber,
      vehicleType: currentVehicle.type,
      driverName: currentVehicle.driverName || 'Designated Driver',
      driverPhone: currentVehicle.driverPhone || '+91 98000 00000',
      transporterName: currentVehicle.transporterName || 'Dispatch Fleet Services',
      route: routeStops.length > 0 ? routeStops : ['Thane Central Hub', mappedPIs[0]?.destinationCity || 'Destination'],
      piIds: selectedPiIds,
      totalWeightKg: totalWeight,
      maxWeightCapacityKg: maxWeight,
      totalVolumeCbm: totalVolume,
      maxVolumeCapacityCbm: maxVolume,
      estimatedFreightCost: freightCost,
      remarks,
      isRollbackAllowed: true,
      warehouseId: selectedWarehouseId,
      warehouseName: warehouses.find((w) => w.id === selectedWarehouseId)?.name || 'Central Warehouse',
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F4B400] text-slate-900 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white">Create Loading Slip</h3>
              <p className="text-xs text-slate-400">
                Map approved Proforma Invoices, assign vehicle, verify weight limits
              </p>
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
        <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Warehouse & Vehicle Selection (Compact) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  1. Dispatch Origin Warehouse
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => {
                    const whId = e.target.value;
                    setSelectedWarehouseId(whId);
                    const wh = warehouses.find((w) => w.id === whId);
                    if (wh) {
                      setRouteText(`${wh.city} Hub -> Destination`);
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#F4B400] focus:border-[#F4B400]"
                  required
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code}) — {wh.city}, {wh.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  2. Select Vehicle
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#F4B400] focus:border-[#F4B400]"
                  required
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} ({v.type}) - Cap: {(v.capacityWeightKg / 1000).toFixed(1)}T [{v.status}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {currentVehicle && (
              <div className="text-[11px] bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-slate-600">
                <div>
                  Transporter: <span className="font-semibold text-slate-800">{currentVehicle.transporterName}</span>
                </div>
                <div>
                  Type / Ownership: <span className="font-semibold text-slate-800">{currentVehicle.type} ({currentVehicle.ownerType})</span>
                </div>
                <div>
                  Fitness Expiry: <span className="text-emerald-700 font-mono font-medium">{currentVehicle.fitnessExpiryDate}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Schedule & Route */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispatch Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
              >
                <option value="08:00 - 10:00">08:00 - 10:00 AM (Morning Slot 1)</option>
                <option value="11:00 - 13:00">11:00 - 13:00 PM (Morning Slot 2)</option>
                <option value="14:00 - 16:00">14:00 - 16:00 PM (Afternoon Slot 1)</option>
                <option value="17:00 - 19:00">17:00 - 19:00 PM (Evening Slot)</option>
                <option value="20:00 - 22:00">20:00 - 22:00 PM (Night Long Haul)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Freight (₹)
              </label>
              <input
                type="number"
                value={freightCost}
                onChange={(e) => setFreightCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Planned Route (Separated by {'->'})
            </label>
            <input
              type="text"
              value={routeText}
              onChange={(e) => setRouteText(e.target.value)}
              placeholder="e.g. Thane Central Hub -> Bhiwandi Reliance Park -> Pune Chakan"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
            />
          </div>

          {/* Party Geo Coordinates & Calculated Distance */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Destination Latitude</span>
                <span className="text-[10px] text-blue-600 font-normal">(Backend Mapped)</span>
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g. 19.0760° N"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Destination Longitude</span>
                <span className="text-[10px] text-blue-600 font-normal">(Backend Mapped)</span>
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g. 72.8777° E"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Calculated Distance (km)</span>
                <span className="text-[10px] text-blue-600 font-normal">(Auto mapped)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  placeholder="e.g. 145"
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-900 focus:ring-2 focus:ring-[#F4B400]"
                />
                <span className="absolute right-3 top-2 text-xs font-semibold text-blue-700">KM</span>
              </div>
            </div>
          </div>

          {/* Section 3: Select Pending PIs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Select Approved PIs for Consolidation ({selectedPiIds.length} Selected)
              </label>
              <span className="text-xs text-slate-500">
                {pendingPIs.length} approved orders available
              </span>
            </div>

            {/* Capacity Gauges */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4">
              <CapacityBar
                current={totalWeight}
                max={maxWeight}
                unit="kg"
                label="Total Payload Weight"
              />
              <CapacityBar
                current={totalVolume}
                max={maxVolume}
                unit="cbm"
                label="Total Cubic Volume"
              />
            </div>

            {isOverweight && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">
                  Warning: Total selected weight exceeds vehicle payload capacity by{' '}
                  {(totalWeight - maxWeight).toLocaleString()} kg!
                </span>
              </div>
            )}

            {/* PI Checklist */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              {pendingPIs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No pending proforma invoices available. Create a new PI first.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 w-8"></th>
                      <th className="px-3 py-2">PI Number</th>
                      <th className="px-3 py-2">Client</th>
                      <th className="px-3 py-2">Destination</th>
                      <th className="px-3 py-2 text-right">Weight (kg)</th>
                      <th className="px-3 py-2 text-right">Volume</th>
                      <th className="px-3 py-2">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingPIs.map((pi) => {
                      const isSelected = selectedPiIds.includes(pi.id);
                      return (
                        <tr
                          key={pi.id}
                          onClick={() => togglePISelection(pi.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-amber-50/70 font-medium' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="px-3 py-2 text-center">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono font-semibold text-slate-800">
                            {pi.piNumber}
                          </td>
                          <td className="px-3 py-2 text-slate-800">{pi.clientName}</td>
                          <td className="px-3 py-2 text-slate-600">
                            {pi.destinationCity}, {pi.state}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900">
                            {pi.totalWeightKg.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-600">{pi.totalVolumeCbm} cbm</td>
                          <td className="px-3 py-2">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                pi.priority === 'URGENT'
                                  ? 'bg-red-100 text-red-800'
                                  : pi.priority === 'HIGH'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {pi.priority}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dispatch Instructions / Bay Notes
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Ensure tarpaulin cover tightly fastened. Verify invoice stamp."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
            />
          </div>

          {/* Footer inside form */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 flex items-center gap-1.5 transition-all"
              >
                <Save className="w-4 h-4 text-slate-600" />
                <span>Save Draft</span>
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-slate-900 bg-[#F4B400] hover:bg-[#e0a400] rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm & Initialize Dispatch</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
