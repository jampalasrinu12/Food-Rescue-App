console.log("🔥 ADMIN ROUTES LOADED SUCCESSFULLY");
const transporter = require("../utils/mailer");
const otpGenerator = require("otp-generator");
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const OTP_EXPIRY_MINUTES = 5;


/* ===============================
   SEND OTP (LOGIN)
=============================== */

exports.sendOTP = async (req, res) => {

  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success:false,
        message:"Email is required"
      });
    }

    const otp = otpGenerator.generate(6,{
      upperCase:false,
      specialChars:false,
      alphabets:false
    });

    const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const query = "SELECT id,email FROM users WHERE email=?";

    db.query(query,[email],async(err,result)=>{

      if(err){
        console.error(err);
        return res.status(500).json({
          success:false,
          message:"Database error"
        });
      }

     if(result.length === 0){

  // ❌ LOGIN FAILED LOG
  db.query(
    `INSERT INTO login_history (email, status, message)
     VALUES (?, 'FAILED', 'Invalid email')`,
    [email]
  );

  return res.status(401).json({
    success:false,
    message:"Invalid email"
  });
}
      const updateQuery =
      "UPDATE users SET otp=?, otp_expiry=? WHERE email=?";

      db.query(updateQuery,[otp,expiry,email]);

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: email,
        subject: "Food Rescue Login OTP",
        html:`<h2>Your OTP</h2>
              <p>Your login OTP is <b>${otp}</b></p>
              <p>This OTP expires in 5 minutes.</p>`
      };

      await transporter.sendMail(mailOptions);

      res.json({
        success:true,
        message:"OTP sent successfully"
      });

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success:false,
      message:"Internal Server Error"
    });

  }

};



/* ===============================
   VERIFY OTP LOGIN
=============================== */

exports.verifyOTP = async (req,res)=>{

  try{

    const {email,otp} = req.body;

    if(!email || !otp){
      return res.status(400).json({
        success:false,
        message:"Email and OTP required"
      });
    }

    const query =
    "SELECT id,role,otp,otp_expiry FROM users WHERE email=?";

    db.query(query,[email],async(err,result)=>{

      if(err){
        return res.status(500).json({
          success:false,
          message:"Database error"
        });
      }

      if(result.length === 0){
        return res.status(404).json({
          success:false,
          message:"User not found"
        });
      }

      const user = result[0];

      if(user.otp !== otp){
        return res.status(401).json({
          success:false,
          message:"Invalid OTP"
        });
      }

      if(new Date() > new Date(user.otp_expiry)){
        return res.status(401).json({
          success:false,
          message:"OTP expired"
        });
      }

      const clearQuery =
      "UPDATE users SET otp=NULL, otp_expiry=NULL WHERE email=?";

      db.query(clearQuery,[email]);

      const token = jwt.sign(
        {id:user.id,role:user.role},
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
      );

      res.json({
        success:true,
        message:"Login successful",
        token,
        role:user.role,
        id:user.id
      });

    });

  }catch(error){

    console.error(error);

    res.status(500).json({
      success:false,
      message:"Internal Server Error"
    });

  }

};



/* ===============================
   FORGOT PASSWORD
=============================== */

