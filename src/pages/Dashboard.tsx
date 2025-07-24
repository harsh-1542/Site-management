import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Package, DollarSign, TrendingUp, Cloud, Bell, Clock, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [weather, setWeather] = useState({ temp: 28, condition: 'Sunny' });
  const [notifications, setNotifications] = useState([]);

  // Mock data - in real app this would come from API
  const stats = {
    activeSites: 12,
    totalStockValue: 45000,
    totalPurchaseCost: 120000,
    lowStockItems: 8
  };

  const recentActivity = [
    { site: 'Luxury Villa - Mumbai', action: 'Added 20 units of Premium Wood', time: '2 hours ago', type: 'stock' },
    { site: 'Office Complex - Delhi', action: 'Assigned 15 units of Steel Frame', time: '4 hours ago', type: 'assignment' },
    { site: 'Residential Project - Pune', action: 'Updated stock for Marble Tiles', time: '6 hours ago', type: 'update' },
  ];

  const projectProgress = [
    { name: 'Luxury Villa', progress: 75, status: 'On Track' },
    { name: 'Office Complex', progress: 45, status: 'Delayed' },
    { name: 'Residential Project', progress: 90, status: 'Ahead' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Smart Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Real-time insights for your construction projects</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm">
              <Cloud className="h-5 w-5 text-blue-500" />
              <span className="text-gray-700">{weather.temp}°C</span>
            </div>
            <div className="relative">
              <Bell className="h-6 w-6 text-gray-600 cursor-pointer hover:text-blue-500 transition-colors" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards with 3D Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
              <Building2 className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSites}</div>
              <p className="text-xs text-blue-100">+2 from last month</p>
            </CardContent>
          </Card>

          <Card className="transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
              <Package className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalStockValue.toLocaleString()}</div>
              <p className="text-xs text-green-100">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchase Cost</CardTitle>
              <DollarSign className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalPurchaseCost.toLocaleString()}</div>
              <p className="text-xs text-purple-100">Across all sites</p>
            </CardContent>
          </Card>

          <Card className="transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <TrendingUp className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowStockItems}</div>
              <p className="text-xs text-orange-100">Items need restocking</p>
            </CardContent>
          </Card>
        </div>

        {/* Project Progress and Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Progress */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>Project Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {projectProgress.map((project, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{project.name}</span>
                      <span className={`text-sm ${
                        project.status === 'On Track' ? 'text-green-500' :
                        project.status === 'Delayed' ? 'text-red-500' :
                        'text-blue-500'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          project.status === 'On Track' ? 'bg-green-500' :
                          project.status === 'Delayed' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity with Timeline */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="relative pl-8 pb-6 last:pb-0">
                    <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    <div className="absolute left-2 top-4 bottom-0 w-0.5 bg-gray-200" />
                    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <p className="font-medium text-gray-900">{activity.site}</p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
