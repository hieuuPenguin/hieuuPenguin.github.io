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

Check source code có thẻ `<p>` bị ẩn:

![](./image.png)

Gửi request POST tới form sẽ làm server set cookie `silver_coffer`:

![](./image-1.png)

Kiểm tra `/robots.txt`:

![](./image-2.png)

![](./image-3.png)

### Flag

```text
tjctf{s1lv3r_and_g0ld}
```