"""
Script to execute full feature extraction across all 96,091 train and 64,062 test accounts.
"""
import sys
import os

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.full_feature_extractor import run_full_extraction

if __name__ == "__main__":
    run_full_extraction()
