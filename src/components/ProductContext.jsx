import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

const ProductContext = createContext();

const ProductContextProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [scanTracking, setScanTracking] = useState([]);
  const [scanTracking2, setScanTracking2] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [styleLoading, setStyleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [googleSheetData, setGoogleSheetData] = useState([]);

  const MAX_RECORDS = 5000;
  const BATCH_SIZE = 500;
  const API_HEADERS = {
    "xc-token": "LsOnEY-1wS4Nqjz15D1_gxHu0pFVcmA_5LNqCAqK",
  };

  const fetchLocation = async () => {
    setLoading(true)
    try {
      let allLocations = [];
      const totalBatches = Math.ceil(MAX_RECORDS / BATCH_SIZE);

      for (let i = 0; i < totalBatches; i++) {
        const response = await fetch(
          `https://nocodb.qurvii.com/api/v2/tables/mhhxiprapvyqjtf/records?offset=${i * BATCH_SIZE
          }&limit=${BATCH_SIZE}&viewId=vw7oelmdnxn5leeh`,
          { method: "GET", headers: API_HEADERS }
        );

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        allLocations = [...allLocations, ...(data.list || [])];

        if (allLocations.length >= MAX_RECORDS) break;
      }

      setScanTracking(allLocations);
      setScanTracking2(allLocations);
      setError(null);
    } catch (error) {
      console.error("Error fetching Locations:", error);
      setError("Failed to load locations data");
    }
    finally {
      setLoading(false)
    }
  };

  const fetchOrders = async () => {
    setStyleLoading(true);
    try {
      let allOrders = [];
      const totalBatches = Math.ceil(MAX_RECORDS / BATCH_SIZE);

      for (let i = 0; i < totalBatches; i++) {
        const response = await fetch(
          `https://nocodb.qurvii.com/api/v2/tables/m5rt138j272atfc/records?offset=${i * BATCH_SIZE
          }&limit=${BATCH_SIZE}&viewId=vwi961elxbm8g0gr`,
          { method: "GET", headers: API_HEADERS }
        );

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        allOrders = [...allOrders, ...(data.list || [])];

        if (allOrders.length >= MAX_RECORDS) break;
      }

      setOrders(allOrders);
      setError(null);
    } catch (error) {
      console.error("Error fetching Orders:", error);
      setError("Failed to load orders data");
    } finally {
      setStyleLoading(false);
    }
  };

  const fetchPatternAndMrpFromGoogleSheet = async () => {

    try {
      const sheetId = "1SIP3Glxo5vkL0Jvx9ulj0p6xZoOh0ruzRtIqzldmb8E";
      const apiKey = "AIzaSyAGjWAyG29vKBgiYVSXCn08cu5ym6FwiQs";
      const range = "A1:B";
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
      const response = await axios.get(url);
      setGoogleSheetData(response.data.values);


    } catch (error) {
      console.log("Failed to fetch pattern and mrp data from google sheet error :: ", error);
    }
  }


  useEffect(() => {
    fetchOrders();
    fetchLocation();
  }, [])


  const applyFilters = (data) => {
    if (!data || !data.length) return [];

    const now = new Date();
    console.log("Applying filters:", filters);

    return data.filter((item) => {
      try {
        if (!item.scanned_timestamp) return false;

        const order = orders.find((o) => o.order_id === item.order_id) || {};
        const itemDateObj = new Date(item.scanned_timestamp);

        if (isNaN(itemDateObj.getTime())) {
          console.warn("Invalid date for item:", item);
          return false;
        }

        const itemTime = itemDateObj.getTime();

        // Created At Date range filtering
        let startCreatedDate = filters.created_start_date
          ? new Date(filters.created_start_date)
          : null;
        let endCreatedDate = filters.created_end_date
          ? new Date(filters.created_end_date)
          : null;

        // Apply time components if dates exist
        if (startCreatedDate) {
          const startHours = filters.created_start_hours
            ? parseInt(filters.created_start_hours)
            : 0;
          const startMinutes = filters.created_start_minutes
            ? parseInt(filters.created_start_minutes)
            : 0;
          startCreatedDate.setHours(startHours, startMinutes, 0, 0);
        }

        if (endCreatedDate) {
          const endHours = filters.created_end_hours
            ? parseInt(filters.created_end_hours)
            : 23;
          const endMinutes = filters.created_end_minutes
            ? parseInt(filters.created_end_minutes)
            : 59;
          endCreatedDate.setHours(endHours, endMinutes, 59, 999);
        }

        // Last scan Date range filtering
        let startDate = filters.start_date
          ? new Date(filters.start_date)
          : null;
        let endDate = filters.end_date ? new Date(filters.end_date) : null;

        // Apply time components if dates exist
        if (startDate) {
          const startHours = filters.start_hours
            ? parseInt(filters.start_hours)
            : 0;
          const startMinutes = filters.start_minutes
            ? parseInt(filters.start_minutes)
            : 0;
          startDate.setHours(startHours, startMinutes, 0, 0);
        }

        if (endDate) {
          const endHours = filters.end_hours ? parseInt(filters.end_hours) : 23;
          const endMinutes = filters.end_minutes
            ? parseInt(filters.end_minutes)
            : 59;
          endDate.setHours(endHours, endMinutes, 59, 999);
        }

        // Time range presets
        const last1Hour = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        const last3Hours = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const last3Days = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Time filter matching
        let timeFilterMatch = true;
        if (filters.time_filter) {
          switch (filters.time_filter) {
            case "last_1_hour":
              timeFilterMatch = itemTime >= last1Hour.getTime();
              break;
            case "last_3_hours":
              timeFilterMatch = itemTime >= last3Hours.getTime();
              break;
            case "today":
              timeFilterMatch = itemTime >= today.getTime();
              break;
            case "yesterday":
              timeFilterMatch =
                itemTime >= yesterday.getTime() && itemTime < today.getTime();
              break;
            case "last_3_days":
              timeFilterMatch = itemTime >= last3Days.getTime();
              break;
            case "last_7_days":
              timeFilterMatch = itemTime >= last7Days.getTime();
              break;
            case "this_month":
              timeFilterMatch = itemTime >= firstDayOfMonth.getTime();
              break;
            default:
              timeFilterMatch = true;
          }
        }

        // Date range matching
        const dateRangeMatch =
          (!startDate || itemTime >= startDate.getTime()) &&
          (!endDate || itemTime <= endDate.getTime());

        // Created At date range matching
        const itemCreatedAt = item.created_at ? new Date(item.created_at) : null;
        const createdAtTime = itemCreatedAt ? itemCreatedAt.getTime() : 0;

        const createdAtDateRange =
          (!startCreatedDate || createdAtTime >= startCreatedDate.getTime()) &&
          (!endCreatedDate || createdAtTime <= endCreatedDate.getTime());

        // All conditions
        return (
          (!filters.order_id ||
            item.order_id?.toString().includes(filters.order_id)) &&
          (!filters.channel ||
            (order?.channel &&
              order.channel
                .toString()
                .toLowerCase()
                .includes(filters.channel.toLowerCase()))) &&
          (!filters.style_number ||
            (order?.style_number &&
              order.style_number
                .toString()
                .includes(filters.style_number.toLowerCase()))) &&
          (!filters.last_scanner ||
            (item.employees?.user_name &&
              item.employees.user_name
                .toLowerCase()
                .includes(filters.last_scanner.toLowerCase()))) &&
          (!filters.location ||
            (item.locations?.name &&
              item.locations.name
                .toLowerCase()
                .includes(filters.location.toLowerCase()))) &&
          timeFilterMatch &&
          dateRangeMatch &&
          createdAtDateRange
        );
      } catch (error) {
        console.error("Error filtering item:", item, error);
        return false;
      }
    });
  };

  const filteredOrders = applyFilters(scanTracking);

  return (
    <ProductContext.Provider
      value={{
        orders,
        scanTracking: filteredOrders,
        googleSheetData,
        fetchPatternAndMrpFromGoogleSheet,
        scanTracking2,
        filters,
        setFilters,
        loading,
        styleLoading,
        error,
        fetchOrders,
        fetchLocation,
        styleLoading
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

const useGlobalContext = () => {
  return useContext(ProductContext);
};

export { useGlobalContext, ProductContextProvider };
