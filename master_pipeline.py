#!/usr/bin/env python3
"""
Root entry point redirecting to scripts/master_pipeline.py
"""
import sys
import os

script_path = os.path.join(os.path.dirname(__file__), 'scripts', 'master_pipeline.py')
with open(script_path, 'r', encoding='utf-8') as f:
    code = f.read()

exec(compile(code, script_path, 'exec'), {'__name__': '__main__'})
