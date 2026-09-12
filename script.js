// ======================================================
// SNAKE APPLE 2D
// ======================================================

const API_URL =
    "MASUKKAN_URL_GOOGLE_APPS_SCRIPT_DISINI";


let username = "";
let score = 0;
let level = 1;

let snake = [];
let apple = {};

let obstacles = [];

let direction = "right";
let nextDirection = "right";

let gameLoop = null;
let gameRunning = false;
let paused = false;

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");


const grid = 20;

const tileCount =
    canvas.width / grid;


// ======================================================
// AUTH
// ======================================================

function showRegister() {

    document.getElementById("loginForm")
        .style.display = "none";

    document.getElementById("registerForm")
        .style.display = "block";

    document.getElementById("authMessage")
        .innerText = "";
}


function showLogin() {

    document.getElementById("registerForm")
        .style.display = "none";

    document.getElementById("loginForm")
        .style.display = "block";

    document.getElementById("authMessage")
        .innerText = "";
}


async function register() {

    const user =
        document.getElementById("registerUsername")
            .value.trim();

    const password =
        document.getElementById("registerPassword")
            .value;

    if (user.length < 3) {

        showAuthMessage(
            "Username minimal 3 karakter."
        );

        return;
    }

    if (password.length < 4) {

        showAuthMessage(
            "Password minimal 4 karakter."
        );

        return;
    }


    showAuthMessage("Mendaftarkan akun...");


    try {

        const response =
            await apiRequest(
                "register",
                {
                    username: user,
                    password: password
                }
            );


        if (response.success) {

            showAuthMessage(
                "Pendaftaran berhasil! Silakan login."
            );

            showLogin();

        } else {

            showAuthMessage(
                response.message
            );
        }

    } catch (error) {

        showAuthMessage(
            "Gagal terhubung ke server."
        );

        console.error(error);
    }
}


async function login() {

    const user =
        document.getElementById("loginUsername")
            .value.trim();

    const password =
        document.getElementById("loginPassword")
            .value;


    if (!user || !password) {

        showAuthMessage(
            "Username dan password harus diisi."
        );

        return;
    }


    showAuthMessage("Login...");


    try {

        const response =
            await apiRequest(
                "login",
                {
                    username: user,
                    password: password
                }
            );


        if (response.success) {

            username = response.username;

            document.getElementById(
                "playerName"
            ).innerText = username;

            document.getElementById(
                "gameUsername"
            ).innerText = username;


            document.getElementById(
                "authScreen"
            ).style.display = "none";

            document.getElementById(
                "menuScreen"
            ).style.display = "flex";

        } else {

            showAuthMessage(
                response.message
            );
        }

    } catch (error) {

        showAuthMessage(
            "Gagal terhubung ke server."
        );

        console.error(error);
    }
}


function logout() {

    username = "";

    stopGame();

    document.getElementById(
        "menuScreen"
    ).style.display = "none";

    document.getElementById(
        "authScreen"
    ).style.display = "flex";

}


function showAuthMessage(message) {

    document.getElementById(
        "authMessage"
    ).innerText = message;
}


// ======================================================
// API
// ======================================================

function apiRequest(action, data = {}) {

    return new Promise((resolve, reject) => {

        const callbackName =
            "callback_" +
            Date.now() +
            "_" +
            Math.floor(Math.random() * 10000);


        const params =
            new URLSearchParams();

        params.append(
            "action",
            action
        );

        params.append(
            "callback",
            callbackName
        );


        Object.keys(data).forEach(key => {

            params.append(
                key,
                data[key]
            );

        });


        const script =
            document.createElement("script");


        window[callbackName] =
            function(response) {

                resolve(response);

                delete window[callbackName];

                script.remove();
            };


        script.onerror =
            function() {

                reject(
                    new Error(
                        "API Error"
                    )
                );

                delete window[callbackName];

                script.remove();
            };


        script.src =
            API_URL +
            "?" +
            params.toString();


        document.body.appendChild(
            script
        );

    });
}


// ======================================================
// GAME START
// ======================================================

function startGame() {

    document.getElementById(
        "menuScreen"
    ).style.display = "none";

    document.getElementById(
        "gameOverScreen"
    ).style.display = "none";

    document.getElementById(
        "leaderboardScreen"
    ).style.display = "none";

    document.getElementById(
        "gameScreen"
    ).style.display = "block";


    score = 0;
    level = 1;

    direction = "right";
    nextDirection = "right";

    paused = false;

    snake = [

        {
            x: 10,
            y: 15
        },

        {
            x: 9,
            y: 15
        },

        {
            x: 8,
            y: 15
        }

    ];


    obstacles = [];

    generateObstacles();

    createApple();

    updateScore();

    stopGameLoop();

    gameRunning = true;


    gameLoop =
        setInterval(
            updateGame,
            calculateSpeed()
        );


    drawGame();
}


// ======================================================
// GAME SPEED
// ======================================================

function calculateSpeed() {

    return Math.max(
        55,
        150 - (level * 10)
    );
}


