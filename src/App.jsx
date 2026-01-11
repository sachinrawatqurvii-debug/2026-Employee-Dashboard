import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProductContextProvider } from "./components/ProductContext";

import Sidebar from "./components/Sidebar";
// import Dashboard from "./components/Dashboard";
import Dashboard from "./components/Dashboard"
import DataTable from "./components/DataTable";
import Reports from "./components/Reports";
import EmployeeStatus from "./components/EmployeeStatus";
import OrderDashboard from "./components/OrderDashboard";
import Test from "./components/Test";
import DateWiseOrderDashboard from "./components/DateWiseOrderDashboard";
import DetailTracker from "./components/DetailTracker";
import TailorAndCuttingMasterDashboard from "./components/TailorAndCuttingMasterDashboard";
import MapData from "./components/Map";
import TailorStatement from "./components/TailorStatement";
import PendingList from "./modifiedComponent/PendingList";



function App() {
  return (
    <ProductContextProvider>
      <BrowserRouter>
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<DataTable />} />
              <Route path="/reports" element={<PendingList />} />
              <Route path="/status" element={<EmployeeStatus />} />
              <Route path="/orders" element={<OrderDashboard />} />
              <Route path="/date-wise-orders" element={<DateWiseOrderDashboard />} />
              <Route path="/test" element={<Test />} />
              <Route path="/track-order-history" element={<DetailTracker />} />
              <Route path="/date-wise-productivity" element={<Test />} />
              <Route path="/map" element={<MapData />} />
              <Route path="/pending-list" element={<Reports />} />
              <Route path="/statement" element={<TailorStatement />} />
              <Route path="/tailor-and-cuttingMaster-dashboard" element={<TailorAndCuttingMasterDashboard />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </ProductContextProvider>
  );
}

export default App;
