#!/usr/bin/env python3
"""
Add image URLs to vocabulary CSV files.
Uses Flickr API to find relevant images for each word.

Usage:
  python3 add_images.py [--prefix CAM20] [--dir choice-question] [--dir fill-the-blank]

By default, processes all CSV files in both choice-question/ and fill-the-blank/.
Pass --prefix to only process files starting with a given prefix (e.g. CAM20).
"""

import csv
import os
import re
import ssl
import json
import time
import argparse
import urllib.parse
import urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE
HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}

WORD_IMAGE_CACHE = {}
ALT_SEARCHES = {
    'resource-intensive': ['computing', 'server', 'factory'],
    'preemptively': ['prevention', 'anticipate'],
    'rhetorically': ['speech', 'orator'],
    'demonstrably': ['evidence', 'proof'],
    'etiquette-sensitive': ['etiquette', 'manners'],
    'theorise': ['theory', 'hypothesis'],
    'adaptedness': ['adaptation', 'evolution'],
    'resource intensive': ['computing', 'server', 'factory'],
    'etiquette sensitive': ['etiquette', 'manners'],
}

def flickr_search(word):
    clean = word.strip().lower()
    try:
        url = f'https://api.flickr.com/services/feeds/photos_public.gne?tags={urllib.parse.quote(clean)}&format=json&nojsoncallback=1&lang=en-us'
        req = urllib.request.Request(url, headers=HEADERS)
        resp = urllib.request.urlopen(req, timeout=15, context=ssl_ctx)
        data = json.loads(resp.read())
        items = data.get('items', [])
        for item in items:
            img_m = item.get('media', {}).get('m', '')
            if img_m:
                return img_m.replace('_m.jpg', '_b.jpg')
    except Exception:
        pass
    return ''

def fetch_image(word):
    clean = re.sub(r'\s+', ' ', word.strip().lower())
    if clean in WORD_IMAGE_CACHE:
        return WORD_IMAGE_CACHE[clean]

    result = ''
    words = clean.split()

    result = flickr_search(clean)
    if result:
        WORD_IMAGE_CACHE[clean] = result
        return result

    alts = ALT_SEARCHES.get(clean, [])
    for alt in alts:
        result = flickr_search(alt)
        if result:
            WORD_IMAGE_CACHE[clean] = result
            return result

    for w in words:
        result = flickr_search(w)
        if result:
            WORD_IMAGE_CACHE[clean] = result
            return result
        time.sleep(0.3)

    WORD_IMAGE_CACHE[clean] = ''
    return ''

def update_file(filepath, is_fill_blank):
    rows = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            rows.append(row)

    if not rows:
        return 0

    updated = 0
    for row in rows:
        if not row:
            continue

        if is_fill_blank:
            if len(row) == 9:
                word = row[2].strip()
                img_url = fetch_image(word)
                row.append(img_url)
                updated += 1
            elif len(row) == 10:
                word = row[2].strip()
                if not row[9]:
                    img_url = fetch_image(word)
                    row[9] = img_url
                    updated += 1
        else:
            if len(row) == 14:
                word = row[7].strip()
                img_url = fetch_image(word)
                row.append(img_url)
                updated += 1
            elif len(row) == 15:
                word = row[7].strip()
                if not row[14]:
                    img_url = fetch_image(word)
                    row[14] = img_url
                    updated += 1

    if updated > 0:
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(rows)

    return updated

def process_directory(dirname, is_fill_blank, prefix=''):
    total_updated = 0
    dirpath = os.path.join(BASE, dirname)
    for fname in sorted(os.listdir(dirpath)):
        if not fname.endswith('.csv'):
            continue
        if prefix and not fname.startswith(prefix):
            continue
        fpath = os.path.join(dirpath, fname)
        updated = update_file(fpath, is_fill_blank)
        if updated:
            print(f'  {dirname}/{fname}: {updated} rows')
        total_updated += updated
    return total_updated

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Add image URLs to vocabulary CSV files via Flickr API')
    parser.add_argument('--prefix', default='', help='Only process files starting with this prefix (e.g. CAM20)')
    parser.add_argument('--dir', choices=['choice-question', 'fill-the-blank', 'all'], default='all',
                        help='Which directory to process (default: all)')
    args = parser.parse_args()

    dirs = []
    if args.dir in ('fill-the-blank', 'all'):
        dirs.append(('fill-the-blank', True))
    if args.dir in ('choice-question', 'all'):
        dirs.append(('choice-question', False))

    for dirname, is_fb in dirs:
        print(f'Processing {dirname}/...')
        process_directory(dirname, is_fb, args.prefix)
        print()

    found = sum(1 for v in WORD_IMAGE_CACHE.values() if v)
    total = len(WORD_IMAGE_CACHE)
    print(f'Unique words: {total}, images found: {found}')
