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
