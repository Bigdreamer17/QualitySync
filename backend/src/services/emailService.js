const { Resend } = require('resend');
const config = require('../config');
const logger = require('../utils/logger');

const resend = new Resend(config.email.resendApiKey);

/**
 * Send verification email to new user
 */
async function sendVerificationEmail(email, name, token) {
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: config.email.from,
      to: email,
      subject: 'Verify your QualitySync account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">QualitySync</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0;">Welcome, ${name}!</h2>
            <p>Thank you for signing up for QualitySync. Please verify your email address to get started.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Verify Email Address</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">QualitySync - Quality Assurance Made Simple</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      logger.error('Failed to send verification email', { email, error });
      throw new Error('Failed to send verification email');
    }

    logger.info('Verification email sent', { email, messageId: data?.id });
    return data;
  } catch (error) {
    logger.error('Email service error', { email, error: error.message });
    throw error;
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, name, token) {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: config.email.from,
      to: email,
      subject: 'Reset your QualitySync password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">QualitySync</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">QualitySync - Quality Assurance Made Simple</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      logger.error('Failed to send password reset email', { email, error });
      throw new Error('Failed to send password reset email');
    }

    logger.info('Password reset email sent', { email, messageId: data?.id });
    return data;
  } catch (error) {
    logger.error('Email service error', { email, error: error.message });
    throw error;
  }
}

/**
 * Send welcome email after verification
 */
async function sendWelcomeEmail(email, name, role) {
  const roleDescriptions = {
    PM: 'As a Product Manager, you can create and manage test cases, view test results, and convert bugs into test cases.',
    QA: 'As a QA Tester, you can view and execute your assigned test cases, and report unlisted bugs.',
    ENG: 'As an Engineer, you can view failed and escalated tests, and access unlisted bug reports.',
  };

  try {
    const { data, error } = await resend.emails.send({
      from: config.email.from,
      to: email,
      subject: 'Welcome to QualitySync!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">QualitySync</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0;">Your account is verified!</h2>
            <p>Hi ${name},</p>
            <p>Your email has been verified and your account is now active.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="margin: 0;"><strong>Your Role:</strong> ${role}</p>
              <p style="margin: 10px 0 0 0; color: #6b7280;">${roleDescriptions[role]}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${config.frontendUrl}/login" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Go to Dashboard</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">QualitySync - Quality Assurance Made Simple</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      logger.error('Failed to send welcome email', { email, error });
      throw new Error('Failed to send welcome email');
    }

    logger.info('Welcome email sent', { email, messageId: data?.id });
    return data;
  } catch (error) {
    logger.error('Email service error', { email, error: error.message });
    throw error;
  }
}

/**
 * Send notification email for test assignment
 */
async function sendTestAssignmentEmail(email, name, testCase) {
  try {
    const { data, error } = await resend.emails.send({
      from: config.email.from,
      to: email,
      subject: 'New Test Case Assigned - QualitySync',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">QualitySync</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0;">New Test Case Assigned</h2>
            <p>Hi ${name},</p>
            <p>A new test case has been assigned to you:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="margin: 0;"><strong>Module/Platform:</strong> ${testCase.module_platform}</p>
              <p style="margin: 10px 0;"><strong>Test Case:</strong> ${testCase.test_case}</p>
              <p style="margin: 0;"><strong>Expected Result:</strong> ${testCase.expected_result}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${config.frontendUrl}/qa" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Assignment</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">QualitySync - Quality Assurance Made Simple</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      logger.error('Failed to send test assignment email', { email, error });
      return null;
    }

    logger.info('Test assignment email sent', { email, messageId: data?.id });
    return data;
  } catch (error) {
    logger.error('Email service error', { email, error: error.message });
    return null;
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendTestAssignmentEmail,
};
