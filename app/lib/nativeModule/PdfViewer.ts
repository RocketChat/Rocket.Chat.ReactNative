import { NativeModules } from 'react-native';

interface PdfViewerInterface {
	openPdf(filePath: string): Promise<void>;
}

declare module 'react-native' {
	interface NativeModulesStatic {
		PdfViewer: PdfViewerInterface;
	}
}

const { PdfViewer } = NativeModules;

export { PdfViewer };
