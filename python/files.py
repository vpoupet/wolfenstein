import struct


class W3DException(Exception):
    pass


VSWAP = '../data/VSWAP.WL6'
MAPHEAD = '../data/MAPHEAD.WL6'
GAMEMAPS = '../data/GAMEMAPS.WL6'


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

