/**
 * REP TRACK — Email Service Interface & Architecture Preparation
 *
 * NOTE (STEP 16 Section 7):
 * Live email delivery is intentionally deferred until an authoritative
 * employee-email mapping exists. The current organization Excel does not
 * provide sufficient email addresses.
 *
 * This service establishes the pluggable architecture so Gmail / SMTP / API delivery
 * can be plugged in without refactoring authentication or provisioning logic.
 */

export interface TemporaryCredentialEmailPayload {
  toEmail?: string | null;
  employeeName: string;
  username: string;
  temporaryPassword?: string;
  positionTitle?: string;
}

export interface EmailDeliveryResult {
  sent: boolean;
  messageId?: string;
  error?: string;
  reason?: string;
}

export interface IEmailService {
  sendTemporaryCredentials(payload: TemporaryCredentialEmailPayload): Promise<EmailDeliveryResult>;
}

/**
 * Stub / Deferred Email Service.
 * Logs intention securely (without leaking password in production) and returns deferred status.
 */
export class DeferredEmailService implements IEmailService {
  async sendTemporaryCredentials(payload: TemporaryCredentialEmailPayload): Promise<EmailDeliveryResult> {
    if (!payload.toEmail) {
      return {
        sent: false,
        reason: 'NO_EMAIL_MAPPING_AVAILABLE',
      };
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[EmailService:Deferred] Would deliver credentials to ${payload.toEmail} for username: ${payload.username}`);
    }

    return {
      sent: false,
      reason: 'EMAIL_INTEGRATION_DEFERRED_AWAITING_AUTHORITATIVE_MAPPING',
    };
  }
}

// Global service instance
let emailServiceInstance: IEmailService = new DeferredEmailService();

export function getEmailService(): IEmailService {
  return emailServiceInstance;
}

export function setEmailService(service: IEmailService): void {
  emailServiceInstance = service;
}
