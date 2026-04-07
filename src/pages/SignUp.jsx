import React from "react";

function SignUp() {
    return (

        <div className="auth-container">
            <div className="card">

                <h2>Create Account</h2>
                <p>Join CycleWealth and Start Recycling</p>

                <input type="text" placeholder="Full Name" />
                <input type="email" placeholder="Email" />
                <input type="password" placeholder="Password" />
                <input type="password" placeholder="Confirm Password" />

                <button>Sign Up</button>
            </div>
        </div>

    );
}

export default SignUp