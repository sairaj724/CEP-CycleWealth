import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SharedNavbar from "../components/SharedNavbar";
import supabaseClient from "../supabase-config";

function SignUp() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("consumers");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [locationLoading, setLocationLoading] = useState(false);

    const getCurrentLocation = () => {
        setLocationLoading(true);
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setLocationLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude.toFixed(6));
                setLongitude(position.coords.longitude.toFixed(6));
                setLocationLoading(false);
            },
            (error) => {
                setError("Unable to retrieve your location: " + error.message);
                setLocationLoading(false);
            }
        );
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            // Sign up with Supabase Auth - includes email verification
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        role: role,
                        latitude: latitude ? parseFloat(latitude) : null,
                        longitude: longitude ? parseFloat(longitude) : null,
                    },
                    emailRedirectTo: window.location.origin + '/login'
                }
            });

            if (error) throw error;

            if (data.user && data.user.identities && data.user.identities.length === 0) {
                setMessage("Account already exists. Please log in instead.");
                setLoading(false);
                return;
            }

            // Show success message - user needs to verify email
            setMessage("Account created successfully! Please check your email to verify your account before logging in.");
            
            // Clear form
            setFirstName("");
            setLastName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setLatitude("");
            setLongitude("");
            
        } catch (error) {
            console.error("Signup failed:", error.message);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="auth-container">
                <div className="card">
                    <h2>Create Account</h2>
                    <p>Join CycleWealth and Start Recycling</p>

                    {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}
                    {message && <p style={{ color: "green", fontSize: "14px", marginBottom: "10px" }}>{message}</p>}

                    <form onSubmit={handleSignUp}>
                        <input 
                            type="text" 
                            placeholder="First Name" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                        <input 
                            type="text" 
                            placeholder="Last Name" 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                        <input 
                            type="email" 
                            placeholder="Email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        
                        <select 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)}
                            style={{
                                width: "100%",
                                margin: "10px 0",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1px solid #ccc",
                                backgroundColor: "white",
                                cursor: "pointer"
                            }}
                        >
                            <option value="consumers">Consumer</option>
                            <option value="ScrapDealer">Scrap Dealer</option>
                            <option value="industries">Industry</option>
                            <option value="artisens">Artisan</option>
                        </select>

                        <button
                            type="button"
                            onClick={getCurrentLocation}
                            disabled={locationLoading}
                            style={{
                                width: "100%",
                                padding: "10px",
                                margin: "10px 0",
                                background: "linear-gradient(135deg, #0f9d58, #34d399)",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer"
                            }}
                        >
                            {locationLoading ? "Getting Location..." : "Get Current Location"}
                        </button>

                        <input 
                            type="number" 
                            placeholder="Latitude" 
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                            step="any"
                        />
                        <input 
                            type="number" 
                            placeholder="Longitude" 
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                            step="any"
                        />

                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <input 
                            type="password" 
                            placeholder="Confirm Password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />

                        <button type="submit" disabled={loading}>
                            {loading ? "Creating Account..." : "Sign Up"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default SignUp;