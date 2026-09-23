// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDQ-woih5cuLOAZowWaiot8fXKmGYAGP3I",
  authDomain: "appcon2026-appsembly-lifesimai.firebaseapp.com",
  projectId: "appcon2026-appsembly-lifesimai",
  storageBucket: "appcon2026-appsembly-lifesimai.firebasestorage.app",
  messagingSenderId: "34193676976",
  appId: "1:34193676976:web:2c845e46c5ac0ebf0cf975",
  measurementId: "G-4MMLEVCNJ1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);