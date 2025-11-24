import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {getAuth} from "@firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBXBnRlpBPGibyyXuOgvDmYpQd4mMNAqDc",
    authDomain: "secretsant-123333.firebaseapp.com",
    projectId: "secretsant-123333",
    storageBucket: "secretsant-123333.firebasestorage.app",
    messagingSenderId: "345125307872",
    appId: "1:345125307872:web:9774caff9dfd77f5a5d785",
    measurementId: "G-YWJ10DZTJX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // Export auth
