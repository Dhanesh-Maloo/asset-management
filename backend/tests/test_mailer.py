"""Unit tests for mailer.py and email_templates.py. No network: ZeptoMail is replaced by httpx.MockTransport."""
import asyncio
import json
import os
import sys

import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import email_templates  # noqa: E402
import mailer  # noqa: E402


def _run(coro):
    return asyncio.new_event_loop().run_until_complete(coro)


def test_auth_header_never_doubles_prefix():
    for raw in ("abc123", "Zoho-enczapikey abc123", "zoho-enctoken abc123", "  Zoho-enczapikey   abc123 "):
        assert mailer.auth_header(raw) == "Zoho-enczapikey abc123"


def test_send_mail_success_uses_india_url_and_fixed_sender(monkeypatch):
    monkeypatch.setenv("ZEPTOMAIL_TOKEN", "Zoho-enczapikey secret-token")
    monkeypatch.delenv("ZEPTOMAIL_API_URL", raising=False)
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["auth"] = request.headers["authorization"]
        seen["body"] = json.loads(request.content)
        return httpx.Response(201, json={"message": "OK"})

    ok = _run(mailer.send_mail(to="a@example.com", name="A", subject="S", html="<p>x</p>", text="x", transport=httpx.MockTransport(handler)))
    assert ok is True
    assert seen["url"] == "https://cpaas.zoho.in/v1.1/email"
    assert seen["auth"] == "Zoho-enczapikey secret-token"
    assert seen["body"]["from"] == {"address": "noreply@ownix.pro", "name": "Ownix"}
    assert seen["body"]["to"][0]["email_address"] == {"address": "a@example.com", "name": "A"}
    assert seen["body"]["textbody"] == "x"


def test_send_mail_failure_returns_false_and_does_not_log_token(monkeypatch, caplog):
    monkeypatch.setenv("ZEPTOMAIL_TOKEN", "super-secret-value")
    transport = httpx.MockTransport(lambda r: httpx.Response(401, json={"error": "bad token"}))
    with caplog.at_level("INFO"):
        ok = _run(mailer.send_mail(to="a@example.com", subject="S", html="x", transport=transport))
    assert ok is False
    assert "super-secret-value" not in caplog.text


def test_send_mail_without_token_is_skipped(monkeypatch):
    monkeypatch.delenv("ZEPTOMAIL_TOKEN", raising=False)
    assert _run(mailer.send_mail(to="a@example.com", subject="S", html="x")) is False


def test_network_error_is_swallowed(monkeypatch):
    monkeypatch.setenv("ZEPTOMAIL_TOKEN", "t")

    def boom(request):
        raise httpx.ConnectError("down")

    assert _run(mailer.send_mail(to="a@example.com", subject="S", html="x", transport=httpx.MockTransport(boom))) is False


def test_templates_escape_user_input_and_have_text_fallback():
    subject, html, text = email_templates.asset_assigned("<b>Bob</b>", "TAG-1", "Laptop", "SN1", "Admin", "https://ownix.pro")
    assert "<b>Bob</b>" not in html and "&lt;b&gt;Bob&lt;/b&gt;" in html
    assert "TAG-1" in subject and "TAG-1" in text and "Laptop" in text


def test_every_template_renders():
    url = "https://ownix.pro"
    assert email_templates.welcome("A", "a@x.com", url + "/login", url + "/reset?t=1")[1]
    assert email_templates.invite("Admin", "Employee", url)[1]
    assert email_templates.password_reset("A", url)[1]
    assert email_templates.test_email("A")[1]
    assert email_templates.alert("Expiring", ["one", "two"], "intro", url)[1]
    assert email_templates.asset_returned("A", "T", "P", "good", 2, False, url)[1]
    for event in ("submitted", "checker_approved", "approved", "rejected", "dispatched"):
        assert email_templates.order_event("A", event, "Laptop", 2, "reason", "Bob", url)[1]
    for event in ("created", "assigned", "status"):
        assert email_templates.ticket_event("A", event, "TKT-1", "Title", "open", "high", url)[1]


def test_log_entry_carries_explicit_tenant_id(monkeypatch):
    """Invitees are not users yet, so the caller must be able to tag the delivery-log entry with a tenant."""
    monkeypatch.setenv("ZEPTOMAIL_TOKEN", "t")
    records = []

    async def sink(rec):
        records.append(rec)

    mailer.set_log_sink(sink)
    try:
        transport = httpx.MockTransport(lambda r: httpx.Response(201, json={}))
        assert _run(mailer.send_mail(to="new@example.com", subject="S", html="x", tenant_id="tenant-1", transport=transport))
        assert records[-1]["tenant_id"] == "tenant-1" and records[-1]["status"] == "sent"
    finally:
        mailer.set_log_sink(None)


def test_email_domain_check_flags_typo_domain():
    assert _run(mailer.email_domain_exists("x@ivaluindia.com")) is False
    assert _run(mailer.email_domain_exists("x@ivalueindia.com")) is True
