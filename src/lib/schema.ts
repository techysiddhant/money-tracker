import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ─── Better Auth Tables ──────────────────────────────────────────────────────

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
	image: text("image"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId").notNull().references(() => user.id)
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId").notNull().references(() => user.id),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
	refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" })
});

// ─── Expense Manager Tables ─────────────────────────────────────────────────

export const paymentMethod = sqliteTable("payment_method", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id),
	name: text("name").notNull(),
	type: text("type").notNull(), // card | upi | cash | netbanking | wallet | other
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const member = sqliteTable("member", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id),
	name: text("name").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const category = sqliteTable("category", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id),
	name: text("name").notNull(),
	icon: text("icon"), // optional emoji
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const cycle = sqliteTable("cycle", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id),
	name: text("name").notNull(),
	startDate: text("start_date").notNull(), // ISO date string
	endDate: text("end_date").notNull(), // ISO date string
	status: text("status").notNull().default("active"), // active | closed
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const expense = sqliteTable("expense", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id),
	title: text("title").notNull(),
	amount: real("amount").notNull(), // stored as decimal, e.g., 260.00
	date: text("date").notNull(), // ISO date string
	cycleId: text("cycle_id").notNull().references(() => cycle.id),
	categoryId: text("category_id").notNull().references(() => category.id),
	paymentMethodId: text("payment_method_id").notNull().references(() => paymentMethod.id),
	comment: text("comment"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const expenseSplit = sqliteTable("expense_split", {
	id: text("id").primaryKey(),
	expenseId: text("expense_id").notNull().references(() => expense.id, { onDelete: "cascade" }),
	memberId: text("member_id").notNull().references(() => member.id),
	amount: real("amount").notNull(), // split amount
	received: real("received").notNull().default(0), // amount received from member
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const memberPayment = sqliteTable("member_payment", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id),
	cycleId: text("cycle_id").notNull().references(() => cycle.id),
	memberId: text("member_id").notNull().references(() => member.id),
	amount: real("amount").notNull(),
	note: text("note"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const memberAdditionalCost = sqliteTable("member_additional_cost", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id),
	cycleId: text("cycle_id").notNull().references(() => cycle.id),
	memberId: text("member_id").notNull().references(() => member.id),
	amount: real("amount").notNull(),
	description: text("description").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const paymentMethodRelations = relations(paymentMethod, ({ many }) => ({
	expenses: many(expense),
}));

export const memberRelations = relations(member, ({ many }) => ({
	splits: many(expenseSplit),
	payments: many(memberPayment),
	additionalCosts: many(memberAdditionalCost),
}));

export const categoryRelations = relations(category, ({ many }) => ({
	expenses: many(expense),
}));

export const cycleRelations = relations(cycle, ({ many }) => ({
	expenses: many(expense),
	memberPayments: many(memberPayment),
	memberAdditionalCosts: many(memberAdditionalCost),
}));

export const expenseRelations = relations(expense, ({ one, many }) => ({
	cycle: one(cycle, {
		fields: [expense.cycleId],
		references: [cycle.id],
	}),
	category: one(category, {
		fields: [expense.categoryId],
		references: [category.id],
	}),
	paymentMethod: one(paymentMethod, {
		fields: [expense.paymentMethodId],
		references: [paymentMethod.id],
	}),
	splits: many(expenseSplit),
}));

export const expenseSplitRelations = relations(expenseSplit, ({ one }) => ({
	expense: one(expense, {
		fields: [expenseSplit.expenseId],
		references: [expense.id],
	}),
	member: one(member, {
		fields: [expenseSplit.memberId],
		references: [member.id],
	}),
}));

export const memberPaymentRelations = relations(memberPayment, ({ one }) => ({
	member: one(member, {
		fields: [memberPayment.memberId],
		references: [member.id],
	}),
	cycle: one(cycle, {
		fields: [memberPayment.cycleId],
		references: [cycle.id],
	}),
}));

export const memberAdditionalCostRelations = relations(memberAdditionalCost, ({ one }) => ({
	member: one(member, {
		fields: [memberAdditionalCost.memberId],
		references: [member.id],
	}),
	cycle: one(cycle, {
		fields: [memberAdditionalCost.cycleId],
		references: [cycle.id],
	}),
}));
