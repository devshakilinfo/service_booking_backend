const db = require('../config/db');

class AIService {
  async processQuery(userMessage, conversationHistory = []) {
    const servicesRes = await db.query('SELECT * FROM services WHERE is_active = TRUE');
    const services = servicesRes.rows.map((row) => ({
      _id: row.id.toString(),
      id: row.id.toString(),
      name: row.name,
      description: row.description,
      category: row.category,
      price: parseFloat(row.price),
      duration: row.duration,
      image: row.image,
      rating: parseFloat(row.rating),
      highlights: row.highlights || [],
    }));

    const userText = (userMessage || '').toLowerCase().trim();

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        const geminiRes = await this._callGeminiAPI(userMessage, services);
        if (geminiRes) return geminiRes;
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local engine:', err.message);
      }
    }

    return this._generateLocalResponse(userText, services);
  }

  async _callGeminiAPI(userMessage, services) {
    const serviceContext = services
      .map(
        (s) =>
          `- ID: ${s.id}, Name: ${s.name}, Category: ${s.category}, Price: $${s.price}, Duration: ${s.duration}, Rating: ${s.rating}`
      )
      .join('\n');

    const prompt = `You are ServiceBot, an AI assistant for ServiceHub home services booking app.
Here is the available services catalog from PostgreSQL database:
${serviceContext}

User Query: "${userMessage}"

Respond helpfully in a polite, friendly tone. If the user asks for a recommendation or service, recommend the most suitable service from the catalog. Mention its price and duration. Keep your response concise (2-4 sentences).`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 250, temperature: 0.7 },
      }),
    });

    if (!response.ok) throw new Error(`Gemini error: ${response.statusText}`);

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    const matchedServices = services.filter(
      (s) =>
        replyText.toLowerCase().includes(s.name.toLowerCase()) ||
        userMessage.toLowerCase().includes(s.category.toLowerCase())
    );

    return {
      reply: replyText,
      recommendedServices: matchedServices.slice(0, 2),
      source: 'gemini-1.5-flash',
    };
  }

  _generateLocalResponse(userText, services) {
    let matchedServices = [];
    let reply = '';

    if (
      userText.includes('clean') ||
      userText.includes('house') ||
      userText.includes('maid') ||
      userText.includes('dust')
    ) {
      matchedServices = services.filter(
        (s) => s.category === 'Cleaning' || s.name.toLowerCase().includes('clean')
      );
      reply =
        'For home cleaning, I recommend our Premium Home Cleaning service. It is highly rated (4.8★) and includes deep cleaning by experienced, eco-friendly professionals.';
    } else if (
      userText.includes('ac') ||
      userText.includes('air condition') ||
      userText.includes('cooling')
    ) {
      matchedServices = services.filter(
        (s) => s.name.toLowerCase().includes('ac') || s.category === 'Repair'
      );
      reply =
        'For air conditioning issues, our Expert AC Repair & Servicing is ideal. Our certified technicians inspect refrigerant, clean coils, and restore full cooling in 1–2 hours.';
    } else if (
      userText.includes('pipe') ||
      userText.includes('plumb') ||
      userText.includes('leak') ||
      userText.includes('water')
    ) {
      matchedServices = services.filter(
        (s) => s.name.toLowerCase().includes('plumb') || s.category === 'Repair'
      );
      reply =
        'For plumbing leaks or drainage problems, our Quick Plumbing Solution ($30) provides rapid diagnostic and fix with 100% satisfaction guarantee.';
    } else if (
      userText.includes('beauty') ||
      userText.includes('hair') ||
      userText.includes('facial') ||
      userText.includes('salon')
    ) {
      matchedServices = services.filter(
        (s) => s.category === 'Beauty' || s.name.toLowerCase().includes('beauty')
      );
      reply =
        'Treat yourself with our Beauty Parlour & Grooming service! We bring certified stylists to your home with top-tier beauty products.';
    } else if (
      userText.includes('cheap') ||
      userText.includes('budget') ||
      userText.includes('affordable') ||
      userText.includes('price')
    ) {
      matchedServices = [...services].sort((a, b) => a.price - b.price).slice(0, 2);
      reply = `Our most affordable service is ${matchedServices[0]?.name} starting at only $${matchedServices[0]?.price}. Here are the best budget-friendly options!`;
    } else if (userText.includes('hello') || userText.includes('hi') || userText.includes('hey')) {
      matchedServices = services.slice(0, 2);
      reply =
        'Hello! I am your ServiceHub AI Assistant. I can help you choose the right home service, check prices, or schedule an appointment. What service are you looking for today?';
    } else {
      matchedServices = services.slice(0, 1);
      reply =
        'We provide certified professionals for home cleaning, AC repair, plumbing, and beauty services. Let me know what you need help with, and I will recommend the best match!';
    }

    return {
      reply,
      recommendedServices: matchedServices.slice(0, 2),
      source: 'servicehub-assistant-engine',
    };
  }
}

module.exports = new AIService();
