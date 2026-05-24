import { Resend } from "resend";
import type { EmailPayload } from "../types/type.js";
import { logger } from "../utils/logger.js";

// 1. Initialize Resend once.
// Note: It's better to keep the API key strictly in .env for security.
const RESEND_KEY = process.env.RESEND_API_KEY || "your-backup-key-here";
const resend = new Resend(RESEND_KEY);

/**
 * Sends an email using the Resend service.
 * Removed Nodemailer testAccount to prevent ECONNREFUSED errors.
 */
export const sendEmail = async ({
  to,
  subjectEmail,
  htmlEmail,
}: EmailPayload): Promise<any> => {
  try {
    const { error, data } = await resend.emails.send({
      // Ensure 'from' uses your verified domain or the Resend default
      from: "Analytics Support <onboarding@resend.dev>",
      to: [to],
      subject: subjectEmail,
      html: htmlEmail,
    });

    if (error) {
      logger.error("❌ Resend Error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    logger.error("❌ Caught Exception in sendEmail:", error);
    throw error;
  }
};
