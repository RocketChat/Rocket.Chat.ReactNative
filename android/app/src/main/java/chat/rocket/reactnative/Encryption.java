package chat.rocket.reactnative;

import android.util.Base64;

import java.io.IOException;
import java.io.StringWriter;
import java.math.BigInteger;
import java.security.PrivateKey;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.spec.RSAPrivateCrtKeySpec;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Promise;

import org.spongycastle.util.io.pem.PemObject;
import org.spongycastle.util.io.pem.PemWriter;
import org.spongycastle.asn1.pkcs.PrivateKeyInfo;
import org.spongycastle.asn1.ASN1Encodable;
import org.spongycastle.asn1.ASN1Primitive;

public class Encryption extends ReactContextBaseJavaModule {

  private final ReactApplicationContext reactContext;

  public Encryption(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

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

  private static byte[] privateKeyToPkcs1(PrivateKey privateKey) throws IOException {
    PrivateKeyInfo pkInfo = PrivateKeyInfo.getInstance(privateKey.getEncoded());
    ASN1Encodable encodeable = pkInfo.parsePrivateKey();
    ASN1Primitive primitive = encodeable.toASN1Primitive();
    return primitive.getEncoded();
  }

  private static BigInteger toBigInteger(byte[] bytes) {
    return new BigInteger(1, bytes);
  }

  public static byte[] decodeSequence(String encodedSequence) {
    return Base64.decode(encodedSequence, Base64.URL_SAFE);
  }
}