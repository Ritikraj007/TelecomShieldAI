import { useState } from "react";
import { Upload, FileText, BarChart3, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface CSVAnalysisResult {
  totalRecords: number;
  threatsDetected: number;
  highRiskRecords: number;
  averageRiskScore: number;
  threatsByType: Record<string, number>;
  processedAt: Date;
}

interface UploadResponse {
  success: boolean;
  analysis: CSVAnalysisResult;
  message: string;
}

interface CSVUploadPanelProps {
  onAnalysisComplete?: (analysis: CSVAnalysisResult) => void;
}

export default function CSVUploadPanel({ onAnalysisComplete }: CSVUploadPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<CSVAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError("Please select a CSV file");
        return;
      }
      setSelectedFile(file);
      setError(null);
      setAnalysisResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);
      formData.append('fileType', 'mixed'); // Auto-detect from CSV content

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result: UploadResponse = await response.json();
      setAnalysisResult(result.analysis);
      
      // Notify parent component about the analysis completion
      if (onAnalysisComplete) {
        onAnalysisComplete(result.analysis);
      }
      
      // Refresh dashboard data
      await queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/threats'] });
      
      toast({
        title: "Analysis Complete",
        description: result.message,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      toast({
        title: "Upload Failed",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getThreatLevelColor = (score: number) => {
    if (score >= 8) return "bg-red-500";
    if (score >= 6) return "bg-orange-500";
    if (score >= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card className="pwc-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Upload className="h-5 w-5 text-orange-500" />
          <span>CSV Data Analysis</span>
        </CardTitle>
        <CardDescription className="text-gray-400">
          Upload your call detail records (CDR) or SMS data for AI-powered threat analysis using Gemini 2.5 Flash
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload CSV File (Call Records, SMS Data, or Mixed)
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex items-center justify-center w-full h-12 border border-gray-600 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <Upload className="h-5 w-5 mr-2 text-orange-500" />
                <span className="text-white">
                  {selectedFile ? selectedFile.name : "Choose CSV file"}
                </span>
              </label>
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-300">{selectedFile.name}</span>
                <Badge variant="secondary">{(selectedFile.size / 1024).toFixed(1)} KB</Badge>
              </div>
              <Button 
                onClick={handleUpload} 
                disabled={isUploading}
                className="pwc-button-primary"
              >
                {isUploading ? "Analyzing..." : "Analyze Data"}
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Analyzing your data...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {error && (
            <Alert className="border-red-600 bg-red-900/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-white">Analysis Results</h3>
            </div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-xs text-gray-400 uppercase tracking-wide">Total Records</div>
                <div className="text-xl font-bold text-white">{analysisResult.totalRecords.toLocaleString()}</div>
              </div>
              
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-xs text-gray-400 uppercase tracking-wide">Threats Detected</div>
                <div className="text-xl font-bold text-red-400">{analysisResult.threatsDetected}</div>
              </div>
              
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-xs text-gray-400 uppercase tracking-wide">High Risk</div>
                <div className="text-xl font-bold text-orange-400">{analysisResult.highRiskRecords}</div>
              </div>
              
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-xs text-gray-400 uppercase tracking-wide">Avg Risk Score</div>
                <div className="flex items-center space-x-2">
                  <div className="text-xl font-bold text-white">
                    {analysisResult.averageRiskScore.toFixed(1)}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${getThreatLevelColor(analysisResult.averageRiskScore)}`} />
                </div>
              </div>
            </div>

            {/* Threat Types Breakdown */}
            {Object.keys(analysisResult.threatsByType).length > 0 && (
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Threats by Type</h4>
                <div className="space-y-2">
                  {Object.entries(analysisResult.threatsByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm text-gray-400 capitalize">
                        {type.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Analysis completed at {new Date(analysisResult.processedAt).toLocaleString()}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 bg-gray-800 p-3 rounded-lg">
          <strong>CSV Format:</strong> Your CSV should include columns like fromNumber, toNumber, duration, timestamp, message (for SMS), etc. 
          The system will automatically map common column names.
        </div>
      </CardContent>
    </Card>
  );
}