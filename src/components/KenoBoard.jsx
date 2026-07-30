import React, { useState } from 'react';
import { Button, TextField } from '@mui/material';

const KenoBoard = () => {
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [drawnNumbers, setDrawnNumbers] = useState([]);

  const handleNumberClick = (number) => {
    setSelectedNumbers((prev) => [...prev, number]);
  };

  const handleDraw = () => {
    const newDrawnNumbers = Array.from({ length: 20 }, () => Math.floor(Math.random() * 80) + 1);
    setDrawnNumbers(newDrawnNumbers);
  };

  return (
    <div>
      <h1>Keno</h1>
      <div>
        {drawnNumbers.map((number) => (
          <span key={number}>{number}</span>
        ))}
      </div>
      <div>
        {Array.from({ length: 80 }, (_, i) => i + 1).map((number) => (
          <Button
            key={number}
            onClick={() => handleNumberClick(number)}
            disabled={selectedNumbers.includes(number)}
         >
            {number}
          </Button>
        ))}
      </div>
      <Button onClick={handleDraw}>Draw</Button>
    </div>
  );
}

export default KenoBoard;
