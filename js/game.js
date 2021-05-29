/**
 * Representation of the player character
 * @type {Player}
 */
let player;
/**
 * Index of current level
 * @type {number}
 */
let currentLevel;
/**
 * Dictionary containing scoring elements:
 * - kills (count and total)
 * - treasures (count and total)
 * - secrets (count and total)
 */
let score;
/**
 * Things in the level (sprites, enemies, powerups, etc.)
 * @type {Array}
 */
let things;
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

let opponentPlayers = {};

/**
 * Class representation of the game player character
 * @constructor
 */
function Player() {
    /**
     * Position of the player on the map (x-coordinate)
     * @type {number}
     */
    this.x = 0;
    /**
     * Position of the player on the map (y-coordinate)
     * @type {number}
     */
    this.y = 0;
    /**
     * Player facing direction (x-value)
     * @type {number}
     */
    this.dx = 0;
    /**
     * Player facing direction (y-value)
     * @type {number}
     */
    this.dy = 0;
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
     * Sprite index to display as player's weapon
     * @type {number}
     */
    this.weaponSprite = 421;
    /**
     * Whether the player has collected the silver key
     * @type {boolean}
     */
    this.silverKey = false;
    /**
     * Whether the player has collected the gold key
     * @type {boolean}
     */
    this.goldKey = false;
    /**
     * Whether the player should move forward on next frame
     * @type {boolean}
     */
    this.moveForward = false;
    /**
     * Whether the player should move backward on next frame
     * @type {boolean}
     */
    this.moveBackward = false;
    /**
     * Whether the player should strafe left on next frame
     * @type {boolean}
     */
    this.strafeLeft = false;
    /**
     * Whether the player should strafe right on next frame
     * @type {boolean}
     */
    this.strafeRight = false;
    /**
     * Whether the player should turn to the left on next frame
     * @type {boolean}
     */
    this.turnLeft = false;
    /**
     * Whether the player should turn to the right on next frame
     * @type {boolean}
     */
    this.turnRight = false;
    /**
     * Angle by which the player should turn on next frame (normalized, will be multiplied by `this.speed_a`)
     * @type {number}
     */
    this.turnAngle = 0;
    /**
     * Check whether the player can go to the given location
     * @param x {number} x-coordinate of the position
     * @param y {number} y-coordinate of the position
     * @returns {boolean} whether the location is valid for the player
     */
    this.canMoveTo = function (x, y) {
        let r = this.radius;
        let fx = x % 1;
        x = ~~x;
        let fy = y % 1;
        y = ~~y;

        if (plane2[x][y]) return false;
        if (fx < r) {
            if (plane2[x - 1][y]) return false;
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
     * @param sideways {number} distance to move towards the right (strafe)
     */
    this.move = function (length, sideways = 0) {
        let oldx = ~~this.x;
        let oldy = ~~this.y;
        let x = this.x + this.dx * length - this.dy * sideways;
        let y = this.y + this.dy * length + this.dx * sideways;
        if (this.canMoveTo(x, this.y)) {
            this.x = x;
        }
        if (this.canMoveTo(this.x, y)) {
            this.y = y;
        }
        let newx = ~~this.x;
        let newy = ~~this.y;
        if (newx !== oldx || newy !== oldy) {
            player.collect(newx, newy);
            shouldDrawMap = true;
        }
    };

    /**
     * Turn right
     * @param alpha {number} angle in radians to rotate (use negative value to turn left)
     */
    this.turn = function (alpha) {
        let dx = this.dx * Math.cos(alpha) - this.dy * Math.sin(alpha);
        this.dy = this.dx * Math.sin(alpha) + this.dy * Math.cos(alpha);
        this.dx = dx;
    };

    /**
     * Activate a cell in front of the player (open/close door, push secret wall)
     */
    this.activate = function () {
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
        if (m0 === 21 && dx !== 0) {
            // elevator
            loadNextLevel();
        }
        if (90 <= m0 && m0 <= 101) {
            // door
            if ((m0 === 92 || m0 === 93) && !player.goldKey) {
                // gold-locked door
                return;
            }
            if ((m0 === 94 || m0 === 95) && !player.silverKey) {
                // silver-locked door
                return;
            }
            let timer = doorTimers.find(function (obj) {
                return obj.x === x && obj.y === y;
            });
            if (!timer) {
                let opening = plane2[x][y];
                if (!opening) {
                    if ((dx > 0 && x - player.x <= player.radius) ||
                        (dx < 0 && player.x - x - 1 <= player.radius) ||
                        (dy > 0 && y - player.y <= player.radius) ||
                        (dy < 0 && player.y - y - 1 <= player.radius)) {
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
            let timer = wallTimers.find(function (obj) {
                return obj.x === x && obj.y === y;
            });
            if (!timer && map0(x + dx, y + dy) >= 106) {
                // there is no active timer for this wall, and it can move backwards
                wallTimers.push({x: x, y: y, t: 0, dx: dx, dy: dy, steps: 2});
                score.secrets += 1;
                updateScore();
            }
        }
    };

    /**
     * Make the player collect collectibles on a given cell
     * @param x {number} integer x-coordinate of the cell
     * @param y {number} integer y-coordinate of the cell
     */
    this.collect = function (x, y) {
        for (let i = 0; i < things.length; i++) {
            let t = things[i];
            if (t.collectible && t.x === x + .5 && t.y === y + .5) {
                if (31 <= t.spriteIndex && t.spriteIndex <= 35) {
                    // treasure or 1up
                    score.treasures += 1;
                    flash = new Flash(.5, .5, 0);  // yellow flash for treasures
                    updateScore();
                } else {
                    // other collectible (ammo, weapon, food or key)
                    flash = new Flash(.5, .5, .5);  // white flash for other collectibles
                    if (t.spriteIndex === 22) {
                        // gold key
                        player.goldKey = true;
                        updateScore();
                    } else if (t.spriteIndex === 23) {
                        // silver key
                        player.silverKey = true;
                        updateScore();
                    }
                }
                things.splice(i, 1);
                i -= 1;
            }
        }
    };

    /**
     * Shoot straight in front of the player (kills the first enemy in the line)
     */
    this.shoot = function () {
        if (this.weaponAnimation === undefined) {
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
                    flash = new Flash(.5, 0, 0);
                    t.die();
                    return;
                }
            }
        }
    };

    this.update = function () {
        let changed = false;
        let movement = new Set();
        for (let key in keymap) {
            if (pressedKeys[key]) {
                movement.add(keymap[key]);
            }
        }
        // update player direction
        if (movement.has('turnRight')) {
            this.turnAngle += 1;
        }
        if (movement.has('turnLeft')) {
            this.turnAngle -= 1;
        }
        if (this.turnAngle !== 0) {
            player.turn(this.turnAngle * this.speed_a);
            this.turnAngle = 0;
            changed = true;
        }
        // update player position
        let forward = 0;
        let sideways = 0;
        if (movement.has('moveForward')) {
            forward += this.speed;
        }
        if (movement.has('moveBackward')) {
            forward -= this.speed;
        }
        if (movement.has('strafeLeft')) {
            sideways -= this.speed;
        }
        if (movement.has('strafeRight')) {
            sideways += this.speed;
        }
        if (forward !== 0) {
            if (sideways !== 0) {
                player.move(forward / Math.sqrt(2), sideways / Math.sqrt(2));
            } else {
                player.move(forward);
            }
            changed = true;
        } else if (sideways !== 0) {
            player.move(0, sideways);
            changed = true;
        }

        if (socket && socket.readyState === 1 && changed) {
            socket.send(JSON.stringify({
                'id': netId,
                'x': player.x,
                'y': player.y,
                'dx': player.dx,
                'dy': player.dy,
            }))
        }

        if (this.weaponAnimation !== undefined) {
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
 * @param collectible {boolean} whether the thing can be collected by the player
 * @param orientable {boolean} whether the thing has different sprites depending on orientation
 * @param blocking {boolean} whether the thing blocks player movement
 * @constructor
 */
function Thing(x, y, spriteIndex, collectible = false, orientable = false, blocking = false) {
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
     * Whether the thing can be collected by the player (ammunition, weapon, food, treasure, 1up)
     * @type {boolean}
     */
    this.collectible = collectible;
    /**
     * Whether the thing has different sprites depending on orientation
     * @type {boolean}
     */
    this.orientable = orientable;
    /**
     * Whether the thing blocks player movement
     * @type {boolean}
     */
    this.blocking = blocking;

    /**
     * Start executing a sprite animation (change current sprite at regular intervals)
     * @param animation
     */
    this.startAnimation = function (animation) {
        this.animation = animation;
        this.spriteIndex = animation.sprites[0];
    };

    /**
     * Update necessary attributes each frame:
     * - relative coordinates from player's perspective
     * - possible animation values
     */
    this.update = function () {
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

        if (this.animation !== undefined) {
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
 * @param direction {number} facing direction (0: north, 2: east, 4: south, 6: west)
 * @constructor
 */
function Enemy(x, y, spriteIndex, deathSprites, orientable = false, direction = 0) {
    Thing.call(this, x, y, spriteIndex, false, orientable);
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

    score.totalKills += 1;

    /**
     * Kill the enemy and start its dying animation
     */
    this.die = function () {
        this.alive = false;
        this.orientable = false;
        this.startAnimation(new Animation(this.deathSprites));
        score.kills += 1;
        updateScore();
        shouldDrawMap = true;
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
 * Prepare the level after the map is loaded:
 * - place things
 * - place the player
 * - make the plane2 array of blocking cells
 */
function setupLevel() {
    // setup things
    things = [];
    doorTimers = [];
    wallTimers = [];
    if (player === undefined) {
        player = new Player();
    }
    player.silverKey = false;
    player.goldKey = false;

    score = {
        kills: 0,
        totalKills: 0,
        treasures: 0,
        totalTreasures: 0,
        secrets: 0,
        totalSecrets: 0,
    };
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
            if (19 <= m1 && m1 <= 22) {
                // player starting position
                player.x = x + .5;
                player.y = y + .5;
                if (m1 === 19) {
                    player.dx = 0;
                    player.dy = -1;
                } else if (m1 === 20) {
                    player.dx = 1;
                    player.dy = 0;
                } else if (m1 === 21) {
                    player.dx = 0;
                    player.dy = 1;
                } else if (m1 === 22) {
                    player.dx = -1;
                    player.dy = 0;
                }
            } else if (23 <= m1 && m1 <= 70) {
                // props
                let collectible = false;
                if ([29, 43, 44, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56].indexOf(m1) >= 0) {
                    // collectible
                    collectible = true;
                    if (52 <= m1 && m1 <= 56) {
                        score.totalTreasures += 1;
                    }
                }
                if ([24, 25, 26, 28, 30, 31, 33, 34, 35, 36, 39, 40, 41, 45, 58, 59, 60, 62, 63, 68,
                    69].indexOf(m1) >= 0) {
                    // blocking prop
                    things.push(new Thing(x, y, m1 - 21, collectible, false, true));
                    plane2[x][y] = true;
                } else {
                    things.push(new Thing(x, y, m1 - 21, collectible, false, false));
                }
            } else if (m1 === 98) {
                // pushwall
                score.totalSecrets += 1;
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
        window.requestAnimationFrame(update);
    }

    shouldDrawMap = true;
    updateScore();
}


/**
 * Update all game related elements.
 * This function is called at each frame.
 */
function update() {
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
            setMap0(x, y, map0(x - dx, y - dy));
            setMap0(x + dx, y + dy, wallValue);
            setMap1(x, y, 0);
            plane2[x][y] = false;
            plane2[x + dx][y + dy] = true;
            timer.steps -= 1;
            if (timer.steps > 0 && !plane2[x + 2 * dx][y + 2 * dy]) {
                // wall moves one more step
                setMap1(x + dx, y + dy, 98);
                timer.t = 0;
                timer.x += dx;
                timer.y += dy;
            } else {
                // wall finished moving
                doorTimers.splice(i, 1);
                i -= 1;
            }
            shouldDrawMap = true;
        }
    }

    // update player
    player.update();

    // update flashing palette
    if (flash !== undefined) {
        flash.timer += 1;
        if (flash.timer <= flash.duration / 3) {
            flashPalette(flash.red / 2, flash.green / 2, flash.blue / 2);
        } else if (flash.timer <= 2 * flash.duration / 3) {
            flashPalette(flash.red, flash.green, flash.blue);
        } else if (flash.timer <= flash.duration) {
            flashPalette(flash.red / 2, flash.green / 2, flash.blue / 2);
        } else {
            flashPalette(0, 0, 0);
            flash = undefined
        }
    }

    if (fps60) {
        // run at 60fps
        draw();
    } else if (drawNextFrame = !drawNextFrame) {
        // run at 30 fps
        draw();
    }

    // call the function again on next frame
    requestAnimationFrame(update);
}


/**
 * Load the level after the current one.
 */
function loadNextLevel() {
    loadLevel(currentLevel + 1);
}

function updateGameState(data) {
    const id = data.id;
    if (id !== netId) {
        if (!opponentPlayers.hasOwnProperty(id)) {
            opponentPlayers[id] = new Enemy(0, 0, 238, [279, 280, 281, 283, 284], true, 0);
            things.push(opponentPlayers[id]);
        }
        opponentPlayers[id].x = data.x;
        opponentPlayers[id].y = data.y;
        opponentPlayers[id].direction = (4 * Math.atan2(data.dx, data.dy) / Math.PI + 12) % 8;
    }
}