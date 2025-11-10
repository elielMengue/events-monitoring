import { ResendAdapter } from "./outbound/resend.adapter";
import { type EmailSender, type Email } from "./domain/email.model";

// Mock email sender for testing
export class MockEmailSender implements EmailSender {
    async sendEmail(email: Email): Promise<void> {
        // Do nothing in tests
        return Promise.resolve();
    }
}

// Use mock in test environment, real adapter in production
export const resendAdapter = process.env.NODE_ENV === 'test'
    ? new MockEmailSender()
    : new ResendAdapter();