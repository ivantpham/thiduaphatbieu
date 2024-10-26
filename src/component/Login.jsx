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
    const [showPassword, setShowPassword] = useState(false); // State để kiểm soát hiển thị mật khẩu

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
            <div className="login-popup shadow-lg p-4 rounded">
                <h2 className="login-header text-center mb-4">Chào mừng Bạn!</h2>
                <p className="login-subtext text-center mb-3">Vui lòng đăng nhập để tiếp tục</p>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="form-control-login"
                            placeholder="Nhập email của bạn"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                console.log("Email nhập vào:", e.target.value); // Log email nhập vào
                            }}

                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Mật khẩu</label>
                        <input
                            type={showPassword ? "text" : "password"} // Kiểm soát kiểu nhập
                            id="password"
                            className="form-control-login"
                            placeholder="Nhập mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} // Đảm bảo cập nhật giá trị đúng
                            required
                        />
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="showPassword"
                                checked={showPassword}
                                onChange={() => setShowPassword(!showPassword)} // Đổi trạng thái hiển thị mật khẩu
                            />
                            <label className="form-check-label" htmlFor="showPassword">Hiển thị mật khẩu</label>
                        </div>
                    </div>
                    {errorMessage && (
                        <div className="alert alert-danger text-center mt-2">{errorMessage}</div> // Hiển thị thông báo lỗi
                    )}
                    <button type="submit" className="btn btn-primary w-100 mt-3">Đăng nhập</button>
                </form>
                <p className="contact-info text-center mt-3">
                    Nếu chưa có tài khoản, vui lòng liên hệ Ban Điều Hành
                </p>
                <button className="btn btn-secondary w-100 mt-2" onClick={closeLoginPopup}>
                    Đóng
                </button>
            </div>
        </div>
    );
}

export default LoginPopup;
