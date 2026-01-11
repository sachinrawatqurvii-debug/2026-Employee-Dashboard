import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DetailTracker = () => {
    const [orderIdData, setOrderIdData] = useState([]);
    const [ordersData, setOrdersData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [orderId, setOrderId] = useState("");
    const [error, setError] = useState("");

    const fetchLocation = async () => {
        setError("");
        setLoading(true);

        try {
            let whereClause = `(order_id,eq,${Number(orderId)})`;

            const options = {
                method: "GET",
                url: "https://nocodb.qurvii.com/api/v2/tables/mhhxiprapvyqjtf/records",
                params: {
                    where: whereClause || "",
                },
                headers: {
                    "xc-token": "LsOnEY-1wS4Nqjz15D1_gxHu0pFVcmA_5LNqCAqK",
                },
            };

            const res = await axios.request(options);
            setOrderIdData(res?.data?.list || []);

        } catch (error) {
            console.error("API Error:", error);
            setError(
                `Failed to fetch: ${error.response?.data?.message || error.message}`
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        setError("");
        setLoading(true);

        try {
            let whereClause = `(order_id,eq,${Number(orderId)})`;

            const options = {
                method: "GET",
                url: "https://nocodb.qurvii.com/api/v2/tables/m5rt138j272atfc/records",
                params: {
                    where: whereClause || "",
                },
                headers: {
                    "xc-token": "LsOnEY-1wS4Nqjz15D1_gxHu0pFVcmA_5LNqCAqK",
                },
            };

            const res = await axios.request(options);
            setOrdersData(res?.data?.list || []);

        } catch (error) {
            console.error("API Error:", error);
            setError(
                `Failed to fetch: ${error.response?.data?.message || error.message}`
            );
        } finally {
            setLoading(false);
        }
    };

    // useEffect(() => {
    //     if (orderId.length === 5) {
    //         fetchLocation();
    //         fetchOrders();
    //     }
    // }, [orderId]);

    const trackOrder = () => {
        fetchLocation()
        fetchOrders();
    }

    const getStageData = (locationKeyword) => {
        const record = orderIdData.find(o =>
            o.order_id === Number(orderId) &&
            o?.locations?.name.toLowerCase().includes(locationKeyword)
        );

        return {
            name: record?.employees?.user_name || "Not processed yet",
            time: record?.scanned_timestamp ? new Date(record.scanned_timestamp) : null,
            status: record ? 'Completed' : 'Pending'
        };
    };

    const formatDateTime = (date) => {
        if (!date) return "NA";
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const productionStages = [
        { id: 1, name: "Store Helper", keyword: "store helper" },
        { id: 2, name: "Cutting Helper", keyword: "cutting helper" },
        { id: 3, name: "Cutting Master", keyword: "cutting master" },
        { id: 4, name: "Kharcha Cutting", keyword: "kharcha" },
        { id: 5, name: "Tailor", keyword: "tailor" },
        { id: 6, name: "Dhaga Cutting", keyword: "dhaga cutting" },
        { id: 7, name: "Kaaj", keyword: "kaaj" },
        { id: 8, name: "Final Checking", keyword: "final checking" },
        { id: 9, name: "Shipping Table", keyword: "shipping table" },
        { id: 10, name: "Return Checking", keyword: "return checking" }
    ];

    const orderInfo = ordersData.find(o => o.order_id === Number(orderId));
    const styleInfo = orderIdData.find(o => o.order_id === Number(orderId));

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">Production Tracking System</h1>
                    <p className="mt-2 text-sm text-gray-600">Track style details through each production stage</p>
                </div>

                <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <div className="mb-6">
                        <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
                            Enter Order ID
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="orderId"
                                type="text"
                                className="flex-1 py-2 px-4 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 12345"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                maxLength={10}
                            />
                            <button
                                onClick={trackOrder}
                                disabled={orderId.length < 6}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                Track Order
                            </button>
                        </div>
                    </div>

                    {loading && (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {orderIdData.length > 0 && (
                    <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-medium text-gray-900">Order Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">ORDER ID</p>
                                    <p className="text-sm font-medium">#{orderId}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">STYLE NUMBER</p>
                                    <p className="text-sm font-medium">{styleInfo?.orders_2?.style_number || 'NA'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">SIZE</p>
                                    <p className="text-sm font-medium">{orderInfo?.size || 'NA'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">CHANNEL</p>
                                    <p className="text-sm font-medium">{orderInfo?.channel || 'NA'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {orderIdData.length > 0 && (
                    <div className="bg-white shadow overflow-hidden rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-medium text-gray-900">Production Timeline</h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {productionStages.map((stage) => {
                                const stageData = getStageData(stage.keyword);
                                const isCompleted = stageData.status === 'Completed';

                                return (
                                    <div key={stage.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start">
                                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mr-4 ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                <span className="font-medium">{stage.id}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'
                                                    }`}>
                                                    {stage.name}
                                                </p>
                                                {isCompleted ? (
                                                    <>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            <span className="font-medium">Employee:</span> {stageData.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            <span className="font-medium">Processed at:</span> {formatDateTime(stageData.time)}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-gray-400 mt-1">
                                                        Not processed yet
                                                    </p>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                    {stageData.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {orderId.length === 5 && !loading && orderIdData.length === 0 && !error && (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-3 text-lg font-medium text-gray-900">No production data found</h3>
                        <p className="mt-1 text-sm text-gray-500">No records available for order ID: {orderId}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetailTracker;