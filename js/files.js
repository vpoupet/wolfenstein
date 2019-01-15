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
 * Offset in the VSWAP.WL6 file where the first wall texture starts
 * @type {number}
 */
let wallTexturesOffset;
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
 * @returns {Promise} A promise containing the content of the file as an ArrayBuffer
 */
function loadBytes(url) {
    return new Promise(resolve => {
        let req = new XMLHttpRequest();
        req.onload = () => resolve(req.response);
        req.responseType = "arraybuffer";
        req.open("GET", url);
        req.send();
    });
}


/**
 * Load game data files:
 * - MAPHEAD.WL6: offsets to the map data for each level in GAMEMAPS.WL6
 * - GAMEMAPS.WL6: levels structure (walls, objects, enemies, etc.
 * - VSWAP.WL6: graphics (walls and sprites) and sounds
 * @returns {Promise} combined promise of all asynchronous tasks
 */
function loadResources() {
    // display splash screen for at least 1 second
    let splashPromise = new Promise(resolve => setTimeout(resolve, 1000));
    // load game files
    let gamemapsPromise = loadBytes("data/GAMEMAPS.WL6");
    let mapheadPromise = loadBytes("data/MAPHEAD.WL6");
    let vswapPromise = loadBytes("data/VSWAP.WL6");
    // prepare game data
    gamemapsPromise.then(req => GAMEMAPS = req);
    mapheadPromise.then(req => MAPHEAD = req);
    vswapPromise.then(req => {
        VSWAP = new DataView(req);
        wallTexturesOffset = VSWAP.getUint32(6, true);
    });

    // return a combined promise
    return Promise.all([splashPromise, gamemapsPromise, mapheadPromise, vswapPromise]);
}


/**
 * Load a given level
 * @param level {number} index of level to load (from 0 to 59)
 */
function loadLevel(level) {
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
    currentLevel = level;
    setupLevel();
}


// Getters and setters for plane0 and plane1
function map0(x, y) {
    try { return plane0.getUint16(2 * (x + 64 * y), true); }
    catch(e) { return undefined; }
}
function setMap0(x, y, value) {
    plane0.setUint16(2 * (x + 64 * y), value, true);
}
function map1(x, y) {
    try { return plane1.getUint16(2 * (x + 64 * y), true); }
    catch(e) { return undefined; }
}
function setMap1(x, y, value) {
    plane1.setUint16(2 * (x + 64 * y), value, true);
}