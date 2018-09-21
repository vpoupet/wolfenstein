def cast_ray(level_map, px, py, rdx, rdy):
    stepx = 1 if rdx >= 0 else -1
    stepy = 1 if rdy >= 0 else -1
    rdx *= stepx
    rdy *= stepy

    cx = int(px)
    cy = int(py)

    rfx = 1 - (px % 1) if stepx > 0 else px % 1
    rfy = 1 - (py % 1) if stepy > 0 else py % 1
    if rfx == 0:
        rfx = 1
        cx += stepx
    if rfy == 0:
        rfy = 1
        cy += stepy

    t = 0

    while True:
        m0, m1 = level_map[cx, cy]
        if m0 <= 63:
            # hit a wall
            if rfx == 1:
                # NS wall
                texture_index = 2 * m0 - 1
                # fix texture orientation depending on ray direction
                tx = 1 - rfy if stepx * stepy > 0 else rfy
            else:
                # EW wall
                texture_index = 2 * m0 - 2
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
    rx = cx + 1 - rfx if stepx > 0 else cx + rfx
    ry = cy + 1 - rfy if stepy > 0 else cy + rfy

    return (rx, ry, t, texture_index, tx)
