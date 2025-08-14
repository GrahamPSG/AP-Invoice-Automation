'use client';

import { useState, useEffect } from 'react';
import { AdminOnly } from '../../lib/auth';

interface SystemConfig {
  varianceCents: number;
  dedupeWindowDays: number;
  dailySummaryHourPT: number;
  runScheduleCron: string;
  notifyAllSuccess: boolean;
  autoFinalizeThresholdCents: number;
  serviceStockLocationId: string;
  defaultTechnicianId?: string;
  emailSettings: {
    enabled: boolean;
    recipients: string[];
  };
  teamsSettings: {
    enabled: boolean;
    channelId: string;
  };
  processingRules: {
    requirePOMatch: boolean;
    allowManualOverride: boolean;
    autoRetryFailures: boolean;
    maxRetryAttempts: number;
  };
}

export default function SettingsPage() {
  const [config, setConfig] = useState<SystemConfig>({
    varianceCents: 2500,
    dedupeWindowDays: 90,
    dailySummaryHourPT: 7,
    runScheduleCron: '0 6-18 * * 1-6',
    notifyAllSuccess: false,
    autoFinalizeThresholdCents: 10000,
    serviceStockLocationId: '',
    emailSettings: {
      enabled: true,
      recipients: [],
    },
    teamsSettings: {
      enabled: true,
      channelId: '',
    },
    processingRules: {
      requirePOMatch: true,
      allowManualOverride: true,
      autoRetryFailures: true,
      maxRetryAttempts: 3,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuration/system');
      const data = await response.json();
      if (data.data) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/configuration/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (response.ok) {
        alert('Configuration saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (service: string) => {
    try {
      setTestingConnection(service);
      const response = await fetch(`/api/configuration/test-connection/${service}`, {
        method: 'POST',
      });
      
      const result = await response.json();
      alert(result.success 
        ? `${service} connection successful!` 
        : `${service} connection failed: ${result.error}`
      );
    } catch (error) {
      alert(`Failed to test ${service} connection`);
    } finally {
      setTestingConnection(null);
    }
  };

  const addEmailRecipient = () => {
    const email = prompt('Enter email address:');
    if (email && email.includes('@')) {
      setConfig({
        ...config,
        emailSettings: {
          ...config.emailSettings,
          recipients: [...config.emailSettings.recipients, email],
        },
      });
    }
  };

  const removeEmailRecipient = (index: number) => {
    setConfig({
      ...config,
      emailSettings: {
        ...config.emailSettings,
        recipients: config.emailSettings.recipients.filter((_, i) => i !== index),
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminOnly>
      <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
          <p className="text-gray-600 mt-2">Configure AP automation system settings and thresholds</p>
        </div>

        <div className="space-y-6">
          {/* Processing Rules */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Rules</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variance Threshold (CAD)
                  </label>
                  <input
                    type="number"
                    value={config.varianceCents / 100}
                    onChange={(e) => setConfig({
                      ...config,
                      varianceCents: parseFloat(e.target.value) * 100,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Invoices within this variance will be auto-approved
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto-Finalize Threshold (CAD)
                  </label>
                  <input
                    type="number"
                    value={config.autoFinalizeThresholdCents / 100}
                    onChange={(e) => setConfig({
                      ...config,
                      autoFinalizeThresholdCents: parseFloat(e.target.value) * 100,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Bills under this amount will be auto-finalized
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duplicate Window (Days)
                  </label>
                  <input
                    type="number"
                    value={config.dedupeWindowDays}
                    onChange={(e) => setConfig({
                      ...config,
                      dedupeWindowDays: parseInt(e.target.value),
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Check for duplicates within this time window
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Retry Attempts
                  </label>
                  <input
                    type="number"
                    value={config.processingRules.maxRetryAttempts}
                    onChange={(e) => setConfig({
                      ...config,
                      processingRules: {
                        ...config.processingRules,
                        maxRetryAttempts: parseInt(e.target.value),
                      },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.processingRules.requirePOMatch}
                    onChange={(e) => setConfig({
                      ...config,
                      processingRules: {
                        ...config.processingRules,
                        requirePOMatch: e.target.checked,
                      },
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Require PO match for processing
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.processingRules.allowManualOverride}
                    onChange={(e) => setConfig({
                      ...config,
                      processingRules: {
                        ...config.processingRules,
                        allowManualOverride: e.target.checked,
                      },
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Allow manual override of holds
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.processingRules.autoRetryFailures}
                    onChange={(e) => setConfig({
                      ...config,
                      processingRules: {
                        ...config.processingRules,
                        autoRetryFailures: e.target.checked,
                      },
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Auto-retry failed processing
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Schedule Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Summary Time (PT)
                </label>
                <select
                  value={config.dailySummaryHourPT}
                  onChange={(e) => setConfig({
                    ...config,
                    dailySummaryHourPT: parseInt(e.target.value),
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[...Array(24)].map((_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Processing Schedule (Cron)
                </label>
                <input
                  type="text"
                  value={config.runScheduleCron}
                  onChange={(e) => setConfig({
                    ...config,
                    runScheduleCron: e.target.value,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: Hourly 6am-6pm PT weekdays
                </p>
              </div>
            </div>
          </div>

          {/* ServiceTitan Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ServiceTitan Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Stock Location ID
                </label>
                <input
                  type="text"
                  value={config.serviceStockLocationId}
                  onChange={(e) => setConfig({
                    ...config,
                    serviceStockLocationId: e.target.value,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Technician ID (Optional)
                </label>
                <input
                  type="text"
                  value={config.defaultTechnicianId || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    defaultTechnicianId: e.target.value || undefined,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => testConnection('servicetitan')}
                disabled={testingConnection === 'servicetitan'}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {testingConnection === 'servicetitan' ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.emailSettings.enabled}
                      onChange={(e) => setConfig({
                        ...config,
                        emailSettings: {
                          ...config.emailSettings,
                          enabled: e.target.checked,
                        },
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Email Notifications
                    </span>
                  </label>
                  <button
                    onClick={() => testConnection('email')}
                    disabled={testingConnection === 'email'}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {testingConnection === 'email' ? 'Testing...' : 'Test'}
                  </button>
                </div>

                {config.emailSettings.enabled && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-700">Recipients</label>
                      <button
                        onClick={addEmailRecipient}
                        className="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Add Email
                      </button>
                    </div>
                    <div className="space-y-1">
                      {config.emailSettings.recipients.map((email, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{email}</span>
                          <button
                            onClick={() => removeEmailRecipient(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.teamsSettings.enabled}
                      onChange={(e) => setConfig({
                        ...config,
                        teamsSettings: {
                          ...config.teamsSettings,
                          enabled: e.target.checked,
                        },
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Teams Notifications
                    </span>
                  </label>
                  <button
                    onClick={() => testConnection('teams')}
                    disabled={testingConnection === 'teams'}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {testingConnection === 'teams' ? 'Testing...' : 'Test'}
                  </button>
                </div>

                {config.teamsSettings.enabled && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Channel ID
                    </label>
                    <input
                      type="text"
                      value={config.teamsSettings.channelId}
                      onChange={(e) => setConfig({
                        ...config,
                        teamsSettings: {
                          ...config.teamsSettings,
                          channelId: e.target.value,
                        },
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.notifyAllSuccess}
                  onChange={(e) => setConfig({
                    ...config,
                    notifyAllSuccess: e.target.checked,
                  })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Send notifications for all successful invoices
                </span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </AdminOnly>
  );
}