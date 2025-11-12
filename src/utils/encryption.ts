import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

export function generateKeyPair() {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: naclUtil.encodeBase64(keyPair.publicKey),
    privateKey: naclUtil.encodeBase64(keyPair.secretKey),
  };
}

export function truncateKey(key: string, length: number = 8): string {
  if (key.length <= length * 2) return key;
  return `${key.substring(0, length)}...${key.substring(key.length - length)}`;
}
