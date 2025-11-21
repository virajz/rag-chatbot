# Inngest Setup - Background Job Processing

## Why Inngest?

Vercel serverless functions have a **timeout limit**:
- Free tier: 10 seconds
- Pro tier: 60 seconds

Your auto-response flow takes longer because it needs to:
1. Generate embeddings (~2-3s)
2. Search documents (~1-2s)
3. Call LLM (~5-10s)
4. Send WhatsApp message (~1-2s)

**Total: 10-20 seconds** - This exceeds Vercel's timeout!

**Inngest Solution:** Runs jobs in the background with NO timeout limits!

## Setup (2 minutes)

### 1. Create Free Inngest Account

1. Go to [inngest.com](https://www.inngest.com)
2. Sign up (free tier is generous!)
3. Create a new app: "rag-chatbot"
4. Get your **Event Key** and **Signing Key**

### 2. Add Environment Variables

Add to your `.env.local`:

```env
INNGEST_EVENT_KEY=your_event_key_here
INNGEST_SIGNING_KEY=your_signing_key_here
```

Add to Vercel:
```bash
vercel env add INNGEST_EVENT_KEY
vercel env add INNGEST_SIGNING_KEY
```

### 3. Deploy

```bash
npm run dev
# or
vercel --prod
```

### 4. Register Your App with Inngest

After deploying, register your endpoint:

1. Go to Inngest Dashboard
2. Click "Apps" → "Add App"
3. Enter your URL: `https://your-app.vercel.app/api/inngest`
4. Click "Sync"

✅ Done! Your background jobs are now active!

## How It Works

### Before (Timing Out):
```
WhatsApp → Webhook (starts processing)
                ↓
          [10 second timeout]
                ↓
           ❌ TIMEOUT!
```

### After (With Inngest):
```
WhatsApp → Webhook → Queue Job → Return ✅
                          ↓
                    Inngest (background)
                          ↓
                    Process (20s+)
                          ↓
                    Send WhatsApp ✅
```

## Benefits

✅ **No timeouts** - Jobs run as long as needed
✅ **Automatic retries** - Failed jobs retry automatically
✅ **Monitoring** - See all jobs in Inngest dashboard
✅ **Scalable** - Handles high volume
✅ **Free tier** - 1000 jobs/month free

## Monitoring

### View Jobs

Go to your Inngest dashboard:
- See all running jobs
- View job logs
- Check success/failure rates
- Monitor performance

### Local Development

Run Inngest dev server:
```bash
npx inngest-cli@latest dev
```

Then start your app:
```bash
npm run dev
```

Visit: http://localhost:8288 to see local Inngest dashboard

## Testing

### Send Test Message

```bash
# Send WhatsApp webhook
curl -X POST http://localhost:3000/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "test-123",
    "channel": "whatsapp",
    "from": "917874949091",
    "to": "15558346206",
    "receivedAt": "2025-11-21T10:00:00Z",
    "content": {
      "contentType": "text",
      "text": "Test message"
    },
    "event": "MoMessage"
  }'
```

Check logs:
```
✅ Background job queued successfully
[Inngest] Processing message from 917874949091
[Inngest] ✅ Message sent successfully to 917874949091
```

## Troubleshooting

### "Inngest connection failed"

**Problem:** Environment variables not set

**Solution:**
```bash
# Check env vars
cat .env.local | grep INNGEST

# Or on Vercel
vercel env ls
```

### Jobs not running

**Problem:** App not registered with Inngest

**Solution:**
1. Go to Inngest dashboard
2. Click "Sync" on your app
3. Ensure URL is correct: `https://your-app.vercel.app/api/inngest`

### "Event not found"

**Problem:** Function not registered

**Solution:**
```typescript
// Check src/app/api/inngest/route.ts
// Ensure processWhatsAppMessage is in functions array
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processWhatsAppMessage], // ← Must be here
});
```

## Configuration

### Retry Settings

Edit `src/inngest/functions.ts`:

```typescript
export const processWhatsAppMessage = inngest.createFunction(
  {
    id: "process-whatsapp-message",
    name: "Process WhatsApp Message",
    retries: 3, // Retry failed jobs 3 times
  },
  { event: "whatsapp/message.received" },
  async ({ event, step }) => {
    // ... your code
  }
);
```

### Rate Limiting

```typescript
export const processWhatsAppMessage = inngest.createFunction(
  {
    id: "process-whatsapp-message",
    name: "Process WhatsApp Message",
    rateLimit: {
      limit: 10,
      period: "1m", // Max 10 jobs per minute
    },
  },
  { event: "whatsapp/message.received" },
  async ({ event, step }) => {
    // ... your code
  }
);
```

## Cost

### Free Tier Limits
- 1,000 function runs/month
- No time limits on function execution
- Basic monitoring

### Paid Plans
- $20/month for 10,000 runs
- $0.002 per additional run
- Advanced monitoring
- Priority support

## Alternative: Vercel Cron (Simpler but Less Flexible)

If you don't want to use Inngest, you can use Vercel Cron:

**Create:** `src/app/api/cron/process-messages/route.ts`

```typescript
export async function GET(request: Request) {
  // Get unprocessed messages
  const { data } = await supabase
    .from("whatsapp_messages")
    .select("*")
    .eq("auto_respond_sent", false)
    .limit(10);

  // Process each
  for (const msg of data || []) {
    await generateAutoResponse(
      msg.from_number,
      msg.content_text,
      msg.message_id
    );
  }

  return Response.json({ processed: data?.length || 0 });
}
```

**Add to `vercel.json`:**
```json
{
  "crons": [{
    "path": "/api/cron/process-messages",
    "schedule": "* * * * *"
  }]
}
```

**Downsides:**
- Runs on schedule (every minute) not immediately
- Less reliable
- No built-in retries
- Harder to monitor

**Recommendation:** Use Inngest for production!

## Next Steps

1. ✅ Inngest setup complete
2. Deploy to Vercel
3. Register app in Inngest dashboard
4. Test with real WhatsApp message
5. Monitor jobs in dashboard

---

**Status:** 🟢 Background processing enabled!

Your auto-responses now work perfectly on Vercel with no timeout issues!
