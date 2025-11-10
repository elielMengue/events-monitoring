import { type Email, type EmailSender } from "../domain/email.model";
import { Resend } from "resend";

export class ResendAdapter implements EmailSender {

    async sendEmail(email: Email): Promise<void> {

        const resend = await new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: "EDEV noreply@notifications.edev-ca.com",
            to: email.to,
            subject: email.subject,
            html: email.message,
        })
    }
}

