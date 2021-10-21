#include <math.h>
#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/types.h>
#include <sys/uio.h>

#define wallTexturesOffset 4096

int WIDTH=640;
int HEIGHT=400;
int WALL_HEIGHT=320;

unsigned char *vswap;
#define VSWAP_SIZE 1545400
unsigned char *map;
#define MAP_SIZE 4096
unsigned int *view;

unsigned int *get_view_ptr() {
    return view;
}

unsigned char *get_map_ptr() {
    return map;
}

void init(int _WIDTH, int _HEIGHT, int _WALL_HEIGHT) {
    WIDTH = _WIDTH;
    HEIGHT = _HEIGHT;
    WALL_HEIGHT = _WALL_HEIGHT;

    view = malloc(WIDTH * HEIGHT * sizeof(unsigned int));

    int fd;
    fd = open("VSWAP.WL6", O_RDONLY);
    vswap = malloc(VSWAP_SIZE);
    read(fd, vswap, VSWAP_SIZE);
    close(fd);

    fd = open("00.map", O_RDONLY);
    map = malloc(MAP_SIZE);
    read(fd, map, MAP_SIZE);
    close(fd);
}

/**
 * Game color palette (RGBA, 32bit little-endian)
 * @type {Uint32Array}
 */
unsigned int palette[256] = {
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
    4287400960, 4286874624, 4286348288, 4286085120, 4285821952, 4285558784, 4285295616, 4287103128,
};

//int palette[256] = {
//        0x000000, 0x0000a8, 0x00a800, 0x00a8a8, 0xa80000, 0xa800a8, 0xa85400, 0xa8a8a8,
//        0x545454, 0x5454fc, 0x54fc54, 0x54fcfc, 0xfc5454, 0xfc54fc, 0xfcfc54, 0xfcfcfc,
//        0xececec, 0xdcdcdc, 0xd0d0d0, 0xc0c0c0, 0xb4b4b4, 0xa8a8a8, 0x989898, 0x8c8c8c,
//        0x7c7c7c, 0x707070, 0x646464, 0x545454, 0x484848, 0x383838, 0x2c2c2c, 0x202020,
//        0xfc0000, 0xec0000, 0xe00000, 0xd40000, 0xc80000, 0xbc0000, 0xb00000, 0xa40000,
//        0x980000, 0x880000, 0x7c0000, 0x700000, 0x640000, 0x580000, 0x4c0000, 0x400000,
//        0xfcd8d8, 0xfcb8b8, 0xfc9c9c, 0xfc7c7c, 0xfc5c5c, 0xfc4040, 0xfc2020, 0xfc0000,
//        0xfca85c, 0xfc9840, 0xfc8820, 0xfc7800, 0xe46c00, 0xcc6000, 0xb45400, 0x9c4c00,
//        0xfcfcd8, 0xfcfcb8, 0xfcfc9c, 0xfcfc7c, 0xfcf85c, 0xfcf440, 0xfcf420, 0xfcf400,
//        0xe4d800, 0xccc400, 0xb4ac00, 0x9c9c00, 0x848400, 0x706c00, 0x585400, 0x404000,
//        0xd0fc5c, 0xc4fc40, 0xb4fc20, 0xa0fc00, 0x90e400, 0x80cc00, 0x74b400, 0x609c00,
//        0xd8fcd8, 0xbcfcb8, 0x9cfc9c, 0x80fc7c, 0x60fc5c, 0x40fc40, 0x20fc20, 0x00fc00,
//        0x00fc00, 0x00ec00, 0x00e000, 0x00d400, 0x04c800, 0x04bc00, 0x04b000, 0x04a400,
//        0x049800, 0x048800, 0x047c00, 0x047000, 0x046400, 0x045800, 0x044c00, 0x044000,
//        0xd8fcfc, 0xb8fcfc, 0x9cfcfc, 0x7cfcf8, 0x5cfcfc, 0x40fcfc, 0x20fcfc, 0x00fcfc,
//        0x00e4e4, 0x00cccc, 0x00b4b4, 0x009c9c, 0x008484, 0x007070, 0x005858, 0x004040,
//        0x5cbcfc, 0x40b0fc, 0x20a8fc, 0x009cfc, 0x008ce4, 0x007ccc, 0x006cb4, 0x005c9c,
//        0xd8d8fc, 0xb8bcfc, 0x9c9cfc, 0x7c80fc, 0x5c60fc, 0x4040fc, 0x2024fc, 0x0004fc,
//        0x0000fc, 0x0000ec, 0x0000e0, 0x0000d4, 0x0000c8, 0x0000bc, 0x0000b0, 0x0000a4,
//        0x000098, 0x000088, 0x00007c, 0x000070, 0x000064, 0x000058, 0x00004c, 0x000040,
//        0x282828, 0xfce034, 0xfcd424, 0xfccc18, 0xfcc008, 0xfcb400, 0xb420fc, 0xa800fc,
//        0x9800e4, 0x8000cc, 0x7400b4, 0x60009c, 0x500084, 0x440070, 0x340058, 0x280040,
//        0xfcd8fc, 0xfcb8fc, 0xfc9cfc, 0xfc7cfc, 0xfc5cfc, 0xfc40fc, 0xfc20fc, 0xfc00fc,
//        0xe000e4, 0xc800cc, 0xb400b4, 0x9c009c, 0x840084, 0x6c0070, 0x580058, 0x400040,
//        0xfce8dc, 0xfce0d0, 0xfcd8c4, 0xfcd4bc, 0xfcccb0, 0xfcc4a4, 0xfcbc9c, 0xfcb890,
//        0xfcb080, 0xfca470, 0xfc9c60, 0xf0945c, 0xe88c58, 0xdc8854, 0xd08050, 0xc87c4c,
//        0xbc7848, 0xb47044, 0xa86840, 0xa0643c, 0x9c6038, 0x905c34, 0x885830, 0x80502c,
//        0x744c28, 0x6c4824, 0x5c4020, 0x543c1c, 0x483818, 0x403018, 0x382c14, 0x28200c,
//        0x600064, 0x006464, 0x006060, 0x00001c, 0x00002c, 0x302410, 0x480048, 0x500050,
//        0x000034, 0x1c1c1c, 0x4c4c4c, 0x5c5c5c, 0x404040, 0x303030, 0x343434, 0xd8f4f4,
//        0xb8e8e8, 0x9cdcdc, 0x74c8c8, 0x48c0c0, 0x20b4b4, 0x20b0b0, 0x00a4a4, 0x009898,
//        0x008c8c, 0x008484, 0x007c7c, 0x007878, 0x007474, 0x007070, 0x006c6c, 0x980088,
//};

