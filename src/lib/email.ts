import nodemailer from "nodemailer";

export interface WelcomeEmailParams {
  toEmail: string;
  toName: string;
  memberCode: string; // e.g. KCM0004
  password: string;
  planName: string;
  startDate: string;
  phone?: string | null;
  coachName?: string | null;
}

export function generateWelcomeEmailHtml(params: WelcomeEmailParams): string {
  const { toName, memberCode, toEmail, password, planName, startDate, coachName } = params;
  const loginUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to KC Fitness Hub</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0c0d0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0c0d0e; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #16181a; border: 1px solid #272a2e; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 32px; background: linear-gradient(135deg, #1b1e22 0%, #121416 100%); border-bottom: 1px solid #272a2e; text-align: center;">
              <div style="display: inline-block; background-color: #ccff00; color: #0c0d0e; font-size: 20px; font-weight: 900; border-radius: 12px; padding: 8px 16px; margin-bottom: 14px; letter-spacing: -0.5px;">
                KC
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #f4f4f5; letter-spacing: 0.5px; text-transform: uppercase;">
                Welcome to KC Fitness Hub
              </h1>
              <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px;">
                Your membership is officially active & ready
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #f4f4f5;">
                Hello <strong>${toName}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #a1a1aa;">
                Your payment has been successfully confirmed, and your membership account at <strong>KC Fitness Hub</strong> is now active. You have full access to our gym floor, personalized workout schedules, diet tracking, and coach guidance.
              </p>

              <!-- Credentials Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0c0d0e; border: 1px solid #32363c; border-radius: 14px; margin-bottom: 28px; overflow: hidden;">
                <tr>
                  <td style="padding: 14px 20px; background-color: #1c2024; border-bottom: 1px solid #272a2e;">
                    <span style="font-size: 11px; font-weight: 700; color: #ccff00; letter-spacing: 1.5px; text-transform: uppercase;">
                      Your Official Member Access Credentials
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 12px; width: 40%; font-size: 13px; color: #71717a;">Official Member ID:</td>
                        <td style="padding-bottom: 12px; font-size: 15px; font-weight: 700; color: #ccff00; font-family: monospace;">${memberCode}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #71717a;">Registered Email:</td>
                        <td style="padding-bottom: 12px; font-size: 14px; color: #f4f4f5;">${toEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #71717a;">Login Password:</td>
                        <td style="padding-bottom: 12px; font-size: 15px; font-weight: 700; color: #ffffff; font-family: monospace; background-color: #1e2227; padding: 4px 8px; border-radius: 6px; display: inline-block;">${password}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #71717a;">Plan:</td>
                        <td style="padding-bottom: 12px; font-size: 14px; color: #f4f4f5; text-transform: capitalize;">${planName}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 13px; color: #71717a;">Start Date:</td>
                        <td style="padding-bottom: 12px; font-size: 14px; color: #f4f4f5;">${startDate}</td>
                      </tr>
                      ${
                        coachName
                          ? `<tr>
                              <td style="font-size: 13px; color: #71717a;">Assigned Coach:</td>
                              <td style="font-size: 14px; color: #f4f4f5; font-weight: 600;">${coachName}</td>
                            </tr>`
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Login CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}/login" target="_blank" style="display: inline-block; background-color: #ccff00; color: #0c0d0e; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 36px; border-radius: 12px; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(204,255,0,0.3);">
                      Sign In to Member Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Next steps -->
              <div style="background-color: #121416; border-left: 3px solid #ccff00; padding: 14px 16px; border-radius: 0 10px 10px 0; margin-bottom: 20px;">
                <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #f4f4f5;">
                  💡 Quick Tip:
                </p>
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #a1a1aa;">
                  You can sign in using either your <strong>Member ID (${memberCode})</strong> or your <strong>Email</strong> with the password provided above.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #71717a;">
                Need help or have questions? Contact the front desk at KC Fitness Hub or reply directly to this email. See you on the gym floor!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #101214; border-top: 1px solid #272a2e; text-align: center; font-size: 12px; color: #52525b;">
              &copy; ${new Date().getFullYear()} KC Fitness Hub. All rights reserved.<br>
              Premier Gym & Fitness Management Portal
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function generateWelcomeText(params: WelcomeEmailParams): string {
  const { toName, memberCode, toEmail, password, planName, startDate } = params;
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return `Welcome to KC Fitness Hub, ${toName}!

Your membership payment has been confirmed and your account is active.

YOUR LOGIN CREDENTIALS:
- Member ID: ${memberCode}
- Registered Email: ${toEmail}
- Password: ${password}
- Plan: ${planName}
- Start Date: ${startDate}

Sign in here: ${loginUrl}/login
(You can log in using either your Member ID or your Email).

See you at the gym!
KC Fitness Hub Team`;
}

export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}> {
  const subject = `Welcome to KC Fitness Hub! Your Member ID: ${params.memberCode}`;
  const html = generateWelcomeEmailHtml(params);
  const text = generateWelcomeText(params);

  // Check if SMTP environment variables are configured
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);
  const from = process.env.SMTP_FROM || `"KC Fitness Hub" <${user || "welcome@kcfitnesshub.com"}>`;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      const info = await transporter.sendMail({
        from,
        to: params.toEmail,
        subject,
        text,
        html,
      });

      console.log(`[Email] Welcome email sent to ${params.toEmail}: ${info.messageId}`);
      return { success: true, messageId: info.messageId, simulated: false };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Email Error] Failed to send via SMTP to ${params.toEmail}:`, errMsg);
      return { success: false, error: errMsg, simulated: false };
    }
  }

  // Fallback: simulated mode (logs full details cleanly and guarantees the user gets the credentials)
  console.log(`\n======================================================`);
  console.log(`[Email Simulated Mode] Welcome Email to ${params.toEmail}`);
  console.log(`Member: ${params.toName} (${params.memberCode})`);
  console.log(`Login Password: ${params.password}`);
  console.log(`Subject: ${subject}`);
  console.log(`======================================================\n`);

  return { success: true, simulated: true };
}
