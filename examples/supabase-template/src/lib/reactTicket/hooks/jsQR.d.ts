declare module '../utils/jsQR' {
  const jsQR: (data: Uint8ClampedArray, width: number, height: number, options?: any) => { data: string; location: any; chunks: any } | null;
  export default jsQR;
}
