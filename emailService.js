const nodemailer = require("nodemailer");

async function sendWelcomeEmail(to, name) {
  // Use credentials from .env
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.ethereal.email",
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const isTestAccount = (process.env.EMAIL_HOST || "").includes("ethereal");

  const mailOptions = {
    from: `"Telemedicine" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: "Welcome to your new health companion! 🏥",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); background-color: #ffffff; border: 1px solid #f0f0f0;">
        <div style="background: linear-gradient(135deg, #00a8c6 0%, #0072ff 100%); padding: 50px 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">TeleCare</h1>
          <p style="margin-top: 10px; font-size: 18px; opacity: 0.9;">Smart Healthcare. Anytime. Anywhere.</p>
        </div>
        
        <div style="padding: 40px; color: #2c3e50; line-height: 1.8;">
          <h2 style="color: #00a8c6; font-size: 24px;">Hello ${name},</h2>
          <p style="font-size: 16px;">We are absolutely thrilled to have you join the family. Your journey to a simpler, faster, and more modern healthcare experience starts today.</p>
          
          <div style="background: #f8fbff; border-radius: 12px; padding: 25px; margin: 30px 0;">
            <p style="margin: 0 0 15px 0; font-weight: 700; color: #0072ff;">What's next for you?</p>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li style="margin-bottom: 10px;"><b>Book a Specialist:</b> Connect with top doctors in seconds.</li>
              <li style="margin-bottom: 10px;"><b>Video Consult:</b> High-quality calls from your home.</li>
              <li style="margin-bottom: 10px;"><b>AI Assistant:</b> Instant guidance whenever you need it.</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <a href="http://localhost:5000/login.html" style="background: linear-gradient(135deg, #00a8c6 0%, #0072ff 100%); color: white; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 20px rgba(0, 168, 198, 0.2);">Enter Your Dashboard</a>
          </div>
        </div>
        
        <div style="background: #fbfcfe; padding: 30px; text-align: center; color: #bdc3c7; font-size: 12px; border-top: 1px solid #f1f1f1;">
          <p>&copy; 2026 TeleCare Healthcare Systems</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Welcome Email Processed!");
    if (isTestAccount) {
      console.log("🔗 Preview URL: " + nodemailer.getTestMessageUrl(info));
    }
    return true;
  } catch (error) {
    console.error("❌ Email Error:", error);
    return false;
  }
}

async function sendAppointmentEmail(to, name, doctorName, date, time) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.ethereal.email",
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const isTestAccount = (process.env.EMAIL_HOST || "").includes("ethereal");

  const mailOptions = {
    from: `"Telemedicine" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: "Appointment Booking Confirmation 📅",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); background-color: #ffffff; border: 1px solid #f0f0f0;">
        <div style="background: linear-gradient(135deg, #00a8c6 0%, #0072ff 100%); padding: 40px 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">Booking Confirmed</h1>
        </div>
        
        <div style="padding: 40px; color: #2c3e50; line-height: 1.8;">
          <h2 style="color: #00a8c6; font-size: 22px;">Hello ${name},</h2>
          <p style="font-size: 16px;">Your appointment has been successfully booked. Here are your details:</p>
          
          <div style="background: #f8fbff; border-radius: 12px; padding: 25px; margin: 30px 0;">
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li style="margin-bottom: 10px;"><b>Doctor:</b> ${doctorName}</li>
              <li style="margin-bottom: 10px;"><b>Date:</b> ${date}</li>
              <li style="margin-bottom: 10px;"><b>Time:</b> ${time}</li>
            </ul>
          </div>

          <p style="font-size: 16px;">Please log in to your dashboard to manage your appointments or start the consultation.</p>
        </div>
        
        <div style="background: #fbfcfe; padding: 30px; text-align: center; color: #bdc3c7; font-size: 12px; border-top: 1px solid #f1f1f1;">
          <p>&copy; 2026 TeleCare Healthcare Systems</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Appointment Email Processed!");
    if (isTestAccount) {
      console.log("🔗 Preview URL: " + nodemailer.getTestMessageUrl(info));
    }
    return true;
  } catch (error) {
    console.error("❌ Email Error:", error);
    return false;
  }
}

module.exports = { sendWelcomeEmail, sendAppointmentEmail };
