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

function drawMap() {
    let wallCanvas = document.createElement('canvas');
    let wallContext = wallCanvas.getContext('2d');
    wallContext.fillStyle = 'black';
    let pushwallCanvas = document.createElement('canvas');
    let pushwallContext = pushwallCanvas.getContext('2d');
    pushwallContext.fillStyle = 'red';
    for (let x = 0; x < 64; x++) {
        for (let y = 0; y < 64; y++) {
            let m0 = map0(x, y);
            let m1 = map1(x, y);
            if (m0 <= 63) {
                if (m1 === 98) {
                    pushwallContext.rect(2 * x, 2 * y, 2, 2);
                } else {
                    wallContext.rect(2 * x, 2 * y, 2, 2);
                }
            }
        }
    }
    wallContext.fill();
    pushwallContext.fill();
    contextHUD.drawImage(wallCanvas, 0, 0, 640, 400);
    contextHUD.drawImage(pushwallCanvas, 0, 0, 640, 400);
}

