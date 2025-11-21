// Candy Spark - stable working version
const board = document.getElementById('board');
const scoreEl = document.getElementById('score');
const highEl = document.getElementById('highest');
const timeEl = document.getElementById('time');
const barEl = document.getElementById('bar');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');

const width = 6;
const total = width * width;
// brighter / contrasting candy colors
const colors = ['#FF2D55','#FFCC00','#00E5FF','#FF7A00','#7CFF6A','#C86CFF','#FF6B9A'];
let squares = [];
let score = 0;
let high = parseInt(localStorage.getItem('candyHighest')) || 0;
let timeLeft = 120;
let timerId = null;
let running = false;

highEl.textContent = high;

// create board immediately so UI shows grid
function createBoard() {
  board.innerHTML = '';
  squares = [];
  for (let i = 0; i < total; i++) {
    const cell = document.createElement('div');
    cell.classList.add('candy');
    cell.setAttribute('draggable', true);
    cell.id = i;
    cell.style.backgroundColor = randomColor();
    board.appendChild(cell);
    squares.push(cell);
  }
  enableDrag();
}
function randomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

// Drag & Drop
let dragged = null;
let replaced = null;

function enableDrag() {
  squares.forEach(sq => {
    sq.addEventListener('dragstart', dragStart);
    sq.addEventListener('dragover', e => e.preventDefault());
    sq.addEventListener('drop', dragDrop);
    sq.addEventListener('dragend', dragEnd);
  });
}
function dragStart(e) { dragged = this; }
function dragDrop(e) { replaced = this; }
function dragEnd(e) {
  if (!dragged || !replaced) return;
  const idDrag = parseInt(dragged.id);
  const idReplace = parseInt(replaced.id);
  const valid = [
    idDrag - 1, idDrag + 1, idDrag - width, idDrag + width
  ];
  // prevent wrapping across rows for horizontal moves
  const sameRowLeft = (idReplace === idDrag - 1) && Math.floor(idDrag/width) !== Math.floor(idReplace/width);
  const sameRowRight = (idReplace === idDrag + 1) && Math.floor(idDrag/width) !== Math.floor(idReplace/width);
  if (sameRowLeft || sameRowRight) {
    replaced = null; dragged = null;
    return;
  }

  if (valid.includes(idReplace)) {
    swapColors(dragged, replaced);
    // if swap generated matches -> resolve, otherwise revert after a tiny delay
    const matched = findAllMatches();
    if (matched.size > 0) {
      handleMatches(matched);
    } else {
      // no match: revert swap
      setTimeout(() => swapColors(dragged, replaced), 180);
    }
  }
  replaced = null; dragged = null;
}

// swap helper
function swapColors(a, b) {
  const tmp = a.style.backgroundColor;
  a.style.backgroundColor = b.style.backgroundColor;
  b.style.backgroundColor = tmp;
}

// find matches (returns Set of indices)
function findAllMatches() {
  const matched = new Set();

  // horizontal runs
  for (let r = 0; r < width; r++) {
    let c = 0;
    while (c < width) {
      const idx = r * width + c;
      const color = squares[idx].style.backgroundColor;
      if (!color) { c++; continue; }
      let run = 1;
      while (c + run < width && squares[r * width + c + run].style.backgroundColor === color) run++;
      if (run >= 3) {
        for (let k = 0; k < run; k++) matched.add(r * width + c + k);
      }
      c += run;
    }
  }

  // vertical runs
  for (let c = 0; c < width; c++) {
    let r = 0;
    while (r < width) {
      const idx = r * width + c;
      const color = squares[idx].style.backgroundColor;
      if (!color) { r++; continue; }
      let run = 1;
      while (r + run < width && squares[(r + run) * width + c].style.backgroundColor === color) run++;
      if (run >= 3) {
        for (let k = 0; k < run; k++) matched.add((r + k) * width + c);
      }
      r += run;
    }
  }

  return matched;
}

// remove matches & score
function handleMatches(matchedSet) {
  if (matchedSet.size === 0) return;
  // clear matched squares (set empty string)
  matchedSet.forEach(idx => {
    squares[idx].style.backgroundColor = '';
    squares[idx].style.opacity = '0.0';
  });

  // score points (10 per candy)
  score += matchedSet.size * 10;
  scoreEl.textContent = score;

  // after short delay collapse & refill
  setTimeout(() => {
    matchedSet.forEach(idx => {
      squares[idx].style.opacity = '';
    });
    collapseAndRefill();
  }, 180);
}

// collapse columns and refill
function collapseAndRefill() {
  for (let c = 0; c < width; c++) {
    // start from bottom
    for (let r = width - 1; r >= 0; r--) {
      const idx = r * width + c;
      if (!squares[idx].style.backgroundColor) {
        // find first non-empty above
        let k = r - 1;
        while (k >= 0 && !squares[k * width + c].style.backgroundColor) k--;
        if (k >= 0) {
          // move color down
          squares[idx].style.backgroundColor = squares[k * width + c].style.backgroundColor;
          squares[k * width + c].style.backgroundColor = '';
        } else {
          // nothing above, fill with random color
          squares[idx].style.backgroundColor = randomColor();
        }
      }
    }
  }

  // after refilling, check for new matches (cascade)
  setTimeout(() => {
    const newMatches = findAllMatches();
    if (newMatches.size > 0) {
      handleMatches(newMatches);
    }
  }, 180);
}

// timer / start / reset
function startGame() {
  if (running) return;
  running = true;
  score = 0;
  scoreEl.textContent = score;
  timeLeft = 120;
  barEl.style.width = '100%';
  timeEl.textContent = '2:00';
  // ensure board exists and ready
  if (squares.length === 0) createBoard();
  // start ticking
  timerId = setInterval(() => {
    timeLeft--;
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timeEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    barEl.style.width = `${(timeLeft / 120) * 100}%`;
    if (timeLeft <= 0) {
      clearInterval(timerId);
      running = false;
      if (score > high) { high = score; localStorage.setItem('candyHighest', high); highEl.textContent = high; }
      alert(`⏰ Time's up! Final Score: ${score}`);
    }
  }, 1000);
}

function resetGame() {
  clearInterval(timerId);
  running = false;
  score = 0;
  scoreEl.textContent = score;
  timeLeft = 120;
  timeEl.textContent = '2:00';
  barEl.style.width = '100%';
  createBoard();
}

// initialize
createBoard();

// attach handlers
startBtn.addEventListener('click', () => {
  if (!running) startGame();
});
resetBtn.addEventListener('click', resetGame);

