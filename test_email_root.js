require("dotenv").config();
const { sendWelcomeEmail } = require("./emailService");

async function test() {
  console.log("🧪 Testing Email Integration...");
  console.log(`Using Email: ${process.env.EMAIL_USER}`);
  console.log(`Using Host: ${process.env.EMAIL_HOST}`);
  
  const receiver = process.env.EMAIL_USER; // Send to self for testing
  const success = await sendWelcomeEmail(receiver, "Test User");
  
  if (success) {
    console.log("\n✅ SUCCESS! The email system is fully working.");
    if (process.env.EMAIL_HOST && process.env.EMAIL_HOST.includes("ethereal")) {
      console.log("ℹ️  Since we are using ETHEREAL (Test Mode), check the console log above for a 'Preview URL'.");
      console.log("🔗 You can open that link to see exactly how your email looks!");
    } else {
      console.log("📧 Check your inbox!");
    }
  } else {
    console.log("\n❌ ERROR: Email failed to send.");
    console.log("Check your .env credentials and ensure your internet connection is stable.");
  }
}

test();

