// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-uymqobVfuiMM8oS0atw98Hy6vjO6Emc",
  authDomain: "basicosxequipos.firebaseapp.com",
  projectId: "basicosxequipos",
  storageBucket: "basicosxequipos.firebasestorage.app",
  messagingSenderId: "822629958465",
  appId: "1:822629958465:web:192c4be91cf6140bea17c0",
  measurementId: "G-BE9B54P67C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
