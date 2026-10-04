/**
 * DebugPal AI — Visual Socratic C/C++ Pointer & Memory Tutor
 * Offline-first open-weight model integration + heuristic engine.
 */

// ==========================================================================
// 1. Presets Library (3rd Semester CS Lab Common Traps)
// ==========================================================================
const PRESETS = {
  'linked-list-segfault': {
    lang: 'c',
    filename: 'linked_list.c',
    code: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node* next;
};

void printThirdNode(struct Node* head) {
    // ⚠️ Bug: Assumes list always has at least 3 nodes!
    // If list has only 1 or 2 nodes, this dereferences NULL.
    printf("3rd Node Data: %d\\n", head->next->next->data);
}

int main() {
    // Create a 2-node list: [10] -> [20] -> NULL
    struct Node* n1 = (struct Node*)malloc(sizeof(struct Node));
    struct Node* n2 = (struct Node*)malloc(sizeof(struct Node));
    
    n1->data = 10;
    n1->next = n2;
    
    n2->data = 20;
    n2->next = NULL; // Terminal node
    
    printf("Attempting to read 3rd element...\\n");
    printThirdNode(n1); // 💥 CRASH: Segmentation fault (core dumped)
    
    free(n2);
    free(n1);
    return 0;
}`,
    analysis: {
      bugType: 'NULL Pointer Dereference (SIGSEGV)',
      crashLine: 'Line 12',
      memoryHealth: 'Critical Fault: Attempted read from 0x00000000',
      stack: [
        { frame: 'main()', addr: '0x7ffd9898', varName: 'n1', target: '0x00501000', badge: 'Active Heap Ref' },
        { frame: 'main()', addr: '0x7ffd9890', varName: 'n2', target: '0x00501040', badge: 'Active Heap Ref' },
        { frame: 'printThirdNode()', addr: '0x7ffd9878', varName: 'head', target: '0x00501000', badge: 'Param Copy' },
        { frame: 'printThirdNode()', addr: '0x7ffd9870', varName: 'head->next->next', target: '0x00000000', isDanger: true, badge: 'INVALID DEREF' }
      ],
      heap: [
        { addr: '0x00501000', size: '16B', status: 'Allocated (Node 1)', val: 'data: 10, next: 0x00501040', isDanger: false },
        { addr: '0x00501040', size: '16B', status: 'Allocated (Node 2)', val: 'data: 20, next: NULL (0x0)', isDanger: false },
        { addr: '0x00000000', size: '0B', status: 'Unmapped OS Page 0', val: '[READ RESTRICTED]', isDanger: true }
      ],
      timeline: [
        '<code>n1</code> allocated at <code>0x00501000</code> with data 10.',
        '<code>n2</code> allocated at <code>0x00501040</code> with data 20, pointing to <code>NULL</code>.',
        '<code>printThirdNode(n1)</code> called; <code>head</code> points to <code>0x00501000</code>.',
        '<code>head->next</code> evaluates safely to <code>n2 (0x00501040)</code>.',
        '<code>n2->next</code> evaluates to <code>NULL (0x00000000)</code>.',
        '<span class="crash-step">💥 Line 12: CPU attempts to fetch offset <code>->data</code> from address <code>0x00000000</code>. OS memory management unit raises Page Fault -> SIGSEGV!</span>'
      ],
      hints: {
        h1: 'Look at line 12: <code>head->next->next->data</code>. Break this chained arrow expression into individual evaluations. What does <code>head->next</code> evaluate to? And what does that node point to?',
        h2: 'In <code>main()</code>, how many nodes were actually allocated? What did you set <code>n2->next</code> to on line 23? When a pointer is <code>NULL</code>, what memory address does it hold?',
        h3: 'A pointer storing <code>NULL</code> holds address <code>0x0</code>. The OS marks this address space as strictly inaccessible to catch bugs early. Any attempt to read or write through an arrow (<code>-></code>) or asterisk (<code>*</code>) on NULL triggers an immediate kernel Segmentation Fault.'
      },
      analogy: {
        title: 'The Phantom Train Station',
        visual: '🚂 [Stop 1] ➡️ [Stop 2] ➡️ 🛑 [Void] ❌',
        story: 'Imagine you are riding a train route with only two stations: Station A and Station B. The automated announcer says: "At the next stop, transfer to Station C to catch your flight." But Station C does not exist — the tracks simply end after Station B.',
        moral: 'In C, chaining pointers like `head->next->next` is like leaping off the train without checking if the track exists. Always verify each step exists with a guard condition: `if (head && head->next && head->next->next)`!'
      },
      diff: {
        before: `void printThirdNode(struct Node* head) {
    // ❌ Blindly dereferencing chain
    printf("3rd Node: %d\\n", head->next->next->data);
}`,
        after: `void printThirdNode(struct Node* head) {
    // ✅ Safe defensive check before dereferencing
    if (head != NULL && head->next != NULL && head->next->next != NULL) {
        printf("3rd Node: %d\\n", head->next->next->data);
    } else {
        printf("Error: List has fewer than 3 nodes!\\n");
    }
}`,
        checklist: [
          'Never chain arrows (<code>a->b->c</code>) without checking if intermediate pointers are non-NULL.',
          'Always check list size or loop condition (<code>while (curr != NULL)</code>) rather than assuming length.',
          'Write a helper function like <code>int getLength(struct Node* head)</code> before indexing deep nodes.'
        ]
      }
    }
  },

  'dangling-pointer': {
    lang: 'c',
    filename: 'dangling.c',
    code: `#include <stdio.h>
#include <stdlib.h>

int* createScore() {
    int score = 95; // Local variable on Stack!
    return &score;  // ⚠️ Bug: Returning address of stack memory!
}

int main() {
    int* ptr = createScore();
    
    // Some intervening function call that overwrites the stack frame
    printf("Doing other computations...\\n");
    
    // 💥 Reading memory after stack frame was popped!
    printf("Student Score: %d\\n", *ptr); // Garbage value or Crash!
    return 0;
}`,
    analysis: {
      bugType: 'Dangling Stack Pointer (Undefined Behavior)',
      crashLine: 'Line 15',
      memoryHealth: 'Severe Hazard: Pointer points to popped stack frame',
      stack: [
        { frame: 'main()', addr: '0x7ffd9898', varName: 'ptr', target: '0x7ffd9860', isDanger: true, badge: 'DANGLING REF' },
        { frame: 'createScore() [POPPED]', addr: '0x7ffd9860', varName: 'score', target: '95 (DEALLOCATED)', isDanger: true, badge: 'INVALID FRAME' }
      ],
      heap: [
        { addr: '0x00501000', size: '0B', status: 'Heap Empty', val: 'No dynamic memory allocated', isDanger: false }
      ],
      timeline: [
        '<code>createScore()</code> is called; new stack frame pushed at <code>0x7ffd9860</code>.',
        'Variable <code>score = 95</code> lives on the stack frame.',
        'Function returns <code>&score</code> (address <code>0x7ffd9860</code>).',
        'Stack frame for <code>createScore()</code> is popped and deallocated by CPU.',
        '<code>printf()</code> call pushes its own frame over the exact same stack space.',
        '<span class="crash-step">💥 Line 15: Dereferencing <code>*ptr</code> reads garbage data overwritten by printf!</span>'
      ],
      hints: {
        h1: 'Where in memory does the variable <code>int score</code> live? Is it on the Heap (dynamic) or the Stack (local)?',
        h2: 'What happens to a function\'s local variables when that function finishes executing and returns?',
        h3: 'When a function returns, its stack frame is marked as reusable by the operating system. Storing a pointer to a stack local means you hold an address that subsequent function calls (like printf) will immediately overwrite.'
      },
      analogy: {
        title: 'The Hotel Room Key After Checkout',
        visual: '🏨 🗝️ [Old Key] ➡️ 🚪 [New Guest Inside] ⚠️',
        story: 'You check into room 302 of a hotel. When checking out, you keep the plastic key card. Two hours later, you try to use that key card to open room 302. Another guest has already unpacked their luggage inside!',
        moral: 'Stack memory belongs to the function currently running. Once it returns, that room is reassigned. If you need data to survive outside the function, allocate it on the Heap with `malloc()`.'
      },
      diff: {
        before: `int* createScore() {
    int score = 95; // ❌ Lives on stack
    return &score;  // Returns dead address!
}`,
        after: `int* createScore() {
    // ✅ Allocate on Heap so it persists after return
    int* score = (int*)malloc(sizeof(int));
    if (score != NULL) {
        *score = 95;
    }
    return score; // Caller must free() it later!
}`,
        checklist: [
          'Never return the address (<code>&var</code>) of a local non-static variable.',
          'If data must outlive the function call, allocate it with <code>malloc()</code> or pass a pointer in from the caller.',
          'Always remember to <code>free()</code> heap memory once finished.'
        ]
      }
    }
  },

  'memory-leak': {
    lang: 'c',
    filename: 'matrix_leak.c',
    code: `#include <stdio.h>
#include <stdlib.h>

void allocateGrid(int rows, int cols) {
    // Allocate array of pointers
    int** matrix = (int**)malloc(rows * sizeof(int*));
    
    for (int i = 0; i < rows; i++) {
        matrix[i] = (int*)malloc(cols * sizeof(int));
        matrix[i][0] = i * 10;
    }
    
    printf("Matrix allocated successfully.\\n");
    // ⚠️ Bug: Function exits without freeing matrix[i] or matrix!
    // Memory remains orphaned on the heap forever.
}

int main() {
    for (int run = 0; run < 10000; run++) {
        allocateGrid(100, 100); // 💥 Massive leak: 40KB leaked per loop!
    }
    printf("Finished runs.\\n");
    return 0;
}`,
    analysis: {
      bugType: 'Heap Memory Leak (Orphaned Allocations)',
      crashLine: 'Line 14',
      memoryHealth: 'Leak Warning: ~400 MB orphaned heap space',
      stack: [
        { frame: 'allocateGrid()', addr: '0x7ffd9880', varName: 'matrix', target: '0x00501000', badge: 'Lost on Return' },
        { frame: 'main()', addr: '0x7ffd9898', varName: 'run', target: 'Counter (0..10000)', badge: 'Stack Int' }
      ],
      heap: [
        { addr: '0x00501000', size: '800B', status: 'Orphaned (matrix**)', val: 'Array of 100 int pointers', isDanger: true },
        { addr: '0x00502000', size: '400B', status: 'Orphaned (row 0)', val: '100 integers', isDanger: true },
        { addr: '0x00503000', size: '400B', status: 'Orphaned (row 1..99)', val: '99 rows unreachable', isDanger: true }
      ],
      timeline: [
        '<code>matrix</code> pointer allocated on heap with <code>malloc(rows * sizeof(int*))</code>.',
        'Loop allocates 100 individual rows on heap via <code>malloc(cols * sizeof(int))</code>.',
        'Function reaches closing brace <code>}</code> on line 14.',
        'Local variable <code>matrix</code> on the stack is destroyed.',
        '<span class="crash-step">💥 The memory on the Heap is NOT automatically freed! Without the pointer, you can never call free(). It is permanently orphaned.</span>'
      ],
      hints: {
        h1: 'Notice the variable <code>int** matrix</code> is a local pointer inside <code>allocateGrid()</code>. When the function returns, what happens to that local pointer variable?',
        h2: 'In C, does the computer automatically clean up memory allocated with <code>malloc()</code> when a pointer goes out of scope (like in Java or Python)?',
        h3: 'C has zero garbage collection. Every byte requested from the operating system with <code>malloc()</code> must be released with <code>free()</code> before the last pointer pointing to it is lost.'
      },
      analogy: {
        title: 'Borrowing Library Books Under the Bed',
        visual: '📚 ➡️ 🛏️ [Piled Forever, Never Returned] 💧',
        story: 'Every day you go to the college library, borrow 5 heavy reference books, bring them to your hostel, and slide them under your bed. You never return them. By exam week, the library is out of books and your room has no floor space left.',
        moral: 'In C, `malloc()` borrows pages of RAM from the OS. If you lose track of the receipt (pointer) without calling `free()`, that memory remains locked until the entire program terminates.'
      },
      diff: {
        before: `void allocateGrid(int rows, int cols) {
    int** matrix = (int**)malloc(rows * sizeof(int*));
    for (int i = 0; i < rows; i++) {
        matrix[i] = (int*)malloc(cols * sizeof(int));
    }
    // ❌ Exits without cleanup!
}`,
        after: `void allocateGrid(int rows, int cols) {
    int** matrix = (int**)malloc(rows * sizeof(int*));
    for (int i = 0; i < rows; i++) {
        matrix[i] = (int*)malloc(cols * sizeof(int));
    }
    
    // ✅ Free in reverse order: inner rows first, then outer array
    for (int i = 0; i < rows; i++) {
        free(matrix[i]);
    }
    free(matrix);
}`,
        checklist: [
          'For 2D arrays, free the inner rows first in a loop, then free the top-level pointer array.',
          'Rule of thumb: Count your <code>malloc()</code> calls — each one must have a matching <code>free()</code>.',
          'Use tools like <code>valgrind --leak-check=full ./a.out</code> in lab exams to verify 0 leaked bytes.'
        ]
      }
    }
  },

  'buffer-overflow': {
    lang: 'c',
    filename: 'buffer_overflow.c',
    code: `#include <stdio.h>

void gradeCheck() {
    int passFlag = 0; // Guard variable on stack!
    int scores[5];    // Indexes: 0, 1, 2, 3, 4
    
    // ⚠️ Bug: Off-by-one! i goes from 0 up to 5 (6 elements written)
    for (int i = 0; i <= 5; i++) {
        scores[i] = 100; // scores[5] writes beyond array bounds!
    }
    
    // scores[5] silently overwrites adjacent memory (passFlag)!
    printf("passFlag value: %d (Expected 0!)\\n", passFlag);
}

int main() {
    gradeCheck();
    return 0;
}`,
    analysis: {
      bugType: 'Stack Buffer Overflow / Off-By-One',
      crashLine: 'Line 9',
      memoryHealth: 'Memory Corruption: Stack frame neighbor clobbered',
      stack: [
        { frame: 'gradeCheck()', addr: '0x7ffd987c', varName: 'scores[0..4]', target: '5 integers (20B)', badge: 'Legitimate Array' },
        { frame: 'gradeCheck()', addr: '0x7ffd9890', varName: 'scores[5] (OVERFLOW)', target: 'Clobbers passFlag!', isDanger: true, badge: 'CORRUPTS NEIGHBOR' },
        { frame: 'gradeCheck()', addr: '0x7ffd9894', varName: 'passFlag', target: 'Value morphed to 100', isDanger: true, badge: 'CLOBBERED' }
      ],
      heap: [
        { addr: '0x00501000', size: '0B', status: 'Heap Inactive', val: 'All variables on call stack', isDanger: false }
      ],
      timeline: [
        '<code>passFlag</code> initialized to 0 on stack frame at <code>0x7ffd9894</code>.',
        'Array <code>scores[5]</code> allocated on stack adjacent to <code>passFlag</code>.',
        'Loop iterates for <code>i = 0, 1, 2, 3, 4</code> writing safely into array.',
        '<span class="crash-step">💥 Iteration i = 5: C does not perform runtime array bounds checking!</span>',
        '<code>scores[5]</code> computes memory offset <code>scores + (5 * 4 bytes)</code>, which lands directly on <code>passFlag</code>, overwriting it with 100!'
      ],
      hints: {
        h1: 'In C, if you declare an array of size 5: <code>int scores[5]</code>, what are the valid index numbers you can access?',
        h2: 'Look closely at the loop termination condition on line 8: <code>i <= 5</code>. How many total iterations will this loop run?',
        h3: 'Indices for an array of size 5 are 0 through 4. When <code>i == 5</code>, the loop accesses the 6th element. C doesn\'t throw an IndexError — it writes blindly into whatever variable sits next to it in memory!'
      },
      analogy: {
        title: 'Spilling Coffee into Your Neighbor\'s Cubicle',
        visual: '☕ ➡️ 📦 [Array Full] ➡️ 📄 [Neighbor Desk Ruined] 💥',
        story: 'You have a desk divided into 5 organizers. You buy 6 files and try to force the 6th file into your desk slot. Because there is no barrier wall, the 6th file spills over into your lab partner\'s desk, knocking over their graded paper.',
        moral: 'Stack variables sit side-by-side in memory. Writing one index past your array (`off-by-one`) doesn\'t just fail — it silently corrupts neighboring variables, causing bizarre bugs or security exploits.'
      },
      diff: {
        before: `int scores[5];
// ❌ Off-by-one loop boundary
for (int i = 0; i <= 5; i++) {
    scores[i] = 100;
}`,
        after: `int scores[5];
// ✅ Strict boundary check (i < 5)
for (int i = 0; i < 5; i++) {
    scores[i] = 100;
}`,
        checklist: [
          'Array sizes in C are 0-indexed: valid indices for <code>T arr[N]</code> are strictly <code>0</code> to <code>N-1</code>.',
          'Always use <code>i < N</code> in your for-loop condition, never <code>i <= N</code>.',
          'Compile with warning flags: <code>gcc -Wall -Wextra -Warray-bounds -fsanitize=address main.c</code>.'
        ]
      }
    }
  }
};

// ==========================================================================
// 2. DOM Elements & State
// ==========================================================================
const state = {
  currentPreset: 'linked-list-segfault',
  ollamaEndpoint: 'http://localhost:11434/api/generate',
  selectedModel: 'gemma2:2b',
  activeTab: 'tab-memory'
};

const codeEditor = document.getElementById('codeEditor');
const lineNumbers = document.getElementById('lineNumbers');
const langSelect = document.getElementById('langSelect');
const btnAnalyze = document.getElementById('btnAnalyze');
const analyzeSpinner = document.getElementById('analyzeSpinner');
const analyzeBtnText = document.getElementById('analyzeBtnText');

// Visualizer DOM
const bugTypeTag = document.getElementById('bugTypeTag');
const crashLineTag = document.getElementById('crashLineTag');
const leakStatusTag = document.getElementById('leakStatusTag');
const stackBlockList = document.getElementById('stackBlockList');
const heapBlockList = document.getElementById('heapBlockList');
const timelineList = document.getElementById('timelineList');

// Socratic Hints DOM
const btnRevealHint1 = document.getElementById('btnRevealHint1');
const btnRevealHint2 = document.getElementById('btnRevealHint2');
const btnRevealHint3 = document.getElementById('btnRevealHint3');
const hintBody1 = document.getElementById('hintBody1');
const hintBody2 = document.getElementById('hintBody2');
const hintBody3 = document.getElementById('hintBody3');

// Analogy DOM
const analogyTitle = document.getElementById('analogyTitle');
const analogyVisual = document.getElementById('analogyVisual');
const analogyStory = document.getElementById('analogyStory');
const analogyMoral = document.getElementById('analogyMoral');

// Fix DOM
const diffBeforeCode = document.getElementById('diffBeforeCode');
const diffAfterCode = document.getElementById('diffAfterCode');
const fixChecklist = document.getElementById('fixChecklist');

// Modal DOM
const modelModal = document.getElementById('modelModal');
const btnModelSettings = document.getElementById('btnModelSettings');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnSaveModal = document.getElementById('btnSaveModal');
const btnTestOllama = document.getElementById('btnTestOllama');
const testResult = document.getElementById('testResult');
const ollamaEndpointInput = document.getElementById('ollamaEndpoint');
const modelNameSelect = document.getElementById('modelName');
const aiStatusText = document.getElementById('aiStatusText');

// Other buttons
const btnClearCode = document.getElementById('btnClearCode');
const btnCopyCode = document.getElementById('btnCopyCode');
const btnExportReport = document.getElementById('btnExportReport');

// ==========================================================================
// 3. Initialization
// ==========================================================================
function init() {
  loadPreset('linked-list-segfault');
  setupEventListeners();
  updateLineNumbers();
}

function loadPreset(presetKey) {
  state.currentPreset = presetKey;
  const p = PRESETS[presetKey];
  if (!p) return;

  codeEditor.value = p.code;
  langSelect.value = p.lang;
  updateLineNumbers();
  renderAnalysis(p.analysis);

  // Update preset buttons active state
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === presetKey);
  });
}

function updateLineNumbers() {
  const lines = codeEditor.value.split('\n').length;
  lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join('<br>');
}

// ==========================================================================
// 4. Render Analysis into UI
// ==========================================================================
function renderAnalysis(analysis) {
  // 1. Summary Bar
  bugTypeTag.textContent = analysis.bugType;
  crashLineTag.textContent = analysis.crashLine;
  leakStatusTag.textContent = analysis.memoryHealth;

  // 2. Stack Frames
  stackBlockList.innerHTML = '';
  analysis.stack.forEach(item => {
    const div = document.createElement('div');
    div.className = `mem-block ${item.isDanger ? 'invalid-target' : 'valid-active'}`;
    div.innerHTML = `
      <div class="mem-block-header">
        <span class="mem-addr">${item.addr}</span>
        <span class="mem-size">[${item.frame}]</span>
      </div>
      <div class="mem-val-row">
        <span class="mem-var-name">${item.varName}</span>
        <span class="mem-pointer-target">
          <span class="arrow-sym ${item.isDanger ? 'danger' : ''}">➡️</span>
          <code>${item.target}</code>
          <span class="badge-tag ${item.isDanger ? 'danger' : 'success'}">${item.badge}</span>
        </span>
      </div>
    `;
    stackBlockList.appendChild(div);
  });

  // 3. Heap Blocks
  heapBlockList.innerHTML = '';
  analysis.heap.forEach(item => {
    const div = document.createElement('div');
    div.className = `mem-block ${item.isDanger ? 'invalid-target' : 'valid-active'}`;
    div.innerHTML = `
      <div class="mem-block-header">
        <span class="mem-addr">${item.addr}</span>
        <span class="mem-size">${item.size}</span>
      </div>
      <div class="mem-val-row">
        <span class="mem-var-name">${item.status}</span>
        <span class="mem-pointer-target">
          <code>${item.val}</code>
        </span>
      </div>
    `;
    heapBlockList.appendChild(div);
  });

  // 4. Timeline
  timelineList.innerHTML = '';
  analysis.timeline.forEach(stepHtml => {
    const li = document.createElement('li');
    li.innerHTML = stepHtml;
    timelineList.appendChild(li);
  });

  // 5. Socratic Hints (Reset to hidden initially so student explores)
  hintBody1.innerHTML = `<p>${analysis.hints.h1}</p>`;
  hintBody2.innerHTML = `<p>${analysis.hints.h2}</p>`;
  hintBody3.innerHTML = `<p>${analysis.hints.h3}</p>`;
  
  hintBody1.classList.add('hidden');
  hintBody2.classList.add('hidden');
  hintBody3.classList.add('hidden');
  
  btnRevealHint1.textContent = 'Show Observation';
  btnRevealHint2.textContent = 'Ask Guiding Question';
  btnRevealHint3.textContent = 'Reveal Root Cause';

  // 6. Analogy
  analogyTitle.textContent = analysis.analogy.title;
  analogyVisual.textContent = analysis.analogy.visual;
  analogyStory.textContent = analysis.analogy.story;
  analogyMoral.textContent = analysis.analogy.moral;

  // 7. Fix & Diff
  diffBeforeCode.textContent = analysis.diff.before;
  diffAfterCode.textContent = analysis.diff.after;
  fixChecklist.innerHTML = analysis.diff.checklist.map(item => `<li>${item}</li>`).join('');
}

// ==========================================================================
// 5. AI & Heuristic Inspection Engine
// ==========================================================================
async function runAnalysis() {
  const code = codeEditor.value.trim();
  if (!code) {
    alert('Please enter or paste C/C++ code to analyze!');
    return;
  }

  // Visual loading feedback
  btnAnalyze.disabled = true;
  analyzeSpinner.classList.remove('hidden');
  analyzeBtnText.textContent = 'Simulating Memory Layout...';

  try {
    // If a preset matches the current code, or if user is on offline/heuristic mode
    if (PRESETS[state.currentPreset] && code === PRESETS[state.currentPreset].code) {
      setTimeout(() => {
        renderAnalysis(PRESETS[state.currentPreset].analysis);
        finishAnalysis();
      }, 400);
      return;
    }

    // Attempt local Ollama inference if configured
    if (state.selectedModel !== 'heuristic') {
      const prompt = `You are DebugPal AI, an expert C/C++ Socratic compiler and memory visualizer for 3rd semester CS students.
Analyze this code for segmentation faults, NULL dereferences, dangling pointers, memory leaks, or buffer overflows.

Respond ONLY with valid JSON with this exact schema:
{
  "bugType": "Short title like NULL Pointer Dereference (SIGSEGV)",
  "crashLine": "Line X",
  "memoryHealth": "Short status sentence",
  "stack": [
    {"frame": "function()", "addr": "0x7ffd...", "varName": "var", "target": "0x...", "isDanger": false, "badge": "Active"}
  ],
  "heap": [
    {"addr": "0x0050...", "size": "XB", "status": "Allocated", "val": "data", "isDanger": false}
  ],
  "timeline": ["Step 1 explanation", "Step 2 explanation"],
  "hints": {
    "h1": "Socratic observation question",
    "h2": "Guiding invariant question",
    "h3": "Root cause explanation"
  },
  "analogy": {
    "title": "Metaphor Title",
    "visual": "Emoji sequence",
    "story": "Everyday story",
    "moral": "Why it relates to C pointers"
  },
  "diff": {
    "before": "Vulnerable snippet",
    "after": "Safe patched snippet",
    "checklist": ["Rule 1", "Rule 2"]
  }
}

Code:
${code}`;

      try {
        const response = await fetch(state.ollamaEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: state.selectedModel,
            prompt: prompt,
            stream: false,
            format: 'json'
          })
        });

        if (response.ok) {
          const data = await response.json();
          const parsed = JSON.parse(data.response);
          renderAnalysis(parsed);
          finishAnalysis();
          return;
        }
      } catch (err) {
        console.warn('Ollama unavailable, using resilient fallback heuristic:', err);
      }
    }

    // Heuristic Fallback for custom code
    const fallback = generateHeuristicAnalysis(code);
    renderAnalysis(fallback);
  } catch (err) {
    console.error(err);
  } finally {
    finishAnalysis();
  }
}

function finishAnalysis() {
  btnAnalyze.disabled = false;
  analyzeSpinner.classList.add('hidden');
  analyzeBtnText.textContent = 'Inspect Memory & Debug';
}

function generateHeuristicAnalysis(code) {
  const hasMalloc = code.includes('malloc');
  const hasFree = code.includes('free');
  const hasArrow = code.includes('->');
  const hasArrayLoop = code.includes('for') && (code.includes('<=') || code.includes('['));

  if (hasArrow && !code.includes('!= NULL') && !code.includes('!head')) {
    return PRESETS['linked-list-segfault'].analysis;
  } else if (hasMalloc && !hasFree) {
    return PRESETS['memory-leak'].analysis;
  } else if (hasArrayLoop) {
    return PRESETS['buffer-overflow'].analysis;
  } else {
    return PRESETS['dangling-pointer'].analysis;
  }
}

// ==========================================================================
// 6. Event Listeners & Tab Controls
// ==========================================================================
function setupEventListeners() {
  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      loadPreset(btn.dataset.preset);
    });
  });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.getElementById(tabId).classList.add('active');
      state.activeTab = tabId;
    });
  });

  // Hint accordions
  btnRevealHint1.addEventListener('click', () => {
    const isHidden = hintBody1.classList.toggle('hidden');
    btnRevealHint1.textContent = isHidden ? 'Show Observation' : 'Hide Observation';
  });
  btnRevealHint2.addEventListener('click', () => {
    const isHidden = hintBody2.classList.toggle('hidden');
    btnRevealHint2.textContent = isHidden ? 'Ask Guiding Question' : 'Hide Question';
  });
  btnRevealHint3.addEventListener('click', () => {
    const isHidden = hintBody3.classList.toggle('hidden');
    btnRevealHint3.textContent = isHidden ? 'Reveal Root Cause' : 'Hide Root Cause';
  });

  // Code editor syncing
  codeEditor.addEventListener('input', updateLineNumbers);
  codeEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeEditor.selectionStart;
      const end = codeEditor.selectionEnd;
      codeEditor.value = codeEditor.value.substring(0, start) + '    ' + codeEditor.value.substring(end);
      codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
      updateLineNumbers();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runAnalysis();
    }
  });

  // Analyze button
  btnAnalyze.addEventListener('click', runAnalysis);

  // Editor action buttons
  btnClearCode.addEventListener('click', () => {
    codeEditor.value = '';
    updateLineNumbers();
    codeEditor.focus();
  });

  btnCopyCode.addEventListener('click', () => {
    navigator.clipboard.writeText(codeEditor.value);
    btnCopyCode.textContent = 'Copied!';
    setTimeout(() => { btnCopyCode.textContent = 'Copy'; }, 1500);
  });

  // Modal Settings
  btnModelSettings.addEventListener('click', () => {
    modelModal.classList.remove('hidden');
  });
  btnCloseModal.addEventListener('click', () => {
    modelModal.classList.add('hidden');
  });
  btnSaveModal.addEventListener('click', () => {
    state.ollamaEndpoint = ollamaEndpointInput.value.trim();
    state.selectedModel = modelNameSelect.value;
    aiStatusText.textContent = `Local: ${state.selectedModel}`;
    modelModal.classList.add('hidden');
  });

  btnTestOllama.addEventListener('click', async () => {
    testResult.textContent = 'Testing connection...';
    testResult.style.color = 'var(--accent-amber)';
    try {
      const res = await fetch(ollamaEndpointInput.value.trim().replace('/generate', '/tags'), { method: 'GET' });
      if (res.ok) {
        testResult.textContent = '✅ Connected to Ollama!';
        testResult.style.color = 'var(--accent-emerald)';
      } else {
        testResult.textContent = '⚠️ Ollama replied with error.';
        testResult.style.color = 'var(--accent-rose)';
      }
    } catch {
      testResult.textContent = '❌ Offline (Using Built-in Heuristic)';
      testResult.style.color = 'var(--accent-rose)';
    }
  });

  // Export Report
  btnExportReport.addEventListener('click', exportDebugReport);
}

function exportDebugReport() {
  const p = PRESETS[state.currentPreset];
  const markdown = `# DebugPal AI — Memory & Pointer Inspection Report
**File:** ${p.filename}
**Bug Classification:** ${p.analysis.bugType}
**Crash Point:** ${p.analysis.crashLine}
**Memory Health:** ${p.analysis.memoryHealth}

---

## 🎯 Pointer Execution Timeline
${p.analysis.timeline.map((t, idx) => `${idx + 1}. ${t.replace(/<\/?[^>]+(>|$)/g, '')}`).join('\n')}

---

## 💡 Everyday Analogy: ${p.analysis.analogy.title}
${p.analysis.analogy.story}

> **Core Memory Invariant:** ${p.analysis.analogy.moral}

---

## 🛡️ Safe Code Solution
\`\`\`c
${p.analysis.diff.after}
\`\`\`

### Rule of Thumb Checklist:
${p.analysis.diff.checklist.map(c => `- ${c.replace(/<\/?[^>]+(>|$)/g, '')}`).join('\n')}

---
*Generated with DebugPal AI — Built for 3rd Sem CS Lab Survival.*`;

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `debugpal-report-${state.currentPreset}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// Start app
document.addEventListener('DOMContentLoaded', init);
