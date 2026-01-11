import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MapData = () => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [date, setDate] = useState("");

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

            // // ✅ Channel filter
            // if (channel && channel !== "All Channels") {
            //     whereClause += whereClause
            //         ? `~and(orders_2.channel,eq,${channel})`
            //         : `(orders_2.channel,eq,${channel})`;
            // }

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

            allRecords = allRecords.filter((o) => o?.locations?.name?.split(" / ")[0]?.toLowerCase() === "tailor");
            setLocation(allRecords);
            console.log(allRecords)
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

        if (date || (startDate, endDate)) {
            fetchLocation();
        }
    }, [date]);

    const data = [
        {
            name: "Sanjeet Kumar / संजीत कुमार",
            timestamp: "2025-10-08 08:26:11+00:00",
            code: 12345,
            position: "Store Helper / स्टोर हेल्पर",
            nextCode: 16027,
        },
        {
            name: "Sanjeet Kumar / संजीत कुमार",
            timestamp: "2025-10-08 08:26:50+00:00",
            code: 12346,
            position: "Tailor / दर्जी",
            nextCode: 19262,
        },
        {
            name: "Aslam",
            timestamp: "2025-10-08 12:35:28+00:00",
            code: 12347,
            position: "Tailor / दर्जी",
            nextCode: 19262,
        },
        {
            name: "Mukhtar",
            timestamp: "2025-10-09 04:19:50+00:00",
            code: 12347,
            position: "Tailor / दर्जी",
            nextCode: 19262,
        },
    ];

    // 1️⃣ Filter only Tailor positions
    const filtered = data.filter(
        (order) => order.position.split(" / ")[0].toLowerCase() === "tailor"
    );

    // 2️⃣ Sort descending by timestamp
    // const sortedData = [...filtered].sort(
    //     (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    // );

    // 3️⃣ Keep only unique codes using Map
    // const uniqueData = Array.from(
    //     new Map(sortedData.map((item) => [item.code, item])).values()
    // );


    const sortedData = [...location].sort((a, b) => new Date(b?.scanned_timestamp - new Date(a?.scanned_timestamp)));
    const uniqueData = Array.from(
        new Map(sortedData.map((item) => [item.order_id, item])).values()
    )


    const tailorPcsUnit = uniqueData.filter((o) => o.employees?.user_name?.split(" / ")[0]?.toLowerCase() === "vikash kumar");
    console.log("unique data ", tailorPcsUnit)
    if (loading) {
        return <p className='text-center'>Loading...</p>
    }
    return (


        <div>
            <div>
                <input type="date" onChange={(e) => setDate(e.target.value)}
                    className='py-2 px-4 rounded-xl border-gray-200 border cursor-pointer'
                />
            </div>
            <div className='flex gap-4 p-4'>
                <input type="date" onChange={(e) => setStartDate(e.target.value)}
                    className='py-2 px-4 rounded-xl border-gray-200 border cursor-pointer'
                />
                <input type="date" onChange={(e) => setEndDate(e.target.value)}
                    className='py-2 px-4 rounded-xl border-gray-200 border cursor-pointer'
                />

            </div>
            <div>
                <button
                    onClick={fetchLocation}
                    className='bg-blue-400 text-white py-2 px-4 rounded-xl cursor-pointer hover:bg-blue-500 ease-in duration-75'>Fetch Records</button>
            </div>
            <div>
                <h2>Unique Tailor Codes</h2>
                <ul>
                    {uniqueData.map((item) => (
                        <li key={item.order_id}>
                            <strong>Code:</strong> {item.order_id} <br />
                            <strong>Name:</strong> {item.employees?.user_name?.split(" / ")[0]} <br />
                            <strong>Position:</strong> {item.locations?.name} <br />
                            <strong>Timestamp:</strong> {item.scanned_timestamp}
                            <hr />
                        </li>
                    ))}
                </ul>
            </div>

        </div>
    );
};

export default MapData;
