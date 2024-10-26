import React, { useState, useEffect } from "react";
import "../style/Home.css";
import Login from "./Login";
import ChangeName from "./ChangeName";
import { useUser } from "../context/UserContext";
import 'bootstrap/dist/css/bootstrap.min.css';
import { signOut } from 'firebase/auth';
import { auth, database } from '../firebase';
import { ref, set, onValue, remove } from "firebase/database";

function Home() {
    const { user, setUser } = useUser();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [fastestUser, setFastestUser] = useState(null);
    const [secondFastestUser, setSecondFastestUser] = useState(null);
    const [secondFastestTime, setSecondFastestTime] = useState(null);
    const [thirdFastestUser, setThirdFastestUser] = useState(null);
    const [thirdFastestTime, setThirdFastestTime] = useState(null);
    const [time, setTime] = useState(null);
    const [clickedUsers, setClickedUsers] = useState([]);
    const [disqualifiedUsers, setDisqualifiedUsers] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showChangeNamePopup, setShowChangeNamePopup] = useState(false);
    const [buttonPosition, setButtonPosition] = useState("center"); // State for button position
    const [resetButton, setResetButton] = useState(false);
    const totalUsers = 1;
    const [userName, setUserName] = useState('');
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [showButton, setShowButton] = useState(false);


    const formatTime = (timeInMs) => {
        if (timeInMs === null) return "0ms";
        const milliseconds = timeInMs % 1000;
        const seconds = Math.floor((timeInMs / 1000) % 60);
        const minutes = Math.floor((timeInMs / (1000 * 60)) % 60);

        return `${minutes} phút, ${seconds} giây, ${milliseconds} ms`;
    };

    useEffect(() => {
        if (user && user.email) {
            const storedUserName = localStorage.getItem('userName');
            if (storedUserName) {
                setUserName(storedUserName);
            } else {
                setUserName(user.email);
            }
        }
    }, [user]);

    useEffect(() => {
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
                if (data === true) {
                    remove(ref(database, 'competition/players'))
                        .then(() => {
                            console.log("Competition players have been successfully removed.");
                            window.location.reload();
                        })
                        .catch((error) => {
                            console.error("Error removing competition players: ", error);
                        });
                }
            }
        });

        return () => {
            unsubscribeUnlock();
            unsubscribeResetButton();
        };
    }, []);


    useEffect(() => {
        const showButtonRef = ref(database, 'competition/showButton');

        const unsubscribeShowButton = onValue(showButtonRef, (snapshot) => {
            const value = snapshot.val();
            if (value !== null) {
                setShowButton(value); // Cập nhật trạng thái showButton từ Firebase
            }
        });

        return () => unsubscribeShowButton();
    }, []);





    useEffect(() => {
        const fastestUserRef = ref(database, 'competition/fastestUser');

        const unsubscribe = onValue(fastestUserRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setFastestUser(data.fastestUser);
                setTime(data.time);

                if (user && user.email === 'kythuat@btnntp.com') {
                    setShowPopup(true);
                }
            }
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        const playersRef = ref(database, 'competition/players');

        const unsubscribe = onValue(playersRef, (snapshot) => {
            const playersData = snapshot.val();
            if (playersData) {
                const sortedPlayers = Object.values(playersData).sort((a, b) => a.time - b.time);
                if (sortedPlayers.length > 0) {
                    setFastestUser(sortedPlayers[0]?.userName);
                    setTime(sortedPlayers[0]?.time);
                }
                if (sortedPlayers.length > 1) {
                    setSecondFastestUser(sortedPlayers[1]?.userName);
                    setSecondFastestTime(sortedPlayers[1]?.time);
                }
                if (sortedPlayers.length > 2) {
                    setThirdFastestUser(sortedPlayers[2]?.userName);
                    setThirdFastestTime(sortedPlayers[2]?.time);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const resetCompetitionValues = async () => {
            try {
                await set(ref(database, 'competition/resetButton'), false);
                await set(ref(database, 'competition/fastestUser'), {
                    fastestUser: "",
                    time: null,
                });
            } catch (error) {
                console.error('Error resetting competition values:', error);
            }
        };

        resetCompetitionValues();
    }, []);

    useEffect(() => {
        const showButtonRef = ref(database, 'competition/showButton');

        const unsubscribeShowButton = onValue(showButtonRef, (snapshot) => {
            const value = snapshot.val();
            if (value !== null) {
                setShowButton(value); // Cập nhật trạng thái showButton từ Firebase
            }
        });

        return () => unsubscribeShowButton();
    }, []);

    const handleUnlock = async () => {
        setIsUnlocked(true); // Đặt trạng thái là đã mở khóa
        await set(ref(database, 'competition/isUnlocked'), true); // Cập nhật vào Firebase ngay lập tức

        // Reset trạng thái liên quan đến cuộc thi
        setFastestUser(null);
        setTime(null);
        setClickedUsers([]);
        setShowPopup(false);

        // Ẩn nút "Bấm" ngay khi mở khóa
        await set(ref(database, 'competition/showButton'), false); // Ẩn nút ngay từ đầu
        setShowButton(false); // Cập nhật trạng thái button trên client

        const basePositions = [
            "left", "center", "right",
            "top-left", "top-center", "top-right",
            "bottom-left", "bottom-center", "bottom-right"
        ];

        // Hàm xáo trộn mảng
        const shuffleArray = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]]; // Hoán đổi phần tử
            }
            return array;
        };

        // Xáo trộn basePositions
        const shuffledBasePositions = shuffleArray([...basePositions]);

        // Tạo mảng 27 phần tử từ mảng đã xáo trộn
        const positions = Array(1).fill(shuffledBasePositions).flat();

        // Hiển thị từng vị trí và truyền vào Firebase
        for (let i = 0; i < positions.length; i++) {
            const position = positions[i];

            setButtonPosition(position); // Cập nhật vị trí button
            await set(ref(database, 'competition/buttonPosition'), position); // Lưu vào Firebase mỗi lần

            await new Promise(resolve => setTimeout(resolve, 200)); // Chờ 200ms giữa các lần thay đổi vị trí
        }

        // Sau khi dịch chuyển xong, cập nhật vào Firebase để hiện nút
        await set(ref(database, 'competition/showButton'), true); // Cập nhật vào Firebase để hiển thị lại nút
        setShowButton(true); // Hiện nút cho người dùng
    };










    const handleUserClick = async () => {
        // Kiểm tra xem button có được hiển thị không
        if (!showButton) return; // Nếu nút không hiển thị, không làm gì cả

        // Đặt người dùng đã nhấn và thời gian hiện tại
        const currentUser = user.email; // Giả sử bạn đang sử dụng email làm ID người dùng
        const currentTime = new Date().toISOString(); // Lấy thời gian hiện tại dưới dạng chuỗi ISO

        // Thêm người dùng vào danh sách đã nhấn
        if (!clickedUsers.includes(currentUser)) {
            setClickedUsers(prev => [...prev, currentUser]); // Cập nhật danh sách người dùng đã nhấn
            await set(ref(database, 'competition/clickedUsers'), [...clickedUsers, currentUser]); // Lưu vào Firebase
        }

        // Cập nhật trạng thái fastestUser nếu đây là nhấn đầu tiên
        if (!fastestUser) {
            setFastestUser(currentUser); // Đặt fastestUser là người nhấn đầu tiên
            await set(ref(database, 'competition/fastestUser'), currentUser); // Cập nhật vào Firebase
            setTime(currentTime); // Lưu thời gian hiện tại
            await set(ref(database, 'competition/time'), currentTime); // Cập nhật thời gian vào Firebase
        }
    };


    const resetCompetition = async () => {
        console.log("Resetting competition data...");
        setIsUnlocked(false);
        setFastestUser(null);
        setTime(null);
        setClickedUsers([]);
        setDisqualifiedUsers([]);
        setShowPopup(false);

        const positions = ["left", "center", "right"];
        const randomPosition = positions[Math.floor(Math.random() * positions.length)];

        try {
            await set(ref(database, 'competition/isUnlocked'), false);
            await set(ref(database, 'competition/resetButton'), true);
            await set(ref(database, 'competition/buttonPosition'), randomPosition); // Update button position
            await remove(ref(database, 'competition/players'));
            console.log("Competition players have been successfully removed.");
        } catch (error) {
            console.error('Error updating database:', error);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUser(null);  // Đảm bảo cập nhật lại user là null sau khi đăng xuất
            setShowDropdown(false);
            setShowPopup(false);  // Đóng popup sau khi đăng xuất
            localStorage.removeItem('userName');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    useEffect(() => {
        const buttonPositionRef = ref(database, 'competition/buttonPosition');

        const unsubscribePosition = onValue(buttonPositionRef, (snapshot) => {
            const position = snapshot.val();
            if (position) {
                setButtonPosition(position); // Update button position from Firebase
            }
        });

        return () => unsubscribePosition();
    }, []);

    return (
        <div className="App">
            <div className="header">
                <img src={`${process.env.PUBLIC_URL}/logo1.png`} alt="Logo" className="logo mb-4" />
                <h1 className="custom-title">Thi Đua Phát Biểu</h1>

            </div>

            {!user || !user.email ? (
                <div className="position-absolute-login top-0 end-0 p-3">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowLoginPopup(true)} // Mở popup khi nhấn vào
                    >
                        Đăng Nhập
                    </button>

                    {showLoginPopup && (
                        <Login setShowLoginPopup={setShowLoginPopup} /> // Hiển thị LoginPopup khi showLoginPopup là true
                    )}
                </div>
            ) : (
                <div className="user-greeting position-absolute top-0 end-0 p-3">
                    <button
                        className="btn btn-light dropdown-toggle"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        Chào, {userName}
                    </button>

                    {showDropdown && (
                        <div className="dropdown-menu show">
                            <button className="dropdown-item" onClick={() => setShowChangeNamePopup(true)}>
                                Đổi tên
                            </button>
                            <button className="dropdown-item" onClick={handleSignOut}>
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showChangeNamePopup && <ChangeName onClose={() => setShowChangeNamePopup(false)} />}

            <div className={`content ${isUnlocked ? 'unlocked' : ''}`}>
                {user && user.email === 'admin@btnntp.com' && (
                    <>
                        {!isUnlocked ? (
                            <button className="btn btn-primary" onClick={handleUnlock}>Mở khóa</button>
                        ) : (
                            <button className="btn btn-danger" onClick={resetCompetition}>Reset</button>
                        )}
                    </>
                )}

                {fastestUser ? (
                    <div>
                        <div className="fastest-user">
                            {fastestUser}
                        </div>
                        <p>Thời gian: {formatTime(time)}</p>
                    </div>
                ) : (
                    <p>Chưa có người chiến thắng</p>
                )}
                <div className={`button-container position-absolute ${buttonPosition}`}>
                    {showButton && (
                        <button className="btn btn-success" onClick={handleUserClick}>
                            Bấm!
                        </button>
                    )}
                </div>


            </div>

        </div>
    );
}

export default Home;
