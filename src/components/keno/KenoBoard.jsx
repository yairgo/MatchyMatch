import React, { useState, useEffect } from 'react';

const KenoBoard = () => {
  const [numbers, setNumbers] = useState(Array(80).fill(null).map((_, i) => i + 1));
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [drawnNumbers, setDrawnNumbers] = useState([]);

  useEffect(() => {
    const drawNumbers = () => {
      const newDrawnNumbers = new Set(drawnNumbers);
      while (newDrawnNumbers.size < 20) {
        const randomNumber = Math.floor(Math.random() * 80) + 1;
        if (!newDrawnNumbers.has(randomNumber)) {
          newDrawnNumbers.add(randomNumber);
        }
      }
      setDrawnNumbers(Array.from(newDrawnNumbers));
    };
    drawNumbers();
  }, [drawnNumbers]);

  const handleNumberClick = (number) => {
    setSelectedNumbers((prevSelectedNumbers) => {
      if (prevSelectedNumbers.includes(number)) {
        return prevSelectedNumbers.filter((n) => n!== number);
      } else {
        return [...prevSelectedNumbers, number];
      }
    });
  };

  return (
    <div>
      <h1>Keno Board</h1>
      <div>
        {numbers.map((number) => (
          <button
            key={number}
            onClick={() => handleNumberClick(number)}
            style={
              {
                backgroundColor: selectedNumbers.includes(number)? 'lightblue' : 'white',
                border: '1px solid black',
                padding: '10px',
                margin: '5px',
                cursor: 'pointer',
              }
            }
          >
            {number}
          </button>
        ))}
      </div>
      <div>
        <h2>Drawn Numbers: {drawnNumbers.join(', ')}</h2>
      </div>
    </div>
  );
}

export default KenoBoard;
