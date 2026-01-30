# Product Specification: Intelligent DSA Sheet Ingestion & Orchestration

**Date:** 2026-01-30
**Status:** Proposal
**Context:** CodeRev AI - Learning Workflow Enhancement

## 1. Problem Definition: The Static Sheet Fallacy

### The Current Landscape
The standard operating procedure for Data Structures and Algorithms (DSA) preparation currently relies on **static artifacts**—typically PDF files, Excel spreadsheets, or static web lists (e.g., Striver's SDE Sheet, Blind 75).

### The Core Problem
These static lists function as **archives of content**, not **drivers of competence**. They suffer from fundamental engineering and pedagogical flaws:
*   **State Ignorance:** A static PDF cannot track state. It is binary (Done/Not Done) and fails to capture the *quality* of the solution (Time Complexity, Retry Count, Hint Usage).
*   **Context Switching Overhead:** The user workflow is fragmented across multiple windows: the Problem List (Spreadsheet), the Learning Resource (YouTube/Tutorial), and the Execution Environment (LeetCode/IDE). This friction disrupts deep work.
*   **Lack of Readiness Signals:** Completing 50 problems on a list provides no statistical confidence of interview readiness. It is a vanity metric that ignores retention decay and pattern mastery.

## 2. Learning Gap Analysis

Students relying on static lists face specific, measurable deficits in their learning lifecycle:

| Learning Vector | Existing Static Gap | Consequence |
| :--- | :--- | :--- |
| **Pacing** | Linear execution without tempo regulation. | Burnout from "grinding" hard problems or false confidence from easy streaks. |
| **Feedback Loop** | Decoupled from execution. Feedback is binary (Pass/Fail) rather than qualitative. | Students "solve" problems with sub-optimal brute force approaches and move on, reinforcing bad habits. |
| **Revision Hygiene** | Manual or non-existent. No enforcement of Spaced Repetition (SRS). | "Leaky bucket" syndrome: Concepts learned in Month 1 are forgotten by Month 3 due to lack of prompted review. |
| **Readiness** | Absent. No data-driven estimation of specialized skill strength. | Candidates enter interviews blind to their localized weaknesses (e.g., strong in Arrays, weak in Recursion). |

## 3. Proposed Solution: The Adaptive Ingestion & Orchestration Engine

We propose a feature set designed to ingest static content and transmute it into a **dynamic, trackable learning protocol**. This system prioritizes *orchestration*—managing the user's workflow—over simple content display.

### 3.1 Module A: Universal Ingestion Pipeline
A software service that parses unstructured or semi-structured external lists into a standardized internal graph format.
*   **Input Vectors:**
    *   **URL Parsing:** Scrapers for popular platforms (LeetCode Lists, GFG Collections).
    *   **File Parsing:** OCR/Text Extraction for PDFs and CSV ingestion for spreadsheets.
    *   **Raw Text:** NLP-based parsing for pasted text content.
*   **Normalization Logic:**
    *   The system extracts Problem Titles and maps them to a **Canonical Problem ID** (CPID) within the CodeRev database (or resolves them against external APIs like LeetCode).
    *   *Outcome:* A "Sheet" becomes a "Workflow Object" containing verified metadata (Difficulty, Category, Expected Complexity).

### 3.2 Module B: Learning Orchestration Layer
Instead of presenting a flat list, the system generates a **Dependency Graph**.
*   **Next Best Action (NBA):** The system recommends the optimal next specific problem based on user state, rather than list order.
    *   *Logic:* If User fails "Fibonacci (DP)", the system blocks "Climbing Stairs (DP)" and injects a "Recursion Review" module.
*   **Integrated Workflow:** The list is not a separate tab; it is the **navigator** for the IDE. Clicking a node instantly configures the IDE workspace with the appropriate context/boilerplate.

### 3.3 Module C: Progress Intelligence & Metrics
We shift tracking from "Count" to "Competency".
*   **Skill Tree Visualization:** A visual graph showing mastery levels per topic (e.g., "Dynamic Programming: Level 4/10").
*   **Predictive Readiness Score:** A composite metric calculated from:
    *   *Consistency:* Regularity of practice.
    *   *Efficiency:* Runtime/Memory percentiles.
    *   *Independence:* Inverse correlation with hint usage.
*   **Spaced Repetition Triggers:** The system automatically re-queues previously solved problems at optimal intervals (1 day, 3 days, 1 week) to verify retention.

## 4. System Thinking & Outcomes

This solution transforms CodeRev AI from a **Text Editor** into a **Coach**.
*   **Input:** "Here is a PDF of questions I need to do."
*   **Process:** Identification -> Structuring -> Graph Mapping -> Paced Scheduling.
*   **Output:** "You are 82% ready for your interview. Your weakness is Graph Traversal. Fix it here."

**Engineering Note:** This does not require content ownership. The platform orchestrates the definitions and pointers, while the heavy lifting of problem statements and test cases can remain distributed or lazily fetched, keeping the platform lightweight and compliant.
