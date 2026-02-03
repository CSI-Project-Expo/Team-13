import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import axios from "axios";
import { signOut } from "firebase/auth";


export const logoutUser = async () => {
  await signOut(auth);
};

const API_BASE = "http://localhost:8000/api";

export const registerUser = async (email, password, name, role = 'user') => {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    // 🔑 FORCE refresh token (important)
    const token = await userCred.user.getIdToken(true);
    if (!token) {
      throw new Error('Failed to get Firebase ID token');
    }

    console.log("Registering user with backend...", { email, name, role, tokenLength: token.length });

    await axios.post(
      `${API_BASE}/auth/register`,
      { name, role },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    localStorage.setItem('authToken', token);

    return { user: userCred.user, error: null };
  } catch (err) {
    console.error("Registration error details:", err.response?.data || err.message);
    return { user: null, error: err.response?.data?.detail || err.message };
  }
};


export const loginUser = async (email, password) => {
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCred.user.getIdToken(true);
    localStorage.setItem('authToken', token);
    console.log('Login successful');
    return { user: userCred.user, error: null };
  } catch (err) {
    console.error('Login error:', err);
    return { user: null, error: err.message };
  }
};
