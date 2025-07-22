export type QrCodeScannerEndpoints = {
    'oauth-apps.qrcode-verify': {
        POST: (params: { code: string }) => void;
    };
};
