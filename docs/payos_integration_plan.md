# PayOS Integration & Email Notification Plan

## 1. Overview & Objectives
Replace the current static VietQR implementation (`img.vietqr.io`) in both **Desktop (Tauri)** and **Mobile (PWA)** apps with **payOS dynamic payment gateway**. 
When a user scans the payOS VietQR and completes a transfer, payOS will issue a real-time webhook callback to a serverless backend hosted on Cloudflare Pages, which will instantly send a notification email to your Gmail address.

---

## 2. Architecture Diagram

```
+--------------------------+       +--------------------------+
|  Campfire Mobile (PWA)   |       |  Campfire Desktop (Tauri)|
+------------+-------------+       +------------+-------------+
             |                                  |
             +----------------+-----------------+
                              | (Request Payment QR / Link)
                              v
                  +-----------------------+
                  |    payOS Gateway      |
                  +-----------+-----------+
                              | (User scans VietQR & pays)
                              v
                  +-----------------------+
                  |  payOS Webhook Server |
                  +-----------+-----------+
                              | (HTTP POST Webhook)
                              v
         +-----------------------------------------+
         | Cloudflare Pages Function               |
         | (/api/payos-webhook)                   |
         +--------------------+--------------------+
                              | (Verify signature & send email)
                              v
                  +-----------------------+
                  | Resend / Mail Service |
                  +-----------+-----------+
                              | (Email Alert)
                              v
                  +-----------------------+
                  |   Your Gmail Inbox    |
                  +-----------------------+
```

---

## 3. Step-by-Step Implementation Strategy

### Phase 1: Environment & payOS Setup
1. **payOS Account Credentials**:
   * Sign up / log in to [my.payos.vn](https://my.payos.vn).
   * Retrieve API Credentials:
     - `PAYOS_CLIENT_ID`
     - `PAYOS_API_KEY`
     - `PAYOS_CHECKSUM_KEY`
2. **Cloudflare Pages Environment Variables**:
   * Add the payOS credentials and your target Gmail address (`NOTIFICATION_EMAIL`) to Cloudflare Pages environment variables.
   * Add `RESEND_API_KEY` for email dispatching.

---

### Phase 2: Serverless Webhook & Email Handler (Cloudflare Pages Functions)
Create serverless backend functions inside `mobile/functions/api/`:

1. **`mobile/functions/api/create-payment.ts`**:
   - Endpoint: `POST /api/create-payment`
   - Generates a payOS transaction order code (`orderCode`), creates a payment request via payOS API, and returns the payOS `checkoutUrl` and `qrCode` to the frontend.

2. **`mobile/functions/api/payos-webhook.ts`**:
   - Endpoint: `POST /api/payos-webhook`
   - **Signature Verification**: Validates `signature` with `PAYOS_CHECKSUM_KEY` to ensure the callback genuinely originated from payOS.
   - **Email Dispatcher**: Uses Resend API to send an HTML email notification to your Gmail:
     - **Subject**: `[Campfire] 💰 New Donation Received: <Amount> VND`
     - **Body**: Order Code, Amount, Payment Date, Buyer Note/Custom Message.

---

### Phase 3: Frontend Integration

#### A. Mobile App (`mobile/src/components/modals/DonateModal.tsx`)
- Replace the static `img.vietqr.io` URL with dynamic payOS payment link/QR generator.
- Add preset amount buttons (e.g. 20,000 VND, 50,000 VND, 100,000 VND, or custom amount).
- Provide a button to open the official payOS Checkout page or display the payOS QR code directly inside the modal.

#### B. Desktop App (`desktop/src/components/about/VietQrPanel.tsx` & `SupportModal.tsx`)
- Replace static VietQR logic with payOS checkout flow.
- Seamlessly trigger system browser / open payOS checkout URL when clicking "Donate".

---

## 4. Verification & Testing Plan
1. **Local Webhook Testing**:
   - Test `payos-webhook.ts` using `npx wrangler pages dev` and payOS sandbox/test webhooks.
2. **End-to-End Payment Test**:
   - Perform a small live payment (e.g. 2,000 VND) via payOS VietQR.
   - Verify that payOS returns success status.
   - Confirm receipt of notification email in your Gmail inbox.

---

## 5. Required Information / Clarifications from User
Before execution, please confirm:
1. **Gmail Notification Provider**: Do you prefer using **Resend** (Recommended, 3,000 free emails/mo) or another email service (e.g., SendGrid, Gmail SMTP)?
2. **Telegram Alternative**: Would you also like a Telegram push notification sent directly to your phone alongside the Gmail email?
