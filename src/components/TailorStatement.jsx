import React, { useState, useEffect, use } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useGlobalContext } from "./ProductContext";
import { jsPDF } from "jspdf";
import { applyPlugin } from "jspdf-autotable";
applyPlugin(jsPDF);



const TailorStatement = () => {
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
    const [activeTab, setActiveTab] = useState("dashboard");
    const [amount, setAmount] = useState({});
    const [localStorageData, setLocalStorageData] = useState([]);
    const [googleSheetData, setGoogleSheetData] = useState([]);



    const fetchPatternAndMrpFromGoogleSheet = async () => {
        setLoading(true);
        try {
            const sheetId = "1SIP3Glxo5vkL0Jvx9ulj0p6xZoOh0ruzRtIqzldmb8E";
            const apiKey = "AIzaSyAGjWAyG29vKBgiYVSXCn08cu5ym6FwiQs";
            const range = "A1:B";
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
            const response = await axios.get(url);
            setGoogleSheetData(response.data.values);


        } catch (error) {
            console.log("Failed to fetch pattern and mrp data from google sheet error :: ", error);
        } finally {
            setLoading(false)
        }
    }


    const otherAmount = new Map();
    const fetchLocalStorageData = () => {
        const localStorageData = JSON.parse(localStorage.getItem("otheramount")) || [];
        const uniqeData = Array.from(
            new Map(localStorageData.map((data) => [data.order_id, data])).values()
        )
        setLocalStorageData(uniqeData);

        localStorageData.map((data) => (
            otherAmount.set(data.order_id, data.rate, data.patternNumber, data.style_number)
        ))
    }

    useEffect(() => {
        fetchLocalStorageData();
    }, [])

    useEffect(() => {
        async function fetchGoogleSheetData() {
            setLoading(true)
            try {
                await fetchPatternAndMrpFromGoogleSheet();

            } catch (error) {
                console.log("Failed to fetch google sheet data error :: ", error)
            } finally {
                setLoading(false)
            }
        }
        fetchGoogleSheetData()
    }, [])


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
        "Tailor"
    ];

    const fetchLocation = async () => {
        setError("");
        setLocation([]);
        setLoading(true);
        try {
            let whereClause = "";

            // ✅ Date filter
            if (startDate && endDate) {
                whereClause = `(scanned_timestamp,gt,exactDate,${startDate})~and((scanned_timestamp,lt,exactDate,${endDate})~or(scanned_timestamp,eq,exactDate,${endDate}))`;
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

            // console.log("Final whereClause:", whereClause);

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
            console.log("All records ", allRecords);
            allRecords = allRecords.filter((o) => o?.locations?.name?.split(" / ")[0]?.toLowerCase() === "tailor");
            let sortedData = [...allRecords].sort((a, b) => new Date(a?.scanned_timestamp - new Date(b?.scanned_timestamp)));
            const uniqueData = Array.from(
                new Map(sortedData.map((item) => [item.order_id, item])).values()
            )

            setLocation(uniqueData);
            if (allRecords.length === 0) {
                setError(
                    `No records found for the selected filters. Query used: ${whereClause}`
                );
            }
        }

        catch (error) {
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
            fetchPatternAndMrpFromGoogleSheet()
        }
    }, [date, channel]);

    const fetchRecordsByDateRange = () => {
        fetchLocation();
        fetchPatternAndMrpFromGoogleSheet()
        fetchStyleWiseData();
    }

    const exportToCSV = (exportData) => {
        // const filteredData = filterData();
        const filteredData = exportData;
        const csvData = filteredData.map((order) => {
            return {
                "Order ID": order.order_id,
                "Style Number": order?.orders_2?.style_number || "N/A",
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

        // First filter: Only show Tailor and Cutting Master locations
        result = result.filter((item) => {
            const locationName = item.locations?.name || "";
            return locationName.includes("Tailor") || locationName.includes("Cutting Master");
        });

        // Second filter: Apply user-selected location filter
        if (locationFilter && locationFilter !== "All Locations") {
            result = result.filter((item) =>
                item.locations?.name?.includes(locationFilter)
            );
        }

        // Third filter: Apply employee search
        if (employeeSearch) {
            result = result.filter((item) =>
                item.employees?.user_name
                    ?.toLowerCase()
                    .includes(employeeSearch.toLowerCase())
            );
        }

        return result;
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

    // ********************** get pattern details from stylewise database *****************

    const matchedDetailsForStyleTypeLiningAndPattern = (styleNumber) => {
        return stylewiseData.find((style) => style.styleNumber === Number(styleNumber));
    }


    const matchedPatternAndGetRate = (patternNumber) => {
        const result = {};
        for (let i = 0; i < googleSheetData.length; i++) {
            const [pattern, rateRaw] = googleSheetData[i];

            let rate = 0;

            if (rateRaw) {
                const cleanedRate = rateRaw.replace("₹", "").trim().toLowerCase();
                if (cleanedRate === "na") {
                    rate = 0;
                } else {
                    rate = Number(cleanedRate) || 0;
                }
            }

            result[pattern] = rate;
        }
        return result[String(patternNumber)] !== undefined ? result[String(patternNumber)] : 0;
        // return Number(result[String(patternNumber)] !== undefined ? result[String(patternNumber)] : localStorageData.find((d) => d.patternNumber === String(patternNumber))?.rate);

    }




    // Helper: Local date (YYYY-MM-DD)
    const getLocalDate = (timestamp) => {
        if (!timestamp) return null;
        const d = new Date(timestamp);
        if (isNaN(d)) return null;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };


    const getEmployeeDressCounts = () => {
        const filteredData = filterData();
        const employeeDressCounts = {};
        const employeeOrdersMap = new Map();


        filteredData.forEach(item => {
            const employee = item.employees?.user_name || "Unknown";
            const orderId = item.order_id;
            const styleNumber = item.orders_2?.style_number;
            const scannedDate = getLocalDate(item.scanned_timestamp);


            if (!employeeDressCounts[employee]) {
                employeeDressCounts[employee] = {
                    dress519: 0,
                    dress603: 0,
                    others: 0,
                    uniqueDays: new Set(),
                    totalRate: 0,
                };
                employeeOrdersMap.set(employee, new Set());
            }

            const ordersSet = employeeOrdersMap.get(employee);

            // ✅ अगर order पहले से count हो चुका है तो skip करें
            if (ordersSet.has(orderId)) {
                return;
            }
            ordersSet.add(orderId);

            // ✅ Working days track करें
            if (scannedDate) {
                employeeDressCounts[employee].uniqueDays.add(scannedDate);
            }

            // ✅ Dress count logic
            if (styleNumber) {
                const styleDetails = matchedDetailsForStyleTypeLiningAndPattern(styleNumber);
                const pattern = styleDetails?.patternNumber?.toString() || "NA";
                const rate = matchedPatternAndGetRate(pattern);

                // employeeDressCounts[employee].totalRate += ((rate === "NA" || !rate) ? 0 : rate);
                const rateValue = (rate && rate.toString().trim().toLowerCase() === "na") ? 0 : Number(rate) || 0;
                employeeDressCounts[employee].totalRate += rateValue;

                if (styleDetails && styleDetails.patternNumber) {
                    const pattern = styleDetails.patternNumber.toString();
                    if (pattern === "519") {
                        employeeDressCounts[employee].dress519++;
                    } else if (pattern === "603") {
                        employeeDressCounts[employee].dress603++;
                    } else {
                        employeeDressCounts[employee].others++;
                    }
                } else {
                    employeeDressCounts[employee].others++;
                }
            } else {
                employeeDressCounts[employee].others++;
            }
        });

        // ✅ Unique days count finalize करें
        Object.keys(employeeDressCounts).forEach(emp => {
            const daysArray = Array.from(employeeDressCounts[emp].uniqueDays).sort();
            employeeDressCounts[emp].totalWorkingDays = daysArray.length;
            employeeDressCounts[emp].workingDays = daysArray;
            delete employeeDressCounts[emp].uniqueDays;
        });

        return employeeDressCounts;
    };



    const stats = getStats();
    const filteredData = filterData();
    const employeeDressCounts = getEmployeeDressCounts();



    const getUniqueData = () => {
        const result = [];

        // Map to track already added orders for each employee
        const employeeOrdersMap = new Map();

        filteredData.forEach(item => {
            const employeeName = item.employees?.user_name || "N/A";
            const orderId = item.order_id;

            if (!employeeOrdersMap.has(employeeName)) {
                employeeOrdersMap.set(employeeName, new Set());
            }

            const ordersSet = employeeOrdersMap.get(employeeName);

            if (!ordersSet.has(orderId)) {
                ordersSet.add(orderId);
                result.push(item);
            }
        });

        return result;
    };

    const uniqueFilteredData = getUniqueData();

    const exportToPDF = () => {
        const doc = new jsPDF();
        // Functions to get start and end dates from the data
        const otherAmount = localStorageData.reduce((acc, cur) => Number(cur.rate) + Number(acc), 0)
        const printStartDate = () => {
            if (uniqueFilteredData.length === 0) return "N/A";
            const sorted = [...uniqueFilteredData].sort((a, b) => new Date(a.scanned_timestamp) - new Date(b.scanned_timestamp));
            return getLocalDate(sorted[0].scanned_timestamp);
        };

        const printEndDate = () => {
            if (uniqueFilteredData.length === 0) return "N/A";
            const sorted = [...uniqueFilteredData].sort((a, b) => new Date(a.scanned_timestamp) - new Date(b.scanned_timestamp));
            return getLocalDate(sorted[sorted.length - 1].scanned_timestamp);
        };

        // Summary Data
        const totalQty = uniqueFilteredData.length;
        const totalAmount = uniqueFilteredData.reduce((acc, item) => {
            const styleNumber = item.orders_2?.style_number;
            const styleDetails = matchedDetailsForStyleTypeLiningAndPattern(styleNumber);
            const pattern = styleDetails?.patternNumber?.toString() || "NA";
            const rate = matchedPatternAndGetRate(pattern) || Number(localStorageData.find((item) => Number(item.style_number) === Number(styleNumber))?.rate);
            console.log("Matched Rate", rate)
            return acc + (rate === "NA" ? 0 : rate);
        }, 0);

        const totalDays = Object.values(employeeDressCounts).reduce((acc, val) => acc + val.totalWorkingDays, 0);
        const perPieceRate = totalQty ? (totalAmount / totalQty).toFixed(2) : 0;
        const perDayRate = totalDays ? (totalAmount / totalDays).toFixed(2) : 0;
        const netPayable = totalAmount + (otherAmount || 0);

        // Header
        doc.setFontSize(12);
        doc.text(`${employeeSearch} Statement From ${printStartDate()} To ${printEndDate()}`, 14, 14);
        doc.setFontSize(10);
        doc.text(`Total Qty: ${totalQty}`, 14, 22);
        doc.text(`Total Amount: Rs.${totalAmount.toFixed(2)}`, 14, 28);
        doc.text(`Per Piece Rate: Rs.${perPieceRate}`, 14, 34);
        doc.text(`Total Days: ${totalDays}`, 14, 40);
        doc.text(`Per Day Rate: Rs.${perDayRate}`, 14, 46);
        doc.text(`Other Amount: ${otherAmount}`, 14, 52);
        doc.text(`Net Payable: Rs.${netPayable.toFixed(2)}`, 14, 58);

        // Aggregate data by date + styleNumber
        const aggregated = {};

        uniqueFilteredData.forEach(item => {
            const date = getLocalDate(item.scanned_timestamp) || "N/A";
            const styleNumber = item.orders_2?.style_number || "N/A";
            const styleDetails = matchedDetailsForStyleTypeLiningAndPattern(styleNumber);
            const pattern = styleDetails?.patternNumber?.toString() || "N/A";
            const rate = matchedPatternAndGetRate(pattern);
            // const patternRate = rate === "NA" ? 0 : rate;
            const patternRate = rate || Number(localStorageData.find((item) => Number(item.style_number) === Number(styleNumber))?.rate)

            const key = `${date}|${styleNumber}|${pattern}|${patternRate}`;

            if (!aggregated[key]) {
                aggregated[key] = {
                    date,
                    styleNumber,
                    pattern,
                    patternRate,
                    qty: 0,
                    // otherRate: 0,
                    // otherAmount: 0
                };
            }

            aggregated[key].qty += 1;

        });

        // const tableColumn = ["Date", "Style", "#Pattern", "Qty", "Pattern Rate", "Amount", "Other Rate", "Other Amount"];
        const tableColumn = ["Date", "Style", "#Pattern", "Qty", "Pattern Rate", "Amount"];
        const tableRows = [];

        Object.values(aggregated).forEach(item => {
            const amount = item.qty * item.patternRate;

            tableRows.push([
                item.date,
                item.styleNumber,
                item.pattern,
                item.qty,
                `Rs.${item.patternRate}`,
                `Rs.${amount}`,
                // `Rs.${item.otherRate}`,
                // `Rs.${item.otherAmount}`
            ]);
        });

        // Create table
        doc.autoTable({
            startY: 60,
            head: [tableColumn],
            body: tableRows,
            theme: "striped",
            headStyles: { fillColor: [22, 160, 133] },
            styles: { font: "helvetica", fontStyle: "normal" }
        });

        // Save PDF
        doc.save("tailor_cutting_report.pdf");
        localStorage.removeItem("otheramount")
        fetchLocalStorageData();
    };

    //    ***************************** add other amount ****************************


    const addOtherAmount = (order_id, rate, patternNumber, style_number) => {
        if (!order_id || !rate) return
        localStorage.setItem("otheramount", JSON.stringify([...localStorageData, { order_id, rate, patternNumber, style_number }]));
        fetchLocalStorageData();
        setAmount("")

    }

    console.log(localStorageData)
    const clearOtherAmount = () => {
        localStorage.removeItem("otheramount");
        setAmount("")
        fetchLocalStorageData();
    }
    const handleAmountChange = (orderId, value) => {
        setAmount(prev => ({
            ...prev, [orderId]: value
        }))
    }

    // ********************** total amount *********************

    let totalAmount = 0;
    Object.entries(employeeDressCounts).map(([employee, counts]) => {
        totalAmount += counts.totalRate;
    })

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
                            Tailor Statement Dashboard
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
                            onClick={() => exportToCSV(uniqueFilteredData)}
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                onChange={(e) => setDate(e.target.value)}
                                disabled={startDate || endDate}
                                value={date}
                                className={`w-full border border-gray-300 py-2 px-3 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${(startDate || endDate) ? "opacity-75 cursor-not-allowed" : "opacity-100"}`}

                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                            </label>
                            <select
                                className="w-full border border-gray-300 py-2 px-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                value="tailor"
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

                            <select
                                value={employeeSearch}  // Controlled component
                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                className="border-gray-200 border py-2 px-4 rounded-md cursor-pointer outline-gray-300"
                            >
                                <option value="">Select Employee</option>
                                {Object.entries(stats.employeeCounts)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([employee, count]) => {
                                        const empName = employee?.split(" / ")[0];
                                        return (
                                            <option key={employee} value={empName}>
                                                {empName}({count})
                                            </option>
                                        );
                                    })}
                            </select>
                        </div>

                        {/* ******************* date range filter ************************ */}
                        {
                            location.length === 0 && (startDate && endDate) && (
                                <p className="text-center">loading...</p>
                            )
                        }
                        <div className="flex gap-3 items-center">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                disabled={date}
                                // className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                                className={`w-full border border-gray-300 py-2 px-3 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${(date) ? "opacity-75 cursor-not-allowed" : "opacity-100"}`}
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                // className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                                disabled={date}
                                className={`w-full border border-gray-300 py-2 px-3 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${(date) ? "opacity-75 cursor-not-allowed" : "opacity-100"}`}
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

                {/* Navigation Tabs */}
                <div className="bg-white rounded-xl shadow-md mb-8">
                    <div className="flex border-b">
                        <button
                            className={`py-4 px-6 font-medium ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            Dashboard Overview
                        </button>
                        <button
                            className={`py-4 px-6 font-medium ${activeTab === 'employee' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('employee')}
                        >
                            {locationFilter} Dress Count
                        </button>
                        <button
                            className={`py-4 px-6 font-medium ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('details')}
                        >
                            Order Details
                        </button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                {activeTab === 'dashboard' && filteredData.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                                    Employees
                                </h3>
                                <div className="space-y-3">
                                    {Object.entries(stats.employeeCounts)
                                        .sort((a, b) => b[1] - a[1])
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

                            {/* <div className="bg-white p-6 rounded-xl shadow">
                                <h3 className="font-medium text-gray-700 mb-4">
                                    Top Locations
                                </h3>
                                <div className="space-y-3">
                                    {Object.entries(stats.locationCounts)
                                        .sort((a, b) => b[1] - a[1]) // Sort by count descending
                                        .slice(0, 10) // Take top 10
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
                            </div> */}
                        </div>
                    </>
                )}

                {/* Employee Dress Count Section */}
                {activeTab === 'employee' && (
                    <div className="bg-white p-6 rounded-xl shadow-md mb-8">

                        {totalAmount > 0 && (
                            <div className="my-6 bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                <div className="flex items-center justify-between">
                                    <p className="text-lg font-medium text-gray-700">Total Amount</p>
                                    <span className="text-2xl font-bold text-gray-900 bg-white px-4 py-3 rounded-lg shadow-sm">
                                        Rs.{totalAmount}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dress (519)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dress (603)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Others</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>Total Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Working Days</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.entries(employeeDressCounts).map(([employee, counts]) => (

                                        <tr key={employee}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {employee.split(" / ")[0]}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {counts.dress519}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {counts.dress603}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {counts.others}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                                                {counts.dress519 + counts.dress603 + counts.others}
                                            </td>
                                            <td className={`${counts.totalRate === 0 ? "bg-red-200 text-white" : ""} px-6 py-4 whitespace-nowrap text-sm text-gray-500`}>
                                                ₹{counts.totalRate}

                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                                                {counts.totalWorkingDays}

                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500`}>

                                                <div className="flex gap-2 ">
                                                    {counts?.workingDays?.map((day, i) => (
                                                        <span key={`${day}-${i}`} className="bg-red-400 text-white py-1 px-2 rounded-full"> {day.split("-")[2]} </span>
                                                    ))}

                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Order Details Section */}
                {activeTab === 'details' && (
                    <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6">Order Details</h2>
                        <div className="flex justify-between mb-4">
                            <button onClick={exportToPDF} className="bg-blue-500 text-white py-2 px-4 rounded-md cursor-pointer hover:bg-blue-600 duration-75 ease-in">Export Statement</button>
                            <div className="flex gap-2">
                                <button
                                    onClick={clearOtherAmount}
                                    className="py-2 px-4 rounded-md cursor-pointer bg-red-500 text-white duration-75 ease-in">Clear Amount</button>
                                <p className="bg-black text-white text-xl py-2 px-4 rounded-md"> {localStorageData.reduce((acc, cur) => Number(cur.rate) + Number(acc), 0)} </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Style Number</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Style Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
                                        <th className={`  px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>Rate</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lining</th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>Other Ammount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {uniqueFilteredData.map((item, index) => {
                                        const styleDetails = matchedDetailsForStyleTypeLiningAndPattern(item.orders_2?.style_number);
                                        const manualRate = localStorageData.find((d) => d.order_id === item?.order_id)?.rate || 0
                                        return (
                                            <tr key={item?.order_id} className={`${(matchedPatternAndGetRate(styleDetails?.patternNumber) === 0 && manualRate === 0) ? "bg-red-400 text-white" : "text-gray-500"}`}>
                                                <td className={` px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 `}>
                                                    {item.order_id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm ">
                                                    {item.employees?.user_name?.split(" / ")[0] || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm ">
                                                    {item.orders_2?.style_number || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm ">
                                                    {styleDetails?.styleType || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm ">
                                                    {styleDetails?.patternNumber || "N/A"}
                                                </td>
                                                <td className={`${(matchedPatternAndGetRate(styleDetails?.patternNumber) || manualRate) === 0 ? "bg-red-400 text-white" : ""} px-6 py-4 whitespace-nowrap text-sm text-gray-500`}>
                                                    ₹{matchedPatternAndGetRate(styleDetails?.patternNumber) || manualRate}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm ">
                                                    {styleDetails?.lining || "N/A"}
                                                </td>


                                                {/* <td className="px-6 py-4 whitespace-nowrap text-sm ">
                                                    <div className={`${matchedPatternAndGetRate(styleDetails?.patternNumber) > 0 ? "hidden" : "flex"}`}>
                                                        <input
                                                            onChange={(e) => setAmount(e.target.value)}
                                                            value={amount}
                                                            disabled={matchedPatternAndGetRate(styleDetails?.patternNumber) > 0}
                                                            className={`${matchedPatternAndGetRate(styleDetails?.patternNumber) > 0 ? " border-0 bg-gray-200 cursor-not-allowed border-gray-200" : "cursor-pointer bg-white text-black border-gray-200 outline-gray-300"} py-2 px-4 rounded   ease-in duration-75`}
                                                            type="number" placeholder="Enter amount..." />
                                                        <button
                                                            onClick={() => addOtherAmount(item.order_id, amount, styleDetails?.patternNumber, item.orders_2?.style_number)}
                                                            className={` ${localStorageData.find((elem) => Number(elem.order_id) === Number(item.order_id)) ? "hidden" : "block"} py-2 px-4 rounded-md cursor-pointer hover:bg[#222] bg-black duration-75 ease-in`}>Add</button>
                                                    </div>
                                                </td>
                                                 */}

                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className={`${(matchedPatternAndGetRate(styleDetails?.patternNumber) || manualRate) > 0 ? "hidden" : "flex"}`}>
                                                        <input
                                                            onChange={(e) => handleAmountChange(item.order_id, e.target.value)}
                                                            value={amount[item.order_id] || ""} // individual value per row
                                                            // value={amount[item.order_id] || localStorageData.find((d) => d.patternNumber === styleDetails?.patternNumber)?.rate} // individual value per row
                                                            disabled={matchedPatternAndGetRate(styleDetails?.patternNumber) > 0}
                                                            className={`${matchedPatternAndGetRate(styleDetails?.patternNumber) > 0
                                                                ? "border-0 bg-gray-200 cursor-not-allowed border-gray-200"
                                                                : "cursor-pointer bg-white text-black border-gray-200 outline-gray-300"
                                                                } py-2 px-4 rounded ease-in duration-75`}
                                                            type="number"
                                                            placeholder="Enter amount..."
                                                        />
                                                        <button
                                                            onClick={() =>
                                                                addOtherAmount(
                                                                    item.order_id,
                                                                    amount[item.order_id],
                                                                    styleDetails?.patternNumber,
                                                                    item.orders_2?.style_number
                                                                )
                                                            }
                                                            className={`${localStorageData.find((elem) => Number(elem.order_id) === Number(item.order_id))
                                                                ? "hidden"
                                                                : "block"
                                                                } py-2 px-4 rounded-md cursor-pointer hover:bg[#222] bg-black duration-75 ease-in`}
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </td>

                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TailorStatement;