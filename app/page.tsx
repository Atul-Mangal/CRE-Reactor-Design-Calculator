"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import IsothermalPFRCalculator from "@/components/isothermal-pfr-calculator"
import PressureDropPBRCalculator from "@/components/pressure-drop-pfr-calculator"
import AdiabaticPFRCalculator from "@/components/adiabatic-pfr-calculator"
import { BeakerIcon, ArrowDownIcon, ThermometerIcon } from "lucide-react"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-2">Chemical Engineering Calculator Suite</h1>
      <p className="text-center text-muted-foreground mb-8">
        Advanced tools for Plug Flow Reactor (PFR) design and analysis
      </p>

      <Tabs defaultValue="isothermal" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="isothermal" className="flex items-center gap-2">
            <BeakerIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Isothermal PFR</span>
            <span className="sm:hidden">Isothermal</span>
          </TabsTrigger>
          <TabsTrigger value="pressure-drop" className="flex items-center gap-2">
            <ArrowDownIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Pressure Drop PBR</span>
            <span className="sm:hidden">Pressure</span>
          </TabsTrigger>
          <TabsTrigger value="adiabatic" className="flex items-center gap-2">
            <ThermometerIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Adiabatic PFR</span>
            <span className="sm:hidden">Adiabatic</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="isothermal">
          <Card>
            <CardHeader>
              <CardTitle>Isothermal PFR Calculator</CardTitle>
              <CardDescription>
                Calculate reactor volume for a given conversion in an isothermal PFR (constant pressure and temperature)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IsothermalPFRCalculator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pressure-drop">
          <Card>
            <CardHeader>
              <CardTitle>Pressure Drop PBR Calculator</CardTitle>
              <CardDescription>
                Calculate reactor performance with pressure drop effects in a PBR (constant temperature)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PressureDropPBRCalculator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adiabatic">
          <Card>
            <CardHeader>
              <CardTitle>Adiabatic PFR Calculator</CardTitle>
              <CardDescription>
                Calculate reactor performance with temperature change in an adiabatic PFR (constant pressure)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdiabaticPFRCalculator />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
