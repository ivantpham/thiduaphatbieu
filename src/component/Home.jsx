import React, { useState, useEffect } from "react";
import "../style/Home.css";
import Login from "./Login"; // Import component Login
import ChangeName from "./ChangeName"; // Import ChangeName component
import { useUser } from "../context/UserContext"; // Import useUser để lấy thông tin người dùng
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import { signOut } from 'firebase/auth'; // Import signOut từ Firebase
import { auth, database } from '../firebase'; // Đảm bảo đường dẫn đúng đến file firebase.js
import { ref, set, onValue } from "firebase/database"; // Firebase Database functions

function Home() {
    const { user, setUser } = useUser(); // Lấy thông tin người dùng từ context
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [fastestUser, setFastestUser] = useState(null);
    const [time, setTime] = useState(null);
    const [clickedUsers, setClickedUsers] = useState([]);
    const [disqualifiedUsers, setDisqualifiedUsers] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false); // State để quản lý hiển thị dropdown
    const [showChangeNamePopup, setShowChangeNamePopup] = useState(false); // State để hiển thị ChangeName popup
    const totalUsers = 1; // Đổi số lượng người dùng thành 1

    const [userName, setUserName] = useState(''); // Thêm state cho userName
    const [resetButton, setResetButton] = useState(false); // State để lưu giá trị của resetButton

    useEffect(() => {
        // Kiểm tra user.email tồn tại và localStorage có giá trị userName không
        if (user && user.email) {
            const storedUserName = localStorage.getItem('userName');
            if (storedUserName) {
                setUserName(storedUserName);
            } else {
                setUserName(user.email); // Nếu không có userName trong localStorage, sử dụng email
            }
        }
    }, [user]);

    useEffect(() => {
        // Lắng nghe trạng thái mở khóa từ Realtime Database
        const unlockStatusRef = ref(database, 'competition/isUnlocked');
        const resetButtonRef = ref(database, 'competition/resetButton');

        const unsubscribeUnlock = onValue(unlockStatusRef, (snapshot) => {
            const data = snapshot.val();
            setIsUnlocked(data);
        });

        const unsubscribeResetButton = onValue(resetButtonRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setResetButton(data);
                // Tải lại trang nếu resetButton là true
                if (data === true) {
                    window.location.reload(); // Tải lại trang
                }
            }
        });

        return () => {
            unsubscribeUnlock();
            unsubscribeResetButton();
        };
    }, []);

    useEffect(() => {
        // Lắng nghe fastestUser từ Realtime Database
        const fastestUserRef = ref(database, 'competition/fastestUser');

        const unsubscribe = onValue(fastestUserRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setFastestUser(data.fastestUser);
                setTime(data.time);
            }
        });

        return () => unsubscribe();
    }, []);

    // Thêm useEffect để cập nhật giá trị khi trang tải lại
    useEffect(() => {
        const resetCompetitionValues = async () => {
            try {
                // Đặt giá trị cho competition/resetButton là false và competition/fastestUser là rỗng
                await set(ref(database, 'competition/resetButton'), false);
                await set(ref(database, 'competition/fastestUser'), {
                    fastestUser: "", // Gán giá trị rỗng
                    time: null, // Gán thời gian là null
                });
            } catch (error) {
                console.error('Error resetting competition values:', error);
            }
        };

        resetCompetitionValues();
    }, []); // Chạy chỉ một lần khi component được mount

    const handleUnlock = async () => {
        setIsUnlocked(true);
        setFastestUser(null);
        setTime(null);
        setClickedUsers([]);
        setShowPopup(false);

        try {
            // Cập nhật trạng thái mở khóa vào Realtime Database
            await set(ref(database, 'competition/isUnlocked'), true);
        } catch (error) {
            console.error('Error updating database:', error);
        }
    };

    const handleUserClick = async () => {
        const currentUserName = userName; // Sử dụng userName đã lấy từ state
        if (disqualifiedUsers.includes(currentUserName)) {
            alert(`${currentUserName} đã bị loại và không thể tham gia.`);
            return;
        }

        if (!isUnlocked) {
            alert(`${currentUserName} đã bấm trước khi mở khóa và bị loại!`);
            setDisqualifiedUsers((prevDisqualified) => [...prevDisqualified, currentUserName]);
        } else if (isUnlocked && !fastestUser) {
            const currentTime = new Date().getTime();
            setFastestUser(currentUserName);
            setTime(currentTime);

            try {
                // Cập nhật fastestUser và thời gian vào Realtime Database
                await set(ref(database, 'competition/fastestUser'), {
                    fastestUser: currentUserName,
                    time: currentTime,
                });
            } catch (error) {
                console.error('Error updating database:', error);
            }
        }

        setClickedUsers((prevUsers) => {
            const updatedUsers = [...prevUsers, currentUserName];
            if (updatedUsers.length === totalUsers) {
                setShowPopup(true);
            }
            return updatedUsers;
        });
    };

    const resetCompetition = async () => {
        setIsUnlocked(false);
        setFastestUser(null);
        setTime(null);
        setClickedUsers([]);
        setDisqualifiedUsers([]);
        setShowPopup(false);

        try {
            // Cập nhật trạng thái mở khóa và resetButton vào Realtime Database
            await set(ref(database, 'competition/isUnlocked'), false);
            await set(ref(database, 'competition/resetButton'), true); // Đặt resetButton là true
        } catch (error) {
            console.error('Error updating database:', error);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth); // Gọi hàm signOut từ Firebase
            setUser(null); // Đặt người dùng về null
            setShowDropdown(false); // Đóng dropdown
            localStorage.removeItem('userName'); // Xóa userName khỏi localStorage
        } catch (error) {
            console.error("Error signing out: ", error); // Xử lý lỗi nếu có
        }
    };

    return (
        <div className="App">
            {/* Header containing logo and title */}
            <div className="header">
                <img src={`${process.env.PUBLIC_URL}/logo1.png`} alt="Logo" className="logo mb-4" />
                <h1>Thi Đua Phát Biểu</h1>
            </div>

            {/* Kiểm tra xem người dùng có phải là admin không */}
            {user && user.email === 'admin@btnntp.com' && (
                <div className="moderator-section">
                    <button onClick={handleUnlock} className="unlock-button btn btn-primary">
                        {isUnlocked ? "Đã mở khóa!" : "Mở khóa cho người chơi"}
                    </button>
                    <button onClick={resetCompetition} className="reset-button btn btn-warning">
                        Reset Cuộc Thi
                    </button>
                </div>
            )}

            {/* Hiển thị tên người dùng ở góc phải nếu có người dùng */}
            {user && (
                <div className="user-greeting position-absolute top-0 end-0 p-3">
                    <button
                        className="btn btn-link dropdown-toggle"
                        onClick={() => setShowDropdown(!showDropdown)} // Chuyển đổi trạng thái dropdown
                    >
                        Xin chào, {userName} {/* Hiển thị userName từ state */}
                    </button>
                    {showDropdown && (
                        <div className="dropdown-menu show" style={{ position: 'absolute', right: '0', zIndex: 1000 }}>
                            <button className="dropdown-item" onClick={() => setShowChangeNamePopup(true)}>
                                Thay đổi thông tin
                            </button>
                            <button className="dropdown-item" onClick={handleSignOut}>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Chỉ hiển thị button cho người dùng nếu không bị loại */}
            {!showPopup && user && !disqualifiedUsers.includes(user.email) && (
                <div className="user-button-container">
                    <button
                        onClick={() => {
                            if (!isUnlocked) {
                                alert(`${userName} đã bấm trước khi mở khóa và bị loại!`);
                                setDisqualifiedUsers((prevDisqualified) => [...prevDisqualified, user.email]);
                            } else {
                                handleUserClick();
                            }
                        }}
                        className={`btn user-button ${clickedUsers.includes(user.email) ? "btn-success" : "btn-primary"} ${disqualifiedUsers.includes(user.email) ? "btn-danger" : ""}`}
                    >
                        {clickedUsers.includes(user.email) ? "Bạn đã bấm!" : "Bấm để tham gia!"}
                    </button>
                </div>
            )}

            {/* Popup thông báo khi có người dùng bấm */}
            {showPopup && (
                <div className="popup">
                    <h2>Chúc mừng!</h2>
                    <p>{fastestUser} là người bấm nhanh nhất với thời gian: {time} ms.</p>
                    <button onClick={() => setShowPopup(false)} className="btn btn-secondary">
                        Đóng
                    </button>
                </div>
            )}

            {/* Hiển thị popup thay đổi tên */}
            {showChangeNamePopup && (
                <ChangeName
                    setShowChangeNamePopup={setShowChangeNamePopup}
                    userEmail={user.email}
                    setUserName={setUserName} // Truyền hàm setUserName để cập nhật state
                />
            )}

            {/* Hiển thị popup đăng nhập nếu chưa đăng nhập */}
            {!user && <Login />}
        </div>
    );
}

export default Home;
