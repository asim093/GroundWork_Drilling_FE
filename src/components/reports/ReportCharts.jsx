import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Card, SimpleGrid, Stack, Text } from '@mantine/core';
import { svgToPngDataUrl } from '../../lib/svgCapture.js';

const FONT = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

const COLOR = {
  axis: '#adb5bd',
  grid: '#e9ecef',
  text: '#495057',
  muted: '#868e96',
  eligible: '#2f9e44',
  notEligible: '#e03131',
  notAvailable: '#adb5bd',
  drilled: '#228be6',
  recovered: '#0c8599'
};

const MODE_UNIT = { none: 'day', user: 'site manager', job: 'job' };

const MODE_BAR_TITLE = {
  none: 'Drilled vs recovered meters over time',
  user: 'Drilled vs recovered by site manager',
  job: 'Drilled vs recovered by job'
};

const DONUT_TITLE = 'Bonus eligibility';

const dayKey = (value) => new Date(value).toISOString().slice(0, 10);

const dayLabel = (key) =>
  new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const truncate = (value, max) => (value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value);

const fmt = (value) =>
  typeof value === 'number'
    ? value.toLocaleString('en-US', { maximumFractionDigits: 1 })
    : value;

const niceCeil = (value) => {
  if (!value || value <= 0) {
    return 10;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
};

const buildBuckets = (mode, entries) => {
  const map = new Map();

  (entries || []).forEach((entry) => {
    let key;
    let label;

    if (mode === 'user') {
      key = entry.userId || 'unknown';
      label = entry.operator || 'Unknown site manager';
    } else if (mode === 'job') {
      key = entry.jobId || 'unknown';
      label = entry.jobNumber
        ? `${entry.jobNumber}${entry.clientName ? ` — ${entry.clientName}` : ''}`
        : 'Unknown job';
    } else {
      key = dayKey(entry.date);
      label = dayLabel(key);
    }

    if (!map.has(key)) {
      map.set(key, { key, label, drilled: 0, recovered: 0 });
    }
    const bucket = map.get(key);
    bucket.drilled += Number(entry.metersDrilled) || 0;
    bucket.recovered += Number(entry.metersRecovered) || 0;
  });

  const buckets = [...map.values()].map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    drilled: Math.round(bucket.drilled * 100) / 100,
    recovered: Math.round(bucket.recovered * 100) / 100
  }));

  return mode === 'none'
    ? buckets.sort((a, b) => a.key.localeCompare(b.key))
    : buckets.sort((a, b) => a.label.localeCompare(b.label));
};

const donutSegments = (eligibility) => [
  { key: 'eligible', label: 'Eligible', color: COLOR.eligible, value: eligibility?.eligible || 0 },
  {
    key: 'not-eligible',
    label: 'Not eligible',
    color: COLOR.notEligible,
    value: eligibility?.['not-eligible'] || 0
  },
  {
    key: 'not-available',
    label: 'Not available',
    color: COLOR.notAvailable,
    value: eligibility?.['not-available'] || 0
  }
];

const VB_W = 440;
const VB_H = 248;

const svgStyle = { width: '100%', aspectRatio: `${VB_W} / ${VB_H}`, height: 'auto', display: 'block' };

