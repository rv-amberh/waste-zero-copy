// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'; // Correctly import getAuth from 'firebase/auth'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0QzOi4IXy9D9Gvat2GB9AFnWDMGLwUNY",
  authDomain: "wastezero-dcaba.firebaseapp.com",
  projectId: "wastezero-dcaba",
  storageBucket: "wastezero-dcaba.firebasestorage.app",
  messagingSenderId: "212670186625",
  appId: "1:212670186625:web:0243f9346d161cf8f87980",
  measurementId: "G-NWLMT7F0ZQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
