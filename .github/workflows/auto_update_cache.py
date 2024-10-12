from sys import argv
from os import getcwd
import re

directory = getcwd()

updated_file_args = argv[:argv.index("-f")]
script_files = argv[argv.index("-f")+1:]

updated_file_names = list(map(
    lambda name: name
        .replace("MAKE-server\\","")
        .replace("MAKE-website\\", "")
        .replace("MAKE-server/","")
        .replace("MAKE-website/", ""),
    updated_file_args
))

print(f"Running auto_update_cache.py in {directory} on files {', '.join(updated_file_names)} over {script_files}\n")

for file in script_files:
    print("Found file", file)
    with open(file, "r") as fr:
        contents = fr.read()
        for updated_file_name in updated_file_names:
            pattern = rf'<script src="/?{updated_file_name}\?v=([\d\.]+)"><\/script>'
            if m := re.search(pattern, contents):
                print(f"Matched {updated_file_name} in {file}!")
                version_string = m.group(1)
                version, subversion = map(int, version_string.split("."))
                subversion += 1
                replacement = rf'<script src="/?{updated_file_name}?v={version}.{subversion}"></script>'
                contents = re.sub(pattern, replacement, contents)
                with open(file, "w") as fw:
                    fw.write(contents)
