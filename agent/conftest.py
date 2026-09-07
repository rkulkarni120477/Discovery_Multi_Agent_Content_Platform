import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv  # noqa: E402 -- must follow the sys.path insert above

load_dotenv(Path(__file__).parent / ".env")
