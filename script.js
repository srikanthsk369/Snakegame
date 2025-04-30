document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreElement = document.getElementById('score');
  const highScoreElement = document.getElementById('high-score');
  const messageElement = document.getElementById('message');
  const eatSound = document.getElementById('eat-sound');
  const gameoverSound = document.getElementById('gameover-sound');
  const highScoreSound = document.getElementById('high-score-sound');
  const difficultyModal = document.getElementById('difficulty-modal');
  const easyBtn = document.getElementById('easy');
  const mediumBtn = document.getElementById('medium');
  const hardBtn = document.getElementById('hard');

  messageElement.style.display = 'none'; // Hide message at start

  const gridSize = 20;
  const tileCount = 20;
  canvas.width = gridSize * tileCount;
  canvas.height = gridSize * tileCount;

  let snake = [{ x: 10, y: 10 }];
  let apple = { x: 5, y: 5 };
  let dx = 0;
  let dy = 0;
  let score = 0;
  let highScore = localStorage.getItem('snakeHighScore') || 0;
  let gameRunning = false;
  let wigglePhase = 0;
  let applePulse = 0;
  let gameSpeed = 100;  // Default speed (Medium)

  highScoreElement.textContent = `High Score: ${highScore}`;

  // Show the difficulty modal when the page loads
  difficultyModal.style.display = 'flex';

  // Difficulty selection event listeners
  easyBtn.addEventListener('click', () => setDifficulty('easy'));
  mediumBtn.addEventListener('click', () => setDifficulty('medium'));
  hardBtn.addEventListener('click', () => setDifficulty('hard'));

  function setDifficulty(level) {
    // Set game speed based on the selected difficulty
    if (level === 'easy') {
      gameSpeed = 150;
    } else if (level === 'medium') {
      gameSpeed = 100;
    } else if (level === 'hard') {
      gameSpeed = 50;
    }

    // Hide the modal and start the game
    difficultyModal.style.display = 'none';
    gameRunning = true;  // Start the game
    gameLoop(); // Start the game loop immediately
    setInterval(gameLoop, gameSpeed);
  }

  function keyDown(e) {
    if (!gameRunning) return;
    switch (e.key) {
      case 'ArrowUp':
        if (dy === 1) break;
        dx = 0;
        dy = -1;
        break;
      case 'ArrowDown':
        if (dy === -1) break;
        dx = 0;
        dy = 1;
        break;
      case 'ArrowLeft':
        if (dx === 1) break;
        dx = -1;
        dy = 0;
        break;
      case 'ArrowRight':
        if (dx === -1) break;
        dx = 1;
        dy = 0;
        break;
    }
  }

  function gameLoop() {
    if (!gameRunning) return;

    moveSnake();
    if (checkCollision()) {
      endGame();
      return;
    }
    if (appleEaten()) {
      score++;
      scoreElement.textContent = `Score: ${score}`;

      if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = `High Score: ${highScore}`;
        
        // Play high score sound and show confetti
        highScoreSound.currentTime = 0;
        highScoreSound.play();
        launchConfetti();
      }

      snake.push({});
      placeApple();
      eatSound.currentTime = 0;
      eatSound.play(); // Play Eat Sound
    }

    wigglePhase += 0.2;
    applePulse += 0.1;
    drawEverything();
  }

  function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    snake.pop();
  }

  function drawEverything() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();

    snake.forEach((segment, index) => {
      const offset = Math.sin(wigglePhase + index * 0.5) * 2;
      ctx.fillStyle = (index === 0) ? '#00cc00' : '#00ff00';
      ctx.fillRect(
        segment.x * gridSize + (dy !== 0 ? offset : 0),
        segment.y * gridSize + (dx !== 0 ? offset : 0),
        gridSize,
        gridSize
      );
      if (index === 0) {
        drawEyes(segment.x, segment.y, offset);
      }
    });

    const pulse = Math.sin(applePulse) * 2;
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(
      apple.x * gridSize + gridSize / 2,
      apple.y * gridSize + gridSize / 2,
      gridSize / 2.5 + pulse,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  function drawEyes(x, y, offset) {
    ctx.fillStyle = 'white';
    const eyeSize = gridSize / 5;
    const centerX = x * gridSize + (dy !== 0 ? offset : 0) + gridSize / 2;
    const centerY = y * gridSize + (dx !== 0 ? offset : 0) + gridSize / 2;

    if (dx === 1) {
      drawEye(centerX + gridSize / 4, centerY - gridSize / 6, eyeSize);
      drawEye(centerX + gridSize / 4, centerY + gridSize / 6, eyeSize);
    } else if (dx === -1) {
      drawEye(centerX - gridSize / 4, centerY - gridSize / 6, eyeSize);
      drawEye(centerX - gridSize / 4, centerY + gridSize / 6, eyeSize);
    } else if (dy === 1) {
      drawEye(centerX - gridSize / 6, centerY + gridSize / 4, eyeSize);
      drawEye(centerX + gridSize / 6, centerY + gridSize / 4, eyeSize);
    } else if (dy === -1) {
      drawEye(centerX - gridSize / 6, centerY - gridSize / 4, eyeSize);
      drawEye(centerX + gridSize / 6, centerY - gridSize / 4, eyeSize);
    }
  }

  function drawEye(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGrid() {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= tileCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSize, 0);
      ctx.lineTo(i * gridSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * gridSize);
      ctx.lineTo(canvas.width, i * gridSize);
      ctx.stroke();
    }
  }

  function checkCollision() {
    const head = snake[0];
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
      return true;
    }
    for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        return true;
      }
    }
    return false;
  }

  function appleEaten() {
    return snake[0].x === apple.x && snake[0].y === apple.y;
  }

  function placeApple() {
    apple.x = Math.floor(Math.random() * tileCount);
    apple.y = Math.floor(Math.random() * tileCount);
  }

  function endGame() {
    gameRunning = false;
    canvas.style.filter = 'blur(5px)';
    messageElement.style.display = 'block';

    gameoverSound.currentTime = 0;
    gameoverSound.play(); // Play Game Over sound

    setTimeout(resetGame, 3000);
  }

  function resetGame() {
    snake = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    score = 0;
    scoreElement.textContent = `Score: 0`;
    placeApple();
    gameRunning = true;
    canvas.style.filter = 'none';
    messageElement.style.display = 'none';
  }

  function launchConfetti() {
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    const colors = ['#ff0000', '#00ff00', '#ffff00']; // Red, Green, Yellow

    (function frame() {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }

  // Add key event listener for controlling snake
  document.addEventListener('keydown', keyDown);
});
