// src/components/WriteData.jsx
import React, { useState } from 'react';
import { ref, set } from 'firebase/database';
import { database } from '../firebase';  // Import database từ firebase.js

const WriteData = () => {
    const [input, setInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataRef = ref(database, 'fastGroup'); // Đường dẫn đến dữ liệu
        set(dataRef, {
            value: input,
        }).then(() => {
            alert('Data saved successfully!');
        }).catch((error) => {
            console.error('Error saving data: ', error);
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter data"
            />
            <button type="submit">Save Data</button>
        </form>
    );
};

export default WriteData;
