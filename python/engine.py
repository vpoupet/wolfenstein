def drawWalls():
    for col in range(pixel_width):
        shift = fov * ((i << 1) - pixel_width) / pixel_width
        rdx = player.dx - shift * player.dy
        rdy = player.dy - shift * player.dx
        sx = player.x + rdx
        sy = player.y + rdy
        stepx = 1 if rdx >= 0 else -1
        stepy = 1 if rdy >= 0 else -1
        rdx *= stepx
        rdy *= stepy

        cx = int(player.x)
        cy = int(player.y)

        rfx = 1 - (player.x % 1) if stepx > 0 else player.x % 1
        rfy = 1 - (player.y % 1) if stepy > 0 else player.y % 1
        if rfx == 0:
            rfx = 1
            cx += stepx
        if rfy == 0:
            rfy = 1
            cy += stepy

        t = 0

        while True:
            m0 = map0(cx, cy)
            if m0 <= 63:
                # hit a wall
                if rfx == 1:
                    # NS wall
                    texture_index = 2 * m0 - 1
                    # fix texture orientation depending on ray direction
                    tx = 1 - rfy if stepx * stepy > 0 else rfy
                else:
                    # EW wall
                    textureIndex = 2 * m0 - 2
                    # fix texture orientation depending on ray direction
                    tx = 1 - rfx if stepx * stepy < 0 else rfx
                break
            # move to the next cell
            if rfx * rdy <= rfy * rdx:
                # move to next cell horizontally
                dt = rfx / rdx
                t += dt
                rfx = 1
                cx += stepx
                rfy -= dt * rdy
            else:
                # move to next cell vertically
                dt = rfy / rdy
                t += dt
                rfy = 1
                cy += stepy
                rfx -= dt * rdx

        # compute ray location
#         rx = stepx > 0 ? cx + 1 - rfx : cx + rfx;
#         ry = stepy > 0 ? cy + 1 - rfy : cy + rfy;
#         let h = wallHeight / (2 * t); // height of the line representing the wall on the current column
#         zIndex[i] = t;
#
#         let yi = ~~(pixelHeight / 2 - h);
#         let yf = (pixelHeight / 2 - h) % 1;
#         let stepi = ~~(h / 32);
#         let stepf = (h / 32) % 1;
#         let texelOffset = wallTexturesOffset + 4096 * textureIndex + 64 * ~~(64 * tx);
#         // draw ceiling and floor
#         if (surfaceTexturesOn) {
#             for (let j = 0; j < y; j++) {
#                 let d = wallHeight / (pixelHeight - 2 * j);
#                 let fx = sx + (rx - sx) * (d - 1) / (t - 1);
#                 let fy = sy + (ry - sy) * (d - 1) / (t - 1);
#                 drawPixel(i, j, getSurfaceTexel(fx % 1, fy % 1, 1));
#                 drawPixel(i, pixelHeight - j, getSurfaceTexel(fx % 1, fy % 1, 0));
#             }
#         } else {
#             for (let j = 0; j <= yi; j++) {
#                 drawPixel(i, j, 29);
#                 drawPixel(i, pixelHeight - 1 - j, 25);
#             }
#         }
#         // draw the wall
#         for (let j = texelOffset; j < texelOffset + 64; j++) {
#             let col;
#             if (isPushwall) {
#                 col = paletteRed[VSWAP.getUint8(j)];
#             } else {
#                 col = palette[VSWAP.getUint8(j)];
#             }
#             yf += stepf;
#             if (yf >= 1) {
#                 for (let k = Math.max(0, yi); k < Math.min(pixelHeight, yi + stepi + 1); k++) {
#                     pixels.setUint32((pixelWidth * k + i) << 2, col, true);
#                 }
#                 yi += stepi + 1;
#                 yf -= 1;
#             } else {
#                 for (let k = Math.max(0, yi); k < Math.min(pixelHeight, yi + stepi); k++) {
#                     pixels.setUint32((pixelWidth * k + i) << 2, col, true);
#                 }
#                 yi += stepi;
#             }
#         }
#     }
# }