exports.forgotPassword = async (req,res)=>{

  try{

    const {email} = req.body;

    if(!email){
      return res.status(400).json({
        success:false,
        message:"Email required"
      });
    }

    const otp = otpGenerator.generate(6,{
      upperCase:false,
      specialChars:false,
      alphabets:false
    });

    const expiry = new Date(Date.now()+OTP_EXPIRY_MINUTES*60*1000);

    const query = "SELECT id FROM users WHERE email=?";

    db.query(query,[email],async(err,result)=>{

      if(err){
        return res.status(500).json({
          success:false,
          message:"Database error"
        });
      }

      if(result.length === 0){
        return res.status(404).json({
          success:false,
          message:"Email not registered"
        });
      }

      const updateQuery =
      "UPDATE users SET reset_otp=?, reset_expiry=? WHERE email=?";

      db.query(updateQuery,[otp,expiry,email]);

      const mailOptions = {
        from:`"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
        to:email,
        subject:"Food Rescue Password Reset OTP",
        html:`<h2>Password Reset</h2>
              <p>Your OTP is <b>${otp}</b></p>
              <p>This OTP expires in 5 minutes.</p>`
      };

      await transporter.sendMail(mailOptions);

      res.json({
        success:true,
        message:"Password reset OTP sent"
      });

    });

  }catch(error){

    console.error(error);

    res.status(500).json({
      success:false,
      message:"Internal Server Error"
    });

  }

};



/* ===============================
   RESET PASSWORD
=============================== */

exports.resetPassword = async (req,res)=>{

  try{

    const {email,otp,newPassword} = req.body;

    if(!email || !otp || !newPassword){
      return res.status(400).json({
        success:false,
        message:"Email, OTP and new password required"
      });
    }

    const query =
    "SELECT reset_otp,reset_expiry FROM users WHERE email=?";

    db.query(query,[email],async(err,result)=>{

      if(err){
        return res.status(500).json({
          success:false,
          message:"Database error"
        });
      }

      if(result.length === 0){
        return res.status(404).json({
          success:false,
          message:"User not found"
        });
      }

      const user = result[0];

      if(user.reset_otp !== otp){
        return res.status(401).json({
          success:false,
          message:"Invalid OTP"
        });
      }

      if(new Date() > new Date(user.reset_expiry)){
        return res.status(401).json({
          success:false,
          message:"OTP expired"
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword,10);

      const updateQuery =
      "UPDATE users SET password=?, reset_otp=NULL, reset_expiry=NULL WHERE email=?";

      db.query(updateQuery,[hashedPassword,email]);

      res.json({
        success:true,
        message:"Password reset successful"
      });

    });

  }catch(error){

    console.error(error);

    res.status(500).json({
      success:false,
      message:"Internal Server Error"
    });

  }

};
/* ===============================
   REGISTER
=============================== */

exports.register = async (req,res)=>{

try{

const {name,email,password} = req.body;

if(!name || !email || !password){
return res.status(400).json({
success:false,
message:"All fields required"
});
}

const checkQuery = "SELECT id FROM users WHERE email=?";

db.query(checkQuery,[email],async(err,result)=>{

if(result.length > 0){
return res.status(400).json({
success:false,
message:"Email already exists"
});
}

const hashedPassword = await bcrypt.hash(password,10);

db.query(
"INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)",
[name,email,hashedPassword,"donor"],
()=>{

res.json({
success:true,
message:"Registration successful"
});

});

});

}catch(err){
res.status(500).json({
success:false,
message:"Registration failed"
});
}

};
	
/* ===============================
   LOGIN WITH PASSWORD
=============================== */

exports.login = async (req,res)=>{

try{

const {email,password} = req.body;

if(!email || !password){
return res.status(400).json({
success:false,
message:"Email and password required"
});
}

const query =
"SELECT id,password,role FROM users WHERE email=?";

db.query(query,[email],async(err,result)=>{

if(err){
return res.status(500).json({
success:false,
message:"Database error"
});
}

if(result.length === 0){

  db.query(
    `INSERT INTO login_history (email, status, message, role)
     VALUES (?, 'FAILED', 'Invalid email', 'admin')`,
    [email],
    (err) => {
      if (err) console.error(err);
      else console.log("❌ EMAIL NOT FOUND LOG INSERTED");
    }
  );

  return res.status(401).json({
    success:false,
    message:"Invalid email"
  });
}
const user = result[0];

const match = await bcrypt.compare(password,user.password);

if(!match){

  db.query(
    `INSERT INTO login_history (email, status, message, role)
     VALUES (?, 'FAILED', 'Invalid password', 'admin')`,
    [email],
    (err) => {
      if (err) console.error(err);
      else console.log("❌ PASSWORD WRONG LOG INSERTED");
    }
  );

  return res.status(401).json({
    success:false,
    message:"Invalid password"
  });
}

// ✅ LOGIN SUCCESS LOG
db.query(
  `INSERT INTO login_history (user_id, role, email, status, message)
   VALUES (?, ?, ?, 'SUCCESS', 'Login successful')`,
  [user.id, user.role, email],
  (err) => {
    if (err) {
      console.error("❌ INSERT ERROR:", err);
    } else {
      console.log("✅ SUCCESS LOG INSERTED");
    }
  }
);

const token = jwt.sign(
  {id:user.id,role:user.role},
  process.env.JWT_SECRET,
  {expiresIn:"1d"}
);

res.json({
  success:true,
  message:"Login successful",
  token,
  role:user.role,
  id:user.id
});

});

}catch(err){

console.error(err);

res.status(500).json({
success:false,
message:"Login failed"
});

}

};