import dotenv from 'dotenv';
dotenv.config();

const secretKey = process.env.PAYSTACK_SECRET_KEY;

async function testCurrencies() {
  const currencies = ['USD', 'NGN', 'GHS', 'ZAR', 'KES', undefined];

  for (const curr of currencies) {
    const payload: any = {
      email: 'olalekan4565@gmail.com',
      amount: 10000,
      reference: `TEST-CURR-${curr || 'DEFAULT'}-${Date.now()}`,
    };
    if (curr) payload.currency = curr;

    try {
      const res = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log(`Currency: ${curr || 'DEFAULT (OMITTED)'} -> Status: ${data.status}, Message: ${data.message}, Auth URL: ${data.data?.authorization_url}`);
    } catch (err: any) {
      console.log(`Currency: ${curr} -> Exception: ${err.message}`);
    }
  }
}

testCurrencies();
