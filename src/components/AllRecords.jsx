import React, { useEffect, useState } from "react";

const AllRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const MAX_RECORDS = 5000; // Fetch only 10,000 records
  const BATCH_SIZE = 500; // 100 records per request
  const API_URL = "https://nocodb.qurvii.com/api/v2/tables/m5rt138j272atfc/records";
  const API_HEADERS = {
    "xc-token": "LsOnEY-1wS4Nqjz15D1_gxHu0pFVcmA_5LNqCAqK",
  };

  async function fetchAllRecords() {
    let allRecords = [];
    const totalBatches = Math.ceil(MAX_RECORDS / BATCH_SIZE);
    
    try {
      console.log(`✅ Fetching max ${MAX_RECORDS} records in ${totalBatches} batches...`);

      for (let i = 0; i < totalBatches; i += 5) { // Fetch 5 batches at a time
        const batchPromises = [];
        for (let j = 0; j < 5 && (i + j) < totalBatches; j++) {
          batchPromises.push(
            fetch(`${API_URL}?offset=${(i + j) * BATCH_SIZE}&limit=${BATCH_SIZE}`, {
              method: "GET",
              headers: API_HEADERS,
            }).then((res) => res.json())
          );
        }

        const batchResults = await Promise.all(batchPromises);
        const batchRecords = batchResults.flatMap((data) => data.list || []);
        allRecords = [...allRecords, ...batchRecords];

        console.log(`📦 Fetched ${allRecords.length} / ${MAX_RECORDS} records`);
        if (allRecords.length >= MAX_RECORDS) break; // Stop if we reach 10,000
      }

      console.log("✅ Final Records:", allRecords.length, allRecords);
      setRecords(allRecords);
    } catch (error) {
      console.error("🚨 Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllRecords();
  }, []);

  return (
    <div>
      <h2>All Records</h2>
      {loading ? <p>Loading...</p> : <p>Fetched {records.length} records.</p>}
    </div>
  );
};

export default AllRecords;
