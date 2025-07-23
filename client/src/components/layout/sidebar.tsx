import { Link, useLocation } from "wouter";
import { Shield, Gauge, Search, Bot, ShieldQuestion, FileText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import pwcLogo from "@assets/PwC-logo_1753270261116.png";

const navigation = [
  { name: "Real-Time Threats", href: "/", icon: Gauge },
  { name: "Anomaly Detection", href: "/anomaly-detection", icon: Search },
  { name: "Auto Response", href: "/auto-response", icon: Bot },
  { name: "Fraud Detection", href: "/fraud-detection", icon: ShieldQuestion },
  { name: "Compliance Reports", href: "/compliance-reports", icon: FileText },
];

const systemStatus = [
  { name: "Gemini AI", status: "online" },
  { name: "Detection Engine", status: "online" },
  { name: "Auto Response", status: "warning" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 pwc-sidebar flex-shrink-0 flex flex-col h-screen">
      <div className="p-6 border-b" style={{ borderColor: "var(--border-gray)" }}>
        <div className="flex flex-col space-y-4">
          {/* PwC Logo */}
          <div className="flex justify-center">
            <img src={pwcLogo} alt="PwC" className="h-12 w-auto" />
          </div>
          
          {/* Application Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center pwc-button-primary">
              <Shield className="text-white text-xl" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">TelecomSOC</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cybersecurity Monitoring</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <nav className="mt-6">
          <div className="px-4">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">Dashboard</p>
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <li key={item.name}>
                    <Link href={item.href}>
                      <span
                        className={cn(
                          "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                          isActive
                            ? "text-white pwc-button-primary"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                        )}
                      >
                        <item.icon className="mr-3" size={18} />
                        {item.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          
          <div className="px-4 mt-8 pb-6">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">System Status</p>
            <div className="space-y-3">
              {systemStatus.map((system) => (
                <div key={system.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{system.name}</span>
                  <span 
                    className={cn(
                      "status-indicator",
                      system.status === "online" && "status-online",
                      system.status === "warning" && "status-warning",
                      system.status === "offline" && "status-offline"
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </nav>
      </div>
      
      {/* Logout Button - Fixed positioning */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            localStorage.removeItem("isAuthenticated");
            localStorage.removeItem("userInfo");
            window.location.reload();
          }}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-600 hover:text-white rounded-md transition-colors"
        >
          <LogOut className="mr-3" size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
