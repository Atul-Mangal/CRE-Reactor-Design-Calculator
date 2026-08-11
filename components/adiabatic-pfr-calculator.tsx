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
  preExponentialFactor: number // k1 [1/s]
  activationEnergy: number // E [J/mol]
  gasConstant: number // R [J/mol.K]
  heatOfReaction: number // ΔH_rxn [J/mol]
  heatCapacity: number // CpA [J/mol.K]
  initialConcentration: number // CA0 [mol/L]
  initialMolarFlow: number // FA0 [mol/s]
  initialTemperature: number // T0 [K]
  referenceTemperature1: number // T1 [K] for k
  referenceTemperature2: number // T2 [K] for Kc
  equilibriumConstant: number // Kc2 at T2
  targetConversion: number // X [0-1]
  maxVolume: number // Vmax [L]
}

interface Result {
  targetVolume: number // V [L] at target conversion
  maxConversion: number // X_max
  equilibriumVolume: number // V [L] at equilibrium
  chartData: {
    volume: number
    conversion: number
    temperature: number
    rate: number
    equilibriumConversion: number
  }[]
}

export default function AdiabaticPFRCalculator() {
  const [formData, setFormData] = useState<FormData>({
    preExponentialFactor: 0.00864, // 1/s
    activationEnergy: 65700, // J/mol
    gasConstant: 8.314, // J/mol.K
    heatOfReaction: -6900, // J/mol (negative for exothermic)
    heatCapacity: 141, // J/mol.K
    initialConcentration: 9.3, // mol/L
    initialMolarFlow: 40.75, // mol/s
    initialTemperature: 330, // K
    referenceTemperature1: 360, // K
    referenceTemperature2: 333, // K
    equilibriumConstant: 3.03, // dimensionless
    targetConversion: 0.7, // dimensionless (0-1)
    maxVolume: 5000, // L
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [activeTab, setActiveTab] = useState<"conversion" | "temperature" | "rate">("conversion")

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

      // Calculate initial equilibrium conversion to check if target is feasible
      const initialTemp = formData.initialTemperature
      const initialKc =
        formData.equilibriumConstant *
        Math.exp(
          (formData.heatOfReaction / formData.gasConstant) * (1 / formData.referenceTemperature2 - 1 / initialTemp),
        )
      const initialXeq = initialKc / (1 + initialKc)

      // Check if target conversion exceeds equilibrium conversion
      if (formData.targetConversion > initialXeq) {
        // Show warning and use equilibrium conversion instead
        setError(
          `Warning: Target conversion (${formData.targetConversion.toFixed(4)}) exceeds maximum possible conversion at initial conditions. Calculations will use the equilibrium conversion.`,
        )

        // Calculate results with equilibrium conversion
        const modifiedParams = {
          ...formData,
          targetConversion: initialXeq,
        }
        const result = calculateAdiabaticPFR(modifiedParams)
        setResult(result)
      } else {
        // Calculate results with target conversion
        const result = calculateAdiabaticPFR(formData)
        setResult(result)
      }
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
        <p className="text-xl">A ⇌ B</p>
        <p className="text-sm text-slate-500 mt-1">Reversible reaction with equilibrium limitation</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preExponentialFactor">
              Pre-exponential Factor (k<sub>1</sub>) [1/s]
            </Label>
            <Input
              id="preExponentialFactor"
              name="preExponentialFactor"
              type="number"
              step="any"
              min="0"
              value={formData.preExponentialFactor}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activationEnergy">Activation Energy (E) [J/mol]</Label>
            <Input
              id="activationEnergy"
              name="activationEnergy"
              type="number"
              step="0.0001"
              min="0"
              value={formData.activationEnergy}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gasConstant">Gas Constant (R) [J/mol·K]</Label>
            <Input
              id="gasConstant"
              name="gasConstant"
              type="number"
              step="0.001"
              min="0.001"
              value={formData.gasConstant}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heatOfReaction">
              Heat of Reaction (ΔH<sub>rxn</sub>) [J/mol]
            </Label>
            <Input
              id="heatOfReaction"
              name="heatOfReaction"
              type="number"
              step="0.0001"
              value={formData.heatOfReaction}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-muted-foreground">Negative for exothermic reactions</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="heatCapacity">
              Heat Capacity (C<sub>pA</sub>) [J/mol·K]
            </Label>
            <Input
              id="heatCapacity"
              name="heatCapacity"
              type="number"
              step="0.0001"
              min="0"
              value={formData.heatCapacity}
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
            <Label htmlFor="initialTemperature">
              Initial Temperature (T<sub>0</sub>) [K]
            </Label>
            <Input
              id="initialTemperature"
              name="initialTemperature"
              type="number"
              step="0.001"
              min="273"
              value={formData.initialTemperature}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceTemperature1">
              Reference Temperature for k (T<sub>1</sub>) [K]
            </Label>
            <Input
              id="referenceTemperature1"
              name="referenceTemperature1"
              type="number"
              step="0.001"
              min="273"
              value={formData.referenceTemperature1}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceTemperature2">
              Reference Temperature for K<sub>c</sub> (T<sub>2</sub>) [K]
            </Label>
            <Input
              id="referenceTemperature2"
              name="referenceTemperature2"
              type="number"
              step="0.001"
              min="273"
              value={formData.referenceTemperature2}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equilibriumConstant">
              Equilibrium Constant at T<sub>2</sub> (K<sub>c2</sub>)
            </Label>
            <Input
              id="equilibriumConstant"
              name="equilibriumConstant"
              type="number"
              step="0.0001"
              min="0.0001"
              value={formData.equilibriumConstant}
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

          <div className="space-y-2">
            <Label htmlFor="maxVolume">
              Maximum Volume (V<sub>max</sub>) [L]
            </Label>
            <Input
              id="maxVolume"
              name="maxVolume"
              type="number"
              step="0.001"
              min="100"
              value={formData.maxVolume}
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
            "Calculate Reactor Performance"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-500">Reactor Volume at Target Conversion</p>
                <p className="text-xl font-bold">{result.targetVolume.toFixed(2)} L</p>
                <p className="text-xs text-slate-500">at X = {formData.targetConversion}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Maximum Conversion</p>
                <p className="text-xl font-bold">{result.maxConversion.toFixed(4)}</p>
                <p className="text-xs text-slate-500">at equilibrium</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Equilibrium Volume</p>
                <p className="text-xl font-bold">{result.equilibriumVolume.toFixed(2)} L</p>
                <p className="text-xs text-slate-500">at X = {result.maxConversion.toFixed(4)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            <Button
              variant={activeTab === "conversion" ? "default" : "outline"}
              onClick={() => setActiveTab("conversion")}
              size="sm"
            >
              Conversion
            </Button>
            <Button
              variant={activeTab === "temperature" ? "default" : "outline"}
              onClick={() => setActiveTab("temperature")}
              size="sm"
            >
              Temperature
            </Button>
            <Button
              variant={activeTab === "rate" ? "default" : "outline"}
              onClick={() => setActiveTab("rate")}
              size="sm"
            >
              Reaction Rate
            </Button>
          </div>

          <div className="h-[400px]">
            {activeTab === "conversion" && (
              <>
                <h3 className="text-lg font-medium mb-2">Conversion vs. Reactor Volume</h3>
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
                      dataKey="volume"
                      label={{
                        value: "Reactor Volume (L)",
                        position: "insideBottomRight",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      label={{
                        value: "Conversion",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "Actual Conversion") return [`${Number(value).toFixed(4)}`, name]
                        if (name === "Equilibrium Conversion") return [`${Number(value).toFixed(4)}`, name]
                        return [value, name]
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="conversion"
                      name="Actual Conversion"
                      stroke="#0ea5e9"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="equilibriumConversion"
                      name="Equilibrium Conversion"
                      stroke="#6b7280"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}

            {activeTab === "temperature" && (
              <>
                <h3 className="text-lg font-medium mb-2">Temperature vs. Reactor Volume</h3>
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
                      dataKey="volume"
                      label={{
                        value: "Reactor Volume (L)",
                        position: "insideBottomRight",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      label={{
                        value: "Temperature (K)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} K`, "Temperature"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      name="Temperature"
                      stroke="#f43f5e"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}

            {activeTab === "rate" && (
              <>
                <h3 className="text-lg font-medium mb-2">Reaction Rate vs. Reactor Volume</h3>
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
                      dataKey="volume"
                      label={{
                        value: "Reactor Volume (L)",
                        position: "insideBottomRight",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      label={{
                        value: "Reaction Rate (mol/L·s)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(6)} mol/L·s`, "Rate"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Reaction Rate"
                      stroke="#10b981"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Implementation of the adiabatic PFR calculation
function calculateAdiabaticPFR(params: FormData): Result {
  const {
    preExponentialFactor,
    activationEnergy,
    gasConstant,
    heatOfReaction,
    heatCapacity,
    initialConcentration,
    initialMolarFlow,
    initialTemperature,
    referenceTemperature1,
    referenceTemperature2,
    equilibriumConstant,
    targetConversion,
    maxVolume,
  } = params

  // Helper functions
  const calculateTemperature = (X: number): number => {
    return initialTemperature + (X * -heatOfReaction) / heatCapacity
  }

  const calculateRateConstant = (T: number): number => {
    return preExponentialFactor * Math.exp((activationEnergy / gasConstant) * (1 / referenceTemperature1 - 1 / T))
  }

  const calculateEquilibriumConstant = (T: number): number => {
    return equilibriumConstant * Math.exp((heatOfReaction / gasConstant) * (1 / referenceTemperature2 - 1 / T))
  }

  const calculateEquilibriumConversion = (T: number): number => {
    const Kc = calculateEquilibriumConstant(T)
    return Kc / (1 + Kc)
  }

  // Numerical integration using Euler method
  const numPoints = 500
  const dV = maxVolume / numPoints

  // Arrays to store results
  const volumeValues: number[] = []
  const conversionValues: number[] = []
  const temperatureValues: number[] = []
  const rateValues: number[] = []
  const equilibriumConversionValues: number[] = []

  // Initial conditions
  let V = 0
  let X = 0

  // Add initial point
  volumeValues.push(V)
  conversionValues.push(X)
  const T0 = calculateTemperature(X)
  temperatureValues.push(T0)
  const Xe0 = calculateEquilibriumConversion(T0)
  equilibriumConversionValues.push(Xe0)
  rateValues.push(0) // No reaction at V=0

  let targetReached = false
  let targetVolume = 0
  let equilibriumReached = false
  let equilibriumVolume = 0
  let maxConversion = 0

  for (let i = 1; i <= numPoints; i++) {
    // Current temperature
    const T = calculateTemperature(X)

    // Rate constant at current temperature
    const k = calculateRateConstant(T)

    // Equilibrium constant at current temperature
    const Kc = calculateEquilibriumConstant(T)

    // Reaction rate
    const rate = 1 - X - X / Kc
    const rA = k * initialConcentration * rate

    // Derivative of conversion with respect to volume
    const dX_dV = (((k * initialConcentration) / initialMolarFlow) * rate * initialTemperature) / T

    // Update variables using Euler method
    V += dV
    X += dX_dV * dV

    // Ensure X doesn't exceed equilibrium or go negative
    const Xe = calculateEquilibriumConversion(T)
    if (X > Xe) X = Xe
    if (X < 0) X = 0

    // Store values
    volumeValues.push(V)
    conversionValues.push(X)
    temperatureValues.push(T)
    rateValues.push(rA)
    equilibriumConversionValues.push(Xe)

    // Check if target conversion is reached
    if (!targetReached && X >= targetConversion) {
      targetReached = true
      targetVolume = V
    }

    // Check if equilibrium is reached (when rate becomes very small)
    if (!equilibriumReached && Math.abs(rate) < 1e-4) {
      equilibriumReached = true
      equilibriumVolume = V
      maxConversion = X

      // If target conversion exceeds equilibrium, set target volume to equilibrium volume
      if (targetConversion > maxConversion && !targetReached) {
        targetReached = true
        targetVolume = equilibriumVolume
      }
    }

    // Stop if conversion is not changing significantly
    if (i > 1 && Math.abs(X - conversionValues[i - 1]) < 1e-6) {
      if (!equilibriumReached) {
        equilibriumReached = true
        equilibriumVolume = V
        maxConversion = X
      }
      break
    }
  }

  // If target wasn't reached, use interpolation to estimate
  if (!targetReached && conversionValues.length > 1) {
    // Find closest points
    let closestIndex = 0
    let minDiff = Math.abs(conversionValues[0] - targetConversion)

    for (let i = 1; i < conversionValues.length; i++) {
      const diff = Math.abs(conversionValues[i] - targetConversion)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
      }
    }

    // Use closest point as approximation
    targetVolume = volumeValues[closestIndex]
  }

  // If equilibrium wasn't reached, use the final values
  if (!equilibriumReached) {
    equilibriumVolume = volumeValues[volumeValues.length - 1]
    maxConversion = conversionValues[conversionValues.length - 1]
  }

  // Prepare chart data
  const chartData = volumeValues.map((v, i) => ({
    volume: v,
    conversion: conversionValues[i],
    temperature: temperatureValues[i],
    rate: rateValues[i],
    equilibriumConversion: equilibriumConversionValues[i],
  }))

  return {
    targetVolume,
    maxConversion,
    equilibriumVolume,
    chartData,
  }
}
