## 2024-05-23 - Accessibility Testing Patterns
**Learning:** Tests that rely on DOM structure (like `closest('button')`) are fragile and hide accessibility issues.
**Action:** Always refactor tests to use `getByRole` with accessible names when adding ARIA labels. This verifies the accessibility fix works as intended.
