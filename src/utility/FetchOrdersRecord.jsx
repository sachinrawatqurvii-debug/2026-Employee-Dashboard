import axios from "axios";


export const fetchOrdersRecordFromNocoDB = async (startDate, endDate, status, channel, date) => {
    try {
        const baseUrl = "https://nocodb.qurvii.com/api/v2/tables/m5rt138j272atfc/records";
        const headers = {
            'xc-token': 'LsOnEY-1wS4Nqjz15D1_gxHu0pFVcmA_5LNqCAqK'
        };
        let whereClause = [];
        // ✅ Date, Status and Channel  filter
        if (startDate && endDate) {
            whereClause.push(`(created_at,gt,exactDate,${startDate})~and((created_at,lt,exactDate,${endDate})~or(created_at,eq,exactDate,${endDate}))~and(channel,neq,New)${status && `~and(status,eq,${status})`}${channel && `~and(channel,eq,${channel})`}`);
        } else if (date) {
            whereClause.push(`(created_at,eq,exactDate,${date})~and(channel,neq,New)~and(channel,neq,Return Checking)${status && `~and(status,eq,${status})`}${channel && `~and(channel,eq,${channel})`}`);
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
        return allRecords;
    } catch (error) {
        console.error("❌ Failed to fetch orders record from NocoDB:", error?.message || error);
        return [];
    }
};




// 'xc-token': 'LsOnEY-1wS4Nqjz15D1_gxHu0pFVcmA_5LNqCAqK'