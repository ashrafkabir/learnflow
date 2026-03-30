# Course Creator Guide

## Overview

LearnFlow allows you to create AI-generated courses and publish them to the marketplace for other learners.

## Publishing Flow

### 1. Generate Your Course

1. Use the Course Builder to generate a course on any topic
2. Review the generated syllabus and lessons
3. Edit any content that needs refinement
4. Add or verify citations when sources are available

### 2. Quality Check

Before publishing, your course should pass these MVP checks (best-effort):

- **Minimum lessons**: At least 5 lessons per course
- **attribution**: Include citations where available; some topics/providers may have limited coverage
- **Readability**: Content should be at an appropriate reading level (heuristic)
- **Near-duplicate reduction**: Avoid highly overlapping lessons (heuristic)
- **Completeness**: All modules should have learning objectives

### 3. Publish

1. Go to **My Courses → [Course] → Publish**
2. Set a price (or free)
3. Add tags and categories
4. Write a course description
5. Submit for review

### 4. Revenue

| Model                       | Creator Share | LearnFlow Share |
| --------------------------- | ------------- | --------------- |
| BYOAI (user brings own key) | 85%           | 15%             |
| Pro (managed keys)          | 80%           | 20%             |

Payouts are **not yet** implemented in this MVP. Stripe payouts/integration are planned for a future release.

## Quality Guidelines

### Content Standards

- **Accuracy**: All claims must be verifiable
- **Attribution**: Add citations where available
- **Depth**: Lessons should be 800-1500 words
- **Structure**: Each lesson needs objectives, examples, and exercises
- **Originality**: Avoid copied content; prefer synthesis and clearly-marked quotes

### What Gets Rejected

- Courses with no source citations
- Content copied verbatim from sources
- Fewer than 5 lessons
- Generic/filler content ("Introduction", "Conclusion" as entire lessons)
- Offensive or misleading content

## Analytics

Creator analytics are planned. In this MVP, dashboards may be mock/limited until backed by stored data.