function restartSpeed() {

    stopGameLoop();

    gameLoop =
        setInterval(
            updateGame,
            calculateSpeed()
        );
}


function stopGameLoop() {

    if (gameLoop) {

        clearInterval(gameLoop);

        gameLoop = null;
    }
}


// ======================================================
// UPDATE
// ======================================================

function updateGame() {

    if (!gameRunning || paused) {
        return;
    }


    direction =
        nextDirection;


    const head =
        {
            ...snake[0]
        };


    if (direction === "up") {
        head.y--;
    }

    if (direction === "down") {
        head.y++;
    }

    if (direction === "left") {
        head.x--;
    }

    if (direction === "right") {
        head.x++;
    }


    // WALL COLLISION

    if (
        head.x < 0 ||
        head.x >= tileCount ||
        head.y < 0 ||
        head.y >= tileCount
    ) {

        gameOver();

        return;
    }


    // OBSTACLE COLLISION

    if (
        obstacles.some(
            obstacle =>
                obstacle.x === head.x &&
                obstacle.y === head.y
        )
    ) {

        gameOver();

        return;
    }


    // SELF COLLISION

    if (
        snake.some(
            part =>
                part.x === head.x &&
                part.y === head.y
        )
    ) {

        gameOver();

        return;
    }


    snake.unshift(head);


    // APPLE

    if (
        head.x === apple.x &&
        head.y === apple.y
    ) {

        eatApple();

    } else {

        snake.pop();

    }


    drawGame();
}


// ======================================================
// APPLE
// ======================================================

function createApple() {

    let valid = false;

    while (!valid) {

        apple = {

            x:
                Math.floor(
                    Math.random() *
                    tileCount
                ),

            y:
                Math.floor(
                    Math.random() *
                    tileCount
                )

        };


        valid =

            !snake.some(
                part =>
                    part.x === apple.x &&
                    part.y === apple.y
            )

            &&

            !obstacles.some(
                obstacle =>
                    obstacle.x === apple.x &&
                    obstacle.y === apple.y
            );
    }
}


// ======================================================
// EAT APPLE
// ======================================================

function eatApple() {

    score += 10;


    // LEVEL UP

    if (
        score % 50 === 0
    ) {

        level++;

        generateObstacles();

        restartSpeed();

    }


    createApple();

    updateScore();
}


function updateScore() {

    document.getElementById(
        "score"
    ).innerText = score;

    document.getElementById(
        "level"
    ).innerText = level;
}


// ======================================================
// OBSTACLES
// ======================================================

function generateObstacles() {

    obstacles = [];


    // Jumlah rintangan meningkat
    // setiap level

    const amount =
        18 + (level * 8);


    for (
        let i = 0;
        i < amount;
        i++
    ) {

        let obstacle;


        do {

            obstacle = {

                x:
                    Math.floor(
                        Math.random() *
                        tileCount
                    ),

                y:
                    Math.floor(
                        Math.random() *
                        tileCount
                    )

            };

        } while (

            obstacle.x < 15 &&
            obstacle.y > 12

        );


        if (

            !snake.some(
                part =>
                    part.x === obstacle.x &&
                    part.y === obstacle.y
            )

        ) {

            obstacles.push(
                obstacle
            );
        }
    }
}


// ======================================================
// DRAW
// ======================================================

function drawGame() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // GRID

    ctx.strokeStyle =
        "rgba(80,255,130,0.06)";

    for (
        let i = 0;
        i < tileCount;
        i++
    ) {

        ctx.beginPath();

        ctx.moveTo(
            i * grid,
            0
        );

        ctx.lineTo(
            i * grid,
            canvas.height
        );

        ctx.stroke();


        ctx.beginPath();

        ctx.moveTo(
            0,
            i * grid
        );

        ctx.lineTo(
            canvas.width,
            i * grid
        );

        ctx.stroke();
    }


    // OBSTACLES

    obstacles.forEach(
        obstacle => {

            ctx.fillStyle =
                "#686868";

            ctx.fillRect(
                obstacle.x * grid + 2,
                obstacle.y * grid + 2,
                grid - 4,
                grid - 4
            );


            ctx.strokeStyle =
                "#a0a0a0";

            ctx.strokeRect(
                obstacle.x * grid + 3,
                obstacle.y * grid + 3,
                grid - 6,
                grid - 6
            );

        }
    );


    // APPLE

    drawApple();


    // SNAKE

    snake.forEach(
        (part, index) => {

            if (index === 0) {

                ctx.fillStyle =
                    "#42ff78";

            } else {

                ctx.fillStyle =
                    "#20c95b";

            }


            ctx.beginPath();

            ctx.roundRect(
                part.x * grid + 2,
                part.y * grid + 2,
                grid - 4,
                grid - 4,
                5
            );

            ctx.fill();


            // EYES

            if (index === 0) {

                ctx.fillStyle =
                    "#06110c";


                if (
                    direction === "right" ||
                    direction === "left"
                ) {

                    ctx.fillRect(
                        part.x * grid + 6,
                        part.y * grid + 5,
                        3,
                        3
                    );

                    ctx.fillRect(
                        part.x * grid + 6,
                        part.y * grid + 12,
                        3,
                        3
                    );

                } else {

                    ctx.fillRect(
                        part.x * grid + 5,
                        part.y * grid + 6,
                        3,
                        3
                    );

                    ctx.fillRect(
                        part.x * grid + 12,
                        part.y * grid + 6,
                        3,
                        3
                    );
                }
            }
        }
    );
}


