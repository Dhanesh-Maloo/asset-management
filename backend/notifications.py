"""Event emails (assets, orders, tickets, welcome). Each function looks up its own recipients and never raises,
so a mail problem can never break the action that triggered it. Call them through mailer.run_in_background().
"""
import logging
import os
from typing import Any, Dict, List, Optional

import email_templates as tpl
import mailer

logger = logging.getLogger("notifications")

_USER_FIELDS = {"_id": 0, "id": 1, "name": 1, "email": 1, "status": 1, "tenant_id": 1}


def _app_url() -> str:
    return os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")


async def _user(db: Any, user_id: Optional[str]) -> Optional[Dict[str, Any]]:
    """Active user with an email address, or None (so deactivated accounts are never emailed)."""
    if not user_id:
        return None
    user = await db.users.find_one({"id": user_id}, _USER_FIELDS)
    if not user or not user.get("email") or user.get("status") == "inactive":
        return None
    return user


async def _product_name(db: Any, product_id: Optional[str]) -> str:
    if not product_id:
        return "Unknown product"
    product = await db.products.find_one({"id": product_id}, {"_id": 0, "name": 1})
    return (product or {}).get("name") or "Unknown product"


async def _send(user: Dict[str, Any], message: tuple) -> bool:
    subject, html, text = message
    return await mailer.send_mail(to=user["email"], name=user.get("name", ""), subject=subject, html=html, text=text)


async def notify_asset_assigned(db: Any, asset_id: str, user_id: str, assigned_by: str) -> None:
    try:
        asset = await db.assets.find_one({"id": asset_id}, {"_id": 0, "asset_tag": 1, "product_id": 1, "serial_number": 1})
        user = await _user(db, user_id)
        if not asset or not user:
            return
        product = await _product_name(db, asset.get("product_id"))
        await _send(user, tpl.asset_assigned(user.get("name", ""), asset.get("asset_tag", ""), product, asset.get("serial_number", ""), assigned_by, _app_url()))
    except Exception:
        logger.exception("notify_asset_assigned failed")


async def notify_asset_returned(db: Any, asset_id: str, user_id: Optional[str], condition: str = "", days_overdue: int = 0, retrieved: bool = False) -> None:
    try:
        asset = await db.assets.find_one({"id": asset_id}, {"_id": 0, "asset_tag": 1, "product_id": 1})
        user = await _user(db, user_id)
        if not asset or not user:
            return
        product = await _product_name(db, asset.get("product_id"))
        await _send(user, tpl.asset_returned(user.get("name", ""), asset.get("asset_tag", ""), product, condition, days_overdue, retrieved, _app_url()))
    except Exception:
        logger.exception("notify_asset_returned failed")


async def notify_order_event(db: Any, order_id: str, event: str, detail: str = "") -> None:
    """event: submitted (tells approvers) | checker_approved | approved | rejected | dispatched (tell the requester)."""
    try:
        order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        if not order:
            return
        product = await _product_name(db, order.get("product_id"))
        requester = await _user(db, order.get("user_id"))
        requester_name = (requester or {}).get("name", "")
        if event == "submitted":
            recipients: List[Dict[str, Any]] = await db.users.find(
                {"tenant_id": order.get("tenant_id"), "role": {"$in": ["tenant_admin", "asset_manager"]}, "status": {"$ne": "inactive"}, "email": {"$nin": [None, ""]}},
                _USER_FIELDS,
            ).to_list(25)
        else:
            recipients = [requester] if requester else []
        for person in recipients:
            await _send(person, tpl.order_event(person.get("name", ""), event, product, order.get("quantity", 1), detail, requester_name, _app_url()))
    except Exception:
        logger.exception("notify_order_event failed")


async def notify_ticket_event(db: Any, ticket_id: str, events: List[str]) -> None:
    """events: any of created, assigned, status. 'created'/'status' go to the requester, 'assigned' to the assignee."""
    try:
        ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
        if not ticket:
            return
        sent_to = set()
        for event in events:
            target_id = ticket.get("assigned_to") if event == "assigned" else ticket.get("created_by")
            user = await _user(db, target_id)
            if not user or (user["id"], event) in sent_to:
                continue
            sent_to.add((user["id"], event))
            await _send(user, tpl.ticket_event(user.get("name", ""), event, ticket.get("ticket_number", ""), ticket.get("title", ""), str(ticket.get("status", "open")).split(".")[-1], str(ticket.get("priority", "medium")).split(".")[-1], _app_url()))
        # A new ticket also tells its auto-assigned agent
        if "created" in events and "assigned" not in events:
            agent = await _user(db, ticket.get("assigned_to"))
            if agent and agent["id"] != ticket.get("created_by"):
                await _send(agent, tpl.ticket_event(agent.get("name", ""), "assigned", ticket.get("ticket_number", ""), ticket.get("title", ""), str(ticket.get("status", "open")).split(".")[-1], str(ticket.get("priority", "medium")).split(".")[-1], _app_url()))
    except Exception:
        logger.exception("notify_ticket_event failed")


