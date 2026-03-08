import { allowedPins } from '../allowedPins';

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { pin } = req.body || {};
  if (!pin) {
    res.status(400).json({ success: false, error: 'PIN is required' });
    return;
  }

  const ok = allowedPins.includes(pin);

  console.log({
    time: new Date().toISOString(),
    pin,
    success: ok,
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress
  });

  if (ok) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid PIN' });
  }
}