import struct


class W3DException(Exception):
    pass


class W3DInvalidLevelIndexException(W3DException):
    pass


VSWAP = '../data/VSWAP.WL6'
MAPHEAD = '../data/MAPHEAD.WL6'
GAMEMAPS = '../data/GAMEMAPS.WL6'

# Wolfenstein 3D color palette (hard-coded in executable)
palette = [
    b'\x00\x00\x00', b'\x00\x00\xa8', b'\x00\xa8\x00', b'\x00\xa8\xa8',
    b'\xa8\x00\x00', b'\xa8\x00\xa8', b'\xa8\x54\x00', b'\xa8\xa8\xa8',
    b'\x54\x54\x54', b'\x54\x54\xfc', b'\x54\xfc\x54', b'\x54\xfc\xfc',
    b'\xfc\x54\x54', b'\xfc\x54\xfc', b'\xfc\xfc\x54', b'\xfc\xfc\xfc',
    b'\xec\xec\xec', b'\xdc\xdc\xdc', b'\xd0\xd0\xd0', b'\xc0\xc0\xc0',
    b'\xb4\xb4\xb4', b'\xa8\xa8\xa8', b'\x98\x98\x98', b'\x8c\x8c\x8c',
    b'\x7c\x7c\x7c', b'\x70\x70\x70', b'\x64\x64\x64', b'\x54\x54\x54',
    b'\x48\x48\x48', b'\x38\x38\x38', b'\x2c\x2c\x2c', b'\x20\x20\x20',
    b'\xfc\x00\x00', b'\xec\x00\x00', b'\xe0\x00\x00', b'\xd4\x00\x00',
    b'\xc8\x00\x00', b'\xbc\x00\x00', b'\xb0\x00\x00', b'\xa4\x00\x00',
    b'\x98\x00\x00', b'\x88\x00\x00', b'\x7c\x00\x00', b'\x70\x00\x00',
    b'\x64\x00\x00', b'\x58\x00\x00', b'\x4c\x00\x00', b'\x40\x00\x00',
    b'\xfc\xd8\xd8', b'\xfc\xb8\xb8', b'\xfc\x9c\x9c', b'\xfc\x7c\x7c',
    b'\xfc\x5c\x5c', b'\xfc\x40\x40', b'\xfc\x20\x20', b'\xfc\x00\x00',
    b'\xfc\xa8\x5c', b'\xfc\x98\x40', b'\xfc\x88\x20', b'\xfc\x78\x00',
    b'\xe4\x6c\x00', b'\xcc\x60\x00', b'\xb4\x54\x00', b'\x9c\x4c\x00',
    b'\xfc\xfc\xd8', b'\xfc\xfc\xb8', b'\xfc\xfc\x9c', b'\xfc\xfc\x7c',
    b'\xfc\xf8\x5c', b'\xfc\xf4\x40', b'\xfc\xf4\x20', b'\xfc\xf4\x00',
    b'\xe4\xd8\x00', b'\xcc\xc4\x00', b'\xb4\xac\x00', b'\x9c\x9c\x00',
    b'\x84\x84\x00', b'\x70\x6c\x00', b'\x58\x54\x00', b'\x40\x40\x00',
    b'\xd0\xfc\x5c', b'\xc4\xfc\x40', b'\xb4\xfc\x20', b'\xa0\xfc\x00',
    b'\x90\xe4\x00', b'\x80\xcc\x00', b'\x74\xb4\x00', b'\x60\x9c\x00',
    b'\xd8\xfc\xd8', b'\xbc\xfc\xb8', b'\x9c\xfc\x9c', b'\x80\xfc\x7c',
    b'\x60\xfc\x5c', b'\x40\xfc\x40', b'\x20\xfc\x20', b'\x00\xfc\x00',
    b'\x00\xfc\x00', b'\x00\xec\x00', b'\x00\xe0\x00', b'\x00\xd4\x00',
    b'\x04\xc8\x00', b'\x04\xbc\x00', b'\x04\xb0\x00', b'\x04\xa4\x00',
    b'\x04\x98\x00', b'\x04\x88\x00', b'\x04\x7c\x00', b'\x04\x70\x00',
    b'\x04\x64\x00', b'\x04\x58\x00', b'\x04\x4c\x00', b'\x04\x40\x00',
    b'\xd8\xfc\xfc', b'\xb8\xfc\xfc', b'\x9c\xfc\xfc', b'\x7c\xfc\xf8',
    b'\x5c\xfc\xfc', b'\x40\xfc\xfc', b'\x20\xfc\xfc', b'\x00\xfc\xfc',
    b'\x00\xe4\xe4', b'\x00\xcc\xcc', b'\x00\xb4\xb4', b'\x00\x9c\x9c',
    b'\x00\x84\x84', b'\x00\x70\x70', b'\x00\x58\x58', b'\x00\x40\x40',
    b'\x5c\xbc\xfc', b'\x40\xb0\xfc', b'\x20\xa8\xfc', b'\x00\x9c\xfc',
    b'\x00\x8c\xe4', b'\x00\x7c\xcc', b'\x00\x6c\xb4', b'\x00\x5c\x9c',
    b'\xd8\xd8\xfc', b'\xb8\xbc\xfc', b'\x9c\x9c\xfc', b'\x7c\x80\xfc',
    b'\x5c\x60\xfc', b'\x40\x40\xfc', b'\x20\x24\xfc', b'\x00\x04\xfc',
    b'\x00\x00\xfc', b'\x00\x00\xec', b'\x00\x00\xe0', b'\x00\x00\xd4',
    b'\x00\x00\xc8', b'\x00\x00\xbc', b'\x00\x00\xb0', b'\x00\x00\xa4',
    b'\x00\x00\x98', b'\x00\x00\x88', b'\x00\x00\x7c', b'\x00\x00\x70',
    b'\x00\x00\x64', b'\x00\x00\x58', b'\x00\x00\x4c', b'\x00\x00\x40',
    b'\x28\x28\x28', b'\xfc\xe0\x34', b'\xfc\xd4\x24', b'\xfc\xcc\x18',
    b'\xfc\xc0\x08', b'\xfc\xb4\x00', b'\xb4\x20\xfc', b'\xa8\x00\xfc',
    b'\x98\x00\xe4', b'\x80\x00\xcc', b'\x74\x00\xb4', b'\x60\x00\x9c',
    b'\x50\x00\x84', b'\x44\x00\x70', b'\x34\x00\x58', b'\x28\x00\x40',
    b'\xfc\xd8\xfc', b'\xfc\xb8\xfc', b'\xfc\x9c\xfc', b'\xfc\x7c\xfc',
    b'\xfc\x5c\xfc', b'\xfc\x40\xfc', b'\xfc\x20\xfc', b'\xfc\x00\xfc',
    b'\xe0\x00\xe4', b'\xc8\x00\xcc', b'\xb4\x00\xb4', b'\x9c\x00\x9c',
    b'\x84\x00\x84', b'\x6c\x00\x70', b'\x58\x00\x58', b'\x40\x00\x40',
    b'\xfc\xe8\xdc', b'\xfc\xe0\xd0', b'\xfc\xd8\xc4', b'\xfc\xd4\xbc',
    b'\xfc\xcc\xb0', b'\xfc\xc4\xa4', b'\xfc\xbc\x9c', b'\xfc\xb8\x90',
    b'\xfc\xb0\x80', b'\xfc\xa4\x70', b'\xfc\x9c\x60', b'\xf0\x94\x5c',
    b'\xe8\x8c\x58', b'\xdc\x88\x54', b'\xd0\x80\x50', b'\xc8\x7c\x4c',
    b'\xbc\x78\x48', b'\xb4\x70\x44', b'\xa8\x68\x40', b'\xa0\x64\x3c',
    b'\x9c\x60\x38', b'\x90\x5c\x34', b'\x88\x58\x30', b'\x80\x50\x2c',
    b'\x74\x4c\x28', b'\x6c\x48\x24', b'\x5c\x40\x20', b'\x54\x3c\x1c',
    b'\x48\x38\x18', b'\x40\x30\x18', b'\x38\x2c\x14', b'\x28\x20\x0c',
    b'\x60\x00\x64', b'\x00\x64\x64', b'\x00\x60\x60', b'\x00\x00\x1c',
    b'\x00\x00\x2c', b'\x30\x24\x10', b'\x48\x00\x48', b'\x50\x00\x50',
    b'\x00\x00\x34', b'\x1c\x1c\x1c', b'\x4c\x4c\x4c', b'\x5c\x5c\x5c',
    b'\x40\x40\x40', b'\x30\x30\x30', b'\x34\x34\x34', b'\xd8\xf4\xf4',
    b'\xb8\xe8\xe8', b'\x9c\xdc\xdc', b'\x74\xc8\xc8', b'\x48\xc0\xc0',
    b'\x20\xb4\xb4', b'\x20\xb0\xb0', b'\x00\xa4\xa4', b'\x00\x98\x98',
    b'\x00\x8c\x8c', b'\x00\x84\x84', b'\x00\x7c\x7c', b'\x00\x78\x78',
    b'\x00\x74\x74', b'\x00\x70\x70', b'\x00\x6c\x6c', b'\x98\x00\x88',
]


