import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import crypto from "crypto";
import path from "path";

// ---------- Types ----------
interface MenuItem {
	id: number;
	name: string;
	price: number;
}

interface SessionData {
	orders: MenuItem[][];
	currentOrder: MenuItem[];
}

// ---------- App Setup ----------
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cookieParser());
app.use(bodyParser.json());

// Set EJS as template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------- Dummy Data ----------
const SESSIONS: Record<string, SessionData> = {};

const MENU: MenuItem[] = [
	{ id: 1, name: "Margherita Pizza", price: 3500 },
	{ id: 2, name: "Cheeseburger", price: 1800 },
	{ id: 3, name: "Jollof Rice (Large)", price: 2200 },
	{ id: 4, name: "Fried Plantain + Egg", price: 700 },
	{ id: 5, name: "Coke (330ml)", price: 300 },
];

// ---------- Helpers ----------
function getSession(req: Request, res: Response): SessionData {
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
		"Welcome to Dummy Restaurant Bot 🍽️",
		"Select 1 to Place an order",
		"Select 99 to Checkout order",
		"Select 98 to See order history",
		"Select 97 to See current order",
		"Select 0 to Cancel order",
	];
}

// ---------- Routes ----------

// Frontend page
app.get("/", (req: Request, res: Response) => {
	res.render("index");
});

// Chat API
app.post("/chat", (req: Request, res: Response) => {
	const { input } = req.body as { input?: string };
	const session = getSession(req, res);
	const msg = String(input || "").trim();

	// No input → show main menu
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
			session.orders.push([...session.currentOrder]);
			session.currentOrder = [];
			return res.json({
				reply: ["✅ Order placed successfully!", ...mainMenu()],
			});
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
				reply: ["❌ Current order cancelled.", ...mainMenu()],
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

// ---------- Start ----------
app.listen(PORT, () => {
	console.log(`Restaurant ChatBot running at http://localhost:${PORT}`);
});
