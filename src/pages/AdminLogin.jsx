import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function AdminLogin() {
  const navigate = useNavigate();

  const [email,setEmail] = useState("");
  const [otp,setOtp] = useState("");
  const [step,setStep] = useState(1);
  const [loading,setLoading] = useState(false);

  const sendOTP = async () => {
    try{
      setLoading(true);
      await api.post("/admin/send-otp",{email});
      setStep(2);
      alert("OTP sent to email");
    }catch{
      alert("Failed to send OTP");
    }finally{
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    try{
      setLoading(true);

      const res = await api.post("/admin/verify-otp",{email,otp});
      sessionStorage.clear();
      sessionStorage.setItem("role", res.data.role || "admin");
      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("userId", res.data.id || "admin");

      alert("Admin Login Successful");
      navigate("/admin");

    }catch{
      alert("Invalid OTP");
    }finally{
      setLoading(false);
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
🚚 Smart Pickup System
</div>

<div style={styles.featureCard}>
🤝 NGOs Receive Food
</div>

</div>

</div>

{/* RIGHT SIDE LOGIN */}

<div style={styles.right}>

<div style={styles.card}>

<h2 style={styles.loginTitle}>Admin Login</h2>

{step === 1 && (
<>
<input
type="email"
placeholder="Enter Admin Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
style={styles.input}
/>

<button
onClick={sendOTP}
disabled={loading}
style={styles.greenButton}
>
{loading ? "Sending OTP..." : "Send OTP"}
</button>
</>
)}

{step === 2 && (
<>
<input
type="text"
placeholder="Enter OTP"
value={otp}
onChange={(e)=>setOtp(e.target.value)}
style={styles.input}
/>

<button
onClick={verifyOTP}
disabled={loading}
style={styles.blueButton}
>
{loading ? "Verifying..." : "Verify OTP"}
</button>
</>
)}

</div>

</div>

</div>

  );

}

export default AdminLogin;



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

blueButton:{
width:"100%",
padding:"12px",
background:"#2979ff",
color:"white",
border:"none",
borderRadius:"8px",
fontWeight:"600",
cursor:"pointer"
}

};