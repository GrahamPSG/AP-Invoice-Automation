'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Divider } from '@nextui-org/react';

interface DashboardStats {
  pendingInvoices: number;
  processedToday: number;
  holdItems: number;
  successRate: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingInvoices: 0,
    processedToday: 0,
    holdItems: 0,
    successRate: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch real stats from API
    setTimeout(() => {
      setStats({
        pendingInvoices: 12,
        processedToday: 45,
        holdItems: 3,
        successRate: 94.5,
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  const triggerManualIngest = async () => {
    try {
      const response = await fetch('/api/ingest/manual', {
        method: 'POST',
      });
      
      if (response.ok) {
        alert('Manual ingest triggered successfully');
      } else {
        alert('Failed to trigger manual ingest');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>
        <Button 
          color="primary" 
          onClick={triggerManualIngest}
          isLoading={isLoading}
        >
          Manual Ingest
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">
              Pending Invoices
            </h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-2xl font-bold text-blue-600">
              {stats.pendingInvoices}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">
              Processed Today
            </h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-2xl font-bold text-green-600">
              {stats.processedToday}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">
              Items on Hold
            </h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-2xl font-bold text-orange-600">
              {stats.holdItems}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-600">
              Success Rate
            </h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="text-2xl font-bold text-purple-600">
              {stats.successRate}%
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Invoice processed: ACE-12345</span>
                <span className="text-xs text-gray-400">2 min ago</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Hold created: Missing PO</span>
                <span className="text-xs text-gray-400">5 min ago</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bill finalized: $1,234.56</span>
                <span className="text-xs text-gray-400">10 min ago</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">System Status</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">API Status</span>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  Healthy
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Workers</span>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  Running
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  Connected
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}