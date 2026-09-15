import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Bell,
  CheckCheck,
  RefreshCw,
  User,
  Truck,
  Shield,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { dispatchService } from '../services/api';
import { NotificationItem } from '../types';

interface NavbarProps {
  onOpenNewDispatch: () => void;
  onOpenNewPI: () => void;
  onGlobalSearch?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewDispatch,
  onOpenNewPI,
  onGlobalSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateNotifs = () => {
      setNotifications(dispatchService.getNotifications());
    };
    updateNotifs();
    const unsubscribe = dispatchService.subscribe(updateNotifs);

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onGlobalSearch) {
      onGlobalSearch(e.target.value);
    }
  };

  const handleMarkAllRead = () => {
    dispatchService.markAllNotificationsAsRead();
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo data (PIs, Dispatches, Rollbacks) to factory state?')) {
      dispatchService.resetToFactory();
      window.location.reload();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-6 flex items-center justify-between gap-4">
      {/* Search Bar */}
      <div className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search PI number, vehicle (e.g. MH-04), client, driver..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F4B400] focus:border-[#F4B400] transition-all"
        />
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* Live Clock */}
        <div className="hidden lg:flex flex-col text-right pr-2 border-r border-slate-200 text-xs">
          <span className="font-semibold text-slate-800">{currentTime || '02 Mar 2026, 14:32'}</span>
          <span className="text-[10px] text-slate-400">Indian Standard Time (IST)</span>
        </div>

        {/* Quick Action Buttons */}
        <button
          onClick={onOpenNewPI}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-slate-600" />
          <span>Dispatch Planning Form</span>
        </button>

        <button
          onClick={onOpenNewDispatch}
          className="px-3.5 py-1.5 bg-[#F4B400] hover:bg-[#e0a400] text-slate-950 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
        >
          <Truck className="w-4 h-4" />
          <span>Create Loading Slip</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-slate-900 relative transition-colors"
            title="Dispatch Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in duration-100">
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-tight">System Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-rose-500 text-white font-semibold px-1.5 py-0.2 rounded">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => dispatchService.markNotificationAsRead(notif.id)}
                      className={`p-3 text-xs transition-colors hover:bg-slate-50 cursor-pointer ${
                        !notif.read ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-900">{notif.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5 text-[11px]">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#181309] text-[#F4B400] flex items-center justify-center font-bold text-xs">
              RS
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">Rajesh Sharma</div>
              <div className="text-[10px] text-slate-500">Senior Dispatch Officer</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs text-slate-700 animate-in fade-in duration-100">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">Rajesh Sharma</p>
                <p className="text-[11px] text-slate-500 font-mono">ID: DL-EMP-0881</p>
                <span className="inline-block mt-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                  Authorizer Level 2
                </span>
              </div>

              <button
                onClick={handleResetData}
                className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
                <span>Reset Demo State</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
