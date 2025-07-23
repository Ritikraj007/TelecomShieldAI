import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThreatOverview from "@/components/dashboard/threat-overview";
import ThreatControls from "@/components/dashboard/threat-controls";
import ThreatTimeline from "@/components/dashboard/threat-timeline";
import LiveThreatFeed from "@/components/dashboard/live-threat-feed";
import AutoResponsePanel from "@/components/dashboard/auto-response-panel";
import CSVUploadPanel from "@/components/dashboard/csv-upload-panel";

interface CSVAnalysisResult {
  totalRecords: number;
  threatsDetected: number;
  highRiskRecords: number;
  averageRiskScore: number;
  threatsByType: Record<string, number>;
  processedAt: Date;
}

export default function Dashboard() {
  const [filters, setFilters] = useState({
    severity: "all",
    type: "all",
    timeRange: "hour"
  });

  const [analysisData, setAnalysisData] = useState<CSVAnalysisResult | null>(null);

  const handleAnalysisComplete = (analysis: CSVAnalysisResult) => {
    setAnalysisData(analysis);
  };

  const handleExportCSV = async () => {
    if (!analysisData) {
      alert("Please upload and analyze CSV data first");
      return;
    }
    
    try {
      const response = await fetch("/api/export/threats");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `threats-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export CSV:", error);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="pwc-card border-b p-6 m-0 rounded-none">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Real-Time Threat Dashboard</h2>
            <p className="text-gray-400">PwC TelecomSOC - AI-Powered Cybersecurity Monitoring</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="status-indicator status-online" />
              <span className="text-sm text-gray-300">Live Analysis Active</span>
            </div>
            <Button 
              onClick={handleExportCSV} 
              className="pwc-button-primary"
              disabled={!analysisData}
            >
              <Download className="mr-2" size={16} />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* CSV Upload Panel */}
        <CSVUploadPanel onAnalysisComplete={handleAnalysisComplete} />

        {/* Show stats only after CSV analysis */}
        {analysisData && (
          <>
            {/* Threat Overview */}
            <ThreatOverview 
              stats={{
                activeThreats: analysisData.threatsDetected,
                riskScore: analysisData.averageRiskScore,
                blockedIPs: analysisData.highRiskRecords,
                detectionRate: Math.round((analysisData.threatsDetected / analysisData.totalRecords) * 100)
              }} 
              isLoading={false} 
            />

            {/* Threat Controls */}
            <ThreatControls onFiltersChange={setFilters} />

            {/* Threat Timeline */}
            <ThreatTimeline />

            {/* Live Threat Feed */}
            <LiveThreatFeed filters={filters} />

            {/* Auto Response Panel */}
            <AutoResponsePanel />
          </>
        )}

        {/* Show welcome message when no data is analyzed yet */}
        {!analysisData && (
          <div className="pwc-card p-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-white mb-4">
                Welcome to TelecomSOC
              </h3>
              <p className="text-gray-400 mb-6">
                Upload your call detail records (CDR) or SMS data to begin AI-powered threat analysis. 
                The dashboard will show real-time statistics and insights once your data is processed.
              </p>
              <div className="text-sm text-gray-500">
                Supported formats: CSV files with call records, SMS messages, or mixed data
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
