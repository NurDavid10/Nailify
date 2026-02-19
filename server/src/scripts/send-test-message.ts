/**
 * Send Test WhatsApp Message
 *
 * This script sends a test WhatsApp message to verify your setup.
 *
 * Usage:
 *   npm run test-twilio-send -- +972XXXXXXXXX
 *
 * Or directly:
 *   npx ts-node src/scripts/send-test-message.ts +972XXXXXXXXX
 */

import twilio from 'twilio';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function sendTestMessage(toPhone: string) {
  console.log('\n📱 Sending Test WhatsApp Message...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Validate input
  if (!toPhone) {
    console.error('❌ Please provide a phone number!\n');
    console.log('Usage:');
    console.log('  npm run test-twilio-send -- +972XXXXXXXXX\n');
    console.log('Phone number must include country code (e.g., +972 for Israel)\n');
    process.exit(1);
  }

  if (!toPhone.startsWith('+')) {
    console.error('❌ Phone number must start with + and country code!\n');
    console.log(`Provided: ${toPhone}`);
    console.log(`Correct: +${toPhone}\n`);
    process.exit(1);
  }

  // Check environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !whatsappNumber) {
    console.error('❌ Twilio credentials not configured!\n');
    console.log('Please run "npm run test-twilio" first to verify your setup.\n');
    process.exit(1);
  }

  // Initialize Twilio
  console.log('🔧 Initializing Twilio...\n');
  const client = twilio(accountSid, authToken);

  // Prepare message
  const toNumber = `whatsapp:${toPhone}`;
  const message = `
🌸 *Test Message / رسالة تجريبية / הודעת בדיקה* 🌸

*English:*
This is a test message from your Nails Booking App!
If you received this, your WhatsApp integration is working perfectly! ✅

*العربية:*
هذه رسالة تجريبية من تطبيق حجز صالون الأظافر!
إذا استلمت هذه الرسالة، فإن تكامل واتساب يعمل بشكل مثالي! ✅

*עברית:*
זוהי הודעת בדיקה מאפליקציית הזמנת מניקור!
אם קיבלת הודעה זו, אינטגרציית WhatsApp עובדת בצורה מושלמת! ✅

━━━━━━━━━━━━━━━━
Sent: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })}
  `.trim();

  // Send message
  console.log('Message Details:');
  console.log(`  From: ${whatsappNumber}`);
  console.log(`  To: ${toNumber}`);
  console.log(`  Message length: ${message.length} characters\n`);

  const isSandbox = whatsappNumber.includes('+14155238886');
  if (isSandbox) {
    console.log('📦 Using sandbox mode\n');
    console.log('⚠️  IMPORTANT: Make sure your phone is connected to the sandbox!');
    console.log('   1. Open WhatsApp');
    console.log('   2. Message: +1 415 523 8886');
    console.log('   3. Send: "join <your-code>"\n');
    console.log('   Get your code from: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn\n');
  }

  console.log('📤 Sending message...\n');

  try {
    const result = await client.messages.create({
      from: whatsappNumber,
      to: toNumber,
      body: message,
    });

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✅ Message sent successfully!\n');
    console.log('Message Details:');
    console.log(`  SID: ${result.sid}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  To: ${result.to}`);
    console.log(`  From: ${result.from}`);
    console.log(`  Date created: ${result.dateCreated}\n`);

    console.log('📱 Check your WhatsApp now! You should receive the message.\n');

    console.log('Track message status at:');
    console.log(`  https://console.twilio.com/us1/monitor/logs/sms/${result.sid}\n`);

    if (result.status === 'queued' || result.status === 'sent') {
      console.log('🎉 Success! The message is on its way!\n');
    } else if (result.status === 'failed') {
      console.log('❌ Message failed to send. Check Twilio logs for details.\n');
    } else {
      console.log(`ℹ️  Message status: ${result.status}\n`);
    }

  } catch (error: any) {
    console.log('═══════════════════════════════════════════════════════════\n');
    console.error('❌ Failed to send message!\n');
    console.error('Error Details:');
    console.error(`  Message: ${error.message}`);
    console.error(`  Code: ${error.code || 'N/A'}`);
    console.error(`  Status: ${error.status || 'N/A'}\n`);

    if (error.code === 21211) {
      console.log('❌ Invalid phone number format');
      console.log('   Make sure it includes country code: +972...\n');
    } else if (error.code === 21408) {
      console.log('❌ Phone not opted in to WhatsApp sandbox');
      console.log('   Follow the sandbox setup instructions above.\n');
    } else if (error.code === 21610) {
      console.log('❌ Message blocked (opt-out or invalid number)\n');
    } else if (error.code === 20003) {
      console.log('❌ Authentication failed - check your credentials\n');
    } else {
      console.log(`More info: ${error.moreInfo || 'N/A'}\n`);
    }

    console.log('Check Twilio logs for more details:');
    console.log('  https://console.twilio.com/us1/monitor/logs/sms\n');

    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

// Get phone number from command line
const phoneArg = process.argv[2];
sendTestMessage(phoneArg).catch((error) => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
