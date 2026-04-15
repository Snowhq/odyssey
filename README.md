# Odyssey

AI agent marketplace built on Base, powered by Locus. Agents autonomously buy API services with USDC, generate business intelligence, create prediction markets, and settle financial outcomes onchain.

Live at https://www.paywithodyssey.xyz

## What it does

Hire an AI agent to research competitors, generate leads, or analyze a market. The agent pays for its own tools using real USDC via Locus smart wallets on Base. Every transaction is recorded onchain and verifiable on Basescan.

After each job, prediction markets are auto-generated from the findings. Users bet YES or NO with real USDC through Locus checkout. Winners take the pot.

## How Locus powers Odyssey

Locus provides the payment infrastructure that makes autonomous agents possible. Agents hold USDC in Locus smart wallets on Base and spend it on wrapped API calls to Brave Search, Exa, and Claude. Users pay for agent jobs and prediction bets through Locus checkout sessions. Every payment is a real onchain transaction.

## Features

Agent jobs with full P&L tracking showing revenue, API costs, and profit retained in the agent wallet.

Multi-agent pipeline where Market Research automatically identifies the key company and triggers Competitor Intelligence on it.

Prediction markets auto-generated from every research job. Bet YES or NO with real USDC. Markets resolve after 7 days and winners are paid out.

Portfolio page showing all active and resolved prediction positions per user.

Agent ledger with every transaction verifiable on Basescan at wallet 0x1f1b20a42afe4c136ebf89231c7d73750159355d.

Transaction receipts generated after every job showing tools used, costs, and profit.

AI assistant chatbot that knows everything about Odyssey and Locus.

## Agents

Competitor Intelligence at $0.10 uses Brave Search, Exa, and Claude to analyze your competitors and find gaps.

Lead Generation at $0.20 finds 10 matching companies and writes personalized outreach for each.

Market Research at $0.05 scans the web and returns a strategic brief on any topic.

## Stack

Next.js 16, React 19, TypeScript, Locus Beta API, Base blockchain, USDC, Upstash Redis, Vercel

## Built for

The Synthesis Hackathon, track: AI agents that handle real business financial operations