const EligibilityDonut = forwardRef(({ eligibility, recoveryPercent }, ref) => {
  const segments = donutSegments(eligibility);
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const cx = 118;
  const cy = 116;
  const r = 78;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * r;
  const centerLabel =
    recoveryPercent === null || recoveryPercent === undefined ? '—' : `${Math.round(recoveryPercent)}%`;

  let offset = 0;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label="Bonus eligibility chart"
      style={svgStyle}
    >
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="#ffffff" />

      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLOR.grid} strokeWidth={strokeWidth} />
      ) : (
        segments.map((segment) => {
          if (!segment.value) {
            return null;
          }
          const dash = (segment.value / total) * circumference;
          const node = (
            <circle
              key={segment.key}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += dash;
          return node;
        })
      )}

      <text
        x={cx}
        y={cy - 1}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize="30"
        fontWeight="800"
        fill={COLOR.text}
      >
        {centerLabel}
      </text>
      <text x={cx} y={cy + 17} textAnchor="middle" fontFamily={FONT} fontSize="10" fill={COLOR.muted}>
        recovery
      </text>

      {segments.map((segment, index) => {
        const y = 84 + index * 34;
        return (
          <g key={segment.key}>
            <rect x="248" y={y - 11} width="13" height="13" rx="3" fill={segment.color} />
            <text x="270" y={y} fontFamily={FONT} fontSize="13" fill={COLOR.text}>
              {segment.label}
            </text>
            <text
              x={VB_W - 16}
              y={y}
              textAnchor="end"
              fontFamily={FONT}
              fontSize="13"
              fontWeight="700"
              fill={COLOR.text}
            >
              {segment.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
});

EligibilityDonut.displayName = 'EligibilityDonut';

const MetersBarChart = forwardRef(({ buckets }, ref) => {
  const count = buckets.length;
  const rotate = count > 4;
  const left = 42;
  const right = 12;
  const top = 40;
  const bottom = rotate ? 52 : 30;
  const plotW = VB_W - left - right;
  const plotH = VB_H - top - bottom;
  const baseY = top + plotH;
  const step = plotW / Math.max(count, 1);
  const max = Math.max(
    10,
    niceCeil(Math.max(...buckets.map((b) => Math.max(b.drilled, b.recovered)), 0))
  );
  const yFor = (value) => top + plotH * (1 - Math.min(Math.max(value, 0), max) / max);
  const barW = Math.min(18, step * 0.32);
  const gap = Math.min(5, step * 0.08);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label="Drilled versus recovered meters chart"
      style={svgStyle}
    >
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="#ffffff" />

      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = top + plotH * (1 - ratio);
        return (
          <g key={ratio}>
            <line x1={left} x2={left + plotW} y1={y} y2={y} stroke={COLOR.grid} strokeWidth="1" />
            <text
              x={left - 6}
              y={y + 3}
              textAnchor="end"
              fontFamily={FONT}
              fontSize="9"
              fill={COLOR.muted}
            >
              {Math.round(max * ratio)}
            </text>
          </g>
        );
      })}

      <line x1={left} x2={left + plotW} y1={baseY} y2={baseY} stroke={COLOR.axis} strokeWidth="1" />

      <g transform={`translate(${left}, 16)`}>
        <rect x="0" y="0" width="10" height="10" rx="2" fill={COLOR.drilled} />
        <text x="14" y="9" fontFamily={FONT} fontSize="9.5" fill={COLOR.text}>
          Drilled (m)
        </text>
        <rect x="82" y="0" width="10" height="10" rx="2" fill={COLOR.recovered} />
        <text x="96" y="9" fontFamily={FONT} fontSize="9.5" fill={COLOR.text}>
          Recovered (m)
        </text>
      </g>

      {buckets.map((bucket, index) => {
        const center = left + step * index + step / 2;
        const drilledY = yFor(bucket.drilled);
        const recoveredY = yFor(bucket.recovered);
        const startX = center - barW - gap / 2;
        const labelY = baseY + 12;
        return (
          <g key={bucket.key}>
            <rect
              x={startX}
              y={drilledY}
              width={barW}
              height={Math.max(0, baseY - drilledY)}
              rx="2"
              fill={COLOR.drilled}
            />
            <rect
              x={startX + barW + gap}
              y={recoveredY}
              width={barW}
              height={Math.max(0, baseY - recoveredY)}
              rx="2"
              fill={COLOR.recovered}
            />
            <text
              x={center}
              y={labelY}
              textAnchor={rotate ? 'end' : 'middle'}
              fontFamily={FONT}
              fontSize={rotate ? '8' : '9'}
              fill={COLOR.text}
              transform={rotate ? `rotate(-40 ${center} ${labelY})` : undefined}
            >
              {truncate(bucket.label, rotate ? 18 : 12)}
              <title>{bucket.label}</title>
            </text>
            <title>{`${bucket.label}: ${fmt(bucket.drilled)} m drilled, ${fmt(bucket.recovered)} m recovered`}</title>
          </g>
        );
      })}
    </svg>
  );
});

MetersBarChart.displayName = 'MetersBarChart';

const ChartCard = ({ title, subtitle, children }) => (
  <Card withBorder radius="lg" p="lg">
    <Stack gap="xs">
      <Stack gap={2}>
        <Text fw={700}>{title}</Text>
        {subtitle ? (
          <Text fz="xs" c="dimmed">
            {subtitle}
          </Text>
        ) : null}
      </Stack>
      {children}
    </Stack>
  </Card>
);

export const ReportCharts = forwardRef(
  ({ mode = 'none', entries, eligibility, recoveryPercent, visible = true }, ref) => {
    const activeMode = mode === 'user' || mode === 'job' ? mode : 'none';
    const buckets = useMemo(() => buildBuckets(activeMode, entries), [activeMode, entries]);
    const donutRef = useRef(null);
    const barRef = useRef(null);
    const barTitle = MODE_BAR_TITLE[activeMode];

    useImperativeHandle(
      ref,
      () => ({
        capture: async () => {
          const targets = [
            { title: DONUT_TITLE, node: donutRef.current },
            { title: barTitle, node: barRef.current }
          ];
          const images = [];
          for (const target of targets) {
            if (!target.node) {
              continue;
            }
            images.push({ title: target.title, dataUrl: await svgToPngDataUrl(target.node) });
          }
          return images;
        }
      }),
      [barTitle]
    );

    const hasData = buckets.length > 0 || (eligibility && donutSegments(eligibility).some((s) => s.value));

    const content = !hasData ? (
      <Card withBorder radius="lg" p="lg">
        <Text c="dimmed" fz="sm">
          No submitted entries in this period to chart.
        </Text>
      </Card>
    ) : (
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
        <ChartCard title={DONUT_TITLE} subtitle="Eligible / not eligible / not available shifts">
          <EligibilityDonut
            ref={donutRef}
            eligibility={eligibility}
            recoveryPercent={recoveryPercent}
          />
        </ChartCard>
        <ChartCard
          title={barTitle}
          subtitle={`Total drilled and recovered meters per ${MODE_UNIT[activeMode]}`}
        >
          <MetersBarChart ref={barRef} buckets={buckets} />
        </ChartCard>
      </SimpleGrid>
    );

    if (visible) {
      return content;
    }

    return (
      <div
        aria-hidden="true"
        style={{ position: 'fixed', left: '-10000px', top: 0, width: 720, pointerEvents: 'none', opacity: 0 }}
      >
        {content}
      </div>
    );
  }
);

ReportCharts.displayName = 'ReportCharts';
