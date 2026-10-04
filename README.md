# DebugPal AI 🛠️🧠
> **Visual Socratic C/C++ Pointer & Memory Tutor**  
> *Built for 3rd-Semester Computer Science students facing `Segmentation fault (core dumped)` in Data Structures lab.*

---

## 💡 The Problem & The Friend

In our 3rd-semester Computer Science curriculum, courses like **Data Structures & Algorithms in C/C++** and **Computer Systems** introduce low-level pointers, linked lists, and manual memory management (`malloc`, `free`).

My classmate and friend **Rohan** was constantly dreading weekly lab evaluations. Whenever his code crashed with:
```bash
Segmentation fault (core dumped)
```
GCC gave him **zero helpful clues** about *where* or *why* his pointer drifted off into unmapped memory. He would spend hours randomly adding `*` and `&` symbols or panicking right before assignment deadlines.

Existing cloud AI chat tools simply spit out the answer or rewrite the whole function, meaning students never learn the underlying memory invariants and fail their in-person paper exams.

---

## 🚀 What DebugPal Does

**DebugPal AI** is an offline-first, interactive visual tutor that bridges the gap between high-level code and physical computer memory:

1. **🥞 Visual Memory Layout (Stack vs Heap):**  
   Dynamically renders call stack frames, variable addresses, heap chunks, and pointer arrow targets. It clearly flags unmapped page 0 (`0x00000000`), dangling pointers, and orphaned memory blocks.

2. **🤔 3-Tier Socratic Guidance:**  
   Instead of spoiling the answer, it walks the student through:
   - *Tier 1 (The Observation)*: Guiding questions on what intermediate pointers evaluate to.
   - *Tier 2 (The Invariant Check)*: Probing why an operation violates memory bounds.
   - *Tier 3 (The Root Cause Reveal)*: Explains the exact kernel signal or hardware trap.

3. **💡 Everyday Analogies:**  
   Translates cryptic compiler bugs into relatable mental models:
   - *Dangling Pointer* = The hotel room key after checkout.
   - *NULL Dereference* = The phantom train station.
   - *Memory Leak* = Borrowing library books and hoarding them under the bed.
   - *Buffer Overflow* = Spilling coffee into your lab partner's cubicle.

4. **🛡️ Defensive Diff & Rule of Thumb Checklist:**  
   Shows before/after side-by-side patches with standard defensive programming patterns (`if (ptr != NULL)`, zeroing freed pointers).

5. **⚡ 100% Offline-First with Open-Weight AI:**  
   Designed to run with local open-weight models (**Google Gemma 2 2B**, **Llama 3.2 3B**, or **Qwen 2.5 Coder**) via Ollama, plus an instant built-in heuristic parsing engine for guaranteed zero-latency lab access without internet.

---

## 🛠️ Quickstart

### Option 1: Direct Browser Run
Simply double-click `index.html` or open it with any web browser! No Node.js build step required.

### Option 2: Run with Local Ollama (Google Gemma 2)
1. Install [Ollama](https://ollama.com/).
2. Pull the lightweight Gemma 2 model:
   ```bash
   ollama run gemma2:2b
   ```
3. Open `index.html` in your browser. Click **Model** in the top navigation and select `Google Gemma 2 (2B)`.

---

## 📚 Built-in Lab Traps
- **Linked List Segfault**: NULL pointer dereference during node traversal (`head->next->next`).
- **Dangling Pointer**: Returning the stack address of a local variable after function returns.
- **Memory Leak**: Dynamic 2D matrix allocation in nested loops without freeing inner pointers.
- **Buffer Overflow**: Classic off-by-one array loop boundary (`i <= N`).

---

## 📜 License
MIT License. Built with ❤️ for Hacktoberfest 2026.
