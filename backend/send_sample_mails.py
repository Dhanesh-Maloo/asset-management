"""Send one sample of EVERY Ownix email (with made-up data) to a single address, to review wording and layout.

Usage (token from your environment, never written to disk):
    ZEPTOMAIL_TOKEN="<token>" python send_sample_mails.py you@example.com
"""
import asyncio
import sys

import email_templates as t
import mailer

U = "https://ownix.pro"


def samples(name: str, email: str):
    yield t.test_email(name)
    yield t.welcome(name, email, U + "/login", U + "/reset-password?token=SAMPLE")
    yield t.welcome(name, email, U + "/login", None)
    yield t.invite("Aarav Sharma", "Asset Manager", U + "/invite/SAMPLE")
    yield t.password_reset(name, U + "/reset-password?token=SAMPLE")
    yield t.alert("3 warranty / licence / AMC item(s) need attention",
                  ["Warranty: Dell Latitude 5440 - expires in 7 day(s) (2026-11-11)",
                   "Licence: Adobe CC - expires in 30 day(s) (2026-12-04)",
                   "AMC: Printer AMC - expired 2 day(s) ago (2026-11-02)"],
                  "These items are expiring soon or have just expired:", U)
    yield t.asset_assigned(name, "AST-1042", "Dell Latitude 5440", "SN-84K29X", "Aarav Sharma", U)
    yield t.asset_returned(name, "AST-1042", "Dell Latitude 5440", "Good", 0, False, U)
    yield t.asset_returned(name, "AST-1042", "Dell Latitude 5440", "", 0, True, U)
    for ev, detail in [("submitted", ""), ("checker_approved", ""), ("approved", ""),
                       ("rejected", "Budget not approved for this quarter"), ("dispatched", "AST-1042")]:
        yield t.order_event(name, ev, "Dell Latitude 5440", 2, detail, "Rohan Mehta", U)
    yield t.order_received(name, "Dell Latitude 5440", 2, "Rohan Mehta", U)
    for ev in ("created", "assigned", "status"):
        yield t.ticket_event(name, ev, "TKT-0231", "Laptop will not boot", "in_progress", "high", U)
    yield t.ticket_comment(name, "TKT-0231", "Laptop will not boot", "Neha Kapoor", "I tried a hard reset, it still shows a black screen.", U)
    for ev in ("requested", "approved", "rejected", "completed", "cancelled"):
        yield t.transfer_event(name, ev, "AST-1042", "Rohan Mehta", "Neha Kapoor", "Team change", U)
    for ev in ("created", "approved", "rejected", "cancelled", "completed"):
        yield t.reservation_event(name, ev, "AST-2210", "Projector", "2026-11-10", "2026-11-12", "Client demo", "Rohan Mehta", U)
    yield t.maintenance_event(name, "scheduled", "AST-1042", "Quarterly service", "2026-11-20", "", U)
    yield t.maintenance_event(name, "completed", "AST-1042", "Quarterly service", "2026-11-20", "Fan cleaned, thermal paste replaced", U)
    yield t.asset_disposed(name, "AST-0777", "Old Router", "Recycled", "2026-11-04", "Aarav Sharma", U)
    yield t.offboarding(name, "Vikram Rao", ["AST-1042", "AST-1043"], ["AST-1044"], True, U)
    yield t.tenant_created(name, "Globex Demo", U + "/login")
    yield t.subscription_changed(name, "Globex Demo", "Professional", U)
    for ev in ("issued", "paid", "failed"):
        yield t.invoice_event(name, ev, "4,999.00", "INR", "Professional plan, monthly", "2026-11-01 to 2026-11-30", U)


async def main(address: str) -> int:
    if not mailer.is_configured():
        print("ZEPTOMAIL_TOKEN is not set.")
        return 2
    name = address.split("@")[0].title()
    failures = total = 0
    for subject, html, text in samples(name, address):
        total += 1
        ok = await mailer.send_mail(to=address, name=name, subject=f"[SAMPLE] {subject}", html=html, text=text)
        print(f"{'sent  ' if ok else 'FAILED'} {subject}")
        failures += 0 if ok else 1
        await asyncio.sleep(0.4)  # stay well under any rate limit
    print(f"{total - failures}/{total} sent to {address}")
    return 1 if failures else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(asyncio.run(main(sys.argv[1])))
