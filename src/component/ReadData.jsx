// src/components/ReadData.jsx
import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';  // Import database từ firebase.js

const ReadData = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const dataRef = ref(database, 'fastGroup'); // Đường dẫn đến dữ liệu trong database
        onValue(dataRef, (snapshot) => {
            const newData = snapshot.val();
            setData(newData);
        });
    }, []);

    return (
        <div>
            <h1>Data from Firebase:</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
};

export default ReadData;
