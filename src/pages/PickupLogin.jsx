import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

function PickupLogin(){

const [name,setName] = useState("");
const [email,setEmail] = useState("");
const [password,setPassword] = useState("");
const [loading,setLoading] = useState(false);

const [registerMode,setRegisterMode] = useState(false);

const [otp,setOtp] = useState("");
const [showOtp,setShowOtp] = useState(false);
const [otpLoading,setOtpLoading] = useState(false);

const [showPassword,setShowPassword] = useState(false);

const [forgotMode,setForgotMode] = useState(false);

const navigate = useNavigate();

/* ===========================
   REGISTER
=========================== */

const register = async () => {

try{
setLoading(true);

await api.post("/auth/register",{
name,
email,
password,
role:"pickup"
});

alert("Pickup Registration successful. OTP sent!");

setRegisterMode(false);

}catch(err){
alert(err?.response?.data?.message || "Registration failed");
}finally{
setLoading(false);
}

};

/* ===========================
   PASSWORD LOGIN
=========================== */

const login = async () => {

try{
setLoading(true);

const res = await api.post("/auth/login",{email,password});

if(res.data.role !== "pickup"){
  alert("This account is not Pickup");
  return;
}

sessionStorage.clear();

sessionStorage.setItem("userId", res.data.id);
sessionStorage.setItem("token",res.data.token);
sessionStorage.setItem("role",res.data.role);

alert("Pickup login successful");

navigate("/pickup");

}catch(err){
alert(err?.response?.data?.message || "Login failed");
}finally{
setLoading(false);
}

};

/* ===========================
   SEND OTP
=========================== */

const sendOtp = async () =>{

try{
if(!email){
alert("Enter email first");
return;
}

setOtpLoading(true);

await api.post("/auth/send-otp",{email});

alert("OTP sent to email");

setShowOtp(true);

}catch(err){
alert(err?.response?.data?.message || "Failed to send OTP");
}finally{
setOtpLoading(false);
}

};

/* ===========================
   VERIFY OTP LOGIN
=========================== */

const verifyOtp = async ()=>{

try{
setOtpLoading(true);

const res = await api.post("/auth/verify-otp",{email,otp});

if(res.data.role !== "pickup"){
  alert("This account is not Pickup");
  return;
}

sessionStorage.setItem("userId", res.data.id);
sessionStorage.setItem("token",res.data.token);
sessionStorage.setItem("role",res.data.role);

alert("OTP login successful");

navigate("/pickup");
}catch(err){
alert(err?.response?.data?.message || "Invalid OTP");
}finally{
setOtpLoading(false);
}

};

/* ===========================
   FORGOT PASSWORD
=========================== */

const forgotPassword = async ()=>{

try{
if(!email){
alert("Enter email first");
return;
}

setOtpLoading(true);

await api.post("/auth/forgot-password",{email});

alert("Reset OTP sent");

setShowOtp(true);
setForgotMode(true);

}catch(err){
alert(err?.response?.data?.message || "Failed to send reset OTP");
}finally{
setOtpLoading(false);
}

};

/* ===========================
   RESET PASSWORD
=========================== */

const resetPassword = async ()=>{

try{
if(!password){
alert("Enter new password");
return;
}

setOtpLoading(true);

await api.post("/auth/reset-password",{
email,
otp,
newPassword:password
});

alert("Password reset successful");

setForgotMode(false);
setShowOtp(false);

}catch(err){
alert(err?.response?.data?.message || "Reset failed");
}finally{
setOtpLoading(false);
}

};

return(

<div style={styles.container}>

{/* LEFT SIDE */}

<div style={styles.left}>

<h1 style={styles.title}>
🚚 <span style={{color:"#00e676"}}>Pickup Team</span>
</h1>

<p style={styles.tagline}>
Manage food pickups efficiently and deliver before expiry.
</p>

</div>


{/* RIGHT SIDE */}

<div style={styles.right}>

<div style={styles.card}>

<h2>
{registerMode ? "Pickup Register" : "Pickup Login"}
</h2>

{registerMode && (
<input
type="text"
placeholder="Enter Name"
value={name}
onChange={(e)=>setName(e.target.value)}
style={styles.input}
/>
)}

<input
type="email"
placeholder="Enter Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
style={styles.input}
/>

<div style={{position:"relative"}}>

<input
type={showPassword ? "text" : "password"}
placeholder={forgotMode ? "New Password" : "Password"}
value={password}
onChange={(e)=>setPassword(e.target.value)}
style={styles.input}
/>

<button onClick={()=>setShowPassword(!showPassword)} style={styles.showBtn}>
{showPassword ? "Hide" : "Show"}
</button>

</div>

{!forgotMode && (
<button onClick={registerMode ? register : login} style={styles.btn}>
{loading ? "Processing..." : registerMode ? "Register" : "Login"}
</button>
)}

{/* OTP */}

{!registerMode && (
<>
<p>OR Login using OTP</p>
<button onClick={sendOtp} style={styles.otpBtn}>
Send OTP
</button>
</>
)}

{showOtp && (
<>
<input
type="text"
placeholder="Enter OTP"
value={otp}
onChange={(e)=>setOtp(e.target.value)}
style={styles.input}
/>

{forgotMode ? (
<button onClick={resetPassword} style={styles.btn}>
Reset Password
</button>
) : (
<button onClick={verifyOtp} style={styles.btn}>
Verify OTP
</button>
)}
</>
)}

{/* FORGOT */}

{!registerMode && (
<p onClick={forgotPassword} style={styles.link}>
Forgot Password?
</p>
)}

<p>
{registerMode ? "Already have account?" : "New user?"}
<span onClick={()=>setRegisterMode(!registerMode)} style={styles.link}>
{registerMode ? " Login" : " Register"}
</span>
</p>

</div>
</div>
</div>

);

}

export default PickupLogin;


/* ================= STYLES ================= */

const styles = {
container:{display:"flex",height:"100vh"},
left:{flex:1,background:"#5f72ff",color:"white",display:"flex",justifyContent:"center",alignItems:"center",flexDirection:"column"},
right:{flex:1,display:"flex",justifyContent:"center",alignItems:"center"},
card:{padding:"40px",background:"white",borderRadius:"12px",width:"350px"},
input:{width:"100%",padding:"10px",marginBottom:"15px"},
btn:{width:"100%",padding:"10px",background:"green",color:"white",border:"none"},
otpBtn:{width:"100%",padding:"10px",background:"blue",color:"white"},
link:{color:"blue",cursor:"pointer"},
showBtn:{position:"absolute",right:"10px",top:"8px",background:"none",border:"none"},
title:{fontSize:"40px"},
tagline:{marginTop:"10px"}
};