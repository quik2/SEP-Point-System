'use client';

import { useState, useEffect } from 'react';
import { Lock, ChartBar, History, UserCog, LogOut } from 'lucide-react';
import Image from 'next/image';
import AttendanceGrid from '@/components/AttendanceGrid';
import PointAdjuster from '@/components/PointAdjuster';
import PointHistoryLog from '@/components/PointHistoryLog';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'attendance' | 'adjust' | 'history'>('attendance');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setMounted(true);
    // Check localStorage for cached auth
    const cachedAuth = localStorage.getItem('admin-auth');
    if (cachedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('admin-auth', 'true');
        setToast({ message: 'Authentication successful', type: 'success' });
      } else {
        setToast({ message: 'Invalid password', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Authentication failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <div className="flex items-center gap-3 mb-2">
                <Image
                  src="/logo.png"
                  alt="SEP Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <h1 className="text-2xl font-bold">Admin Access</h1>
              </div>
              <p className="text-muted-foreground text-sm text-center">
                Enter password to access the admin dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {toast && (
              <div className={cn(
                "mt-4 p-3 rounded-lg text-sm",
                toast.type === 'success' && "bg-green-500/10 text-green-500 border border-green-500/20",
                toast.type === 'error' && "bg-destructive/10 text-destructive border border-destructive/20"
              )}>
                {toast.message}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="SEP Logo"
              width={50}
              height={50}
              className="object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">Manage points and attendance</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsAuthenticated(false);
              setPassword('');
              localStorage.removeItem('admin-auth');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-border">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('attendance')}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 font-medium transition-colors relative",
                  activeTab === 'attendance'
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ChartBar className="w-4 h-4" />
                Attendance Tracker
                {activeTab === 'attendance' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('adjust')}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 font-medium transition-colors relative",
                  activeTab === 'adjust'
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <UserCog className="w-4 h-4" />
                Adjust Points
                {activeTab === 'adjust' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 font-medium transition-colors relative",
                  activeTab === 'history'
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <History className="w-4 h-4" />
                Point History
                {activeTab === 'history' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'attendance' && <AttendanceGrid />}
          {activeTab === 'adjust' && <PointAdjuster />}
          {activeTab === 'history' && <PointHistoryLog />}
        </div>

        {/* Toast Notifications */}
        {toast && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={cn(
              "px-4 py-3 rounded-lg shadow-lg text-sm font-medium",
              toast.type === 'success' && "bg-green-500 text-white",
              toast.type === 'error' && "bg-destructive text-destructive-foreground"
            )}>
              {toast.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
