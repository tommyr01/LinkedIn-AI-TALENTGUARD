import { Worker, Job } from 'bullmq';
import { redisConnection, EnrichmentJobData } from '@/lib/queue';
import { supabase, contactOperations } from '@/lib/supabase';

// Mock enrichment service (replace with actual LinkedIn/email enrichment APIs)
class ContactEnrichmentService {
  static async enrichFromLinkedIn(linkedinUrl: string): Promise<{
    title?: string;
    company?: string;
    location?: string;
    industry?: string;
    experience?: string[];
    skills?: string[];
    education?: string[];
    profilePicture?: string;
  }> {
    // Simulate LinkedIn API call
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000)); // 1-4 seconds

    return {
      title: 'Senior Software Engineer',
      company: 'Tech Solutions Inc',
      location: 'San Francisco, CA',
      industry: 'Technology',
      experience: [
        'Senior Software Engineer at Tech Solutions Inc (2021 - Present)',
        'Software Engineer at StartupCo (2019 - 2021)',
        'Junior Developer at WebDev Agency (2017 - 2019)'
      ],
      skills: [
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes'
      ],
      education: [
        'B.S. Computer Science, Stanford University (2013 - 2017)'
      ],
      profilePicture: 'https://media.licdn.com/dms/image/example/profile.jpg'
    };
  }

  static async enrichFromEmail(email: string): Promise<{
    firstName?: string;
    lastName?: string;
    company?: string;
    title?: string;
    location?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    companyDomain?: string;
    phone?: string;
  }> {
    // Simulate email enrichment service call
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500)); // 0.5-2.5 seconds

    const domain = email.split('@')[1];
    const firstName = email.split('@')[0].split('.')[0];
    const lastName = email.split('@')[0].split('.')[1] || '';

    return {
      firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
      lastName: lastName ? lastName.charAt(0).toUpperCase() + lastName.slice(1) : '',
      company: `${domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)} Inc`,
      title: 'Business Development Manager',
      location: 'New York, NY',
      linkedinUrl: `https://linkedin.com/in/${firstName}-${lastName}`,
      companyDomain: domain,
      phone: '+1 (555) 123-4567'
    };
  }

  static async validateEmail(email: string): Promise<{
    isValid: boolean;
    deliverable: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    reason?: string;
  }> {
    // Simulate email validation service
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200)); // 0.2-1.2 seconds

    return {
      isValid: true,
      deliverable: Math.random() > 0.2, // 80% deliverable
      riskLevel: 'low',
      reason: Math.random() > 0.8 ? 'Role-based email' : undefined
    };
  }
}

// Enrichment worker implementation
const enrichmentWorker = new Worker<EnrichmentJobData>(
  'enrichment',
  async (job: Job<EnrichmentJobData>) => {
    const { contactId, linkedinUrl, email, companyId, priority } = job.data;
    
    console.log(`Starting enrichment job ${job.id} for contact: ${contactId}`);
    
    try {
      // Get current contact data
      const contactResult = await contactOperations.getById(contactId);
      if (!contactResult.success || !contactResult.data) {
        throw new Error(`Contact ${contactId} not found`);
      }

      const contact = contactResult.data;
      let enrichedData: any = {};
      
      await job.updateProgress(20);
      
      // Enrich from LinkedIn if URL provided
      if (linkedinUrl || contact.linkedin_url) {
        console.log(`Enriching contact ${contactId} from LinkedIn...`);
        try {
          const linkedinData = await ContactEnrichmentService.enrichFromLinkedIn(
            linkedinUrl || contact.linkedin_url!
          );
          
          enrichedData = {
            ...enrichedData,
            title: linkedinData.title || contact.title,
            company_name: linkedinData.company || contact.company_name,
            location: linkedinData.location || contact.location,
            industry: linkedinData.industry || contact.industry,
            experience: linkedinData.experience,
            skills: linkedinData.skills,
            education: linkedinData.education,
            profile_picture: linkedinData.profilePicture,
          };
        } catch (error) {
          console.warn(`LinkedIn enrichment failed for contact ${contactId}:`, error);
        }
      }
      
      await job.updateProgress(60);
      
      // Enrich from email if provided
      if (email || contact.email) {
        console.log(`Enriching contact ${contactId} from email...`);
        try {
          const [emailData, emailValidation] = await Promise.all([
            ContactEnrichmentService.enrichFromEmail(email || contact.email!),
            ContactEnrichmentService.validateEmail(email || contact.email!)
          ]);
          
          enrichedData = {
            ...enrichedData,
            name: enrichedData.name || `${emailData.firstName} ${emailData.lastName}`.trim() || contact.name,
            title: enrichedData.title || emailData.title || contact.title,
            company_name: enrichedData.company_name || emailData.company || contact.company_name,
            location: enrichedData.location || emailData.location || contact.location,
            phone: emailData.phone || contact.phone,
            linkedin_url: enrichedData.linkedin_url || emailData.linkedinUrl || contact.linkedin_url,
            email_valid: emailValidation.isValid,
            email_deliverable: emailValidation.deliverable,
            email_risk_level: emailValidation.riskLevel,
            email_validation_reason: emailValidation.reason,
          };
        } catch (error) {
          console.warn(`Email enrichment failed for contact ${contactId}:`, error);
        }
      }
      
      await job.updateProgress(80);
      
      // Update contact with enriched data
      if (Object.keys(enrichedData).length > 0) {
        const updateResult = await contactOperations.update(contactId, {
          ...enrichedData,
          last_enriched_at: new Date().toISOString(),
          enrichment_source: 'automated'
        });

        if (!updateResult.success) {
          throw new Error(`Failed to update contact: ${updateResult.error?.message}`);
        }
      }
      
      await job.updateProgress(100);
      
      console.log(`Completed enrichment job ${job.id} for contact: ${contactId}`);
      
      return {
        success: true,
        contactId,
        enrichedFields: Object.keys(enrichedData),
        linkedinEnriched: Boolean(linkedinUrl || contact.linkedin_url),
        emailEnriched: Boolean(email || contact.email),
        newFieldsCount: Object.keys(enrichedData).length
      };
      
    } catch (error) {
      console.error(`Enrichment job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 enrichment jobs simultaneously
    limiter: {
      max: 50, // Maximum 50 jobs per duration (rate limits)
      duration: 60000, // 1 minute
    },
  }
);

// Worker event handlers
enrichmentWorker.on('completed', (job) => {
  console.log(`Enrichment job ${job.id} completed successfully`);
});

enrichmentWorker.on('failed', (job, err) => {
  console.error(`Enrichment job ${job?.id} failed:`, err.message);
});

enrichmentWorker.on('progress', (job, progress) => {
  console.log(`Enrichment job ${job.id} progress: ${progress}%`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down enrichment worker...');
  await enrichmentWorker.close();
  process.exit(0);
});

export default enrichmentWorker;