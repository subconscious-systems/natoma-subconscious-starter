# Ideas to spark off

Not prescriptive. Steal a thread, recombine, build something better.

## Inbox & comms

- **Triage assistant.** Read overnight Gmail + Slack DMs. Cluster by sender intent. Draft 3-line replies for routine ones, escalate the rest with one-line summaries.
- **"What did I miss?" briefing.** Last 24h across Slack, Linear, GitHub. One paragraph, sorted by urgency to *you* specifically.
- **Meeting prep.** Pull the calendar event, find related Linear issues + Notion docs + recent Slack threads about the attendees, render a one-page brief.

## Engineering

- **PR reviewer.** Pull a GitHub PR diff, fetch the relevant docs via Context7, post a review focused on whether the change matches current library APIs.
- **Issue grooming.** Walk a Linear backlog, identify duplicates, suggest re-labels, link related issues.
- **Repo onboarder.** Point at a GitHub repo, output a 5-minute "what to read first" tour — entry points, key abstractions, weird parts.

## Research

- **Threaded researcher.** Brave search → fetch top N pages → cluster claims → produce a Notion doc with citations. Repeats until confidence threshold.
- **Competitor monitor.** Daily Brave search for a set of companies, diff against yesterday, post anything new to Slack.
- **Document Q&A.** Drop a long PDF, ask questions, get answers grounded in extracted passages (you handle the PDF → text step; model handles the rest).

## Operations

- **AWS cost detective.** Walk through tagged resources via AWS MCP, identify anomalies vs last week, draft a Linear ticket per finding.
- **Status-page autoresponder.** Watch a Slack channel for incident reports, draft a customer-facing status update via Resend.

## Creative / weird

- **The Decider.** You describe a small decision; it asks 3 questions, then commits to an answer and emails it to you so you can't back out.
- **Tone matcher.** Reads the last 20 emails to a recipient, drafts a new email in *exactly* that tone.
- **Patient archaeologist.** Crawl 6 months of a Slack channel + Linear comments to reconstruct *why* a piece of code looks the way it does.
- **The interview.** Roleplays a 1:1 with you about a problem you're stuck on, summarizes the conversation into a Notion doc.

## Cross-cutting capabilities to play with

- **Long context.** The model is built for it. Don't pre-summarize — let it read everything.
- **Tool loops.** The most interesting demos call 10+ tools in a session. Multi-MCP chains > single tool calls.
- **Images.** Pass screenshots, diagrams, whiteboard photos as `image_url` content blocks.
- **Self-correction.** Have the agent re-call a tool with refined args when the first result is wrong. The interesting agents recover.
