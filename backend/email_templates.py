"""HTML + plain-text email templates for Ownix.

Every function returns (subject, html, text). All values that come from users or the database are
HTML-escaped. Styling is inline so it survives email clients; layout is a single 600px column that
shrinks on phones.
"""
from html import escape
from typing import Iterable, List, Optional, Tuple

BRAND = "#4F46E5"
Row = Tuple[str, str]


def _render(
    heading: str,
    paragraphs: Iterable[str],
    rows: Optional[List[Row]] = None,
    cta: Optional[Tuple[str, str]] = None,
    note: str = "",
) -> Tuple[str, str]:
    paragraphs = list(paragraphs)
    p_html = "".join(
        f'<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1f2937;">{escape(p)}</p>' for p in paragraphs
    )
    rows_html = ""
    if rows:
        body = "".join(
            f'<tr><td style="padding:8px 12px;color:#6b7280;font-size:14px;border-bottom:1px solid #eef0f4;'
            f'width:38%;">{escape(k)}</td><td style="padding:8px 12px;color:#111827;font-size:14px;'
            f'border-bottom:1px solid #eef0f4;">{escape(v)}</td></tr>'
            for k, v in rows
        )
        rows_html = (
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
            f'style="border:1px solid #eef0f4;border-radius:8px;margin:6px 0 18px;">{body}</table>'
        )
    cta_html = ""
    if cta:
        label, url = cta
        cta_html = (
            f'<p style="margin:22px 0;"><a href="{escape(url, quote=True)}" style="background:{BRAND};color:#ffffff;'
            f'padding:12px 26px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">'
            f"{escape(label)}</a></p>"
            f'<p style="margin:0 0 14px;font-size:12px;color:#6b7280;word-break:break-all;">If the button does not work, '
            f'paste this link into your browser:<br>{escape(url)}</p>'
        )
    note_html = f'<p style="margin:18px 0 0;font-size:12px;color:#6b7280;">{escape(note)}</p>' if note else ""
    html = (
        '<!DOCTYPE html><html><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1"></head>'
        '<body style="margin:0;padding:0;background:#f3f4f8;font-family:Arial,Helvetica,sans-serif;">'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 10px;">'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        'style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;">'
        f'<tr><td style="background:{BRAND};padding:18px 24px;color:#ffffff;font-size:20px;font-weight:bold;">Ownix</td></tr>'
        '<tr><td style="padding:26px 24px;">'
        f'<h2 style="margin:0 0 16px;font-size:20px;color:#111827;">{escape(heading)}</h2>'
        f"{p_html}{rows_html}{cta_html}{note_html}"
        "</td></tr>"
        '<tr><td style="padding:14px 24px;background:#f9fafb;color:#9ca3af;font-size:12px;">'
        "Ownix IT Asset Management. This is an automated message, please do not reply.</td></tr>"
        "</table></td></tr></table></body></html>"
    )
    lines = [heading, ""] + [p for p in paragraphs]
    if rows:
        lines += [""] + [f"{k}: {v}" for k, v in rows]
    if cta:
        lines += ["", f"{cta[0]}: {cta[1]}"]
    if note:
        lines += ["", note]
    lines += ["", "Ownix IT Asset Management"]
    return html, "\n".join(lines)


def _hi(name: str) -> str:
    return f"Hello {name}," if name else "Hello,"


def welcome(name: str, email: str, login_url: str, set_password_url: Optional[str] = None):
    if set_password_url:
        paras = [_hi(name), "An Ownix account has been created for you. Use the button below to choose your password and sign in."]
        cta = ("Set your password", set_password_url)
        note = "This link expires in 24 hours. After that, use 'Forgot password' on the sign-in page."
    else:
        paras = [_hi(name), "An Ownix account has been created for you. Your administrator will share your password with you separately."]
        cta = ("Sign in", login_url)
        note = "Please change your password after your first sign-in."
    html, text = _render("Welcome to Ownix", paras, rows=[("Your login", email)], cta=cta, note=note)
    return "Welcome to Ownix", html, text


def invite(inviter: str, role: str, link: str):
    paras = [f"{inviter} has invited you to join Ownix as {role}.", "Accept the invitation to create your account."]
    html, text = _render("You're invited to Ownix", paras, cta=("Accept invitation", link), note="This link expires in 7 days. If you did not expect this invitation, you can ignore this email.")
    return "You're invited to join Ownix", html, text


def password_reset(name: str, link: str):
    paras = [_hi(name), "We received a request to reset the password for your Ownix account."]
    html, text = _render("Reset your password", paras, cta=("Reset password", link), note="This link expires in 1 hour. If you did not request a reset, you can safely ignore this email.")
    return "Reset your Ownix password", html, text


