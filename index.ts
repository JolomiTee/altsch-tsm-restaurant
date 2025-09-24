import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import crypto from "crypto";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

interface MenuItem {
	id: number;
	name: string;
	price: number;
}

interface SessionData {
	orders: MenuItem[][];
	currentOrder: MenuItem[];
	lastPayment?: { amount: number; reference: string };
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cookieParser());
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const SESSIONS: Record<string, SessionData> = {};

export const MENU: MenuItem[] = [
	{ id: 10, name: "Margherita Pizza", price: 3500 },
	{ id: 20, name: "Cheeseburger", price: 1800 },
	{ id: 30, name: "Jollof Rice (Large)", price: 2200 },
	{ id: 40, name: "Fried Plantain + Egg", price: 700 },
	{ id: 50, name: "Coke (330ml)", price: 300 },
];

export function getSession(req: Request, res: Response): SessionData {
	let sid = req.cookies?.sessionId as string | undefined;

	if (!sid || !SESSIONS[sid]) {
		sid = crypto.randomBytes(12).toString("hex");
		SESSIONS[sid] = { orders: [], currentOrder: [] };
		res.cookie("sessionId", sid, { httpOnly: true });
	}

	return SESSIONS[sid];
}

function mainMenu(): string[] {
	return [
		"Welcome to Dummy Restaurant Bot",
		"Select 1 to Place an order",
		"Select 99 to Checkout order",
		"Select 98 to See order history",
		"Select 97 to See current order",
		"Select 0 to Cancel order",
	];
}

app.get("/", (req: Request, res: Response) => {
	res.render("index");
});

// Chat API
app.post("/chat", async (req: Request, res: Response) => {
	const { input } = req.body as { input?: string };
	const session = getSession(req, res);
	const msg = String(input || "").trim();

	if (!msg) {
		return res.json({ reply: mainMenu() });
	}

	switch (msg) {
		case "1": {
			const items = MENU.map((m) => `${m.id}. ${m.name} - ₦${m.price}`);
			return res.json({
				reply: ["Select item number to add to your order:", ...items],
			});
		}

		case "99": {
			if (session.currentOrder.length === 0) {
				return res.json({
					reply: ["No order to place. Type 1 to start an order."],
				});
			}

			const total = session.currentOrder.reduce(
				(sum, it) => sum + it.price,
				0
			);

			// Create Paystack transaction
			try {
				const reference = crypto.randomBytes(8).toString("hex");

				const paystackRes = await axios.post(
					"https://api.paystack.co/transaction/initialize",
					{
						email: "test@example.com", // you can collect user email optionally
						amount: total * 100, // Paystack expects kobo
						reference,
						callback_url: `${process.env.BASE_URL}/paystack/callback?ref=${reference}`,
					},
					{
						headers: {
							Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
							"Content-Type": "application/json",
						},
					}
				);

				session.lastPayment = { amount: total, reference };

				return res.json({
					reply: [
						`Your total is ₦${total}. Click below to complete payment:`,
						paystackRes.data.data.authorization_url,
					],
				});
			} catch (err) {
				console.error(err);
				return res.json({
					reply: ["Error initializing payment. Please try again."],
				});
			}
		}

		case "98": {
			if (session.orders.length === 0) {
				return res.json({ reply: ["No order history yet."] });
			}
			const history = session.orders
				.map(
					(o, i) => `Order ${i + 1}: ${o.map((it) => it.name).join(", ")}`
				)
				.join("\n");
			return res.json({ reply: [history] });
		}

		case "97": {
			if (session.currentOrder.length === 0) {
				return res.json({ reply: ["No current order."] });
			}
			return res.json({
				reply: [
					"Current order:",
					session.currentOrder.map((it) => it.name).join(", "),
				],
			});
		}

		case "0": {
			session.currentOrder = [];
			return res.json({
				reply: ["Current order cancelled.", ...mainMenu()],
			});
		}

		default: {
			const item = MENU.find((m) => String(m.id) === msg);
			if (item) {
				session.currentOrder.push(item);
				return res.json({
					reply: [
						`Added ${item.name} to order.`,
						"Select more items or type 99 to checkout.",
					],
				});
			}
			return res.json({
				reply: ["Invalid input. Try again.", ...mainMenu()],
			});
		}
	}
});

// Paystack callback
app.get("/paystack/callback", async (req: Request, res: Response) => {
	const { reference } = req.query;
	if (!reference) return res.send("Invalid callback");

	try {
		const verifyRes = await axios.get(
			`https://api.paystack.co/transaction/verify/${reference}`,
			{
				headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
			}
		);

		if (verifyRes.data.data.status === "success") {
			// Find session with reference
			const sessionId = Object.keys(SESSIONS).find((sid) => {
				return SESSIONS[sid].lastPayment?.reference === reference;
			});

			if (sessionId) {
				const session = SESSIONS[sessionId];
				session.orders.push([...session.currentOrder]);
				session.currentOrder = [];
				session.lastPayment = undefined;
			}

			return res.send(
				`<script>alert("Payment successful! 🎉 Returning to bot..."); window.location.href="/";</script>`
			);
		} else {
			return res.send("Payment failed.");
		}
	} catch (err) {
		console.error(err);
		return res.send("Error verifying payment.");
	}
});

app.listen(PORT, () => {
	console.log(`Jolomi's Restaurant running at http://localhost:${PORT}`);
});
