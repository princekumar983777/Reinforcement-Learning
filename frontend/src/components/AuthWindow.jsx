// src/components/AuthModal.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../css/AuthWindow.css";

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, signup } = useAuth();

  // Login form state
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Signup form state
  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(loginData.email, loginData.password);

    if (result.success) {
      setLoginData({ email: "", password: "" });
      onClose();
    } else {
      setError(result.message || "Login failed");
    }

    setLoading(false);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const result = await signup({
      username: signupData.username,
      email: signupData.email,
      password: signupData.password,
    });

    if (result.success) {
      setSignupData({ username: "", email: "", password: "", confirmPassword: "" });
      setIsLogin(true);
      onClose();
    } else {
      setError(result.message || "Signup failed");
    }

    setLoading(false);
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div
        className="auth-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`auth-slider ${isLogin ? "" : "slide"}`}>
          
          {/* LOGIN */}
          <form className="auth-form login" onSubmit={handleLoginSubmit}>
            <h2 className="title cyan">LOGIN</h2>

            {error && <div style={{ color: "var(--pink)", marginBottom: "10px" }}>{error}</div>}

            <input
              placeholder="Email"
              type="email"
              value={loginData.email}
              onChange={(e) =>
                setLoginData({ ...loginData, email: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({ ...loginData, password: e.target.value })
              }
              required
            />

            <button className="btn cyan" type="submit" disabled={loading}>
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>

            <p>
              Don't have an account?{" "}
              <span onClick={() => {
                setIsLogin(false);
                setError("");
              }}>SIGN UP</span>
            </p>
          </form>

          {/* SIGNUP */}
          <form className="auth-form signup" onSubmit={handleSignupSubmit}>
            <h2 className="title pink">SIGN UP</h2>

            {error && <div style={{ color: "var(--pink)", marginBottom: "10px" }}>{error}</div>}

            <input
              placeholder="Username"
              value={signupData.username}
              onChange={(e) =>
                setSignupData({ ...signupData, username: e.target.value })
              }
              required
            />
            <input
              placeholder="Email"
              type="email"
              value={signupData.email}
              onChange={(e) =>
                setSignupData({ ...signupData, email: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={signupData.password}
              onChange={(e) =>
                setSignupData({ ...signupData, password: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={signupData.confirmPassword}
              onChange={(e) =>
                setSignupData({ ...signupData, confirmPassword: e.target.value })
              }
              required
            />

            <button className="btn pink" type="submit" disabled={loading}>
              {loading ? "SIGNING UP..." : "SIGN UP"}
            </button>

            <p>
              Already have an account?{" "}
              <span onClick={() => {
                setIsLogin(true);
                setError("");
              }}>LOGIN</span>
            </p>
          </form>

        </div>

        <button className="close" onClick={onClose}>✕</button>
      </div>
    </div>
  );
};

export default AuthModal;