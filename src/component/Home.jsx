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
        setFastestUser(null);
        setTime(null);
        setClickedUsers([]);
        setShowPopup(false);

        const positions = ["left", "center", "right", "top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right", "left", "center", "right", "top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];
        let currentIndex = 0;

        // Hiển thị từng vị trí theo thứ tự: left -> center -> right
        const showPositionsInOrder = async () => {
            for (let i = 0; i < positions.length; i++) {
                setButtonPosition(positions[i]);
                await new Promise(resolve => setTimeout(resolve, 50)); // Chờ 1 giây giữa các lần thay đổi vị trí
            }

            // Sau khi hiển thị xong, chọn ngẫu nhiên 1 vị trí
            const randomPosition = positions[Math.floor(Math.random() * positions.length)];
            setButtonPosition(randomPosition);

            try {
                await set(ref(database, 'competition/isUnlocked'), true);
                await set(ref(database, 'competition/buttonPosition'), randomPosition);
            } catch (error) {
                console.error('Error updating database:', error);
            }
        };

        showPositionsInOrder();
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
                <img src={`${process.env.PUBLIC_URL}/logo1.png`} alt="Logo" className="logo mb-4" />
                <h1 className="custom-title">Thi Đua Phát Biểu</h1>

            </div>

            {!user || !user.email ? (
                <div className="position-absolute top-0 end-0 p-3">
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
                    <button className="btn btn-success" onClick={handleUserClick}>
                        Bấm vào đây!
                    </button>
                </div>
            </div>

        </div>
    );
}

export default Home;
