# CRE Reactor Design Calculator

Interactive web calculators for plug-flow and packed-bed reactor design, covering
the three cases that dominate an introductory chemical reaction engineering course:
isothermal operation, pressure drop in a packed bed, and adiabatic operation with
equilibrium limitation.

**Live:** https://cre-reactor-calculator.vercel.app

---

## Modules

### 1. Isothermal PFR — reactor volume

Solves the PFR design equation for the volume required to reach a target conversion:

```
V = F_A0 ∫₀ˣ dX / (−r_A)
```

- Rate law: `−r_A = k · C_Aⁿ` with user-selected reaction order `n`
- Concentration corrected for gas-phase mole change: `C_A = C_A0 (1 − X) / (1 + εX)`
- Integral evaluated numerically by Simpson's rule over 100 intervals
- Outputs the required volume plus a V-vs-X curve

**Inputs:** initial concentration, volumetric flow rate, rate constant, expansion
factor ε, reaction order, target conversion.

### 2. Packed-bed reactor — pressure drop

Integrates conversion and pressure simultaneously down the bed using the reduced
pressure-drop form:

```
dp/dW = −(α / 2p) · (1 + εX)
```

where `p = P/P₀` is normalised pressure and `α` is the lumped pressure-drop
parameter. Shows how falling pressure suppresses concentration and therefore rate,
so conversion plateaus with increasing catalyst weight.

**Note:** α is supplied directly as an input rather than computed from bed
properties. Evaluating α from the Ergun equation (voidage, particle diameter,
viscosity, superficial velocity, gas density) is the next planned addition.

### 3. Adiabatic PFR — reversible reaction with equilibrium limit

The most complete module. Marches along the reactor solving the coupled mass and
energy balances for a reversible reaction:

- Energy balance gives temperature as a function of conversion for adiabatic operation
- Rate constant from Arrhenius: `k(T) = k₁ exp[(E/R)(1/T₁ − 1/T)]`
- Equilibrium constant from van 't Hoff: `K(T) = K₂ exp[(ΔH/R)(1/T₂ − 1/T)]`
- Equilibrium conversion `X_e = K/(1 + K)` recomputed at every step
- Conversion is clamped so it can never exceed `X_e` at the local temperature
- If the requested target exceeds the equilibrium conversion at inlet conditions,
  the user is warned and the calculation falls back to `X_e`
- Detects where the net rate collapses and reports the equilibrium-limited volume

Plots conversion against equilibrium conversion, the temperature profile, and the
rate profile along the reactor.

**Inputs:** inlet temperature, heat of reaction, heat capacity, activation energy,
pre-exponential factor and reference temperature, equilibrium constant and its
reference temperature, target conversion.

---

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui · Recharts

The isothermal integration runs as a Next.js server action; the packed-bed and
adiabatic solvers run client-side.

---

## Run locally

```bash
git clone https://github.com/<Atul-Mangal>/cre-calculator.git
cd cre-calculator
npm install
npm run dev
```

Open http://localhost:3000

---

## Limitations

- Single reaction only — no parallel or series reaction networks
- α is an input, not derived from bed geometry (see module 2)
- Ideal gas behaviour assumed throughout
- No axial dispersion or radial gradients; ideal plug flow only
