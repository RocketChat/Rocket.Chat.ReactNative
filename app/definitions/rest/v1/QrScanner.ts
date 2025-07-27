export type QrCodeScannerEndpoints = {
    'qrcode.verify': {
        POST: (params: { code: string }) => { success: boolean; message?: string };
    };
};
