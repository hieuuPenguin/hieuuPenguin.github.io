---
title: "TJCTF2026-web/treasure-hunt"
description: "CTF writeup - web/treasure-hunt (TJCTF 2026)"
date: 2026-05-17
tags: [CTF, Web, TJCTF]
category: "TJCTF 2026"
cover: ./cover.png
pinned: false
draft: false
---

Checking the source code reveals a hidden `<p>` tag:

![](./image.png)

Sending a POST request to the form makes the server set the `silver_coffer` cookie:

![](./image-1.png)

Check `/robots.txt`:

![](./image-2.png)

![](./image-3.png)

### Flag

```text
tjctf{s1lv3r_and_g0ld}
```
