# Wolfenstein 3D game file specifications

Most of the information on this page is actually taken from [Gaarabis's page](http://gaarabis.free.fr/_sites/specs/wlspec_index.html). There are however some inaccuracies in that page, as well as some missing information on how the sprites are stored.

Three files are used in this project:
- `VSWAP.WL6` contains the wall textures, the sprite graphics (also the sound effects but not used in this project);
- `GAMEMAPS.WL6` contains the map data for all levels (walls, enemies, objects, etc.);
- `MAPHEAD.WL6` contains a list of offsets to the data for each level in the `GAMEMAPS.WL6` file.

#### Endianness

In all files, all multi-byte integers are stored in little-endian format.

## Compression

Most of the data in the game files is compressed. Two algorithms are used

### Row-Length Encoding Word (RLEW) Compression

Row-length encoding is a commonly used compression algorithm. The general idea is that sequences of identical symbols are represented by giving the number of repetitions followed by the symbol, which saves space for files containing long sequences of repeated symbols. In the case of RLEW, the considered symbols are *words* (2 bytes).

A special 16 bits value (*RLEW tag*) is used to indicate a repeated value (for Wolfenstein 3D, the tag is the first 2 bytes of `MAPHEAD.WL6`, which is `0xFEFE`). The decoding algorithm is:
- Read first 2 bytes of input file. This is the total length in bytes of the decoded data
- While the decoded data length is less than the total length (or while there are bytes to decode):
    - read a word *w*
    - if the word is the RLEW tag, read two more words *w1* and *w2*, repeat *w1* times the word *w2* in the output
    - otherwise, write *w* in the output

See function `rlewDecode` in `js/files.js` for an implementation.

### Carmack Compression

Carmack compression is an algorithm designed by John Carmack for ID Soft games. The idea is to identify repeating patterns in the data to compress and when such a repetition is found, to describe the repeated pattern by pointing to its previous appearance. Although this idea is similar to Lempel-Ziv compression, pointers to previous patterns are encoded in a more complicated way. There are *near pointers* and *far pointers*.

Near pointers point to an address relative to the current decoding position. The offsets for near pointers are only one byte long so they can only point to one of the last 255 previously decoded words. Far pointers are absolute addresses from the start of the decoded data (but they point to *words* so the address in bytes is twice the represented value). Their offsets are encoded on 2 bytes.

As with RLEW-encoding the first word represents the total length in bytes of the decoded data. After this, while there is data to be read (or while the decoded data length is less than the total expected length):
- read two bytes *x* and *y*
- if *y* is neither 0xA7 nor 0xA8, append the word *xy* to the output (no pointer)
- if *y* is 0xA7, it indicates a near pointer. In that case, an extra byte *z* should be read that indicates the offset in words (counted backwards from the current location in the output) where the repeated sequence starts. *x* words should be appended to the output from that position.
- if *y* is 0xA8, it indicates a far pointer. An extra word *w* should be read that indicates the absolute offset in words from which the repeated sequence starts. *x* words should be appended to the output from that absolute position.

**Note:** Because 0xA7 and 0xA8 have special meaning, a special case is used to represent directly words that have one of these as second byte: an exception is recognized when *x* = 0 and *y* = 0xA7 or 0xA8. In that case an extra byte *z* is read and the word *zy* is appended to the output.

See function `carmackDecode` in `js/files.js` for an implementation.

## MAPHEAD.WL6

This very short file contains the *RLEW tag* used for all other RLEW-compressed files (it's 0xFEFE) as well as offsets to the data for each level in the `GAMEMAPS.WL6` file:

|`UInt16`      | RLEW tag |
|`UInt32[100]` | Offsets for levels 00 to 99 in `GAMEMAPS.WL6` |
