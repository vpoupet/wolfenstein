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
 * Offset in the VSWAP.WL6 file where the first wall texture starts
 * @type {number}
 */
let wallTexturesOffset;
/**
 * Whether surface textures (ceiling and floor) should be displayed)
 */
let surfaceTexturesOn = false;
/**
 * Array of tiles for the sprites. The array is initially empty and filled lazily as sprites are needed.
 * The elements of the array are 4096 long arrays (64 x 64 pixels) containing palette indexes or undefined (transparent
 * pixels)
 * @type {Array}
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
 * DataViews of the level data from GAMEMAPS.WL6
 * @type {DataView}
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
 * DataView of rendered pixels
 * @type {DataView}
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
 * DataView containing the data from VSWAP.WL6
 * @type {DataView}
 */
let VSWAP;
/**
 * ArrayBuffers containing the data from MAPHEAD.WL6 and GAMEMAPS.WL6
 * @type {ArrayBuffer}
 */
let MAPHEAD, GAMEMAPS;
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


// *** Classes ***

/**
 * Class representation of a sprite animation
 * @param sprites {int[]} list of sprite indexes to animate
 * @param loop {boolean} whether the animation should loop
 * @constructor
 */
function Animation(sprites, loop=false) {
    this.sprites = sprites;
    this.spriteIndex = 0;
    this.timer = 0;
    this.loop = loop
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
    this.x = x + .5;
    /**
     * Position of the player on the map (y-coordinate)
     * @type {number}
     */
    this.y = y + .5;
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
     * Sprite index to display as player's weapon
     * @type {number}
     */
    this.weaponSprite = 421;
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

        if (plane2[x][y]) return false;
        if (fx < r) {
            if (plane2[x- 1][y]) return false;
            if (fy < r && plane2[x - 1][y - 1]) return false;
            if (fy > 1 - r && plane2[x - 1][y + 1]) return false;
        }
        if (fx > 1 - r) {
            if (plane2[x + 1][y]) return false;
            if (fy < r && plane2[x + 1][y - 1]) return false;
            if (fy > 1 - r && plane2[x + 1][y + 1]) return false;
        }
        if (fy < r && plane2[x][y - 1]) return false;
        if (fy > 1 - r && plane2[x][y + 1]) return false;
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

    /**
     * Activate a cell in front of the player (open/close door, push secret wall)
     */
    this.activate = function() {
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
        let m0 = map0(x, y);
        let m1 = map1(x, y);
        if (90 <= m0 && m0 <= 101) {
            // door
            let timer = doorTimers.find(function(obj) {
                return obj.x === x && obj.y === y;
            });
            if (!timer) {
                let opening = plane2[x][y];
                if (!opening) {
                    if ((dx > 0 && x - player.x <= player.radius) ||
                        (dx < 0 && player.x - x - 1 <= player.radius) ||
                        (dy > 0 && y - player.y <= player.radius) ||
                        (dy < 0 && player.y - y - 1<= player.radius)) {
                        // player is too close to the door, the door cannot close
                        return;
                    } else {
                        // the door closes (it becomes blocking immediately)
                        plane2[x][y] = true;
                    }
                }
                doorTimers.push({x: x, y: y, t: 0, opening: opening});
            }
        } else if (m1 === 98) {
            // pushwall
            let timer = wallTimers.find(function(obj) {
                return obj.x === x && obj.y === y;
            });
            if (!timer && map0(x + dx, y + dy) >= 106) {
                // there is no active timer for this wall, and it can move backwards
                wallTimers.push({x: x, y: y, t: 0, dx: dx, dy: dy, steps: 2});
            }
        }
    };

    /**
     * Shoot straight in front of the player (kills the first enemy in the line)
     */
    this.shoot = function() {
        if (!this.weaponAnimation) {
            this.weaponAnimation = new Animation([422, 423, 424, 425]);
            let d = zIndex[pixelWidth / 2];
            for (let i = things.length - 1; i >= 0; i--) {
                let t = things[i];
                if (t.rx < 0) {
                    continue;
                }
                if (t.rx >= d) {
                    break;
                }
                if (Math.abs(t.ry) <= .3 && t.alive) {
                    t.die();
                    return;
                }
            }
        }
    };

    this.update = function() {
        if (this.weaponAnimation) {
            let a = this.weaponAnimation;
            a.timer += 1;
            if (a.timer >= 6) {
                a.timer = 0;
                if (a.spriteIndex >= a.sprites.length - 1) {
                    this.weaponAnimation = undefined;
                    this.weaponSprite = 421;
                } else {
                    a.spriteIndex += 1;
                    this.weaponSprite = a.sprites[a.spriteIndex];
                }
            }
        }
    }
}


