// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyATOrVQdJTjdxaLiyWGUsBdsHOIeR2u35g",
  authDomain: "lomsaa-330fc.firebaseapp.com",
  projectId: "lomsaa-330fc",
  storageBucket: "lomsaa-330fc.firebasestorage.app",
  messagingSenderId: "111468553262",
  appId: "1:111468553262:web:143917d259dda382f22bbf",
  measurementId: "G-DB1RS8L3XQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, analytics };
export default app;
