import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMetrics, MetricsData } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Cpu, HardDrive, Clock, TrendingUp, Zap } from 'lucide-react';

const MAX_HISTORY = 30;

interface HistoryPoint {
  time: string;
  cpuPercent: number;
  memoryMB: number;
  heapMB: number;
  rpm: number;
  totalRequests: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
}

const cpuChartConfig: ChartConfig = {
  cpuPercent: { label: 'CPU %', color: 'hsl(var(--chart-1))' },
};

const memoryChartConfig: ChartConfig = {
  memoryMB: { label: 'RSS (MB)', color: 'hsl(var(--chart-2))' },
  heapMB: { label: 'Heap (MB)', color: 'hsl(var(--chart-3))' },
};

const trafficChartConfig: ChartConfig = {
  rpm: { label: 'RPM', color: 'hsl(var(--chart-4))' },
};

const latencyChartConfig: ChartConfig = {
  avgLatency: { label: 'Avg (ms)', color: 'hsl(var(--chart-1))' },
  p95Latency: { label: 'P95 (ms)', color: 'hsl(var(--chart-5))' },
};

export function MetricsDashboard() {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const historyRef = useRef(history);
  historyRef.current = history;

  const { data: metrics, isLoading, isError } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: fetchMetrics,
    refetchInterval: 15000,
    retry: 1,
    staleTime: 10000,
  });

  useEffect(() => {
    if (!metrics) return;
    const point: HistoryPoint = {
      time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      cpuPercent: parseFloat(metrics.system.cpu.avgPercent) || 0,
      memoryMB: parseFloat(metrics.system.memory.rssMB) || 0,
      heapMB: parseFloat(metrics.system.memory.heapUsedMB) || 0,
      rpm: parseFloat(metrics.traffic.rpm) || 0,
      totalRequests: metrics.traffic.totalRequests,
      avgLatency: parseFloat(metrics.latency.avg) || 0,
      p95Latency: parseFloat(metrics.latency.p95) || 0,
      p99Latency: parseFloat(metrics.latency.p99) || 0,
    };
    setHistory(prev => [...prev.slice(-(MAX_HISTORY - 1)), point]);
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No se pudo conectar al endpoint de métricas. Asegúrate de que el backend esté online y la API key configurada.
          </p>
        </CardContent>
      </Card>
    );
  }

  const uptimeHours = (metrics.uptime / 3600).toFixed(1);
  const statusByCode = Object.entries(metrics.traffic.byStatus || {});

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CPU</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.system.cpu.avgPercent}%</div>
            <p className="text-xs text-muted-foreground">
              Load: {metrics.system.cpu.loadAvg1m.toFixed(2)} / {metrics.system.cpu.cores} cores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Memoria</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.system.memory.rssMB} MB</div>
            <p className="text-xs text-muted-foreground">
              Heap: {metrics.system.memory.heapUsedMB} / {metrics.system.memory.heapTotalMB} MB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tráfico</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.traffic.rpm} RPM</div>
            <p className="text-xs text-muted-foreground">
              Total: {metrics.traffic.totalRequests.toLocaleString()} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Latencia</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.latency.avg} ms</div>
            <p className="text-xs text-muted-foreground">
              P95: {metrics.latency.p95} ms · P99: {metrics.latency.p99} ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Uptime & Status Codes */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uptimeHours}h</div>
            <p className="text-xs text-muted-foreground">{Math.floor(metrics.uptime)}s total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {statusByCode.map(([code, count]) => (
                <Badge
                  key={code}
                  variant={code.startsWith('2') ? 'default' : code.startsWith('4') ? 'secondary' : 'destructive'}
                >
                  {code}: {count}
                </Badge>
              ))}
              {statusByCode.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin datos aún</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CPU Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-4 w-4" /> CPU en tiempo real
          </CardTitle>
          <CardDescription>Porcentaje promedio de uso de CPU</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length < 2 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Recopilando datos... ({history.length}/{2} muestras mínimas)</p>
          ) : (
            <ChartContainer config={cpuChartConfig} className="h-[200px] w-full">
              <AreaChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={10} />
                <YAxis domain={[0, 'auto']} fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="cpuPercent"
                  stroke="var(--color-cpuPercent)"
                  fill="var(--color-cpuPercent)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Memory Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" /> Memoria en tiempo real
          </CardTitle>
          <CardDescription>RSS y Heap usados (MB)</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length < 2 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Recopilando datos...</p>
          ) : (
            <ChartContainer config={memoryChartConfig} className="h-[200px] w-full">
              <AreaChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={10} />
                <YAxis fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="memoryMB" stroke="var(--color-memoryMB)" fill="var(--color-memoryMB)" fillOpacity={0.2} />
                <Area type="monotone" dataKey="heapMB" stroke="var(--color-heapMB)" fill="var(--color-heapMB)" fillOpacity={0.2} />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Traffic Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Requests por minuto
          </CardTitle>
          <CardDescription>RPM en tiempo real</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length < 2 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Recopilando datos...</p>
          ) : (
            <ChartContainer config={trafficChartConfig} className="h-[200px] w-full">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={10} />
                <YAxis fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="rpm" stroke="var(--color-rpm)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Latency Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" /> Latencia
          </CardTitle>
          <CardDescription>Tiempo de respuesta promedio y P95 (ms)</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length < 2 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Recopilando datos...</p>
          ) : (
            <ChartContainer config={latencyChartConfig} className="h-[200px] w-full">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={10} />
                <YAxis fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="avgLatency" stroke="var(--color-avgLatency)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p95Latency" stroke="var(--color-p95Latency)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" /> Rutas más visitadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.traffic.topRoutes && metrics.traffic.topRoutes.length > 0 ? (
            <div className="space-y-2">
              {metrics.traffic.topRoutes.map((route, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <code className="text-xs bg-muted px-2 py-1 rounded">{route.route}</code>
                  <Badge variant="secondary">{route.count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos aún</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
