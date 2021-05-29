/**
 * Dictionary of currently pressed keys (if the key exists and the value is true, then the key is currently pressed)
 * @type {{String: boolean}}
 */
let pressedKeys = {};
/**
 * Dictionary of key mappings for movement
 * Possible values :
 *  - 'move forward'
 *  - 'move backward'
 *  - 'turn left'
 *  - 'turn right'
 *  - 'strafe left'
 *  - 'strafe right'
 */
let keymap = {
    ArrowUp: 'moveForward',
    ArrowDown: 'moveBackward',
    ArrowLeft: 'turnLeft',
    ArrowRight: 'turnRight',
    z: 'moveForward',
    s: 'moveBackward',
    q: 'strafeLeft',
    d: 'strafeRight',
};
let mouseSensitivity = .3;
/**
 * HTML Canvas in which the game view is drawn
 * @type {HTMLCanvasElement}
 */
let canvas;
/**
 * Drawing context
 * @type {CanvasRenderingContext2D}
 */
let context;
/**
 * Pixel data for the drawing context
 * @type {ImageData}
 */
let imageData;
/**
 * DataView of rendered pixels
 * @type {DataView}
 */
let pixels;

let socket;

function randomString(len) {
    const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < len; i++) {
        const r = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(r, r + 1);
    }
    return randomString;
}

const netId = randomString(10);

/**
 * Update the score information under the game screen
 * (should be called whenever one of the score values changes)
 */
function updateScore() {
    let kills = document.getElementById("kills");
    kills.innerText = "Kills: " + score.kills + " / " + score.totalKills;
    let secrets = document.getElementById("secrets");
    secrets.innerText = "Secrets: " + score.secrets + " / " + score.totalSecrets;
    let treasures = document.getElementById("treasures");
    treasures.innerText = "Treasures: " + score.treasures + " / " + score.totalTreasures;
    document.getElementById("gold_key").style['display'] = player.goldKey ? 'block' : 'none';
    document.getElementById("silver_key").style['display'] = player.silverKey ? 'block' : 'none';
}


/**
 * Toggle between 320 x 200 (zoom x2) and 640 x 400 (zoom x1) resolutions
 */
function toggleResolution() {
    let option = document.getElementById("option_resolution");
    if (zoom === 1) {
        setZoom(2);
        option.getElementsByTagName("span")[0].innerText = "High Resolution (320 x 200) [R]";
        option.getElementsByTagName("img")[0].src = "images/button_off.png";
    } else {
        setZoom(1);
        option.getElementsByTagName("span")[0].innerText = "High Resolution (640 x 400) [R]";
        option.getElementsByTagName("img")[0].src = "images/button_on.png";
    }
}


/**
 * Toggle between 60 fps and 30 fps
 */
function toggleFPS() {
    let option = document.getElementById("option_framerate");
    fps60 = !fps60;
    let framerate = fps60 ? "(60 fps)" : "(30 fps)";
    let button = fps60 ? "_on.png" : "_off.png";
    option.getElementsByTagName("span")[0].innerText = "Framerate " + framerate;
    option.getElementsByTagName("img")[0].src = "images/button" + button;
}


/**
 * Toggle pushwalls hightlighting on or off
 */
function togglePushwalls() {
    showPushwalls = !showPushwalls;
    let option = document.getElementById("option_pushwalls");
    let button = showPushwalls ? "_on.png" : "_off.png";
    option.getElementsByTagName("img")[0].src = "images/button" + button;
}


/**
 * Toggle the visibility of the map
 */
function toggleMap() {
    let hud = document.getElementById("hud_canvas");
    let option = document.getElementById("option_map");
    if (hud.offsetParent === null) {
        hud.style['display'] = 'block';
        option.getElementsByTagName("img")[0].src = "images/button_on.png";
    } else {
        hud.style['display'] = 'none';
        option.getElementsByTagName("img")[0].src = "images/button_off.png";
    }
}


/**
 * Loads a level and starts running the game
 * @param level {number} level to load (should be an integer from 0 to 59)
 */
function startGame(level) {
    // display the canvas
    let gameScreen = document.getElementById("game_screen");
    canvas = document.createElement("canvas");
    canvas.id = 'game_canvas';
    canvas.width = 640;
    canvas.height = 400;
    canvas.addEventListener('click', handleClick, false);
    document.addEventListener('pointerlockchange', handleLockChange, false);
    context = canvas.getContext("2d", {alpha: false});
    setZoom(2);  // by default start in 320 x 200 resolution
    gameScreen.innerHTML = '';
    gameScreen.appendChild(canvas);

    canvasHUD = document.createElement("canvas");
    canvasHUD.id = 'hud_canvas';
    canvasHUD.style = 'display: none';
    canvasHUD.width = 256;
    canvasHUD.height = 256;
    contextHUD = canvasHUD.getContext("2d");
    gameScreen.appendChild(canvasHUD);

    loadLevel(level);

    // setup page events (graphics options and keyboard inputs)
    document.getElementById("option_resolution").addEventListener("click", toggleResolution);
    document.getElementById("option_framerate").addEventListener("click", toggleFPS);
    document.getElementById("option_pushwalls").addEventListener("click", togglePushwalls);
    document.getElementById("option_map").addEventListener("click", toggleMap);
    document.getElementById("option_skip_level").addEventListener("click", loadNextLevel);
    document.onkeydown = function (e) {
        if (e.key === "Control") {
            player.shoot();
        } else if (e.key === "r") {
            toggleResolution();
        } else if (e.key === "m") {
            toggleMap();
        } else if (e.key === "l") {
            loadNextLevel();
        } else if (e.key in keymap) {
            e.preventDefault();
            pressedKeys[e.key] = true;
        }
    };
    document.onkeyup = function (e) {
        if (e.key in keymap) {
            e.preventDefault();
            pressedKeys[e.key] = false;
        }
    };
    document.onkeypress = function (e) {
        if (e.key === " ") {
            player.activate();
        }
    };
}


/**
 * Function called when user clicks on the game screen canvas
 * (locks mouse pointer if it is not locked, shoots if already locked)
 */
function handleClick() {
    if (document.pointerLockElement === canvas) {
        player.shoot();
    } else {
        canvas.requestPointerLock();
    }
}


/**
 * Function called when the mouse lock status changes (mouse pointer captured by game canvas)
 */
function handleLockChange() {
    if (document.pointerLockElement === canvas) {
        document.addEventListener('mousemove', handleMouseMove, false);
    } else {
        document.removeEventListener('mousemove', handleMouseMove);
    }
}


/**
 * React to a movement of the mouse when locked in the game screen canvas
 */
function handleMouseMove(e) {
    player.turnAngle += e.movementX * mouseSensitivity;
}


window.onload = function () {
    // load game data files, and display the episode selection screen
    loadResources().then(() => {
        document.getElementById("splash_screen").style['display'] = 'none';
        document.getElementById("episode_select").style['display'] = 'block';
    });

    let get_parameters = {};
    if (window.location.search !== "") {
        const parameters = window.location.search.substr(1).split('&');
        for (const p of parameters) {
            let [k, v] = p.split('=');
            get_parameters[k] = v;
        }
    }

    if (get_parameters['gid']) {
        socket = new WebSocket("ws://127.0.0.1:8000/cs/" + get_parameters['gid']);
        socket.onmessage = function (e) {
            const data = JSON.parse(e.data);
            updateGameState(data);
        }
    }
};

function connect(gid) {
    socket = new WebSocket(`ws://games.zanapher.fr/cs/wolf_${gid}/`);
    socket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        updateGameState(data);
    }
}