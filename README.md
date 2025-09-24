# 🍽️ Restaurant ChatBot

This is a simple **Restaurant ChatBot** built with **Node.js + Express** and an EJS frontend.
The chatbot allows customers to interact using a **chat interface** to place food orders, view history, cancel orders, and make **secure Paystack payments**.

---

## ✨ Features

- Interactive **chat-style UI** (like WhatsApp/Telegram).
- Session-based cart stored using cookies (no login needed).
- Menu browsing and item selection.
- Place and cancel orders.
- View current cart or past order history.
- **Checkout with Paystack** (Test mode).
- Order automatically confirmed on successful payment.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: EJS + Vanilla JS
- **Payment**: Paystack
- **Storage**: In-memory session store (can be replaced with Redis/DB)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/restaurant-chatbot.git
cd restaurant-chatbot


To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## How to use

Welcome to Dummy Restaurant Bot

Select 1 to Place an order

Select 99 to Checkout order

Select 98 to See order history

Select 97 to See current order

Select 0 to Cancel order

This project was created using `bun init` in bun v1.2.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
