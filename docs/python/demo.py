# 测试，自己都看不懂！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！
from os.path import exists

import requests
from requests import get
from base64 import b64decode
from json import loads, dumps
from os import mkdir, path, chdir

num1 = 0

chdir("SRPE")
with open("result.json", "r", encoding='utf-8') as fp:
    data = fp.read()
    data_json = loads(data)
for l in data_json:
    name = l['name']
    atlas = l['atlas']
    # images
    data = l['json']
    if type(data) == str:
        print(data)
        data = requests.get(data).json() # jinggao
    data['skeleton']['images'] = "./images"
    scale = 1
    for bone in data['bones']:
        if "scaleX" in bone.keys():
            scale = bone['scaleX']
            break
        if "scaleY" in bone.keys():
            scale = bone['scaleY']
            break
    json = dumps(data)
    resources = l['resources']
    if exists(name):
        continue
    mkdir(name)
    img_dir = path.join(name, "images")
    mkdir(img_dir)
    atlas_path = path.join(name, f"{name}.atlas")
    json_path = path.join(name, f"{name}.json")
    with open(atlas_path, "w", encoding='utf-8') as fp:
        fp.write(atlas)
    with open(json_path, "w", encoding='utf-8') as fp:
        fp.write(json)
    for res in resources:
        res_name = res['name']
        img_path = path.join(name, f"{res_name}.png")
        if "url" not in res.keys():
            continue
        url: str = res['url']
        if type(url) != str:
            continue
        with open(img_path, 'wb') as fp:
            if url.startswith("data:image/png;base64"):
                fp.write(b64decode(url.replace("data:image/png;base64", "")))
            else:
                fp.write(get(url).content)
    num1 += 1
    print(f"[{num1}]完成下载{name}，缩放：{scale}")
