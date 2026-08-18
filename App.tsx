import React, { useState, useEffect } from 'react';
import { WarehouseProvider, useWarehouse } from './context/WarehouseContext';
import { Header } from './components/layout/Header';
import { WorkflowLifecycleBar } from './components/dashboard/WorkflowLifecycleBar';
import { WarehouseFloor2D } from './components/warehouseMap/WarehouseFloor2D';
import { InventoryTable } from './components/inventory/InventoryTable';
import { OrderList } from './components/orders/OrderList';
import { RouteOptimizerView } from './components/picking/RouteOptimizerView';
import { PickerTerminal } from './components/picking/PickerTerminal';
import { PackAndQAStation } from './components/packing/PackAndQAStation';
import { ToastContainer } from './components/common/ToastContainer';
import { ToastNotification } from './types/analytics';

const MainLayout: React.FC = () => {
  const { telemetry } = useWarehouse();
  const [currentTab, setCurrentTab] = useState<string>('map');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Convert incoming telemetry alerts into subtle toasts automatically
  useEffect(() => {
    if (telemetry.length > 0) {
      const latest = telemetry[0];
      const toastType: ToastNotification['type'] = 
        latest.severity === 'danger' ? 'danger' :
        latest.severity === 'warning' ? 'warning' :
        latest.severity === 'success' ? 'success' : 'info';

      const newToast: ToastNotification = {
        id: latest.id,
        title: latest.title,
        message: latest.message,
        type: toastType,
        timestamp: Date.now(),
      };

      setToasts(prev => {
        // Prevent duplicate toasts
        if (prev.some(t => t.id === newToast.id)) return prev;
        return [newToast, ...prev.slice(0, 3)];
      });

      // Auto-dismiss after 4.5 seconds
      const timer = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [telemetry]);

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Determine active workflow step based on active tab
  const getWorkflowStep = () => {
    if (currentTab === 'orders') return 1;
    if (currentTab === 'inventory') return 2;
    if (currentTab === 'optimizer') return 3;
    if (currentTab === 'map') return 4;
    if (currentTab === 'terminal') return 5;
    if (currentTab === 'pack_qa') return 6;
    return 1;
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex === 1 || stepIndex === 2) setCurrentTab('orders');
    if (stepIndex === 3) setCurrentTab('optimizer');
    if (stepIndex === 4) setCurrentTab('map');
    if (stepIndex === 5) setCurrentTab('terminal');
    if (stepIndex === 6 || stepIndex === 7) setCurrentTab('pack_qa');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Navigation & Telemetry Stats */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onSearchQuery={setSearchQuery}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '20px 24px', maxWidth: '1600px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* End-to-End Fulfillment Lifecycle Workflow Indicator */}
          <WorkflowLifecycleBar
            currentActiveStep={getWorkflowStep()}
            onStepClick={handleStepClick}
          />

          {/* Active Tab View Rendering */}
          {currentTab === 'map' && (
            <WarehouseFloor2D onNavigateTab={setCurrentTab} />
          )}

          {currentTab === 'inventory' && (
            <InventoryTable searchQuery={searchQuery} onNavigateTab={setCurrentTab} />
          )}

          {currentTab === 'orders' && (
            <OrderList searchQuery={searchQuery} onNavigateTab={setCurrentTab} />
          )}

          {currentTab === 'optimizer' && (
            <RouteOptimizerView onNavigateTab={setCurrentTab} />
          )}

          {currentTab === 'terminal' && (
            <PickerTerminal onNavigateTab={setCurrentTab} />
          )}

          {currentTab === 'pack_qa' && (
            <PackAndQAStation onNavigateTab={setCurrentTab} />
          )}
        </div>
      </main>

      {/* Floating Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};

export default function App() {
  return (
    <WarehouseProvider>
      <MainLayout />
    </WarehouseProvider>
  );
}
