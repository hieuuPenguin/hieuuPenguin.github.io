---
title: "UTCTF2026-Time to Pretend"
description: "CTF writeup - Time to Pretend (UTCTF 2026)"
date: 2026-03-07
tags: [CTF, Web, UTCTF]
category: "UTCTF 2026"
cover: ./cover.png
pinned: false
draft: false
---

### Overview

This challenge gives a login page; the form has no password, only `username` and `otp`. The goal is to find an account that is still active, generate a valid OTP, log into the portal, and get the flag.

### Website analysis

When visiting the website, we see an ordinary login form. However, when viewing the page's HTML source, there is a fairly notable comment:

```html
<!-- NOTICE to DEVS: login currently disabled, see /urgent.txt for info -->
```

This line tells us there is an internal file at the path `/urgent.txt` containing important information.

### Content of the `/urgent.txt` file

When visiting `/urgent.txt`, we get the following content:

```text
URGENT - READ IMMEDIATELY
=========================
TO: dev team
FROM: timothy
DATE: 2013-11-12 03:47:22

guys,

i think someone figured out the AffinKey system. i dont have time to explain everything
right now but there is a SERIOUS flaw in how we generate the OTPs. i only just realized
it tonight and i am freaking out.

i have locked every account in the system except mine while we figure this out. DO NOT
unlock anyone until we have patched this. i dont care if users complain. i dont care if
chad emails again. nobody gets in.

my account stays active because i need access to keep monitoring the situation. if you
need to reach me use signal.

do NOT roll back the auth system yet - i need to look at the logs first to see if anyone
has already gotten in. if they have we have a much bigger problem.

i will write up a full post-mortem once i stop shaking.

do not talk to anyone about this. not on slack. not on email. definitely not on the forum.

- timothy

p.s. i know kevin is going to say "i told you so" about building this ourselves.
he was right. i don't want to hear it.
```

From the content above, we can draw two important points:

1. The OTP system has a serious vulnerability.
2. All accounts have been locked, only `timothy`'s account is still active.

### Analyzing the `afteahLEAK.pcap` file

Next, open the `afteahLEAK.pcap` file in Wireshark and inspect the HTTP traffic. In it there are many requests sent to the endpoint:

```text
POST /debug/getOTP
```

The data sent has the form:

```json
{"username": "carrasco", "epoch": 1773290571}
```

The returned response has the form:

```json
{
  "add": 13,
  "mult": 7,
  "otp": "bnccnjbh"
}
```

That is, for each `username` and `epoch`, the server returns 3 values:

* `add`
* `mult`
* `otp`

We recognize this is an Affine Cipher. The Affine Cipher encryption formula is:

```text
E(x) = (mult * x + add) mod 26
```

After comparing many packets in the pcap file, we have the following data pairs:

```python
{'username': 'carrasco', 'epoch': 1773290571} -> {'add': 13, 'mult': 7, 'otp': 'bnccnjbh'}
{'username': 'mix', 'epoch': 1773290574} -> {'add': 16, 'mult': 15, 'otp': 'ogx'}
{'username': 'hebert', 'epoch': 1773290575} -> {'add': 17, 'mult': 17, 'otp': 'ghihuc'}
{'username': 'monks', 'epoch': 1773290576} -> {'add': 18, 'mult': 19, 'otp': 'myfaw'}
{'username': 'eyre', 'epoch': 1773290577} -> {'add': 19, 'mult': 21, 'otp': 'zdmz'}
{'username': 'jurado', 'epoch': 1773290579} -> {'add': 21, 'mult': 25, 'otp': 'mbevsh'}
```

After checking the pattern, we deduce:

```python
add = epoch % 26
```

The valid `mult` values are:

```python
[1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25]
```

And the selection is:

```python
mult = valid_mults[epoch % 12]
```

### Exploit script

Python script used to generate a valid OTP for the `timothy` account:

```python
import requests, time

valid_mults = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25]

def gen_otp(username, epoch):
    add = epoch % 26
    mult = valid_mults[epoch % 12]
    return "".join(
        chr((mult * (ord(c) - ord('a')) + add) % 26 + ord('a'))
        for c in username
    )

epoch = int(time.time())
otp = gen_otp("timothy", epoch)

print(otp)

s = requests.Session()
s.post("http://challenge.utctf.live:9382/auth", json={"username": "timothy", "otp": otp})
print(s.get("http://challenge.utctf.live:9382/portal").text)
```

After logging in successfully, the `/portal` page shows Timothy's dashboard.

![](./image.png)

### Flag

```text
utflag{t1m3_1s_n0t_r3ll0b1l3_n0w_1s_1t}
```
