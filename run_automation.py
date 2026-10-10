#!/usr/bin/env python3
"""
Root Entry Point for Automated Design Generation, Storage & Excel Publishing
Run: python run_automation.py --theme "Gothic Vitrail Fox" --count 3 --mode auto
"""

import os
import sys
import runpy

script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scripts", "design_automator.py")

if __name__ == "__main__":
    runpy.run_path(script_path, run_name="__main__")
