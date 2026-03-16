/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Server, Key, BookOpen, Plus, Trash2, Copy, Check, Terminal, Activity } from 'lucide-react';

type Service = {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: string;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'services' | 'keys' | 'docs'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
    fetchKeys();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setServices(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      setApiKeys(data);
    } catch (e) {
      console.error(e);
    }
  };

  const generateKey = async () => {
    try {
      const res = await fetch('/api/keys', { method: 'POST' });
      const data = await res.json();
      setApiKeys([...apiKeys, data.key]);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteKey = async (key: string) => {
    try {
      await fetch(`/api/keys/${key}`, { method: 'DELETE' });
      setApiKeys(apiKeys.filter(k => k !== key));
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-6 border-b border-zinc-200 flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-semibold text-lg tracking-tight">Nexus Gateway</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('services')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'services' ? 'bg-zinc-100 text-black' : 'text-zinc-600 hover:bg-zinc-50 hover:text-black'
            }`}
          >
            <Server className="w-4 h-4" />
            Services
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'keys' ? 'bg-zinc-100 text-black' : 'text-zinc-600 hover:bg-zinc-50 hover:text-black'
            }`}
          >
            <Key className="w-4 h-4" />
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'docs' ? 'bg-zinc-100 text-black' : 'text-zinc-600 hover:bg-zinc-50 hover:text-black'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Documentation
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-8">
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Available Services</h2>
                <p className="text-zinc-500 mt-1">Internal microservices accessible via the API Gateway.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(service => (
                  <div key={service.id} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-lg">{service.name}</h3>
                        <p className="text-sm text-zinc-500 mt-1">{service.description}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 text-xs font-medium rounded-md uppercase tracking-wider">
                        {service.method}
                      </span>
                    </div>
                    <div className="mt-6">
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg p-2">
                        <Terminal className="w-4 h-4 text-zinc-400" />
                        <code className="text-sm font-mono text-zinc-700 flex-1">{service.endpoint}</code>
                        <button 
                          onClick={() => copyToClipboard(service.endpoint)}
                          className="p-1.5 text-zinc-400 hover:text-black transition-colors"
                        >
                          {copiedKey === service.endpoint ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">API Keys</h2>
                  <p className="text-zinc-500 mt-1">Manage your access keys for the API Gateway.</p>
                </div>
                <button
                  onClick={generateKey}
                  className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Generate Key
                </button>
              </div>
              
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-3 font-medium text-zinc-500">Key</th>
                      <th className="px-6 py-3 font-medium text-zinc-500">Status</th>
                      <th className="px-6 py-3 font-medium text-zinc-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {apiKeys.map(key => (
                      <tr key={key} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-zinc-700">{key}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => copyToClipboard(key)}
                              className="p-2 text-zinc-400 hover:text-black transition-colors rounded-md hover:bg-zinc-100"
                              title="Copy Key"
                            >
                              {copiedKey === key ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => deleteKey(key)}
                              className="p-2 text-zinc-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
                              title="Revoke Key"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {apiKeys.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                          No API keys found. Generate one to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Documentation</h2>
                <p className="text-zinc-500 mt-1">Learn how to integrate with the Nexus API Gateway.</p>
              </div>
              
              <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm space-y-8">
                <section>
                  <h3 className="text-lg font-medium mb-3">Authentication</h3>
                  <p className="text-zinc-600 text-sm mb-4">
                    All requests to the gateway must include an API key. You can pass the key using the <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800">x-api-key</code> header.
                  </p>
                  <div className="bg-zinc-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-zinc-300 font-mono">
{`curl -X GET ${window.location.origin}/gateway/random \\
  -H "x-api-key: your_api_key_here"`}
                    </pre>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-medium mb-3">Example: AI Text Generation</h3>
                  <p className="text-zinc-600 text-sm mb-4">
                    Call the AI service to generate text using Gemini.
                  </p>
                  <div className="bg-zinc-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-zinc-300 font-mono">
{`fetch('${window.location.origin}/gateway/ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your_api_key_here'
  },
  body: JSON.stringify({
    prompt: 'Write a haiku about coding.'
  })
})
.then(res => res.json())
.then(console.log);`}
                    </pre>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
