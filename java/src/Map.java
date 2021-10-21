public class Map {
    private byte[] bytes;

    public Map(String filePath) {
        this.bytes = Files.readAllBytes(filePath);
    }

    public isBlocking(int x, int y) {
        return this.bytes[x + 64 * y] <= 63;
    }
}