def rlew_decode(data):
    """
    Decode a byte string containing RLEW-encoded data
    :param data: a byte string containing the RLEW-encoded data
    :return: a byte string of decoded data
    """
    size = struct.unpack("<H", data[0:2])[0]
    offset = 2
    output = b''
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
        raise Exception("RLEW decode: Output size mismatch")
    return output


def carmack_decode(data):
    """
    Decode a byte string containing Carmack-encoded data
    :param data: a byte string containing the Carmack-encoded data
    :return: a byte string of decoded data
    """
    size = struct.unpack("<H", data[0:2])[0]
    offset = 2
    output = b''
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
        raise Exception("Carmack decode: Output size mismatch")
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
            raise W3DInvalidLevelIndexException()

        with open(MAPHEAD, "rb") as fp:
            fp.seek(2 + 4 * level)
            offset = struct.unpack("<I", fp.read(4))[0]
        if offset == 0:
            raise W3DInvalidLevelIndexException()
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
        offset = 2 * (x + self.width * y)
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


def make_wall_tileset(output_file="walls.ppm"):
    """
    Create a PPM image containing all wall tiles from the input file
    :param input_file: name of data file containing the textures
    :param output_file: name of the PPM file that will be created
    """
    tileset = bytearray()
    with open(VSWAP, "rb") as fp:
        nb_chunks, first_sprite, first_sound = struct.unpack('<3H', fp.read(6))
        chunk_offset = struct.unpack('<{}I'.format(nb_chunks), fp.read(4 * nb_chunks))
        chunk_length = struct.unpack('<{}H'.format(nb_chunks), fp.read(2 * nb_chunks))
        for i in range(first_sprite):
            fp.seek(chunk_offset[i])
            data = fp.read(chunk_length[i])
            for c in data:
                tileset += palette[c]

    with open(output_file, "wb") as fp:
        fp.write('P6\n'.encode('ascii'))
        fp.write('64 {}\n'.format(64 * first_sprite).encode('ascii'))
        fp.write('255\n'.encode('ascii'))
        fp.write(tileset)


