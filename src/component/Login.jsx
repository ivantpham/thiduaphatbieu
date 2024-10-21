import React, { useState } from "react";
import "../style/Login.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { auth } from "../firebase"; // Import Firebase Auth
import { signInWithEmailAndPassword } from "firebase/auth"; // Import hàm đăng nhập
import { useUser } from '../context/UserContext'; // Import UserContext
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { firestore } from "../firebase"; // Import Firestore

function LoginPopup() {
    const { setUser } = useUser(); // Lấy hàm setUser từ context
    const [showLoginPopup, setShowLoginPopup] = useState(true); // Đặt state showLoginPopup mặc định là true
    const [email, setEmail] = useState(""); // State cho email
    const [password, setPassword] = useState(""); // State cho mật khẩu
    const [errorMessage, setErrorMessage] = useState(""); // State cho thông báo lỗi

    const closeLoginPopup = () => {
        setShowLoginPopup(false); // Đặt lại state showLoginPopup thành false để ẩn pop-up
    };

    const handleLogin = async (e) => {
        e.preventDefault(); // Ngăn chặn reload trang
        setErrorMessage(""); // Reset thông báo lỗi

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user; // Lấy thông tin người dùng
            setUser(user); // Lưu thông tin người dùng vào context

            // In ra tên của người dùng đăng nhập
            console.log("Đăng nhập thành công. Tên người dùng:", user.email);

            // Kiểm tra email trong Firestore
            const docRef = doc(firestore, 'nicknames', user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const nicknameData = docSnap.data();
                if (nicknameData.email === email) {
                    localStorage.setItem('userName', nicknameData.nickname); // Lưu nickname vào localStorage
                }
            }

            alert("Đăng nhập thành công!"); // Thông báo thành công
            closeLoginPopup(); // Đóng popup đăng nhập

            // Reload lại trang sau khi hoàn thành
            window.location.reload();
        } catch (error) {
            setErrorMessage("Sai tên đăng nhập hoặc mật khẩu."); // Thông báo lỗi
        }
    };

    return (
        <div className={`login-container ${!showLoginPopup ? 'd-none' : ''}`}>
            <div className="login-popup">
                <div className="login-popup-content p-4">
                    <h2 className="login-header text-center">Chào mừng Bạn!</h2>
                    <p className="login-subtext text-center">Vui lòng đăng nhập để tiếp tục</p>
                    <form onSubmit={handleLogin}>
                        <div className="login-form-group">
                            <label htmlFor="email" className="form-label">Email</label>
                            <input
                                type="email"
                                id="email"
                                className="login-input-email form-control"
                                placeholder="Nhập email của bạn"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)} // Đảm bảo cập nhật giá trị đúng
                                required
                            />
                        </div>
                        <div className="login-form-group">
                            <label htmlFor="password" className="form-label">Mật khẩu</label>
                            <input
                                type="password"
                                id="password"
                                className="login-input-password form-control"
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)} // Đảm bảo cập nhật giá trị đúng
                                required
                            />
                        </div>
                        {errorMessage && (
                            <p className="text-danger text-center">{errorMessage}</p> // Hiển thị thông báo lỗi
                        )}
                        <button type="submit" className="login-submit-button btn btn-success w-100">Đăng nhập</button>
                    </form>
                    <p className="contact-info text-center">
                        Nếu chưa có tài khoản, vui lòng liên hệ Ban Điều Hành
                    </p>
                    <button className="close-button btn btn-secondary w-100" onClick={closeLoginPopup}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPopup;
