import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import cron from "node-cron";
import { Resend } from "resend";
import { generateAndSendReport } from "./src/server/report-generator";
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';

// Load environment variables from .env file
dotenv.config();

async function callGrok(systemInstruction: string, chatHistory: any[], userMessage: string) {
  const xaiKey = process.env.XAI_API_KEY || process.env.VITE_XAI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || xaiKey;

  if (!xaiKey && !openaiKey && !geminiKey) {
    console.error('[SmartLedger AI] No AI API keys found in environment variables (XAI_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY).');
    throw new Error('API key is missing. Please configure XAI_API_KEY or OPENAI_API_KEY in your settings.');
  }

  let lastError: any = null;

  // 1. Try xAI Grok if xaiKey is present
  if (xaiKey) {
    const candidateModels = ['grok-2', 'grok-beta', 'grok-2-latest', 'grok-vision-beta', 'grok-2-1212'];
    const messages: any[] = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const h of chatHistory) {
        let role = h.role;
        if (role === 'model') role = 'assistant';
        if (role !== 'user' && role !== 'assistant' && role !== 'system') role = 'user';
        const text = h.parts?.[0]?.text || h.content || '';
        if (text) messages.push({ role, content: text });
      }
    }
    if (userMessage) messages.push({ role: 'user', content: userMessage });

    for (const modelToUse of candidateModels) {
      try {
        console.log(`[SmartLedger AI] Attempting xAI model: ${modelToUse} at https://api.x.ai/v1/chat/completions`);
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${xaiKey}`,
            'User-Agent': 'SmartLedger-App'
          },
          body: JSON.stringify({
            model: modelToUse,
            messages,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[SmartLedger AI] xAI model ${modelToUse} failed with status ${response.status}: ${errorText}`);
          lastError = new Error(`xAI API error (${modelToUse}): ${response.status} - ${errorText}`);
          if (response.status === 400 || response.status === 404) {
            continue; // try next model
          }
          break; // if 401/403/429, break to try next provider (OpenAI/Gemini)
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        console.log(`[SmartLedger AI] Successfully received response using xAI model: ${modelToUse}`);
        return text;
      } catch (err: any) {
        console.warn(`[SmartLedger AI] xAI exception with ${modelToUse}:`, err.message);
        lastError = err;
      }
    }
  }

  // 2. Try OpenAI API (in case user provided an OpenAI key or XAI_API_KEY is OpenAI)
  const effectiveOpenAIKey = openaiKey || xaiKey;
  if (effectiveOpenAIKey) {
    const openaiModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
    const messages: any[] = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const h of chatHistory) {
        let role = h.role;
        if (role === 'model') role = 'assistant';
        if (role !== 'user' && role !== 'assistant' && role !== 'system') role = 'user';
        const text = h.parts?.[0]?.text || h.content || '';
        if (text) messages.push({ role, content: text });
      }
    }
    if (userMessage) messages.push({ role: 'user', content: userMessage });

    for (const modelToUse of openaiModels) {
      try {
        console.log(`[SmartLedger AI] Attempting OpenAI model: ${modelToUse} at https://api.openai.com/v1/chat/completions`);
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveOpenAIKey}`,
            'User-Agent': 'SmartLedger-App'
          },
          body: JSON.stringify({
            model: modelToUse,
            messages,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[SmartLedger AI] OpenAI model ${modelToUse} failed with status ${response.status}: ${errorText}`);
          lastError = new Error(`OpenAI API error (${modelToUse}): ${response.status} - ${errorText}`);
          if (response.status === 400 || response.status === 404) {
            continue;
          }
          break;
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        console.log(`[SmartLedger AI] Successfully received response using OpenAI model: ${modelToUse}`);
        return text;
      } catch (err: any) {
        console.warn(`[SmartLedger AI] OpenAI exception with ${modelToUse}:`, err.message);
        lastError = err;
      }
    }
  }

  // 3. Try Google Gemini API REST fallback
  if (geminiKey) {
    const geminiModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash'];
    const contents: any[] = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const h of chatHistory) {
        let role = h.role;
        if (role === 'assistant') role = 'model';
        contents.push({
          role,
          parts: [{ text: h.parts?.[0]?.text || h.content || '' }]
        });
      }
    }
    if (userMessage) {
      contents.push({ role: 'user', parts: [{ text: userMessage }] });
    }

    for (const modelToUse of geminiModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${geminiKey}`;
        console.log(`[SmartLedger AI] Attempting Gemini model: ${modelToUse}`);
        const bodyData: any = { contents };
        if (systemInstruction) {
          bodyData.systemInstruction = { parts: [{ text: systemInstruction }] };
        }
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[SmartLedger AI] Gemini model ${modelToUse} failed with status ${response.status}: ${errorText}`);
          lastError = new Error(`Gemini API error (${modelToUse}): ${response.status} - ${errorText}`);
          continue;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log(`[SmartLedger AI] Successfully received response using Gemini model: ${modelToUse}`);
        return text;
      } catch (err: any) {
        console.warn(`[SmartLedger AI] Gemini exception with ${modelToUse}:`, err.message);
        lastError = err;
      }
    }
  }

  throw lastError || new Error('All AI providers and models failed to generate a response.');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // WebAuthn state storage (in-memory for this stateless demo)
  const userChallenges: { [userId: string]: string } = {};
  const rpName = 'SmartLedger';
  
  app.post("/api/webauthn/generate-registration-options", async (req, res) => {
    try {
      const { userId, userName } = req.body;
      const expectedRPID = req.headers.host?.split(':')[0] || 'localhost';
      
      const options = await generateRegistrationOptions({
        rpName,
        rpID: expectedRPID,
        userID: new Uint8Array(Buffer.from(userId)),
        userName: userName,
        timeout: 60000,
        attestationType: 'none',
        excludeCredentials: [],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          residentKey: 'required',
          userVerification: 'required',
        },
      });
      
      userChallenges[userId] = options.challenge;
      res.json(options);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webauthn/verify-registration", async (req, res) => {
    try {
      const { userId, response } = req.body;
      const expectedChallenge = userChallenges[userId];
      
      if (!expectedChallenge) {
        return res.status(400).json({ error: "Challenge not found" });
      }

      const expectedOrigin = req.headers.origin!;
      const expectedRPID = req.headers.host?.split(':')[0] || 'localhost';

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin,
        expectedRPID,
      });
      
      if (verification.verified && verification.registrationInfo) {
        const { credential } = verification.registrationInfo;
        delete userChallenges[userId];
        res.json({
          verified: true,
          credential: {
            id: Buffer.from(credential.id).toString('base64'),
            publicKey: Buffer.from(credential.publicKey).toString('base64')
          }
        });
      } else {
        res.json({ verified: false });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webauthn/generate-authentication-options", async (req, res) => {
    try {
      const { userId, allowCredentials } = req.body;
      const expectedRPID = req.headers.host?.split(':')[0] || 'localhost';
      
      const options = await generateAuthenticationOptions({
        rpID: expectedRPID,
        timeout: 60000,
        allowCredentials: allowCredentials.map((cred: any) => ({
          id: Uint8Array.from(Buffer.from(cred.id, 'base64')),
          type: 'public-key',
          transports: cred.transports,
        })),
        userVerification: 'required',
      });
      
      userChallenges[userId] = options.challenge;
      res.json(options);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webauthn/verify-authentication", async (req, res) => {
    try {
      const { userId, response, authenticator } = req.body;
      const expectedChallenge = userChallenges[userId];
      
      if (!expectedChallenge) {
        return res.status(400).json({ error: "Challenge not found" });
      }

      const expectedOrigin = req.headers.origin!;
      const expectedRPID = req.headers.host?.split(':')[0] || 'localhost';

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin,
        expectedRPID,
        credential: {
          id: authenticator.id,
          publicKey: Uint8Array.from(Buffer.from(authenticator.publicKey, 'base64')),
          counter: 0,
        }
      });
      
      if (verification.verified) {
        delete userChallenges[userId];
        res.json({ verified: true });
      } else {
        res.json({ verified: false });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // API route for xAI Grok chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, userData, chatHistory } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Missing 'message' in request body." });
      }

      const systemInstruction = `You are SmartBank AI, the virtual banking assistant.

Your responsibilities:
- Help users understand banking features.
- Explain account balances and transaction history when provided by the application.
- Answer questions about transfers, deposits, cards, loans, UPI, and security.
- Provide budgeting and financial education.
- Be polite, professional, and concise.

Never:
- Ask for passwords, OTPs, PINs, CVV, or full card numbers.
- Pretend to complete transactions.
- Invent account balances or transaction history.
- Claim actions were completed unless the application confirms them.

If the requested information requires live banking data, tell the user that you need the application to provide that data.

Current Date: ${new Date().toISOString()}

User Data Provided by Application:
${JSON.stringify(userData, null, 2)}`;

      const text = await callGrok(systemInstruction, chatHistory, message);
      return res.json({ text });

    } catch (error: any) {
      console.error("[SmartLedger AI] Internal Server Error:", error.message);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // API route for generating AI reminders
  app.post("/api/generate-reminder", async (req, res) => {
    try {
      const { transaction, messageTone } = req.body;
      
      if (!transaction) {
        res.status(400).json({ error: "Missing 'transaction' in request body." });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(transaction.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isOverdue = daysDiff < 0;

      let penalty = 0;
      if (transaction.penaltyEnabled && transaction.penaltyValue && isOverdue) {
        const overdueDays = Math.abs(daysDiff);
        const gracePeriod = transaction.gracePeriod || 0;
        
        if (overdueDays > gracePeriod) {
          const penaltyDays = overdueDays - gracePeriod;
          switch (transaction.penaltyType) {
            case 'fixed':
              penalty = transaction.penaltyValue;
              break;
            case 'percent_day':
              penalty = (transaction.amount * (transaction.penaltyValue / 100)) * penaltyDays;
              break;
            case 'percent_week':
              penalty = (transaction.amount * (transaction.penaltyValue / 100)) * Math.ceil(penaltyDays / 7);
              break;
            case 'percent_month':
              penalty = (transaction.amount * (transaction.penaltyValue / 100)) * Math.ceil(penaltyDays / 30);
              break;
          }
        }
      }

      const totalDue = transaction.amount + penalty;

      const systemInstruction = `You are an AI assistant generating friendly WhatsApp payment reminders for SmartLedger.
DO NOT use phrases like "Due today", "Due tomorrow", "Due in 3 days", "Overdue", "Outstanding payment", "Account in good standing", "Legal language", or "Collection notice".
Never mention "due today", "overdue", or countdowns.
Never sound threatening or like a bank recovery notice.
Keep messages under 300 characters.
Use WhatsApp-friendly formatting.

You MUST use EXACTLY one of the following formats based on whether a penalty exists.

If NO penalty exists (Penalty Added is ₹0):
👋 Hi {Name},

Hope you're doing well!

This is a friendly reminder about the payment for *{Reason}*.

*Amount:* ₹{Amount}

Whenever you get a chance, please complete the payment.

If you've already paid, you can ignore this message.

Thank you! 😊

If a penalty exists (Penalty Added is greater than ₹0):
👋 Hi {Name},

Hope you're doing well!

Just a friendly reminder regarding the payment for *{Reason}*.

*Amount:* ₹{Amount}
*Current Penalty:* ₹{Penalty}
*Total Payable:* ₹{Total}

Whenever you're free, please complete the payment.

If you've already paid, please ignore this message.

Thank you! 😊

Context:
- Name: ${transaction.personName}
- Reason: ${transaction.reason}
- Amount: ${transaction.amount}
- Penalty: ${penalty}
- Total: ${totalDue}

Generate the final message replacing the {Variables} with the Context values. Do not use currency symbols if the context value already has them. Only output the message text. No pleasantries or meta-commentary.`;

      const text = await callGrok(systemInstruction, [], "Generate the reminder message based on the provided context.");
      res.json({ text });
    } catch (error: any) {
      console.error("xAI API Error (Reminders):", error);
      
      const { personName, totalDue, tone } = req.body;
      let text = `Hi ${personName}, this is a gentle reminder that a payment of ${totalDue} is pending. Please process it at your earliest convenience. Thank you!`;
      
      if (tone === 'formal') {
        text = `Dear ${personName},

This is a formal notification regarding an outstanding balance of ${totalDue}. Please remit payment promptly to resolve this matter.

Best regards,`;
      } else if (tone === 'urgent') {
        text = `URGENT: Hi ${personName}, your payment of ${totalDue} is overdue. Please pay immediately to avoid further action.`;
      } else if (tone === 'friendly') {
         text = `Hey ${personName}! Just a quick friendly reminder about the ${totalDue} that's due. Let me know if you need anything!`;
      }
      
      res.json({ text });
    }
  });

  app.post("/api/generate-goal-plan", async (req, res) => {
    const { currentBalance, transactions, targetGoalName, targetGoalAmount } = req.body;
    try {
      const today = new Date().toISOString();

      let prompt = `Based on the following user financial data:
Current Balance: ${currentBalance}
Transactions (last few months): ${JSON.stringify((transactions || []).slice(-50))}

Current Date: ${today}

Analyze their monthly income and expenses to determine their average monthly savings rate.
`;

      if (targetGoalName && targetGoalAmount) {
        prompt += `
The user has a specific goal:
Goal Name: "${targetGoalName}"
Target Amount: ${targetGoalAmount}

Calculate:
1. Their estimated average monthly savings.
2. A realistic predicted date of achievement for this goal.
3. 2-3 actionable advice points to achieve this goal faster.

Respond ONLY with a JSON object in this exact format:
{
  "monthlySavings": 5000,
  "predictedDate": "YYYY-MM-DD",
  "advice": ["advice 1", "advice 2", "advice 3"]
}`;
      } else {
        prompt += `
Suggest 3 realistic financial goals based on their spending and saving capacity.
For each goal, provide a name, target amount, predicted date of achievement, and brief advice.

Respond ONLY with a JSON array of objects in this exact format:
[
  {
    "name": "Emergency Fund",
    "targetAmount": 100000,
    "predictedDate": "YYYY-MM-DD",
    "advice": ["advice 1"]
  }
]`;
      }

      const rawText = await callGrok("You are a financial planning AI assistant. Output valid JSON only.", [], prompt);
      let text = rawText || "";
      // Strip markdown code block if present
      text = text.replace(/^```json/m, '').replace(/```$/m, '').trim();

      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("xAI API Error (Goal Planner):", error);
      
      // Provide fallback data instead of failing completely due to rate limits
      if (targetGoalName && targetGoalAmount) {
         return res.json({
            monthlySavings: Math.max(currentBalance * 0.1, 1000),
            predictedDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            advice: ["Track your daily expenses closely.", "Avoid impulse purchases.", "Set up an automated transfer to savings."]
         });
      } else {
         return res.json([
            {
               name: "Emergency Fund",
               targetAmount: currentBalance > 0 ? currentBalance * 3 : 50000,
               predictedDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
               advice: ["Save at least 20% of your monthly income.", "Keep this fund in a high-yield savings account."]
            },
            {
               name: "Vacation Fund",
               targetAmount: 25000,
               predictedDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
               advice: ["Plan trips in advance.", "Look for off-season deals."]
            },
            {
               name: "Debt Payoff",
               targetAmount: 10000,
               predictedDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
               advice: ["Pay off high-interest debt first.", "Consider debt consolidation if rates are lower."]
            }
         ]);
      }
    }
  });

  app.post("/api/send-monthly-report", async (req, res) => {
    try {
      console.log("Starting email request for monthly report...");
      const { 
        email, 
        month, 
        currentBalance, 
        incomeThisMonth, 
        highestPaymentReceived, 
        numberOfIncomeTransactions, 
        aiSummary 
      } = req.body;
      
      if (!email || !month || currentBalance === undefined || incomeThisMonth === undefined) {
        res.status(400).json({ error: "Missing required fields." });
        return;
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.error("Missing RESEND_API_KEY in environment variables.");
        res.status(500).json({ error: "Email provider is not configured. Missing RESEND_API_KEY." });
        return;
      }

      console.log("Connecting to Resend provider...");
      const resend = new Resend(resendApiKey);

      const formattedIncome = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(incomeThisMonth);

      const formattedBalance = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(currentBalance);

      const generatedDateTime = new Date().toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const highestPaymentHtml = highestPaymentReceived ? `
        <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 16px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Highest Payment Received</h3>
          <div style="display: flex; align-items: baseline; justify-content: space-between;">
            <div>
              <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 18px;">${highestPaymentReceived.personName}</p>
              <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Received on ${highestPaymentReceived.dateReceived}</p>
            </div>
            <p style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 700;">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(highestPaymentReceived.amount)}</p>
          </div>
        </div>
      ` : `
        <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 16px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Highest Payment Received</h3>
          <p style="margin: 0; color: #94a3b8; font-size: 15px;">No payments received this month.</p>
        </div>
      `;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; border-radius: 0 !important; }
              .content { padding: 20px !important; }
              .stats-grid { display: block !important; }
              .stat-card { width: 100% !important; box-sizing: border-box !important; margin-bottom: 16px !important; }
              .stat-card:last-child { margin-bottom: 0 !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table class="container" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border-collapse: collapse;">
            <tr>
              <td style="padding: 0;">
                
                <!-- HEADER -->
                <div style="background-color: #2563eb; padding: 40px 32px; text-align: left;">
                  <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">SmartLedger</h1>
                  <h2 style="color: #93c5fd; margin: 0 0 24px; font-size: 18px; font-weight: 400;">Monthly Financial Report</h2>
                  
                  <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 12px 16px; display: inline-block;">
                    <p style="color: #ffffff; margin: 0; font-size: 14px; font-weight: 500;">Reporting Period: ${month}</p>
                  </div>
                  <p style="color: #bfdbfe; margin: 16px 0 0; font-size: 12px;">Generated: ${generatedDateTime}</p>
                </div>

                <!-- CONTENT -->
                <div class="content" style="padding: 40px 32px; background-color: #f8fafc;">
                  
                  <h2 style="margin: 0 0 24px; color: #0f172a; font-size: 20px; font-weight: 600;">Financial Summary</h2>

                  <!-- GRID STATS -->
                  <table class="stats-grid" style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 24px;">
                    <tr>
                      <td class="stat-card" style="width: 48%; background-color: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; vertical-align: top;">
                        <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Current Balance</p>
                        <p style="margin: 0; color: #0f172a; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">${formattedBalance}</p>
                      </td>
                      <td style="width: 4%;"></td>
                      <td class="stat-card" style="width: 48%; background-color: #eff6ff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #bfdbfe; vertical-align: top;">
                        <p style="margin: 0 0 8px; color: #1e40af; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Income This Month</p>
                        <p style="margin: 0; color: #1d4ed8; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">${formattedIncome}</p>
                      </td>
                    </tr>
                  </table>

                  ${highestPaymentHtml}

                  <h2 style="margin: 32px 0 24px; color: #0f172a; font-size: 20px; font-weight: 600;">Quick Summary</h2>
                  
                  <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; margin-bottom: 32px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 15px;">Current Balance</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 15px; font-weight: 600; text-align: right;">${formattedBalance}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 15px;">Income This Month</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 15px; font-weight: 600; text-align: right;">${formattedIncome}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 15px;">Highest Payment</td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 15px; font-weight: 600; text-align: right;">${highestPaymentReceived ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(highestPaymentReceived.amount) : '-'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; color: #475569; font-size: 15px;">Number of Income Transactions</td>
                        <td style="padding: 12px 0; color: #0f172a; font-size: 15px; font-weight: 600; text-align: right;">${numberOfIncomeTransactions}</td>
                      </tr>
                    </table>
                  </div>

                  <h2 style="margin: 32px 0 24px; color: #0f172a; font-size: 20px; font-weight: 600;">AI Summary</h2>
                  <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.6;">
                      ${aiSummary}
                    </p>
                  </div>

                </div>

                <!-- FOOTER -->
                <div style="background-color: #ffffff; padding: 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">This report was automatically generated by SmartLedger.</p>
                  <p style="margin: 0 0 24px; color: #64748b; font-size: 14px;">No action is required.</p>
                  <p style="margin: 0 0 16px; color: #0f172a; font-size: 15px; font-weight: 500;">Thank you for using SmartLedger.</p>
                  <p style="margin: 0; color: #94a3b8; font-size: 13px;">&copy; 2026 SmartLedger</p>
                </div>

              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const domains = await resend.domains.list();
      const domainList = Array.isArray(domains.data) ? domains.data : (domains.data?.data || []);
      const verifiedDomain = domainList.find((d: any) => d.status === 'verified');
      
      let fromAddress = "SmartLedger <onboarding@resend.dev>";
      let finalToAddress = email;
      
      if (verifiedDomain) {
        fromAddress = `SmartLedger <updates@${verifiedDomain.name}>`;
      } else {
        // Testing mode override
        finalToAddress = process.env.RESEND_OWNER_EMAIL || "souvikdashbbsr@gmail.com";
      }

      console.log(`Sending HTML email to ${finalToAddress}...`);
      const data = await resend.emails.send({
        from: fromAddress,
        to: finalToAddress,
        subject: `SmartLedger Monthly Financial Report - ${month}`,
        html: htmlContent,
      });

      if (data.error) {
        console.error("Provider Response Error:", data.error);
        let errorMsg = data.error.message;
        if (errorMsg.includes("verify") || errorMsg.includes("onboarding")) {
          errorMsg = "Domain verification issue. Ensure your domain is verified on Resend, or test using the verified owner's email address.";
        }
        res.status(400).json({ error: errorMsg });
        return;
      }

      console.log("Email delivery successful! Message ID:", data.data?.id);
      res.json({ success: true, messageId: data.data?.id });
    } catch (error: any) {
      console.error("Email Error:", error);
      res.status(500).json({ error: error.message || "An error occurred while sending the email." });
    }
  });

  app.post("/api/generate-business-report", async (req, res) => {
    try {
      const { email, month, transactions, customers, includePdf, aiSummary } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Missing email" });
      }
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        return res.status(500).json({ error: "Email provider is not configured" });
      }

      const result = await generateAndSendReport(email, month, transactions || [], customers || [], includePdf, aiSummary, resendApiKey);
      
      if (result.success) {
        return res.json({ success: true, fileSizeXlsx: result.fileSizeXlsx, fileSizePdf: result.fileSizePdf });
      } else {
        let errorMsg = result.error?.message || 'Unknown error';
        if (errorMsg.includes("verify") || errorMsg.includes("onboarding")) {
          errorMsg = "Domain verification issue. Ensure your domain is verified on Resend, or test using the verified owner's email address.";
        }
        return res.status(500).json({ error: errorMsg });
      }
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'An error occurred' });
    }
  });

  app.post("/api/verify-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "Missing required field: email." });
        return;
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        res.status(500).json({ error: "Email provider is not configured." });
        return;
      }

      const resend = new Resend(resendApiKey);
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="padding: 32px 24px;">
            <p style="color: #475569; font-size: 16px; margin: 0 0 16px;">Hello,</p>
            <p style="color: #475569; font-size: 16px; margin: 0 0 16px;">Please verify your email address for SmartLedger.</p>
          </div>
        </div>
      `;

      const data = await resend.emails.send({
        from: 'SmartLedger <onboarding@resend.dev>',
        to: email,
        subject: 'Verify your email address for SmartLedger',
        html: htmlContent,
      });

      if (data.error) {
        res.status(500).json({ error: data.error.message });
      } else {
        res.status(200).json({ success: true });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || "An error occurred." });
    }
  });

  app.post("/api/send-test-email", async (req, res) => {
    try {
      console.log("Starting email request for test email...");
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({ error: "Missing required field: email." });
        return;
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.error("Missing RESEND_API_KEY in environment variables.");
        res.status(500).json({ error: "Email provider is not configured. Missing RESEND_API_KEY." });
        return;
      }

      console.log("Connecting to Resend provider...");
      const resend = new Resend(resendApiKey);

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="padding: 32px 24px;">
            <p style="color: #475569; font-size: 16px; margin: 0 0 16px;">Hello,</p>
            <p style="color: #475569; font-size: 16px; margin: 0 0 16px;">This is a test email from SmartLedger.</p>
            <p style="color: #475569; font-size: 16px; margin: 0 0 16px;">If you received this email, the email system is working correctly.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">Generated Automatically by SmartLedger.</p>
          </div>
        </div>
      `;

      const domains = await resend.domains.list();
      const domainList = Array.isArray(domains.data) ? domains.data : (domains.data?.data || []);
      const verifiedDomain = domainList.find((d: any) => d.status === 'verified');
      
      let fromAddress = "SmartLedger <onboarding@resend.dev>";
      let finalToAddress = email;
      
      if (verifiedDomain) {
        fromAddress = `SmartLedger <updates@${verifiedDomain.name}>`;
      } else {
        // Testing mode override
        finalToAddress = process.env.RESEND_OWNER_EMAIL || "souvikdashbbsr@gmail.com";
      }

      console.log(`Sending HTML email to ${finalToAddress}...`);
      const data = await resend.emails.send({
        from: fromAddress,
        to: finalToAddress,
        subject: `SmartLedger Test Email`,
        html: htmlContent,
      });

      if (data.error) {
        console.error("Provider Response Error:", data.error);
        let errorMsg = data.error.message;
        if (errorMsg.includes("verify") || errorMsg.includes("onboarding")) {
          errorMsg = "Domain verification issue. Ensure your domain is verified on Resend, or test using the verified owner's email address.";
        }
        res.status(400).json({ error: errorMsg });
        return;
      }

      console.log("Email delivery successful! Message ID:", data.data?.id);
      res.json({ success: true, messageId: data.data?.id });
    } catch (error: any) {
      console.error("Email Error:", error);
      res.status(500).json({ error: error.message || "An error occurred while sending the email." });
    }
  });

  app.get("/api/email-config", async (req, res) => {
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        return res.json({ configured: false });
      }
      const resend = new Resend(resendApiKey);
      const domains = await resend.domains.list();
      
      if (domains.error) {
        return res.json({
          configured: true,
          isTestingMode: true,
          fromAddress: "SmartLedger <onboarding@resend.dev>",
          ownerEmail: process.env.RESEND_OWNER_EMAIL || "souvikdashbbsr@gmail.com",
          error: domains.error.message
        });
      }

      const domainList = Array.isArray(domains.data) ? domains.data : (domains.data?.data || []);
      const verifiedDomain = domainList.find((d: any) => d.status === 'verified');

      if (verifiedDomain) {
        res.json({
          configured: true,
          isTestingMode: false,
          fromAddress: `SmartLedger <updates@${verifiedDomain.name}>`
        });
      } else {
        res.json({
          configured: true,
          isTestingMode: true,
          fromAddress: "SmartLedger <onboarding@resend.dev>",
          ownerEmail: process.env.RESEND_OWNER_EMAIL || "souvikdashbbsr@gmail.com"
        });
      }
    } catch (err: any) {
      res.json({ configured: false, error: err.message });
    }
  });

  // Scheduled job: Run at 08:00 AM on the 1st of every month
  cron.schedule('0 8 1 * *', () => {
    console.log("Running scheduled monthly report generation (Cron)...");
    // In a real application, you would query Firebase for all users with emailSettings.enabled = true,
    // calculate their income for the past month, and send the email using transporter.sendMail().
    // For this environment, since we use local storage without a centralized database, the scheduled
    // logic is purely theoretical.
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