async def send_welcome(name: str, email: str, set_password_url: Optional[str] = None) -> bool:
    try:
        subject, html, text = tpl.welcome(name, email, f"{_app_url()}/login", set_password_url)
        return await mailer.send_mail(to=email, name=name, subject=subject, html=html, text=text)
    except Exception:
        logger.exception("send_welcome failed")
        return False


# -- Helpers for role-based recipients ---------------------------------------

async def _staff(db: Any, tenant_id: Optional[str], roles=("tenant_admin", "asset_manager")) -> List[Dict[str, Any]]:
    if not tenant_id:
        return []
    return await db.users.find(
        {"tenant_id": tenant_id, "role": {"$in": list(roles)}, "status": {"$ne": "inactive"}, "email": {"$nin": [None, ""]}},
        _USER_FIELDS,
    ).to_list(25)


async def _names(db: Any, ids: List[Optional[str]]) -> Dict[str, str]:
    ids = [i for i in ids if i]
    if not ids:
        return {}
    rows = await db.users.find({"id": {"$in": ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(len(ids))
    return {r["id"]: r.get("name", "") for r in rows}


async def _send_all(people: List[Optional[Dict[str, Any]]], make) -> None:
    seen = set()
    for person in people:
        if not person or person.get("id") in seen:
            continue
        seen.add(person.get("id"))
        await _send(person, make(person))


# -- Extra events ------------------------------------------------------------

async def notify_order_received(db: Any, order_id: str, received_by: str) -> None:
    try:
        order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        if not order:
            return
        product = await _product_name(db, order.get("product_id"))
        staff = await _staff(db, order.get("tenant_id"))
        await _send_all(staff, lambda p: tpl.order_received(p.get("name", ""), product, order.get("quantity", 1), received_by, _app_url()))
    except Exception:
        logger.exception("notify_order_received failed")


async def notify_ticket_comment(db: Any, ticket_id: str, author_id: str, author_name: str, comment: str) -> None:
    """Tell the other side: requester and assignee, never the author."""
    try:
        ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
        if not ticket:
            return
        people = [await _user(db, ticket.get("created_by")), await _user(db, ticket.get("assigned_to"))]
        people = [p for p in people if p and p["id"] != author_id]
        await _send_all(people, lambda p: tpl.ticket_comment(p.get("name", ""), ticket.get("ticket_number", ""), ticket.get("title", ""), author_name, comment, _app_url()))
    except Exception:
        logger.exception("notify_ticket_comment failed")


async def notify_transfer(db: Any, transfer_id: str, event: str, actor_id: str) -> None:
    """Both users, the requester and (for new requests) the managers; never the person who acted."""
    try:
        t = await db.asset_transfers.find_one({"id": transfer_id}, {"_id": 0})
        if not t:
            return
        names = await _names(db, [t.get("from_user_id"), t.get("to_user_id")])
        from_name, to_name = names.get(t.get("from_user_id"), ""), names.get(t.get("to_user_id"), "")
        people = [await _user(db, t.get("to_user_id")), await _user(db, t.get("from_user_id")), await _user(db, t.get("requested_by"))]
        if event == "requested":
            people += await _staff(db, t.get("tenant_id"))
        people = [p for p in people if p and p["id"] != actor_id]
        await _send_all(people, lambda p: tpl.transfer_event(p.get("name", ""), event, t.get("asset_tag", ""), from_name, to_name, t.get("reason", ""), _app_url()))
    except Exception:
        logger.exception("notify_transfer failed")


async def notify_reservation(db: Any, reservation_id: str, event: str, actor_id: str) -> None:
    try:
        r = await db.reservations.find_one({"id": reservation_id}, {"_id": 0})
        if not r:
            return
        asset = await db.assets.find_one({"id": r.get("asset_id")}, {"_id": 0, "asset_tag": 1, "product_id": 1}) or {}
        product = await _product_name(db, asset.get("product_id"))
        requester = await _user(db, r.get("reserved_by"))
        if event == "created":
            people = await _staff(db, r.get("tenant_id"))
        elif event == "cancelled":
            people = [requester] + await _staff(db, r.get("tenant_id"))
        else:
            people = [requester]
        people = [p for p in people if p and p["id"] != actor_id]
        await _send_all(people, lambda p: tpl.reservation_event(p.get("name", ""), event, asset.get("asset_tag", ""), product, r.get("start_date", ""), r.get("end_date", ""), r.get("purpose", ""), (requester or {}).get("name", ""), _app_url()))
    except Exception:
        logger.exception("notify_reservation failed")


async def notify_maintenance(db: Any, maintenance_id: str, event: str, actor_id: str) -> None:
    """event: scheduled (assignee) | completed (assignee + managers)."""
    try:
        m = await db.maintenance_schedules.find_one({"id": maintenance_id}, {"_id": 0})
        if not m:
            return
        asset = await db.assets.find_one({"id": m.get("asset_id")}, {"_id": 0, "asset_tag": 1}) or {}
        people = [await _user(db, m.get("assigned_to"))]
        if event == "completed":
            people += await _staff(db, m.get("tenant_id"))
        people = [p for p in people if p and p["id"] != actor_id]
        when = m.get("completed_date") if event == "completed" else m.get("scheduled_date", "")
        await _send_all(people, lambda p: tpl.maintenance_event(p.get("name", ""), event, asset.get("asset_tag", ""), m.get("title", ""), when or "", m.get("notes", "") or "", _app_url()))
    except Exception:
        logger.exception("notify_maintenance failed")


async def notify_asset_disposed(db: Any, asset_id: str, by_name: str, actor_id: str) -> None:
    try:
        a = await db.assets.find_one({"id": asset_id}, {"_id": 0, "asset_tag": 1, "product_id": 1, "tenant_id": 1, "disposal_method": 1, "disposal_date": 1})
        if not a:
            return
        product = await _product_name(db, a.get("product_id"))
        staff = [p for p in await _staff(db, a.get("tenant_id")) if p["id"] != actor_id]
        await _send_all(staff, lambda p: tpl.asset_disposed(p.get("name", ""), a.get("asset_tag", ""), product, a.get("disposal_method", ""), a.get("disposal_date", ""), by_name, _app_url()))
    except Exception:
        logger.exception("notify_asset_disposed failed")


async def notify_offboarding(db: Any, user_id: str, returned: List[str], still_holding: List[str], deactivated: bool, actor_id: str) -> None:
    """The employee gets the summary (even if now deactivated); tenant admins are told too."""
    try:
        emp = await db.users.find_one({"id": user_id}, _USER_FIELDS)
        if not emp:
            return
        people: List[Dict[str, Any]] = [emp] if emp.get("email") else []
        people += [p for p in await _staff(db, emp.get("tenant_id"), ("tenant_admin",)) if p["id"] != actor_id]
        await _send_all(people, lambda p: tpl.offboarding(p.get("name", ""), emp.get("name", ""), returned, still_holding, deactivated, _app_url()))
    except Exception:
        logger.exception("notify_offboarding failed")


async def notify_subscription_changed(db: Any, tenant_id: str, tier_id: str) -> None:
    try:
        tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0, "name": 1})
        tier = await db.subscription_tiers.find_one({"id": tier_id}, {"_id": 0, "name": 1}) or {}
        admins = await _staff(db, tenant_id, ("tenant_admin",))
        await _send_all(admins, lambda p: tpl.subscription_changed(p.get("name", ""), (tenant or {}).get("name", ""), tier.get("name", "your plan"), _app_url()))
    except Exception:
        logger.exception("notify_subscription_changed failed")


async def notify_invoice(db: Any, invoice_id: str, event: str) -> None:
    """event: issued | paid | failed -> the tenant admins."""
    try:
        inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
        if not inv:
            return
        admins = await _staff(db, inv.get("tenant_id"), ("tenant_admin",))
        period = f"{str(inv.get('period_start', ''))[:10]} to {str(inv.get('period_end', ''))[:10]}" if inv.get("period_start") else ""
        await _send_all(admins, lambda p: tpl.invoice_event(p.get("name", ""), event, f"{inv.get('amount', 0):,.2f}", inv.get("currency", ""), inv.get("description", ""), period, _app_url()))
    except Exception:
        logger.exception("notify_invoice failed")
