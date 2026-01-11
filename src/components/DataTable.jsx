import { useState } from "react";
import { useGlobalContext } from "./ProductContext";

export default function DataTable() {
  const { orders } = useGlobalContext();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  if (!orders || orders.length === 0) {
    return <p className="text-center text-gray-500">Loading...</p>;
  }

  // Calculate total pages
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  // Get current page's orders
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Orders List</h2>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
          <th className="border border-gray-200 p-2">Sr.No</th>
            <th className="border border-gray-200 p-2">Order ID</th>
            <th className="border border-gray-200 p-2">Channel</th>
            <th className="border border-gray-200 p-2">Style Number</th>
            <th className="border border-gray-200 p-2">Size</th>
            <th className="border border-gray-200 p-2">Color</th>
            <th className="border border-gray-200 p-2">Status</th>
            <th className="border border-gray-200 p-2">Created At</th>
          </tr>
        </thead>
        <tbody>
          {currentOrders.map((order,i) => (
            <tr
              key={order.order_id}
              className="text-center border-b cursor-pointer duration-75 ease-in hover:bg-gray-100"
            >
                <td className="border border-gray-100 p-2">{i+1}</td>
              <td className="border border-gray-100 p-2">{order.order_id}</td>
              <td className="border border-gray-100 p-2">{order.channel}</td>
              <td className="border border-gray-100 p-2">{order.style_number}</td>
              <td className="border border-gray-100 p-2">{order.size}</td>
              <td className="border border-gray-100 p-2">{order.color}</td>
              <td className="border border-gray-100 p-2">{order.status}</td>
              <td className="border border-gray-100 p-2">{order.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex justify-center gap-4 rounded-md items-center mt-4 bg-gray-200">
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 1}
          className={`px-4 py-2 bg-blue-500 text-white rounded cursor-pointer ${
            currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
        >
          Previous
        </button>
        <span className="text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 bg-blue-500 text-white rounded cursor-pointer ${
            currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
