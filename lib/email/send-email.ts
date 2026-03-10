const RESEND_SEND_EMAIL_URL = "https://api.resend.com/emails";

type SendEmailParams = {
  fromEmail: string;
  html: string;
  resendApiKey: string;
  subject: string;
  text: string;
  toEmail: string;
};

export async function sendEmail({
  fromEmail,
  html,
  resendApiKey,
  subject,
  text,
  toEmail,
}: SendEmailParams): Promise<void> {
  const resendResponse = await fetch(RESEND_SEND_EMAIL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ resendApiKey }`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject,
      html,
      text,
    }),
    cache: "no-store",
  });

  if (!resendResponse.ok) {
    const resendError = await resendResponse.text();
    throw new Error(`Email delivery failed: ${ resendError }`);
  }
}