/**
 * Class representation of the level things (decorations, powerups, enemies, etc.)
 * @param x {number} starting x-coordinate on map
 * @param y {number} starting y-coordinate on map
 * @param spriteIndex {number} index of texture to represent the thing
 * @param orientable {boolean} whether the thing has different sprites depending on orientation
 * @constructor
 */
function Thing(x, y, spriteIndex, orientable=false) {
    /**
     * Current x-coordinate on map
     * @type {number}
     */
    this.x = x + .5;
    /**
     * Current y-coordinate on map
     * @type {number}
     */
    this.y = y + .5;
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
    this.startAnimation = function(animation) {
        this.animation = animation;
        this.spriteIndex = animation.sprites[0];
    };
    /**
     * Update necessary attributes each frame:
     * - relative coordinates from player's perspective
     * - possible animation values
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

        if (this.animation) {
            let a = this.animation;
            a.timer += 1;
            if (a.timer >= 8) {
                a.timer = 0;
                if (a.spriteIndex >= a.sprites.length - 1) {
                    if (a.loop) {
                        // animation loops
                        a.spriteIndex = 0;
                    } else {
                        // animation ended
                        this.animation = undefined;
                    }
                } else {
                    a.spriteIndex += 1;
                }
                this.spriteIndex = a.sprites[a.spriteIndex];
            }
        }
    }
}


/**
 * Class representation of game enemies
 * @param x {number} x-coordinate of the enemy
 * @param y {number} y-coordinate of the enemy
 * @param spriteIndex {number} index of the main sprite for the enemy (if the enemy is orientable, this is the index
 * of the first sprite (front)
 * @param deathSprites {number[]} sprite indexes of the enemy's dying animation
 * @param orientable {boolean} whether or not the enemy has different sprites depending on orientation
 * @param direction {number} facing direction (0: north, 1: east, 2: south, 3: west)
 * @constructor
 */
function Enemy(x, y, spriteIndex, deathSprites, orientable=false, direction=0) {
    Thing.call(this, x, y, spriteIndex, orientable);
    /**
     * List of sprite indexes of the enemy's dying animation
     * @type {number[]}
     */
    this.deathSprites = deathSprites;
    /**
     * Facing direction (0: North, 1: East, 2: South, 3: West)
     * @type {number}
     */
    this.direction = direction;
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
        this.startAnimation(new Animation(this.deathSprites));
    };
}


/**
 * Standard (brown) guard
 * @param x {number} x-coordinate
 * @param y {number} y-coordinate
 * @param direction {number} facing direction
 * @constructor
 */
function GuardEnemy(x, y, direction) {
    Enemy.call(this, x, y, 50, [90, 91, 92, 93, 95], true, direction);
}


/**
 * Dog
 * @param x {number} x-coordinate
 * @param y {number} y-coordinate
 * @param direction {number} facing direction
 * @constructor
 */
function DogEnemy(x, y, direction) {
    Enemy.call(this, x, y, 99, [131, 132, 133, 134], true, direction);
}


/**
 * SS (blue) soldier
 * @param x {number} x-coordinate
 * @param y {number} y-coordinate
 * @param direction {number} facing direction
 * @constructor
 */
function SSEnemy(x, y, direction) {
    Enemy.call(this, x, y, 138, [179, 180, 181, 183], true, direction);
}


/**
 * Zombie soldier (green)
 * @param x {number} x-coordinate
 * @param y {number} y-coordinate
 * @param direction {number} facing direction
 * @constructor
 */
function ZombieEnemy(x, y, direction) {
    Enemy.call(this, x, y, 187, [228, 229, 230, 232, 233], true, direction);
}


/**
 * Officer (white)
 * @param x {number} x-coordinate
 * @param y {number} y-coordinate
 * @param direction {number} facing direction
 * @constructor
 */
