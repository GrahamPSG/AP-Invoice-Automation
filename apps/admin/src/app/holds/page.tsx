'use client';

import { useState, useEffect } from 'react';
import { HoldReason } from '@paris/shared';

interface Hold {
  id: string;
  documentId: string;
  reason: HoldReason;
  details: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  document: {
    supplierNameRaw: string;
    invoiceNumber: string;
    total: number;
    invoiceDate: string;
  };
}

export default function HoldsPage() {
  const [holds, setHolds] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');
  const [selectedHold, setSelectedHold] = useState<Hold | null>(null);

  useEffect(() => {
    fetchHolds();
  }, [filter]);

  const fetchHolds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/review/holds?status=${filter}`);
      const data = await response.json();
      setHolds(data.data || []);
    } catch (error) {
      console.error('Failed to fetch holds:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveHold = async (holdId: string, resolution: string) => {
    try {
      const response = await fetch(`/api/review/holds/${holdId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      });
      
      if (response.ok) {
        await fetchHolds();
        setSelectedHold(null);
      }
    } catch (error) {
      console.error('Failed to resolve hold:', error);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(cents / 100);
  };

  const getReasonColor = (reason: HoldReason) => {
    const colors: Record<HoldReason, string> = {
      'DUPLICATE': 'bg-red-100 text-red-800',
      'NO_PO_MATCH': 'bg-yellow-100 text-yellow-800',
      'VARIANCE_EXCEEDED': 'bg-orange-100 text-orange-800',
      'MISSING_INVOICE_NUMBER': 'bg-purple-100 text-purple-800',
      'MISSING_SUPPLIER': 'bg-blue-100 text-blue-800',
      'INVALID_TOTAL': 'bg-red-100 text-red-800',
      'NEGATIVE_QUANTITY': 'bg-red-100 text-red-800',
      'MANUAL_REVIEW': 'bg-gray-100 text-gray-800',
      'SERVICE_STOCK': 'bg-green-100 text-green-800',
    };
    return colors[reason] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoice Holds Management</h1>
          <p className="text-gray-600 mt-2">Review and resolve invoices requiring manual intervention</p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Holds
                </button>
                <button
                  onClick={() => setFilter('open')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'open' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Open ({holds.filter(h => h.status === 'OPEN').length})
                </button>
                <button
                  onClick={() => setFilter('resolved')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'resolved' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Resolved
                </button>
              </div>
              <button
                onClick={fetchHolds}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading holds...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {holds.map((hold) => (
                    <tr key={hold.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {hold.document.supplierNameRaw}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {hold.document.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(hold.document.total)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getReasonColor(hold.reason)}`}>
                          {hold.reason.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          hold.status === 'OPEN' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {hold.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(hold.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {hold.status === 'OPEN' && (
                          <button
                            onClick={() => setSelectedHold(hold)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedHold && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Review Hold</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedHold.document.supplierNameRaw} - {selectedHold.document.invoiceNumber}
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hold Reason</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedHold.reason.replace('_', ' ')}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Details</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedHold.details}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Amount</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatCurrency(selectedHold.document.total)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Notes</label>
                  <textarea
                    id="resolution"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter resolution details..."
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedHold(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const resolution = (document.getElementById('resolution') as HTMLTextAreaElement)?.value;
                    if (resolution) {
                      resolveHold(selectedHold.id, resolution);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Resolve Hold
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}