...
 : activeGame === 'keno'? (
    <KenoBoard key={`keno-${gameKey}`} />
  ) : (
    <SudokuBoard key={`sudoku-${gameKey}`} />
  )
}
