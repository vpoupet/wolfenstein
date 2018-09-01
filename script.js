/**
 * Game pixels rendered on screen (width)
 * @type {number}
 */
let pixelWidth = 320;
/**
 * Game pixels rendered on screen (height)
 * @type {number}
 */
let pixelHeight = 200;
/**
 * Multiplicative rendering factor (1 game pixel is rendered as zoom x zoom pixels in the canvas)
 * @type {number}
 */
let zoom = 2;
/**
 * Rendered size of a wall
 * @type {number}
 */
let wallHeight = 80;
/**
 * Representation of the player character
 * @type {Player}
 */
let player;
/**
 * Things in the level (sprites, enemies, powerups, etc.)
 * @type {Array}
 */
let things;
/**
 * TileSet instance containing textures for the walls
 * @type {TileSet}
 */
let wallTextures;
/**
 * TileSet instance containing textures for the floor and ceiling
 * @type {TileSet}
 */
let surfaceTextures;
/**
 * TileSet instance containing textures for the props
 * @type {TileSet}
 */
let propTextures;
/**
 * Array containing distance of wall for each pixel column on screen
 * @type {number[]}
 */
let zIndex = new Array(pixelWidth);
/**
 * Dictionary of currently pressed keys (if the key exists and the value is true, then the key is currently pressed)
 * @type {{String: boolean}}
 */
let pressedKeys = {};
/**
 * 2D arrays containing map data for planes 0 and 1
 * @type {Uint8Array[]}
 */
let plane0, plane1;
/**
 * 2D array indicating if each cell of the map is blocking or not
 */
let plane2;
/**
 * Counter of number of events being processed in setup
 * @type {number}
 */
let setupCounter = 0;
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
 * Array of rendered pixels
 * @type {Uint8ClampedArray}
 */
let pixels;
/**
 * Indicates whether the canvas has started it drawing loop
 * @type {boolean}
 */
let isDrawing = false;
/**
 * Array of door timers for doors being active (opening, open or closing)
 * The elements in the array are objects with attributes
 * - x: x-coordinate of the door
 * - y: y-coordinate of the door
 * - t: counter since door was open
 */
let doorTimers;

/**
 * Class representation of the bytes for a set of texture tiles
 * Textures should be 16x16 pixels images, stored one after the other in a PPM file
 * @param data {ArrayBuffer} buffer containing the bytes of a PPM file representing the textures
 * @constructor
 */
function TileSet(data) {
    /**
     * Array of pixel bytes from the PPM file
     * @type {Uint8Array}
     */
    this.bytes = new Uint8Array(data);
    // remove PPM header (skip first 3 lines)
    let headerOffset = this.bytes.indexOf(10);
    headerOffset = this.bytes.indexOf(10, headerOffset + 1);
    headerOffset = this.bytes.indexOf(10, headerOffset + 1);
    this.bytes = this.bytes.slice(headerOffset + 1);

    /**
     * Returns the index in the bytes array at which a specific pixel is represented
     * @param x {number} x-coordinate of the required pixel (float in [0, 1])
     * @param y {number} y-coordinate of the required pixel (float in [0, 1])
     * @param index {number} index of the texture
     * @returns {number} index in the array where the pixel bytes are located
     */
    this.getTexelOffset = function(x, y, index) {
        return 12288 * index + 3 * ~~(64 * y) + 192 * ~~(64 * x);
    };
}


/**
 * Class representation of the level props (decorations, powerups, etc.)
 * @param x {number} starting x-coordinate on map
 * @param y {number} starting y-coordinate on map
 * @param index {number} index of texture to represent the prop
 * @constructor
 */
function Prop(x, y, index) {
    /**
     * Current x-coordinate on map
     * @type {number}
     */
    this.x = x;
    /**
     * Current y-coordinate on map
     * @type {number}
     */
    this.y = y;
    /**
     * Index of texture
     * @type {number}
     */
    this.index = index;

    /**
     * Update relative coordinates from player's perspective)
     * This method should be called when either the prop or the player moves
     */
    this.update = function() {
        /**
         * Relative x-coordinate in the player's reference frame
         * @type {number}
         */
        this.rx = this.x - player.x;
        /**
         * Relative y-coordinate in the player's reference frame
         * @type {number}
         */
        this.ry = this.y - player.y;
        let rx = this.rx * player.dx + this.ry * player.dy;
        this.ry = -this.rx * player.dy + this.ry * player.dx;
        this.rx = rx;
    }
}


