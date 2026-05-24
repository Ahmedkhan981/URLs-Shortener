import { sendEmail } from "../service/email.service.js";
import type { EmailPayload } from "../types/type.js";
import { logger } from "../utils/logger.js";

// Inside emailSendToken (service/lib level)
export const emailSendToken = async (
  emailObject: EmailPayload,
  email: string,
) => {
  try {
    const info = await sendEmail(emailObject);
    logger.info(`✅ Verification email sent to ${email}: ${info.response}`);
    return { info, isEmailSend: true };
  } catch (emailError) {
    logger.error("❌ Email transport error:", emailError);
    return { info: null, isEmailSend: false }; // Return false for isEmailSend on error
  }
};
