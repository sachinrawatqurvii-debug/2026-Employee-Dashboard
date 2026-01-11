import { useState, useEffect } from "react";
import { useGlobalContext } from "./ProductContext";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Filters from "./Filters";

export default function Reports() {
  const { scanTracking, orders, loading } = useGlobalContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [latestScans, setLatestScans] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const itemsPerPage = 100;

  useEffect(() => {
    if (scanTracking.length > 0) {
      const scansByOrder = {};

      scanTracking.forEach((scan) => {
        if (
          !scansByOrder[scan.order_id] ||
          new Date(scan.scanned_timestamp) >
            new Date(scansByOrder[scan.order_id].scanned_timestamp)
        ) {
          scansByOrder[scan.order_id] = scan;
        }
      });

      setLatestScans(Object.values(scansByOrder));
    }
  }, [scanTracking]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const applyDateFilter = (data) => {
    if (!dateRange.startDate && !dateRange.endDate) {
      return data;
    }

    return data.filter(order => {
      const matchingOrder = orders.find(o => o.order_id === order.order_id);
      if (!matchingOrder || !matchingOrder.created_at) return false;

      const createdAt = new Date(matchingOrder.created_at);
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

      // Set time to beginning of day for start date
      if (startDate) startDate.setHours(0, 0, 0, 0);
      
      // Set time to end of day for end date
      if (endDate) endDate.setHours(23, 59, 59, 999);

      // Debug logs to check values
      console.log('Created At:', createdAt);
      console.log('Start Date:', startDate);
      console.log('End Date:', endDate);
      console.log('Passes filter:', 
        (!startDate || createdAt >= startDate) &&
        (!endDate || createdAt <= endDate)
      );

      return (
        (!startDate || createdAt >= startDate) &&
        (!endDate || createdAt <= endDate)
      );
    });
  };

  // Pagination Logic
  const filteredData = applyDateFilter(latestScans);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);

  const toggleSelection = (order) => {
    setSelectedOrders((prev) => {
      const isAlreadySelected = prev.some(
        (selected) => selected.order_id === order.order_id
      );
      return isAlreadySelected
        ? prev.filter((selected) => selected.order_id !== order.order_id)
        : [...prev, order];
    });
  };

  const handleSelectAll = (e) => {
    setSelectedOrders(e.target.checked ? latestScans : []);
  };

  const getScannerName = (order) => {
    try {
      const extractName = (name) => {
        return typeof name === "string" ? name.split(" / ")[0] : "N/A";
      };

      if (order.employees && typeof order.employees === "object") {
        if (order.employees.value && order.employees.value.user_name) {
          return extractName(order.employees.value.user_name);
        }
        if (order.employees.user_name) {
          return extractName(order.employees.user_name);
        }
      }

      if (typeof order.employees === "string") {
        const parsed = JSON.parse(order.employees);
        if (parsed.value && parsed.value.user_name) {
          return extractName(parsed.value.user_name);
        }
        if (parsed.user_name) {
          return extractName(parsed.user_name);
        }
      }

      return "N/A";
    } catch (e) {
      return "N/A";
    }
  };

  const exportToCSV = () => {
    const csvData = filteredData.map((order) => {
      const matchingOrder = orders.find((o) => o.order_id === order.order_id);
      return {
        "Order ID": order.order_id,
        Channel: matchingOrder?.channel || "N/A",
        "Style Number": order.orders_2?.style_number || "N/A",
        Size: matchingOrder?.size || "N/A",
        "Last Scanner": getScannerName(order),
        Location: order.locations?.name || "N/A",
        "Last Scan": order.scanned_timestamp || "N/A",
        "Created At": matchingOrder?.created_at || "N/A",
        Status: order.locations?.name?.includes("Shipping Table")
          ? "Shipped"
          : "Pending",
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

  const exportToPDF = () => {
    if (filteredData.length === 0) {
      alert("Please select at least one order to export!");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Orders Report", 14, 16);
    doc.setFontSize(10);

    const headers = [
      ["Sr.No", "Channel", "Order Id", "Sku", "Scanner", "Location", "Time"],
    ];

    const rows = filteredData
      .filter((item) => !item.locations?.name?.includes("Shipping Table"))
      .map((order, i) => [
        i + 1,
        orders.find((o) => o.order_id === order.order_id)?.channel || "N/A",
        order.order_id || "N/A",
        `${order.orders_2?.style_number}-${
          orders.find((o) => o.order_id === order.order_id)?.size
        }` || "N/A",
        getScannerName(order),
        order.locations?.name?.split(" / ")[0] || "N/A",
        new Date(order.scanned_timestamp).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 25,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: "middle",
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 32 },
        6: { cellWidth: 50 },
      },
      margin: { top: 20 },
    });

    doc.save("orders_report.pdf");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full overflow-x-auto">
      <Filters/>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Order Tracking Report
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Date Range Filter */}
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  min={dateRange.startDate}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                Export to Excel
              </button>
              <button
                onClick={exportToPDF}
                disabled={selectedOrders.length === 0}
                className={`px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
                  selectedOrders.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                Export to PDF
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="text-sm text-gray-600">
            Showing {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, filteredData.length)} of{" "}
            {filteredData.length} records
            {dateRange.startDate || dateRange.endDate ? (
              <span className="text-blue-500 ml-2">
                (Filtered from {latestScans.length})
              </span>
            ) : null}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md border ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
              }`}
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-blue-500 text-white rounded-md">
              {currentPage}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md border ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      selectedOrders.length === latestScans.length &&
                      latestScans.length > 0
                    }
                    className="rounded text-blue-500 focus:ring-blue-400"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Style
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scanner
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Scan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders.map((order, i) => {
                const matchingData = orders.find(item => item.order_id === order.order_id) || {};
                const isSelected = selectedOrders.some(o => o.order_id === order.order_id);
                    
                return (
                  <tr
                    key={`order-${i}`}
                    className={`${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(order)}
                        className="rounded text-blue-500 focus:ring-blue-400"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {indexOfFirstItem + i + 1}
                      {console.log(matchingData)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                      {order.order_id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {matchingData.channel || (
                        <span className="text-gray-300">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {order.orders_2?.style_number || (
                        <span className="text-gray-300">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {matchingData.size || (
                        <span className="text-gray-300">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {getScannerName(order)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {order.locations?.name || (
                        <span className="text-gray-300">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {order.scanned_timestamp ? (
                        new Date(order.scanned_timestamp).toLocaleString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }
                        )
                      ) : (
                        <span className="text-gray-300">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {matchingData?.created_at ? (
                        new Date(matchingData?.created_at).toLocaleString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }
                        )
                      ) : (
                        <span className="text-gray-300">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.locations?.name?.includes("Shipping Table")
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.locations?.name?.includes("Shipping Table")
                          ? "Shipped"
                          : "Pending"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && !loading && (
          <div className="text-center py-10 text-gray-500">
            {dateRange.startDate || dateRange.endDate ? (
              <div>
                No orders found matching your date filter
                <button 
                  onClick={() => setDateRange({ startDate: '', endDate: '' })}
                  className="ml-2 text-blue-500 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              "No order records found"
            )}
          </div>
        )}
      </div>
    </div>
  );
}