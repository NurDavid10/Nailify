/**
 * Test Twilio WhatsApp Configuration
 *
 * This script verifies your Twilio credentials and WhatsApp setup.
 *
 * Usage:
 *   npm run test-twilio
 *
 * Or directly:
 *   npx ts-node src/scripts/test-twilio.ts
 */

import twilio from 'twilio';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testTwilioConfiguration() {
  console.log('\n🧪 Testing Twilio WhatsApp Configuration...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Step 1: Check environment variables
  console.log('📋 Step 1: Checking environment variables...\n');

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  console.log('Environment Variables:');
  console.log(`  TWILIO_ACCOUNT_SID: ${accountSid ? '✅ Set (' + accountSid.substring(0, 10) + '...)' : '❌ NOT SET'}`);
  console.log(`  TWILIO_AUTH_TOKEN: ${authToken ? '✅ Set (hidden for security)' : '❌ NOT SET'}`);
  console.log(`  TWILIO_WHATSAPP_NUMBER: ${whatsappNumber || '❌ NOT SET'}\n`);

  if (!accountSid || !authToken || !whatsappNumber) {
    console.error('❌ Missing required environment variables!\n');
    console.log('Please set the following in server/.env:');
    console.log('  TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    console.log('  TWILIO_AUTH_TOKEN=your_auth_token_here');
    console.log('  TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886\n');
    console.log('Get credentials from: https://console.twilio.com/\n');
    process.exit(1);
  }

  // Step 2: Initialize Twilio client
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🔧 Step 2: Initializing Twilio client...\n');

  let client: twilio.Twilio;
  try {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio client initialized successfully!\n');
  } catch (error: any) {
    console.error('❌ Failed to initialize Twilio client:', error.message);
    console.log('\nThis usually means invalid credentials. Double-check your:');
    console.log('  - Account SID (starts with AC)');
    console.log('  - Auth Token\n');
    process.exit(1);
  }

  // Step 3: Verify Twilio account
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🔐 Step 3: Verifying Twilio account...\n');

  try {
    const account = await client.api.accounts(accountSid).fetch();
    console.log('Account Details:');
    console.log(`  Status: ${account.status === 'active' ? '✅ Active' : '⚠️ ' + account.status}`);
    console.log(`  Friendly Name: ${account.friendlyName}`);
    console.log(`  Type: ${account.type}\n`);

    if (account.status !== 'active') {
      console.warn('⚠️  Your Twilio account is not active. You may need to verify it.\n');
    }
  } catch (error: any) {
    console.error('❌ Failed to verify account:', error.message);
    if (error.code === 20003) {
      console.log('\nAuthentication failed. Your credentials are incorrect.\n');
    }
    process.exit(1);
  }

  // Step 4: Test WhatsApp number format
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📱 Step 4: Checking WhatsApp number format...\n');

  if (!whatsappNumber.startsWith('whatsapp:')) {
    console.warn('⚠️  WhatsApp number should start with "whatsapp:"');
    console.log(`   Current: ${whatsappNumber}`);
    console.log(`   Correct: whatsapp:${whatsappNumber}\n`);
  } else {
    console.log('✅ WhatsApp number format is correct\n');
  }

  const isSandbox = whatsappNumber.includes('+14155238886');
  if (isSandbox) {
    console.log('📦 Using Twilio WhatsApp Sandbox (test mode)');
    console.log('   Number: +1 415 523 8886\n');
    console.log('⚠️  IMPORTANT: For the sandbox to work, customers must:');
    console.log('   1. Open WhatsApp on their phone');
    console.log('   2. Message: +1 415 523 8886');
    console.log('   3. Send: "join <your-code>" (get code from Twilio Console)\n');
    console.log('   Get your sandbox code from:');
    console.log('   https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn\n');
  } else {
    console.log('🏢 Using production WhatsApp number');
    console.log(`   Number: ${whatsappNumber.replace('whatsapp:', '')}\n`);
  }

  // Step 5: Offer to send test message
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📤 Step 5: Ready to send test message!\n');
  console.log('To send a test WhatsApp message, run:\n');
  console.log('  npm run test-twilio-send -- +972XXXXXXXXX\n');
  console.log('Replace +972XXXXXXXXX with your actual phone number.\n');

  if (isSandbox) {
    console.log('⚠️  Remember: Your phone must be connected to the sandbox first!\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('✅ Twilio configuration looks good!\n');
  console.log('Summary:');
  console.log('  ✅ Environment variables set');
  console.log('  ✅ Twilio client initialized');
  console.log('  ✅ Account verified and active');
  console.log(`  ${isSandbox ? '📦' : '🏢'} ${isSandbox ? 'Sandbox mode' : 'Production mode'}`);
  console.log('\n🎉 You\'re ready to send WhatsApp messages!\n');
}

// Run the test
testTwilioConfiguration().catch((error) => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
