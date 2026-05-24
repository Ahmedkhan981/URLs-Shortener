import fs from "fs/promises";
import path from "path";
import ejs from "ejs";
import mjml2html from "mjml";

const getTemplates = async () => {
  const emailTemplate = await fs.readFile(
    path.join(process.cwd(), "emails/email-template.mjml"),
    "utf-8",
  );

  const forgetPasswordTemplate = await fs.readFile(
    path.join(process.cwd(), "emails/forget-password-template.mjml"),
    "utf-8",
  );

  return { emailTemplate, forgetPasswordTemplate };
};

const templatesPromise = getTemplates();

export const generateHTML = async ({
  email,
  code,
  route,
  link
}: {
  email: string;
  code: string;
  link: string;
  route: "verify-email" | "forget-password";
}) => {
  const { emailTemplate, forgetPasswordTemplate } = await templatesPromise;

  let htmlTemplate = "";

  if (route === "verify-email") {
    const verificationLink = generateURL({ email, code,link });

    const filledTemplate = ejs.render(emailTemplate, {
      verificationLink,
      code,
    });

    const { html, errors } = await mjml2html(filledTemplate);

    htmlTemplate = html;

    if (errors.length > 0) {
      console.log("MJML Errors:", errors);
    }
  } else if (route === "forget-password") {
    const filledTemplate = ejs.render(forgetPasswordTemplate, {
      code,
    });

    const { html, errors } = await mjml2html(filledTemplate);

    htmlTemplate = html;

    if (errors.length > 0) {
      console.log("MJML Errors:", errors);
    }
  }

  return {
    to: email,
    subjectEmail: "Verify Your Email",
    htmlEmail: htmlTemplate,
  };
};

export const generateURL = ({
  email,
  code,
  link,
}: {
  email: string;
  code: string;
  link: string;
}) => {
  const verifyURL = new URL(`${link}/verify/verify-email`);

  verifyURL.searchParams.set("code", code);
  verifyURL.searchParams.set("email", email);

  return verifyURL.toString();
};
