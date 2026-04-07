const OpenAI = require('openai');
const prisma = require('../config/database');
const config = require('../config/env');

let openai = null;

const getClient = () => {
  if (!openai) {
    if (!config.openaiApiKey || config.openaiApiKey === 'sk-your-openai-api-key-here') {
      throw new Error('OPENAI_API_KEY is not configured. Set it in .env');
    }
    openai = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return openai;
};

const buildProductKnowledge = async (isInstitute = false) => {
  const products = await prisma.product.findMany({
    where: { isInstituteProduct: isInstitute },
    include: {
      category: true,
      pricing: true,
    },
    take: 100,
    orderBy: { createdAt: 'desc' },
  });

  const categories = await prisma.productCategory.findMany({
    where: { isInstituteCategory: isInstitute },
    orderBy: { name: 'asc' },
  });

  const categoryList = categories
    .map((c) => `- ${c.name} (ID: ${c.id})`)
    .join('\n');

  const productList = products
    .map((p) => {
      let priceInfo = '';
      if (p.basePrice) {
        priceInfo = `Base price: $${p.basePrice}`;
      }
      if (p.pricing && p.pricing.length > 0) {
        const tiers = p.pricing
          .map((t) => {
            let tier = `  Qty ${t.minQuantity}${t.maxQuantity ? '-' + t.maxQuantity : '+'}`;
            tier += `: $${t.price}`;
            if (t.discountPercent) tier += ` (${t.discountPercent}% off)`;
            if (t.fixedPrice) tier += ` (fixed: $${t.fixedPrice})`;
            return tier;
          })
          .join('\n');
        priceInfo += priceInfo ? '\n' + tiers : tiers;
      }
      return `- **${p.name}**\n  Category: ${p.category?.name || 'N/A'}\n  Description: ${(p.description || '').substring(0, 200)}\n  ${priceInfo}`;
    })
    .join('\n\n');

  return { categoryList, productList, productCount: products.length, categoryCount: categories.length };
};

const SYSTEM_PROMPT_BASE = `You are "Studify Assistant", an intelligent, friendly, and helpful AI customer support agent for the Studify educational e-commerce platform.

## Your capabilities:
- Answer questions about available products, categories, pricing, and features
- Help customers find the right products for their needs
- Explain how to place orders, manage their cart, and track deliveries
- Provide information about wholesale/government (institute) ordering
- Help with account-related questions (registration, login, profile)
- Be bilingual: respond in Arabic if the user writes in Arabic, English if they write in English

## Rules:
- Be concise but helpful — aim for 2-4 sentences unless more detail is needed
- If you don't know something specific, say so honestly and suggest contacting support
- Never make up product information — only reference products from the catalog below
- Be warm and professional
- Use relevant product details when recommending items
- If asked about pricing, provide accurate pricing from the catalog
- You can suggest related products from the same category
`;

const conversationStore = new Map();

const CONVERSATION_TTL = 30 * 60 * 1000; // 30 min

const cleanupOldConversations = () => {
  const now = Date.now();
  for (const [key, val] of conversationStore) {
    if (now - val.updatedAt > CONVERSATION_TTL) {
      conversationStore.delete(key);
    }
  }
};

setInterval(cleanupOldConversations, 5 * 60 * 1000);

const chat = async ({ message, conversationId, userType }) => {
  const client = getClient();
  const isInstitute = userType === 'INSTITUTE';

  const knowledge = await buildProductKnowledge(isInstitute);

  const systemPrompt =
    SYSTEM_PROMPT_BASE +
    `\n## Current Product Catalog (${knowledge.productCount} products):\n${knowledge.productList}\n\n` +
    `## Categories (${knowledge.categoryCount}):\n${knowledge.categoryList}\n\n` +
    (isInstitute
      ? `## Special context: This user is a government/institute customer. They can order wholesale quantities with tiered pricing. Guide them about wholesale orders and bulk discounts.\n`
      : `## This is a regular customer. Help them browse and purchase products.\n`);

  let history = [];
  if (conversationId && conversationStore.has(conversationId)) {
    history = conversationStore.get(conversationId).messages;
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message },
  ];

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 800,
    temperature: 0.7,
  });

  const assistantMessage = response.choices[0].message.content;

  const convId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const updatedHistory = [
    ...history,
    { role: 'user', content: message },
    { role: 'assistant', content: assistantMessage },
  ];

  // Keep last 20 messages to stay within token limits
  const trimmed = updatedHistory.slice(-20);

  conversationStore.set(convId, {
    messages: trimmed,
    updatedAt: Date.now(),
  });

  return {
    reply: assistantMessage,
    conversationId: convId,
    usage: {
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
      totalTokens: response.usage?.total_tokens,
    },
  };
};

const getSuggestions = async (userType) => {
  const isInstitute = userType === 'INSTITUTE';

  if (isInstitute) {
    return [
      'ما هي المنتجات المتاحة لدوائر الدولة؟',
      'What are the wholesale pricing tiers?',
      'كيف أقدم طلب جملة؟',
      'Show me all product categories',
      'ما هي طريقة الدفع؟',
    ];
  }

  return [
    'ما هي المنتجات المتاحة؟',
    'What products do you have?',
    'كيف أقدم طلب؟',
    'Help me find a product',
    'ما هي الفئات المتاحة؟',
  ];
};

module.exports = { chat, getSuggestions };
