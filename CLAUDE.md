# CLAUDE.md

# Project Overview

This project is a desktop application that semi-automates B2B contact form sales outreach.

The application allows a user to:

1. Input a company name
2. Automatically search Google
3. Open the company's official website
4. Navigate to the contact page
5. Detect the appropriate inquiry category
6. Analyze the contact form structure
7. Auto-fill the form fields
8. Stop before final submission

The user manually verifies and submits the form.

The application does NOT automatically submit forms.

---

# Core Concept

This application combines:

* Browser automation
* AI-based form analysis
* Local desktop application architecture

Traditional rule-based scraping is insufficient because contact forms vary significantly between websites.

The application uses:

* Playwright for browser automation
* OpenAI API for flexible DOM/form interpretation

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

---

## AI Integration

* OpenAI API

Responsibilities:

* Contact page identification
* Form field classification
* Inquiry category selection
* DOM interpretation

---

## Database

* SQLite

Responsibilities:

* Company history
* Form structure cache
* AI analysis cache
* Error logging
* User profile persistence

---

# Development Philosophy

## Important

Do NOT overengineer early.

The project should be built incrementally.

Start with:

1. Browser automation
2. Contact page navigation
3. Form input
4. Persistence
5. AI integration

AI should be introduced AFTER the browser automation foundation is stable.

---

# Initial MVP Scope

## Required Features

* Company search
* Official website access
* Contact page discovery
* Basic form detection
* Automatic input filling
* Stop before submission

---

## Excluded Features (for now)

* Full auto-submit
* CAPTCHA bypass
* Parallel scaling
* Multi-user support
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
 │     └── db/
 ├── types/
 ├── utils/
 └── hooks/
```

---

# Core Modules

## BrowserController

Responsible for:

* Browser launch
* Page navigation
* Google search
* Link traversal

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

---

## FormFiller

Responsible for:

* Input population
* Select handling
* Textarea handling
* Validation handling

---

## AIService

Responsible for:

* Sending DOM/html to LLM
* Parsing AI responses
* Field classification

---

## DatabaseService

Responsible for:

* SQLite access
* Caching
* Logging
* Persistence

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

# AI Usage Policy

AI should only assist where deterministic logic becomes unreliable.

Use AI for:

* Ambiguous forms
* Dynamic structures
* Category classification

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

---

## contact_forms

Stores:

* Form URL
* Parsed structure
* Cached selectors

---

## user_profile

Stores:

* User identity
* Contact details
* Default outreach message

---

# Error Handling

The application must gracefully handle:

* Missing forms
* CAPTCHA
* Navigation failures
* Dynamic rendering failures
* Invalid selectors

---

# Safety Policy

The application MUST NOT:

* Automatically submit forms
* Bypass CAPTCHA
* Ignore explicit anti-sales policies

The user must manually review before submission.

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

* SQLite integration

---

## Phase 7

* OpenAI integration

---

## Phase 8

* Robust exception handling

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

# Future Ideas

Possible future improvements:

* CSV bulk processing
* CRM integration
* CMS-specific optimization
* Analytics dashboard
* AI retry/recovery system
* Contact Form 7 optimization
* HubSpot optimization

---

# Current Priority

Current priority is NOT AI.

Current priority is:

1. Stable Playwright automation
2. Reliable contact page traversal
3. Reliable form extraction

Everything else comes later.
