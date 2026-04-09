import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SharedNavbar from "../components/SharedNavbar";
import supabaseClient from "../supabase-config";

function Login() {
   const navigate = useNavigate();
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   const handleLogin = async (e) => {
       e.preventDefault();
       setLoading(true);
       setError("");

       try {
           // Step 1: Sign in with Supabase Auth
           const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
               email: email,
               password: password,
           });

           if (authError) {
               throw new Error("Invalid email or password");
           }

           if (!authData.user) {
               throw new Error("Failed to sign in");
           }

           // Check if email is verified
           if (!authData.user.email_confirmed_at) {
               // Sign out the user since email is not verified
               await supabaseClient.auth.signOut();
               throw new Error("Please verify your email before logging in. Check your inbox for the verification link.");
           }

           // Step 2: Fetch user profile from public.users table
           const { data: profileData, error: profileError } = await supabaseClient
               .from('users')
               .select('*')
               .eq('user_id', authData.user.id)
               .single();

           if (profileError) {
               console.warn("Profile fetch error:", profileError);
           }

           // Combine auth user and profile data
           const userData = profileData || {
               user_id: authData.user.id,
               email_address: authData.user.email,
               role: authData.user.user_metadata?.role || 'consumers',
               "First name": authData.user.user_metadata?.first_name || '',
               "Last_Name": authData.user.user_metadata?.last_name || '',
               latitude: authData.user.user_metadata?.latitude || null,
               longitude: authData.user.user_metadata?.longitude || null,
           };

           // Store user data in session
           sessionStorage.setItem('user', JSON.stringify(userData));

           // Redirect based on role
           const userRole = userData.role;
           
           if (userRole === "ScrapDealer") {
               navigate("/scrapdealer");
           } else {
               navigate("/dashboard");
           }
       } catch (error) {
           setError(error.message);
       } finally {
           setLoading(false);
       }
   };

   return(
    <>
        <div className="auth-container">
            <div className="card">
                <h2>Login</h2>
            
                {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}

                <form onSubmit={handleLogin}>
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    </>
   );
}

export default Login;