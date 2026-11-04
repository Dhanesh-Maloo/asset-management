import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import email_templates as tpl  # noqa: E402
import mailer  # noqa: E402
import notifications  # noqa: E402

URL = "https://ownix.pro"


def test_new_templates_render_and_escape():
    msgs = [
        tpl.order_received("A", "Laptop", 1, "B", URL),
        tpl.ticket_comment("A", "T-1", "Title", "B", "<script>x</script>", URL),
        *[tpl.transfer_event("A", e, "AST-1", "X", "Y", "why", URL) for e in ("requested", "approved", "rejected", "completed", "cancelled")],
        *[tpl.reservation_event("A", e, "AST-1", "Laptop", "2026-01-01", "2026-01-02", "p", "R", URL) for e in ("created", "approved", "rejected", "cancelled", "completed")],
        tpl.maintenance_event("A", "scheduled", "AST-1", "Service", "2026-01-01T00:00", "", URL),
        tpl.maintenance_event("A", "completed", "AST-1", "Service", "2026-01-01T00:00", "ok", URL),
        tpl.asset_disposed("A", "AST-1", "Laptop", "recycle", "2026-01-01", "B", URL),
        tpl.offboarding("A", "Emp", ["AST-1"], ["AST-2"], True, URL),
        tpl.tenant_created("A", "Co", URL + "/login"),
        tpl.subscription_changed("A", "Co", "Pro", URL),
        *[tpl.invoice_event("A", e, "10.00", "USD", "desc", "", URL) for e in ("issued", "paid", "failed")],
    ]
    for subject, html, text in msgs:
        assert subject and html and text
    assert "<script>" not in msgs[1][1]


class _Cursor:
    def __init__(self, rows):
        self.rows = rows

    def sort(self, *a, **k):
        return self

    async def to_list(self, n):
        return self.rows[:n]


class _Coll:
    def __init__(self, rows):
        self.rows = rows

    async def find_one(self, q, p=None):
        return next((r for r in self.rows if all(r.get(k) == v for k, v in q.items() if not isinstance(v, dict))), None)

    def find(self, q, p=None):
        return _Cursor(self.rows)


class _Db:
    def __init__(self):
        self.users = _Coll([
            {"id": "u1", "name": "Req", "email": "r@example.com", "tenant_id": "t", "role": "employee"},
            {"id": "m1", "name": "Mgr", "email": "m@example.com", "tenant_id": "t", "role": "asset_manager"},
        ])
        self.tickets = _Coll([{"id": "k1", "created_by": "u1", "assigned_to": "m1", "ticket_number": "T-1", "title": "x"}])


def test_ticket_comment_skips_author_and_never_raises(monkeypatch):
    sent = []

    async def fake_send(**kw):
        sent.append(kw["to"])
        return True

    monkeypatch.setattr(mailer, "send_mail", fake_send)
    asyncio.run(notifications.notify_ticket_comment(_Db(), "k1", "u1", "Req", "hello"))
    assert sent == ["m@example.com"]
    asyncio.run(notifications.notify_ticket_comment(None, "k1", "u1", "Req", "hello"))  # broken db: swallowed


def test_log_sink_records_skipped_send(monkeypatch):
    monkeypatch.delenv("ZEPTOMAIL_TOKEN", raising=False)
    seen = []

    async def sink(rec):
        seen.append(rec)

    mailer.set_log_sink(sink)
    try:
        assert asyncio.run(mailer.send_mail(to="a@b.com", subject="S", html="<p>x</p>")) is False
    finally:
        mailer.set_log_sink(None)
    assert seen and seen[0]["status"] == "failed" and seen[0]["to"] == "a@b.com"
