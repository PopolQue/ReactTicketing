# Theming Reference

ReactTicket uses CSS Custom Properties (Variables) to allow seamless integration into your existing design system.

## Global Variables

Override these variables in your root CSS to brand the ticketing components:

```css
:root {
  /* Brand Colors */
  --rt-primary-color: #ff3b30;
  --rt-primary-hover: #ff2d20;
  
  /* Backgrounds */
  --rt-bg-color: #ffffff;
  --rt-card-bg: #f9f9f9;
  
  /* Typography */
  --rt-font-family: 'Inter', system-ui, sans-serif;
  --rt-text-primary: #333333;
  --rt-text-secondary: #666666;
  
  /* Border Radius */
  --rt-border-radius: 8px;
  --rt-border-radius-lg: 12px;
}
```

By keeping class names static and relying on variables, ReactTicket guarantees your themes won't break across minor version updates.
