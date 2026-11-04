"""Send the Ownix test email to one or more addresses.

Usage (token comes from your environment, it is never written to disk):
    ZEPTOMAIL_TOKEN="Zoho-enczapikey ..." python send_test_mail.py a@example.com b@example.com
"""
import asyncio
import sys

import email_templates
import mailer


async def main(recipients: list) -> int:
    if not mailer.is_configured():
        print("ZEPTOMAIL_TOKEN is not set.")
        return 2
    failures = 0
    for address in recipients:
        subject, html, text = email_templates.test_email(address.split("@")[0].title())
        ok = await mailer.send_mail(to=address, subject=subject, html=html, text=text)
        print(f"{address}: {'sent' if ok else 'FAILED (see log line above)'}")
        failures += 0 if ok else 1
    return 1 if failures else 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(asyncio.run(main(sys.argv[1:])))