function OfficerEnemy(x, y, direction) {
    Enemy.call(this, x, y, 238, [279, 280, 281, 283, 284], true, direction);
}


/**
 * Hans Grösse (boss)
 * @param x {number} x-coordinate
 * @param y {number} y-coordinate
 * @constructor
 */
function HansEnemy(x, y) {
    Enemy.call(this, x, y, 300, [304, 305, 306, 303]);
}


/**
 * Doctor Schabbs (boss)
 * @param x {number} x-coordinate
 * @param y {number} y-coordinate
 * @constructor
 */
function SchabbsEnemy(x, y) {
    Enemy.call(this, x, y, 312, [313, 314, 315, 316]);
}


/**
 * Fake Hitler (flying mini-boss)
 * @param x {number} x-coordinate
 * @param y {number} y-coordinate
 * @constructor
 */
function FakeHitlerEnemy(x, y) {
    Enemy.call(this, x, y, 321, [328, 329, 330, 331, 332, 333]);
}


/**
 * Adolf Hitler (boss)
 * @param x {number} x-coordinate
 * @param y {number} y-coordinate
 * @constructor
 */
function HitlerEnemy(x, y) {
    Enemy.call(this, x, y, 349, [353, 354, 355, 356, 357, 358, 359, 352]);
}


/**
 * Otto Giftmacher (boss)
 * @param x {number} x-coordinate
 * @param y {number} y-coordinate
 * @constructor
 */
function OttoEnemy(x, y) {
    Enemy.call(this, x, y, 364, [366, 367, 368, 369]);
}


/**
 * Gretel Grösse (boss)
 * @param x {number} x-coordinate
 * @param y {number} y-coordinate
 * @constructor
 */
function GretelEnemy(x, y) {
    Enemy.call(this, x, y, 389, [393, 394, 395, 392]);
}


/**
 * General Fettgesicht (boss)
 * @param x {number} x-coordinate
 * @param y {number} y-coordinate
 * @constructor
 */
function FettgesichtEnemy(x, y) {
    Enemy.call(this, x, y, 400, [404, 405, 406, 407]);
}


/**
 * Decode a RLEW-encoded sequence of bytes
 * @param inView {DataView} RLEW-encoded data
 * @returns {DataView} decoded data
 */
function rlewDecode(inView) {
    let mapHeadView = new DataView(MAPHEAD);
    let rlewTag = mapHeadView.getUint16(0, true);
    let size = inView.getUint16(0, true);
    let buffer = new ArrayBuffer(size);
    let outView = new DataView(buffer);
    let inOffset = 2;
    let outOffset = 0;

    while (inOffset < inView.byteLength) {
        let w = inView.getUint16(inOffset, true);
        inOffset += 2;
        if (w === rlewTag) {
            let n = inView.getUint16(inOffset, true);
            let x = inView.getUint16(inOffset + 2, true);
            inOffset += 4;
            for (let i = 0; i < n; i++) {
                outView.setUint16(outOffset, x, true);
                outOffset += 2;
            }
        } else {
            outView.setUint16(outOffset, w, true);
            outOffset += 2;
        }
    }
    return outView;
}


/**
 * Decode a Carmack-encoded sequence of bytes
 * @param inView {DataView} Carmack-encoded data
 * @returns {DataView} decoded data
 */
