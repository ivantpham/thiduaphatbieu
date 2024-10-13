import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Realtime Database
import { getFirestore } from "firebase/firestore"; // Cloud Firestore

// Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBnlMKiXTYDFlqDCxjWCEYvLoQxDvDITOc",
    authDomain: "thiduaphatbieu.firebaseapp.com",
    projectId: "thiduaphatbieu",
    storageBucket: "thiduaphatbieu.appspot.com",
    messagingSenderId: "420657515694",
    appId: "1:420657515694:web:5bc0772254f7d41304f13f",
    databaseURL: "https://thiduaphatbieu-default-rtdb.firebaseio.com"  // Realtime Database URL
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);  // Realtime Database
const firestore = getFirestore(app); // Cloud Firestore

export { auth, database, firestore };
