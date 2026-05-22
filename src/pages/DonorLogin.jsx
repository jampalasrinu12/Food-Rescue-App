import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

function DonorLogin(){

const [name,setName] = useState(""); // REGISTER NAME
const [email,setEmail] = useState("");
const [password,setPassword] = useState("");
const [loading,setLoading] = useState(false);

/* REGISTER MODE */
const [registerMode,setRegisterMode] = useState(false);

/* OTP STATES */
const [otp,setOtp] = useState("");
const [showOtp,setShowOtp] = useState(false);
const [otpLoading,setOtpLoading] = useState(false);

/* PASSWORD TOGGLE */
const [showPassword,setShowPassword] = useState(false);

/* FORGOT PASSWORD */
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
role:"donor"
});

alert("Registration successful");

setRegisterMode(false);

}catch(err){

console.error(err);
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

if(res.data.role?.toLowerCase() !== "donor"){
  alert("This account is not registered as Donor");
  return;
}

sessionStorage.clear();

sessionStorage.setItem("userId", res.data.id);
sessionStorage.setItem("token",res.data.token);
sessionStorage.setItem("role",res.data.role);

alert("Donor login successful");

navigate("/donor");

}catch(err){

console.error(err);
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

alert("OTP sent to your email");

setShowOtp(true);

}catch(err){

console.error(err);
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

if(res.data.role !== "donor"){
  alert("This account is not registered as Donor");
  return;
}

sessionStorage.setItem("userId", res.data.id);
sessionStorage.setItem("token",res.data.token);
sessionStorage.setItem("role",res.data.role);

alert("OTP login successful");

navigate("/donor");

}catch(err){

console.error(err);
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

alert("Reset OTP sent to email");

setShowOtp(true);
setForgotMode(true);

}catch(err){

console.error(err);
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

console.error(err);
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
🍽 <span style={{color:"#00e676"}}>Food Rescue</span>
</h1>

<p style={styles.tagline}>
Connecting <span style={styles.highlight}>Food Donors</span>,
<span style={styles.highlight}> NGOs</span> and
<span style={styles.highlight}> Pickup Teams</span>
to reduce food waste.
</p>

<p style={styles.quote}>
"Every meal saved is a step towards a hunger-free world."
</p>

<div style={styles.features}>

<div style={styles.featureCard}>
🍱 Donate Surplus Food
</div>

<div style={styles.featureCard}>
⚡ Smart Pickup System
</div>

<div style={styles.featureCard}>
🤝 NGOs Receive Food
</div>

</div>

</div>


{/* RIGHT SIDE LOGIN */}

<div style={styles.right}>

<div style={styles.card}>

<h2 style={styles.loginTitle}>
{registerMode ? "Donor Register" : "Donor Login"}
</h2>


{/* NAME FIELD */}

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


{/* PASSWORD */}

<div style={{position:"relative"}}>

<input
type={showPassword ? "text" : "password"}
placeholder={forgotMode ? "Enter New Password" : "Enter Password"}
value={password}
onChange={(e)=>setPassword(e.target.value)}
style={styles.input}
/>

<button
onClick={()=>setShowPassword(!showPassword)}
style={styles.showBtn}
>
{showPassword ? "Hide" : "Show"}
</button>

</div>


{/* LOGIN OR REGISTER BUTTON */}

{!forgotMode && (

<button
onClick={registerMode ? register : login}
disabled={loading}
style={styles.greenButton}
>
{loading ? "Processing..." : registerMode ? "Register" : "Login"}
</button>

)}



{/* OTP LOGIN */}

{!registerMode && (

<>

<p style={{marginTop:"20px",fontSize:"14px"}}>
OR Login using OTP
</p>

<button
onClick={sendOtp}
disabled={otpLoading}
style={styles.otpButton}
>
{otpLoading ? "Sending OTP..." : "Send OTP"}
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

<button
onClick={resetPassword}
style={styles.greenButton}
>
Reset Password
</button>

) : (

<button
onClick={verifyOtp}
style={styles.greenButton}
>
Verify OTP
</button>

)}

</>

)}



{/* FORGOT PASSWORD */}

{!registerMode && (

<p
style={{marginTop:"10px",cursor:"pointer",color:"#5f72ff"}}
onClick={forgotPassword}
>
Forgot Password?
</p>

)}



{/* TOGGLE LOGIN REGISTER */}

<p style={{marginTop:"20px",fontSize:"14px"}}>

{registerMode ? "Already have an account?" : "Don't have an account?"}

<span
style={styles.registerLink}
onClick={()=>setRegisterMode(!registerMode)}
>
{registerMode ? " Login" : " Register"}
</span>

</p>

</div>

</div>

</div>

);

}

export default DonorLogin;



const styles={

container:{
display:"flex",
height:"100vh",
fontFamily:"Poppins, sans-serif",
background:"#f4f6f8"
},

left:{
flex:1,
background:"linear-gradient(135deg,#5f72ff,#9a5cff)",
color:"white",
display:"flex",
flexDirection:"column",
justifyContent:"center",
padding:"80px"
},

title:{
fontSize:"42px",
fontWeight:"700",
marginBottom:"20px"
},

tagline:{
fontSize:"18px",
lineHeight:"30px",
opacity:"0.9"
},

highlight:{
color:"#00e676",
fontWeight:"600"
},

quote:{
marginTop:"25px",
fontStyle:"italic",
opacity:"0.85"
},

features:{
display:"flex",
gap:"20px",
marginTop:"40px"
},

featureCard:{
background:"rgba(255,255,255,0.15)",
padding:"14px 20px",
borderRadius:"10px",
fontSize:"14px",
backdropFilter:"blur(10px)"
},

right:{
flex:1,
display:"flex",
justifyContent:"center",
alignItems:"center"
},

card:{
width:"380px",
padding:"40px",
background:"white",
borderRadius:"16px",
boxShadow:"0 20px 40px rgba(0,0,0,0.15)",
textAlign:"center"
},

loginTitle:{
marginBottom:"20px"
},

input:{
width:"100%",
padding:"12px",
marginBottom:"20px",
borderRadius:"8px",
border:"1px solid #ddd"
},

greenButton:{
width:"100%",
padding:"12px",
background:"#00c853",
color:"white",
border:"none",
borderRadius:"8px",
fontWeight:"600",
cursor:"pointer"
},

otpButton:{
width:"100%",
padding:"10px",
background:"#5f72ff",
color:"white",
border:"none",
borderRadius:"8px",
cursor:"pointer",
marginTop:"10px"
},

registerLink:{
color:"#00c853",
fontWeight:"600",
cursor:"pointer",
marginLeft:"5px"
},

showBtn:{
position:"absolute",
right:"10px",
top:"8px",
border:"none",
background:"none",
cursor:"pointer",
color:"#5f72ff"
}

};