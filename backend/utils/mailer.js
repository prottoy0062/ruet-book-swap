// utils/mailer.js  (Google Apps Script version)
// Sends the OTP by calling a Google Apps Script web app over HTTPS.
// The script sends the email from your Gmail. Render allows HTTPS,
// so this works on the free plan (SMTP does not).
//
// Needs Node 18+ (built-in fetch). Env vars (local .env AND Render):
//   MAIL_SCRIPT_URL     -> the Web app URL from Apps Script (ends with /exec)
//   MAIL_SCRIPT_SECRET  -> same secret you put inside the Apps Script

// Generates a random 6-digit OTP as a string, e.g. "482913"
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(toEmail, otp) {
  const res = await fetch(process.env.MAIL_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      secret: process.env.MAIL_SCRIPT_SECRET,
      to: toEmail,
      subject: 'Your RUET BookSwap Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>RUET BookSwap</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    }),
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (e) { data = null; }

  if (!res.ok || !data || !data.ok) {
    throw new Error('Mail script failed: ' + text.slice(0, 200));
  }
}

module.exports = { generateOTP, sendOTPEmail };
