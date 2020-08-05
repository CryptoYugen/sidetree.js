/**
 * Model for representing an EC public key in a JWK format.
 */
export default interface PublicKeyJwk {
  kty: 'EC';
  crv: 'secp256k1';
  x: string;
  y: string;
  kid: string;
}
