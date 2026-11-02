# Macro-Constrained Menu Generator

A client-side React + TypeScript web application for building and optimizing daily meal plans against personalized macronutrient targets (`g/kg` body weight).

## Features

- **Dynamic Macro Targets**: Calculates daily Calorie, Protein, Carbohydrate, and Fat targets from body weight and per-day `g/kg` ratios (`Sun–Thu`, `Friday`, `Saturday`).
- **Coordinate-Descent Menu Solver**: Automatically adjusts unlocked food quantities to match target macros across `Balanced`, `Protein Priority`, and `Calorie Priority` focus modes.
- **Multiple User Profiles**: Create, rename, switch, and delete local user profiles with isolated weights, targets, and meal plans stored in `localStorage`.
- **Custom Foods & Carb Swaps**: Add custom foods shared across profiles and swap White Rice with equivalent carbohydrate alternatives.

## Setup & Commands

Requires Node.js (v22+ recommended) and `npm`:

```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# Run type-check and production build
npm run build

# Run ESLint static analysis
npm run lint

# Run unit tests
npm test
```
