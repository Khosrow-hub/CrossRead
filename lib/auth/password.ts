import argon2 from "argon2";

// ---------------------------------------------------------------------------
// Password hashing and verification using argon2id.
//
// argon2id is the modern standard for password hashing. It is the default
// winner of the Password Hashing Competition and is recommended by OWASP.
// It resists GPU attacks better than bcrypt and is simpler to tune.
//
// We never store the plain password. We only store the hash.
// The hash includes the salt and parameters, so verification is self contained.
// ---------------------------------------------------------------------------

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB, OWASP recommended minimum
    timeCost: 2,       // 2 iterations, OWASP recommended minimum
    parallelism: 1,
  });
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // argon2.verify throws if the hash is malformed.
    // Treat that as "does not match", never as "matches".
    return false;
  }
}