def test_email(name: str):
    html, text = _render("Email is working", [_hi(name), "This is a test message from Ownix. Transactional email is configured correctly."])
    return "Ownix test email", html, text


def alert(subject: str, items: List[str], intro: str, app_url: str):
    paras = [intro] if intro else []
    rows = [(f"{i + 1}", item) for i, item in enumerate(items)]
    html, text = _render(subject, paras, rows=rows, cta=("Open Ownix", app_url))
    return subject, html, text


def asset_assigned(name: str, asset_tag: str, product: str, serial: str, assigned_by: str, app_url: str):
    rows = [("Asset tag", asset_tag), ("Product", product)]
    if serial:
        rows.append(("Serial number", serial))
    rows.append(("Assigned by", assigned_by))
    html, text = _render("An asset has been assigned to you", [_hi(name), "The following asset is now assigned to you. You are responsible for it until it is returned."], rows=rows, cta=("View my assets", f"{app_url}/profile"))
    return f"Asset assigned to you: {asset_tag}", html, text


def asset_returned(name: str, asset_tag: str, product: str, condition: str, days_overdue: int, retrieved: bool, app_url: str):
    verb = "retrieved from you" if retrieved else "returned"
    rows = [("Asset tag", asset_tag), ("Product", product)]
    if condition:
        rows.append(("Condition", condition))
    if days_overdue:
        rows.append(("Days overdue", str(days_overdue)))
    html, text = _render(f"Asset {verb}", [_hi(name), f"The following asset has been {verb} and is no longer assigned to you."], rows=rows)
    return f"Asset {verb}: {asset_tag}", html, text


_ORDER_COPY = {
    "submitted": ("New order awaiting approval", "A new order has been placed and needs your review."),
    "checker_approved": ("Order reviewed", "Your order has passed review and is waiting for final approval."),
    "approved": ("Order approved", "Your order has been approved and will be dispatched shortly."),
    "rejected": ("Order rejected", "Your order could not be approved."),
    "dispatched": ("Order dispatched", "Your order has been dispatched. Please confirm when you receive it."),
}


def order_event(name: str, event: str, product: str, quantity: int, detail: str, requester: str, app_url: str):
    heading, line = _ORDER_COPY[event]
    rows = [("Product", product), ("Quantity", str(quantity))]
    if event == "submitted":
        rows.append(("Ordered by", requester))
    if event == "rejected" and detail:
        rows.append(("Reason", detail))
    if event == "dispatched" and detail:
        rows.append(("Asset tag", detail))
    html, text = _render(heading, [_hi(name), line], rows=rows, cta=("View orders", f"{app_url}/orders"))
    return f"{heading}: {product}", html, text


_TICKET_COPY = {
    "created": ("Ticket created", "A new helpdesk ticket has been logged."),
    "assigned": ("Ticket assigned to you", "A helpdesk ticket has been assigned to you."),
    "status": ("Ticket updated", "There is an update on your helpdesk ticket."),
}


def ticket_event(name: str, event: str, number: str, title: str, status: str, priority: str, app_url: str):
    heading, line = _TICKET_COPY[event]
    rows = [("Ticket", number), ("Title", title), ("Status", status.replace("_", " ").title()), ("Priority", priority.title())]
    html, text = _render(heading, [_hi(name), line], rows=rows, cta=("Open helpdesk", f"{app_url}/tickets"))
    return f"{heading}: {number}", html, text


def order_received(name: str, product: str, quantity: int, received_by: str, app_url: str):
    rows = [("Product", product), ("Quantity", str(quantity)), ("Confirmed by", received_by)]
    html, text = _render("Order received", [_hi(name), "The requester has confirmed that this order arrived."], rows=rows, cta=("View orders", f"{app_url}/orders"))
    return f"Order received: {product}", html, text


def ticket_comment(name: str, number: str, title: str, author: str, comment: str, app_url: str):
    snippet = comment if len(comment) <= 500 else comment[:500] + "..."
    rows = [("Ticket", number), ("Title", title), ("From", author), ("Comment", snippet)]
    html, text = _render("New reply on a ticket", [_hi(name), "There is a new comment on a helpdesk ticket you are part of."], rows=rows, cta=("Open helpdesk", f"{app_url}/tickets"))
    return f"New comment on {number}", html, text


_TRANSFER_COPY = {
    "requested": ("Asset transfer requested", "A request to transfer an asset has been raised."),
    "approved": ("Asset transfer approved", "The asset transfer has been approved."),
    "rejected": ("Asset transfer rejected", "The asset transfer was not approved."),
    "completed": ("Asset transferred", "The asset has been moved to its new holder."),
    "cancelled": ("Asset transfer cancelled", "The asset transfer has been cancelled."),
}


