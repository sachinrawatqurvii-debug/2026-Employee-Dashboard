import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LayoutDashboard, FileText, User, Package, Search, Box, LocateIcon } from "lucide-react";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const [activeHover, setActiveHover] = useState(null);

  // Navigation items configuration
  const navItems = [
    { path: "/reports", icon: FileText, label: "Pending Orders" },
    { path: "/", icon: LocateIcon, label: "Locationwise Productivity" },
    { path: "/products", icon: Package, label: "View Products", hidden: true },
    { path: "/status", icon: User, label: "Namewise Productivity " },
    { path: "/date-wise-productivity", icon: User, label: "DateWise Productivity" },
    { path: "/orders", icon: Box, label: "Orders Dashboard" },
    { path: "/date-wise-orders", icon: Box, label: "DateWise Orders Dashboard" },
    { path: "/tailor-and-cuttingMaster-dashboard", icon: Search, label: "Tailor & Cutting Master Dashboard" },
    { path: "/track-order-history", icon: Search, label: "Track History" },
    { path: "/statement", icon: User, label: "Tailor Statement" },
  ];

  return (
    <div className="flex">
      <div
        className={`${isOpen ? "w-64" : "w-20"
          } h-screen bg-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col border-r border-gray-700`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {isOpen ? (
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 rounded-md truncate">
              Dashboard
            </h1>
          ) : (
            <div className="w-10 h-10 rounded-md bg-blue-500 flex items-center justify-center">
              <span className="font-bold text-white">ED</span>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? (
              <X size={20} className="text-gray-300" />
            ) : (
              <Menu size={20} className="text-gray-300" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            if (item.hidden) return null;

            const isActive = location.pathname === item.path;
            const isHovered = activeHover === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center p-3 rounded-lg transition-all duration-200 ${isActive
                  ? "bg-blue-600/20 text-blue-400 border-l-4 border-blue-500"
                  : "hover:bg-gray-800/50 text-gray-300"
                  } ${isOpen ? "justify-start" : "justify-center"}`}
                onMouseEnter={() => setActiveHover(item.path)}
                onMouseLeave={() => setActiveHover(null)}
              >
                <item.icon
                  size={20}
                  className={`flex-shrink-0 ${isActive ? "text-blue-400" : "text-gray-400"
                    } ${isHovered && !isActive ? "text-white" : ""}`}
                />
                {isOpen && (
                  <span
                    className={`ml-3 ${isActive ? "font-medium" : "font-normal"
                      }`}
                  >
                    {item.label}
                  </span>
                )}
                {!isOpen && isHovered && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md shadow-lg z-10 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-xs text-gray-500 text-center">
          {isOpen ? "v1.0.0 © 2023" : "v1.0.0"}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;