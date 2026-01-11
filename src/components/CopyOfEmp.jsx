import { useGlobalContext } from "./ProductContext";

const EmpDashboardCopy = () => {
  const { scanTracking2, orders } = useGlobalContext();

  // total orders update

  const totalOrders = orders.length;
  const foundInInventory = orders.filter(
    (order) => order.status === "shipped"
  ).length;
  const cutting = orders.filter((order) => order.status === "pending").length;
  const ship = scanTracking2.filter((track) =>
    track.locations.name.includes("Shipping Table")
  ).length;

  // portal wise update

  const myntraOrder = orders.filter((order) =>
    order.channel.includes("Myntra")
  ).length;
  const ajioOrder = orders.filter((order) =>
    order.channel.includes("Ajio")
  ).length;
  const tatacliqOrder = orders.filter((order) =>
    order.channel.includes("TataCliq")
  ).length;
  const shoppersstopOrder = orders.filter((order) =>
    order.channel.includes("ShoppersStop")
  ).length;
  const nykaaOrder = orders.filter((order) =>
    order.channel.includes("Nykaa")
  ).length;
  const shopifyOrder = orders.filter((order) =>
    order.channel.includes("Shopify")
  ).length;

  // portal wise inventory

  const myntraInventory = orders.filter(
    (order) => order.status === "shipped" && order.channel.includes("Myntra")
  ).length;
  const ajioInventory = orders.filter(
    (order) => order.status === "shipped" && order.channel.includes("Ajio")
  ).length;
  const tatacliqInventory = orders.filter(
    (order) => order.status === "shipped" && order.channel.includes("TataCliq")
  ).length;
  const shoppesstopInventory = orders.filter(
    (order) =>
      order.status === "shipped" && order.channel.includes("ShoppersStop")
  ).length;
  const nykaaInventory = orders.filter(
    (order) => order.status === "shipped" && order.channel.includes("Nykaa")
  ).length;
  const shopifyInventory = orders.filter(
    (order) => order.status === "shipped" && order.channel.includes("Shopify")
  ).length;

  // portal wise cutting

  const myntraCutting = orders.filter(
    (order) => order.status === "pending" && order.channel.includes("Myntra")
  ).length;
  const ajioCutting = orders.filter(
    (order) => order.status === "pending" && order.channel.includes("Ajio")
  ).length;
  const tatacliqCutting = orders.filter(
    (order) => order.status === "pending" && order.channel.includes("TataCliq")
  ).length;
  const shoppesstopCutting = orders.filter(
    (order) =>
      order.status === "pending" && order.channel.includes("ShoppersStop")
  ).length;
  const nykaaCutting = orders.filter(
    (order) => order.status === "pending" && order.channel.includes("Nykaa")
  ).length;
  const shopifyCutting = orders.filter(
    (order) => order.status === "pending" && order.channel.includes("Shopify")
  ).length;

  // portal wise shiping status

  // Step 1: Find all order_ids from scanTracking2 where location is "Shipping Table"
  const shippingOrderIds = new Set(
    scanTracking2
      .filter((track) => track.locations?.name?.includes("Shipping Table"))
      .map((track) => track.order_id)
  );

  // Step 2: Count matching order_ids in orders array where channel includes "Myntra"
  const myntraShip = orders.filter(
    (order) =>
      shippingOrderIds.has(order.order_id) && order.channel?.includes("Myntra")
  ).length;

  const ajioShip = orders.filter(
    (order) =>
      shippingOrderIds.has(order.order_id) && order.channel?.includes("Ajio")
  ).length;

  const tatacliqShip = orders.filter(
    (order) =>
      shippingOrderIds.has(order.order_id) &&
      order.channel?.includes("TataCliq")
  ).length;

  const shoppersStopShip = orders.filter(
    (order) =>
      shippingOrderIds.has(order.order_id) &&
      order.channel?.includes("ShoppersStop")
  ).length;

  const nykaaShip = orders.filter(
    (order) =>
      shippingOrderIds.has(order.order_id) && order.channel?.includes("Nykaa")
  ).length;

  const shopifyShip = orders.filter(
    (order) =>
      shippingOrderIds.has(order.order_id) && order.channel?.includes("Shopify")
  ).length;

  // All cutting masters
  // Step 1: Filter Only Cutting Masters and Extract Relevant Data
  const cuttingMasterOrders = scanTracking2
    .filter((track) => track.locations?.name.includes("Cutting Master"))
    .map((track) => ({
      employee: track.employees?.user_name,
      order_id: track.orders_2?.order_id,
    }));

  // Step 2: Group by Employee and Count Unique Orders
  const cuttingMasterOrderCount = cuttingMasterOrders.reduce(
    (acc, { employee, order_id }) => {
      if (!acc[employee]) {
        acc[employee] = new Set(); // Store unique order IDs
      }
      acc[employee].add(order_id);
      return acc;
    },
    {}
  );

  // Step 3: Convert to Array Format for Table Display
  const uniqueCuttingMasters = Object.entries(cuttingMasterOrderCount).map(
    ([employee, orders]) => ({
      employee,
      uniqueOrdersCount: orders.size,
    })
  );


// All Tailors 

const tailors = scanTracking2
.filter((track) => track.locations?.name.includes("Tailor"))
.map((track) => ({
  employee: track.employees?.user_name,
  order_id: track.orders_2?.order_id,
}));

// Step 2: Group by Employee and Count Unique Orders
const tailorsCount = tailors.reduce(
(acc, { employee, order_id }) => {
  if (!acc[employee]) {
    acc[employee] = new Set(); // Store unique order IDs
  }
  acc[employee].add(order_id);
  return acc;
},
{}
);

// Step 3: Convert to Array Format for Table Display
const uniqueTailors = Object.entries(tailorsCount).map(
([employee, orders]) => ({
  employee,
  uniqueOrdersCount: orders.size,
})
);







  return (
    <div className="p-4">
      <div className="border border-gray-200 w-full flex flex-col md:flex-row gap-4 p-4">
        <div className="w-full  overflow-auto">
          
        <div className="mt-4 text-2xl text-blue-400 mb-4">
            <h1>All Portals Status</h1>
            <hr className="my-2" />
          </div>
          <table className="border-collapse border w-full text-sm">
            <thead>
              <tr className="border border-gray-200 bg-gray-100 text-center">
                <th className="border border-gray-200 p-3">Stage</th>
                <th className="border border-gray-200 p-3">Count</th>
              </tr>
            </thead>
            <tbody className="text-center">
              <tr className="hover:bg-gray-100">
                <td className="border border-gray-200 p-3">Total Orders</td>
                <td className="border border-gray-200 p-3"> {totalOrders} </td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="border border-gray-200 p-3">
                  Found In Inventory
                </td>
                <td className="border border-gray-200 p-3">
                  {" "}
                  {foundInInventory}
                </td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="border border-gray-200 p-3">Cutting</td>
                <td className="border border-gray-200 p-3"> {cutting}</td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="border border-gray-200 p-3">Ship</td>
                <td className="border border-gray-200 p-3">
                  {" "}
                  {ship + foundInInventory}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 text-2xl text-blue-400 mb-4 text-left">
            <h1>Channelwise Status</h1>
            <hr className="my-2" />
          </div>

          <table className="border-collapse border w-full text-sm text-center">
            <thead>
              <tr className="bg-gray-100 text-center">
                <th className="border border-gray-200 text-blue-500 p-3 ">
                  Portal
                </th>
                <th className="border border-gray-200 p-3">MYNTRA </th>
                <th className="border border-gray-200 p-3">AJIO </th>
                <th className="border border-gray-200 p-3">TATACLIQ </th>
                <th className="border border-gray-200 p-3">SHOPPESSTOP </th>
                <th className="border border-gray-200 p-3">NYKAA </th>
                <th className="border border-gray-200 p-3">SHOPIFY</th>
              </tr>

              {/* orders table  */}
              <tr className="text-center hover:bg-gray-100">
                <td className="border border-gray-200 p-3">Orders </td>
                <td className="border border-gray-200 p-3">{myntraOrder} </td>
                <td className="border border-gray-200 p-3">{ajioOrder} </td>
                <td className="border border-gray-200 p-3">{tatacliqOrder} </td>
                <td className="border border-gray-200 p-3">
                  {shoppersstopOrder}{" "}
                </td>
                <td className="border border-gray-200 p-3">{nykaaOrder} </td>
                <td className="border border-gray-200 p-3">{shopifyOrder}</td>
              </tr>

              {/* foundInInventory table  */}

              <tr className="text-center hover:bg-gray-100">
                <td className="border border-gray-200 p-3">Inventory </td>
                <td className="border border-gray-200 p-3">
                  {myntraInventory}{" "}
                </td>
                <td className="border border-gray-200 p-3">{ajioInventory} </td>
                <td className="border border-gray-200 p-3">
                  {tatacliqInventory}{" "}
                </td>
                <td className="border border-gray-200 p-3">
                  {shoppesstopInventory}{" "}
                </td>
                <td className="border border-gray-200 p-3">
                  {nykaaInventory}{" "}
                </td>
                <td className="border border-gray-200 p-3">
                  {shopifyInventory}
                </td>
              </tr>

              {/* cutting table  */}

              <tr className="text-center hover:bg-gray-100">
                <td className="border border-gray-200 p-3">Cutting </td>
                <td className="border border-gray-200 p-3">{myntraCutting} </td>
                <td className="border border-gray-200 p-3">{ajioCutting} </td>
                <td className="border border-gray-200 p-3">
                  {tatacliqCutting}{" "}
                </td>
                <td className="border border-gray-200 p-3">
                  {shoppesstopCutting}{" "}
                </td>
                <td className="border border-gray-200 p-3">{nykaaCutting} </td>
                <td className="border border-gray-200 p-3">{shopifyCutting}</td>
              </tr>

              {/* shiping table  */}

              <tr className="text-center hover:bg-gray-100">
                <td className="border border-gray-200 p-3">Ship </td>
                <td className="border border-gray-200 p-3">
                  {myntraShip + myntraInventory}{" "}
                </td>
                <td className="border border-gray-200 p-3">
                  {ajioShip + ajioInventory}{" "}
                </td>
                <td className="border border-gray-200 p-3">
                  {tatacliqShip + tatacliqInventory}{" "}
                </td>
                <td className="border border-gray-200 p-3">
                  {shoppersStopShip + shoppesstopInventory}{" "}
                </td>
                <td className="border border-gray-200 p-3">
                  {nykaaShip + nykaaInventory}{" "}
                </td>
                <td className="border border-gray-200 p-3">
                  {shopifyShip + shopifyInventory}
                </td>
              </tr>
            </thead>
          </table>
      {/* cutting masters  */}
          <div className="mt-4 text-2xl text-blue-400 mb-4">
            <h1>Cutting Masters</h1>
            <hr className="my-2" />
          </div>

          <table className="border-collapse border w-full text-sm">
            <thead>
              <tr className="border border-gray-200 bg-gray-100 text-center truncate">
                <th className="border border-gray-200 p-3">Name</th>
                <th className="border border-gray-200 p-3">
                  Unique Order Count
                </th>
              </tr>
            </thead>
            <tbody>
              {uniqueCuttingMasters.map((master) => (
                <tr key={master.employee} className="border hover:bg-gray-100 border-gray-200">
                  <td className="border border-gray-200 text-center p-3">
                    {master.employee}
                  </td>
                  <td className="border border-gray-200 text-center p-3">
                    {master.uniqueOrdersCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>


           {/* tailors  */}
           <div className="mt-4 text-2xl text-blue-400 mb-4">
            <h1>Tailors</h1>
            <hr className="my-2" />
          </div>

          <table className="border-collapse border w-full text-sm">
            <thead>
              <tr className="border border-gray-200 bg-gray-100 text-center truncate">
                <th className="border border-gray-200 p-3">Name</th>
                <th className="border border-gray-200 p-3">
                  Unique Order Count
                </th>
              </tr>
            </thead>
            <tbody>
              {uniqueTailors.map((tailor) => (
                <tr key={tailor.employee} className="border text-center hover:bg-gray-100 border-gray-200">
                  <td className="border border-gray-200 p-3">
                    {tailor.employee}
                  </td>
                  <td className="border border-gray-200 p-3">
                    {tailor.uniqueOrdersCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

};

export default EmpDashboardCopy;
