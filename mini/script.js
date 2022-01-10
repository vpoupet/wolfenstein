/**
 * Game pixels rendered on screen (width)
 * @type {number}
 */
let pixelWidth = 640;
/**
 * Game pixels rendered on screen (height)
 * @type {number}
 */
let pixelHeight = 400;
/**
 * Field of vision
 * @type {number}
 */
let fov = 1;
/**
 * Rendered size of a wall
 * @type {number}
 */
let wallHeight;
/**
 * Game color palette (RGBA, 32bit little-endian)
 * @type {Uint32Array}
 */
let palette = new Uint32Array([
    4278190080, 4289200128, 4278233088, 4289243136, 4278190248, 4289200296, 4278211752, 4289243304,
    4283716692, 4294726740, 4283759700, 4294769748, 4283716860, 4294726908, 4283759868, 4294769916,
    4293717228, 4292664540, 4291875024, 4290822336, 4290032820, 4289243304, 4288190616, 4287401100,
    4286348412, 4285558896, 4284769380, 4283716692, 4282927176, 4281874488, 4281084972, 4280295456,
    4278190332, 4278190316, 4278190304, 4278190292, 4278190280, 4278190268, 4278190256, 4278190244,
    4278190232, 4278190216, 4278190204, 4278190192, 4278190180, 4278190168, 4278190156, 4278190144,
    4292401404, 4290296060, 4288453884, 4286348540, 4284243196, 4282401020, 4280295676, 4278190332,
    4284262652, 4282423548, 4280322300, 4278221052, 4278217956, 4278214860, 4278211764, 4278209692,
    4292410620, 4290313468, 4288478460, 4286381308, 4284283132, 4282447100, 4280349948, 4278252796,
    4278245604, 4278240460, 4278234292, 4278230172, 4278224004, 4278217840, 4278211672, 4278206528,
    4284284112, 4282449092, 4280351924, 4278254752, 4278248592, 4278242432, 4278236276, 4278230112,
    4292410584, 4290313404, 4288478364, 4286381184, 4284284000, 4282448960, 4280351776, 4278254592,
    4278254592, 4278250496, 4278247424, 4278244352, 4278241284, 4278238212, 4278235140, 4278232068,
    4278228996, 4278224900, 4278221828, 4278218756, 4278215684, 4278212612, 4278209540, 4278206468,
    4294769880, 4294769848, 4294769820, 4294507644, 4294769756, 4294769728, 4294769696, 4294769664,
    4293190656, 4291611648, 4290032640, 4288453632, 4286874624, 4285558784, 4283979776, 4282400768,
    4294753372, 4294750272, 4294748192, 4294745088, 4293168128, 4291591168, 4290014208, 4288437248,
    4294760664, 4294753464, 4294745244, 4294738044, 4294729820, 4294721600, 4294714400, 4294706176,
    4294705152, 4293656576, 4292870144, 4292083712, 4291297280, 4290510848, 4289724416, 4288937984,
    4288151552, 4287102976, 4286316544, 4285530112, 4284743680, 4283957248, 4283170816, 4282384384,
    4280821800, 4281655548, 4280603900, 4279815420, 4278763772, 4278236412, 4294713524, 4294705320,
    4293132440, 4291559552, 4289986676, 4288413792, 4286840912, 4285530180, 4283957300, 4282384424,
    4294760700, 4294752508, 4294745340, 4294737148, 4294728956, 4294721788, 4294713596, 4294705404,
    4293132512, 4291559624, 4289986740, 4288413852, 4286840964, 4285530220, 4283957336, 4282384448,
    4292667644, 4291879164, 4291090684, 4290565372, 4289776892, 4288988412, 4288462076, 4287674620,
    4286623996, 4285572348, 4284521724, 4284257520, 4283993320, 4283730140, 4283465936, 4283202760,
    4282939580, 4282675380, 4282411176, 4282148000, 4281884828, 4281621648, 4281358472, 4281094272,
    4280831092, 4280567916, 4280303708, 4280040532, 4279777352, 4279775296, 4279512120, 4278984744,
    4284743776, 4284769280, 4284506112, 4280025088, 4281073664, 4279247920, 4282908744, 4283433040,
    4281597952, 4280032284, 4283190348, 4284243036, 4282400832, 4281348144, 4281611316, 4294243544,
    4293454008, 4292664476, 4291348596, 4290822216, 4290032672, 4289769504, 4288979968, 4288190464,
    4287400960, 4286874624, 4286348288, 4286085120, 4285821952, 4285558784, 4285295616, 4287103128]);
