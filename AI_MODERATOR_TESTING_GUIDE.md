# AI Moderator Testing Guide

## Overview
This guide provides comprehensive instructions for testing the AI moderation functionality in both the chat system and community feed.

---

## Current Implementation Status

### ✅ What's Implemented
- **Visual Indicators**: AI moderator badges displayed in chat and community feed
- **Basic Content Safety Check**: Placeholder function `checkContentSafety()` exists
- **Moderation UI**: Chat moderation console for governors/admins
- **Report System**: Users can report inappropriate content

### ⚠️ What Needs Integration
- **OpenAI Moderation API**: Real AI content filtering not yet connected
- **Real-time Blocking**: Currently uses placeholder word list

---

## Testing the AI Moderator

### 1. Community Feed Content Moderation

#### Location to Test
Navigate to: **Community Feed** page (`/community`)

#### Current Implementation
File: `src/components/community/EnhancedCommentsSection.tsx` (Line 150-156)

```typescript
const checkContentSafety = async (content: string): Promise<boolean> => {
  // Placeholder for AI moderation
  // TODO: Integrate with OpenAI Moderation API or similar
  const badWords = ['badword1', 'badword2']; // Basic filter
  const lowerContent = content.toLowerCase();
  return !badWords.some(word => lowerContent.includes(word));
};
```

#### Test Cases for Comments

**Test Case 1: Safe Content (Should Pass)**
- Action: Post a comment with normal text
- Example: "This is a great post! Thanks for sharing."
- Expected: Comment posts successfully
- Verification: Comment appears in the feed

**Test Case 2: Blocked Words (Should Fail)**
- Action: Post a comment containing `badword1` or `badword2`
- Example: "This contains badword1 in it"
- Expected: Alert appears saying "Your comment contains inappropriate content. Please revise it."
- Verification: Comment is NOT posted

**Test Case 3: Mixed Case (Should Fail)**
- Action: Try bypassing with mixed case
- Example: "This has BaDwOrD1 in it"
- Expected: Still blocked (uses `.toLowerCase()`)
- Verification: Alert appears, comment blocked

**Test Case 4: Empty Content**
- Action: Try posting empty comment
- Example: Just whitespace or empty string
- Expected: Nothing happens (form validation prevents submit)
- Verification: No API call made

#### How to Monitor
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for console logs when posting
4. Check Network tab for API calls to community_comments

---

### 2. Chat System Moderation

#### Location to Test
Navigate to: **Community** → **Chat Rooms** (Group Chat or Private Chat)

#### Current Implementation
- Chat displays "AI Moderated" badge
- Welcome message from AI Moderator appears
- However, actual message filtering is NOT implemented yet

#### Visual Indicators Only
Files:
- `src/components/chat/GroupChat.tsx` (Line 84-88)
- `src/components/chat/PrivateChat.tsx` (Line 268-272)

#### Test Cases for Chat

**Test Case 1: AI Moderator Welcome Message**
- Action: Open any chat room
- Expected: See blue badge with "AI Moderator" and welcome message
- Verification: Message appears at top of chat

**Test Case 2: Chat Badge Display**
- Action: Scroll through any conversation
- Expected: "AI Moderated" badge visible in chat interface
- Verification: Badge shows with shield icon

**Note**: Chat messages are NOT currently filtered. The AI moderator is visual-only at this time.

---

### 3. Moderation Console (Governor/Admin Only)

#### Location to Test
Navigate to: **Governor Dashboard** → **Chat Moderation Console**

#### Features to Test

**Test Case 1: View Reported Messages**
- Action: Navigate to moderation console
- Expected: See list of reported messages (if any exist)
- Verification: Can view message content, reporter info, timestamps

**Test Case 2: Search Messages**
- Action: Use search filters (text, user, date range)
- Expected: Results filter based on criteria
- Verification: Filtered messages display correctly

**Test Case 3: Delete Message**
- Action: Select message and click delete
- Expected: Message removed from conversation
- Verification: Check conversation to confirm deletion

**Test Case 4: Mute User**
- Action: Select user and apply mute
- Expected: User cannot send messages for specified duration
- Verification: User receives notification, cannot post

---

## How to Enable Real AI Moderation

To connect real AI content filtering, you need to integrate with an AI moderation service:

### Option 1: OpenAI Moderation API

**Step 1: Get API Key**
- Sign up at https://platform.openai.com/
- Create API key
- Add to `.env` file: `VITE_OPENAI_API_KEY=your_key_here`

**Step 2: Update checkContentSafety Function**

Replace the placeholder in `EnhancedCommentsSection.tsx`:

```typescript
const checkContentSafety = async (content: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({ input: content })
    });

    const data = await response.json();
    const result = data.results[0];

    // Return false if content is flagged
    return !result.flagged;
  } catch (error) {
    console.error('Moderation check failed:', error);
    // On error, allow content (fail open) or block it (fail closed)
    return true; // Change to false for fail-closed approach
  }
};
```

**Step 3: Test with Real AI**
- Try posting offensive content
- AI will flag categories like: hate, harassment, self-harm, sexual, violence
- Check DevTools console for moderation results

### Option 2: Use Supabase Edge Function

Create an edge function for moderation:

```typescript
// supabase/functions/moderate-content/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { content } = await req.json()

    // Call OpenAI Moderation API
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: JSON.stringify({ input: content })
    })

    const data = await response.json()
    const result = data.results[0]

    return new Response(
      JSON.stringify({
        isSafe: !result.flagged,
        categories: result.categories,
        categoryScores: result.category_scores
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
```

Then call it from your app:

```typescript
const checkContentSafety = async (content: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-content`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      }
    );

    const data = await response.json();
    return data.isSafe;
  } catch (error) {
    console.error('Moderation check failed:', error);
    return true; // Fail open
  }
};
```

---

## Debugging Tips

### 1. Check Browser Console
```javascript
// Look for these logs:
- "AI Moderation Check" - When moderation is triggered
- "Content flagged" - When content is blocked
- "Error" messages - If API calls fail
```

### 2. Monitor Network Tab
- Filter by "moderation" or "openai"
- Check request/response payloads
- Verify API key is being sent

### 3. Test Different Content Types
- **Hate speech**: Racial slurs, discriminatory language
- **Harassment**: Threats, bullying
- **Violence**: Graphic descriptions
- **Sexual content**: Explicit material
- **Self-harm**: Suicide references
- **Spam**: Repetitive content

### 4. Verify Rate Limits
- OpenAI free tier: 3 RPM (requests per minute)
- Monitor for 429 errors
- Implement retry logic if needed

---

## Summary

**Currently Working:**
- ✅ Visual AI moderator indicators
- ✅ Basic word filtering (placeholder)
- ✅ Moderation console UI
- ✅ Report system

**Requires Integration:**
- ❌ Real AI content analysis
- ❌ Message filtering in chat
- ❌ Advanced pattern detection
- ❌ Multi-language support

**To Fully Activate:**
1. Get OpenAI API key
2. Update `checkContentSafety` function
3. Apply same logic to chat messages
4. Test thoroughly with various content types
5. Monitor and adjust sensitivity as needed

---

## Testing Checklist

- [ ] Post safe comment → Should pass
- [ ] Post comment with "badword1" → Should block
- [ ] Try mixed case bypass → Should still block
- [ ] Check AI moderator badge displays
- [ ] Open chat, see welcome message
- [ ] Access moderation console (if governor/admin)
- [ ] View reported content
- [ ] Search for specific messages
- [ ] Test delete/mute actions
- [ ] Monitor browser console for errors
- [ ] Verify network requests succeed
