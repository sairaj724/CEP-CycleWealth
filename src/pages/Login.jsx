import React from "react";

function Login() {
   return(
    <div className="auth-container">
        <div className="card">
            <h2>Login</h2>

            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />

            <button>Login</button>
        </div>
    </div>
   );
}

export default Login;