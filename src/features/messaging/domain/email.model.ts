

export interface Email {
    from: string,
    to: string;
    subject: string;
    message: string;
}

export interface EmailSender {
    sendEmail(email: Email): Promise<void>;
}