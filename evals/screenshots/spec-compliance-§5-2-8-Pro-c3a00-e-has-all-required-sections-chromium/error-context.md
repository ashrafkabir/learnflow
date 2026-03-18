# Page snapshot

```yaml
- main "LearnFlow Application" [ref=e4]:
  - link "Skip to content" [ref=e5] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e8]:
    - generic [ref=e9]:
      - generic [ref=e11]: 🧠
      - heading "Welcome back" [level=1] [ref=e12]
      - paragraph [ref=e13]: Sign in to LearnFlow
    - generic [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]: Email
        - textbox "you@example.com" [ref=e17]
      - generic [ref=e18]:
        - generic [ref=e19]: Password
        - generic [ref=e20]:
          - textbox "••••••••" [ref=e21]
          - button "Show password" [ref=e22]: 👁️
      - button "Sign In" [ref=e23]
    - paragraph [ref=e24]:
      - text: Don't have an account?
      - link "Sign up" [ref=e25] [cursor=pointer]:
        - /url: /register
    - paragraph [ref=e26]:
      - link "Skip (dev mode) →" [ref=e27] [cursor=pointer]:
        - /url: /dashboard
```