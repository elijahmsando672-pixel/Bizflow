const PROVIDER = process.env.SMS_PROVIDER || 'log';

const providers = {
  log: async ({ to, message }) => {
    console.log(`[SMS] To: ${to}, Message: ${message}`);
    return { success: true, provider: 'log' };
  },

  africastalking: async ({ to, message }) => {
    const username = process.env.AT_USERNAME;
    const apiKey = process.env.AT_API_KEY;
    if (!username || !apiKey) throw new Error('Africa\'s Talking not configured');

    const resp = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'ApiKey': apiKey,
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        username, to, message, from: process.env.AT_SENDER_ID || 'BIZFLOW',
      }),
    });
    const data = await resp.json();
    return { success: data.SMSMessageData?.Recipients?.[0]?.status === 'Success', provider: 'africastalking', data };
  },

  twilio: async ({ to, message }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE;
    if (!accountSid || !authToken || !from) throw new Error('Twilio not configured');

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: new URLSearchParams({ To: to, From: from, Body: message }),
    });
    const data = await resp.json();
    return { success: !data.error_code, provider: 'twilio', data };
  },
};

export const sendSMS = async ({ to, message }) => {
  const provider = providers[PROVIDER] || providers.log;
  try {
    return await provider({ to, message });
  } catch (err) {
    console.error(`SMS failed (${PROVIDER}):`, err.message);
    return { success: false, error: err.message, provider: PROVIDER };
  }
};

export const sendVerificationSMS = async (phone, code) => {
  return sendSMS({ to: phone, message: `Your BizFlow verification code is: ${code}` });
};

export const sendNotificationSMS = async (phone, message) => {
  return sendSMS({ to: phone, message: `BizFlow: ${message}` });
};