/**
 * Class representation of the game player character
 * @param x {number} initial x-coordinate on map
 * @param y {number} initial y-coordinate on map
 * @param dx {number} facing direction (x-value)
 * @param dy {number} facing direction (y-value) (dx, dy) should be a unit vector
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
    this.speed = 0.1;
    /**
     * Turning speed
     * @type {number}
     */
    this.speed_a = 0.1;
    /**
     * Player radius (for collision detection)
     * @type {number}
     */
    this.radius = 0.4;
    /**
     * Field of vision
     * @type {number}
     */
    this.fov = 1;

    /**
     * Move forward
     * @param length {number} distance to move (use negative value to move backwards)
     */
    this.move = function(length) {
        if (isValidPosition(this.x + length * this.dx, this.y)) {
            this.x += length * this.dx;
        }
        if (isValidPosition(this.x, this.y + length * this.dy)) {
            this.y += length * this.dy;
        }
        updateThings();
    };

    /**
     * Turn right
     * @param alpha {number} angle in radians to rotate (use negative value to turn left)
     */
    this.turn = function(alpha) {
        let dx = this.dx * Math.cos(alpha) - this.dy * Math.sin(alpha);
        this.dy = this.dx * Math.sin(alpha) + this.dy * Math.cos(alpha);
        this.dx = dx;
        updateThings();
    };
}


/**
 * Asynchronously load a binary file
 * @param url {String} path to file
 * @param onload {function} callback to execute after loading
 */
function loadBytes(url, onload) {
    setupCounter += 1;
    let req = new XMLHttpRequest();
    req.onload = onload;
    req.open("GET", url);
    // request response is typed as an ArrayBuffer
    req.responseType = "arraybuffer";
    req.send();
}


/**
 * Loads common game resources (wall, surface and prop textures).
 * When all resources are loaded, the level is loaded.
 */
function loadResources() {
    /**
     * This function is called after each resource is loaded. If all resources are loaded, the level is loaded.
     */
    function checkReady() {
        if (wallTextures && surfaceTextures && propTextures) {
            loadLevel();
        }
    }

    loadBytes(
        "textures/walls.ppm",
        function () {
            wallTextures = new TileSet(this.response);
            checkReady();
        }
    );
    loadBytes(
        "textures/surfaces.ppm",
        function () {
            surfaceTextures = new TileSet(this.response);
            checkReady();
        }
    );
    loadBytes(
        "textures/props.ppm",
        function () {
            propTextures = new TileSet(this.response);
            checkReady();
        }
    );
}


/**
 * Loads the level map selected in the "select" element on the page.
 * When the map is loaded, the setup function is called.
 *
 * Note: the select element is disabled and reactivated so that it loses focus and doesn't interact with the key
 * presses detection (for player movement).
 */
function loadLevel() {
    let select = document.getElementById("level_select");
    select.disabled = true;
    loadBytes(
        "maps/" + select.value + ".map",
        function() {
            let bytes = new Uint8Array(this.response);
            plane0 = [];
            plane1 = [];
            for (let i = 0; i < 64; i++) {
                plane0.push(bytes.slice(64 * i, 64 * (i+1)));
                plane1.push(bytes.slice(4096 + 64 * i, 4096 + 64 * (i+1)));
            }
            plane2 = [];
            for (let i = 0; i < 64; i++) {
                let line = Array(64);
                line.fill(false);
                plane2.push(line);
            }
            setup();
        }
    );
    select.disabled = false;
}


/**
 * Prepares the level after the map is loaded (places props and the player)
 */
