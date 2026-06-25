import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraphQLClient, gql } from "graphql-request";

// Add a fallback URL in case the environment variable is not set
const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT || "http://localhost:2000/graphql";

const ADMIN_LOGIN_MUTATION = gql`
  mutation LoginAdmin($input: LoginAdminInput!) {
    loginAdmin(input: $input) {
      user {
        id
        username
        email
        mobile
        gender
        role
        createdTime
      }
      jwtToken
    }
  }
`;

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const client = new GraphQLClient(GRAPHQL_ENDPOINT);

      const variables = {
        input: {
          email: email,
          password: password,
        },
      };

      const data = await client.request(ADMIN_LOGIN_MUTATION, variables);

      if (data?.loginAdmin?.jwtToken) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("jwtToken", data.loginAdmin.jwtToken);
        localStorage.setItem("email", data.loginAdmin.user.email);
        localStorage.setItem("username", data.loginAdmin.user.username || "");
        localStorage.setItem("userId", data.loginAdmin.user.id || "");
        localStorage.setItem("userRole", data.loginAdmin.user.role || "");
        localStorage.setItem("userData", JSON.stringify(data.loginAdmin.user));

        navigate("/dashboard");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err?.response?.errors?.[0]?.message ||
        err?.message ||
        "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>

      <form style={styles.box} onSubmit={handleLogin}>
        <h2 style={styles.contant}>Admin Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        <button
          style={styles.button}
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f2f2f2",
  },
  logo: {
    position: "absolute",

    left: "50%",
    transform: "translateX(-50%)",
    width: "120px",
    height: "auto",
    marginBottom: "30%",

  },
  box: {
    width: "300px",
    padding: "30px",
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  input: {
    width: "90%",
    padding: "10px",
    marginBottom: "10px",
    marginleft: "20px"
  },
  button: {
    width: "98%",
    padding: "10px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: "4px",
    marginleft: "20px"
  },
  error: {
    color: "red",
    marginTop: "10px",
    textAlign: "center",
  },
  contant: {
    textAlign: "center"
  }
};

export default Login;
