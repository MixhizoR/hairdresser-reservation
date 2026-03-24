# Design System Strategy: The Serene Professional

## 1. Overview & Creative North Star
In an industry defined by precision and personal care, the interface must mirror the experience of a high-end salon: calm, orderly, and meticulously curated. Our Creative North Star is **"The Digital Sanctuary."**

This design system moves away from the aggressive, high-contrast layouts typical of booking engines. Instead, it utilizes a "Soft-Focus" approach. By breaking the rigid "box-and-line" grid in favor of overlapping tonal surfaces and intentional white space, we create a sense of breathing room. The interface doesn't just manage appointments; it begins the relaxation process for the client and provides a focused, clutter-free environment for the administrator.

---

## 2. Colors & Surface Architecture

The palette is rooted in a sophisticated range of cool blues and tectonic grays, designed to reduce cognitive load.

### The "No-Line" Rule
To maintain a premium, editorial feel, **1px solid borders are strictly prohibited for sectioning.** Structural separation is achieved through:
- **Tonal Shifts:** Placing a `surface_container_low` card against a `surface` background.
- **Negative Space:** Using the Spacing Scale (specifically tokens `8` to `12`) to define content groups.

### Surface Hierarchy & Nesting
We treat the UI as a series of layered, physical materials. 
*   **Base Layer:** `surface` (#f7f9fb) — The canvas.
*   **Secondary Sections:** `surface_container` (#eaeff2) — Grouped content areas.
*   **Floating Elements:** `surface_container_lowest` (#ffffff) — Actionable cards or active modals.

### The "Glass & Gradient" Rule
For high-interaction areas like the primary booking flow or administrative notifications, use **Glassmorphism**. Apply a semi-transparent `primary_container` with a `backdrop-blur` of 12px. For main CTAs, use a subtle linear gradient from `primary` (#0060ad) to `primary_dim` (#005498) at a 135° angle to add "soul" and depth.

---

## 3. Typography: The Editorial Voice

We use **Manrope** across all scales to maintain a modern, geometric clarity that feels humanist rather than mechanical.

*   **Display & Headlines:** Use `display-md` and `headline-lg` with tight letter-spacing (-0.02em) for service categories. This conveys authority and a premium brand voice.
*   **Titles:** `title-lg` and `title-md` are reserved for service names and professional titles (e.g., "Master Barber").
*   **Body:** `body-md` is the workhorse for descriptions. Ensure a line height of 1.5 for maximum legibility.
*   **Labels:** `label-sm` in `on_surface_variant` (#596064) provides metadata without distracting from the primary narrative.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are heavy; we prefer **Ambient Lift**.

*   **The Layering Principle:** Instead of shadows, nest a `surface_container_lowest` card inside a `surface_container_high` wrapper. This creates a natural "stepping up" effect.
*   **Ambient Shadows:** For floating elements (Modals/Popovers), use an extra-diffused shadow: `0 20px 40px rgba(0, 96, 173, 0.06)`. The tinting with the `primary` color ensures the shadow feels like a natural part of the atmosphere.
*   **The Ghost Border:** If a boundary is required for accessibility (e.g., input fields), use `outline_variant` (#acb3b7) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Primary Booking Buttons
*   **Style:** `primary` background with `on_primary` text.
*   **Corner Radius:** `xl` (0.75rem) to feel approachable.
*   **Interaction:** On hover, transition to `primary_fixed_dim`.

### Service Cards
*   **Anatomy:** `surface_container_lowest` background, no border, `xl` rounding.
*   **Layout:** Use asymmetrical padding (more at the bottom than the top) to create a custom, editorial look.
*   **Constraint:** Never use a divider line between service items; use a `2` (0.5rem) vertical gap.

### Administrative Dashboard Elements
*   **Stats Tiles:** Use `secondary_container` backgrounds with `on_secondary_container` text for a low-intensity, professional information density.
*   **Chips (Status):** Use `tertiary_container` for "Confirmed" and `error_container` for "Canceled," but keep text in their respective `on_` tokens for contrast.

### Input Fields
*   **Style:** `surface_container_low` background with a `Ghost Border`.
*   **Focus State:** Shift background to `surface_container_lowest` and apply a 2px `surface_tint` glow.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use `20` (5rem) spacing for top-level section margins to create an "expensive" sense of space.
*   **Do** utilize overlapping elements (e.g., a stylist's photo overlapping the edge of a card) to break the "template" feel.
*   **Do** use `tertiary` (#5f5a84) for "soft actions" like "View Gallery" to distinguish from "Book Now."

### Don't:
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#2c3437) to keep the tone soft.
*   **Don't** use the `DEFAULT` (0.25rem) rounding for large components; it feels dated. Use `xl` or `lg` for a modern, fluid aesthetic.
*   **Don't** use dividers in lists. Trust the `surface_container` shifts to guide the eye.