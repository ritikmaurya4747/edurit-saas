import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  CreditCard,
  DollarSign,
  FileText,
  GraduationCap,
  Plus,
  Search,
  Server,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

const PlatformDashboard = () => {
  return (
    <div>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Super Admin Dashboard</h1>
          <p className="text-sm text-gray-600">Centralized control panel for multi-tenant school ERP management.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/tenants-create"
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
            <Plus className="w-4 h-4" /> Create New School
          </Link>
        </div>
      </div>

      {/* 1. SaaS-Level Metrics (KPI Cards) - Breakdown for Users */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Active Schools */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Active Schools</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">48</h3>
            <span className="text-xs text-green-600 font-medium flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +4 this month
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Total MRR / Revenue */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total MRR / Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">₹12,45,000</h3>
            <span className="text-xs text-green-600 font-medium flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +12.5% vs last month
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Students Breakdown */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Students</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">32,400</h3>
            <span className="text-xs text-blue-600 font-medium flex items-center mt-1">
              Across all registered schools
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Total Teachers Breakdown */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Teachers</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">2,450</h3>
            <span className="text-xs text-purple-600 font-medium flex items-center mt-1">
              Active faculty members
            </span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Registered Schools Row-wise Management Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Registered Schools Overview
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search school..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">School Name</th>
                <th className="p-4">Admin Email</th>
                <th className="p-4">Students</th>
                <th className="p-4">Teachers</th>
                <th className="p-4">Plan / Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              <tr>
                <td className="p-4 font-medium text-gray-900">Delhi Public School</td>
                <td className="p-4 text-gray-500">admin@dpsdelhi.com</td>
                <td className="p-4 font-semibold text-gray-800">1,250</td>
                <td className="p-4 font-semibold text-gray-800">95</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 text-xs bg-amber-100 text-amber-800 rounded-full font-medium">Enterprise (Expiring)</span>
                </td>
                <td className="p-4">
                  <button className="text-indigo-600 hover:underline font-medium">Manage School</button>
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-gray-900">St. Xavier&apos;s High School</td>
                <td className="p-4 text-gray-500">principal@xaviers.com</td>
                <td className="p-4 font-semibold text-gray-800">850</td>
                <td className="p-4 font-semibold text-gray-800">60</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">Standard (Payment Due)</span>
                </td>
                <td className="p-4">
                  <button className="text-indigo-600 hover:underline font-medium">Manage School</button>
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-gray-900">Ryan International</td>
                <td className="p-4 text-gray-500">support@ryan.com</td>
                <td className="p-4 font-semibold text-gray-800">2,100</td>
                <td className="p-4 font-semibold text-gray-800">140</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">Enterprise (Active)</span>
                </td>
                <td className="p-4">
                  <button className="text-indigo-600 hover:underline font-medium">Manage School</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Subscription & Platform Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Subscription Plans Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-indigo-600" /> Subscription Plans
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Free Tier Schools</span>
              <span className="text-sm font-bold text-gray-900">12 Schools</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Standard Plan</span>
              <span className="text-sm font-bold text-gray-900">20 Schools</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Enterprise Plan</span>
              <span className="text-sm font-bold text-gray-900">16 Schools</span>
            </div>
          </div>
        </div>

        {/* Platform Health / System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-indigo-600" /> Platform Infrastructure
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">API Gateway Status</span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 font-semibold rounded">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Database Load (Postgres)</span>
              <span className="text-sm font-bold text-gray-900">32%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Microservices (NestJS)</span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 font-semibold rounded">All Healthy</span>
            </div>
          </div>
        </div>

        {/* Security & Audit Logs Quick View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-indigo-600" /> Security & Audits
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Failed Logins (24h)</span>
                <span className="text-sm font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> 14 Attempts
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Active Admin Sessions</span>
                <span className="text-sm font-bold text-gray-900">6 Sessions</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 py-2 rounded-lg text-sm font-medium transition">
              <FileText className="w-4 h-4" /> View Full Audit Logs
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PlatformDashboard;