void set_pixel(int x, int y, int color, unsigned int *view) {
    view[y * WIDTH + x] = color;
}

void update_view(
        double x,
        double y,
        double dx,
        double dy) {
    for (int i = 0; i < WIDTH; i += 1) {
        // current column position on the camera plane
        double shift = (2 * (double) i - WIDTH) / WIDTH;
        // direction of the ray
        double rdx = dx - shift * dy;
        double rdy = dy + shift * dx;
        // screen point coordinates in the direction of the ray
        double sx = x + rdx;
        double sy = y + rdy;
        // direction in which the ray moves along each axis
        int stepy = rdy >= 0 ? 1 : -1;
        int stepx = rdx >= 0 ? 1 : -1;
        // take absolute values of ray direction
        rdx = stepx * rdx;
        rdy = stepy * rdy;
        // cell position of the ray on the map (starting from the player position)
        int cx = (int) x;
        int cy = (int) y;
        // remaining fractional distance from the ray position to the next cell (0 < rfx, rfy <= 1)
        double fx = x - floor(x);
        double rfx = stepx > 0 ? 1 - fx : fx;
        if (rfx == 0) {
            rfx = 1;
            cx += stepx;
        }
        double fy = y - floor(y);
        double rfy = stepy > 0 ? 1 - fy : fy;
        if (rfy == 0) {
            rfy = 1;
            cy += stepy;
        }

        // total time traveled by the ray
        double t = 0;
        // plane0 value of the cell visited by the ray
        unsigned char m0;
        // coordinate on the wall tile where the ray hit (0 <= tx <= 1)
        double tx;
        // index of tile to display
        int textureIndex;

        while (1) {
            m0 = map[cx + 64 * cy];
            if (m0 <= 63) {
                // hit a wall
                if (rfx == 1) {
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
            // move to the next cell
            if (rfx * rdy <= rfy * rdx) {
                // move to next cell horizontally
                double dt = rfx / rdx;
                t += dt;
                rfx = 1;
                cx += stepx;
                rfy -= dt * rdy;
            } else {
                // move to next cell vertically
                double dt = rfy / rdy;
                t += dt;
                rfy = 1;
                cy += stepy;
                rfx -= dt * rdx;
            }
        }

        // compute ray location
        int h = (int) (WALL_HEIGHT / (2 * t)); // height of the line representing the wall on the current column

        int yi = HEIGHT / 2 - h;
        double yf = (HEIGHT / 2. - h) - floor(HEIGHT / 2. - h);
        int stepi = h / 32;
        double stepf = (h / 32.) - floor(h / 32.);
        int texelOffset = wallTexturesOffset + 4096 * textureIndex + 64 * (int) (64 * tx);
        // draw ceiling and floor
        for (int j = 0; j <= yi; j++) {
            set_pixel(i, j, palette[29], view);
            set_pixel(i, HEIGHT - 1 - j, palette[25], view);
        }
        // draw the wall
        for (int j = texelOffset; j < texelOffset + 64; j++) {
            int col = palette[vswap[j]];
            yf += stepf;
            if (yf >= 1) {
                for (int k = (yi >= 0 ? yi : 0); k < yi + stepi + 1 && k < HEIGHT; k++) {
                    set_pixel(i, k, col, view);
                }
                yi += stepi + 1;
                yf -= 1;
            } else {
                for (int k = (yi >= 0 ? yi : 0); k < yi + stepi && k < HEIGHT; k++) {
                    set_pixel(i, k, col, view);
                }
                yi += stepi;
            }
        }
    }
}
