import hashlib
import json
import os
import subprocess
import urllib.parse
import zipfile
import requests

nl_cfg = os.path.expandvars(r'%APPDATA%\netlify\Config\config.json')
d = json.load(open(nl_cfg, encoding='utf-8'))
uid = d['userId']
token = d['users'][uid]['auth']['token']
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

site_id = 'c9b77dd0-0907-4829-9d46-9749dd3ee9d9'
site = requests.get(f'https://api.netlify.com/api/v1/sites/{site_id}', headers=headers).json()
print(f"Deploying to: {site['name']} ({site_id})")

# 1. Read .env variables to inject as runtime defaults in serverless functions
env_vars = {}
if os.path.exists('.env'):
    with open('.env', 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k and v:
                    env_vars[k] = v

# 2. Write _redirects into dist/ so SPA routing and serverless function routes work
redirects_content = """/api/printify /.netlify/functions/printify 200
/design-api/* /.netlify/functions/design-api 200
/api/generate-lifestyle-scene /.netlify/functions/lifestyle 200
/* /index.html 200
"""
with open('dist/_redirects', 'w', encoding='utf-8') as f:
    f.write(redirects_content)

# 3. Bundle Netlify functions into .netlify/functions-dist/*.zip (CommonJS .js with handler export)
os.makedirs('.netlify/functions-dist', exist_ok=True)
fn_specs = {}
fn_zips = {}

banner_lines = [
    f"process.env[{json.dumps(k)}] = process.env[{json.dumps(k)}] || {json.dumps(v)};"
    for k, v in env_vars.items()
]
banner_js = " ".join(banner_lines)

for fn_name in ['printify', 'design-api', 'lifestyle']:
    src_file = f'netlify/functions/{fn_name}.ts'
    out_js = f'.netlify/functions-dist/{fn_name}.js'
    cmd = [
        os.path.abspath('node_modules/.bin/esbuild.cmd'),
        src_file,
        '--bundle',
        '--platform=node',
        '--target=node20',
        '--format=cjs',
        f'--banner:js={banner_js}',
        f'--outfile={out_js}',
    ]
    subprocess.run(cmd, check=True)
    zip_path = f'.netlify/functions-dist/{fn_name}.zip'
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.write(out_js, f'{fn_name}.js')
    with open(zip_path, 'rb') as f:
        sha256_hash = hashlib.sha256(f.read()).hexdigest()
    fn_specs[fn_name] = sha256_hash
    fn_zips[fn_name] = zip_path
    print(f"Bundled function {fn_name}: sha256={sha256_hash[:12]}...")

# 4. Collect all files in dist/ and compute SHA1 hashes
file_hashes = {}
hash_to_local = {}

for root, _, files in os.walk('dist'):
    for fname in files:
        local_path = os.path.join(root, fname)
        rel_path = '/' + os.path.relpath(local_path, 'dist').replace('\\', '/')
        with open(local_path, 'rb') as f:
            sha1 = hashlib.sha1(f.read()).hexdigest()
        file_hashes[rel_path] = sha1
        hash_to_local[rel_path] = local_path

print(f"Prepared {len(file_hashes)} static files in dist/ and {len(fn_specs)} serverless functions.")

# 5. Create deploy on Netlify
deploy_res = requests.post(
    f'https://api.netlify.com/api/v1/sites/{site_id}/deploys',
    headers=headers,
    json={
        'files': file_hashes,
        'functions': fn_specs,
        'draft': False,
    },
)
deploy = deploy_res.json()
deploy_id = deploy['id']
required_files = set(deploy.get('required', []))
required_fns = set(deploy.get('required_functions', []))
print(f"Created deploy {deploy_id}: {len(required_files)} files to upload, {len(required_fns)} functions to upload")

# 6. Upload required files
octet_headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/octet-stream'}
uploaded_count = 0
for rel_path, sha1 in file_hashes.items():
    if sha1 in required_files:
        local_path = hash_to_local[rel_path]
        encoded_path = urllib.parse.quote(rel_path, safe='/')
        with open(local_path, 'rb') as f:
            data = f.read()
        up_r = requests.put(
            f'https://api.netlify.com/api/v1/deploys/{deploy_id}/files{encoded_path}',
            headers=octet_headers,
            data=data,
        )
        uploaded_count += 1
print(f"Uploaded {uploaded_count} static files.")

# 7. Upload required functions
for fn_name, sha256_hash in fn_specs.items():
    with open(fn_zips[fn_name], 'rb') as f:
        data = f.read()
    fn_r = requests.put(
        f'https://api.netlify.com/api/v1/deploys/{deploy_id}/functions/{fn_name}?runtime=js',
        headers=octet_headers,
        data=data,
    )
    print(f"Uploaded function {fn_name}: status {fn_r.status_code}")

# 8. Check final deploy status
final_deploy = requests.get(f'https://api.netlify.com/api/v1/deploys/{deploy_id}', headers=headers).json()
print("Deploy state:", final_deploy.get('state'))
print("Live URL:", final_deploy.get('ssl_url') or site.get('ssl_url'))
