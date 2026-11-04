"""Transactional email through Zoho ZeptoMail (India data centre).

Server-side only: the token is read from the environment and never logged or returned.
Environment variables:
    ZEPTOMAIL_TOKEN    API token (with or without the "Zoho-enczapikey" prefix)
    ZEPTOMAIL_API_URL  defaults to https://cpaas.zoho.in/v1.1/email
"""
import asyncio
import logging
import os
import re
from typing import Awaitable, Optional, Set

import httpx

logger = logging.getLogger("mailer")

FROM_ADDRESS = "noreply@ownix.pro"
FROM_NAME = "Ownix"
DEFAULT_API_URL = "https://cpaas.zoho.in/v1.1/email"

# Both prefixes appear in ZeptoMail's docs and dashboards; strip either so the header never doubles it.
_PREFIX = re.compile(r"^\s*zoho-enc(?:zapi)?(?:key|token)\s+", re.IGNORECASE)


def _token() -> str:
    return os.environ.get("ZEPTOMAIL_TOKEN", "").strip()


def _api_url() -> str:
    return os.environ.get("ZEPTOMAIL_API_URL", "").strip() or DEFAULT_API_URL


def auth_header(token: str) -> str:
    """Return the Authorization header value, with exactly one 'Zoho-enczapikey' prefix."""
    return f"Zoho-enczapikey {_PREFIX.sub('', token.strip())}"


def is_configured() -> bool:
    """True when a token is set, i.e. mail can actually be sent."""
    return bool(_token())


async def send_mail(
    *,
    to: str,
    subject: str,
    html: str,
    text: str = "",
    name: str = "",
    transport: Optional[httpx.AsyncBaseTransport] = None,
) -> bool:
    """Send one email. Never raises: returns True on success, False on any failure."""
    token = _token()
    if not token:
        logger.warning("ZEPTOMAIL_TOKEN is not set; skipping email '%s'", subject)
        await _record(to, subject, False, "ZEPTOMAIL_TOKEN not set")
        return False
    recipient = {"address": to}
    if name:
        recipient["name"] = name
    payload = {
        "from": {"address": FROM_ADDRESS, "name": FROM_NAME},
        "to": [{"email_address": recipient}],
        "subject": subject,
        "htmlbody": html,
    }
    if text:
        payload["textbody"] = text
    try:
        async with httpx.AsyncClient(timeout=15, transport=transport) as client:
            resp = await client.post(
                _api_url(),
                headers={
                    "Authorization": auth_header(token),
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
    except Exception as exc:  # network error, timeout, bad URL
        logger.error("ZeptoMail request failed for '%s': %s", subject, type(exc).__name__)
        await _record(to, subject, False, type(exc).__name__)
        return False
    if resp.status_code >= 400:
        logger.error("ZeptoMail rejected '%s': HTTP %s %s", subject, resp.status_code, resp.text[:300])
        await _record(to, subject, False, f"HTTP {resp.status_code}")
        return False
    logger.info("Email '%s' sent (HTTP %s)", subject, resp.status_code)
    await _record(to, subject, True)
    return True


# Optional async callback(record: dict) so the app can store a delivery log without mailer knowing about the database.
_log_sink = None


def set_log_sink(fn) -> None:
    global _log_sink
    _log_sink = fn


async def _record(to: str, subject: str, ok: bool, error: str = "") -> None:
    if _log_sink is None:
        return
    try:
        await _log_sink({"to": to, "subject": subject, "status": "sent" if ok else "failed", "error": error[:300]})
    except Exception:
        logger.exception("email log sink failed")


_background: Set["asyncio.Task[object]"] = set()


def run_in_background(coro: Awaitable[object]) -> None:
    """Run an email job without making the caller wait. Failures are logged, never raised."""

    async def _guard() -> None:
        try:
            await coro
        except Exception:
            logger.exception("Background email job failed")

    task = asyncio.ensure_future(_guard())
    _background.add(task)  # keep a reference so the task is not garbage-collected mid-flight
    task.add_done_callback(_background.discard)
