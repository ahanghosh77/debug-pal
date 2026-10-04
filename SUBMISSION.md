*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

## What I Built

I built **DebugPal AI** for my 3rd-semester computer science classmate and lab partner, **Rohan**.

In our 3rd-semester curriculum, our core **Data Structures Lab** is taught in **C and C++**. For students transitioning from high-level languages like Python, C pointers and manual memory management are notoriously painful.

Every single week before lab assignments are due, Rohan would panic over the most dreaded compiler message:
```bash
Segmentation fault (core dumped)
```

The problem with GCC and traditional compiler tools is that they don't teach. They give you a cryptic crash message with no visual context. When Rohan asked cloud AI chatbots for help, they would simply rewrite his entire function. This meant he never understood the underlying memory invariants, and he was terrified of failing our in-person handwritten exams.

**DebugPal AI** is an offline-first, visual Socratic tutor designed specifically for CS students. Instead of spitting out solutions, it:
- 🥞 **Renders an Interactive Visual Memory Map**: Shows the physical Call Stack frames, memory addresses, Heap chunks, and pointer connections.
- 🎯 **Pinpoints the Crash Invariant**: Visually flags invalid jumps to page 0 (`0x00000000`), dangling stack frames, and orphaned heap memory.
- 🤔 **3-Tier Socratic Guidance**: Guides the student with targeted questions (*The Observation* ➡️ *The Invariant Check* ➡️ *The Root Cause*) so they experience the lightbulb moment themselves.
- 💡 **Everyday Mental Models**: Uses relatable everyday analogies (e.g., explaining dangling pointers like an Airbnb key after checkout, or memory leaks like hoarding library books under your bed).
- 🛡️ **Defensive Code Patch & Checklist**: Provides clean before/after code diffs with industry best practices.

### What Rohan Thought

I handed DebugPal to Rohan in our hostel study room over the weekend while we were preparing for our Data Structures lab evaluation:

> *"During our linked list assignment, I kept getting segfaults because I was chaining `head->next->next` without verifying if the list had fewer than 3 nodes. Cloud AI just gave me the corrected code without explaining why my logic failed.*
>
> *When DebugPal drew the Stack and Heap map and showed the arrow pointing into `0x00000000 [Unmapped Page 0]`, it instantly clicked why the CPU crashed. The Socratic hints made me think about the loop condition instead of guessing. It feels like having a patient teaching assistant sitting next to you at midnight."*

---

## Demo

🔗 **Live Website Demo:** [https://debugpal-ai.vercel.app/](https://debugpal-ai.vercel.app/) *(or clone and open `index.html` locally)*

### Try it yourself:
1. Select one of the built-in 3rd-sem lab presets:
   - **Linked List Segfault** (NULL pointer dereference)
   - **Dangling Pointer** (Returning address of stack local variable)
   - **Memory Leak** (Dynamic 2D matrix allocation in a loop without `free()`)
   - **Buffer Overflow** (Off-by-one array bounds error)
2. Click **Inspect Memory & Debug** (or press `Ctrl + Enter`).
3. Explore the **Visual Memory Map**, unlock the **Socratic Hints** one by one, read the **Everyday Analogy**, and inspect the **Safe Code Diff**.

---

## Code

{% github ahanghosh77/debugpal-ai %}

### Tech Stack:
- **Frontend:** Semantic HTML5, Vanilla CSS3 (modern dark terminal aesthetic, glassmorphism, responsive grid, high-contrast memory diagrams), Vanilla JavaScript
- **AI Core:** Designed to run with local open-weight models (**Google Gemma 2 2B**, **Llama 3.2 3B**, **Qwen 2.5 Coder**) via local **Ollama** (`http://localhost:11434/api/generate`) with a resilient built-in heuristic AST parser when offline
- **Export Engine:** One-click Markdown report generator for lab study notes

---

## How I Built It

1. **Socratic Prompt Architecture for Open-Weight Models:**
   Smaller open-weight models like `gemma2:2b` are incredibly fast and lightweight enough to run on modest student laptops without needing an external GPU. I designed a structured JSON-schema system prompt that forces the model to act as a **Socratic mentor**:
   - Classify the specific memory fault
   - Generate simulated hex stack/heap memory blocks with pointer arrows
   - Formulate 3 progressive questions rather than giving away the patch
   - Generate an everyday real-world analogy

2. **Resilient Offline Architecture:**
   Hostel Wi-Fi and university lab basements often suffer from unreliable internet. DebugPal communicates with local Ollama via browser `fetch`. If the student doesn't have Ollama running, DebugPal's rule-based heuristic semantic engine seamlessly handles the inspection — guaranteeing 100% uptime with zero external dependencies.

3. **Cognitive Load & Interactive Visuals:**
   Instead of walls of text, memory states are presented as clean visual cards with distinct color-coded boundaries (Green = Safe, Amber = Warning/Leak, Red = Crash Point).

---

## Why Does Open Innovation Matter?

Open innovation is what made DebugPal possible:

1. **Free for University Students:** College students shouldn't have to pay $20/month cloud subscriptions just to debug their lab homework. Open-weight models like Google's Gemma 2 bring state-of-the-art reasoning to students' laptops for $0.
2. **Academic Integrity & Privacy:** Course assignments, private university problem sets, and student code never leave the local machine. No corporate cloud harvesting or telemetry.
3. **True Offline Freedom:** Open-source AI runs in a basement computer lab, on a bus, or in a hostel room during a campus network blackout.
4. **Pedagogical Freedom:** Proprietary cloud APIs are optimized to complete tasks for you; open innovation allows us to tune small open models into dedicated, patient teachers that guide you to learn.

---

## My Agent Session

This project was architected and built pair-programming with **Google Antigravity** and saved via **DevRelay**:

{% agent_session session-2026-10-04-2115-debugpal %}

🔗 **Session Transcript:** [https://dev.to/agent_sessions/session-2026-10-04-2115-debugpal](https://dev.to/agent_sessions/session-2026-10-04-2115-debugpal)

---

## Prize Categories

- **Best Use of Gemma** — DebugPal AI is optimized for Google's **Gemma 2 (2B)** open-weight model via Ollama, turning complex pointer bugs into structured visual memory maps and Socratic learning prompts with zero cloud API fees.
