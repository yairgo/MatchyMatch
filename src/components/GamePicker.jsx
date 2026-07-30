import React from 'react';
import BarrysBlitz from './BarrysBlitz';
import ColourClash from './colourclash/ColourClashBoard';
import CatMatch from './catmatch/CatMatchBoard';
import Chess from './chess/ChessBoard';
import ColourClashBoard from './colourclash/ColourClashBoard';
import Crossword from './crossword/CrosswordBoard';
import DiceRoll from './diceroll/DiceRollBoard';
import FlipFlop from './flipflop/FlipFlopBoard';
import Game2048 from './game2048/Game2048Board';
import GregsEgg from './gregsEgg/GregsEggBoard';
import Hangman from './hangman/HangmanBoard';
import Kenny from './kenny/KennyBoard';
import Keno from './keno/KenoBoard';
import MathQuiz from './mathquiz/MathQuizBoard';
import Memory from './memory/MemoryBoard';
import Minesweeper from './minesweeper/MinesweeperBoard';
import NathanielNinja from './nathanielninja/NathanielNinjaBoard';
import NickOfTTime from './nickofttime/NickOfTTimeBoard';
import NumberCrunch from './numbercrunch/NumberCrunchBoard';
import PuppyFetch from './puppyfetch/PuppyFetchBoard';
import Samiam from './samiam/SamIAmBoard';
import Scramble from './scramble/ScrambleBoard';
import Snake from './snake/SnakeBoard';
import SpellingBee from './spellingbee/SpellingBeeBoard';
import Sudoku from './sudoku/SudokuBoard';
import TicTacToe from './tictactoe/TicTacToeBoard';
import Trivia from './trivia/TriviaBoard';
import TypeRace from './typerace/TypeRaceBoard';
import WordChain from './wordchain/WordChainBoard';
import Wordle from './wordle/WordleBoard';
import WordSearch from './wordsearch/WordSearchBoard';

const GamePicker = () => {
  return (
    <div>
      <BarrysBlitz />
      <ColourClash />
      <CatMatch />
      <Chess />
      <ColourClashBoard />
      <Crossword />
      <DiceRoll />
      <FlipFlop />
      <Game2048 />
      <GregsEgg />
      <Hangman />
      <Kenny />
      <Keno />
      <MathQuiz />
      <Memory />
      <Minesweeper />
      <NathanielNinja />
      <NickOfTTime />
      <NumberCrunch />
      <PuppyFetch />
      <Samiam />
      <Scramble />
      <Snake />
      <SpellingBee />
      <Sudoku />
      <TicTacToe />
      <Trivia />
      <TypeRace />
      <WordChain />
      <Wordle />
      <WordSearch />
    </div>
  );
};

export default GamePicker;