// ======================================================
// APPLE DRAW
// ======================================================

function drawApple() {

    const x =
        apple.x * grid +
        grid / 2;

    const y =
        apple.y * grid +
        grid / 2;


    // APPLE

    ctx.fillStyle =
        "#ff3030";

    ctx.beginPath();

    ctx.arc(
        x - 4,
        y,
        6,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 4,
        y,
        6,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // STEM

    ctx.strokeStyle =
        "#633b20";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        x,
        y - 4
    );

    ctx.lineTo(
        x + 2,
        y - 10
    );

    ctx.stroke();


    // LEAF

    ctx.fillStyle =
        "#48df67";

    ctx.beginPath();

    ctx.ellipse(
        x + 5,
        y - 8,
        5,
        2.5,
        -0.4,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


// ======================================================
// DIRECTION
// ======================================================

function changeDirection(newDirection) {

    const opposite = {

        up: "down",
        down: "up",
        left: "right",
        right: "left"

    };


    if (
        newDirection !==
        opposite[direction]
    ) {

        nextDirection =
            newDirection;
    }
}


// ======================================================
// KEYBOARD
// ======================================================

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "ArrowUp" ||
            event.key.toLowerCase() === "w"
        ) {

            changeDirection("up");

        }

        if (
            event.key === "ArrowDown" ||
            event.key.toLowerCase() === "s"
        ) {

            changeDirection("down");

        }

        if (
            event.key === "ArrowLeft" ||
            event.key.toLowerCase() === "a"
        ) {

            changeDirection("left");

        }

        if (
            event.key === "ArrowRight" ||
            event.key.toLowerCase() === "d"
        ) {

            changeDirection("right");

        }

        if (
            event.key === " "
        ) {

            pauseGame();
        }

    }
);


// ======================================================
// PAUSE
// ======================================================

function pauseGame() {

    if (!gameRunning) {
        return;
    }

    paused = !paused;
}


// ======================================================
// GAME OVER
// ======================================================

async function gameOver() {

    gameRunning = false;

    stopGameLoop();


    document.getElementById(
        "gameScreen"
    ).style.display = "none";

    document.getElementById(
        "gameOverScreen"
    ).style.display = "flex";


    document.getElementById(
        "finalScore"
    ).innerText = score;


    document.getElementById(
        "newRecord"
    ).innerText =
        "💾 Menyimpan skor...";


    try {

        const response =
            await apiRequest(
                "saveScore",
                {
                    username:
                        username,

                    score:
                        score,

                    level:
                        level
                }
            );


        if (response.success) {

            if (response.newRecord) {

                document.getElementById(
                    "newRecord"
                ).innerText =
                    "🏆 REKOR BARU!";

            } else {

                document.getElementById(
                    "newRecord"
                ).innerText =
                    "Skor berhasil disimpan.";
            }

        }

    } catch (error) {

        document.getElementById(
            "newRecord"
        ).innerText =
            "Skor lokal selesai.";

        console.error(error);
    }
}


// ======================================================
// STOP GAME
// ======================================================

function stopGame() {

    gameRunning = false;

    stopGameLoop();
}


// ======================================================
// MENU
// ======================================================

function backToMenu() {

    stopGame();

    document.getElementById(
        "gameScreen"
    ).style.display = "none";

    document.getElementById(
        "gameOverScreen"
    ).style.display = "none";

    document.getElementById(
        "leaderboardScreen"
    ).style.display = "none";

    document.getElementById(
        "menuScreen"
    ).style.display = "flex";
}


// ======================================================
// LEADERBOARD
// ======================================================

async function showLeaderboard() {

    stopGame();

    document.getElementById(
        "menuScreen"
    ).style.display = "none";

    document.getElementById(
        "gameScreen"
    ).style.display = "none";

    document.getElementById(
        "gameOverScreen"
    ).style.display = "none";

    document.getElementById(
        "leaderboardScreen"
    ).style.display = "flex";


    const container =
        document.getElementById(
            "leaderboardList"
        );


    container.innerHTML =
        "⏳ Memuat leaderboard...";


    try {

        const response =
            await apiRequest(
                "leaderboard"
            );


        if (!response.success) {

            container.innerHTML =
                "Gagal memuat leaderboard.";

            return;
        }


        if (
            !response.data ||
            response.data.length === 0
        ) {

            container.innerHTML =
                "Belum ada skor.";

            return;
        }


        container.innerHTML =
            "";


        response.data.forEach(
            (player, index) => {

                const div =
                    document.createElement(
                        "div"
                    );

           
