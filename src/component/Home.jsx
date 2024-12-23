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

    const handleUnlock = async () => {
        setIsUnlocked(true);
        await set(ref(database, 'competition/isUnlocked'), true); // Cập nhật vào Firebase ngay lập tức

        setFastestUser(null);
        setTime(null);
        setClickedUsers([]);
        setShowPopup(false);
        setShowButton(false); // Ẩn nút ngay từ đầu

        const positions = [
            "left", "right", "top", "center", "bottom", "middle"   // index 3: "center"
        ];

        const positions1 = [
            "middle", "bottom", "left", "top", "right", "center"
        ];

        const positions2 = [
            "top", "left", "center", "right", "middle", "bottom"
        ];

        const positions3 = [
            "right", "top", "middle", "bottom", "center", "left"
        ];

        const positions4 = [
            "left", "bottom", "center", "middle", "right", "top"
        ];

        const positions5 = [
            "middle", "top", "right", "left", "bottom", "center"
        ];

        const positions6 = [
            "top", "middle", "right", "center", "left", "bottom"
        ];

        const positions7 = [
            "bottom", "left", "top", "middle", "center", "right"
        ];

        const positions8 = [
            "middle", "right", "top", "bottom", "left", "center"
        ];


        // Trạng thái để lưu trữ vị trí đã chọn trước đó
        let lastSelectedPositions = localStorage.getItem('lastSelectedPositions') || 'positions';

        // Hàm để lấy positions tiếp theo
        const getNextPositions = () => {
            if (lastSelectedPositions === 'positions') {
                lastSelectedPositions = 'positions1';
                localStorage.setItem('lastSelectedPositions', lastSelectedPositions);
                return positions1;
            } else if (lastSelectedPositions === 'positions1') {
                lastSelectedPositions = 'positions2';
                localStorage.setItem('lastSelectedPositions', lastSelectedPositions);
                return positions2;
            } else if (lastSelectedPositions === 'positions2') {
                lastSelectedPositions = 'positions3';
                localStorage.setItem('lastSelectedPositions', lastSelectedPositions);
                return positions3;
            } else if (lastSelectedPositions === 'positions3') {
                lastSelectedPositions = 'positions4';
                localStorage.setItem('lastSelectedPositions', lastSelectedPositions);
                return positions4;
            } else if (lastSelectedPositions === 'positions4') {
                lastSelectedPositions = 'positions5';
                localStorage.setItem('lastSelectedPositions', lastSelectedPositions);
                return positions5;
            } else if (lastSelectedPositions === 'positions5') {
                lastSelectedPositions = 'positions6';
                localStorage.setItem('lastSelectedPositions', lastSelectedPositions);
                return positions6;
            } else if (lastSelectedPositions === 'positions6') {
                lastSelectedPositions = 'positions7';
                localStorage.setItem('lastSelectedPositions', lastSelectedPositions);
                return positions7;
            } else if (lastSelectedPositions === 'positions7') {
                lastSelectedPositions = 'positions8';
                localStorage.setItem('lastSelectedPositions', lastSelectedPositions);
                return positions8;
            } else {
                lastSelectedPositions = 'positions';
                localStorage.setItem('lastSelectedPositions', lastSelectedPositions);
                return positions;
            }
        };

        // Lấy positions tiếp theo
        const selectedPositions = getNextPositions();

        // Thực hiện vòng lặp for mà không cần xáo trộn
        for (let i = 0; i < selectedPositions.length; i++) {
            setButtonPosition(selectedPositions[i]);
            await set(ref(database, 'competition/buttonPosition'), selectedPositions[i]); // Lưu vào Firebase mỗi lần
            await new Promise(resolve => setTimeout(resolve, 25)); // Chờ 25ms giữa các lần thay đổi vị trí
        }

        // Sau khi dịch chuyển xong, cập nhật vào Firebase để hiện nút
        await set(ref(database, 'competition/showButton'), true); // Cập nhật vào Firebase
        setShowButton(true); // Hiện nút cho người dùng
    };










    const handleUserClick = async () => {
        const currentUserName = userName;
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
                const userClickData = {
                    userName: currentUserName,
                    time: currentTime,
                };

                const newClickRef = ref(database, 'competition/players/' + currentUserName);
                await set(newClickRef, userClickData);

                setShowPopup(true);
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
                {/* <img src={`${process.env.PUBLIC_URL}/logo1.png`} alt="Logo" className="logo mb-4" /> */}
                <h1 className="dkt-title">ĐỐ KINH THÁNH</h1>
                <h1 className="custom-title">Chủ đề: MÀN CUỐI</h1>

            </div>

            {!user || !user.email ? (
                <div className="position-absolute top-0 end-0 p-3">
                    <button
                        className="btn btn-primary btn-login-home"
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
                        className="btn btn-light dropdown-toggle btn-hello-home"
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
