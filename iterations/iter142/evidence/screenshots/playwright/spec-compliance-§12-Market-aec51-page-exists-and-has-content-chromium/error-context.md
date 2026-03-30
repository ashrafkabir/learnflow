# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main "LearnFlow Application" [ref=e4]:
    - link "Skip to content" [ref=e5] [cursor=pointer]:
      - /url: "#main-content"
    - generic [ref=e9]:
      - generic [ref=e10]:
        - img "LearnFlow" [ref=e12]
        - heading "Welcome back" [level=1] [ref=e15]
        - paragraph [ref=e16]: Sign in to LearnFlow
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]: Email
          - textbox "you@example.com" [ref=e20]
        - generic [ref=e21]:
          - generic [ref=e22]: Password
          - generic [ref=e23]:
            - textbox "••••••••" [ref=e24]
            - button "Show password" [ref=e25]:
              - img [ref=e26]
        - button "Forgot password?" [ref=e30]
        - button "Sign In" [ref=e31]
        - generic [ref=e33]: Social sign-in (Google/GitHub/Apple) is not available in this MVP. Use email + password.
      - paragraph [ref=e34]:
        - text: Don't have an account?
        - link "Sign up" [ref=e35] [cursor=pointer]:
          - /url: /register
      - paragraph [ref=e36]:
        - link "Skip (dev mode) →" [ref=e37] [cursor=pointer]:
          - /url: /dashboard
  - alert
```