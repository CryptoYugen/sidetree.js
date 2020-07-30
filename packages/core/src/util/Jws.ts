import {
  Encoder,
  ErrorCode,
  JwkEs256k,
  JwsModel,
  SidetreeError,
} from '@sidetree/common';
import { JWS } from 'jose';
import { ES256K } from '@transmute/did-key-secp256k1';

/**
 * Class containing reusable JWS operations.
 */
export default class Jws {
  /** Protected header. */
  public readonly protected: string;
  /** Payload. */
  public readonly payload: string;
  /** Signature. */
  public readonly signature: string;

  /**
   * Constructs a JWS object.
   * @param compactJws Input should be a compact JWS string.
   */
  private constructor(compactJws: any) {
    if (typeof compactJws !== 'string') {
      throw new SidetreeError(ErrorCode.JwsCompactJwsNotString);
    }

    const parts = compactJws.split('.');
    if (parts.length !== 3) {
      throw new SidetreeError(ErrorCode.JwsCompactJwsInvalid);
    }

    const protectedHeader = parts[0];
    const payload = parts[1];
    const signature = parts[2];

    const decodedProtectedHeadJsonString = Encoder.decodeBase64UrlAsString(
      protectedHeader
    );
    const decodedProtectedHeader = JSON.parse(decodedProtectedHeadJsonString);

    const expectedHeaderPropertyCount = 1; // By default we must have header property is `alg`.

    const headerProperties = Object.keys(decodedProtectedHeader);
    if (headerProperties.length !== expectedHeaderPropertyCount) {
      throw new SidetreeError(
        ErrorCode.JwsProtectedHeaderMissingOrUnknownProperty
      );
    }

    // Protected header must contain 'alg' property with value 'ES256K'.
    if (decodedProtectedHeader.alg !== 'ES256K') {
      throw new SidetreeError(
        ErrorCode.JwsProtectedHeaderMissingOrIncorrectAlg
      );
    }

    // Must contain Base64URL string 'signature' property.
    if (!Encoder.isBase64UrlString(signature)) {
      throw new SidetreeError(ErrorCode.JwsSignatureNotBase64UrlString);
    }

    // Must contain Base64URL string 'payload' property.
    if (!Encoder.isBase64UrlString(payload)) {
      throw new SidetreeError(ErrorCode.JwsPayloadNotBase64UrlString);
    }

    this.protected = protectedHeader;
    this.payload = payload;
    this.signature = signature;
  }

  /**
   * Converts this object to a compact JWS string.
   */
  public toCompactJws(): string {
    return Jws.createCompactJws(this.protected, this.payload, this.signature);
  }

  /**
   * Verifies the JWS signature.
   * @returns true if signature is successfully verified, false otherwise.
   */
  public async verifySignature(publicKey: JwkEs256k): Promise<boolean> {
    return Jws.verifySignature(
      this.protected,
      this.payload,
      this.signature,
      publicKey
    );
  }

  /**
   * Verifies the JWS signature.
   * @returns true if signature is successfully verified, false otherwise.
   */
  public static async verifySignature(
    encodedProtectedHeader: string,
    encodedPayload: string,
    signature: string,
    publicKey: JwkEs256k
  ): Promise<boolean> {
    const jwsSigningInput =
      encodedProtectedHeader + '.' + encodedPayload + '.' + signature;
    const signatureValid = await Jws.verifyCompactJws(
      jwsSigningInput,
      publicKey
    );
    return signatureValid;
  }

  /**
   * Verifies the compact JWS string using the given JWK key.
   * @returns true if signature is valid; else otherwise.
   */
  public static async verifyCompactJws(
    compactJws: string,
    jwk: any
  ): Promise<boolean> {
    try {
      await ES256K.verify(compactJws, jwk);
      return true;
    } catch (error) {
      console.log(
        `Input '${compactJws}' failed signature verification: ${SidetreeError.createFromError(
          ErrorCode.JwsFailedSignatureValidation,
          error
        )}`
      );
      return false;
    }
  }

  /**
   * Signs the given protected header and payload as a JWS.
   * NOTE: this is mainly used by tests to create valid test data.
   *
   * @param payload If the given payload is of string type, it is assumed to be encoded string;
   *                else the object will be stringified and encoded.
   */
  public static async sign(
    protectedHeader: any,
    payload: any,
    privateKey: JwkEs256k
  ): Promise<JwsModel> {
    const flattenedJws = JWS.sign.flattened(
      payload,
      privateKey as any,
      protectedHeader
    );
    const jws = {
      protected: flattenedJws.protected!,
      payload: flattenedJws.payload,
      signature: flattenedJws.signature,
    };

    return jws;
  }

  /**
   * Signs the given payload as a compact JWS string.
   * This is mainly used by tests to create valid test data.
   */
  public static async signAsCompactJws(
    payload: object,
    privateKey: any,
    protectedHeader?: object
  ): Promise<string> {
    // ES256K requires private key to have a kid property
    const privateKeyWithKid = {
      ...privateKey,
      kid: '',
    };
    // ES256K requires header to have an alg property
    const header = {
      ...protectedHeader,
      alg: '',
    };
    const compactJws = await ES256K.sign(payload, privateKeyWithKid, header);
    return compactJws;
  }

  /**
   * Parses the input as a `Jws` object.
   */
  public static parseCompactJws(compactJws: any): Jws {
    return new Jws(compactJws);
  }

  /**
   * Creates a compact JWS string using the given input. No string validation is performed.
   */
  public static createCompactJws(
    protectedHeader: string,
    payload: string,
    signature: string
  ): string {
    return protectedHeader + '.' + payload + '.' + signature;
  }
}
