# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main "LearnFlow Application" [ref=e4]:
    - link "Skip to content" [ref=e5] [cursor=pointer]:
      - /url: "#main-content"
    - generic [ref=e8]:
      - img "LearnFlow" [ref=e10]
      - heading "LearnFlow" [level=1] [ref=e13]
      - paragraph [ref=e14]: Welcome to the LearnFlow app.
      - generic [ref=e15]:
        - button "Log in" [ref=e16]
        - button "Create account" [ref=e17]
      - generic [ref=e18]: "Note: Billing and checkout flows are mock in this MVP. Marketing pages are served by a separate web app in this repository."
  - alert
```