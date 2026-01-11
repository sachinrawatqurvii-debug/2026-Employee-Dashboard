import { useState } from "react";
import { useGlobalContext } from "./ProductContext";

const OrderDashboard = () => {

  const { scanTracking2, orders, loading, styleLoading } = useGlobalContext();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");


// Fetch orders 

  const fetchOrders = async () => {
    setStyleLoading(true);
    try {
      let allOrders = [];
      const totalBatches = Math.ceil(MAX_RECORDS / BATCH_SIZE);

      for (let i = 0; i < totalBatches; i++) {
        const response = await fetch(
          `https://nocodb.qurvii.com/api/v2/tables/m5rt138j272atfc/records?offset=${
            i * BATCH_SIZE
          }&limit=${BATCH_SIZE}&viewId=vwi961elxbm8g0gr`,
          { method: "GET", headers: API_HEADERS }
        );

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        allOrders = [...allOrders, ...(data.list || [])];

        if (allOrders.length >= MAX_RECORDS) break;
      }

      setOrders(allOrders);
      setError(null);
    } catch (error) {
      console.error("Error fetching Orders:", error);
      setError("Failed to load orders data");
    } finally {
      setStyleLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return null;
    const parsedDate = new Date(date);
    return isNaN(parsedDate) ? null : parsedDate.toISOString().split("T")[0];
  };

  const isWithinDateRange = (date) => {
    const formattedDate = formatDate(date);
    if (!formattedDate) return false;
    const start = startDate ? formatDate(startDate) : null;
    const end = endDate ? formatDate(endDate) : null;
    return (!start || formattedDate >= start) && (!end || formattedDate <= end);
  };

  const filteredOrders = orders.filter((order) => isWithinDateRange(order.created_at));
  const filteredTracking = scanTracking2.filter((track) => isWithinDateRange(track.date));

  const totalOrders = filteredOrders.length;
  const foundInInventory = filteredOrders.filter(order => order.status === "shipped").length;
  const cutting = filteredOrders.filter(order => order.status === "pending").length;
  const cancelled = filteredOrders.filter(order => order.status === "cancel").length;

  const shippingOrderIds = new Set(
    scanTracking2
      .filter((track) => track.locations?.name?.includes("Shipping Table"))
      .map((track) => track.order_id)
  );
  const ship = filteredOrders.filter(order => shippingOrderIds.has(order.order_id)).length;

  const portals = ["Myntra", "Ajio", "TataCliq", "ShoppersStop", "Nykaa", "Shopify"];
  const portalStats = portals.map((portal) => {
    const ordersByPortal = filteredOrders.filter(order => order.channel.includes(portal)).length;
    const inventoryByPortal = filteredOrders.filter(order => order.status === "shipped" && order.channel.includes(portal)).length;
    const cuttingByPortal = filteredOrders.filter(order => order.status === "pending" && order.channel.includes(portal)).length;
    const cancelledByPortal = filteredOrders.filter(order => order.status === "cancel" && order.channel.includes(portal)).length;
    const shipByPortal = filteredOrders.filter(order => shippingOrderIds.has(order.order_id) && order.channel.includes(portal)).length;
    return { portal, ordersByPortal, inventoryByPortal, cuttingByPortal, cancelledByPortal, shipByPortal };
  });

  if (styleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Order Status</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
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
                    Portal
                  </th>
                  {portals.map((portal) => (
                    <th key={portal} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {portal}
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {["Orders", "Inventory", "Cutting", "Shipped","Canceled"].map((type, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {type}
                    </td>
                    {portalStats.map((stat, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                        {type === "Orders" ? stat.ordersByPortal : 
                         type === "Inventory" ? stat.inventoryByPortal : 
                         type === "Cutting" ? stat.cuttingByPortal : 
                         type === "Shipped" ? stat.shipByPortal + stat.inventoryByPortal :
                         stat.cancelledByPortal}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {type === "Orders" ? totalOrders :
                         type === "Inventory" ? foundInInventory :
                         type === "Cutting" ? cutting : 
                         type === "Shipped" ? ship + foundInInventory: 
                          cancelled

                         }
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
          <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium">In Inventory</h3>
          <p className="text-2xl font-bold text-gray-800">{foundInInventory}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm font-medium">In Cutting</h3>
          <p className="text-2xl font-bold text-gray-800">{cutting}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm font-medium">Shipped</h3>
          <p className="text-2xl font-bold text-gray-800">{ship + foundInInventory}</p>
        </div>
      </div>
    </div>
  );
};

export default OrderDashboard;