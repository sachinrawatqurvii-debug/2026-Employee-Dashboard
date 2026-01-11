import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const DateFilterNocoDB = () => {
  const [location, setLocation] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState("");
  const [date, setDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [stylewiseData, setStyleWiseData] = useState([]);


  const fetchStyleWiseData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("https://stylewise-backend-uqx8.onrender.com/api/v1/stylewise/regular-style/all-styles");
      setStyleWiseData(response.data.data);
    } catch (error) {
      console.log("Failed to fetch styleswise data error :: ", error);
    } finally {
      setLoading(false);
    }
  }


  const locationTypes = [
    "All Locations",
    "Cutting Master",
    "Kharcha",
    "Return Checking",
    "Dhaga Cutting",
    "Kaaj",
    "Tailor",
    "Store Helper",
    "Final Checking",
    "Cutting Helper",
    "Shipping Table",
    "Inventory Table"
  ];



  const fetchLocation = async () => {
    setError("");
    setLocation([]);
    setLoading(true);

    try {
      let whereClause = "";

      // ✅ Date filter
      if (startDate && endDate) {
        whereClause = `(scanned_timestamp,gt,exactDate,${startDate})~and(scanned_timestamp,lt,exactDate,${endDate})`;
      } else if (date) {
        // Single exact date
        whereClause = `(scanned_timestamp,eq,exactDate,${date})`;
      }

      // ✅ Channel filter
      if (channel && channel !== "All Channels") {
        whereClause += whereClause
          ? `~and(orders_2.channel,eq,${channel})`
          : `(orders_2.channel,eq,${channel})`;
      }

      console.log("Final whereClause:", whereClause);



      let allRecords = [];
      let offset = 0;
      const limit = 1000; // Max records per request
      let hasMore = true;
      while (hasMore) {
        const options = {
          method: "GET",
          url: "https://nocodb.qurvii.com/api/v2/tables/mhhxiprapvyqjtf/records",
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
          allRecords = [...allRecords, ...res.data.list];
          offset += res.data.list.length;

          // Check if we got fewer records than requested (end of data)
          if (res.data.list.length < limit) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      setLocation(allRecords);
      if (allRecords.length === 0) {
        setError(
          `No records found for the selected filters. Query used: ${whereClause}`
        );
      }
    } catch (error) {
      console.error("API Error:", error);
      setError(
        `Failed to fetch: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date || (endDate, startDate)) {
      fetchLocation();
      fetchStyleWiseData();
    }
  }, [date, channel]);

  const fetchRecordsByDateRange = () => {
    fetchLocation();
    fetchStyleWiseData();
  }

  const exportToCSV = () => {
    const filteredData = filterData();
    const csvData = filteredData.map((order) => {
      return {
        "Order ID": order.order_id,
        "Style Number": order?.orders_2?.style_number || "N/A",
        // Channel: order?.orders_2?.channel || "N/A",
        Employee: order?.employees?.user_name.split(" / ")[0] || "N/A",
        Location: order?.locations?.name || "N/A",
        "Scan Timestamp": order.scanned_timestamp || "N/A",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "orders_report.xlsx");
  };


  const filterData = () => {
    let result = [...location];

    // Filter by location
    if (locationFilter && locationFilter !== "All Locations") {
      result = result.filter((item) =>
        item.locations?.name?.includes(locationFilter)
      );
    }

    // Filter by employee name
    if (employeeSearch) {
      result = result.filter((item) =>
        item.employees?.user_name
          ?.toLowerCase()
          .includes(employeeSearch.toLowerCase())
      );
    }

    // Remove duplicates based on order_id
    // const uniqueOrdersMap = new Map();
    // result.forEach(item => {
    //   if (item.order_id && !uniqueOrdersMap.has(item.order_id)) {
    //     uniqueOrdersMap.set(item.order_id, item);
    //   }
    // });

    // return Array.from(uniqueOrdersMap.values());
    return result
  };
  const getStats = () => {
    const filteredData = filterData();

    // Count unique order_ids per employee
    const employeeOrderCounts = filteredData.reduce((acc, item) => {
      const employee = item.employees?.user_name || "Unknown";
      if (!acc[employee]) {
        acc[employee] = new Set();
      }
      acc[employee].add(item.order_id);
      return acc;
    }, {});

    // Convert to count of unique orders per employee
    const employeeCounts = Object.entries(employeeOrderCounts).reduce((acc, [employee, orderSet]) => {
      acc[employee] = orderSet.size;
      return acc;
    }, {});

    // Count UNIQUE order_ids per location (updated)
    const locationOrderCounts = filteredData.reduce((acc, item) => {
      const loc = item.locations?.name || "Unknown";
      if (!acc[loc]) {
        acc[loc] = new Set();
      }
      acc[loc].add(item.order_id); // Track unique order_ids per location
      return acc;
    }, {});

    // Convert to count of unique orders per location
    const locationCounts = Object.entries(locationOrderCounts).reduce((acc, [loc, orderSet]) => {
      acc[loc] = orderSet.size;
      return acc;
    }, {});

    // Prepare data for charts
    const employeeChartData = Object.entries(employeeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const locationChartData = Object.entries(locationCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      orderCount: new Set(filteredData.map(item => item.order_id)).size,
      employeeCounts,
      locationCounts, // Now contains unique order counts per location
      employeeChartData,
      locationChartData
    };
  };
  const stats = getStats();
  const filteredData = filterData();

  const matchedDetailsForStyleTypeLiningAndPattern = (styleNumber) => {
    return stylewiseData.find((style) => style.styleNumber === Number(styleNumber));
  }

  console.log(matchedDetailsForStyleTypeLiningAndPattern(15020))


  if (loading) {
    return <p className="text-center mt-10 text-xl animate-pulse">Loading...</p>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Order Tracking Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor and analyze order processing activities
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchLocation}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading...
                </>
              ) : (
                "Refresh Data"
              )}
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <select
                className="w-full border border-gray-300 py-2 px-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                {channels.map((channel, index) => (
                  <option key={index} value={channel}>{channel}</option>
                ))}
              </select>
            </div> */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                onChange={(e) => setDate(e.target.value)}
                value={date}
                className="w-full border border-gray-300 py-2 px-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                className="w-full border border-gray-300 py-2 px-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                {locationTypes.map((loc, index) => (
                  <option key={index} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Employee
              </label>
              <input
                type="text"
                placeholder="Employee name..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full border border-gray-300 py-2 px-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* ******************* date range filter ************************ */}
            <div className="flex gap-3 items-center">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
              />
              <button
                onClick={fetchRecordsByDateRange}
                className="bg-blue-600  hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Fetch
              </button>
            </div>



          </div>
        </div>

        {/* Dashboard Stats */}
        {filteredData.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-medium text-gray-700 mb-4">
                  Total Orders Processed
                </h3>
                <p className="text-4xl font-bold text-blue-600">
                  {stats.orderCount}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Unique order IDs scanned
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-medium text-gray-700 mb-4">
                  Top 10 Employees
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.employeeCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([employee, count]) => (
                      <div key={employee} className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-blue-600 text-sm font-medium">
                            {employee.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">
                              {employee.split(" / ")[0]}{" "}
                            </span>
                            <span className="font-bold">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{
                                width: `${(count /
                                  Math.max(
                                    ...Object.values(stats.employeeCounts)
                                  )) *
                                  100
                                  }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-medium text-gray-700 mb-4">
                  Top Locations
                </h3>
                <div className="space-y-3">
                  {/* {Object.entries(stats.locationCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([loc, count]) => (
                      <div key={loc} className="flex justify-between items-center">
                        <span className="text-sm">{loc?.split(" / ")[0]}</span>
                        <span className="font-bold text-blue-600">{count}</span>
                      </div>
                    ))} */}

                  {Object.entries(stats.locationCounts)
                    .sort((a, b) => b[1] - a[1]) // Sort by count descending
                    .slice(0, 10) // Take top 3
                    .map(([loc, count]) => (
                      <div
                        key={loc}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm">{loc?.split(" / ")[0]}</span>
                        <span className="font-bold text-blue-600">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-medium text-gray-700 mb-4">
                  Employee Activity
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.employeeChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Scans" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div> */}

              {/* <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-medium text-gray-700 mb-4">
                  Location Distribution
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.locationChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {stats.locationChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div> */}
            </div>
          </>
        )}

        {error && (
          <div className="p-4 mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        {filteredData.length > 0 && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-800">Order Scan Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      #
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Order ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Style
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Style Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Lining
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Pattern
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Rate
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Employee
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Location
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Scan Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {record.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.orders_2?.style_number || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {matchedDetailsForStyleTypeLiningAndPattern(record.orders_2?.style_number)?.styleType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {matchedDetailsForStyleTypeLiningAndPattern(record.orders_2?.style_number)?.lining}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {matchedDetailsForStyleTypeLiningAndPattern(record.orders_2?.style_number)?.patternNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {matchedDetailsForStyleTypeLiningAndPattern(record.orders_2?.style_number)?.rate || "NA"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                            <span className="text-blue-600 text-xs font-medium">
                              {record.employees?.user_name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            {record.employees?.user_name.split(" / ")[0] ||
                              "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {record.locations?.name.split(" / ")[0] || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.scanned_timestamp
                          ? new Date(record.scanned_timestamp).toLocaleString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateFilterNocoDB;
