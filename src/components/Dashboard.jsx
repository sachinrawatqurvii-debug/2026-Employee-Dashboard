import { useState, useMemo } from "react";
import { useGlobalContext } from "./ProductContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import Filters from "./Filters";

 function Dashboard() {
  const { scanTracking, styleLoading, orders, loading } = useGlobalContext();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extract unique locations with counts
  const locationsData = useMemo(() => {
    return scanTracking.reduce((acc, order) => {
      if (order.locations?.name) {
        acc[order.locations.name] = (acc[order.locations.name] || 0) + 1;
      }
      return acc;
    }, {});
  }, [scanTracking]);

  const locationEntries = Object.entries(locationsData);
  const totalPages = Math.ceil(locationEntries.length / itemsPerPage);
  const paginatedLocations = locationEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Prepare data for chart
  const chartData = useMemo(() => {
    return locationEntries.map(([location, count]) => ({
      location,
      count,
    }));
  }, [locationEntries]);

  // Calculate shipping table count
  const shippingTableCount = useMemo(() => {
    return scanTracking.filter(order => 
      order.locations?.name?.trim().toLowerCase().includes("shipping table")
    ).length;
  }, [scanTracking]);

  // Get unique order IDs (excluding Returns and New)
  const uniqueOrderIds = useMemo(() => {
    return [...new Set(
      scanTracking
        .filter(item => 
          item.channel !== "Return" && 
          item.channel !== "New" &&
          item.orders_2?.order_id != null
        )
        .map(order => String(order.orders_2.order_id))
    )];
  }, [scanTracking]);

  // Calculate stage counts with proper status matching
  const stageCounts = useMemo(() => {
    const shippedStatuses = ["shipped", "Shipped", "SHIPPED"]; // All possible status variants
    const isShipped = (status) => shippedStatuses.includes(String(status));
    
    return {
      orders: uniqueOrderIds.length,
      foundInInventory: orders.filter(order => 
        uniqueOrderIds.includes(String(order.order_id)) && 
        isShipped(order.status)
      ).length,
      cutting: orders.filter(order => 
        uniqueOrderIds.includes(String(order.order_id)) && 
        String(order.status).toLowerCase() === "pending"
      ).length,
      ship: orders.filter(order => 
        uniqueOrderIds.includes(String(order.order_id)) && 
        isShipped(order.status)
      ).length + shippingTableCount,
    };
  }, [orders, uniqueOrderIds, shippingTableCount]);

  // Process orders to get top styles
  const topStyles = useMemo(() => {
    const uniqueOrders = new Map();
    orders.forEach((order) => {
      if (!uniqueOrders.has(order.order_id)) {
        uniqueOrders.set(order.order_id, {
          style_number: order.style_number,
          size: order.size,
        });
      }
    });

    const styleSizeCount = {};
    uniqueOrders.forEach(({ style_number, size }) => {
      if (!styleSizeCount[style_number]) {
        styleSizeCount[style_number] = {};
      }
      styleSizeCount[style_number][size] =
        (styleSizeCount[style_number][size] || 0) + 1;
    });

    return Object.entries(styleSizeCount)
      .map(([style, sizes]) => ({ style, sizes }))
      .sort((a, b) => {
        const totalA = Object.values(a.sizes).reduce((sum, count) => sum + count, 0);
        const totalB = Object.values(b.sizes).reduce((sum, count) => sum + count, 0);
        return totalB - totalA;
      })
      .slice(0, 10);
  }, [orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-8xl mx-auto">
        <Filters />
        
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className=" mt-5 mb-2 text-3xl font-bold text-gray-800">Employee Tracker Dashboard</h1>
          <p className="text-gray-600">Real-time productivity analytics</p>
        </div>

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h3 className="text-gray-500 font-medium">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-800">{stageCounts.orders}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <h3 className="text-gray-500 font-medium">In Inventory</h3>
            <p className="text-3xl font-bold text-gray-800">{stageCounts.foundInInventory}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <h3 className="text-gray-500 font-medium">In Production</h3>
            <p className="text-3xl font-bold text-gray-800">{stageCounts.cutting}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <h3 className="text-gray-500 font-medium">Ready to Ship</h3>
            <p className="text-3xl font-bold text-gray-800">{stageCounts.ship}</p>
          </div>
        </div> */}

        {/* Location Distribution Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Order Distribution by Location</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="location" 
                  tick={{ fill: '#6b7280' }}
                  tickMargin={10}
                />
                <YAxis 
                  tick={{ fill: '#6b7280' }}
                  tickMargin={10}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#4f46e5" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Location Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Order Count by Location</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Count</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLocations.map(([location, count], index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, locationEntries.length)} of {locationEntries.length} locations
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Top Performing Styles */}
        {/* <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Top Performing Styles</h2>
          </div>
          {styleLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Style Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sizes & Quantity</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topStyles.map(({ style, sizes }, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{style}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {Object.entries(sizes)
                            .sort((a, b) => b[1] - a[1])
                            .map(([size, count], i) => (
                              <div 
                                key={size} 
                                className={`flex justify-between px-3 py-2 rounded ${i % 2 === 0 ? 'bg-gray-50' : ''}`}
                              >
                                <span className="text-sm font-medium text-gray-700">{size}</span>
                                <span className="text-sm text-gray-500">{count}</span>
                              </div>
                            ))}
                          <div className="mt-2 flex justify-between px-3 py-2 bg-blue-50 rounded-md">
                            <span className="text-sm font-bold text-gray-800">Total</span>
                            <span className="text-sm font-bold text-gray-800">
                              {Object.values(sizes).reduce((sum, count) => sum + count, 0)}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div> */}
      </div>
    </div>
  );
}

export default Dashboard