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
  initialConcentration: number // C_A0 (mol/m³)
  initialFlowRate: number // v0 (m³/s)
  rateConstant: number // k
  epsilon: number // ε
  reactionOrder: number // n
  targetConversion: number // X
}

interface Result {
  finalVolume: number
  chartData: { x: number; volume: number }[]
}

export default function IsothermalPFRCalculator() {
  const [formData, setFormData] = useState<FormData>({
    initialConcentration: 66, // mol/m³
    initialFlowRate: 2.924, // m³/s
    rateConstant: 3.07, // units depend on reaction order
    epsilon: 1, // dimensionless
    reactionOrder: 1, // dimensionless
    targetConversion: 0.7, // dimensionless (0-1)
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
      const result = calculateIsothermalPFR(formData)
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
            <Label htmlFor="initialConcentration">
              Initial Concentration (C<sub>A0</sub>) [mol/m³]
            </Label>
            <Input
              id="initialConcentration"
              name="initialConcentration"
              type="number"
              step="0.001"
              min="0.001"
              value={formData.initialConcentration}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialFlowRate">
              Initial Volumetric Flow Rate (v<sub>0</sub>) [m³/s]
            </Label>
            <Input
              id="initialFlowRate"
              name="initialFlowRate"
              type="number"
              step="0.001"
              min="0.001"
              value={formData.initialFlowRate}
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
              step="0.001"
              min="0.001"
              value={formData.rateConstant}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="epsilon">Epsilon (ε) for Gas Expansion</Label>
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
            <Label htmlFor="targetConversion">Target Conversion (X) [0-1]</Label>
            <Input
              id="targetConversion"
              name="targetConversion"
              type="number"
              step="0.0001"
              min="0.0001"
              max="0.9999"
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
            "Calculate Reactor Volume"
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
            <p className="text-2xl font-bold">Reactor Volume: {result.finalVolume.toFixed(4)} m³</p>
            <p className="text-sm text-slate-500 mt-1">at conversion X = {formData.targetConversion}</p>
          </div>

          <div className="h-[400px]">
            <h3 className="text-lg font-medium mb-2">Reactor Volume vs. Conversion</h3>
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
                  dataKey="x"
                  label={{
                    value: "Conversion (X)",
                    position: "insideBottomRight",
                    offset: -5,
                  }}
                />
                <YAxis
                  label={{
                    value: "Reactor Volume (m³)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(4)} m³`, "Volume"]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="volume"
                  name="Reactor Volume"
                  stroke="#0ea5e9"
                  activeDot={{ r: 8 }}
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

// Implementation of the isothermal PFR calculation
function calculateIsothermalPFR(params: FormData): Result {
  const { initialConcentration, initialFlowRate, rateConstant, epsilon, reactionOrder, targetConversion } = params

  // Calculate initial molar flow rate
  const FA0 = initialFlowRate * initialConcentration

  // Generate data points for the graph (0 to target conversion)
  const numPoints = 100
  const chartData = []

  // Calculate reactor volume for a range of conversions
  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * targetConversion
    if (x === 0) {
      chartData.push({ x, volume: 0 })
      continue
    }

    const volume = reactorVolumeNOrder(FA0, rateConstant, initialConcentration, epsilon, reactionOrder, x)
    chartData.push({ x, volume })
  }

  // Calculate the volume at the target conversion
  const finalVolume = reactorVolumeNOrder(
    FA0,
    rateConstant,
    initialConcentration,
    epsilon,
    reactionOrder,
    targetConversion,
  )

  return {
    finalVolume,
    chartData,
  }
}

// Function to calculate reactor volume for nth order reaction
function reactorVolumeNOrder(FA0: number, k: number, CA0: number, epsilon: number, n: number, X: number): number {
  // Numerical integration using Simpson's rule
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

    // Calculate integrand: (1 + epsilon * x)^n / (1 - x)^n
    let integrand = 0
    if (x < 1) {
      // Avoid division by zero
      const numerator = Math.pow(1 + epsilon * x, n)
      const denominator = Math.pow(1 - x, n)
      integrand = numerator / denominator
    } else {
      integrand = Number.POSITIVE_INFINITY
    }

    // Add weighted contribution to the integral
    sum += weight * integrand
  }

  // Complete Simpson's rule formula
  const integral = (dx / 3) * sum

  // Volume = (FA0 / (k * CA0^n)) * integral
  return (FA0 / (k * Math.pow(CA0, n))) * integral
}
