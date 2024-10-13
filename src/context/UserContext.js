import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase'; // Import Firebase auth
import { onAuthStateChanged, signOut } from 'firebase/auth'; // Import hàm theo dõi trạng thái xác thực và signOut

// Tạo context
const UserContext = createContext();

// Provider component
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Trạng thái người dùng

    useEffect(() => {
        // Theo dõi trạng thái xác thực của người dùng
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user); // Nếu có người dùng, cập nhật state
            } else {
                setUser(null); // Nếu không có người dùng, đặt state là null
            }
        });

        return () => unsubscribe(); // Cleanup khi component unmount
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, signOut }}>
            {children}
        </UserContext.Provider>
    );
};

// Custom hook để sử dụng context
export const useUser = () => {
    return useContext(UserContext);
};
