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
 * Whether surface textures (ceiling and floor) should be displayed)
 */
let surfaceTexturesOn = true;
/**
 * TileSet instance containing textures for the props
 * @type {TileSet}
 */
let spriteTextures;
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
 * - opening: boolean indicating if the door is opening (true) or closing (false)
 * - t: counter since door was open
 */
let doorTimers;
/**
 * Array of wall timers for secret passages being active (moving)
 * The elements in the array are objects with attributes
 * - x: the x-coordinate of the wall
 * - y: the y-coordinate of the wall
 * - t: time counter since the wall started moving
 * - dx, dy: indicate the direction in which the wall is moving (unit vector)
 */
let wallTimers;
/**
 * Array of enemies currently in an animation (animation ends when index reaches animationIndex)
 */
let animatedEnemies;
/**
 * Currently tracked touch event (if any)
 */
let currentTouch;


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
 * Class representation of the level things (decorations, powerups, enemies, etc.)
 * @param x {number} starting x-coordinate on map
 * @param y {number} starting y-coordinate on map
 * @param spriteIndex {number} index of texture to represent the thing
 * @constructor
 */
function Thing(x, y, spriteIndex, orientable=false) {
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
     * Index of sprite texture
     * @type {number}
     */
    this.spriteIndex = spriteIndex;
    /**
     * Whether the thing has different sprites depending on orientation
     * @type {boolean}
     */
    this.orientable = orientable;
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
 * Class representation of game enemies
 * @param x {number} x-coordinate of the enemy
 * @param y {number} y-coordinate of the enemy
 * @param spriteIndex {number} index of the main sprite for the enemy (if the enemy is orientable, this is the index
 * of the first sprite (front)
 * @param dieEndIndex {number} index of the sprite that represents the enemy dead
 * @param orientable {boolean} whether or not the enemy has different sprites depending on orientation
 * @param direction {number} facing direction (0: north, 1: east, 2: south, 3: west)
 * @constructor
 */
function Enemy(x, y, spriteIndex, dieEndIndex, orientable=false, direction=0) {
    Thing.call(this, x, y, spriteIndex, orientable);
    /**
     * Index of first sprite in dying animation
     * @type {number}
     */
    this.dieStartIndex = orientable ? spriteIndex + 8 : spriteIndex + 1;
    /**
     * Index of last sprite in dying animation
     * @type {number}
     */
    this.dieEndIndex = dieEndIndex;
    /**
     * Facing direction (0: North, 1: East, 2: South, 3: West)
     * @type {number}
     */
    this.direction = direction;
    /**
     * Frame counter for animations (couter is incremented each frame)
     * @type {number}
     */
    this.animationCounter = 0;
    /**
     * Index of last sprite in current animation
     * @type {number}
     */
    this.animationEndIndex = 0;
    /**
     * Whether the enemy is currently alive
     * @type {boolean}
     */
    this.alive = true;

    /**
     * Kill the enemy and start its dying animation
     */
    this.die = function() {
        this.alive = false;
        this.orientable = false;
        this.spriteIndex = this.dieStartIndex;
        this.animationCounter = 0;
        this.animationEndIndex = this.dieEndIndex;
        animatedEnemies.push(this);
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
        if (wallTextures && surfaceTextures && spriteTextures) {
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
        "textures/sprites.ppm",
        function () {
            spriteTextures = new TileSet(this.response);
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
    wallTimers = [];
    animatedEnemies = [];
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
                things.push(new Thing(x + .5, y + .5, m1 - 21));
                if ([24, 25, 26, 28, 30, 31, 33, 34, 35, 36, 38, 39, 40, 41, 45, 58, 59, 60, 62, 63, 67, 68, 69,
                    71, 73].indexOf(m1) >= 0) {
                    // blocking prop
                    plane2[y][x] = true;
                }
            } else if (m1 === 124) {
                // dead guard
                things.push(new Thing(x + .5, y + .5, 62));
            } else if (m1 >= 108) {
                // enemy
                if ((108 <= m1 && m1 < 116)) {  // Guard
                    things.push(new Enemy(x + .5, y + .5, 50, 62, true, (m1 - 108) % 4));
                } else if ((144 <= m1 && m1 < 152)) {
                    things.push(new Enemy(x + .5, y + .5, 50, 62, true, (m1 - 144) % 4));

                } else if ((116 <= m1 && m1 < 124)) {   // Officer
                    things.push(new Enemy(x + .5, y + .5, 100, 112, true, (m1 - 116) % 4));
                } else if ((152 <= m1 && m1 < 160)) {
                    things.push(new Enemy(x + .5, y + .5, 100, 112, true, (m1 - 152) % 4));

                } else if ((126 <= m1 && m1 < 134)) {   // SS
                    things.push(new Enemy(x + .5, y + .5, 75, 86, true, (m1 - 126) % 4));
                } else if ((162 <= m1 && m1 < 170)) {
                    things.push(new Enemy(x + .5, y + .5, 75, 86, true, (m1 - 162) % 4));

                } else if ((134 <= m1 && m1 < 142)) {   // Dog
                    things.push(new Enemy(x + .5, y + .5, 63, 74, true, (m1 - 134) % 4));
                } else if ((170 <= m1 && m1 < 178)) {
                    things.push(new Enemy(x + .5, y + .5, 63, 74, true, (m1 - 170) % 4));

                } else if ((216 <= m1 && m1 < 224)) {   // Mutant
                    things.push(new Enemy(x + .5, y + .5, 87, 99, true, (m1 - 116) % 4));
                } else if ((234 <= m1 && m1 < 242)) {
                    things.push(new Enemy(x + .5, y + .5, 87, 99, true, (m1 - 144) % 4));

                } else if (m1 === 160) {
                    // fake Hitler
                    things.push(new Enemy(x + .5, y + .5, 127, 133, false));
                } else if (m1 === 178) {
                    // Adolf Hitler
                    things.push(new Enemy(x + .5, y + .5, 134, 142, false));
                } else if (m1 === 179) {
                    // General Fettgesicht
                    things.push(new Enemy(x + .5, y + .5, 153, 157, false));
                } else if (m1 === 196) {
                    // Doctor Schabbs
                    things.push(new Enemy(x + .5, y + .5, 122, 126, false));
                } else if (m1 === 197) {
                    // Gretel Grösse
                    things.push(new Enemy(x + .5, y + .5, 148, 152, false));
                } else if (m1 === 214) {
                    // Hans Grösse
                    things.push(new Enemy(x + .5, y + .5, 117, 121, false));
                } else if (m1 === 215) {
                    // Otto Giftmacher
                    things.push(new Enemy(x + .5, y + .5, 143, 147, false));
                } else if (224 <= m1 && m1 < 228) {
                    // Ghost
                    things.push(new Thing(x + .5, y + .5, 113 + m1 - 224));
                }
            }
        }
    }

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

    // update things
    for (let i = 0; i < things.length; i++) {
        things[i].update();
    }
    things.sort((a, b) => b.rx - a.rx);

    // update door timers
    for (let i = 0; i < doorTimers.length; i++) {
        let timer = doorTimers[i];
        timer.t += 1;
        if (timer.t >= 64) {
            doorTimers.splice(i, 1);    // remove the timer
            i -= 1; // adjust loop index to compensate for item removal
            if (timer.opening) {
                plane2[timer.y][timer.x] = false;
            }
        }
    }

    // update wall timers
    for (let i = 0; i < wallTimers.length; i++) {
        let timer = wallTimers[i];
        timer.t += 1;
        if (timer.t === 64) {
            let x = timer.x;
            let y = timer.y;
            let dx = timer.dx;
            let dy = timer.dy;
            let wallValue = plane0[y][x];
            plane0[y][x] = plane0[y + dy][x + dx];
            plane0[y + dy][x + dx] = wallValue;
            plane2[y][x] = false;
            plane2[y + dy][x + dx] = true;
            timer.steps -= 1;
            if (timer.steps > 0) {
                plane1[y][x] = 0;
                plane1[y + dy][x + dx] = 98;
                timer.t = 0;
                timer.x += dx;
                timer.y += dy;
            } else {
                plane1[y][x] = 0;
                doorTimers.splice(i, 1);
                i -= 1;
            }
        }
    }

    // update animated enemies
    for (let i = 0; i < animatedEnemies.length; i++) {
        let e = animatedEnemies[i];
        e.animationCounter += 1;
        if (e.animationCounter >= 8) {
            e.spriteIndex += 1;
            e.animationCounter = 0;
        }
        if (e.spriteIndex >= e.animationEndIndex) {
            animatedEnemies.splice(i, 1);
            i -= 1;
        }
    }

    // draw visible game elements
    let bgWidth = pixelWidth * zoom;
    let bgHeight = pixelHeight * zoom / 2;
    context.fillStyle = 'rgb(56, 56, 56)';
    context.fillRect(0, 0, bgWidth, bgHeight);
    context.fillStyle = 'rgb(113, 113, 113)';
    context.fillRect(0, bgHeight, bgWidth, bgHeight);
    drawWalls();
    drawThings();

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

        // current column position on the camera plane
        let shift = player.fov * (2 * i - pixelWidth) / pixelWidth;
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

        // location of the ray collision on a solid surface
        let rx, ry;
        // total time traveled by the ray
        let t = 0;
        // plane0 value of the cell visited by the ray
        let m0;
        // coordinate on the wall tile where the ray hit (0 <= tx <= 1)
        let tx;
        // index of tile to display
        let textureIndex;

        while (true) {
            m0 = plane0[cy][cx];
            if (m0 <= 63) {
                // hit a wall
                let wallShift = 0;
                if (plane1[cy][cx] === 98) {
                    // pushwall
                    let timer = wallTimers.find(function(obj) { return obj.x === cx && obj.y === cy; });
                    if (timer) {
                        wallShift = timer.t / 64;
                        if (timer.dx !== 0) {
                            // wall moves horizontally
                            if (rdx * rfy >= rdy * wallShift) {
                                // ray hits wall
                                let dt = wallShift / rdx;
                                t += dt;
                                rfy -= dt * rdy;
                                rfx -= wallShift;
                            } else {
                                // ray moves to next cell
                                let dt = rfy / rdy;
                                t += dt;
                                rfy = 1;
                                cy += stepy;
                                rfx -= dt * rdx;
                                continue;
                            }
                        } else {
                            // wall moves vertically
                            if (rdy * rfx >= rdx * wallShift) {
                                // ray hits wall
                                let dt = wallShift / rdy;
                                t += dt;
                                rfx -= dt * rdx;
                                rfy -= wallShift;
                            } else {
                                // ray moves to next cell
                                let dt = rfx / rdx;
                                t += dt;
                                rfx = 1;
                                cx += stepx;
                                rfy -= dt * rdy;
                                continue;
                            }
                        }
                    }
                }
                if (rfx === 1 - wallShift) {
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
            } else if (m0 <= 101) {
                // hit a door

                // check if door has an associated timer
                let doorShift = 0;
                let timer = doorTimers.find(function(obj) { return obj.x === cx && obj.y === cy; });
                if (timer) {
                    if (timer.opening) {
                        doorShift = timer.t / 64;
                    } else {
                        doorShift = 1 - timer.t / 64;
                    }
                }
                if (!plane2[cy][cx]) {
                    doorShift = 1;
                }

                if (m0 % 2 === 0) {
                    // NS door
                    if (rfx >= .5 && (rfx - .5) * rdy < rfy * rdx) {
                        // ray hits the central door line
                        let dt = (rfx - .5) / rdx;
                        t += dt;
                        rfy -= dt * rdy;
                        rfx = .5;
                        tx = stepy > 0 ? 1 - rfy : rfy;
                        tx -= doorShift;
                        if (tx >= 0) {
                            // ray hits the door
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
                            break;
                        }
                    }
                    if (rfx * rdy >= rfy * rdx) {
                        // hit the side wall
                        let dt = rfy / rdy;
                        t += dt;
                        rfx -= dt * rdx;
                        rfy = 1;
                        cy += stepy;
                        textureIndex = 100;
                        tx = stepx > 0 ? 1 - rfx: rfx;
                        break;
                    } else {
                        // pass through
                        let dt = rfx / rdx;
                        t += dt;
                        rfy -= dt * rdy;
                        rfx = 1;
                        cx += stepx;
                    }
                } else {
                    // EW door
                    if (rfy >= .5 && (rfy - .5) * rdx < rfx * rdy) {
                        // ray hits the central door line
                        let dt = (rfy - .5) / rdy;
                        t += dt;
                        rfx -= dt * rdx;
                        rfy = .5;
                        tx = stepx > 0 ? 1 - rfx : rfx;
                        tx -= doorShift;
                        if (tx >= 0) {
                            // ray hits the door
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
                            break;
                        }
                    }
                    if (rfy * rdx >= rfx * rdy) {
                        // hit the side wall
                        let dt = rfx / rdx;
                        t += dt;
                        rfy -= dt * rdy;
                        rfx = 1;
                        cx += stepx;
                        textureIndex = 101;
                        tx = stepy > 0 ? 1 - rfy: rfy;
                        break;
                    } else {
                        // pass through
                        let dt = rfy / rdy;
                        t += dt;
                        rfx -= dt * rdx;
                        rfy = 1;
                        cy += stepy;
                    }
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
        rx = stepx > 0 ? cx + 1 - rfx : cx + rfx;
        ry = stepy > 0 ? cy + 1 - rfy : cy + rfy;
        let h = wallHeight / t; // height of the line representing the wall on the current column
        zIndex[i] = t;

        // draw pixels in current column
        for (let j = 0; j < pixelHeight; j++) {
            if (j <= pixelHeight / 2 - h) {
                // draw ceiling and floor
                if (surfaceTexturesOn) {
                    let d = wallHeight / (pixelHeight / 2 - j);
                    let fx = sx + (rx - sx) * (d - 1) / (t - 1);
                    let fy = sy + (ry - sy) * (d - 1) / (t - 1);
                    let bytes = surfaceTextures.bytes;
                    let offset = surfaceTextures.getTexelOffset(fx % 1, fy % 1, 1);
                    drawPixel(i, j, bytes[offset], bytes[offset + 1], bytes[offset + 2]);
                    offset = surfaceTextures.getTexelOffset(fx % 1, fy % 1, 0);
                    drawPixel(i, pixelHeight - j, bytes[offset], bytes[offset + 1], bytes[offset + 2]);
                } else {
                    // draw ceiling and floor (plain color, as in original game)
                    drawPixel(i, j, 56, 56, 56);
                    drawPixel(i, pixelHeight - j, 113, 113, 113);
                }
            } else if (j > pixelHeight / 2 + h) {
                break;
            } else {
                // draw wall
                let bytes = wallTextures.bytes;
                let offset = wallTextures.getTexelOffset(tx, (j - (pixelHeight / 2 - h)) / (2 * h), textureIndex);
                drawPixel(i, j, bytes[offset], bytes[offset + 1], bytes[offset + 2]);
                // paintPixel(i, j, wallTextures, tx, (j - (pixelHeight / 2 - h)) / (2 * h), textureIndex);
            }
        }
    }
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
        let angle = 0;
        if (t.orientable) {
            angle = (~~(-4 * Math.atan2(t.y - player.y, t.x - player.x) / Math.PI + 12.5) - 2 * t.direction) % 8;
        }

        for (let x = Math.max(tx, 0); x < Math.min(tx + tw, pixelWidth); x++) {
            if (t.rx < zIndex[x]) {
                for (let y = Math.max(ty, 0); y < Math.min(ty + th, pixelHeight); y++) {
                    let bytes = spriteTextures.bytes;
                    let offset = spriteTextures.getTexelOffset((x - tx) / tw, (y - ty) / th, t.spriteIndex + angle);
                    drawPixel(x, y, bytes[offset], bytes[offset + 1], bytes[offset + 2]);
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
 * @param r red component
 * @param g red component
 * @param b red component
 * Note: if r is 255, the pixel is not drawn (used for transparency effects)
 */
function drawPixel(x, y, r, g, b) {
    if (r === 255) {
        return;
    }
    for (let i = 0; i < zoom; i++) {
        for (let j = 0; j < zoom; j++) {
            let pixelOffset = 4 * (pixelWidth * zoom * (zoom * y + j) + zoom * x + i);
            pixels[pixelOffset] = r;
            pixels[pixelOffset + 1] = g;
            pixels[pixelOffset + 2] = b;
            pixels[pixelOffset + 3] = 255;
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

    canvas.addEventListener("touchstart", handleTouchStart, false);
    canvas.addEventListener("touchmove", handleTouchMove, false);
    canvas.addEventListener("touchend", handleTouchEnd, false);
    canvas.addEventListener("touchcancel", handleTouchEnd, false);
    canvas.addEventListener("click", activate, false);

    document.onkeydown = function(e) {
        if (e.key === "Control") { shoot(); }
        pressedKeys[e.key] = true;
    };
    document.onkeyup = function(e) { pressedKeys[e.key] = false; };
    document.onkeypress = function(e) {
        if (e.key === " ") {
            activate();
        }
    }
}


/**
 * Activates a cell in front of the player (open/close door, push secret wall)
 */
function activate() {
    let x = ~~player.x;
    let y = ~~player.y;
    let dx = 0;
    let dy = 0;
    if (Math.abs(player.dx) >= Math.abs(player.dy)) {
        dx = player.dx >= 0 ? 1 : -1;
        x += dx;
    } else {
        dy = player.dy >= 0 ? 1 : -1;
        y += dy;
    }
    let m0 = plane0[y][x];
    let m1 = plane1[y][x];
    if (90 <= m0 && m0 <= 101) {
        // door
        let timer = doorTimers.find(function(obj) {
            return obj.x === x && obj.y === y;
        });
        if (!timer) {
            let opening = plane2[y][x];
            doorTimers.push({x: x, y: y, t: 0, opening: opening});
            if (!opening) {
                // if door is closing make it blocking immediately
                plane2[y][x] = true;
            }
        }
    } else if (m1 === 98) {
        // pushwall
        let timer = wallTimers.find(function(obj) {
            return obj.x === x && obj.y === y;
        });
        if (!timer && plane0[y + dy][x + dx] >= 106) {
            // there is no active timer for this wall, and it can move backwards
            wallTimers.push({x: x, y: y, t: 0, dx: dx, dy: dy, steps: 2});
        }
    }
}


/**
 * Toggles between 320 x 200 (zoom x2) and 640 x 400 (zoom x1) resolutions
 */
function toggleResolution() {
    let button = document.getElementById("resolutionButton");
    button.disabled = true;
    if (zoom === 1) {
        pixelHeight = 200;
        pixelWidth = 320;
        zoom = 2;
        wallHeight = 80;
        button.innerHTML = "320 x 200";
    } else {
        pixelHeight = 400;
        pixelWidth = 640;
        zoom = 1;
        wallHeight = 160;
        button.innerHTML = "640 x 400";
    }
    button.disabled = false;
}


/**
 * Toggles ceiling and floor textures on or off
 */
function toggleSurfaceTextures() {
    let button = document.getElementById("surfaceButton");
    button.disabled = true;
    surfaceTexturesOn = !surfaceTexturesOn;
    if (surfaceTexturesOn) {
        button.innerHTML = "On";
    } else {
        button.innerHTML = "Off";
    }
    button.disabled = false;
}


/**
 * Start tracking a touch event
 * @param e touch event
 */
function handleTouchStart(e) {
    if (currentTouch === undefined) {
        currentTouch = e.changedTouches[0];
    }
}


/**
 * Track a moving touch event
 * @param e touch event
 */
function handleTouchMove(e) {
    e.preventDefault();
    if (currentTouch) {
        let touch;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === currentTouch.identifier) {
                touch = e.changedTouches[i];
                break;
            }
        }
        if (touch) {
            player.move(0.01 * (touch.screenY - currentTouch.screenY));
            player.turn(-0.005 * (touch.screenX - currentTouch.screenX));
            currentTouch = touch;
        }
    }
}


/**
 * Stop tracking a touch event
 * @param e touch event
 */
function handleTouchEnd(e) {
    e.preventDefault();
    if (currentTouch) {
        let touch;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === currentTouch.identifier) {
                touch = e.changedTouches[i];
                break;
            }
        }
        if (touch) {
            activate();
            currentTouch = undefined;
        }
    }
}


function shoot() {
    let d = zIndex[pixelWidth / 2];
    for (let i = things.length - 1; i >= 0; i--) {
        let t = things[i];
        if (t.rx < 0) { continue; }
        if (t.rx >= d) { break; }
        if (t instanceof Enemy && Math.abs(t.ry) <= .5 && t.alive) {
            t.die();
            return;
        }
    }
}



setupPage();
loadResources();