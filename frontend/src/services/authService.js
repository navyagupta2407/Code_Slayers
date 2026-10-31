import { supabase } from "./supabase";

// Register a new user
export const registerUser = async (email, password, fullName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;

  return data;
};

// Login existing user
export const loginUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
};

// Logout user
export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
};

// Get currently logged-in user
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  return data.user;
};


// Verify email using the OTP sent by Supabase
export const verifyEmailOtp = async (email, token) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error) throw error;

  return data;
};

// Resend email verification code
export const resendVerificationEmail = async (email) => {
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) throw error;

  return data;
};
