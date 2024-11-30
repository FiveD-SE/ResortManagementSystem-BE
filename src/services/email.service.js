const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');
const logger = require('../config/logger');

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 * @returns {Promise}
 */
const sendEmail = async (to, subject, html) => {
  const msg = { from: config.email.from, to, subject, html };
  await transport.sendMail(msg);
};

/**
 * Load HTML template and replace placeholders
 * @param {string} templateName
 * @param {object} replacements
 * @returns {Promise<string>}
 */
const loadTemplate = async (templateName, replacements) => {
  const filePath = path.join(__dirname, '..', 'public', 'templates', `${templateName}.html`);
  let template = await fs.readFile(filePath, 'utf8');
  // eslint-disable-next-line guard-for-in, no-restricted-syntax
  for (const key in replacements) {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
  }
  return template;
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  const resetPasswordUrl = `http://localhost:3100/v1/auth/reset-password?token=${token}`;
  const html = await loadTemplate('reset_password', { resetPasswordUrl });
  await sendEmail(to, subject, html);
};

const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  const verificationEmailUrl = `http://localhost:3100/v1/auth/verify-email?token=${token}`;
  const html = await loadTemplate('verification_email', { verificationEmailUrl });
  await sendEmail(to, subject, html);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