def transfer_event(name: str, event: str, asset_tag: str, from_name: str, to_name: str, reason: str, app_url: str):
    heading, line = _TRANSFER_COPY[event]
    rows = [("Asset tag", asset_tag), ("From", from_name or "Store"), ("To", to_name or "Unknown")]
    if reason:
        rows.append(("Reason", reason))
    html, text = _render(heading, [_hi(name), line], rows=rows, cta=("View assets", f"{app_url}/assets"))
    return f"{heading}: {asset_tag}", html, text


_RESERVATION_COPY = {
    "created": ("Reservation requested", "A new asset reservation needs review."),
    "approved": ("Reservation approved", "Your reservation has been approved."),
    "rejected": ("Reservation rejected", "Your reservation could not be approved."),
    "cancelled": ("Reservation cancelled", "A reservation has been cancelled."),
    "completed": ("Reservation completed", "Your reservation has been marked completed."),
}


def reservation_event(name: str, event: str, asset_tag: str, product: str, start: str, end: str, purpose: str, requester: str, app_url: str):
    heading, line = _RESERVATION_COPY[event]
    rows = [("Asset tag", asset_tag), ("Product", product), ("From", start[:10]), ("To", end[:10])]
    if event in ("created", "cancelled") and requester:
        rows.append(("Requested by", requester))
    if purpose:
        rows.append(("Purpose", purpose))
    html, text = _render(heading, [_hi(name), line], rows=rows, cta=("View reservations", f"{app_url}/reservations"))
    return f"{heading}: {asset_tag}", html, text


def maintenance_event(name: str, event: str, asset_tag: str, title: str, when: str, notes: str, app_url: str):
    if event == "scheduled":
        heading, line = "Maintenance scheduled", "A maintenance task has been scheduled."
        rows = [("Asset tag", asset_tag), ("Task", title), ("Scheduled for", when[:10])]
    else:
        heading, line = "Maintenance completed", "A maintenance task has been completed."
        rows = [("Asset tag", asset_tag), ("Task", title), ("Completed on", when[:10])]
        if notes:
            rows.append(("Notes", notes))
    html, text = _render(heading, [_hi(name), line], rows=rows, cta=("Open Ownix", app_url))
    return f"{heading}: {asset_tag}", html, text


def asset_disposed(name: str, asset_tag: str, product: str, method: str, date: str, by: str, app_url: str):
    rows = [("Asset tag", asset_tag), ("Product", product), ("Method", method or "-"), ("Date", (date or "")[:10] or "-"), ("Recorded by", by)]
    html, text = _render("Asset disposed", [_hi(name), "An asset has been marked as disposed and removed from active inventory."], rows=rows, cta=("Open Ownix", app_url))
    return f"Asset disposed: {asset_tag}", html, text


def offboarding(name: str, employee: str, returned: List[str], still_holding: List[str], deactivated: bool, app_url: str):
    rows = [("Employee", employee), ("Assets taken back", ", ".join(returned) or "None"), ("Still holding", ", ".join(still_holding) or "None"),
            ("Account", "Deactivated" if deactivated else "Active")]
    line = "The offboarding of an employee has been processed."
    if still_holding:
        line += " Some assets are still not recovered and need follow-up."
    html, text = _render("Employee offboarding", [_hi(name), line], rows=rows, cta=("Open Ownix", app_url))
    return f"Offboarding: {employee}", html, text


def tenant_created(name: str, company: str, login_url: str):
    html, text = _render("Your Ownix workspace is ready", [_hi(name), f"The workspace for {company} has been created on Ownix. You can sign in and start adding assets."], cta=("Sign in", login_url))
    return f"Your Ownix workspace for {company}", html, text


def subscription_changed(name: str, company: str, plan: str, app_url: str):
    rows = [("Workspace", company), ("Plan", plan)]
    html, text = _render("Subscription updated", [_hi(name), "The subscription plan for your workspace has changed."], rows=rows, cta=("View subscription", f"{app_url}/subscription"))
    return f"Ownix plan updated: {plan}", html, text


_PAYMENT_COPY = {
    "issued": ("New invoice", "A new invoice has been issued for your workspace."),
    "paid": ("Payment received", "Thank you. We have received your payment."),
    "failed": ("Payment failed", "Your payment could not be completed. Please try again from the subscription page."),
}


def invoice_event(name: str, event: str, amount: str, currency: str, description: str, period: str, app_url: str):
    heading, line = _PAYMENT_COPY[event]
    rows = [("Amount", f"{amount} {currency}"), ("Description", description)]
    if period:
        rows.append(("Period", period))
    html, text = _render(heading, [_hi(name), line], rows=rows, cta=("View subscription", f"{app_url}/subscription"))
    return f"{heading}: {amount} {currency}", html, text
