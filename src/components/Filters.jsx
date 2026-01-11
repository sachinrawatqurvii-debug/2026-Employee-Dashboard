import { useGlobalContext } from "./ProductContext";

export default function Filters() {
  const { filters, setFilters } = useGlobalContext();

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const format = (n) => (n < 10 ? `0${n}` : n);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-6">
      {/* Order ID */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Order ID</label>
        <input
          type="text"
          placeholder="Search by order ID"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.order_id || ""}
          onChange={(e) => setFilters({ ...filters, order_id: e.target.value })}
        />
      </div>

      {/* Channel */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Channel</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.channel || ""}
          onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
        >
          <option value="">All Channels</option>
          {[
            "Myntra",
            "Ajio",
            "Tatacliq",
            "Nykaa",
            "Shoppersstop",
            "Shopify",
            "Sample",
            "Tushar",
            "Sakshi",
          ].map((channel) => (
            <option key={channel} value={channel}>
              {channel}
            </option>
          ))}
        </select>
      </div>

      {/* Style Number */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Style Number</label>
        <input
          type="text"
          placeholder="Search by style number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.style_number || ""}
          onChange={(e) =>
            setFilters({ ...filters, style_number: e.target.value })
          }
        />
      </div>

      {/* Last Scanner */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Scanner</label>
        <input
          type="text"
          placeholder="Search by scanner name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.last_scanner || ""}
          onChange={(e) =>
            setFilters({ ...filters, last_scanner: e.target.value })
          }
        />
      </div>

      {/* Location */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.location || ""}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        >
          <option value="">All Locations</option>
          {[
            "Cutting Master",
            "Tailor",
            "Kharcha",
            "Kaaj",
            "Shipping Table",
            "Dhaga Cutting",
            "Store Helper",
            "Cutting Helper",
            "First Checking",
            "Final Checking",
            "Ironing & Packing",
            "Pattern Making",
            "Fabric Checking",
          ].map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      {/* Time Filter */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Time Range</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.time_filter || ""}
          onChange={(e) =>
            setFilters({ ...filters, time_filter: e.target.value })
          }
        >
          <option value="">Select Time Range</option>
          <option value="last_1_hour">Last 1 Hour</option>
          <option value="last_3_hours">Last 3 Hours</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last_3_days">Last 3 Days</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="this_month">This Month</option>
        </select>
      </div>

      {/* Last Scan Start Date + Time */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">LastScan SD</label>
        <div className="space-y-2">
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.start_date || ""}
            onChange={(e) =>
              setFilters({ ...filters, start_date: e.target.value })
            }
          />
          <div className="flex gap-2">
            <select 
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.start_hours || "00"}
              onChange={(e) => setFilters({ ...filters, start_hours: e.target.value })}
            >
              {hours.map((h) => (
                <option key={h} value={format(h)}>{format(h)}</option>
              ))}
            </select>
            <select 
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.start_minutes || "00"}
              onChange={(e) => setFilters({ ...filters, start_minutes: e.target.value })}
            >
              {minutes.map((m) => (
                <option key={m} value={format(m)}>{format(m)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Last Scan End Date + Time */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">LastScan ED</label>
        <div className="space-y-2">
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.end_date || ""}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          />
          <div className="flex gap-2">
            <select 
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.end_hours || "23"}
              onChange={(e) => setFilters({ ...filters, end_hours: e.target.value })}
            >
              {hours.map((h) => (
                <option key={h} value={format(h)}>{format(h)}</option>
              ))}
            </select>
            <select 
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.end_minutes || "59"}
              onChange={(e) => setFilters({ ...filters, end_minutes: e.target.value })}
            >
              {minutes.map((m) => (
                <option key={m} value={format(m)}>{format(m)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Created At Start Date + Time */}
      {/* <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">CreatedAt SD</label>
        <div className="space-y-2">
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.created_start_date || ""}
            onChange={(e) =>
              setFilters({ 
                ...filters, 
                created_start_date: e.target.value,
                // Reset time when date changes if not already set
                created_start_hours: filters.created_start_hours || "00",
                created_start_minutes: filters.created_start_minutes || "00"
              })
            }
          />
          <div className="flex gap-2">
            <select 
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.created_start_hours || "00"}
              onChange={(e) => setFilters({ ...filters, created_start_hours: e.target.value })}
            >
              {hours.map((h) => (
                <option key={h} value={format(h)}>{format(h)}</option>
              ))}
            </select>
            <select 
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.created_start_minutes || "00"}
              onChange={(e) => setFilters({ ...filters, created_start_minutes: e.target.value })}
            >
              {minutes.map((m) => (
                <option key={m} value={format(m)}>{format(m)}</option>
              ))}
            </select>
          </div>
        </div>
      </div> */}

      {/* Created At End Date + Time */}
      {/* <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">CreatedAt ED</label>
        <div className="space-y-2">
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.created_end_date || ""}
            onChange={(e) => 
              setFilters({ 
                ...filters, 
                created_end_date: e.target.value,
                // Reset time when date changes if not already set
                created_end_hours: filters.created_end_hours || "23",
                created_end_minutes: filters.created_end_minutes || "59"
              })
            }
          />
          <div className="flex gap-2">
            <select 
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.created_end_hours || "23"}
              onChange={(e) => setFilters({ ...filters, created_end_hours: e.target.value })}
            >
              {hours.map((h) => (
                <option key={h} value={format(h)}>{format(h)}</option>
              ))}
            </select>
            <select 
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.created_end_minutes || "59"}
              onChange={(e) => setFilters({ ...filters, created_end_minutes: e.target.value })}
            >
              {minutes.map((m) => (
                <option key={m} value={format(m)}>{format(m)}</option>
              ))}
            </select>
          </div>
        </div>
      </div> */}

      {/* Clear Filters */}
      <div className="flex items-end col-span-full">
        <button
          onClick={() => setFilters({})}
          className="w-full bg-red-200 hover:bg-red-300 cursor-pointer text-gray-800 font-medium py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}