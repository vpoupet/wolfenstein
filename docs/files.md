# Wolfenstein 3D game file specifications

Most of the information on this page is taken from [Gaarabis's page](http://gaarabis.free.fr/_sites/specs/wlspec_index.html) and the [Wolfenstein wiki](https://wolfenstein.fandom.com/wiki/Wolfenstein_Wiki).

Three files are used in this project:
- `VSWAP.WL6` contains the wall textures, the sprite graphics (also the sound effects but not used in this project);
- `GAMEMAPS.WL6` contains the map data for all levels (walls, enemies, objects, etc.);
- `MAPHEAD.WL6` contains a list of offsets to the data for each level in the `GAMEMAPS.WL6` file.

**Note:** In all files, all multi-byte integers are stored in little-endian format.

## Compression

Most of the data in the game files is compressed. Two algorithms are used

### Row-Length Encoding Word (RLEW) Compression

Row-length encoding is a commonly used compression algorithm. The general idea is that sequences of identical symbols are represented by giving the number of repetitions followed by the symbol, which saves space for files containing long sequences of repeated symbols. In the case of RLEW, the considered symbols are *words* (UInt16LE).

A special UInt16LE value (*RLEW tag*) is used to indicate a repeated value (for Wolfenstein 3D, the tag is the first word in `MAPHEAD.WL6`, which is 0xABCD). The decoding algorithm is:
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

This very short file contains the *RLEW tag* used for all other RLEW-compressed files (it's 0xABCD) as well as offsets to the data for each level in the `GAMEMAPS.WL6` file:

| Type          | Description                                                   |
|---------------|---------------------------------------------------------------|
| UInt16LE      | RLEW tag                                                      |
| UInt32LE[100] | Offsets for levels 00 to 99 in `GAMEMAPS.WL6`                 |

**Note:** Levels in Wolfenstein 3D are grouped into episodes. Each episode has 9 regular levels and one secret level. The original game had 3 episodes but later versions contained 3 more (the *Nocturnal Missions*) for a total of 6 episodes. Levels are numbered from 00 to 59 (first digit for the episode, second for the level number, 9 being the secret level). The `MAPHEAD.WL6` file always has 100 pointers but the ones for which the game has no map are zeroes.

## GAMEMAPS.WL6

Each level is represented by two 64x64 grids of values. The first (plane 0) contains positions and types of walls, doors and "sectors" (floor tiles are indexed and grouped as rooms). The second (plane 1) contains information for *things* (collectibles, enemies, sprites, pushwalls, etc.). Some other ID Soft games use a third grid to describe levels (plane 2) so there are pointers to it in the level headers but it is never used in Wolfenstein 3D. Each plane data is compressed by RLEW compression followed by Carmack compression.

Because all planes are 64x64 grids containing 2-byte values, the decompressed data for each plane should be 8192 bytes long. Values are stored from left to right, top to bottom (the first value is the top left corner, followed by all values in the top line, and ending with the bottom right corner).

### Headers

The address for each level in `MAPHEAD.WL6` points to a 42-bytes header in `GAMEMAPS.WL6` containing the following information:

| Type     | Description                                                        |
|----------|--------------------------------------------------------------------|
| UInt32LE | Offset in file of plane 0 compressed data                          |
| UInt32LE | Offset in file of plane 1 compressed data                          |
| UInt32LE | Offset in file of plane 2 compressed data (unused)                 |
| UInt16LE | Size in bytes of plane 0 compressed data                           |
| UInt16LE | Size in bytes of plane 1 compressed data                           |
| UInt16LE | Size in bytes of plane 2 compressed data (unused)                  |
| UInt16LE | Width of the level grid (always 64)                                |
| UInt16LE | Height of the level grid (always 64)                               |
| Char[16] | 0-terminated name of the map (for instance "Wolf3 Map1")           |

### Plane 0

Plane 0 contains structural information for each cell of the level. Each cell can either be a wall, a door, an elevator (end of level) of a walkable tile (floor).

The value of a wall is used to determine the graphic texture in the `VSWAP.WL6` file to use by the engine when representing the wall. Each door type has two indexes to indicate its direction. An even index corresponds to a door along the North/South axis (player moves through it along the East/West axis) and an odd index to a door along the East/West axis.

The value of a walkable tile is used to represent "rooms", but it is only used for enemy AI (the Wolfenstein 3D engine doesn't represent textures on floors and ceilings).

Possible values for plane 0 tiles:

| Value     | Description                                                       |
|-----------|-------------------------------------------------------------------|
| 000 - 063 | Walls                                                             |
| 090 - 091 | Regular unlocked door (oriented)                                  |
| 092 - 093 | Gold-locked door (oriented)                                       |
| 094 - 095 | Silver-locked door (oriented)                                     |
| 100 - 101 | Elevator door (oriented)                                          |
| 106 - 143 | Walkable tile (room)                                              |

### Plane 1

Plane 1 contains locations for "things" (enemies, collectibles, or "decorative" props) or special properties (secret pushwalls, player spawn location). Some of these can be oriented, in which case they can have 4 consecutive possible values, corresponding to orientations North, East, South and West respectively.

| Value     | Description                                                       |
|-----------|-------------------------------------------------------------------|
| 019 - 022 | Player spawn (oriented)                                           |
| 023 - 070 | Props                                                             |
| 029       | Dog food                                                          |
| 043 - 044 | Key (silver, gold)                                                |
| 047       | Food                                                              |
| 048       | Medkit                                                            |
| 049       | Ammo clip                                                         |
| 050       | Machine gun                                                       |
| 051       | Chaingun                                                          |
| 052 - 055 | Treasure (cross, chalice, chest, crown)                           |
| 056       | Life up                                                           |
| 124       | Dead guard                                                        |
| 098       | Pushwall                                                          |
| 108 - 227 | Enemies                                                           |

#### Props

Props are represented by values from 23 to 70 in plane 2. They exactly correspond to the sprites at indexes from 2 to 49 in `VSWAP.WL6` (prop with value *n* uses sprite at index (*n* - 21)). Most of the props are purely for decoration and can be walked through. However, the following props are blocking (the player can't step on the tile on which they are): 

| PropID    | Description           |
|-----------|-----------------------|
| 24        | Green barrel          |
| 25        | Table and chairs      |
| 26        | Floor lamp            |
| 28        | Hanged skeleton       |
| 30        | White pillar          |
| 31        | Tree                  |
| 33        | Sink                  |
| 34        | Potted plant          |
| 35        | Urn                   |
| 36        | Bare table            |
| 39        | Suit of armor         |
| 40        | Hanging cage          |
| 41        | Skeleton in cage      |
| 45        | Bed                   |
| 58        | Barrel                |
| 59        | Well                  |
| 60        | Empty well            |
| 62        | Flag                  |
| 63        | Call Apogee           |
| 68        | Stove                 |
| 69        | Spears                |

#### Enemies

There are 5 types of regular enemies:
- Guard (brown uniform)
- Officer (white uniform)
- SS (blue uniform)
- Dog
- Mutant (green uniform and white skin)

Regular enemies can be oriented in any of the 4 cardinal directions. They can either be standing still (until they detect the player) or patrolling along a set course. Moreover, Wolfenstein 3D has 4 difficulty settings ("Can I play, Daddy?", "Don't hurt me.", "Bring 'em on!" and "I am Death incarnate"). Some enemies only appear in the first two difficulty settings (same enemies for both difficulties), some more appear on the third level and the last difficulty setting has even more enemies.

All in all, there are 24 possible values for each regular enemy type (4 directions x 2 patrolling states x 3 difficulty settings):

| Value     | Description                                                       |
|-----------|-------------------------------------------------------------------|
| 108 - 111 | Standing guard (oriented - Any difficulty)                        |
| 116 - 119 | Standing officer (oriented - Any difficulty)                      |
| 126 - 129 | Standing SS (oriented - Any difficulty)                           |
| 134 - 137 | Standing dog (oriented - Any difficulty)                          |
| 216 - 219 | Standing mutant (oriented - Any difficulty)                       |
| 112 - 115 | Patrolling guard (oriented - Any difficulty)                      |
| 120 - 123 | Patrolling officer (oriented - Any difficulty)                    |
| 130 - 133 | Patrolling SS (oriented - Any difficulty)                         |
| 138 - 141 | Patrolling dog (oriented - Any difficulty)                        |
| 220 - 223 | Patrolling mutant (oriented - Any difficulty)                     |
| 144 - 147 | Standing guard (oriented - Medium)                                |
| 152 - 155 | Standing officer (oriented - Medium)                              |
| 162 - 165 | Standing SS (oriented - Medium)                                   |
| 170 - 173 | Standing dog (oriented - Medium)                                  |
| 234 - 237 | Standing mutant (oriented - Medium)                               |
| 148 - 151 | Patrolling guard (oriented - Medium)                              |
| 156 - 159 | Patrolling officer (oriented - Medium)                            |
| 166 - 169 | Patrolling SS (oriented - Medium)                                 |
| 174 - 177 | Patrolling dog (oriented - Medium)                                |
| 238 - 241 | Patrolling mutant (oriented - Medium)                             |
| 180 - 183 | Standing guard (oriented - Hard)                                  |
| 188 - 191 | Standing officer (oriented - Hard)                                |
| 198 - 201 | Standing SS (oriented - Hard)                                     |
| 206 - 209 | Standing dog (oriented - Hard)                                    |
| 252 - 255 | Standing mutant (oriented - Hard)                                 |
| 184 - 187 | Patrolling guard (oriented - Hard)                                |
| 192 - 195 | Patrolling officer (oriented - Hard)                              |
| 202 - 205 | Patrolling SS (oriented - Hard)                                   |
| 210 - 213 | Patrolling dog (oriented - Hard)                                  |
| 256 - 259 | Patrolling mutant (oriented - Hard)                               |

There are also some special enemies considered as bosses (or sub-bosses). These are always facing the player (so they are not oriented) and appear in all difficulty settings:

| Value     | Description                                                       |
|-----------|-------------------------------------------------------------------|
| 160       | Fake Hitler                                                       |
| 178       | Hitler                                                            |
| 179       | General Fettgesicht                                               |
| 196       | Doctor Schabbs                                                    |
| 197       | Gretel Grosse                                                     |
| 214       | Hans Grosse                                                       |
| 215       | Otto Giftmacher                                                   |
| 224       | Red Pac-Man ghost (Blinky)                                        |                                   
| 225       | Pink Pac-Man ghost (Pinky)                                        |                                   
| 226       | Orange Pac-Man ghost (Clyde)                                      |                                   
| 227       | Blue Pac-Man ghost (Inky)                                         |                                   

#### Example

Let's see how we can find the value in cell (49, 30) of Plane 1 in Floor 9 of Episode 3 (E3L9).

- E3L9 is level number 28, so read the UInt32LE in `MAPHEAD.WL6` at offset (2 + 28 * 4). It's 70103.
- Read the header at offset 70103 in `GAMEMAPS.WL6`. Because we want to decode Plane 1, read the UInt32LE at address (70103 + 4) and the UInt16LE at address (70103 + 14). The first is 69762 (offset of compressed data for plane 1) and the second is 331 (size of compressed data).
- Decompress the 331 bytes starting at address 69762 with Carmack and then RLEW. We obtain an array of 8192 bytes (which is the expected size of a decompressed level data).
- To get the element in cell (49, 30), read the UInt16LE at index (2 * (49 + 64 * 30)) in the array. It's 178, so Hitler is on that cell.


## VSWAP.WL6

This file contains all the wall textures, the sprite textures and the sounds for the game.