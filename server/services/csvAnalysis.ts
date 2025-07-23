import csv from 'csv-parser';
import { Readable } from 'stream';
import { threatAnalysisService } from './threatAnalysis';
import type { CDRRecord, SMSRecord } from './threatAnalysis';
import { storage } from '../storage';

export interface CSVAnalysisResult {
  totalRecords: number;
  threatsDetected: number;
  highRiskRecords: number;
  averageRiskScore: number;
  threatsByType: Record<string, number>;
  processedAt: Date;
}

export class CSVAnalysisService {
  async analyzeCSVData(fileBuffer: Buffer, fileType: 'cdr' | 'sms'): Promise<CSVAnalysisResult> {
    const records: any[] = [];
    
    // Parse CSV data
    const csvData = await this.parseCSV(fileBuffer);
    
    let threatsDetected = 0;
    let highRiskRecords = 0;
    let totalRiskScore = 0;
    const threatsByType: Record<string, number> = {};
    
    for (const row of csvData) {
      if (fileType === 'cdr') {
        const cdrRecord: CDRRecord = this.mapToCDRRecord(row);
        const threatInfo = await this.analyzeAndStoreThreat(cdrRecord, 'cdr');
        
        if (threatInfo) {
          threatsDetected++;
          if (threatInfo.aiScore >= 7) highRiskRecords++;
          totalRiskScore += threatInfo.aiScore;
          threatsByType[threatInfo.threatType] = (threatsByType[threatInfo.threatType] || 0) + 1;
        }
      } else if (fileType === 'sms') {
        const smsRecord: SMSRecord = this.mapToSMSRecord(row);
        const threatInfo = await this.analyzeAndStoreThreat(smsRecord, 'sms');
        
        if (threatInfo) {
          threatsDetected++;
          if (threatInfo.aiScore >= 7) highRiskRecords++;
          totalRiskScore += threatInfo.aiScore;
          threatsByType[threatInfo.threatType] = (threatsByType[threatInfo.threatType] || 0) + 1;
        }
      }
      
      records.push(row);
    }
    
    return {
      totalRecords: records.length,
      threatsDetected,
      highRiskRecords,
      averageRiskScore: threatsDetected > 0 ? totalRiskScore / threatsDetected : 0,
      threatsByType,
      processedAt: new Date()
    };
  }
  
  private async parseCSV(fileBuffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(fileBuffer);
      
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }
  
  private async analyzeAndStoreThreat(record: CDRRecord | SMSRecord, type: 'cdr' | 'sms') {
    try {
      if (type === 'cdr') {
        // Use the existing threat analysis service
        await threatAnalysisService.analyzeCDRRecord(record as CDRRecord);
        
        // Get the latest threat created for this source
        const threats = await storage.getThreats(10, 0);
        const latestThreat = threats.find(t => t.source === (record as CDRRecord).fromNumber);
        return latestThreat;
      } else {
        await threatAnalysisService.analyzeSMSRecord(record as SMSRecord);
        
        const threats = await storage.getThreats(10, 0);
        const latestThreat = threats.find(t => t.source === (record as SMSRecord).fromNumber);
        return latestThreat;
      }
    } catch (error) {
      console.error(`Error analyzing ${type} record:`, error);
      return null;
    }
  }
  
  private mapToCDRRecord(row: any): CDRRecord {
    return {
      callId: row.callId || row.call_id || `${Date.now()}-${Math.random()}`,
      fromNumber: row.fromNumber || row.from_number || row.caller || '',
      toNumber: row.toNumber || row.to_number || row.callee || '',
      duration: parseInt(row.duration || row.call_duration || '0'),
      timestamp: new Date(row.timestamp || row.call_time || Date.now()),
      callType: (row.callType || row.call_type || 'voice') as 'voice' | 'sms',
      location: row.location || row.cell_tower || '',
      imei: row.imei || row.device_id || ''
    };
  }
  
  private mapToSMSRecord(row: any): SMSRecord {
    return {
      messageId: row.messageId || row.message_id || `${Date.now()}-${Math.random()}`,
      fromNumber: row.fromNumber || row.from_number || row.sender || '',
      toNumber: row.toNumber || row.to_number || row.recipient || '',
      message: row.message || row.content || row.text || '',
      timestamp: new Date(row.timestamp || row.sent_time || Date.now()),
      messageType: (row.messageType || row.message_type || 'text') as 'text' | 'binary'
    };
  }
}

export const csvAnalysisService = new CSVAnalysisService();