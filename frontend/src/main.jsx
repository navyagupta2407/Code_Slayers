import { AuthProvider } from "./context/AuthContext";
import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#FFFCF6",
            color: "#30372F",
            border: "1px solid #DDD6C8",
            fontSize: "14px",
            fontFamily: "'DM Sans', sans-serif",
          },
        }}
      />
      <App />
    </AuthProvider>
  </React.StrictMode>
);
