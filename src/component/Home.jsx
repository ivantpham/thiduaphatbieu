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
    const totalUsers = 1;

    const [userName, setUserName] = useState('');
    const [resetButton, setResetButton] = useState(false);

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
                    // Xóa dữ liệu trong competition/players khi nút reset được bấm
                    remove(ref(database, 'competition/players'))
                        .then(() => {
                            console.log("Competition players have been successfully removed.");
                            // Sau khi xóa xong, có thể làm mới trang nếu cần
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
            }
        });

        return () => unsubscribe();
    }, []);

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

        try {
            await set(ref(database, 'competition/isUnlocked'), true);
        } catch (error) {
            console.error('Error updating database:', error);
        }
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
        console.log("Resetting competition data..."); // Thêm dòng log ở đây
        setIsUnlocked(false);
        setFastestUser(null);
        setTime(null);
        setClickedUsers([]);
        setDisqualifiedUsers([]);
        setShowPopup(false);

        try {
            await set(ref(database, 'competition/isUnlocked'), false);
            await set(ref(database, 'competition/resetButton'), true);
            await remove(ref(database, 'competition/players'));
            console.log("Competition players have been successfully removed.");
        } catch (error) {
            console.error('Error updating database:', error);
        }
    };






    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setShowDropdown(false);
            localStorage.removeItem('userName');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    return (
        <div className="App">
            <div className="header">
                <img src={`${process.env.PUBLIC_URL}/logo1.png`} alt="Logo" className="logo mb-4" />
                <h1>Thi Đua Phát Biểu</h1>
            </div>

            {user && user.email === 'admin@btnntp.com' && (
                <div className="moderator-section">
                    <div className="button-container">
                        <button onClick={handleUnlock} className="unlock-button btn btn-primary">
                            {isUnlocked ? "Đã mở khóa!" : "Mở khóa cho người chơi"}
                        </button>
                        <button onClick={resetCompetition} className="reset-button btn btn-warning">
                            Reset Cuộc Thi
                        </button>
                    </div>

                </div>
            )}

            {user && (
                <div className="user-greeting position-absolute top-0 end-0 p-3">
                    <button
                        className="btn btn-link dropdown-toggle"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        Xin chào, {userName}
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

            {!showPopup && user && user.email !== 'admin@btnntp.com' && user.email !== 'kythuat@btnntp.com' && (
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
                        {clickedUsers.includes(user.email) ? "Bạn đã bấm!" : "Bấm nhanh!"}
                    </button>
                </div>
            )}


            {/* Popup thông báo khi có người dùng bấm */}
            {showPopup && (
                <div className="popup">
                    <h2>Chúc mừng!</h2>
                    <div className="fastest-user-container">
                        <span className="fastest-user">{fastestUser}</span>
                        <div className="fastest-user-message">là Nhóm bấm nhanh nhất</div>
                        <div className="time-message">{formatTime(time)}</div>
                    </div>
                    {secondFastestUser && (
                        <div className="second-fastest-user-container">
                            <span className="second-fastest-user">{secondFastestUser}</span>
                            <div className="second-fastest-user-message">là Nhóm nhanh thứ nhì</div>
                            <div className="time-message">{formatTime(secondFastestTime)}</div>
                        </div>
                    )}
                    {thirdFastestUser && (
                        <div className="third-fastest-user-container">
                            <span className="third-fastest-user">{thirdFastestUser}</span>
                            <div className="third-fastest-user-message">là Nhóm nhanh thứ ba</div>
                            <div className="time-message">{formatTime(thirdFastestTime)}</div>
                        </div>
                    )}
                    <button onClick={() => setShowPopup(false)} className="btn btn-secondary">
                        Đóng
                    </button>
                </div>
            )}

            {!user && <Login />}

            {showChangeNamePopup && (
                <ChangeName onClose={() => setShowChangeNamePopup(false)} />
            )}
        </div>
    );
}

export default Home;
