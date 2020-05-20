/**
 * Game pixels rendered on screen (width)
 * @type {number}
 */
let pixelWidth;
/**
 * Game pixels rendered on screen (height)
 * @type {number}
 */
let pixelHeight;
/**
 * Multiplicative rendering factor (1 game pixel is rendered as zoom x zoom pixels in the canvas)
 * @type {number}
 */
let zoom;
/**
 * Field of vision
 * @type {number}
 */
let fov = 1;
/**
 * Whether the draw function should be called every frame (60 fps) or every other frame (30 fps)
 * @type {boolean}
 */
let fps60 = true;
/**
 * Whether the draw function should be called on next frame (used when running at 30 fps)
 * @type {boolean}
 */
let drawNextFrame = true;
/**
 * Rendered size of a wall
 * @type {number}
 */
let wallHeight;
/**
 * Whether surface textures (ceiling and floor) should be displayed)
 */
let surfaceTexturesOn = false;
/**
 * Array containing distance of wall for each pixel column on screen
 * @type {number[]}
 */
let zIndex = [];
/**
 * Indicates whether the canvas has started it drawing loop
 * @type {boolean}
 */
let isDrawing = false;
/**
 * Game color palette (RGBA, 32bit little-endian)
 * @type {Uint32Array}
 */
let gamePalette = new Uint32Array([
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
 * Current palette (can be changed temporarily by some effects)
 * @type {Uint32Array}
 */
let palette = gamePalette.slice();
/**
 * An alternate palette (heavily shifted in the reds) to highlight some objects when needed (not part of the
 * original game)
 * @type {Uint32Array}
 */
let paletteRed = [];
for (let i = 0; i < gamePalette.length; i++) {
    let v = gamePalette[i];
    // extract each component
    let r = v % 256;
    let g = (v >>> 8) % 256;
    let b = (v >>> 16) % 256;
    r += ~~(.5 * (255 - r));
    g = ~~(.75 * g);
    b = ~~(.75 * b);
    // recreate the Uint32 palette value from components
    paletteRed[i] = (255 << 24) + (b << 16) + (g << 8) + r;
}
/**
 * Whether secret pushwalls should be displayed differently (cheat)
 * @type {boolean}
 */
let showPushwalls = false;
/**
 * Current flashing effect (if any)
 * @type {Flash}
 */
let flash;


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
 * Class representation of a flashing effect
 * @param red {number} red intensity in [0, 1)
 * @param green {number} green intensity in [0, 1)
 * @param blue {number} blue intensity in [0, 1)
 * @constructor
 */
function Flash(red, green, blue, duration = 6) {
    /**
     * Frames counter since flash effect started
     * @type {number}
     */
    this.timer = 0;
    /**
     * Red intensity of the flash
     * @type {number}
     */
    this.red = red;
    /**
     * Green intensity of the flash
     * @type {number}
     */
    this.green = green;
    /**
     * Blue intensity of the flash
     * @type {number}
     */
    this.blue = blue;
    /**
     * Duration of the flash in frames
     * @type {number}
     */
    this.duration = duration;
}


/**
 * Main drawing loop called at each frame
 */
function draw() {
    // draw visible game elements
    drawWalls();
    drawThings();
    drawWeapon();
    if (shouldDrawMap) {
        drawMap();
        shouldDrawMap = false;
    }
    context.putImageData(imageData, 0, 0);
    if (zoom > 1) {
        // redraw a scaled version of the canvas
        context.drawImage(canvas, 0, 0);
    }
}


/**
 * Modify the palette to flash the screen.
 * @param redFlash {number} red intensity of the flash
 * @param greenFlash {number} green intensity of the flash
 * @param blueFlash {number} blue intensity of the flash
 */
function flashPalette(redFlash, greenFlash, blueFlash) {
    for (let i = 0; i < gamePalette.length; i++) {
        let v = gamePalette[i];
        // extract each component
        let r = v % 256;
        let g = (v >>> 8) % 256;
        let b = (v >>> 16) % 256;
        r += ~~(redFlash * (255 - r));
        g += ~~(greenFlash * (255 - g));
        b += ~~(blueFlash * (255 - b));
        // recreate the Uint32 palette value from components
        palette[i] = (255 << 24) + (b << 16) + (g << 8) + r;
    }
}


/**
 * Draw walls, ceiling and floor.
 * Drawing is done for each column, finding the corresponding wall and its distance to the player by ray casting, and
 * then completing by drawing ceiling and floor.
 */
function drawWalls() {
    for (let i = 0; i < pixelWidth; i++) {
        // cast a ray for each screen column
        let isPushwall = false;  // remember if wall is a pushwall to be able to draw it differently if needed

        // current column position on the camera plane
        const shift = fov * ((i << 1) - pixelWidth) / pixelWidth;
        // direction of the ray
        let dx = player.dx - shift * player.dy;
        let dy = player.dy + shift * player.dx;

        // direction in which the ray moves along each axis
        const stepx = dx >= 0 ? 1 : -1;
        const stepy = dy >= 0 ? 1 : -1;
        // take absolute values of ray direction
        dx = stepx * dx;
        dy = stepy * dy;
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
                let wallShift = 0;
                if (map1(cx, cy) === 98) {
                    isPushwall = true;
                    // pushwall
                    const timer = wallTimers.find(function(obj) { return obj.x === cx && obj.y === cy; });
                    if (timer !== undefined) {
                        wallShift = timer.t / 64;
                        if (timer.dx !== 0) {
                            // wall moves horizontally
                            if (dx * rfy >= dy * wallShift) {
                                // ray hits wall
                                let dt = wallShift / dx;
                                t += dt;
                                rfy -= dt * dy;
                                rfx -= wallShift;
                            } else {
                                // ray moves to next cell
                                isPushwall = false;
                                let dt = rfy / dy;
                                t += dt;
                                rfy = 1;
                                cy += stepy;
                                rfx -= dt * dx;
                                continue;
                            }
                        } else {
                            // wall moves vertically
                            if (dy * rfx >= dx * wallShift) {
                                // ray hits wall
                                let dt = wallShift / dy;
                                t += dt;
                                rfx -= dt * dx;
                                rfy -= wallShift;
                            } else {
                                // ray moves to next cell
                                isPushwall = false;
                                let dt = rfx / dx;
                                t += dt;
                                rfx = 1;
                                cx += stepx;
                                rfy -= dt * dy;
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
                if (timer !== undefined) {
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
                    if (rfx >= .5 && (rfx - .5) * dy < rfy * dx) {
                        // ray hits the central door line
                        let dt = (rfx - .5) / dx;
                        t += dt;
                        rfy -= dt * dy;
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
                    if (rfx * dy >= rfy * dx) {
                        // hit the side wall
                        let dt = rfy / dy;
                        t += dt;
                        rfx -= dt * dx;
                        rfy = 1;
                        cy += stepy;
                        textureIndex = 100;
                        tx = stepx > 0 ? 1 - rfx: rfx;
                        break;
                    } else {
                        // pass through
                        let dt = rfx / dx;
                        t += dt;
                        rfy -= dt * dy;
                        rfx = 1;
                        cx += stepx;
                    }
                } else {
                    // EW door
                    if (rfy >= .5 && (rfy - .5) * dx < rfx * dy) {
                        // ray hits the central door line
                        let dt = (rfy - .5) / dy;
                        t += dt;
                        rfx -= dt * dx;
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
                    if (rfy * dx >= rfx * dy) {
                        // hit the side wall
                        let dt = rfx / dx;
                        t += dt;
                        rfy -= dt * dy;
                        rfx = 1;
                        cx += stepx;
                        textureIndex = 101;
                        tx = stepy > 0 ? 1 - rfy: rfy;
                        break;
                    } else {
                        // pass through
                        let dt = rfy / dy;
                        t += dt;
                        rfx -= dt * dx;
                        rfy = 1;
                        cy += stepy;
                    }
                }
            }
            // move to the next cell
            if (rfx * dy <= rfy * dx) {
                // move to next cell horizontally
                let dt = rfx / dx;
                t += dt;
                rfx = 1;
                cx += stepx;
                rfy -= dt * dy;
            } else {
                // move to next cell vertically
                let dt = rfy / dy;
                t += dt;
                rfy = 1;
                cy += stepy;
                rfx -= dt * dx;
            }
        }

        // compute ray location
        let h = wallHeight / (2 * t); // height of the line representing the wall on the current column
        zIndex[i] = t;

        let yi = ~~(pixelHeight / 2 - h);
        let yf = (pixelHeight / 2 - h) % 1;
        let stepi = ~~(h / 32);
        let stepf = (h / 32) % 1;
        let texelOffset = wallTexturesOffset + 4096 * textureIndex + 64 * ~~(64 * tx);
        // draw ceiling and floor
        // if (surfaceTexturesOn) {
        //     for (let j = 0; j < y; j++) {
        //         let d = wallHeight / (pixelHeight - 2 * j);
        //         let fx = sx + (rx - sx) * (d - 1) / (t - 1);
        //         let fy = sy + (ry - sy) * (d - 1) / (t - 1);
        //         drawPixel(i, j, getSurfaceTexel(fx % 1, fy % 1, 1));
        //         drawPixel(i, pixelHeight - j, getSurfaceTexel(fx % 1, fy % 1, 0));
        //     }
        // } else {
            for (let j = 0; j <= yi; j++) {
                pixels.setUint32((pixelWidth * j + i) << 2, palette[29], true);
                pixels.setUint32((pixelWidth * (pixelHeight - 1 - j) + i) << 2, palette[25], true);
            }
        // }
        // draw the wall
        for (let j = texelOffset; j < texelOffset + 64; j++) {
            let col;
            if (showPushwalls && isPushwall) {
                col = paletteRed[VSWAP.getUint8(j)];
            } else {
                col = palette[VSWAP.getUint8(j)];
            }
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


/**
 * Draw all things on screen from furthest to nearest
 */
function drawThings() {
    for (let k = 0; k < things.length; k++) {
        let t = things[k];
        if (t.rx < player.radius) {
            // thing is behind the screen
            return;
        } else if (Math.abs(t.ry) > t.rx + 1) {
            // thing is out of field of view
            continue;
        }

        let th = wallHeight / t.rx;
        let tx = ~~((t.ry / t.rx + fov) * wallHeight - th / 2);
        let ty = ~~((pixelHeight - th) / 2);
        let index = t.spriteIndex;
        if (t.orientable) {
            index += (Math.round(4 * Math.atan2(t.x - player.x, t.y - player.y) / Math.PI - t.direction) + 16) % 8;
        }

        drawSprite(index, tx, ty, th, t.rx);
    }
}


/**
 * Draw the player's weapon in hand
 */
function drawWeapon() {
    let height = zoom === 1 ? 384 : 192;
    drawSprite(player.weaponSprite, pixelWidth / 2 - height / 2, pixelHeight - height, height);
}


/**
 * Draw a sprite on screen
 * @param index {number} index of the sprite texture
 * @param x {number} x-coordinate of the top-left corner of the rendered sprite
 * @param y {number} y-coordinate of the top-left corner of the rendered sprite
 * @param height {number} height of the rendered sprite in pixels
 * @param dist {number} distance from player (if sprite is farther than zIndex, column is not drawn)
 */
function drawSprite(index, x, y, height, dist=0) {
    // rendered size of sprite pixels
    let scale = Math.ceil(height / 64);
    // read sprite data from VSWAP.WL6
    let firstSprite = VSWAP.getUint16(2, true);
    let spriteOffset = VSWAP.getUint32(6 + 4 * (firstSprite + index), true);
    let firstCol = VSWAP.getUint16(spriteOffset, true);
    let lastCol = VSWAP.getUint16(spriteOffset + 2, true);
    let nbCol = lastCol - firstCol + 1;
    let pixelPoolOffset = spriteOffset + 4 + 2 * nbCol;
    // draw pixels column by column, post by post
    for (let col = firstCol; col <= lastCol; col++) {
        let colOffset = spriteOffset + VSWAP.getUint16(spriteOffset + 4 + 2 * (col - firstCol), true);
        while (true) {
            let endRow = VSWAP.getUint16(colOffset, true) / 2;
            if (endRow === 0) {
                break;
            }
            let startRow = VSWAP.getUint16(colOffset + 4, true) / 2;
            colOffset += 6;
            for (let row = startRow; row < endRow; row++) {
                drawScaledPixel(
                    x + ~~(col * height / 64),
                    y + ~~(row * height / 64),
                    VSWAP.getUint8(pixelPoolOffset),
                    scale,
                    dist
                );
                pixelPoolOffset += 1;
            }
        }
    }
}


/**
 * Draw a scaled pixel on the canvas. A "scaled" pixel will cover a square of scale x scale pixels on the canvas,
 * starting from the given coordinates
 * @param x {number} x-coordinate of the top left corner of the square
 * @param y {number} y-coordinate of the top left corner of the square
 * @param col {number} palette index of the color
 * @param scale {number} scale of the pixel
 * @param dist {number} (optional) distance of the object that contains the pixel. If the distance is larger than the
 * zIndex for a given column, no pixel will be drawn on the canvas
 */
function drawScaledPixel(x, y, col, scale, dist=0) {
    if (col !== undefined) {
        let color = palette[col];
        for (let col = x >= 0 ? x : 0; col < x + scale && col < pixelWidth; col++) {
            if (dist >= zIndex[col]) {
                // sprite is hidden on this column
                continue;
            }
            for (let row = y >= 0 ? y : 0; row < y + scale && row < pixelHeight; row++) {
                pixels.setUint32((pixelWidth * row + col) << 2, color, true);
            }
        }
    }
}


/**
 * Change the zoom value
 * @param n {number} new zoom value
 */
function setZoom(n) {
    if (zoom !== undefined) {
        context.scale(1/zoom, 1/zoom);
    }
    zoom = n;
    pixelWidth = 640 / zoom;
    pixelHeight = 400 / zoom;
    wallHeight = pixelWidth / (2 * fov);
    imageData = new ImageData(pixelWidth, pixelHeight);
    pixels = new DataView(imageData.data.buffer);
    context.scale(zoom, zoom);
}
