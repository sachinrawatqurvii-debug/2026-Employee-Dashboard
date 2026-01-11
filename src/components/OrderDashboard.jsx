import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { CSVLink } from "react-csv";

const OrderDashboard = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [timeRange, setTimeRange] = useState("today");
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [displayedOrders, setDisplayedOrders] = useState([]);
  const [scanTracking2, setScanTracking2] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [exportData, setExportData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");

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
        end.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case "last3days":
        start.setDate(start.getDate() - 3);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "lastWeek":
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case "thisWeek":
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "thisMonth":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "lastMonth":
        start.setMonth(start.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case "last2Months":
        start.setMonth(start.getMonth() - 2, 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "last3Months":
        start.setMonth(start.getMonth() - 3, 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "last6Months":
        start.setMonth(start.getMonth() - 6, 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "lastYear":
        start.setFullYear(start.getFullYear() - 1, 0, 1);
        start.setHours(0, 0, 0, 0);
        end.setFullYear(end.getFullYear() - 1, 11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setStartTime("00:00");
    setEndTime("23:59");
  }, [timeRange]);

  // Apply all filters whenever any filter changes
  useEffect(() => {
    if (orders.length === 0) return;
    
    setIsFiltering(true);
    try {
      // Create start and end datetime objects
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      let filtered = orders.filter((order) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startDateTime && orderDate <= endDateTime;
      });

      // Then filter by search term if exists
      if (searchTerm.trim()) {
        filtered = filtered.filter(order => 
          order.style_number?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setFilteredOrders(filtered);
      prepareExportData(filtered);
      setCurrentPage(1); // Reset to first page when filters change
    } catch (error) {
      console.error("Filtering error:", error);
      setError("Failed to filter orders: " + error.message);
    } finally {
      setIsFiltering(false);
    }
  }, [orders, startDate, endDate, startTime, endTime, searchTerm]);

  // Update displayed orders when pagination or filtered orders change
  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setDisplayedOrders(filteredOrders.slice(indexOfFirstItem, indexOfLastItem));
  }, [filteredOrders, currentPage, itemsPerPage]);

  const fetchOrders = async () => {
    setError("");
    setOrders([]);
    setFilteredOrders([]);
    setIsLoading(true);
    setProgress(0);

    try {
      let whereClause = "";
      
      if (startDate && endDate) {
        const startDateTime = `${startDate}T00:00:00`;
        const endDateTime = `${endDate}T23:59:59`;
        whereClause = `(created_at,ge,exactDate,${startDateTime})~and(created_at,le,exactDate,${endDateTime})`;
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

          if (res.data.pageInfo && res.data.pageInfo.totalRows) {
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
      'Items': order.items_count,
      'Style Number': order.style_number,
      'Size': order.size
    }));
    setExportData(data);
  };

  // Pagination
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Stats calculation
  const stats = useMemo(() => {
    const totalOrders = filteredOrders.filter((order)=>!order.channel?.toLowerCase()?.includes("return") && !order.channel?.toLowerCase()?.includes("new")).length;
    const foundInInventory = filteredOrders.filter(order => order.status === "shipped").length;
    const cutting = filteredOrders.filter(order => order.status === "pending" && !order.channel.toLowerCase().includes("new")&& !order.channel.toLowerCase().includes("return")).length;
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

    return {
      totalOrders,
      foundInInventory,
      cutting,
      cancelled,
      ship,
      portalStats
    };
  }, [filteredOrders, scanTracking2]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Order Dashboard</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Filter Controls Section */}
        <div className="space-y-4 mb-6">
          {/* Time Range Selector */}
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
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

          {/* Date Range Picker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
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
            <div>
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
          </div>

          {/* Time Range Picker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setTimeRange("custom");
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setTimeRange("custom");
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Search by Style Number */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search by Style Number</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter style number..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Fetch Orders
                </>
              )}
            </button>
            
            {exportData.length > 0 && (
              <CSVLink 
                data={exportData} 
                filename={`orders_${startDate}_${startTime}_to_${endDate}_${endTime}.csv`}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export to CSV
              </CSVLink>
            )}
          </div>
        </div>

        {/* Loading Indicator */}
        {(isLoading || isFiltering) && (
          <div className="mb-6">
            <div className="flex justify-between mb-1 text-sm font-medium text-gray-700">
              <span>{isLoading ? "Fetching data..." : "Filtering data..."}</span>
              {isLoading && <span>{progress}%</span>}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${isLoading ? progress : 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 rounded-lg flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Data Table */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portal</th>
                  {stats.portalStats.map((portal) => (
                    <th key={portal.portal} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {portal.portal}
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {["Orders", "Inventory", "Cutting", "Shipped", "Canceled"].map((type, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type}</td>
                    {stats.portalStats.map((stat, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                        {type === "Orders" ? stat.ordersByPortal :
                          type === "Inventory" ? stat.inventoryByPortal :
                            type === "Cutting" ? stat.cuttingByPortal :
                              type === "Shipped" ? stat.shipByPortal + stat.inventoryByPortal :
                                stat.cancelledByPortal}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {type === "Orders" ? stats.totalOrders :
                          type === "Inventory" ? stats.foundInInventory :
                            type === "Cutting" ? stats.cutting :
                              type === "Shipped" ? stats.ship + stats.foundInInventory :
                                stats.cancelled}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredOrders.length === 0 && orders.length > 0 && (
          <div className="p-4 text-center text-gray-500">
            No orders match the selected filters.
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
              <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">In Inventory</h3>
              <p className="text-2xl font-bold text-gray-800">{stats.foundInInventory}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">In Cutting</h3>
              <p className="text-2xl font-bold text-gray-800">{stats.cutting}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Shipped</h3>
              <p className="text-2xl font-bold text-gray-800">{stats.ship + stats.foundInInventory}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Details Container */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Details</h2>
        
        {/* Search and Pagination Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <div className="w-full md:w-1/3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by style number..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {filteredOrders.length > itemsPerPage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 py-2 px-4 text-left">Order ID</th>
                <th className="border border-gray-200 py-2 px-4 text-left">Style Number</th>
                <th className="border border-gray-200 py-2 px-4 text-left">Size</th>
                <th className="border border-gray-200 py-2 px-4 text-left">Channel</th>
                <th className="border border-gray-200 py-2 px-4 text-left">Status</th>
                <th className="border border-gray-200 py-2 px-4 text-left">Created At</th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders
                .filter(order => !order.channel?.toLowerCase()?.includes("return") && !order.channel?.toLowerCase()?.includes("new"))
                .map((order, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 py-2 px-4">{order.order_id}</td>
                    <td className="border border-gray-200 py-2 px-4">{order.style_number}</td>
                    <td className="border border-gray-200 py-2 px-4">{order.size}</td>
                    <td className="border border-gray-200 py-2 px-4">{order.channel}</td>
                    <td className="border border-gray-200 py-2 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "shipped" ? "bg-green-100 text-green-800" :
                        order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        order.status === "cancel" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="border border-gray-200 py-2 px-4">{new Date(order.created_at).toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination at bottom */}
        {filteredOrders.length > itemsPerPage && (
          <div className="flex justify-center mt-4">
            <nav className="inline-flex rounded-md shadow">
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                First
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`px-3 py-1 border-t border-b border-gray-300 bg-white text-sm font-medium ${
                      currentPage === pageNum
                        ? "bg-blue-50 text-blue-600 border-blue-500"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Last
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDashboard;