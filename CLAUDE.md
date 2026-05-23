---
noteId: "52c697e0559911f1af11b173d55118b1"
tags: []

---

# CLAUDE.md

# Project Overview

This project is a desktop application that automates B2B contact form sales outreach.

The long-term goal is to create a semi-autonomous to fully-autonomous browser automation agent capable of processing large lists of companies and handling contact form outreach workflows.

The application should eventually:

1. Search companies automatically
2. Open official websites
3. Detect contact/inquiry pages
4. Analyze arbitrary form structures
5. Fill forms automatically
6. Handle validation and confirmation flows
7. Submit forms when possible
8. Continue queue processing automatically
9. Preserve failed sessions for human recovery

---

# Human Recovery Workflow

If automation fails due to:

* Cloudflare
* CAPTCHA
* unexpected validation
* unknown form structures
* anti-bot systems

the Chromium tab MUST remain open.

The user should be able to manually review and complete the submission.

This is a core system design principle.

---

# Browser Tab Lifecycle

## Successful submission

* Mark company as success
* Save result
* Close tab automatically
* Continue to next company

---

## Failed submission

* Preserve browser tab
* Mark status as manual_review_required
* Save failure information
* Allow user to manually recover submission

---

# Core Concept

This application combines:

* Browser automation
* AI-assisted form understanding
* Local desktop application architecture
* Failure recovery workflows
* Queue-based processing

Traditional rule-based scraping is insufficient because contact forms vary significantly between websites.

The application uses:

* Playwright for browser automation
* LLMs for DOM/form interpretation
* SQLite for persistence and learning

---

# Long-Term Vision

The system should eventually become:

* a browser automation agent
* a self-improving form automation engine
* a queue-driven outreach system

The application should learn from failures over time.

---

# Tech Stack

## Frontend

* React
* TypeScript
* TailwindCSS

---

## Desktop Framework

* Tauri

Reason:

* Lightweight
* Fast
* Native desktop integration
* Good compatibility with Playwright

---

## Browser Automation

* Playwright

Responsibilities:

* Google search
* Website navigation
* Contact page traversal
* Form interaction
* Input filling
* Confirmation flow handling
* Submission handling

---

## AI Integration

The system should support multiple LLM providers.

Initial provider:

* OpenAI API

Future providers:

* Ollama
* Local LLMs
* Claude API
* Gemini API

---

## LLM Usage Philosophy

LLM usage should be minimized whenever possible.

Priority order:

1. Deterministic logic
2. Cached selectors
3. Known form patterns
4. Local LLM
5. External API LLM

The system should avoid unnecessary API costs.

---

## Database

* SQLite

Responsibilities:

* Company history
* Form structure cache
* AI analysis cache
* Error logging
* User profile persistence
* Failure tracking
* Status management
* Learned selectors

---

# Development Philosophy

## Important

Do NOT overengineer early.

The project should evolve incrementally.

Priority order:

1. Stable browser automation
2. Reliable status management
3. Reliable form traversal
4. Failure handling
5. Persistence
6. AI integration
7. Autonomous recovery

---

# Queue-Based Architecture

The system should process companies as a queue.

Example flow:

```text
Pending
→ Processing
→ Success / Failed / Manual Review
```

The queue should continue even if some companies fail.

Failures must NOT stop the entire system.

---

# Status System

Every company MUST have a status.

Example statuses:

```text
success
no_contact_page
form_parse_failed
captcha_detected
cloudflare_blocked
manual_review_required
submit_failed
validation_failed
processing
pending
```

---

# Initial MVP Scope

## Required Features

* Company search
* Official website access
* Contact page discovery
* Basic form detection
* Automatic form filling
* Manual submission support
* Failure preservation

---

## Excluded Features (initially)

* CAPTCHA bypass
* Browser fingerprint spoofing
* Distributed automation
* Parallel multi-browser scaling
* Cloud sync

---

# Directory Structure

Recommended structure:

```text
src/
 ├── components/
 ├── pages/
 ├── services/
 │     ├── playwright/
 │     ├── ai/
 │     ├── db/
 │     └── queue/
 ├── types/
 ├── utils/
 ├── hooks/
 └── store/
```

---

# Core Modules

## BrowserController

Responsible for:

* Browser launch
* Page navigation
* Google search
* Tab management
* Queue traversal

---

## ContactPageFinder

Responsible for:

* Finding inquiry/contact pages
* Keyword matching
* Link analysis

---

## FormAnalyzer

Responsible for:

* Extracting forms
* Parsing inputs
* Understanding field meaning
* Preparing mappings
* Detecting unknown structures

---

## FormFiller

Responsible for:

* Input population
* Select handling
* Textarea handling
* Validation handling
* Confirmation flow handling

---

## QueueManager

Responsible for:

* Company queue processing
* Retry management
* Failure isolation
* Status updates

---

## AIService

Responsible for:

* Sending DOM/html to LLM
* Parsing AI responses
* Field classification
* Validation interpretation
* Unknown form analysis

---

## DatabaseService

Responsible for:

* SQLite access
* Caching
* Logging
* Persistence
* Learned selector storage

---

# Browser Automation Rules

## Always use Playwright

Do not use Selenium unless absolutely necessary.

---

## Browser Mode

During development:

* headless: false

Production:

* configurable

---

## Avoid aggressive automation

Important:

* Respect robots/policies
* Avoid spam-like behavior
* Add delays when necessary
* Avoid suspicious request frequency

---

# Contact Page Discovery Strategy

Initial implementation should use rule-based matching.

Keywords:

* お問い合わせ
* Contact
* Inquiry
* ご相談
* 資料請求

Later:

* AI-assisted classification

---

# Form Detection Strategy

Initial implementation:

* Rule-based field mapping

Examples:

* name
* email
* tel
* message

Later:

* AI-based semantic classification

---

# Adaptive Form Handling

The system should eventually support:

* unknown forms
* arbitrary field names
* multi-step forms
* dynamic validation
* confirmation pages
* checkbox agreements
* privacy policy acceptance

---

# Inquiry Message Strategy

The application should support multiple inquiry templates.

Example:

* 50 chars
* 100 chars
* 300 chars
* 500 chars

The system should automatically choose the best message based on:

* maxlength
* validation messages
* textarea constraints

---

# Unknown Form Learning System

When parsing fails:

1. Save HTML
2. Save screenshot
3. Save DOM structure
4. Save validation messages
5. Save failed selectors

The user should later review the failure and create new parsing logic.

This is one of the most important future systems.

---

# AI Usage Policy

AI should only assist where deterministic logic becomes unreliable.

Use AI for:

* Ambiguous forms
* Dynamic structures
* Category classification
* Validation interpretation
* Unknown form analysis

Do NOT use AI for:

* Simple navigation
* Fixed selectors
* Obvious mappings

---

# SQLite Tables

## companies

Stores:

* Company names
* Website URLs
* Processing status
* Retry count
* Failure reason

---

## contact_forms

Stores:

* Form URL
* Parsed structure
* Cached selectors
* Validation patterns

---

## failed_forms

Stores:

* Failed HTML
* Screenshots
* DOM snapshots
* Validation messages

---

## user_profile

Stores:

* User identity
* Contact details
* Outreach templates

---

# Error Handling

The application must gracefully handle:

* Missing forms
* CAPTCHA
* Cloudflare
* Navigation failures
* Dynamic rendering failures
* Invalid selectors
* Validation loops

---

# Safety Policy

The application MUST NOT:

* Bypass CAPTCHA
* Ignore explicit anti-sales policies
* Perform malicious automation

---

# Recommended Development Order

## Phase 1

* Tauri setup
* React UI
* Playwright launch

---

## Phase 2

* Google search automation
* Website navigation

---

## Phase 3

* Contact page detection

---

## Phase 4

* Form extraction

---

## Phase 5

* Auto-fill functionality

---

## Phase 6

* Queue/status system

---

## Phase 7

* SQLite integration

---

## Phase 8

* Failure preservation system

---

## Phase 9

* LLM integration

---

## Phase 10

* Unknown form learning system

---

# Coding Standards

## TypeScript

* Strict mode enabled
* Avoid any
* Use interfaces/types
* Prefer composition over inheritance

---

## React

* Functional components only
* Hooks-based architecture

---

## File Naming

* PascalCase for components
* camelCase for utilities
* kebab-case for folders if needed

---

# Current Priority

Current priority is NOT advanced AI autonomy.

Current priority is:

1. Stable Playwright automation
2. Reliable contact page traversal
3. Reliable form extraction
4. Queue management
5. Failure preservation
6. Status management

Everything else comes later.
