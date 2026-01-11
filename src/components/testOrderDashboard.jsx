import { useState, useEffect } from "react";
import axios from "axios";
import { CSVLink } from "react-csv";

const OrderDashboard = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [timeRange, setTimeRange] = useState("custom");
  const [orders, setOrders] = useState([]);
  const [scanTracking2, setScanTracking2] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [exportData, setExportData] = useState([]);

  // Predefined time ranges
  const timeRanges = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "last3days", label: "Last 3 Days" },
    { value: "lastWeek", label: "Last Week" },
    { value: "thisWeek", label: "This Week" },
    { value: "thisMonth", label: "This Month" },
    { value: "lastMonth", label: "Last Month" },
    { value: "last2Months", label: "Last 2 Months" },
    { value: "last3Months", label: "Last 3 Months" },
    { value: "last6Months", label: "Last 6 Months" },
    { value: "lastYear", label: "Last Year" },
    { value: "custom", label: "Custom Range" },
  ];

  // Calculate dates based on time range selection
  useEffect(() => {
    if (timeRange === "custom") return;

    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (timeRange) {
      case "today":
        start.setHours(0, 0, 0, 0);
        setStartTime("00:00");
        setEndTime("23:59");
        break;
      case "yesterday":
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        setStartTime("00:00");
        setEndTime("23:59");
        break;
      case "last3days":
        start.setDate(start.getDate() - 3);
        start.setHours(0, 0, 0, 0);
        setStartTime("00:00");
        setEndTime("23:59");
        break;
      case "lastWeek":
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        setStartTime("00:00");
        setEndTime("23:59");
        break;
      case "thisWeek":
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        setStartTime("00:00");
        setEndTime("23:59");
        break;
      case "thisMonth":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        setStartTime("00:00");
        setEndTime("23:59");
        break;
      case "lastMonth":
        start.setMonth(start.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        setStartTime("00:00");
        setEndTime("23:59");
        break;
      case "last2Months":
        start.setMonth(start.getMonth() - 2, 1);
        start.setHours(0, 0, 0, 0);
        setStartTime("00:00");
        setEndTime("23:59");
        break;
      case "last3Months":
        start.setMonth(start.getMonth() - 3, 1);
        start.setHours(0, 0, 0, 0);
        setStartTime("00:00");
        setEndTime("23:59");
        break;
      case "last6Months":
        start.setMonth(start.getMonth() - 6, 1);
        start.setHours(0, 0, 0, 0);
        setStartTime("00:00");
        setEndTime("23:59");
        break;
      case "lastYear":
        start.setFullYear(start.getFullYear() - 1, 0, 1);
        start.setHours(0, 0, 0, 0);
        end.setFullYear(end.getFullYear() - 1, 11, 31);
        end.setHours(23, 59, 59, 999);
        setStartTime("00:00");
        setEndTime("23:59");
        break;
      default:
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(timeRange === "today" || timeRange === "thisWeek" || timeRange === "thisMonth" || 
               timeRange === "last3days" || timeRange === "last2Months" || 
               timeRange === "last3Months" || timeRange === "last6Months" 
               ? now.toISOString().split('T')[0] : end.toISOString().split('T')[0]);
  }, [timeRange]);

  // const fetchOrders = async () => {
  //   setError("");
  //   setOrders([]);
  //   setIsLoading(true);
  //   setProgress(0);

  //   try {
  //     let whereClause = "";

  //     // Date range condition with time
  //     if (startDate && endDate) {
  //       const startDateTime = `${startDate} ${startTime}:00`;
  //       const endDateTime = `${endDate} ${endTime}:59`;
        
  //       // For same day, we need to use datetime comparison
  //       if (startDate === endDate) {
  //         whereClause = `(created_at,ge,exactDate,${startDateTime})~and(created_at,le,exactDate,${endDateTime})`;
  //       } else {
  //         whereClause = `(created_at,ge,exactDate,${startDateTime})~and(created_at,le,exactDate,${endDateTime})`;
  //       }
  //     } else if (startDate) {
  //       const startDateTime = `${startDate} ${startTime}:00`;
  //       whereClause = `(created_at,ge,exactDate,${startDateTime})`;
  //     } else if (endDate) {
  //       const endDateTime = `${endDate} ${endTime}:59`;
  //       whereClause = `(created_at,le,exactDate,${endDateTime})`;
  //     }

  //     let allOrders = [];
  //     let offset = 0;
  //     const limit = 1000;
  //     let hasMore = true;
  //     let totalFetched = 0;

  //     while (hasMore) {
  //       const options = {
  //         method: "GET",
  //         url: "https://nocodb.qurvii.com/api/v2/tables/m5rt138j272atfc/records",
  //         params: {
  //           limit: limit.toString(),
  //           offset: offset.toString(),
  //           where: whereClause || undefined,
  //         },
  //         headers: {
  //           "xc-token": "LsOnEY-1wS4Nqjz15D1_gxHu0pFVcmA_5LNqCAqK",
  //         },
  //       };

  //       const res = await axios.request(options);

  //       if (res.data.list && res.data.list.length > 0) {
  //         allOrders = [...allOrders, ...res.data.list];
  //         offset += res.data.list.length;
  //         totalFetched += res.data.list.length;

  //         // Update progress
  //         if (res.data.pageInfo && res.data.pageInfo.totalRows) {
  //           setProgress(Math.min(100, Math.round((totalFetched / res.data.pageInfo.totalRows) * 100)));
  //         }

  //         if (res.data.list.length < limit) {
  //           hasMore = false;
  //         }
  //       } else {
  //         hasMore = false;
  //       }
  //     }

  //     setOrders(allOrders);
  //     prepareExportData(allOrders);

  //     if (allOrders.length === 0) {
  //       setError(`No orders found for the selected date range.`);
  //     }
  //   } catch (error) {
  //     console.error("API Error:", error);
  //     setError(`Failed to fetch orders: ${error.response?.data?.message || error.message}`);
  //   } finally {
  //     setIsLoading(false);
  //     setProgress(0);
  //   }
  // };

  const fetchOrders = async () => {
  setError("");
  setOrders([]);
  setIsLoading(true);
  setProgress(0);

  try {
    let whereClause = "";

    // Date range condition with time (formatted correctly for NocoDB)
    if (startDate && endDate) {
      const startDateTime = `${startDate} ${startTime}:00`;
      const endDateTime = `${endDate} ${endTime}:59`;

      whereClause = `(created_at,ge,${startDateTime})~and(created_at,le,${endDateTime})`;
    } else if (startDate) {
      const startDateTime = `${startDate} ${startTime}:00`;
      whereClause = `(created_at,ge,${startDateTime})`;
    } else if (endDate) {
      const endDateTime = `${endDate} ${endTime}:59`;
      whereClause = `(created_at,le,${endDateTime})`;
    }

    let allOrders = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    let totalFetched = 0;

    while (hasMore) {
      const options = {
        method: "GET",
        url: "https://nocodb.qurvii.com/api/v2/tables/m5rt138j272atfc/records",
        params: {
          limit: limit.toString(),
          offset: offset.toString(),
          where: whereClause || undefined,
        },
        headers: {
          "xc-token": "LsOnEY-1wS4Nqjz15D1_gxHu0pFVcmA_5LNqCAqK",
        },
      };

      const res = await axios.request(options);

      if (res.data.list && res.data.list.length > 0) {
        allOrders = [...allOrders, ...res.data.list];
        offset += res.data.list.length;
        totalFetched += res.data.list.length;

        // Update progress bar
        if (res.data.pageInfo?.totalRows) {
          setProgress(Math.min(100, Math.round((totalFetched / res.data.pageInfo.totalRows) * 100)));
        }

        if (res.data.list.length < limit) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    setOrders(allOrders);
    prepareExportData(allOrders);

    if (allOrders.length === 0) {
      setError(`No orders found for the selected date range.`);
    }
  } catch (error) {
    console.error("API Error:", error);
    setError(`Failed to fetch orders: ${error.response?.data?.message || error.message}`);
  } finally {
    setIsLoading(false);
    setProgress(0);
  }
};


  const prepareExportData = (orders) => {
    const data = orders.map(order => ({
      'Order ID': order.order_id,
      'Channel': order.channel,
      'Status': order.status,
      'Created At': order.created_at,
      'Amount': order.amount,
      'Customer': order.customer_name,
      'Items': order.items_count
    }));
    setExportData(data);
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

  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.created_at);
    const startDateTime = new Date(`${startDate} ${startTime}`);
    const endDateTime = new Date(`${endDate} ${endTime}`);
    
    return orderDate >= startDateTime && orderDate <= endDateTime;
  });

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
    const ordersByPortal = filteredOrders.filter(order => order.channel?.includes(portal)).length;
    const inventoryByPortal = filteredOrders.filter(order => order.status === "shipped" && order.channel?.includes(portal)).length;
    const cuttingByPortal = filteredOrders.filter(order => order.status === "pending" && order.channel?.includes(portal)).length;
    const cancelledByPortal = filteredOrders.filter(order => order.status === "cancel" && order.channel?.includes(portal)).length;
    const shipByPortal = filteredOrders.filter(order => shippingOrderIds.has(order.order_id) && order.channel?.includes(portal)).length;
    return { portal, ordersByPortal, inventoryByPortal, cuttingByPortal, cancelledByPortal, shipByPortal };
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Order Status</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setTimeRange("custom");
              }}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={timeRange !== "custom"}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setTimeRange("custom");
              }}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={timeRange !== "custom"}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Filter'}
          </button>
          
          {exportData.length > 0 && (
            <CSVLink 
              data={exportData} 
              filename={`orders_${startDate}_${startTime}_to_${endDate}_${endTime}.csv`}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export to CSV
            </CSVLink>
          )}
        </div>

        {isLoading && (
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Loading data...</span>
              <span className="text-sm font-medium text-gray-700">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Portal</th>
                  {portals.map((portal) => (
                    <th key={portal} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      {portal}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {["Orders", "Inventory", "Cutting", "Shipped", "Canceled"].map((type, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{type}</td>
                    {portalStats.map((stat, i) => (
                      <td key={i} className="px-6 py-4 text-sm text-center text-gray-500">
                        {type === "Orders" ? stat.ordersByPortal :
                          type === "Inventory" ? stat.inventoryByPortal :
                            type === "Cutting" ? stat.cuttingByPortal :
                              type === "Shipped" ? stat.shipByPortal + stat.inventoryByPortal :
                                stat.cancelledByPortal}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {type === "Orders" ? totalOrders :
                          type === "Inventory" ? foundInInventory :
                            type === "Cutting" ? cutting :
                              type === "Shipped" ? ship + foundInInventory :
                                cancelled}
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