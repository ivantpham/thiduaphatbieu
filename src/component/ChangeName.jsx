import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap
import '../style/ChangeName.css'; // Import CSS cho ChangeName
import { firestore, auth } from '../firebase'; // Đảm bảo import Firebase
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Thêm import cho Firestore

const ChangeName = ({ onClose }) => {
    const [nickname, setNickname] = useState('');

    const handleChange = (e) => {
        setNickname(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const user = auth.currentUser; // Lấy thông tin người dùng hiện tại
        if (user) {
            const userEmail = user.email; // Lấy email của người dùng
            const nicknameData = {
                nickname: nickname,
                email: userEmail
            };
            const userDocRef = doc(firestore, 'nicknames', user.uid); // Tham chiếu đến document của người dùng

            try {
                // Kiểm tra xem document đã tồn tại hay chưa
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    // Nếu document tồn tại, cập nhật nickname
                    await setDoc(userDocRef, nicknameData);
                    alert(`Nickname của bạn đã được cập nhật thành "${nickname}"!`);
                } else {
                    // Nếu document không tồn tại, tạo mới
                    await setDoc(userDocRef, nicknameData);
                    alert(`Nickname "${nickname}" đã được lưu!`);
                }

                // Lưu nickname vào localStorage
                localStorage.setItem('userName', nickname);
                setNickname(''); // Reset nickname after submission

                // Đóng bảng popup và tải lại trang
                onClose();
                window.location.reload(); // Tải lại trang
            } catch (error) {
                console.error("Error saving nickname: ", error);
                alert("Đã xảy ra lỗi khi lưu nickname.");
            }
        } else {
            alert("Bạn chưa đăng nhập!");
        }
    };

    return (
        <div className="popup-overlay">
            <div className="popup">
                <div className="text-center">
                    <h2>Đặt Nickname</h2>
                    <form onSubmit={handleSubmit} className="mt-4">
                        <div className="form-group">
                            <input
                                type="text"
                                value={nickname}
                                onChange={handleChange}
                                placeholder="Nhập nickname của bạn"
                                required
                                className="form-control"
                            />
                        </div>
                        <button type="submit" className="btn btn-success mt-3">
                            Lưu Nickname
                        </button>
                    </form>
                    <button onClick={onClose} className="btn btn-danger mt-3">Đóng</button>
                </div>
            </div>
        </div>
    );
};

export default ChangeName;
