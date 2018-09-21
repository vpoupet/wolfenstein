import struct






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

