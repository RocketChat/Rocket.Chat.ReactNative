//
//  Encryption.swift
//  RocketChatRN
//
//  Created by Djorkaeff Alexandre Vilela Pereira on 8/11/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation

public extension String {
    
    func base64URLDecode() -> Data? {
        var str = self
        str = str.padding(toLength: ((str.count + 3) / 4) * 4, withPad: "=", startingAt: 0)
        str = str.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
        return Data(base64Encoded: str)
    }
}

extension Data {

    func base64URLEncode() -> String {
        let d = self
        let str = d.base64EncodedString()
        return str.replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
    }
}

@objc(Encryption)
class Encryption: NSObject {

   @objc
   func jwkToPkcs1(_ jwk: NSDictionary, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
      let rsakey = RSA_new()
      defer { RSA_free(rsakey) }
    
      rsakey?.pointee.n = try! base64URLToBignum(jwk["n"] as! String)
      rsakey?.pointee.e = try! base64URLToBignum(jwk["e"] as! String)

      if let d = jwk["d"] as? String {
          rsakey?.pointee.d = try! base64URLToBignum(d)
      }
      if let p = jwk["p"] as? String {
          rsakey?.pointee.p = try! base64URLToBignum(p)
      }
      if let q = jwk["q"] as? String {
          rsakey?.pointee.q = try! base64URLToBignum(q)
      }
      if let dq = jwk["dq"] as? String {
          rsakey?.pointee.dmq1 = try! base64URLToBignum(dq)
      }
      if let dp = jwk["dp"] as? String {
          rsakey?.pointee.dmp1 = try! base64URLToBignum(dp)
      }
      if let qi = jwk["qi"] as? String {
          rsakey?.pointee.iqmp = try! base64URLToBignum(qi)
      }

      let bio = BIO_new(BIO_s_mem())
      defer { BIO_free(bio) }

      let retval = PEM_write_bio_RSAPrivateKey(bio, rsakey, nil, nil, 0, nil, nil)
      let publicKeyLen = BIO_ctrl(bio, BIO_CTRL_PENDING, 0, nil)
    
      guard retval == 1, publicKeyLen > 0 else {
          let error = NSError(domain: "", code: 200, userInfo: nil)
          reject("E_DECODING", "impossible to decode", error)
          return
      }

      let publicKey: UnsafeMutablePointer<UInt8>? = UnsafeMutablePointer<UInt8>.allocate(capacity: Int(publicKeyLen))
      BIO_read(bio, publicKey, Int32(publicKeyLen))
      let pk = Data(bytes: publicKey!, count: Int(publicKeyLen))

      resolve(String(data: pk, encoding: .utf8))
   }
  
  @objc
  func pkcs1ToJwk(_ pkcs1: NSString, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
      let bio = BIO_new_mem_buf(pkcs1.utf8String, Int32(pkcs1.length))
      defer { BIO_free(bio) }
    
      let isPublic = pkcs1.contains("PUBLIC")
      let reader = isPublic ? PEM_read_bio_RSAPublicKey : PEM_read_bio_RSAPrivateKey
      let rsaKey = reader(bio, nil, nil, nil)
    
      var jwk = [
        "alg": "RSA-OAEP-256",
        "ext": true,
        "key_ops": [isPublic ? "encrypt" : "decrypt"],
        "kty": "RSA"
      ] as [String : Any]
    
      if let d = rsaKey?.pointee.d {
          jwk["d"] = bigNumToBase64(d)
      }
      if let e = rsaKey?.pointee.e {
          jwk["e"] = bigNumToBase64(e)
      }
      if let n = rsaKey?.pointee.n {
          jwk["n"] = bigNumToBase64(n)
      }
      if let p = rsaKey?.pointee.p {
          jwk["p"] = bigNumToBase64(p)
      }
      if let q = rsaKey?.pointee.q {
          jwk["q"] = bigNumToBase64(q)
      }
      if let dp = rsaKey?.pointee.dmp1 {
          jwk["dp"] = bigNumToBase64(dp)
      }
      if let dq = rsaKey?.pointee.dmq1 {
          jwk["dq"] = bigNumToBase64(dq)
      }
      if let qi = rsaKey?.pointee.iqmp {
          jwk["qi"] = bigNumToBase64(qi)
      }

      resolve(jwk)
  }
  
  private func bigNumToBase64(_ bn: UnsafeMutablePointer<BIGNUM>) -> String {
      var bytes = [UInt8](repeating: 0, count: Int(BN_num_bits(bn) + 7) / 8)
      BN_bn2bin(bn, &bytes)
      return Data(bytes: bytes, count: bytes.count).base64URLEncode()
  }
  
  private func base64URLToBignum(_ str: String) throws -> UnsafeMutablePointer<BIGNUM> {
      guard let data = str.base64URLDecode() else {
          throw NSError(domain: "", code: 200, userInfo: nil)
      }
      let array = [UInt8](data)
      return array.withUnsafeBufferPointer { p in
          let bn: UnsafeMutablePointer<BIGNUM> = BN_bin2bn(p.baseAddress, Int32(p.count), nil)
          return bn
      }
  }
}