function carmackDecode(inView) {
    let size = inView.getUint16(0, true);
    let buffer = new ArrayBuffer(size);
    let outView = new DataView(buffer);
    let inOffset = 2;
    let outOffset = 0;

    while (inOffset < inView.byteLength) {
        let x = inView.getUint8(inOffset + 1);
        if (x === 0xA7 || x === 0xA8) {
            // possibly a pointer
            let n = inView.getUint8(inOffset);
            if (n === 0) {
                // exception (not really a pointer)
                outView.setUint8(outOffset, inView.getUint8(inOffset + 2));
                outView.setUint8(outOffset + 1, x);
                inOffset += 3;
                outOffset += 2;
            } else if (x === 0xA7) {
                // near pointer
                let offset = 2 * inView.getUint8(inOffset + 2);
                for (let i = 0; i < n; i++) {
                    outView.setUint16(outOffset, outView.getUint16(outOffset - offset, true), true);
                    outOffset += 2;
                }
                inOffset += 3;
            } else {
                // far pointer
                let offset = 2 * inView.getUint16(inOffset + 2, true);
                for (let i = 0; i < n; i++) {
                    outView.setUint16(outOffset, outView.getUint16(offset + 2 * i, true), true);
                    outOffset += 2;
                }
                inOffset += 4
            }
        } else {
            // not a pointer
            outView.setUint16(outOffset, inView.getUint16(inOffset, true), true);
            inOffset += 2;
            outOffset += 2;
        }
    }
    return outView;
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
 * Load game data files:
 * - MAPHEAD.WL6: offsets to the map data for each level in GAMEMAPS.WL6
 * - GAMEMAPS.WL6: levels structure (walls, objects, enemies, etc.
 * - VSWAP.WL6: graphics (walls and sprites) and sounds
 * When all resources are loaded, the level is loaded.
 */
function loadResources() {
    /**
     * Check if all files are loaded. If so, load the level data.
     */
    function checkReady() {
        if (GAMEMAPS && MAPHEAD && VSWAP) {
            loadLevel();
        }
    }
    loadBytes(
        "GAMEMAPS.WL6",
        function() {
            GAMEMAPS = this.response;
            checkReady();
        }
    );
    loadBytes(
        "MAPHEAD.WL6",
        function() {
            MAPHEAD = this.response;
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
 * Loads the level map selected in the "select" element on the page.
 * When the map is loaded, the setup function is called.
 */
function loadLevel() {
    let select = document.getElementById("level_select");
    // the select element is disabled (and reactivated at the end) so that it loses focus and doesn't interact with
    // the key presses detection (for player movement).
    select.disabled = true;
    let level = parseInt(select.value);

    let mapHeadView = new DataView(MAPHEAD);
    let offset = mapHeadView.getUint32(2 + 4 * level, true);
    let mapHeader = new DataView(GAMEMAPS, offset, 42);
    let plane0View = new DataView(
        GAMEMAPS,
        mapHeader.getUint32(0, true),
        mapHeader.getUint16(12, true),
    );
    plane0 = rlewDecode(carmackDecode(plane0View));
    let plane1View = new DataView(
        GAMEMAPS,
        mapHeader.getUint32(4, true),
        mapHeader.getUint16(14, true),
    );
    plane1 = rlewDecode(carmackDecode(plane1View));
    plane2 = [] ;
    for (let i = 0; i < 64; i++) {
        let line = Array(64);
        line.fill(false);
        plane2.push(line);
    }
    setup();
    // reactivate the select element
    select.disabled = false;
}


/**
 * Prepare the level after the map is loaded:
 * - place things
 * - place the player
 * - make the plane2 array of blocking cells
 */
function setup() {
    // setup things
    things = [];
    doorTimers = [];
    wallTimers = [];
    animatedEnemies = [];
    spriteTextures = [];
    for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
            // structural
            let m0 = map0(x, y);
            if (m0 <= 63) {
                // wall
                plane2[x][y] = true;
            } else if (90 <= m0 && m0 <= 101) {
                // door
                plane2[x][y] = true;
            }
            // entities
            let m1 = map1(x, y);
            if (m1 === 19) {
                player = new Player(x, y, 0, -1);
            } else if (m1 === 20) {
                player = new Player(x, y, 1, 0);
            } else if (m1 === 21) {
                player = new Player(x, y, 0, 1);
            } else if (m1 === 22) {
                player = new Player(x, y, -1, 0);
            } else if (m1 >= 23 && m1 <= 74) {
                // props
                things.push(new Thing(x, y, m1 - 21));
                if ([24, 25, 26, 28, 30, 31, 33, 34, 35, 36, 38, 39, 40, 41, 45, 58, 59, 60, 62, 63, 67, 68, 69,
                    71, 73].indexOf(m1) >= 0) {
                    // blocking prop
                    plane2[x][y] = true;
                }
            } else if (m1 === 124) {
                // dead guard
                things.push(new Thing(x, y, 95));
            } else if (m1 >= 108) {
                // enemy
                if ((108 <= m1 && m1 < 116)) {
                    things.push(new GuardEnemy(x, y, (m1 - 108) % 4));
                } else if ((144 <= m1 && m1 < 152)) {
                    things.push(new GuardEnemy(x, y, (m1 - 144) % 4));
                } else if ((116 <= m1 && m1 < 124)) {
                    things.push(new OfficerEnemy(x, y, (m1 - 116) % 4));
                } else if ((152 <= m1 && m1 < 160)) {
                    things.push(new OfficerEnemy(x, y, (m1 - 152) % 4));
                } else if ((126 <= m1 && m1 < 134)) {
                    things.push(new SSEnemy(x, y, (m1 - 126) % 4));
                } else if ((162 <= m1 && m1 < 170)) {
                    things.push(new SSEnemy(x, y, (m1 - 162) % 4));
                } else if ((134 <= m1 && m1 < 142)) {
                    things.push(new DogEnemy(x, y, (m1 - 134) % 4));
                } else if ((170 <= m1 && m1 < 178)) {
                    things.push(new DogEnemy(x, y, (m1 - 170) % 4));
                } else if ((216 <= m1 && m1 < 224)) {
                    things.push(new ZombieEnemy(x, y, (m1 - 116) % 4));
                } else if ((234 <= m1 && m1 < 242)) {
                    things.push(new ZombieEnemy(x, y, (m1 - 144) % 4));
                } else if (m1 === 160) {
                    things.push(new FakeHitlerEnemy(x, y));
                } else if (m1 === 178) {
                    things.push(new HitlerEnemy(x, y));
                } else if (m1 === 179) {
                    things.push(new FettgesichtEnemy(x, y));
                } else if (m1 === 196) {
                    things.push(new SchabbsEnemy(x, y));
                } else if (m1 === 197) {
                    things.push(new GretelEnemy(x, y));
                } else if (m1 === 214) {
                    things.push(new HansEnemy(x, y));
                } else if (m1 === 215) {
                    things.push(new OttoEnemy(x, y));
                } else if (224 <= m1 && m1 < 228) {
                    // Ghost
                    let ghost = new Thing(x, y, 0);
                    let spriteIndex = 288 + 2 * (m1 - 224);
                    ghost.startAnimation(new Animation([spriteIndex, spriteIndex + 1], true));
                    things.push(ghost);
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


function map0(x, y) {
    return plane0.getUint16(2 * (x + 64 * y), true);
}

function setMap0(x, y, value) {
    plane0.setUint16(2 * (x + 64 * y), value, true);
}

function map1(x, y) {
    return plane1.getUint16(2 * (x + 64 * y), true);
}

function setMap1(x, y, value) {
    plane1.setUint16(2 * (x + 64 * y), value, true);
}


/**
 * Returns the palette index of a pixel from a wall texture
 * @param x {number} x-coordinate of the required pixel (float in [0, 1))
 * @param y {number} y-coordinate of the required pixel (float in [0, 1))
 * @param index {number} index of the wall texture
 * @returns {number} palette index of the corresponding pixel
 */
function getWallTexel(x, y, index) {
    return VSWAP.getUint8(wallTexturesOffset + 4096 * index + ~~(64 * y) + 64 * ~~(64 * x));
}


/**
 * Returns the palette index of a pixel from a sprite texture
 * @param x {number} x-coordinate of the required pixel (float in [0, 1))
 * @param y {number} y-coordinate of the required pixel (float in [0, 1))
 * @param index {number} index of the wall texture
 * @returns {number} palette index of the corresponding pixel
 */
function getSpriteTexel(x, y, index) {
    if (!spriteTextures[index]) {
        makeSprite(index);
    }
    return spriteTextures[index][~~(64 * y) + 64 * ~~(64 * x)];
}


/**
 * Decode a sprite image from the VSWAP.WL6 data file.
 * The decoded sprite is added to the spriteTextures array.
 * @param index {number} index of the sprite to decode
 */
function makeSprite(index) {
    let firstSprite = VSWAP.getUint16(2, true);
    let spriteOffset = VSWAP.getUint32(6 + 4 * (firstSprite + index), true);
    let firstCol = VSWAP.getUint16(spriteOffset, true);
    let lastCol = VSWAP.getUint16(spriteOffset + 2, true);
    let nbCol = lastCol - firstCol + 1;
    let pixelPoolOffset = spriteOffset + 4 + 2 * nbCol;
    let sprite = new Array(4096);
    for (let col = firstCol; col <= lastCol ; col++) {
        let colOffset = spriteOffset + VSWAP.getUint16(spriteOffset + 4 + 2 * (col - firstCol), true);
        while (true) {
            let endRow = VSWAP.getUint16(colOffset, true) / 2;
            if (endRow === 0) {
                break;
            }
            let startRow = VSWAP.getUint16(colOffset + 4, true) / 2;
            colOffset += 6;
            for (let row = startRow; row < endRow; row++) {
                sprite[64 * col + row] = VSWAP.getUint8(pixelPoolOffset);
                pixelPoolOffset += 1;
            }
        }
    }
    spriteTextures[index] = sprite;
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
                plane2[timer.x][timer.y] = false;
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
            let wallValue = map0(x, y);
            setMap0(x, y, map0(x + dx, y + dy));
            setMap0(x + dx, y + dy, wallValue);
            plane2[x][y] = false;
            plane2[x + dx][y + dy] = true;
            timer.steps -= 1;
            if (timer.steps > 0) {
                setMap1(x, y, 0);
                setMap1(x + dx, y + dy, 98);
                timer.t = 0;
                timer.x += dx;
                timer.y += dy;
            } else {
                setMap1(x, y, 0);
                doorTimers.splice(i, 1);
                i -= 1;
            }
        }
    }

    // update player
    player.update();

    // draw visible game elements
    drawWalls();
    drawThings();
    drawWeapon();

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
            m0 = map0(cx, cy);
            if (m0 <= 63) {
                // hit a wall
                let wallShift = 0;
                if (map1(cx, cy) === 98) {
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
                if (!plane2[cx][cy]) {
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
                // if (surfaceTexturesOn) {
                //     let d = wallHeight / (pixelHeight / 2 - j);
                //     let fx = sx + (rx - sx) * (d - 1) / (t - 1);
                //     let fy = sy + (ry - sy) * (d - 1) / (t - 1);
                //     let bytes = surfaceTextures.bytes;
                //     let offset = surfaceTextures.getTexelOffset(fx % 1, fy % 1, 1);
                //     drawPixel(i, j, bytes[offset], bytes[offset + 1], bytes[offset + 2]);
                //     offset = surfaceTextures.getTexelOffset(fx % 1, fy % 1, 0);
                //     drawPixel(i, pixelHeight - j, bytes[offset], bytes[offset + 1], bytes[offset + 2]);
                // } else {
                    // draw ceiling and floor (plain color, as in original game)
                    drawPixel(i, j, 29);
                    drawPixel(i, pixelHeight - 1 - j, 25);
                // }
            } else if (j > pixelHeight / 2 + h) {
                break;
            } else {
                drawPixel(i, j, getWallTexel(tx, (j - (pixelHeight / 2 - h)) / (2 * h), textureIndex));
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
                    drawPixel(x, y, getSpriteTexel((x - tx) / tw, (y - ty) / th, t.spriteIndex + angle));
                }
            }
        }
    }
}


function drawWeapon() {
    if (!spriteTextures[player.weaponSprite]) {
        makeSprite(player.weaponSprite);
    }
    for (let x = 0; x < 64; x++) {
        for (let y = 0; y < 64; y++) {
            drawPixel(x + 48, y + 36, spriteTextures[player.weaponSprite][64 * x + y], 4 / zoom);
        }
    }
}


/**
 * Draws a pixel on the canvas by modifying the pixels array
 * @param x {number} x-coordinate of the screen pixel to change
 * @param y {number} y-coordinate of the screen pixel to change
 * @param col {number} palette index of color
 */
function drawPixel(x, y, col, scale=1) {
    scale *= zoom;
    if (col === undefined) {
        return;
    }
    for (let i = 0; i < scale; i++) {
        for (let j = 0; j < scale; j++) {
            let pixelOffset = 4 * (zoom * pixelWidth * (scale * y + j) + scale * x + i);
            pixels.setUint32(pixelOffset, palette[col], true);
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
    imageData = new ImageData(pixelWidth * zoom, pixelHeight * zoom);
    pixels = new DataView(imageData.data.buffer);

    document.onkeydown = function(e) {
        if (e.key === "Control") { player.shoot(); }
        pressedKeys[e.key] = true;
    };
    document.onkeyup = function(e) { pressedKeys[e.key] = false; };
    document.onkeypress = function(e) {
        if (e.key === " ") {
            player.activate();
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


setupPage();
loadResources();