function setup() {
    // setup things
    things = [];
    doorTimers = [];
    for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
            // structural
            let m0 = plane0[y][x];
            if (m0 <= 63) {
                // wall
                plane2[y][x] = true;
            } else if (90 <= m0 && m0 <= 101) {
                // door
                plane2[y][x] = true;
            }

            // entities
            let m1 = plane1[y][x];
            if (m1 === 19) {
                player = new Player(x + .5, y + .5, 0, -1);
            } else if (m1 === 20) {
                player = new Player(x + .5, y + .5, 1, 0);
            } else if (m1 === 21) {
                player = new Player(x + .5, y + .5, 0, 1);
            } else if (m1 === 22) {
                player = new Player(x + .5, y + .5, -1, 0);
            } else if (m1 >= 23 && m1 <= 74) {
                // props
                things.push(new Prop(x + .5, y + .5, m1 - 21));
                if ([24, 25, 26, 28, 30, 31, 33, 34, 35, 36, 38, 39, 40, 41, 45, 58, 59, 60, 62, 63, 67, 68, 69,
                    71, 73].indexOf(m1) >= 0) {
                    // blocking prop
                    plane2[y][x] = true;
                }
            }
        }
    }

    updateThings();
    // if the draw loop hasn't started yet, start it
    if (!isDrawing) {
        isDrawing = true;
        window.requestAnimationFrame(draw);
    }
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

    // draw visible game elements
    drawWalls();
    drawThings();

    // update door timers
    for (let i = 0; i < doorTimers.length; i++) {
        let timer = doorTimers[i];
        timer.t += 1;
        if (timer.t >= 64) {
            plane2[timer.y][timer.x] = !plane2[timer.y][timer.x];
            doorTimers.splice(i, 1);
            i -= 1;
        }
    }

    context.putImageData(imageData, 0, 0);
    // call the draw function on next frame
    window.requestAnimationFrame(draw);
}


/**
 * Draw walls, ceiling and floor.
 * Drawing is done for each column, finding the corresponding wall and its distance to the player by ray casting, and
 * then completing by drawing ceiling and floor.
 */
