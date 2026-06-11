---
title: "UMassCTF2026-ORDER66"
description: "CTF writeup - ORDER66 (UMassCTF 2026)"
date: 2026-04-12
tags: [CTF, Web, UMassCTF]
category: "UMassCTF 2026"
cover: ./cover.png
pinned: false
draft: false
---

### Overview

This web challenge is a form of conditional stored XSS. The player can enter data into multiple `ORDER_x` fields. On submit, the server picks only a single field to render unsafely. If you put the XSS payload in exactly that field, then make the admin/chancellor bot visit the page `/view/<uid>/<seed>`, the payload will run in the bot's browser.

### Only 1 field is rendered unsafely

In the template, the server renders as follows:

```jinja2
{% if i == vuln_index %}
    {{ content | safe }}
{% else %}
    {{ content }}
{% endif %}
```

This means:

- if the payload is in exactly `vuln_index` -> XSS runs
- if it's in the wrong field -> the payload only shows as text

### `vuln_index` is computed from `seed`

On the server side:

```python
random.seed(seed)
v_index = random.randint(1, 66)
```

Meanwhile `seed` is exposed publicly via the link `/view/<uid>/<seed>` shown in the UI.

So we just need to take the `seed`, re-run the exact Python logic, and we can compute the vuln_index field

![](./image.png)

```python
import random
random.seed(6991)
print(random.randint(1, 66))
```

the result is:

```text
25
```

=> the payload must be inserted into **ORDER_54**.


### Exploitation payload

After identifying the vulnerable field, we just need to insert a simple XSS payload like:

```html
<script>console.log(document.cookie)</script>
```

Submit the form after inserting the payload into the correct field.

After submitting, the system stores the entered content and creates a review link in the form:

```text
/view/<uid>/<seed>
```

### Execute URL

Go to the chancellor, paste the URL on the main website, and we get the flag

![](./image-1.png)


### Flag

```text
UMASS{m@7_t53_f0rce_b$_w!th_y8u}
```
