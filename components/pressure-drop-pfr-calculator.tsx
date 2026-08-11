"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "@/components/ui/chart"

interface FormData {
  alpha: number // Pressure drop parameter [1/kg]
  epsilon: number // Expansion factor [dimensionless]
  rateConstant: number // k [depends on order]
  reactionOrder: number // n [dimensionless]
  initialConcentration: number // C_A0 [mol/L]
  initialMolarFlow: number // F_A0 [mol/s]
  initialPressure: number // P_0 [atm]
  targetConversion: number // X [0-1]
}

interface Result {
  catalystWeight: number // W [kg]
  finalPressure: number // P [atm]
  chartData: { w: number; x: number; p: number }[]
}

export default function PressureDropPBRCalculator() {
  const [formData, setFormData] = useState<FormData>({
    alpha: 0.01, // 1/kg
    epsilon: -0.5, // dimensionless
    rateConstant: 10, // depends on order
    reactionOrder: 2, // dimensionless
    initialConcentration: 0.2, // mol/L
    initialMolarFlow: 2.5, // mol/s
    initialPressure: 1, // atm
    targetConversion: 0.8, // dimensionless (0-1)
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: Number(value),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate inputs
      if (formData.targetConversion <= 0 || formData.targetConversion >= 1) {
        throw new Error("Target conversion must be between 0 and 1 (exclusive)")
      }

      // Calculate results
      const result = calculatePressureDropPFR(formData)
      setResult(result)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-50 rounded-lg text-center">
        <h3 className="text-lg font-medium mb-2">Reaction Equation</h3>
        <p className="text-xl">nA → Products</p>
        <p className="text-sm text-slate-500 mt-1">Irreversible reaction with stoichiometric coefficient n</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="alpha">Pressure Drop Parameter (α) [1/kg]</Label>
            <Input
              id="alpha"
              name="alpha"
              type="number"
              step="0.0001"
              min="0.0001"
              value={formData.alpha}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="epsilon">Expansion Factor (ε) [dimensionless]</Label>
            <Input
              id="epsilon"
              name="epsilon"
              type="number"
              step="0.01"
              value={formData.epsilon}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rateConstant">Rate Constant (k) [units vary with order]</Label>
            <Input
              id="rateConstant"
              name="rateConstant"
              type="number"
              step="0.0001"
              min="0.0001"
              value={formData.rateConstant}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reactionOrder">Reaction Order (n)</Label>
            <Input
              id="reactionOrder"
              name="reactionOrder"
              type="number"
              step="0.01"
              value={formData.reactionOrder}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialConcentration">
              Initial Concentration (C<sub>A0</sub>) [mol/L]
            </Label>
            <Input
              id="initialConcentration"
              name="initialConcentration"
              type="number"
              step="0.0001"
              min="0.0001"
              value={formData.initialConcentration}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialMolarFlow">
              Initial Molar Flow Rate (F<sub>A0</sub>) [mol/s]
            </Label>
            <Input
              id="initialMolarFlow"
              name="initialMolarFlow"
              type="number"
              step="0.0001"
              min="0.0001"
              value={formData.initialMolarFlow}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialPressure">
              Initial Pressure (P<sub>0</sub>) [atm]
            </Label>
            <Input
              id="initialPressure"
              name="initialPressure"
              type="number"
              step="0.001"
              min="0.001"
              value={formData.initialPressure}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetConversion">Target Conversion (X) [0-1]</Label>
            <Input
              id="targetConversion"
              name="targetConversion"
              type="number"
              step="0.00001"
              min="0.00001"
              max="0.99999"
              value={formData.targetConversion}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            "Calculate Catalyst Weight"
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Catalyst Weight</p>
                <p className="text-2xl font-bold">{result.catalystWeight.toFixed(2)} kg</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Final Pressure</p>
                <p className="text-2xl font-bold">{result.finalPressure.toFixed(2)} atm</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">at conversion X = {formData.targetConversion}</p>
          </div>

          <div className="h-[400px]">
            <h3 className="text-lg font-medium mb-2">Conversion & Pressure vs. Catalyst Weight</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={result.chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="w"
                  label={{
                    value: "Catalyst Weight (kg)",
                    position: "insideBottomRight",
                    offset: -5,
                  }}
                />
                <YAxis
                  label={{
                    value: "Conversion & Normalized Pressure",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "Conversion") return [`${Number(value).toFixed(4)}`, name]
                    if (name === "Normalized Pressure") return [`${Number(value).toFixed(4)}`, name]
                    return [value, name]
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="x"
                  name="Conversion"
                  stroke="#0ea5e9"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="p"
                  name="Normalized Pressure"
                  stroke="#f43f5e"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

// Implementation of the pressure drop PFR calculation
function calculatePressureDropPFR(params: FormData): Result {
  const {
    alpha,
    epsilon,
    rateConstant,
    reactionOrder,
    initialConcentration,
    initialMolarFlow,
    initialPressure,
    targetConversion,
  } = params

  // Maximum catalyst weight to consider
  const W_max = 200 // kg
  const numPoints = 200
  const dW = W_max / numPoints

  // Arrays to store results
  const wValues: number[] = []
  const xValues: number[] = []
  const pValues: number[] = []

  // Initial conditions
  let W = 0
  let X = 0
  let p = 1.0 // Normalized pressure P/P0

  // Euler method to solve the ODEs
  wValues.push(W)
  xValues.push(X)
  pValues.push(p)

  let targetReached = false
  let catalystWeight = 0
  let finalPressure = initialPressure

  for (let i = 1; i <= numPoints; i++) {
    // Calculate derivatives
    const CA = ((initialConcentration * (1 - X)) / (1 + epsilon * X)) * p
    const rA = rateConstant * Math.pow(CA, reactionOrder)

    const dp_dW = -(alpha / (2 * p)) * (1 + epsilon * X)
    const dX_dW = rA / initialMolarFlow

    // Update variables using Euler method
    W += dW
    p += dp_dW * dW
    X += dX_dW * dW

    // Ensure p doesn't go negative
    if (p < 0) p = 0

    // Store values
    wValues.push(W)
    xValues.push(X)
    pValues.push(p)

    // Check if target conversion is reached
    if (!targetReached && X >= targetConversion) {
      targetReached = true
      catalystWeight = W
      finalPressure = p * initialPressure
    }

    // Stop if pressure becomes too low or conversion is complete
    if (p < 0.01 || X >= 0.999) break
  }

  // If target wasn't reached, use interpolation to estimate
  if (!targetReached && xValues.length > 1) {
    // Find closest points
    let closestIndex = 0
    let minDiff = Math.abs(xValues[0] - targetConversion)

    for (let i = 1; i < xValues.length; i++) {
      const diff = Math.abs(xValues[i] - targetConversion)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
      }
    }

    // Use closest point as approximation
    catalystWeight = wValues[closestIndex]
    finalPressure = pValues[closestIndex] * initialPressure
  }

  // Prepare chart data
  const chartData = wValues.map((w, i) => ({
    w,
    x: xValues[i],
    p: pValues[i],
  }))

  return {
    catalystWeight,
    finalPressure,
    chartData,
  }
}