function drawWalls() {
    for (let i = 0; i < pixelWidth; i++) {
        // cast a ray for each screen column
        let shift = player.fov * (2 * i - pixelWidth) / pixelWidth;    // current column position on the camera plane
        let rdx = player.dx - shift * player.dy;  // direction of the ray
        let rdy = player.dy + shift * player.dx;
        let sx = player.x + rdx;  // screen point coordinates in the direction of the ray
        let sy = player.y + rdy;
        let pix = ~~player.x;     // pix and piy are integers representing the cell position of the ray on the map
        let piy = ~~player.y;     // (starting from the player position)
        let pfx, pfy;       // pfx and pfy are the remaining fractional distance from the ray position to the next
                            // cell (0 < pfx, pfy <= 1)
        let stepx, stepy;   // direction in which the ray moves along each axis
        let t = 0;          // total time traveled by the ray

        // setup algorithm variables depending on ray directions
        if (rdx >= 0) {
            pfx = 1 - (player.x % 1);
            stepx = 1;
        } else {
            pfx = (player.x % 1);
            stepx = -1;
            rdx = -rdx;
        }
        if (rdy >= 0) {
            pfy = 1 - (player.y % 1);
            stepy = 1;
        } else {
            pfy = (player.y % 1);
            stepy = -1;
            rdy = -rdy;
        }

        let m0;
        let wx, wy; // coordinates of the wall hit by the ray
        let tx;     // position on the wall tile where the ray hit
        let textureIndex;   // index of tile to display

        while (true) {
            m0 = plane0[piy][pix];
            if (m0 <= 63) {
                // hit a wall
                if (pfy < 1) {
                    // NS wall
                    textureIndex = 2 * m0 - 1;
                    wx = stepx < 0 ? pix + 1 : pix;
                    wy = stepy < 0 ? piy + pfy : piy + 1 - pfy;
                    if (stepy * stepx > 0) {
                        // fix texture orientation depending on direction
                        tx = 1 - pfy;
                    } else {
                        tx = pfy;
                    }
                } else {
                    // EW wall
                    textureIndex = 2 * m0 - 2;
                    wx = stepx < 0 ? pix + pfx : pix + 1 - pfx;
                    wy = stepy < 0 ? piy + 1 : piy;
                    if (stepx * stepy < 0) {
                        // fix texture orientation depending on direction
                        tx = 1 - pfx;
                    } else {
                        tx = pfx;
                    }
                }
                break;
            } else if (m0 <= 101) {
                // hit a door

                // check if door is (partially) open
                let door_shift = 0;
                let timer = doorTimers.find(function(obj) {
                    return obj.x === pix && obj.y === piy;
                });
                if (timer) {
                    door_shift = timer.t / 64;
                }

                if (m0 % 2 === 0) {
                    // NS door (ray should be on vertical side so pfx == 1)
                    if (.5 * rdy >= pfy * rdx) {
                        // hit the side wall
                        let dt = pfy / rdy;
                        t += dt;
                        pfx -= dt * rdx;
                        wx = stepx < 0 ? pix + pfx: pix + 1 - pfx;
                        wy = stepy < 0 ? piy: piy + 1;
                        textureIndex = 100;
                        tx = stepx < 0 ? 1 - dt * rdx: dt * rdx;
                    } else {
                        // hit the door
                        let dt = .5 / rdx;
                        t += dt;
                        pfy -= dt * rdy;
                        pfx = .5;
                        wx = pix + .5;
                        wy = stepy < 0 ? piy + pfy : piy + 1 - pfy;
                        switch (m0) {
                            case 90:
                                textureIndex = 99;
                                break;
                            case 92:
                                textureIndex = 105;
                                break;
                            case 94:
                                textureIndex = 105;
                                break;
                            case 100:
                                textureIndex = 103;
                                break;
                        }
                        tx = stepy < 0 ? pfy : 1 - pfy;
                        tx -= door_shift;
                    }
                } else {
                    // EW door
                    if (.5 * rdx >= pfx * rdy) {
                        // hit the side wall
                        let dt = pfx / rdx;
                        t += dt;
                        pfy -= dt * rdy;
                        wy = stepy < 0 ? piy + 1 - dt * rdy: piy + dt * rdy;
                        wx = stepx < 0 ? pix : pix + 1;
                        textureIndex = 101;
                        tx = stepy < 0 ? 1 - dt * rdy: dt * rdy;
                    } else {
                        // hit the door
                        let dt = .5 / rdy;
                        t += dt;
                        pfx -= dt * rdx;
                        wy = piy + .5;
                        wx = stepx < 0 ? pix + pfx : pix + 1 - pfx;
                        switch (m0) {
                            case 91:
                                textureIndex = 98;
                                break;
                            case 93:
                                textureIndex = 104;
                                break;
                            case 95:
                                textureIndex = 104;
                                break;
                            case 101:
                                textureIndex = 102;
                                break;
                        }
                        tx = stepx < 0 ? pfx: 1 - pfx;
                        tx -=  door_shift;
                    }
                }
                break;
            }
            // move through map until hitting a wall
            if (pfx * rdy <= pfy * rdx) {
                // move to next cell horizontally
                let dt = pfx / rdx;
                t += dt;
                pfx = 1;
                pix += stepx;
                pfy -= dt * rdy;
            } else {
                // move to next cell vertically
                let dt = pfy / rdy;
                t += dt;
                pfy = 1;
                piy += stepy;
                pfx -= dt * rdx;
            }
        }

        let h = wallHeight / t; // height of the line representing the wall on the current column
        zIndex[i] = t;

        // draw pixels in current column
        for (let j = 0; j < pixelHeight; j++) {
            if (j <= pixelHeight / 2 - h) {
                // draw ceiling and floor
                let d = wallHeight / (pixelHeight / 2 - j);
                let fx = sx + (wx - sx) * (d - 1) / (t - 1);
                let fy = sy + (wy - sy) * (d - 1) / (t - 1);
                paintPixel(i, j, surfaceTextures, fx % 1, fy % 1, 1);
                paintPixel(i, pixelHeight - j, surfaceTextures, fx % 1, fy % 1, 0);
            } else if (j > pixelHeight / 2 + h) {
                break;
            } else {
                // draw wall
                paintPixel(i, j, wallTextures, tx, (j - (pixelHeight / 2 - h)) / (2 * h), textureIndex);
            }
        }
    }
}


/**
 * Update relative positions of all things in the player's reference frame
 */
function updateThings() {
    for (let i = 0; i < things.length; i++) {
        things[i].update();
    }
    things.sort((a, b) => b.rx - a.rx);
}


/**
 * Draw all things on screen from furthest to nearest
 */
