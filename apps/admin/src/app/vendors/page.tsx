'use client';

import { useState, useEffect } from 'react';
import { AdminOnly } from '../../lib/auth';

interface Vendor {
  id: string;
  name: string;
  serviceTitanId?: string;
  isActive: boolean;
  emailDomain?: string;
  defaultLocationId?: string;
  autoApprove: boolean;
  maxAutoApproveAmount: number;
  synonyms: string[];
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalInvoices: number;
    totalAmount: number;
    lastInvoiceDate?: string;
  };
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuration/vendors');
      const data = await response.json();
      setVendors(data.data || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveVendor = async (vendor: Partial<Vendor>) => {
    try {
      const url = vendor.id 
        ? `/api/configuration/vendors/${vendor.id}`
        : '/api/configuration/vendors';
      
      const method = vendor.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendor),
      });
      
      if (response.ok) {
        await fetchVendors();
        setShowAddModal(false);
        setEditingVendor(null);
      }
    } catch (error) {
      console.error('Failed to save vendor:', error);
    }
  };

  const toggleVendorStatus = async (vendor: Vendor) => {
    await saveVendor({
      ...vendor,
      isActive: !vendor.isActive,
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(cents / 100);
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.synonyms.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AdminOnly>
      <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600 mt-2">Configure vendor settings and ServiceTitan mappings</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  setEditingVendor(null);
                  setShowAddModal(true);
                }}
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Vendor
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading vendors...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ServiceTitan ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auto-Approve
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Invoices
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.name}
                          </div>
                          {vendor.synonyms.length > 0 && (
                            <div className="text-xs text-gray-500">
                              Also: {vendor.synonyms.join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vendor.serviceTitanId || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {vendor.autoApprove ? (
                            <span className="text-green-600">
                              Up to {formatCurrency(vendor.maxAutoApproveAmount)}
                            </span>
                          ) : (
                            <span className="text-gray-500">Disabled</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.stats?.totalInvoices || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(vendor.stats?.totalAmount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleVendorStatus(vendor)}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            vendor.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {vendor.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setEditingVendor(vendor);
                            setShowAddModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {(showAddModal || editingVendor) && (
          <VendorModal
            vendor={editingVendor}
            onSave={saveVendor}
            onClose={() => {
              setShowAddModal(false);
              setEditingVendor(null);
            }}
          />
        )}
      </div>
      </div>
    </AdminOnly>
  );
}

function VendorModal({ 
  vendor, 
  onSave, 
  onClose 
}: { 
  vendor: Vendor | null;
  onSave: (vendor: Partial<Vendor>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Vendor>>({
    name: vendor?.name || '',
    serviceTitanId: vendor?.serviceTitanId || '',
    emailDomain: vendor?.emailDomain || '',
    defaultLocationId: vendor?.defaultLocationId || '',
    autoApprove: vendor?.autoApprove || false,
    maxAutoApproveAmount: vendor?.maxAutoApproveAmount || 500000,
    synonyms: vendor?.synonyms || [],
    isActive: vendor?.isActive ?? true,
  });

  const [newSynonym, setNewSynonym] = useState('');

  const addSynonym = () => {
    if (newSynonym.trim()) {
      setFormData({
        ...formData,
        synonyms: [...(formData.synonyms || []), newSynonym.trim()],
      });
      setNewSynonym('');
    }
  };

  const removeSynonym = (index: number) => {
    setFormData({
      ...formData,
      synonyms: formData.synonyms?.filter((_, i) => i !== index) || [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {vendor ? 'Edit Vendor' : 'Add New Vendor'}
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ServiceTitan Vendor ID
            </label>
            <input
              type="text"
              value={formData.serviceTitanId}
              onChange={(e) => setFormData({ ...formData, serviceTitanId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Domain
            </label>
            <input
              type="text"
              value={formData.emailDomain}
              onChange={(e) => setFormData({ ...formData, emailDomain: e.target.value })}
              placeholder="@supplier.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Location ID
            </label>
            <input
              type="text"
              value={formData.defaultLocationId}
              onChange={(e) => setFormData({ ...formData, defaultLocationId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.autoApprove}
                onChange={(e) => setFormData({ ...formData, autoApprove: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Auto-approve invoices</span>
            </label>
            
            {formData.autoApprove && (
              <div className="flex items-center">
                <label className="text-sm font-medium text-gray-700 mr-2">
                  Up to:
                </label>
                <input
                  type="number"
                  value={formData.maxAutoApproveAmount! / 100}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    maxAutoApproveAmount: parseFloat(e.target.value) * 100 
                  })}
                  className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-1 text-sm text-gray-700">CAD</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alternative Names / Synonyms
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newSynonym}
                onChange={(e) => setNewSynonym(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSynonym()}
                placeholder="Add synonym..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addSynonym}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.synonyms?.map((synonym, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
                >
                  {synonym}
                  <button
                    onClick={() => removeSynonym(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...vendor, ...formData })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {vendor ? 'Update' : 'Create'} Vendor
          </button>
        </div>
      </div>
    </div>
  );
}