/**
 * DataView containing the data from VSWAP.WL6
 * @type {DataView}
 */
let VSWAP;
/**
 * Offset in the VSWAP.WL6 file where the first wall texture starts
 * @type {number}
 */
let wallTexturesOffset;
/**
 * DataView of the level structure data
 * @type {DataView}
 */
let plane0;
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
 * Asynchronously load a binary file
 * @param url {String} path to file
 * @param onload {function} callback to execute after loading
 */
function loadBytes(url, onload) {
    let req = new XMLHttpRequest();
    req.onload = onload;
    req.responseType = "arraybuffer";
    req.open("GET", url);
    // request response is typed as an ArrayBuffer
    req.send();
}


/**
 * Load game data files:
 * - 00.map: level structure (walls)
 * - VSWAP.WL6: contains wall textures
 * @param onload {function} callback to execute when all resources are loaded
 */
function loadResources(onload) {
    /**
     * If all resources are loaded, and splash screen has finished showing, execute callback function
     */
    function checkReady() {
        if (plane0 !== undefined &&
            VSWAP !== undefined) {
            onload();
        }
    }

    // load game files
    loadBytes(
        "00-copy.map",
        function() {
            plane0 = new DataView(this.response);
            checkReady();
        }
    );
    loadBytes(
        "VSWAP.WL6",
        function() {
            VSWAP = new DataView(this.response);
            wallTexturesOffset = VSWAP.getUint32(6, true);
            checkReady();
        }
    )
}


/**
 * Getter function for plane0 data
 * @param x
 * @param y
 * @returns {number}
 */
function map0(x, y) {
    return plane0.getUint8(x + 64 * y);
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
        drawWalls();
    }

    // draw to canvas
    context.putImageData(imageData, 0, 0);

    // call the function again on next frame
    requestAnimationFrame(draw);
}


/**
 * Draw walls, ceiling and floor.
 * Drawing is done for each column, finding the corresponding wall and its distance to the player by ray casting, and
 * then completing by drawing ceiling and floor.
 */
