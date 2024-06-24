// https://medium.com/@hamidptb/implementing-mtls-on-ios-using-urlsession-and-cloudflare-890b76aca66c

import Foundation

final class URLSesionClientCertificateHandling: NSObject, URLSessionDelegate {
	private let certificate: Data?
	private let password: String?
	
	init(certificate: Data?, password: String?) {
		self.certificate = certificate
		self.password = password
	}
	
	public func urlSession(
		_: URLSession,
		didReceive challenge: URLAuthenticationChallenge,
		completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
	) {
		guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodClientCertificate else {
			completionHandler(.performDefaultHandling, nil)
			return
		}
		
		guard let credential = Credentials.urlCredential(certificate: certificate, password: password) else {
			completionHandler(.performDefaultHandling, nil)
			return
		}
		
		challenge.sender?.use(credential, for: challenge)
		completionHandler(.useCredential, credential)
	}
}

fileprivate typealias UserCertificate = (data: Data, password: String)

fileprivate final class Credentials {
	static func urlCredential(certificate: Data?, password: String?) -> URLCredential? {
		guard let certificate, let password else { return nil }
		
		let p12Contents = PKCS12(pkcs12Data: certificate, password: password)
		
		guard let identity = p12Contents.identity else {
			return nil
		}
		
		return URLCredential(identity: identity, certificates: nil, persistence: .none)
	}
}

fileprivate struct PKCS12 {
	let label: String?
	let keyID: NSData?
	let trust: SecTrust?
	let certChain: [SecTrust]?
	let identity: SecIdentity?
	
	public init(pkcs12Data: Data, password: String) {
		let importPasswordOption: NSDictionary
		= [kSecImportExportPassphrase as NSString: password]
		var items: CFArray?
		let secError: OSStatus
		= SecPKCS12Import(pkcs12Data as NSData,
						  importPasswordOption, &items)
		guard secError == errSecSuccess else {
			if secError == errSecAuthFailed {
				NSLog("Incorrect password?")
			}
			fatalError("Error trying to import PKCS12 data")
		}
		guard let theItemsCFArray = items else { fatalError() }
		let theItemsNSArray: NSArray = theItemsCFArray as NSArray
		guard let dictArray
				= theItemsNSArray as? [[String: AnyObject]]
		else {
			fatalError()
		}
		
		label = dictArray.element(for: kSecImportItemLabel)
		keyID = dictArray.element(for: kSecImportItemKeyID)
		trust = dictArray.element(for: kSecImportItemTrust)
		certChain = dictArray.element(for: kSecImportItemCertChain)
		identity = dictArray.element(for: kSecImportItemIdentity)
	}
}

fileprivate extension Array where Element == [String: AnyObject] {
	func element<T>(for key: CFString) -> T? {
		for dictElement in self {
			if let value = dictElement[key as String] as? T {
				return value
			}
		}
		return nil
	}
}