def make_sprite_tileset(output_file="sprites.ppm", indexes=None):
    """
    Create a PPM image containing sprite textures from the input file
    :param output_file: name of the PPM file that will be created
    :param indexes: list of indexes of sprites to add to the tileset
    """
    tileset = bytearray()
    with open(VSWAP, "rb") as fp:
        nb_chunks, first_sprite, first_sound = struct.unpack('<3H', fp.read(6))
        if indexes is None:
            indexes = list(range(first_sound - first_sprite))
        chunk_offset = struct.unpack('<{}I'.format(nb_chunks), fp.read(4 * nb_chunks))
        chunk_length = struct.unpack('<{}H'.format(nb_chunks), fp.read(2 * nb_chunks))

        for sprite_index in indexes:
            sprite_index += first_sprite
            # read the chunk to buffer
            fp.seek(chunk_offset[sprite_index])
            chunk_data = fp.read(chunk_length[sprite_index])
            offset = 0
            # read chunk header
            first_column, last_column = struct.unpack('<HH', chunk_data[offset: offset + 4])
            offset += 4
            nb_columns = last_column - first_column + 1
            first_post_offset = struct.unpack('<{}H'.format(nb_columns), chunk_data[offset: offset + nb_columns * 2])
            offset += nb_columns * 2
            pixel_pool_offset = offset

            # fill blank columns
            tileset += b'\xFF' * 192 * first_column
            for post_offset in first_post_offset:
                # fill a column
                offset = post_offset
                filled_rows = 0
                while True:
                    # read a post
                    if chunk_data[offset] == 0 and chunk_data[offset + 1] == 0:
                        break
                    ending_row, pool_index, starting_row = struct.unpack('<HHH', chunk_data[offset: offset + 6])
                    ending_row //= 2
                    starting_row //= 2
                    offset += 6
                    tileset += b'\xFF' * 3 * (starting_row - filled_rows)
                    for pixel_index in range(ending_row - starting_row):
                        tileset += palette[chunk_data[pixel_pool_offset]]
                        pixel_pool_offset += 1
                    filled_rows = ending_row
                tileset += b'\xFF' * 3 * (64 - filled_rows)
            tileset += b'\xFF' * 192 * (64 - last_column - 1)

    with open(output_file, "wb") as fp:
        fp.write('P6\n'.encode('ascii'))
        fp.write('64 {}\n'.format(64 * len(indexes)).encode('ascii'))
        fp.write('255\n'.encode('ascii'))
        fp.write(tileset)

