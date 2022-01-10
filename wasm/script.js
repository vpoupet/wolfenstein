const ZOOM_FACTOR = 4;
const WIDTH = 320 * ZOOM_FACTOR;
const HEIGHT = 200 * ZOOM_FACTOR;
const WALL_HEIGHT = 160 * ZOOM_FACTOR;

let update_view;
let viewImageData;
let plane0;
let screen_canvas;
let screen_context;

/**
 * Representation of the player character
 * @type {Player}
 */
let player;
/**
 * Dictionary of currently pressed keys (if the key exists and the value is true, then the key is currently pressed)
 * @type {{String: boolean}}
 */
let pressedKeys = {};

/**
 * Getter function for plane0 data
 * @param x
 * @param y
 * @returns {number}
 */
function map0(x, y) {
    return plane0[x + 64 * y];
}

/**
 * Whether a given cell is blocking (wall)
 * @param x {number} x-coordinate of the cell
 * @param y {number} y-coordinate of the cell
 * @returns {boolean}
 */
function isBlocking(x, y) {
    return map0(x, y) <= 63;
}


/**
 * Class representation of the game player character
 * @param x {number} x-coordinate of the starting position
 * @param y {number} y-coordinate of the starting position
 * @param dx {number} initial facing direction (x-component)
 * @param dy {number} initial facing direction (y-component)
 * @constructor
 */
function Player(x, y, dx, dy) {
    /**
     * Position of the player on the map (x-coordinate)
     * @type {number}
     */
    this.x = x;
    /**
     * Position of the player on the map (y-coordinate)
     * @type {number}
     */
    this.y = y;
    /**
     * Player facing direction (x-value)
     * @type {number}
     */
    this.dx = dx;
    /**
     * Player facing direction (y-value)
     * @type {number}
     */
    this.dy = dy;
    /**
     * Walking speed
     * @type {number}
     */
    this.speed = 0.065;
    /**
     * Turning speed
     * @type {number}
     */
    this.speed_a = 0.05;
    /**
     * Player radius (for collision detection)
     * @type {number}
     */
    this.radius = 0.25;
    /**
     * Check whether the player can go to the given location
     * @param x {number} x-coordinate of the position
     * @param y {number} y-coordinate of the position
     * @returns {boolean} whether the location is valid for the player
     */
    this.canMoveTo = function(x, y) {
        let r = this.radius;
        let fx = x % 1;
        x = ~~x;
        let fy = y % 1;
        y = ~~y;

        if (isBlocking(x, y)) return false;
        if (fx < r) {
            if (isBlocking(x- 1, y)) return false;
            if (fy < r && isBlocking(x - 1, y - 1)) return false;
            if (fy > 1 - r && isBlocking(x - 1, y + 1)) return false;
        }
        if (fx > 1 - r) {
            if (isBlocking(x + 1, y)) return false;
            if (fy < r && isBlocking(x + 1, y - 1)) return false;
            if (fy > 1 - r && isBlocking(x + 1, y + 1)) return false;
        }
        if (fy < r && isBlocking(x, y - 1)) return false;
        if (fy > 1 - r && isBlocking(x, y + 1)) return false;
        return true;
    };

    /**
     * Move forward
     * @param length {number} distance to move (use negative value to move backwards)
     */
    this.move = function(length) {
        let x = this.x + this.dx * length;
        let y = this.y + this.dy * length;
        if (this.canMoveTo(x, this.y)) {
            this.x = x;
        }
        if (this.canMoveTo(this.x, y)) {
            this.y = y;
        }
    };

    /**
     * Turn right
     * @param alpha {number} angle in radians to rotate (use negative value to turn left)
     */
    this.turn = function(alpha) {
        let dx = this.dx * Math.cos(alpha) - this.dy * Math.sin(alpha);
        this.dy = this.dx * Math.sin(alpha) + this.dy * Math.cos(alpha);
        this.dx = dx;
    };
}

/**
 * Main drawing loop called at each frame
 */
function draw() {
    // update player position and direction
    if (pressedKeys["ArrowRight"]) { player.turn(player.speed_a) }
    if (pressedKeys["ArrowLeft"]) { player.turn(-player.speed_a) }
    if (pressedKeys["ArrowUp"]) { player.move(player.speed) }
    if (pressedKeys["ArrowDown"]) { player.move(-player.speed) }

    // draw walls visible game elements
    for (let i = 0; i < 16; i++) {
        update_view(player.x, player.y, player.dx, player.dy);
    }

    // draw to canvas
    screen_context.putImageData(viewImageData, 0, 0);

    // call the function again on next frame
    requestAnimationFrame(draw);
}

Module['onRuntimeInitialized'] = function () {
    console.log("wasm loaded ");
    Module.ccall('init', 'void', ['number', 'number', 'number'], [WIDTH, HEIGHT, WALL_HEIGHT]);
    let view_ptr = Module.ccall('get_view_ptr', 'number', [], []);
    let viewUint8 = Module.HEAPU8.subarray(view_ptr, view_ptr + WIDTH * HEIGHT * 4);
    let viewArray = new Uint8ClampedArray(viewUint8.buffer, view_ptr, WIDTH * HEIGHT * 4);
    viewImageData = new ImageData(viewArray, WIDTH, HEIGHT);

    let map_ptr = Module.ccall('get_map_ptr', 'number', [], []);
    plane0 = Module.HEAPU8.subarray(map_ptr, map_ptr + 4096);
    update_view = Module.cwrap('update_view', 'void', ['number', 'number', 'number', 'number']);
    draw();
};

window.addEventListener("load", () => {
    screen_canvas = document.getElementById("screen");
    screen_canvas.style.width = `${WIDTH}px`;
    screen_canvas.style.height = `${HEIGHT}px`;
    screen_canvas.width = WIDTH;
    screen_canvas.height = HEIGHT;
    screen_context = screen_canvas.getContext('2d');

    player = new Player(29.5, 57.5, 1, 0);
    // monitor key presses
    document.onkeydown = function (e) {
        pressedKeys[e.key] = true;
    };
    document.onkeyup = function (e) {
        pressedKeys[e.key] = false;
    };
});
