import struct
from math import sin, cos

VSWAP = '../data/VSWAP.WL6'
MAPHEAD = '../data/MAPHEAD.WL6'
GAMEMAPS = '../data/GAMEMAPS.WL6'


class W3DException(Exception):
    pass


class Score:
    def __init__(self):
        self.kills = 0
        self.total_kills = 0
        self.treasures = 0
        self.total_treasures = 0
        self.secrets = 0
        self.total_secrets = 0

    def reset(self):
        self.kills = 0
        self.total_kills = 0
        self.treasures = 0
        self.total_treasures = 0
        self.secrets = 0
        self.total_secrets = 0


class Player:
    def __init__(self):
        self.x = 0
        self.y = 0
        self.dx = 0
        self.dy = 0
        self.score = Score()
        self.silver_key = False
        self.gold_key = False
        self.speed_angle = .05
        self.speed = .065

    def start_level(self):
        self.score.reset()
        self.silver_key = False
        self.gold_key = False

    def turn(self, direction):
        angle = direction * self.speed_angle
        self.dx, self.dy = self.dx * cos(angle) - self.dy * sin(angle), self.dx * sin(angle) + self.dy * cos(angle)

    def move(self, direction):
        distance = direction * self.speed
        self.x += distance * self.dx
        self.y += distance * self.dy

class Game:
    def __init__(self):
        self.player = Player()
        self.map = None
        self.things = []
        self.door_timers = []
        self.wall_timers = []

    def load_level(self, level):
        self.map = Map(level)
        self.things.clear()
        self.door_timers.clear()
        self.wall_timers.clear()
        self.player.start_level()

        for y in range(64):
            for x in range(64):
                m0, m1 = self.map[x, y]
                if 19 <= m1 <= 22:
                    self.player.x = x + .5
                    self.player.y = y + .5
                    if m1 == 19:
                        self.player.dx = 0
                        self.player.dy = -1
                    elif m1 == 20:
                        self.player.dx = 1
                        self.player.dy = 0
                    elif m1 == 21:
                        self.player.dx = 0
                        self.player.dy = 1
                    elif m1 == 22:
                        self.player.dx = -1
                        self.player.dy = 0
                # elif 23 <= m1 <= 74:
                #     is_collectible = m1 in [29, 43, 44, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56]
                #     if 52 <= m1 <= 56:
                #         self.score['totalTreasures'] += 1
                #     self.things.append(Thing(x, y, m1 - 21, is_collectible))
                #     plane2[x][y] = m1 in [24, 25, 26, 28, 30, 31, 33, 34, 35, 36, 38, 39, 40, 41, 45, 58, 59, 60, 62,
                #                           63, 67, 68, 69, 71, 73]
                # elif m1 == 98:
                #     self.score['totalSecrets'] += 1
                # elif m1 == 124:
                #     self.things.append(Thing(x, y, 95))
                # elif m1 >= 108:
                #     if 108 <= m1 <= 116:
                #         self.things.append(GuardEnemy(x, y, (m1 - 108) % 4))
                #     elif 144 <= m1 < 152:
                #         self.things.append(GuardEnemy(x, y, (m1 - 144) % 4))
                #     elif 116 <= m1 < 124:
                #         self.things.append(OfficerEnemy(x, y, (m1 - 116) % 4))
                #     elif 152 <= m1 < 160:
                #         self.things.append(OfficerEnemy(x, y, (m1 - 152) % 4))
                #     elif 126 <= m1 < 134:
                #         self.things.append(SSEnemy(x, y, (m1 - 126) % 4))
                #     elif 162 <= m1 < 170:
                #         self.things.append(SSEnemy(x, y, (m1 - 162) % 4))
                #     elif 134 <= m1 < 142:
                #         self.things.append(DogEnemy(x, y, (m1 - 134) % 4))
                #     elif 170 <= m1 < 178:
                #         self.things.append(DogEnemy(x, y, (m1 - 170) % 4))
                #     elif 216 <= m1 < 224:
                #         self.things.append(ZombieEnemy(x, y, (m1 - 216) % 4))
                #     elif 234 <= m1 < 242:
                #         self.things.append(ZombieEnemy(x, y, (m1 - 234) % 4))
                #     elif m1 == 160:
                #         self.things.append(FakeHitlerEnemy(x, y))
                #     elif m1 == 178:
                #         self.things.append(HitlerEnemy(x, y))
                #     elif m1 == 179:
                #         self.things.append(FettgesightEnemy(x, y))
                #     elif m1 == 196:
                #         self.things.append(SchabbsEnemy(x, y))
                #     elif m1 == 197:
                #         self.things.append(GetelEnemy(x, y))
                #     elif m1 == 214:
                #         self.things.append(HansEnemy(x, y))
                #     elif m1 == 215:
                #         self.things.append(OttoEnemy(x, y))
                #     elif 224 <= m1 < 228:
                #         ghost = Thing(x, y, 0)
                #         sprite_index = 288 + 2 * (m1 - 224)
                #         ghost.start_animation(Animation([sprite_index, sprite_index + 1], True))
                #         self.things.append(ghost)


