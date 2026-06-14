export class CodeGenerator {
  static generate(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const array = new Uint8Array(1);
    while (result.length < length) {
      crypto.getRandomValues(array);
      if (array[0] < Math.floor(256 / chars.length) * chars.length) {
        result += chars[array[0] % chars.length];
      }
    }
    return result;
  }
}
