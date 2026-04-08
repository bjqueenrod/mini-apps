from __future__ import annotations

import logging
import os
import sys


def configure_logging() -> None:
    level_name = (os.getenv("LOG_LEVEL") or os.getenv("DEBUG_LEVEL") or "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
