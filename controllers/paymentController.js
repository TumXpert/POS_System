const axios = require('axios');

// Mock credentials/configs – replace with real ones from Airtel Money and Bank APIs
const airtelConfig = {
  clientId: process.env.AIRTEL_CLIENT_ID,
  clientSecret: process.env.AIRTEL_CLIENT_SECRET,
  baseUrl: 'https://openapi.airtel.africa/merchant',
};

const bankConfig = {
  baseUrl: process.env.BANK_API_URL,
  apiKey: process.env.BANK_API_KEY,
};

exports.initiatePayment = async (req, res) => {
  const { method, amount, phone, account_number, transaction_reference } = req.body;

  if (!method || !amount || (!phone && !account_number)) {
    return res.status(400).json({ message: 'Missing required payment fields' });
  }

  try {
    if (method === 'airtel_money') {
      // 1. Get access token
      const tokenRes = await axios.post(
        `${airtelConfig.baseUrl}/auth/oauth2/token`,
        {
          client_id: airtelConfig.clientId,
          client_secret: airtelConfig.clientSecret,
          grant_type: 'client_credentials',
        }
      );
      const accessToken = tokenRes.data.access_token;

      // 2. Initiate Airtel payment
      const paymentRes = await axios.post(
        `${airtelConfig.baseUrl}/v1/payments`,
        {
          amount: { currency: 'KES', value: amount },
          reference: transaction_reference,
          subscriber: { country: 'KE', currency: 'KES', msisdn: phone },
          transaction: { type: 'debit' },
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return res.status(200).json({ message: 'Airtel payment initiated', data: paymentRes.data });

    } else if (method === 'bank') {
      const paymentRes = await axios.post(
        `${bankConfig.baseUrl}/payments/initiate`,
        {
          amount,
          account_number,
          reference: transaction_reference,
        },
        {
          headers: { 'Authorization': `Bearer ${bankConfig.apiKey}` },
        }
      );
      return res.status(200).json({ message: 'Bank payment initiated', data: paymentRes.data });
    }

    res.status(400).json({ message: 'Unsupported payment method' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Payment initiation failed', error: error.message });
  }
};

exports.confirmPayment = async (req, res) => {
  const { method, transaction_reference } = req.body;

  try {
    if (method === 'airtel_money') {
      const tokenRes = await axios.post(
        `${airtelConfig.baseUrl}/auth/oauth2/token`,
        {
          client_id: airtelConfig.clientId,
          client_secret: airtelConfig.clientSecret,
          grant_type: 'client_credentials',
        }
      );
      const accessToken = tokenRes.data.access_token;

      const statusRes = await axios.get(
        `${airtelConfig.baseUrl}/v1/payments/${transaction_reference}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return res.status(200).json({ message: 'Airtel payment status', data: statusRes.data });

    } else if (method === 'bank') {
      const statusRes = await axios.get(
        `${bankConfig.baseUrl}/payments/status/${transaction_reference}`,
        {
          headers: { 'Authorization': `Bearer ${bankConfig.apiKey}` },
        }
      );
      return res.status(200).json({ message: 'Bank payment status', data: statusRes.data });
    }

    res.status(400).json({ message: 'Unsupported payment method' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Payment confirmation failed', error: error.message });
  }
};
