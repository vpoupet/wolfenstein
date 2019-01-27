import struct

VSWAP = "../data/VSWAP.WL6"
MAPHEAD = "../data/MAPHEAD.WL6"
GAMEMAPS = "../data/GAMEMAPS.WL6"

"""
Game palette (RGB)
"""
palette = [bytes(c) for c in [
    (0, 0, 0), (0, 0, 168), (0, 168, 0), (0, 168, 168),
    (168, 0, 0), (168, 0, 168), (168, 84, 0), (168, 168, 168),
    (84, 84, 84), (84, 84, 252), (84, 252, 84), (84, 252, 252),
    (252, 84, 84), (252, 84, 252), (252, 252, 84), (252, 252, 252),
    (236, 236, 236), (220, 220, 220), (208, 208, 208), (192, 192, 192),
    (180, 180, 180), (168, 168, 168), (152, 152, 152), (140, 140, 140),
    (124, 124, 124), (112, 112, 112), (100, 100, 100), (84, 84, 84),
    (72, 72, 72), (56, 56, 56), (44, 44, 44), (32, 32, 32),
    (252, 0, 0), (236, 0, 0), (224, 0, 0), (212, 0, 0),
    (200, 0, 0), (188, 0, 0), (176, 0, 0), (164, 0, 0),
    (152, 0, 0), (136, 0, 0), (124, 0, 0), (112, 0, 0),
    (100, 0, 0), (88, 0, 0), (76, 0, 0), (64, 0, 0),
    (252, 216, 216), (252, 184, 184), (252, 156, 156), (252, 124, 124),
    (252, 92, 92), (252, 64, 64), (252, 32, 32), (252, 0, 0),
    (252, 168, 92), (252, 152, 64), (252, 136, 32), (252, 120, 0),
    (228, 108, 0), (204, 96, 0), (180, 84, 0), (156, 76, 0),
    (252, 252, 216), (252, 252, 184), (252, 252, 156), (252, 252, 124),
    (252, 248, 92), (252, 244, 64), (252, 244, 32), (252, 244, 0),
    (228, 216, 0), (204, 196, 0), (180, 172, 0), (156, 156, 0),
    (132, 132, 0), (112, 108, 0), (88, 84, 0), (64, 64, 0),
    (208, 252, 92), (196, 252, 64), (180, 252, 32), (160, 252, 0),
    (144, 228, 0), (128, 204, 0), (116, 180, 0), (96, 156, 0),
    (216, 252, 216), (188, 252, 184), (156, 252, 156), (128, 252, 124),
    (96, 252, 92), (64, 252, 64), (32, 252, 32), (0, 252, 0),
    (0, 252, 0), (0, 236, 0), (0, 224, 0), (0, 212, 0),
    (4, 200, 0), (4, 188, 0), (4, 176, 0), (4, 164, 0),
    (4, 152, 0), (4, 136, 0), (4, 124, 0), (4, 112, 0),
    (4, 100, 0), (4, 88, 0), (4, 76, 0), (4, 64, 0),
    (216, 252, 252), (184, 252, 252), (156, 252, 252), (124, 252, 248),
    (92, 252, 252), (64, 252, 252), (32, 252, 252), (0, 252, 252),
    (0, 228, 228), (0, 204, 204), (0, 180, 180), (0, 156, 156),
    (0, 132, 132), (0, 112, 112), (0, 88, 88), (0, 64, 64),
    (92, 188, 252), (64, 176, 252), (32, 168, 252), (0, 156, 252),
    (0, 140, 228), (0, 124, 204), (0, 108, 180), (0, 92, 156),
    (216, 216, 252), (184, 188, 252), (156, 156, 252), (124, 128, 252),
    (92, 96, 252), (64, 64, 252), (32, 36, 252), (0, 4, 252),
    (0, 0, 252), (0, 0, 236), (0, 0, 224), (0, 0, 212),
    (0, 0, 200), (0, 0, 188), (0, 0, 176), (0, 0, 164),
    (0, 0, 152), (0, 0, 136), (0, 0, 124), (0, 0, 112),
    (0, 0, 100), (0, 0, 88), (0, 0, 76), (0, 0, 64),
    (40, 40, 40), (252, 224, 52), (252, 212, 36), (252, 204, 24),
    (252, 192, 8), (252, 180, 0), (180, 32, 252), (168, 0, 252),
    (152, 0, 228), (128, 0, 204), (116, 0, 180), (96, 0, 156),
    (80, 0, 132), (68, 0, 112), (52, 0, 88), (40, 0, 64),
    (252, 216, 252), (252, 184, 252), (252, 156, 252), (252, 124, 252),
    (252, 92, 252), (252, 64, 252), (252, 32, 252), (252, 0, 252),
    (224, 0, 228), (200, 0, 204), (180, 0, 180), (156, 0, 156),
    (132, 0, 132), (108, 0, 112), (88, 0, 88), (64, 0, 64),
    (252, 232, 220), (252, 224, 208), (252, 216, 196), (252, 212, 188),
    (252, 204, 176), (252, 196, 164), (252, 188, 156), (252, 184, 144),
    (252, 176, 128), (252, 164, 112), (252, 156, 96), (240, 148, 92),
    (232, 140, 88), (220, 136, 84), (208, 128, 80), (200, 124, 76),
    (188, 120, 72), (180, 112, 68), (168, 104, 64), (160, 100, 60),
    (156, 96, 56), (144, 92, 52), (136, 88, 48), (128, 80, 44),
    (116, 76, 40), (108, 72, 36), (92, 64, 32), (84, 60, 28),
    (72, 56, 24), (64, 48, 24), (56, 44, 20), (40, 32, 12),
    (96, 0, 100), (0, 100, 100), (0, 96, 96), (0, 0, 28),
    (0, 0, 44), (48, 36, 16), (72, 0, 72), (80, 0, 80),
    (0, 0, 52), (28, 28, 28), (76, 76, 76), (92, 92, 92),
    (64, 64, 64), (48, 48, 48), (52, 52, 52), (216, 244, 244),
    (184, 232, 232), (156, 220, 220), (116, 200, 200), (72, 192, 192),
    (32, 180, 180), (32, 176, 176), (0, 164, 164), (0, 152, 152),
    (0, 140, 140), (0, 132, 132), (0, 124, 124), (0, 120, 120),
    (0, 116, 116), (0, 112, 112), (0, 108, 108), (152, 0, 136),
]]


