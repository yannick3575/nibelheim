'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, TrendingUp, Timer, Hash } from 'lucide-react';
import type { SimulationResult as SimulationResultType } from '@/lib/stochastic-lab/types';
import { SIMULATION_LABELS } from '@/lib/stochastic-lab/types';
import { cn } from '@/lib/utils';

interface SimulationResultProps {
  result: SimulationResultType;
}

type ViewMode = 'histogram' | 'convergence';

export function SimulationResult({ result }: SimulationResultProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(
    result.histogram ? 'histogram' : 'convergence'
  );

  const { statistics, histogram, convergence, executionTimeMs, iterations, type } = result;

  // Prepare histogram data for Recharts
  const histogramData = histogram
    ? histogram.bins.map((bin, i) => ({
        bin,
        count: histogram.counts[i],
      }))
    : [];

  // Prepare convergence data for Recharts (downsample if needed)
  const convergenceData = convergence
    ? convergence.iterations.map((iter, i) => ({
        iteration: iter,
        value: convergence.values[i],
      }))
    : [];

  // Format numbers for display
  const formatNumber = (n: number) => {
    if (Math.abs(n) >= 1000) return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
    if (Math.abs(n) < 0.001 && n !== 0) return n.toExponential(3);
    return n.toFixed(4);
  };

  return (
    <Card className="glass-vision-strong border-aurora-cyan/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Badge variant="outline" className="border-aurora-cyan/30 text-aurora-cyan">
              {SIMULATION_LABELS[type]}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {iterations.toLocaleString('fr-FR')} itérations
            </span>
            <span className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {executionTimeMs.toFixed(1)} ms
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="p-2 rounded-lg bg-background/50">
            <div className="text-xs text-muted-foreground">Moyenne</div>
            <div className="font-mono font-medium text-aurora-cyan">
              {formatNumber(statistics.mean)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-background/50">
            <div className="text-xs text-muted-foreground">Écart-type</div>
            <div className="font-mono font-medium">
              {formatNumber(statistics.stdDev)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-background/50">
            <div className="text-xs text-muted-foreground">IC 95%</div>
            <div className="font-mono font-medium text-xs">
              [{formatNumber(statistics.confidenceInterval95[0])}, {formatNumber(statistics.confidenceInterval95[1])}]
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        {histogram && convergence && (
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'histogram' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('histogram')}
              className={cn(
                viewMode === 'histogram' && 'bg-gradient-to-r from-aurora-violet to-aurora-magenta'
              )}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Histogramme
            </Button>
            <Button
              variant={viewMode === 'convergence' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('convergence')}
              className={cn(
                viewMode === 'convergence' && 'bg-gradient-to-r from-aurora-cyan to-aurora-violet'
              )}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Convergence
            </Button>
          </div>
        )}

        {/* Charts */}
        <div className="h-48 w-full">
          {viewMode === 'histogram' && histogramData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="bin"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  tickFormatter={(value) => parseFloat(value).toFixed(1)}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => `Bin: ${value}`}
                  formatter={(value) => [typeof value === 'number' ? value.toLocaleString('fr-FR') : String(value), 'Fréquence']}
                />
                <Bar
                  dataKey="count"
                  fill="oklch(0.68 0.28 285)"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}

          {viewMode === 'convergence' && convergenceData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={convergenceData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="iteration"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => value.toLocaleString('fr-FR')}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => value.toFixed(2)}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => `Itération: ${typeof value === 'number' ? value.toLocaleString('fr-FR') : value}`}
                  formatter={(value) => [typeof value === 'number' ? value.toFixed(6) : String(value), 'Valeur']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="oklch(0.72 0.24 210)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Markov Chain State Frequencies */}
          {result.stateFrequencies && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Distribution stationnaire empirique</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.stateFrequencies).map(([state, freq]) => (
                  <Badge
                    key={state}
                    variant="outline"
                    className="border-aurora-magenta/30"
                  >
                    {state}: {(freq * 100).toFixed(1)}%
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>Min: {formatNumber(statistics.min)}</div>
          <div>Max: {formatNumber(statistics.max)}</div>
          <div>Médiane: {formatNumber(statistics.median)}</div>
          <div>Variance: {formatNumber(statistics.variance)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
