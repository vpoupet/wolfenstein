/**
 * Canvas for drawing HUD on top of game screen
 * @type {HTMLCanvasElement}
 */
let canvasHUD;
/**
 * Context for HUD canvas
 * @type {CanvasRenderingContext2D}
 */
let contextHUD;
let shouldDrawMap = true;

function drawMap() {
    contextHUD.clearRect(0, 0, 256, 256);
    let doors = [];
    let goldDoors = [];
    let silverDoors = [];
    let elevators = [];
    let pushwalls = [];
    let treasures = [];
    let walls = [];
    contextHUD.fillStyle = '#888888';
    for (let x = 0; x < 64; x++) {
        for (let y = 0; y < 64; y++) {
            let m0 = map0(x, y);
            let m1 = map1(x, y);
            if (m0 <= 63) {
                if (m1 === 98) {
                    pushwalls.push({x: x, y: y});
                } else if (m0 === 21) {
                    elevators.push({x: x, y: y});
                } else if (connectedWall(x, y)) {
                    walls.push({x: x, y: y});
                }
            } else if (m0 === 90 || m0 === 91 || m0 === 100 || m0 === 101) {
                doors.push({x: x, y: y});
            } else if (m0 === 92 || m0 === 93) {
                goldDoors.push({x: x, y: y});
            } else if (m0 === 94 || m0 === 95) {
                silverDoors.push({x: x, y: y});
            } else {
                contextHUD.fillRect(4 * x, 4 * y, 4, 4);
                if (52 <= m1 && m1 <= 56) {
                    treasures.push({x: x, y: y});
                }
            }
        }
    }
    // walls
    contextHUD.fillStyle = '#000000';
    for (let i = 0; i < walls.length; i++) {
        contextHUD.fillRect(4 * walls[i].x, 4 * walls[i].y, 4, 4);
    }
    contextHUD.fillStyle = '#444444';
    // obstacles
    for (let i = 0; i < things.length; i++) {
        let t = things[i];
        if (t.blocking) {
            contextHUD.fillRect(4 * (t.x - .5), 4 * (t.y - .5), 4, 4);
        }
    }
    // doors
    contextHUD.fillStyle = '#FFFFFF';
    for (let i = 0; i < doors.length; i++) {
        contextHUD.fillRect(4 * doors[i].x, 4 * doors[i].y, 4, 4);
    }
    // treasures
    for (let i = 0; i < things.length; i++) {
        let t = things[i];
        if (31 <= t.spriteIndex && t.spriteIndex <= 35) {
            contextHUD.fillRect(4 * (t.x - .5) + 1, 4 * (t.y - .5) + 1, 2, 2);
        }
    }
    // gold doors
    contextHUD.fillStyle = '#FFFF00';
    for (let i = 0; i < goldDoors.length; i++) {
        contextHUD.fillRect(4 * goldDoors[i].x, 4 * goldDoors[i].y, 4, 4);
    }
    // gold keys
    for (let i = 0; i < things.length; i++) {
        let t = things[i];
        if (t.spriteIndex === 22) {
            contextHUD.fillRect(4 * (t.x - .5) + 1, 4 * (t.y - .5) + 1, 2, 2);
        }
    }
    // silver doors
    contextHUD.fillStyle = '#00FFFF';
    for (let i = 0; i < silverDoors.length; i++) {
        contextHUD.fillRect(4 * silverDoors[i].x, 4 * silverDoors[i].y, 4, 4);
    }
    // silver keys
    for (let i = 0; i < things.length; i++) {
        let t = things[i];
        if (t.spriteIndex === 23) {
            contextHUD.fillRect(4 * (t.x - .5) + 1, 4 * (t.y - .5) + 1, 2, 2);
        }
    }
    // elevators
    contextHUD.fillStyle = '#FF8F00';
    for (let i = 0; i < elevators.length; i++) {
        contextHUD.fillRect(4 * elevators[i].x, 4 * elevators[i].y, 4, 4);
    }
    // secret pushwalls
    contextHUD.fillStyle = '#ff0000';
    for (let i = 0; i < pushwalls.length; i++) {
        contextHUD.fillRect(4 * pushwalls[i].x, 4 * pushwalls[i].y, 4, 4);
    }
    // enemies
    for (let i = 0; i < things.length; i++) {
        let t = things[i];
        if (t.alive) {
            contextHUD.fillRect(4 * (t.x - .5) + 1, 4 * (t.y - .5) + 1, 2, 2);
        }
    }
    contextHUD.fillStyle = '#00FF00';
    contextHUD.fillRect(4 * ~~player.x, 4 * ~~player.y, 4, 4);
}

function connectedWall(x, y) {
    return map0(x - 1, y) > 63 || map0(x + 1, y) > 63 || map0(x, y - 1) > 63 || map0(x, y + 1) > 63 ||
        map0(x - 1, y - 1) > 63 || map0(x - 1, y + 1) > 63 || map0(x + 1, y - 1) > 63 || map0(x + 1, y + 1) > 63;
}