

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private static readonly FROM_EMAIL = process.env.EMAIL_FROM || "noreply@vestroll.com";
  private static readonly APP_NAME = "VestRoll";

  static async send(options: EmailOptions): Promise<void> {
    // Email sending is mocked/implemented via external service
    // Structured logging handled through Logger service
  }

  private static getBaseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.APP_NAME}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #17171C;
      background-color: #F5F6F7;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo h1 {
      color: #5E2A8C;
      font-size: 28px;
      margin: 0;
    }
    h2 {
      color: #17171C;
      font-size: 24px;
      margin: 0 0 16px 0;
    }
    p {
      color: #4A4A4A;
      margin: 0 0 16px 0;
    }
    .alert-box {
      background-color: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
    }
    .alert-box.warning {
      background-color: #FFFBEB;
      border-color: #FDE68A;
    }
    .alert-box.success {
      background-color: #F0FDF4;
      border-color: #BBF7D0;
    }
    .alert-box.info {
      background-color: #EFF6FF;
      border-color: #BFDBFE;
    }
    .code-box {
      background-color: #F3F4F6;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      font-family: monospace;
      font-size: 14px;
    }
    .backup-codes {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin: 16px 0;
    }
    .backup-code {
      background-color: #F3F4F6;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 14px;
      text-align: center;
    }
    .button {
      display: inline-block;
      background-color: #5E2A8C;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      margin: 16px 0;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #E5E7EB;
    }
    .footer p {
      color: #9CA3AF;
      font-size: 12px;
    }
    .timestamp {
      color: #9CA3AF;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <h1>${this.APP_NAME}</h1>
      </div>
      ${content}
      <div class="footer">
        <p>This is an automated security notification from ${this.APP_NAME}.</p>
        <p>&copy; ${new Date().getFullYear()} ${this.APP_NAME}. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  static async sendTwoFactorEnabledEmail(
    email: string,
    firstName: string
  ): Promise<void> {
    const content = `
      <h2>Two-Factor Authentication Enabled</h2>
      <p>Hi ${firstName},</p>
      <p>Two-factor authentication (2FA) has been successfully enabled on your ${this.APP_NAME} account.</p>

      <div class="alert-box success">
        <strong>Your account is now more secure!</strong>
        <p style="margin: 8px 0 0 0;">You'll need to enter a verification code from your authenticator app each time you sign in.</p>
      </div>

      <p><strong>Important reminders:</strong></p>
      <ul>
        <li>Keep your backup codes in a safe place</li>
        <li>Never share your verification codes with anyone</li>
        <li>If you lose access to your authenticator app, use your backup codes to sign in</li>
      </ul>

      <p class="timestamp">Enabled on: ${new Date().toLocaleString()}</p>

      <div class="alert-box warning">
        <strong>Didn't make this change?</strong>
        <p style="margin: 8px 0 0 0;">If you didn't enable 2FA, please contact our support team immediately and secure your account.</p>
      </div>
    `;

    await this.send({
      to: email,
      subject: `2FA Enabled - ${this.APP_NAME}`,
      html: this.getBaseTemplate(content),
    });
  }

  static async sendTwoFactorDisabledEmail(
    email: string,
    firstName: string
  ): Promise<void> {
    const content = `
      <h2>Two-Factor Authentication Disabled</h2>
      <p>Hi ${firstName},</p>
      <p>Two-factor authentication (2FA) has been disabled on your ${this.APP_NAME} account.</p>

      <div class="alert-box warning">
        <strong>Your account security has been reduced</strong>
        <p style="margin: 8px 0 0 0;">Without 2FA, your account is protected only by your password. We strongly recommend keeping 2FA enabled.</p>
      </div>

      <p class="timestamp">Disabled on: ${new Date().toLocaleString()}</p>

      <div class="alert-box">
        <strong>Didn't make this change?</strong>
        <p style="margin: 8px 0 0 0;">If you didn't disable 2FA, your account may be compromised. Please change your password immediately and re-enable 2FA.</p>
      </div>
    `;

    await this.send({
      to: email,
      subject: `Security Alert: 2FA Disabled - ${this.APP_NAME}`,
      html: this.getBaseTemplate(content),
    });
  }

  static async sendBackupCodesRegeneratedEmail(
    email: string,
    firstName: string
  ): Promise<void> {
    const content = `
      <h2>Backup Codes Regenerated</h2>
      <p>Hi ${firstName},</p>
      <p>New backup codes have been generated for your ${this.APP_NAME} account. Your previous backup codes are no longer valid.</p>

      <div class="alert-box info">
        <strong>Store your new backup codes securely</strong>
        <p style="margin: 8px 0 0 0;">Make sure to save your new backup codes in a secure location. You'll need them if you ever lose access to your authenticator app.</p>
      </div>

      <p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>

      <div class="alert-box warning">
        <strong>Didn't request new codes?</strong>
        <p style="margin: 8px 0 0 0;">If you didn't regenerate your backup codes, someone may have access to your account. Please secure your account immediately.</p>
      </div>
    `;

    await this.send({
      to: email,
      subject: `Backup Codes Regenerated - ${this.APP_NAME}`,
      html: this.getBaseTemplate(content),
    });
  }

  static async sendFailedTwoFactorAttemptEmail(
    email: string,
    firstName: string,
    ipAddress?: string,
    attemptCount?: number
  ): Promise<void> {
    const content = `
      <h2>Failed 2FA Verification Attempt</h2>
      <p>Hi ${firstName},</p>
      <p>We detected a failed two-factor authentication attempt on your ${this.APP_NAME} account.</p>

      <div class="alert-box">
        <strong>Attempt Details:</strong>
        <ul style="margin: 8px 0 0 0;">
          <li>Time: ${new Date().toLocaleString()}</li>
          ${ipAddress ? `<li>IP Address: ${ipAddress}</li>` : ""}
          ${attemptCount ? `<li>Failed attempts: ${attemptCount}</li>` : ""}
        </ul>
      </div>

      <p><strong>What this means:</strong></p>
      <p>Someone entered the correct password for your account but provided an incorrect verification code. This could be:</p>
      <ul>
        <li>You accidentally entering the wrong code</li>
        <li>Someone who knows your password trying to access your account</li>
      </ul>

      <div class="alert-box warning">
        <strong>If this wasn't you:</strong>
        <p style="margin: 8px 0 0 0;">We recommend changing your password immediately. Your 2FA protection prevented unauthorized access, but your password may be compromised.</p>
      </div>
    `;

    await this.send({
      to: email,
      subject: `Security Alert: Failed 2FA Attempt - ${this.APP_NAME}`,
      html: this.getBaseTemplate(content),
    });
  }

  static async sendAccountLockedEmail(
    email: string,
    firstName: string,
    lockoutMinutes: number = 15
  ): Promise<void> {
    const content = `
      <h2>Account Temporarily Locked</h2>
      <p>Hi ${firstName},</p>
      <p>Your ${this.APP_NAME} account has been temporarily locked due to multiple failed two-factor authentication attempts.</p>

      <div class="alert-box">
        <strong>Account locked for ${lockoutMinutes} minutes</strong>
        <p style="margin: 8px 0 0 0;">You can try signing in again after the lockout period expires.</p>
      </div>

      <p class="timestamp">Locked at: ${new Date().toLocaleString()}</p>

      <div class="alert-box warning">
        <strong>If this wasn't you:</strong>
        <p style="margin: 8px 0 0 0;">Someone may be trying to access your account. While your 2FA protection is working, we recommend changing your password once you regain access.</p>
      </div>
    `;

    await this.send({
      to: email,
      subject: `Security Alert: Account Locked - ${this.APP_NAME}`,
      html: this.getBaseTemplate(content),
    });
  }

  static async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetLink: string
  ): Promise<void> {
    const content = `
      <h2>Reset Your Password</h2>
      <p>Hi ${firstName},</p>
      <p>We received a request to reset the password for your ${this.APP_NAME} account. Click the button below to set a new password:</p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </div>

      <p>This link will expire in <strong>1 hour</strong>.</p>

      <div class="alert-box info">
        <strong>Link not working?</strong>
        <p style="margin: 8px 0 0 0;">Copy and paste the following URL into your browser:</p>
        <div class="code-box" style="word-break: break-all; font-size: 12px;">${resetLink}</div>
      </div>

      <div class="alert-box warning">
        <strong>Didn't request a password reset?</strong>
        <p style="margin: 8px 0 0 0;">If you didn't request this, you can safely ignore this email. Your password will not be changed.</p>
      </div>
    `;

    await this.send({
      to: email,
      subject: `Reset your password - ${this.APP_NAME}`,
      html: this.getBaseTemplate(content),
    });
  }

  static async sendVerificationOTPEmail(
    email: string,
    firstName: string,
    otp: string
  ): Promise<void> {
    const content = `
      <h2>Verify Your Email</h2>
      <p>Hi ${firstName},</p>
      <p>Please use the following code to verify your email address:</p>

      <div class="code-box" style="text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold;">
        ${otp}
      </div>

      <p>This code will expire in 15 minutes.</p>

      <div class="alert-box info">
        <strong>Security tip:</strong>
        <p style="margin: 8px 0 0 0;">Never share this code with anyone. ${this.APP_NAME} will never ask for your verification code.</p>
      </div>
    `;

    await this.send({
      to: email,
      subject: `Your verification code - ${this.APP_NAME}`,
      html: this.getBaseTemplate(content),
    });
  }

  static async sendInvitationEmail(options: {
    to: string;
    organizationName: string;
    invitedByName: string;
    role: string;
    token: string;
    message?: string;
  }): Promise<void> {
    const { to, organizationName, invitedByName, role, token, message } = options;
    
    const roleDisplayNames = {
      admin: "Administrator",
      hr_manager: "HR Manager", 
      payroll_manager: "Payroll Manager",
      employee: "Employee",
    };

    const content = `
      <h2>You're Invited to Join ${organizationName}</h2>
      <p>Hello,</p>
      <p>${invitedByName} has invited you to join <strong>${organizationName}</strong> on ${this.APP_NAME} as a <strong>${roleDisplayNames[role as keyof typeof roleDisplayNames] || role}</strong>.</p>
      
      ${message ? `<div class="alert-box info" style="margin: 20px 0;"><p><strong>Message from ${invitedByName}:</strong></p><p>"${message}"</p></div>` : ''}
      
      <p>Click the button below to accept this invitation and get started:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/accept?token=${token}" 
           class="button" 
           style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Accept Invitation
        </a>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6B7280; font-size: 14px;">
        ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/accept?token=${token}
      </p>
      
      <p style="margin-top: 30px;"><strong>What happens next?</strong></p>
      <ul>
        <li>Create your account with your email and a secure password</li>
        <li>Access your organization's payroll dashboard</li>
        <li>Start managing your payroll and payments</li>
      </ul>
      
      <div class="alert-box warning" style="margin-top: 30px;">
        <strong>Important:</strong>
        <p style="margin: 8px 0 0 0;">This invitation will expire in 7 days. If you don't accept it by then, you'll need to request a new invitation.</p>
      </div>
      
      <p style="margin-top: 30px;">If you weren't expecting this invitation, you can safely ignore this email.</p>
    `;

    await this.send({
      to,
      subject: `You're invited to join ${organizationName} - ${this.APP_NAME}`,
      html: this.getBaseTemplate(content),
    });
  }
}
