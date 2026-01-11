import { useState } from "react";
import { useGlobalContext } from "./ProductContext";

const DateWiseOrderDashboard = () => {
  const { scanTracking2, orders, loading, styleLoading } = useGlobalContext();
  const [selectedPortal, setSelectedPortal] = useState("All");

  const formatDate = (date) => {
    if (!date) return null;
    const parsedDate = new Date(date);
    return isNaN(parsedDate) ? null : parsedDate.toISOString().split("T")[0];
  };

  // Group orders by date
  const ordersByDate = orders.reduce((acc, order) => {
    const date = formatDate(order.created_at);
    if (!date) return acc;
    
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(order);
    return acc;
  }, {});

  // Group tracking data by date
  const trackingByDate = scanTracking2.reduce((acc, track) => {
    const date = formatDate(track.date);
    if (!date) return acc;
    
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(track);
    return acc;
  }, {});

  // Get all unique dates sorted in descending order (newest first)
  const allDates = [...new Set([
    ...Object.keys(ordersByDate),
    ...Object.keys(trackingByDate)
  ])].sort((a, b) => new Date(b) - new Date(a));

  const portals = ["All", "Myntra", "Ajio", "TataCliq", "ShoppersStop", "Nykaa", "Shopify"];

  if (styleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Date-wise Order Status</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Portal</label>
            <select
              value={selectedPortal}
              onChange={(e) => setSelectedPortal(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {portals.map(portal => (
                <option key={portal} value={portal}>{portal}</option>
              ))}
            </select>
          </div>
        </div>

        {styleLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Orders
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In Inventory
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In Cutting
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shipped
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Canceled
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allDates.map((date,index) => {
                  // Filter orders for the date and selected portal
                  const dateOrders = (ordersByDate[date] || []).filter(order => 
                    selectedPortal === "All" || order.channel.includes(selectedPortal)
                  );
                  
                  // Filter tracking for the date
                  const dateTracking = trackingByDate[date] || [];
                  
                  const totalOrders = dateOrders.length;
                  const foundInInventory = dateOrders.filter(order => order.status === "shipped").length;
                  const cutting = dateOrders.filter(order => order.status === "pending").length;
                  const cancelled = dateOrders.filter(order => order.status === "cancel").length;

                  const shippingOrderIds = new Set(
                    dateTracking
                      .filter((track) => track.locations?.name?.includes("Shipping Table"))
                      .map((track) => track.order_id)
                  );
                  const ship = dateOrders.filter(order => shippingOrderIds.has(order.order_id)).length;

                  return (
                    <tr  key={date} className={`hover:bg-blue-100 cursor-pointer   ${index % 2 == 0 ? "bg-blue-50":""} `}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                        {totalOrders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                        {foundInInventory}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                        {cutting}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                        {ship + foundInInventory}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                        {cancelled}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateWiseOrderDashboard;