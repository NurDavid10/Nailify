declare module 'qrcode' {
  interface QRCodeToDataURLOptions {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    type?: 'image/png' | 'image/jpeg' | 'image/webp';
    quality?: number;
  }

  function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;

  export { toDataURL };
  export default { toDataURL };
}
