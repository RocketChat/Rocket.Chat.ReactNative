package chat.rocket.reactnative;

import android.util.Base64;

import java.io.IOException;
import java.io.Reader;
import java.io.StringReader;
import java.io.StringWriter;
import java.math.BigInteger;
import java.security.PrivateKey;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.spec.RSAPrivateCrtKeySpec;
import java.util.Arrays;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import org.spongycastle.asn1.ASN1InputStream;
import org.spongycastle.util.io.pem.PemObject;
import org.spongycastle.util.io.pem.PemReader;
import org.spongycastle.util.io.pem.PemWriter;
import org.spongycastle.asn1.pkcs.PrivateKeyInfo;
import org.spongycastle.asn1.ASN1Encodable;
import org.spongycastle.asn1.ASN1Primitive;

public class Encryption extends ReactContextBaseJavaModule {
  @Override
  public String getName() {
    return "Encryption";
  }

  @ReactMethod
  public void jwkToPkcs1(final ReadableMap jwk, final Promise promise) {
    BigInteger modulus = toBigInteger(decodeSequence(jwk.getString("n")));
    BigInteger publicExponent = toBigInteger(decodeSequence(jwk.getString("e")));
    BigInteger privateExponent = toBigInteger(decodeSequence(jwk.getString("d")));
    BigInteger primeP = toBigInteger(decodeSequence(jwk.getString("p")));
    BigInteger primeQ = toBigInteger(decodeSequence(jwk.getString("q")));
    BigInteger primeExpP = toBigInteger(decodeSequence(jwk.getString("dp")));
    BigInteger primeExpQ = toBigInteger(decodeSequence(jwk.getString("dq")));
    BigInteger crtCoefficient = toBigInteger(decodeSequence(jwk.getString("qi")));

    try {
      KeyFactory factory = KeyFactory.getInstance("RSA");
      RSAPrivateKey key = (RSAPrivateKey) factory.generatePrivate(new RSAPrivateCrtKeySpec(
        modulus,
        publicExponent,
        privateExponent,
        primeP,
        primeQ,
        primeExpP,
        primeExpQ,
        crtCoefficient
      ));

      PemObject pemObject = new PemObject("RSA PRIVATE KEY", privateKeyToPkcs1(key));
      StringWriter stringWriter = new StringWriter();
      PemWriter pemWriter = new PemWriter(stringWriter);
      pemWriter.writeObject(pemObject);
      pemWriter.close();

      promise.resolve(stringWriter.toString());
    } catch (Exception ex) {
      promise.reject(ex);
    }
  }

  @ReactMethod
  public void pkcs1ToJwk(final String pem, final Promise promise) {
    try {
      byte[] pkcs1PrivateKey = pemToData(pem);
      ASN1InputStream in = new ASN1InputStream(pkcs1PrivateKey);
      ASN1Primitive obj = in.readObject();
      Boolean isPublic = pem.contains("PUBLIC");

      WritableMap jwk = isPublic ? pkcs1ToPublicKey(obj) : pkcs1ToPrivateKey(obj);
      jwk.putString("kty", "RSA");
      jwk.putString("alg", "RSA-OAEP-256");
      jwk.putBoolean("ext", true);

      WritableArray keyOps = Arguments.createArray();
      if (isPublic) {
        keyOps.pushString("encrypt");
      } else {
        keyOps.pushString("decrypt");
      }
      jwk.putArray("key_ops", keyOps);

      promise.resolve(jwk);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  private WritableMap pkcs1ToPublicKey(ASN1Primitive obj) {
    org.spongycastle.asn1.pkcs.RSAPublicKey keyStruct = org.spongycastle.asn1.pkcs.RSAPublicKey.getInstance(obj);

    WritableMap jwk = Arguments.createMap();
    jwk.putString("n", toString(keyStruct.getModulus(), true));
    jwk.putString("e", toString(keyStruct.getPublicExponent(), false));

    return jwk;
  }

  private WritableMap pkcs1ToPrivateKey(ASN1Primitive obj) {
    org.spongycastle.asn1.pkcs.RSAPrivateKey keyStruct = org.spongycastle.asn1.pkcs.RSAPrivateKey.getInstance(obj);

    WritableMap jwk = Arguments.createMap();
    jwk.putString("n", toString(keyStruct.getModulus(), true));
    jwk.putString("e", toString(keyStruct.getPublicExponent(), false));
    jwk.putString("d", toString(keyStruct.getPrivateExponent(), false));
    jwk.putString("p", toString(keyStruct.getPrime1(), true));
    jwk.putString("q", toString(keyStruct.getPrime2(), true));
    jwk.putString("dp", toString(keyStruct.getExponent1(), true));
    jwk.putString("dq", toString(keyStruct.getExponent2(), true));
    jwk.putString("qi", toString(keyStruct.getCoefficient(), false));

    return jwk;
  }

  private static byte[] privateKeyToPkcs1(PrivateKey privateKey) throws IOException {
    PrivateKeyInfo pkInfo = PrivateKeyInfo.getInstance(privateKey.getEncoded());
    ASN1Encodable encodeable = pkInfo.parsePrivateKey();
    ASN1Primitive primitive = encodeable.toASN1Primitive();
    return primitive.getEncoded();
  }

  private String toString(BigInteger bigInteger, Boolean positive) {
    byte[] array = bigInteger.toByteArray();
    if (positive) {
      array = Arrays.copyOfRange(array, 1, array.length);
    }
    return Base64.encodeToString(array, Base64.URL_SAFE | Base64.NO_PADDING | Base64.NO_WRAP);
  }

  private byte[] pemToData(String pemKey) throws IOException {
    Reader keyReader = new StringReader(pemKey);
    PemReader pemReader = new PemReader(keyReader);
    PemObject pemObject = pemReader.readPemObject();
    return pemObject.getContent();
  }

  private static BigInteger toBigInteger(byte[] bytes) {
    return new BigInteger(1, bytes);
  }

  public static byte[] decodeSequence(String encodedSequence) {
    return Base64.decode(encodedSequence, Base64.URL_SAFE);
  }
}