def rlew_decode(data):
    """
    Decode a byte string containing RLEW-encoded data
    :param data: a byte string containing the RLEW-encoded data
    :return: a byte string of decoded data
    """
    size = struct.unpack("<H", data[0:2])[0]
    offset = 2
    output = bytearray()
    while offset < len(data):
        w = data[offset: offset + 2]
        offset += 2
        if w == b'\xcd\xab':
            n = struct.unpack('<H', data[offset: offset + 2])[0]
            output += n * data[offset + 2: offset + 4]
            offset += 4
        else:
            output += w
    if len(output) != size:
        raise W3DException("RLEW decode: Output size mismatch")
    return output


def carmack_decode(data):
    """
    Decode a byte string containing Carmack-encoded data
    :param data: a byte string containing the Carmack-encoded data
    :return: a byte string of decoded data
    """
    size = struct.unpack("<H", data[0:2])[0]
    offset = 2
    output = bytearray()
    while offset < len(data):
        if data[offset + 1] == 0xA7 or data[offset + 1] == 0xA8:
            n = data[offset]
            if n == 0:
                # exception (not really a pointer)
                output += data[offset + 2]
                output += data[offset + 1]
                offset += 3
            elif data[offset + 1] == 0xA7:
                # near pointer
                off = -2 * data[offset + 2]
                for i in range(n):
                    output += output[off: off + 2]
                offset += 3
            elif data[offset + 1] == 0xA8:
                # far pointer
                off = 2 * struct.unpack('<H', data[offset + 2: offset + 4])[0]
                for i in range(n):
                    output += output[off + 2*i: off + 2*i + 2]
                offset += 4
        else:
            output += data[offset: offset+2]
            offset += 2
    if len(output) != size:
        raise W3DException("Carmack decode: Output size mismatch")
    return output


class Map:
    """
    Representation of a Wolfenstein 3D level data
    """
    def __init__(self, level):
        """
        Initializer
        :param level: index of the level (should be < 60 in the full 6-episodes game)
        """
        if level < 0 or level >= 100:
            raise W3DException("Invalid level ID.")

        with open(MAPHEAD, "rb") as fp:
            fp.seek(2 + 4 * level)
            offset = struct.unpack("<I", fp.read(4))[0]
        if offset == 0:
            raise W3DException("Invalid level ID.")
        with open(GAMEMAPS, "rb") as fp:
            fp.seek(offset)
            header = struct.unpack("<3I5H20s", fp.read(42))
            name = header[8]
            self.name = name[:name.index(0)].decode('ascii')
            self.level = level
            fp.seek(header[0])
            self.plane0 = rlew_decode(carmack_decode(fp.read(header[3])))
            fp.seek(header[1])
            self.plane1 = rlew_decode(carmack_decode(fp.read(header[4])))
            self.width = 64
            self.height = 64

    def __getitem__(self, item):
        """
        Returns the values of plane0 and plane1 at the x, y coordinates
        :param item: a pair x, y of coordinates
        :return: a pair of values corresponding to plane0 and plane1 data at given coordinate
        """
        x, y = item
        offset = (x + self.width * y) << 1
        p0 = struct.unpack('<H', self.plane0[offset: offset + 2])[0]
        p1 = struct.unpack('<H', self.plane1[offset: offset + 2])[0]
        return p0, p1

    def export(self, filename=None, single_byte=True):
        """
        Export the level data to a file containing a concatenation of the plane0 and plane1 data
        (output file should be 16384 bytes long if encoded in words or 8192 if encoded in single bytes)
        :param filename: name of the file to create
        :param single_byte: if set, all words (16bits) from the original data will be represented as a single byte
        (original Wolfenstein 3D data uses only one byte despite being encoded on 2 bytes)
        """
        if filename is None:
            filename = '{}.map'.format(self.name.replace(' ', ''))
        with open(filename, 'wb') as fp:
            if single_byte:
                fp.write(bytes([self.plane0[i] for i in range(0, len(self.plane0), 2)]))
                fp.write(bytes([self.plane1[i] for i in range(0, len(self.plane1), 2)]))
            else:
                fp.write(self.plane0)
                fp.write(self.plane1)
        fp.close()

    def find_cell(self, values0=None, values1=None):
        cells = []
        for x in range(self.width):
            for y in range(self.height):
                v0, v1 = self[x, y]
                if (values0 is None or v0 in values0) and (values1 is None or v1 in values1):
                    cells.append((x, y))
        return cells
