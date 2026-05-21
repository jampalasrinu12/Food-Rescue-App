const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({

  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }

});

transporter.verify((error, success) => {

  if (error) {
    console.log("❌ SMTP Error:", error);
  } else {
    console.log("✅ Email Server Ready");
  }

});

module.exports = transporter;