def make_wall_tileset(output_file="walls.ppm"):
    """
    Create a PPM image containing all wall tiles from the input file
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


def make_wall_sprites(output_prefix=""):
    """
    Create a set of PPM images representing all the wall tiles in VSWAP.WL6
    :param output_prefix: common prefix of output files. The index of the wall and the .ppm extension will be appended
    to that prefix for each texture (eg: if prefix is "wall", outputs will be wall000.ppm, wall001.ppm, etc.)

    Note: Because textures are written in the game file by columns, the resulting images appear to be "transposed".
    """
    with open(VSWAP, "rb") as fp_in:
        nb_chunks, first_sprite, first_sound = struct.unpack('<3H', fp_in.read(6))
        chunk_offset = struct.unpack('<{}I'.format(nb_chunks), fp_in.read(4 * nb_chunks))
        chunk_length = struct.unpack('<{}H'.format(nb_chunks), fp_in.read(2 * nb_chunks))
        # process all textures
        for i in range(first_sprite):
            fp_in.seek(chunk_offset[i])
            data = fp_in.read(chunk_length[i])
            with open(output_prefix + "{:03}".format(i), "wb") as fp_out:
                fp_out.write('P6\n'.encode('ascii'))
                fp_out.write('64 64\n'.encode('ascii'))
                fp_out.write('255\n'.encode('ascii'))
                for c in data:
                    fp_out.write(palette[c])


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