function drawThings() {
    for (let k = 0; k < things.length; k++) {
        let t = things[k];
        if (t.rx <= 0) {
            return;
        }

        let th = 2 * wallHeight / t.rx;
        let tw = pixelWidth / ( 2 * player.fov * t.rx);
        let tx = ~~((t.ry / t.rx + player.fov) * pixelWidth / (2 * player.fov) - tw / 2);
        let ty = ~~((pixelHeight - th) / 2);
        for (let x = Math.max(tx, 0); x < Math.min(tx + tw, pixelWidth); x++) {
            if (t.rx < zIndex[x]) {
                for (let y = Math.max(ty, 0); y < Math.min(ty + th, pixelHeight); y++) {
                    paintPixel(x, y, propTextures, (x - tx) / tw, (y - ty) / th, t.index);
                }
            }
        }
    }
}


/**
 * Checks whether the player can go to the given location
 * @param x {number} x-coordinate of the position
 * @param y {number} y-coordinate of the position
 * @returns {boolean} whether the location is valid for the player
 */
function isValidPosition(x, y) {
    let r = player.radius;
    let fx = x % 1;
    x = ~~x;
    let fy = y % 1;
    y = ~~y;

    if (plane2[y][x]) return false;
    if (fx < r) {
        if (plane2[y][x - 1]) return false;
        if (fy < r && plane2[y - 1][x - 1]) return false;
        if (fy > 1 - r && plane2[y + 1][x - 1]) return false;
    }
    if (fx > 1 - r) {
        if (plane2[y][x + 1]) return false;
        if (fy < r && plane2[y - 1][x + 1]) return false;
        if (fy > 1 - r && plane2[y + 1][x + 1]) return false;
    }
    if (fy < r && plane2[y - 1][x]) return false;
    if (fy > 1 - r && plane2[y + 1][x]) return false;
    return true;
}


/**
 * Draws a pixel on the canvas by modifying the pixels array
 * @param x x-coordinate of the screen pixel to change
 * @param y y-coordinate of the screen pixel to change
 * @param tileSet tile set from which the pixel color should be taken
 * @param tx x-coordinate of tile pixel (float in [0, 1])
 * @param ty y-coordinate of tile pixel (float in [0, 1])
 * @param ti index of tile
 */
function paintPixel(x, y, tileSet, tx, ty, ti) {
    let bytes = tileSet.bytes;
    let offset = tileSet.getTexelOffset(tx, ty, ti);
    if (bytes[offset] !== 0xFF) {
        for (let i = 0; i < zoom; i++) {
            for (let j = 0; j < zoom; j++) {
                let pixelOffset = 4 * (pixelWidth * zoom * (zoom * y + j) + zoom * x + i);
                pixels[pixelOffset] = bytes[offset];
                pixels[pixelOffset + 1] = bytes[offset + 1];
                pixels[pixelOffset + 2] = bytes[offset + 2];
                pixels[pixelOffset + 3] = 255;
            }
        }
    }
}


/**
 * Prepares the necessary HTML elements on the page:
 * - the canvas and the underlying pixel buffer
 * - the monitored events
 */
function setupPage() {
    // canvas
    let canvas = document.getElementById("game_view");
    canvas.width = pixelWidth * zoom;
    canvas.height = pixelHeight * zoom;
    context = canvas.getContext("2d");
    imageData = context.getImageData(0, 0, pixelWidth * zoom, pixelHeight * zoom);
    pixels = imageData.data;

    // events
    document.onkeydown = function(e) { pressedKeys[e.key] = true; };
    document.onkeyup = function(e) { pressedKeys[e.key] = false; };
    document.onkeypress = function(e) {
        if (e.key === " ") {
            activate();
        }
    }
}


function activate() {
    let x = ~~player.x;
    let y = ~~player.y;
    if (Math.abs(player.dx) >= Math.abs(player.dy)) {
        x += player.dx >= 0 ? 1 : -1;
    } else {
        y += player.dy >= 0 ? 1 : -1;
    }
    let m0 = plane0[y][x];
    let m1 = plane1[y][x];
    if (90 <= m0 && m0 <= 101) {
        let timer = doorTimers.find(function(obj) {
            return obj.x === x && obj.y === y;
        });
        if (!timer) {
            doorTimers.push({x: x, y: y, t: 0});
        }
    }
}

setupPage();
loadResources();