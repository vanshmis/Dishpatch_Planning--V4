import {
  ProformaInvoice,
  Vehicle,
  Driver,
  DispatchPlan,
  RollbackAction,
  Client,
  NotificationItem,
  DispatchStatus,
  PIStatus,
  Warehouse,
} from '../types';
import {
  INITIAL_CLIENTS,
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_PIS,
  INITIAL_DISPATCH_PLANS,
  INITIAL_ROLLBACK_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_WAREHOUSES,
} from '../data/mockData';

// Local storage keys to persist state across user interactions
const STORAGE_KEYS = {
  PIS: 'Dispatch_Planning_pis',
  DISPATCHES: 'Dispatch_Planning_plans',
  VEHICLES: 'Dispatch_Planning_vehicles',
  DRIVERS: 'Dispatch_Planning_drivers',
  CLIENTS: 'Dispatch_Planning_clients',
  ROLLBACKS: 'Dispatch_Planning_rollbacks',
  NOTIFICATIONS: 'Dispatch_Planning_notifications',
  WAREHOUSES: 'Dispatch_Planning_warehouses',
};

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    console.warn(`Error reading ${key} from storage`, e);
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn(`Error writing ${key} to storage`, e);
  }
}

class DispatchDataService {
  private pis: ProformaInvoice[] = getStored(STORAGE_KEYS.PIS, INITIAL_PIS);
  private dispatches: DispatchPlan[] = getStored(STORAGE_KEYS.DISPATCHES, INITIAL_DISPATCH_PLANS);
  private vehicles: Vehicle[] = getStored(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
  private drivers: Driver[] = getStored(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
  private clients: Client[] = getStored(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  private rollbacks: RollbackAction[] = getStored(STORAGE_KEYS.ROLLBACKS, INITIAL_ROLLBACK_LOGS);
  private notifications: NotificationItem[] = getStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  private warehouses: Warehouse[] = getStored(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES);

  private listeners: Array<() => void> = [];

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ==========================================
  // PROFORMA INVOICES (PI) METHODS
  // ==========================================

  /**
   * BACKEND INTEGRATION POINT:
   * GET /api/v1/proforma-invoices
   * Fetches all PIs from ERP / Sales database
   */
  public getPIs(): ProformaInvoice[] {
    return [...this.pis];
  }

  public getPendingPIs(): ProformaInvoice[] {
    return this.pis.filter((pi) => pi.status === 'PENDING');
  }

  public getApprovedPIs(): ProformaInvoice[] {
    return this.pis.filter((pi) => pi.status === 'APPROVED');
  }

  public getPIById(id: string): ProformaInvoice | undefined {
    return this.pis.find((pi) => pi.id === id);
  }

  /**
   * BACKEND INTEGRATION POINT:
   * POST /api/v1/proforma-invoices
   * Creates a new manual/imported PI
   */
  public createPI(piData: Omit<ProformaInvoice, 'id' | 'createdDate'>): ProformaInvoice {
    const newId = `PI-2026-${Math.floor(1050 + Math.random() * 900)}`;
    const newPI: ProformaInvoice = {
      ...piData,
      id: newId,
      piNumber: piData.piNumber || newId,
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'PENDING',
    };
    this.pis = [newPI, ...this.pis];
    setStored(STORAGE_KEYS.PIS, this.pis);
    this.addNotification({
      title: `New PI Created: ${newPI.piNumber}`,
      message: `${newPI.clientName} order created with weight ${newPI.totalWeightKg.toLocaleString()} kg.`,
      type: 'INFO',
    });
    this.notify();
    return newPI;
  }

  public updatePIStatus(id: string, status: PIStatus, assignedDispatchId?: string): boolean {
    const idx = this.pis.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.pis[idx] = {
        ...this.pis[idx],
        status,
        assignedDispatchId: assignedDispatchId !== undefined ? assignedDispatchId : this.pis[idx].assignedDispatchId,
      };
      setStored(STORAGE_KEYS.PIS, this.pis);
      this.notify();
      return true;
    }
    return false;
  }

  // ==========================================
  // DISPATCH PLANS METHODS
  // ==========================================

  /**
   * BACKEND INTEGRATION POINT:
   * GET /api/v1/dispatch-plans
   * Fetches all dispatch plans with linked PI data and vehicle details
   */
  public getDispatchPlans(): DispatchPlan[] {
    return this.dispatches.map((dsp) => {
      const linkedPis = this.pis.filter((p) => dsp.piIds.includes(p.id));
      return {
        ...dsp,
        pis: linkedPis,
      };
    });
  }

  public getDispatchById(id: string): DispatchPlan | undefined {
    const dsp = this.dispatches.find((d) => d.id === id);
    if (!dsp) return undefined;
    return {
      ...dsp,
      pis: this.pis.filter((p) => dsp.piIds.includes(p.id)),
    };
  }

  public getTodaysDispatches(): DispatchPlan[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getDispatchPlans().filter((d) => d.dispatchDate === today || d.dispatchDate === '2026-03-02');
  }

  public getUpcomingDispatches(): DispatchPlan[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getDispatchPlans().filter((d) => d.dispatchDate > today && d.dispatchDate !== '2026-03-02');
  }

  public getCompletedDispatches(): DispatchPlan[] {
    return this.getDispatchPlans().filter((d) => d.status === 'DELIVERED');
  }

  /**
   * BACKEND INTEGRATION POINT:
   * POST /api/v1/dispatch-plans
   * Creates a new dispatch plan with vehicle, driver, route & mapped PIs
   */
  public createDispatchPlan(planData: Omit<DispatchPlan, 'id' | 'dispatchNumber'>): DispatchPlan {
    const newId = `DSP-2026-0${Math.floor(884 + Math.random() * 100)}`;
    const newPlan: DispatchPlan = {
      ...planData,
      id: newId,
      dispatchNumber: newId,
      status: planData.status || 'READY_FOR_LOADING',
      isRollbackAllowed: true,
    };

    // Update mapped PIs to PLANNED
    if (planData.piIds && planData.piIds.length > 0) {
      planData.piIds.forEach((piId) => {
        this.updatePIStatus(piId, 'PLANNED', newId);
      });
    }

    // Update Vehicle status to ASSIGNED
    this.updateVehicleStatus(planData.vehicleId, 'ASSIGNED');

    this.dispatches = [newPlan, ...this.dispatches];
    setStored(STORAGE_KEYS.DISPATCHES, this.dispatches);

    this.addNotification({
      title: `Dispatch Plan Created: ${newPlan.dispatchNumber}`,
      message: `Assigned vehicle ${newPlan.vehicleNumber} with ${planData.piIds?.length || 0} PIs.`,
      type: 'SUCCESS',
      actionLink: '/todays-planning',
    });

    this.notify();
    return newPlan;
  }

  /**
   * BACKEND INTEGRATION POINT:
   * PATCH /api/v1/dispatch-plans/:id/status
   * Progresses the dispatch pipeline: DRAFT -> READY_FOR_LOADING -> LOADING -> GATE_PASS_ISSUED -> IN_TRANSIT -> DELIVERED
   */
  public updateDispatchStatus(
    id: string,
    status: DispatchStatus,
    additionalData?: {
      gatePassNumber?: string;
      lrNumber?: string;
      sealNumber?: string;
      receivedBy?: string;
      deliveryProofUrl?: string;
    }
  ): boolean {
    const idx = this.dispatches.findIndex((d) => d.id === id);
    if (idx !== -1) {
      const current = this.dispatches[idx];
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

      const updated: DispatchPlan = {
        ...current,
        status,
        ...additionalData,
      };

      if (status === 'GATE_PASS_ISSUED' && !updated.gatePassNumber) {
        updated.gatePassNumber = `GP-2026-0${Math.floor(4420 + Math.random() * 80)}`;
        updated.gatePassIssuedAt = now;
      }
      if (status === 'IN_TRANSIT') {
        updated.startedAt = updated.startedAt || now;
        current.piIds.forEach((piId) => this.updatePIStatus(piId, 'DISPATCHED'));
        this.updateVehicleStatus(current.vehicleId, 'IN_TRANSIT');
      }
      if (status === 'DELIVERED') {
        updated.completedAt = now;
        updated.receivedDate = now;
        updated.isRollbackAllowed = false;
        current.piIds.forEach((piId) => this.updatePIStatus(piId, 'DELIVERED'));
        this.updateVehicleStatus(current.vehicleId, 'AVAILABLE');
      }

      this.dispatches[idx] = updated;
      setStored(STORAGE_KEYS.DISPATCHES, this.dispatches);

      this.addNotification({
        title: `Dispatch ${current.dispatchNumber} Status: ${status.replace(/_/g, ' ')}`,
        message: `Updated vehicle ${current.vehicleNumber} dispatch pipeline state.`,
        type: status === 'DELIVERED' ? 'SUCCESS' : 'INFO',
      });

      this.notify();
      return true;
    }
    return false;
  }

  /**
   * BACKEND INTEGRATION POINT:
   * POST /api/v1/dispatch-plans/:id/map-pi
   * Adds or removes PIs from an active dispatch plan with live recalculations
   */
  public assignPIsToDispatch(dispatchId: string, piIdsToAdd: string[]): boolean {
    const idx = this.dispatches.findIndex((d) => d.id === dispatchId);
    if (idx === -1) return false;

    const current = this.dispatches[idx];
    const newPiIds = Array.from(new Set([...current.piIds, ...piIdsToAdd]));

    // Recalculate weights and volumes
    let totalWeight = 0;
    let totalVolume = 0;

    newPiIds.forEach((piId) => {
      const pi = this.pis.find((p) => p.id === piId);
      if (pi) {
        totalWeight += pi.totalWeightKg;
        totalVolume += pi.totalVolumeCbm;
      }
    });

    this.dispatches[idx] = {
      ...current,
      piIds: newPiIds,
      totalWeightKg: totalWeight,
      totalVolumeCbm: Number(totalVolume.toFixed(2)),
    };

    piIdsToAdd.forEach((piId) => {
      this.updatePIStatus(piId, 'PLANNED', dispatchId);
    });

    setStored(STORAGE_KEYS.DISPATCHES, this.dispatches);
    this.notify();
    return true;
  }

  // ==========================================
  // ROLLBACK & CORRECTION SYSTEM
  // ==========================================

  /**
   * BACKEND INTEGRATION POINT:
   * POST /api/v1/dispatch-plans/:id/rollback
   * Handles reversing gate pass, de-allocating PIs back to pending, freeing vehicle
   */
  public executeRollback(
    dispatchId: string,
    reasonCategory: RollbackAction['reasonCategory'],
    reasonNotes: string,
    requestedBy: string
  ): boolean {
    const dspIdx = this.dispatches.findIndex((d) => d.id === dispatchId);
    if (dspIdx === -1) return false;

    const dsp = this.dispatches[dspIdx];
    const affectedCount = dsp.piIds.length;

    // Reset PIs to PENDING
    dsp.piIds.forEach((piId) => {
      this.updatePIStatus(piId, 'PENDING', undefined);
    });

    // Reset Vehicle to AVAILABLE
    this.updateVehicleStatus(dsp.vehicleId, 'AVAILABLE');

    // Update dispatch status to CANCELLED
    this.dispatches[dspIdx] = {
      ...dsp,
      status: 'CANCELLED',
      piIds: [],
      totalWeightKg: 0,
      totalVolumeCbm: 0,
      isRollbackAllowed: false,
      remarks: `Rollback applied: ${reasonNotes}`,
    };
    setStored(STORAGE_KEYS.DISPATCHES, this.dispatches);

    // Record Audit Log
    const newRollback: RollbackAction = {
      id: `RB-2026-0${Math.floor(20 + Math.random() * 80)}`,
      dispatchId: dsp.id,
      dispatchNumber: dsp.dispatchNumber,
      reasonCategory,
      reasonNotes,
      actionTaken: 'REVERT_TO_PENDING',
      requestedBy,
      requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      approvedBy: 'R. K. Verma (Logistics Head)',
      status: 'COMPLETED',
      affectedPiCount: affectedCount,
    };

    this.rollbacks = [newRollback, ...this.rollbacks];
    setStored(STORAGE_KEYS.ROLLBACKS, this.rollbacks);

    this.addNotification({
      title: `Rollback Executed: ${dsp.dispatchNumber}`,
      message: `${affectedCount} PIs reverted to Pending. Reason: ${reasonCategory.replace(/_/g, ' ')}`,
      type: 'ALERT',
      actionLink: '/rollback',
    });

    this.notify();
    return true;
  }

  public getRollbackLogs(): RollbackAction[] {
    return [...this.rollbacks];
  }

  // ==========================================
  // VEHICLES & DRIVERS & CLIENTS
  // ==========================================

  public getVehicles(): Vehicle[] {
    return [...this.vehicles];
  }

  public getAvailableVehicles(): Vehicle[] {
    return this.vehicles.filter((v) => v.status === 'AVAILABLE');
  }

  public updateVehicleStatus(id: string, status: Vehicle['status']): void {
    const idx = this.vehicles.findIndex((v) => v.id === id);
    if (idx !== -1) {
      this.vehicles[idx] = { ...this.vehicles[idx], status };
      setStored(STORAGE_KEYS.VEHICLES, this.vehicles);
      this.notify();
    }
  }

  public addVehicle(vehicle: Omit<Vehicle, 'id'>): Vehicle {
    const newId = `V-00${this.vehicles.length + 1}`;
    const newVehicle: Vehicle = { ...vehicle, id: newId };
    this.vehicles = [...this.vehicles, newVehicle];
    setStored(STORAGE_KEYS.VEHICLES, this.vehicles);
    this.notify();
    return newVehicle;
  }

  public getDrivers(): Driver[] {
    return [...this.drivers];
  }

  public getClients(): Client[] {
    return [...this.clients];
  }

  // ==========================================
  // WAREHOUSES MANAGEMENT
  // ==========================================

  public getWarehouses(): Warehouse[] {
    return [...this.warehouses];
  }

  public addWarehouse(wh: Omit<Warehouse, 'id'>): Warehouse {
    const newId = `WH-00${this.warehouses.length + 1}`;
    const newWh: Warehouse = { ...wh, id: newId };
    this.warehouses = [...this.warehouses, newWh];
    setStored(STORAGE_KEYS.WAREHOUSES, this.warehouses);
    this.notify();
    return newWh;
  }

  public deleteWarehouse(id: string): boolean {
    const idx = this.warehouses.findIndex((w) => w.id === id);
    if (idx !== -1) {
      this.warehouses = this.warehouses.filter((w) => w.id !== id);
      setStored(STORAGE_KEYS.WAREHOUSES, this.warehouses);
      this.notify();
      return true;
    }
    return false;
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  public markNotificationAsRead(id: string): void {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setStored(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
  }

  public markAllNotificationsAsRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    setStored(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
  }

  public addNotification(notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): void {
    const item: NotificationItem = {
      ...notif,
      id: `NOTIF-${Date.now()}`,
      timestamp: 'Just now',
      read: false,
    };
    this.notifications = [item, ...this.notifications];
    setStored(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
  }

  /**
   * Reset all mock data to factory state if needed
   */
  public resetToFactory(): void {
    this.pis = INITIAL_PIS;
    this.dispatches = INITIAL_DISPATCH_PLANS;
    this.vehicles = INITIAL_VEHICLES;
    this.drivers = INITIAL_DRIVERS;
    this.clients = INITIAL_CLIENTS;
    this.rollbacks = INITIAL_ROLLBACK_LOGS;
    this.notifications = INITIAL_NOTIFICATIONS;
    this.warehouses = INITIAL_WAREHOUSES;

    localStorage.removeItem(STORAGE_KEYS.PIS);
    localStorage.removeItem(STORAGE_KEYS.DISPATCHES);
    localStorage.removeItem(STORAGE_KEYS.VEHICLES);
    localStorage.removeItem(STORAGE_KEYS.DRIVERS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.ROLLBACKS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.WAREHOUSES);

    this.notify();
  }
}

export const dispatchService = new DispatchDataService();
