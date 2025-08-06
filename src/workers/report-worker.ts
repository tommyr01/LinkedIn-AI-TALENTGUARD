import { Worker, Job } from 'bullmq';
import { redisConnection, ReportJobData } from '@/lib/queue';
import { supabase, companyOperations, contactOperations, signalOperations } from '@/lib/supabase';

// Mock report generation service
class ReportGenerationService {
  static async generateCompanyReport(companyId: string, reportType: 'weekly' | 'monthly' | 'quarterly') {
    // Get company data
    const companyResult = await companyOperations.getById(companyId);
    if (!companyResult.success || !companyResult.data) {
      throw new Error(`Company ${companyId} not found`);
    }

    const company = companyResult.data;
    
    // Get related data
    const [contactsResult, signalsResult] = await Promise.all([
      contactOperations.getByCompany(companyId),
      signalOperations.getByCompany(companyId, { limit: 50 })
    ]);

    const contacts = contactsResult.success ? contactsResult.data || [] : [];
    const signals = signalsResult.success ? signalsResult.data || [] : [];

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (reportType) {
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
    }

    // Filter signals by date range
    const recentSignals = signals.filter(signal => {
      const signalDate = new Date(signal.signal_date || signal.created_at);
      return signalDate >= startDate && signalDate <= endDate;
    });

    // Generate report content
    const report = {
      title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report: ${company.name}`,
      company: {
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        isTgCustomer: company.tg_customer
      },
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        type: reportType
      },
      metrics: {
        totalContacts: contacts.length,
        newSignals: recentSignals.length,
        signalTypes: this.groupSignalsByType(recentSignals),
        engagement: this.calculateEngagementMetrics(recentSignals),
        trends: this.analyzeTrends(recentSignals, reportType)
      },
      insights: this.generateInsights(company, contacts, recentSignals, reportType),
      recommendations: this.generateRecommendations(company, contacts, recentSignals, reportType),
      charts: this.generateChartData(recentSignals, reportType)
    };

    return report;
  }

  private static groupSignalsByType(signals: any[]): Record<string, number> {
    const groups: Record<string, number> = {};
    signals.forEach((signal: any) => {
      const type = signal.signal_type || signal.type || 'Unknown';
      groups[type] = (groups[type] || 0) + 1;
    });
    return groups;
  }

  private static calculateEngagementMetrics(signals: any[]) {
    const engagementSignals = signals.filter(s => 
      ['Email Open', 'Link Click', 'Website Visit', 'Download'].includes(s.signal_type || s.type)
    );
    
    return {
      totalEngagements: engagementSignals.length,
      engagementRate: signals.length > 0 ? (engagementSignals.length / signals.length) * 100 : 0,
      averageEngagementsPerDay: signals.length > 0 ? engagementSignals.length / 7 : 0 // Assuming weekly
    };
  }

  private static analyzeTrends(signals: any[], reportType: string) {
    const days = reportType === 'weekly' ? 7 : reportType === 'monthly' ? 30 : 90;
    const dailyCounts: Record<string, number> = {};
    
    signals.forEach(signal => {
      const date = new Date(signal.signal_date || signal.created_at).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    const sortedDates = Object.keys(dailyCounts).sort();
    const trend = sortedDates.length >= 2 ? 
      dailyCounts[sortedDates[sortedDates.length - 1]] - dailyCounts[sortedDates[0]] : 0;

    return {
      direction: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
      change: trend,
      dailyCounts
    };
  }

  private static generateInsights(company: any, contacts: any[], signals: any[], reportType: string) {
    const insights = [];

    if (signals.length > 0) {
      insights.push(`Generated ${signals.length} new signals during this ${reportType} period.`);
      
      const mostCommonSignal = Object.entries(this.groupSignalsByType(signals))
        .sort(([,a], [,b]) => (b as number) - (a as number))[0];
      
      if (mostCommonSignal) {
        insights.push(`Most frequent signal type: ${mostCommonSignal[0]} (${mostCommonSignal[1]} occurrences).`);
      }
    }

    if (company.tg_customer) {
      insights.push(`${company.name} is a TalentGuard customer - prioritize engagement opportunities.`);
    }

    if (contacts.length > 10) {
      insights.push(`High contact volume (${contacts.length} contacts) suggests strong market presence.`);
    }

    const engagementMetrics = this.calculateEngagementMetrics(signals);
    if (engagementMetrics.engagementRate > 25) {
      insights.push(`High engagement rate (${engagementMetrics.engagementRate.toFixed(1)}%) indicates strong interest.`);
    }

    return insights;
  }

  private static generateRecommendations(company: any, contacts: any[], signals: any[], reportType: string) {
    const recommendations = [];

    if (signals.length === 0) {
      recommendations.push(`No signals detected this ${reportType}. Consider reaching out to re-engage.`);
    } else if (signals.length > 5) {
      recommendations.push(`High signal activity suggests a buying opportunity. Schedule follow-up calls.`);
    }

    const recentEngagement = signals.filter(s => 
      ['Email Open', 'Link Click', 'Website Visit'].includes(s.signal_type || s.type)
    ).length;

    if (recentEngagement > 0) {
      recommendations.push(`Recent engagement detected. Send personalized follow-up content.`);
    }

    if (company.industry && !company.tg_customer) {
      recommendations.push(`Research industry-specific use cases for ${company.industry} sector.`);
    }

    if (contacts.length < 3) {
      recommendations.push(`Limited contact coverage. Research additional stakeholders.`);
    }

    return recommendations;
  }

  private static generateChartData(signals: any[], reportType: string) {
    const dailyCounts: Record<string, number> = {};
    const signalTypes: Record<string, number> = {};
    
    signals.forEach(signal => {
      const date = new Date(signal.signal_date || signal.created_at).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      
      const type = signal.signal_type || signal.type || 'Unknown';
      signalTypes[type] = (signalTypes[type] || 0) + 1;
    });

    return {
      timeSeriesData: Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date)),
      signalTypeData: Object.entries(signalTypes).map(([type, count]) => ({
        type,
        count
      }))
    };
  }
}

// Report worker implementation
const reportWorker = new Worker<ReportJobData>(
  'reports',
  async (job: Job<ReportJobData>) => {
    const { companyId, reportType, userId, emailTo } = job.data;
    
    console.log(`Starting report generation job ${job.id} for company: ${companyId} (${reportType})`);
    
    try {
      await job.updateProgress(10);
      
      // Generate the report
      console.log(`Generating ${reportType} report for company ${companyId}...`);
      const report = await ReportGenerationService.generateCompanyReport(companyId, reportType);
      
      await job.updateProgress(50);
      
      // Save report to database (you might want to create a reports table)
      const reportRecord = {
        id: `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        company_id: companyId,
        report_type: reportType,
        title: report.title,
        content: JSON.stringify(report),
        generated_by: userId,
        generated_at: new Date().toISOString(),
        date_range_start: report.dateRange.start,
        date_range_end: report.dateRange.end
      };

      // Here you would typically save to a reports table in Supabase
      // For now, we'll simulate the save
      console.log(`Report generated and saved: ${reportRecord.id}`);
      
      await job.updateProgress(80);
      
      // Send email if requested (mock implementation)
      if (emailTo) {
        console.log(`Sending report ${reportRecord.id} to ${emailTo}...`);
        // This would integrate with your email service (SendGrid, etc.)
        await mockSendEmail(emailTo, report);
      }
      
      await job.updateProgress(100);
      
      console.log(`Completed report generation job ${job.id}`);
      
      return {
        success: true,
        reportId: reportRecord.id,
        companyId,
        reportType,
        metricsCount: Object.keys(report.metrics).length,
        insightsCount: report.insights.length,
        recommendationsCount: report.recommendations.length,
        emailSent: Boolean(emailTo)
      };
      
    } catch (error) {
      console.error(`Report generation job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Process up to 2 report jobs simultaneously
    limiter: {
      max: 20, // Maximum 20 reports per duration
      duration: 3600000, // 1 hour
    },
  }
);

// Mock email service
async function mockSendEmail(emailTo: string, report: any) {
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`Email sent to ${emailTo} with report: ${report.title}`);
  console.log(`Report summary: ${report.insights.length} insights, ${report.recommendations.length} recommendations`);
};

// Worker event handlers
reportWorker.on('completed', (job) => {
  console.log(`Report generation job ${job.id} completed successfully`);
});

reportWorker.on('failed', (job, err) => {
  console.error(`Report generation job ${job?.id} failed:`, err.message);
});

reportWorker.on('progress', (job, progress) => {
  console.log(`Report generation job ${job.id} progress: ${progress}%`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down report worker...');
  await reportWorker.close();
  process.exit(0);
});

export default reportWorker;