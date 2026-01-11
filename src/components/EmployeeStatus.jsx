import React, { useEffect, useState } from 'react';
import { useGlobalContext } from './ProductContext';
import Filters from "./Filters";

const EmployeeStatus = () => {
  const { scanTracking, loading } = useGlobalContext();
  const [summary, setSummary] = useState({});
  const [employeeTotals, setEmployeeTotals] = useState({});

  useEffect(() => {
    processScanData();
  }, [scanTracking]);

  const processScanData = () => {
    let orderSummary = {};
    let employeeOrderTotals = {};

    scanTracking.forEach((scan) => {
      const { order_id, scanned_timestamp } = scan;
      if (!order_id || !scanned_timestamp || !scan.employees.user_name) return;

      const employeeName = scan.employees.user_name;
      const orderDate = new Date(scanned_timestamp).toISOString().split('T')[0];

      if (!orderSummary[employeeName]) {
        orderSummary[employeeName] = {};
      }

      if (!orderSummary[employeeName][orderDate]) {
        orderSummary[employeeName][orderDate] = new Set();
      }

      orderSummary[employeeName][orderDate].add(order_id);

      if (!employeeOrderTotals[employeeName]) {
        employeeOrderTotals[employeeName] = new Set();
      }
      employeeOrderTotals[employeeName].add(order_id);
    });

    let finalSummary = {};
    Object.keys(orderSummary).forEach((employee) => {
      finalSummary[employee] = {};
      Object.keys(orderSummary[employee]).forEach((date) => {
        finalSummary[employee][date] = orderSummary[employee][date].size;
      });
    });

    let totalOrdersPerEmployee = {};
    Object.keys(employeeOrderTotals).forEach((employee) => {
      totalOrdersPerEmployee[employee] = employeeOrderTotals[employee].size;
    });

    setSummary(finalSummary);
    setEmployeeTotals(totalOrdersPerEmployee);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
         
          <div className="mt-4 md:mt-0">
            <Filters />
          </div>
          
        </div>

        <div className="overflow-x-auto">
           <h2 className="text-2xl font-bold text-gray-800">Employee Performance Dashboard</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Daily Scans
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Scans
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.keys(summary).map((employee) =>
                Object.keys(summary[employee]).map((date, dateIndex) => (
                  <tr key={`${employee}-${date}`} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {employee.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {summary[employee][date]}
                      </span>
                    </td>
                    {dateIndex === 0 && (
                      <td className="px-6 py-4 whitespace-nowrap text-center" rowSpan={Object.keys(summary[employee]).length}>
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {employeeTotals[employee]}
                        </span>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {Object.keys(summary).length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No data available</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeStatus;