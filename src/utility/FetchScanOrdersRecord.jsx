import axios from "axios";
export const fetchScannedRecordFromNocoDB = async (startDate, endDate, date) => {
    try {
        const baseUrl = "https://nocodb.qurvii.com/api/v2/tables/mhhxiprapvyqjtf/records";
        const headers = {
            'xc-token': 'LsOnEY-1wS4Nqjz15D1_gxHu0pFVcmA_5LNqCAqK'
        };
        let whereClause = [];
        // ✅ Date, Status and Channel  filter
        if (startDate && endDate) {
            whereClause.push(`(scanned_timestamp,gt,exactDate,${startDate})~and((scanned_timestamp,lt,exactDate,${endDate})~or(scanned_timestamp,eq,exactDate,${endDate}))`);
        } else if (date) {
            whereClause.push(`(scanned_timestamp,eq,exactDate,${date})`);
        }
        console.log("Final whereClause:", whereClause);
        let allRecords = [];
        let offset = 0;
        const limit = 1000;
        let hasMore = true;
        while (hasMore) {
            const options = {
                method: "GET",
                url: baseUrl,
                params: {
                    limit: limit.toString(),
                    offset: offset.toString(),
                    where: whereClause || undefined,
                },
                headers,
            };
            const res = await axios.request(options);
            if (res.data.list && res.data.list.length > 0) {
                allRecords = [...allRecords, ...res.data.list];
                offset += res.data.list.length;
                if (res.data.list.length < limit) {
                    hasMore = false
                }
            } else {
                hasMore = false;
            }
        }

        let sortedData = [...allRecords].sort((a, b) => new Date(a?.scanned_timestamp - new Date(b?.scanned_timestamp)));

        let uniqueData = Array.from(
            new Map(sortedData.map((order) => [order.order_id, order])).values()
        )
        return uniqueData;
    } catch (error) {
        console.error("❌ Failed to fetch scanned record from NocoDB:", error?.message || error);
        return [];
    }
};
