public class Player {
    /**
     * Position of the player on the map (x-coordinate)
     */
    private double x;
    /**
     * Position of the player on the map (y-coordinate)
     */
    private double y;
    /**
     * Player facing direction (x-value)
     */
    private double dx;
    /**
     * Player facing direction (y-value)
     */
    private double dy;
    /**
     * Walking speed
     */
    private double speed;
    /**
     * Turning speed
     */
    private double speed_a;
    /**
     * Current map
     */
    private Map map;

    public Player(double x, double y, double dx, double dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.speed = .065;
        this.speed_a = .05;
    }

    public void setMap(Map map) {
        this.map = map;
    }

    public boolean canMoveTo(double x, double y) {
        return !this.map.isBlocking((int) x, (int) y);
    }

    /**
     * Move forward
     *
     * @param length {number} distance to move (use negative value to move backwards)
     */
    public void move(double length) {
        double x = this.x + this.dx * length;
        double y = this.y + this.dy * length;
        if (this.canMoveTo(x, this.y)) {
            this.x = x;
        }
        if (this.canMoveTo(this.x, y)) {
            this.y = y;
        }
    }

    /**
     * Turn right
     *
     * @param alpha {number} angle in radians to rotate (use negative value to turn left)
     */
    public void turn(double alpha) {
        double dx = this.dx * Math.cos(alpha) - this.dy * Math.sin(alpha);
        this.dy = this.dx * Math.sin(alpha) + this.dy * Math.cos(alpha);
        this.dx = dx;
    }
}