function drawWalls() {
    for (let i = 0; i < pixelWidth; i++) {
        // current column position on the camera plane
        let shift = fov * ((i << 1) - pixelWidth) / pixelWidth;
        // direction of the ray
        let rdx = player.dx - shift * player.dy;
        let rdy = player.dy + shift * player.dx;
        // screen point coordinates in the direction of the ray
        let sx = player.x + rdx;
        let sy = player.y + rdy;
        // direction in which the ray moves along each axis
        let stepx = rdx >= 0 ? 1 : -1;
        let stepy = rdy >= 0 ? 1 : -1;
        // take absolute values of ray direction
        rdx = stepx * rdx;
        rdy = stepy * rdy;
        // cell position of the ray on the map (starting from the player position)
        let cx = ~~player.x;
        let cy = ~~player.y;
        // remaining fractional distance from the ray position to the next cell (0 < rfx, rfy <= 1)
        let rfx = stepx > 0 ? 1 - (player.x % 1) : player.x % 1;
        if (rfx === 0) {
            rfx = 1;
            cx += stepx;
        }
        let rfy = stepy > 0 ? 1 - (player.y % 1) : player.y % 1;
        if (rfy === 0) {
            rfy = 1;
            cy += stepy;
        }

        // total time traveled by the ray
        let t = 0;
        // plane0 value of the cell visited by the ray
        let m0;
        // coordinate on the wall tile where the ray hit (0 <= tx <= 1)
        let tx;
        // index of tile to display
        let textureIndex;

        while (true) {
            m0 = map0(cx, cy);
            if (m0 <= 63) {
                // hit a wall
                if (m0 === 0x3C || m0 === 0x3D) {
                    // diagonal wall
                    let dx, dy, x1, y1;
                    if (m0 === 0x3C) {
                        dx = -1;
                        dy = 1;
                        x1 = cx + 1;
                        y1 = cy;
                    } else {
                        dx = 1;
                        dy = 1;
                        x1 = cx;
                        y1 = cy;
                    }
                    const vx = rdx * stepx;
                    const vy = rdy * stepy;
                    const x0 = cx + (stepx >= 0 ? 1 - rfx : rfx);
                    const y0 = cy + (stepy >= 0 ? 1 - rfy : rfy);
                    const det = -vx * dy + vy * dx;
                    if (det !== 0) {
                        const lambda = (-vy * (x1 - x0) + vx * (y1 - y0)) / det;
                        if (0 <= lambda && lambda <= 1) {
                            const dt = (-dy * (x1 - x0) + dx * (y1 - y0)) / det;
                            t += dt;
                            tx = lambda;
                            textureIndex = 64;
                            break;
                        }
                    }
                } else {
                    if (rfx === 1) {
                        // NS wall
                        textureIndex = 2 * m0 - 1;
                        // fix texture orientation depending on ray direction
                        tx = stepx * stepy > 0 ? 1 - rfy : rfy;
                    } else {
                        // EW wall
                        textureIndex = 2 * m0 - 2;
                        // fix texture orientation depending on ray direction
                        tx = stepx * stepy < 0 ? 1 - rfx : rfx;
                    }
                    break;
                }
            }
            // move to the next cell
            if (rfx * rdy <= rfy * rdx) {
                // move to next cell horizontally
                let dt = rfx / rdx;
                t += dt;
                rfx = 1;
                cx += stepx;
                rfy -= dt * rdy;
            } else {
                // move to next cell vertically
                let dt = rfy / rdy;
                t += dt;
                rfy = 1;
                cy += stepy;
                rfx -= dt * rdx;
            }
        }

        // compute ray location
        let h = wallHeight / (2 * t); // height of the line representing the wall on the current column

        let yi = ~~(pixelHeight / 2 - h);
        let yf = (pixelHeight / 2 - h) % 1;
        let stepi = ~~(h / 32);
        let stepf = (h / 32) % 1;
        let texelOffset = wallTexturesOffset + 4096 * textureIndex + 64 * ~~(64 * tx);
        // draw ceiling and floor
        for (let j = 0; j <= yi; j++) {
            pixels.setUint32((pixelWidth * j + i) << 2, palette[29], true);
            pixels.setUint32((pixelWidth * (pixelHeight - 1 - j) + i) << 2, palette[25], true);
        }
        // draw the wall
        for (let j = texelOffset; j < texelOffset + 64; j++) {
            let col = palette[VSWAP.getUint8(j)];
            yf += stepf;
            if (yf >= 1) {
                for (let k = Math.max(0, yi); k < Math.min(pixelHeight, yi + stepi + 1); k++) {
                    pixels.setUint32((pixelWidth * k + i) << 2, col, true);
                }
                yi += stepi + 1;
                yf -= 1;
            } else {
                for (let k = Math.max(0, yi); k < Math.min(pixelHeight, yi + stepi); k++) {
                    pixels.setUint32((pixelWidth * k + i) << 2, col, true);
                }
                yi += stepi;
            }
        }
    }
}


window.onload = function () {
    // prepare canvas
    canvas = document.createElement("canvas");
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    context = canvas.getContext("2d", {alpha: false});
    imageData = new ImageData(pixelWidth, pixelHeight);
    pixels = new DataView(imageData.data.buffer);
    document.body.appendChild(canvas);

    // prepare some variables
    wallHeight = pixelWidth / (2 * fov);
    player = new Player(31.5, 33.5, 1, 0);

    // monitor key presses
    document.onkeydown = function (e) {
        pressedKeys[e.key] = true;
    };
    document.onkeyup = function (e) {
        pressedKeys[e.key] = false;
    };

    // load game files and start the drawing cycle
    loadResources(function () {
        draw();
    });
};
