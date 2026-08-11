"use server"

interface PFRParams {
  initialConcentration: number // C_A0 (mol/L)
  molarFlowRate: number // F_A0 (mol/min)
  reactionOrder: number // n
  epsilon: number // ε
  rateConstant: number // k
  temperature: number // T (K)
  targetConversion: number // X
}

export async function calculatePFR(params: PFRParams) {
  const { initialConcentration, molarFlowRate, reactionOrder, epsilon, rateConstant, targetConversion } = params

  // Generate data points for the graph (0 to target conversion)
  const numPoints = 50
  const chartData = []

  // Calculate reactor volume for a range of conversions
  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * targetConversion
    const volume = calculateVolumeAtConversion(
      initialConcentration,
      molarFlowRate,
      reactionOrder,
      epsilon,
      rateConstant,
      x,
    )
    chartData.push({ x, volume })
  }

  // Calculate the volume at the target conversion
  const volume = calculateVolumeAtConversion(
    initialConcentration,
    molarFlowRate,
    reactionOrder,
    epsilon,
    rateConstant,
    targetConversion,
  )

  return {
    volume,
    chartData,
  }
}

function calculateVolumeAtConversion(
  C_A0: number,
  F_A0: number,
  n: number,
  epsilon: number,
  k: number,
  X: number,
): number {
  // Numerical integration using Simpson's rule
  // For the integral of dX/(-r_A) from 0 to X

  if (X === 0) return 0

  const numIntervals = 100 // Number of intervals for integration
  const dx = X / numIntervals

  let sum = 0

  for (let i = 0; i <= numIntervals; i++) {
    const x = i * dx
    let weight = 1

    if (i === 0 || i === numIntervals) {
      weight = 1
    } else if (i % 2 === 0) {
      weight = 2
    } else {
      weight = 4
    }

    // Calculate reaction rate at this conversion
    const rate = reactionRate(C_A0, n, epsilon, k, x)

    // Add weighted contribution to the integral
    if (rate !== 0) {
      sum += weight * (1 / rate)
    }
  }

  // Complete Simpson's rule formula
  const integral = (dx / 3) * sum

  // Volume = F_A0 * integral
  return F_A0 * integral
}

function reactionRate(C_A0: number, n: number, epsilon: number, k: number, X: number): number {
  // Calculate C_A at conversion X
  const C_A = (C_A0 * (1 - X)) / (1 + epsilon * X)

  // Calculate reaction rate: r_A = k * C_A^n
  const rate = k * Math.pow(C_A, n)

  return rate
}
