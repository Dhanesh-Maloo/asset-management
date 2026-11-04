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
