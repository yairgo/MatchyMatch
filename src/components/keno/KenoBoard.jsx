import React from 'react';
import { useState } from 'react';
import { shuffle } from '../utils/gameHelpers';
import kenoNumbers from '../data/kenoNumbers';

const KenoBoard = () => {
  const [numbers, setNumbers] = useState(shuffle(kenoNumbers).slice(0, 20));
  const [selectedNumbers, setSelectedNumbers] = useState([]);

  const handleNumberClick = (number) => {
    setSelectedNumbers((prev) => [...prev, number]);
  };

  return (
    <div>
      <h1>Keno</h1>
      <div>
        {numbers.map((number) => (
          <button
            key={number}
            onClick={() => handleNumberClick(number)}
            style={
              {
                backgroundColor: selectedNumbers.includes(number)? 'green' : 'white',
                color: selectedNumbers.includes(number)? 'white' : 'black',
              }
            }
         >
          {number}
        </button>
        ))}
      </div>
    </div>
  );
};

export default KenoBoard;

