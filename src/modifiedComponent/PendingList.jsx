import React, { useEffect, useState } from 'react';
import {
    FiRefreshCw,
    FiFilter,
    FiCalendar,
    FiShoppingBag,
    FiUser,
    FiMapPin,
    FiClock,
    FiPackage,
    FiCheckCircle,
    FiAlertCircle,
    FiSearch,
    FiLoader,

} from 'react-icons/fi';
import {
    FaTshirt,
    FaPalette,
    FaSortAmountDown,
    FaStore
} from 'react-icons/fa';
import {
    HiStatusOnline,
    HiCalendar
} from 'react-icons/hi';
import { fetchOrdersRecordFromNocoDB } from '../utility/FetchOrdersRecord';
import { fetchScannedRecordFromNocoDB } from '../utility/FetchScanOrdersRecord';

const PendingList = () => {
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [scannedRecords, setScannedRecord] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("");
    const [channel, setChannel] = useState("");
    const [date, setDate] = useState("");
    const [skippedOrderIds, setSkippedOrderIds] = useState(0);

    const fetchScanRecords = async () => {
        try {
            const data = await fetchScannedRecordFromNocoDB(startDate, endDate, date);
            setScannedRecord(data);
        } catch (error) {
            console.error("Failed to fetch scan records error :: ", error);
        }
    };


    const fetchOrders = async () => {
        setLoading(true);
        try {
            const orderData = await fetchOrdersRecordFromNocoDB(startDate, endDate, status, channel, date);
            setOrders(orderData);
            await fetchScanRecords(startDate, endDate, date); // make sure this finishes before state update
        } catch (error) {
            console.error("Failed to fetch orders error :: ", error);
        } finally {
            setLoading(false);
        }
    };


    const matchedOrderIdLastScannerName = (orderId) => {
        let matched = scannedRecords.find((o) => o.order_id === Number(orderId));
        return {
            user: matched?.employees.user_name,
            location: matched?.locations.name,
            timestamp: matched?.scanned_timestamp
        }
    }

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return <FiAlertCircle className="text-yellow-500" />;
            case 'completed':
                return <FiCheckCircle className="text-green-500" />;
            case 'shipped':
                return <FiPackage className="text-blue-500" />;
            default:
                return <FiClock className="text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'completed':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'shipped':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };


    function skippedOrderIdsCount() {
        let skipped = [];
        orders
            .filter((o) => o.status !== "shipped")
            .map((order) => {
                if (!matchedOrderIdLastScannerName(order.order_id).user) {
                    skipped.push(order)
                }
            })
        setSkippedOrderIds(skipped);

    }

    useEffect(() => {
        if (orders.length > 0 && scannedRecords.length >= 0) {
            skippedOrderIdsCount();
        }
    }, [orders, scannedRecords]);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <FiLoader className="w-8 h-8 text-blue-600 animate-spin" />
                <div className="text-center">
                    <p className="text-lg font-medium text-gray-700">Loading Orders</p>
                    <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
            <div className="container mx-auto bg-white shadow-xs rounded-2xl p-6 border border-gray-100">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div className="flex items-center space-x-3 mb-4 lg:mb-0">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FiPackage className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
                            <p className="text-sm text-gray-600">Track and manage all your orders in one place</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchOrders}
                        className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-xl"
                    >
                        <FiRefreshCw className="w-4 h-4" />
                        <span>Refresh Data</span>
                    </button>
                </div>

                {/* Filter Section */}
                <div className="bg-white shadow-xs border border-gray-100 rounded-2xl p-6 mb-8">
                    <div className="flex items-center space-x-2 mb-4">
                        <FiFilter className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Filter Orders</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {/* Single Date */}
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-gray-700 text-sm font-medium">
                                <HiCalendar className="w-4 h-4" />
                                <span>Date</span>
                            </label>
                            <div className="relative">
                                <input
                                    onChange={(e) => setDate(e.target.value)}
                                    type="date"
                                    value={date}
                                    className="w-full py-2.5 pl-10 pr-4 border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
                                />
                                <FiCalendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        {/* Start Date */}
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-gray-700 text-sm font-medium">
                                <FiCalendar className="w-4 h-4" />
                                <span>Start Date</span>
                            </label>
                            <div className="relative">
                                <input
                                    onChange={(e) => setStartDate(e.target.value)}
                                    type="date"
                                    value={startDate}
                                    className="w-full py-2.5 pl-10 pr-4 border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
                                />
                                <FiCalendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        {/* End Date */}
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-gray-700 text-sm font-medium">
                                <FiCalendar className="w-4 h-4" />
                                <span>End Date</span>
                            </label>
                            <div className="relative">
                                <input
                                    onChange={(e) => setEndDate(e.target.value)}
                                    value={endDate}
                                    type="date"
                                    className="w-full py-2.5 pl-10 pr-4 border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
                                />
                                <FiCalendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-gray-700 text-sm font-medium">
                                <HiStatusOnline className="w-4 h-4" />
                                <span> In Store Status</span>
                            </label>
                            <div className="relative">
                                <select
                                    onChange={(e) => setStatus(e.target.value)}
                                    value={status}
                                    className="w-full py-2.5 pl-10 pr-4 border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all appearance-none"
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="shipped">Shipped</option>
                                </select>
                                <FaSortAmountDown className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        {/* Channel */}
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-gray-700 text-sm font-medium">
                                <FaStore className="w-4 h-4" />
                                <span>Channel</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={channel}
                                    onChange={(e) => setChannel(e.target.value)}
                                    className="w-full py-2.5 pl-10 pr-4 border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all appearance-none"
                                >
                                    <option value="">All Channels</option>
                                    <option value="Myntra">Myntra</option>
                                    <option value="Nykaa">Nykaa</option>
                                    <option value="Shopify">Shopify</option>
                                    <option value="Ajio">Ajio</option>
                                    <option value="Tatacliq">Tatacliq</option>
                                    <option value="Shoppersstop">Shoppers Stop</option>
                                </select>
                                <FiShoppingBag className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        {/* Apply Button */}
                        <div className="flex items-end">
                            <button
                                onClick={() => fetchOrders(startDate, endDate, status, channel, date)}
                                className="flex items-center justify-center space-x-2 w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <FiSearch className="w-4 h-4" />
                                <span>Apply Filters</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Orders Table Section */}
                <div className="bg-white shadow-xs border border-gray-100 rounded-2xl overflow-hidden">
                    {/* Table Header */}
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <FiPackage className="w-5 h-5 text-white" />
                                <h3 className="text-lg font-semibold text-white">Pending Reports</h3>
                                <span className="px-2.5 py-1 bg-blue-500 bg-opacity-50 rounded-full text-xs text-white font-medium">
                                    {orders.length} orders

                                </span>

                                <span className="px-2.5 py-1 bg-white bg-opacity-50 rounded-full text-md text-red-400 font-medium">
                                    {skippedOrderIds.length} orders were never scanned.

                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="truncate bg-blue-50 text-blue-900 text-left text-sm uppercase tracking-wider font-semibold">
                                    <th className="px-6 py-4">#</th>
                                    <th className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <FiShoppingBag className="w-4 h-4" />
                                            <span>Channel</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <FaTshirt className="w-4 h-4" />
                                            <span>Style No.</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">Size</th>
                                    <th className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <FaPalette className="w-4 h-4" />
                                            <span>Color</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">Store</th>
                                    <th className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <FiCalendar className="w-4 h-4" />
                                            <span>Created At</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <FiClock className="w-4 h-4" />
                                            <span>Last Scan</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <FiUser className="w-4 h-4" />
                                            <span>Employee</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <FiMapPin className="w-4 h-4" />
                                            <span>Location</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.map((order, i) => (
                                    <tr
                                        key={order.order_id}
                                        className="hover:bg-blue-50 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                                                    {i + 1}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {order.channel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">
                                            #{order.order_id}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">
                                            {order.style_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                                                {order.size}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div
                                                    className="w-4 h-4 rounded-full border border-gray-300"
                                                    style={{
                                                        backgroundColor: order.color?.toLowerCase() || '#ccc'
                                                    }}
                                                />
                                                <span className="text-gray-700">{order.color}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                <span>{order.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(order.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {matchedOrderIdLastScannerName(order.order_id)?.timestamp ?
                                                new Date(matchedOrderIdLastScannerName(order.order_id).timestamp)?.toLocaleString() :
                                                <span className="text-gray-400">-</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            {matchedOrderIdLastScannerName(order.order_id)?.user ?
                                                <div className="flex items-center space-x-2">
                                                    <FiUser className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-700">
                                                        {matchedOrderIdLastScannerName(order.order_id)?.user?.split(" / ")[0]}
                                                    </span>
                                                </div> :
                                                <span className="text-gray-400">-</span>
                                            }
                                        </td>
                                        <td className={`px-6 py-4 `}>
                                            {matchedOrderIdLastScannerName(order.order_id)?.location ?
                                                <div className={`   flex items-center space-x-2 `}>
                                                    <FiMapPin className={`  w-4 h-4  ${matchedOrderIdLastScannerName(order.order_id)?.location?.split(" / ")[0]?.toLowerCase() === "shipping table" ? "text-green-400 " : "text-gray-400"}`} />
                                                    <span className={`${matchedOrderIdLastScannerName(order.order_id)?.location?.split(" / ")[0]?.toLowerCase() === "shipping table" ? "text-green-400 " : "text-gray-400"} text-sm text-gray-700 `}>
                                                        {matchedOrderIdLastScannerName(order.order_id)?.location?.split(" / ")[0]}
                                                    </span>
                                                </div> :
                                                <span className="text-gray-400">-</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {orders.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h4 className="text-lg font-medium text-gray-500 mb-2">No orders found</h4>
                            <p className="text-gray-400 text-sm">
                                Try adjusting your filters or refresh the data
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PendingList;