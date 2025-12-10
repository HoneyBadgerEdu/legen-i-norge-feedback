export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get form data
  const { name, feedback } = req.body;

  // Basic validation
  if (!name || !feedback) {
    return res.status(400).json({ error: 'Name and feedback are required' });
  }

  // Sanitize inputs (basic protection)
  const sanitizedName = String(name).substring(0, 100);
  const sanitizedFeedback = String(feedback).substring(0, 1000);

  // Get bot token and chat ID from environment variables
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('Missing environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Format message with HTML escaping
  const escapeHtml = (text) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  const message = `🆕 <b>New Feedback</b>\n\n👤 <b>Name:</b> ${escapeHtml(sanitizedName)}\n💬 <b>Feedback:</b> ${escapeHtml(sanitizedFeedback)}`;

  try {
    // Send to Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data);
      throw new Error(data.description || 'Telegram API error');
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Feedback sent successfully!' 
    });
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return res.status(500).json({ 
      error: 'Failed to send feedback. Please try again.' 
    });
  }
} 