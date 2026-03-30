export const prerender = false;

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

let memCache: { data: any; timestamp: number } | null = null;

// GitHub raw URLs — canonical data paths
const GITHUB_RAW = 'https://raw.githubusercontent.com/danielrosehill/Iran-Israel-War-2026-OSINT-Data/main/data';

interface WaveFile {
  metadata?: {
    operation?: string;
    operation_name?: string;
    incident_count?: number;
    total_incidents?: number;
    date_range?: { start?: string; end?: string };
    countries_targeted?: string[];
    last_updated?: string;
    aggregate_stats?: {
      total_killed?: number;
      total_wounded?: number;
      total_ballistic_missiles_estimate?: string;
      total_drones_estimate?: string;
      trigger_event?: string;
      historical_significance?: string;
      interception_rate_claimed?: string;
    };
  };
  incidents?: any[];
  weapons?: any[];
  systems?: any[];
  bases?: any[];
  vessels?: any[];
}

async function safeFetch(url: string): Promise<WaveFile | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET({ request }: { request: Request }) {
  try {
    // 1. Check cache
    if (memCache && Date.now() - memCache.timestamp < CACHE_DURATION_MS) {
      return new Response(JSON.stringify(memCache.data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      });
    }

    // 2. Fetch all four rounds from canonical paths
    //    Also try exports path as fallback
    const [tp4, tp3, tp2, tp1] = await Promise.all([
      safeFetch(`${GITHUB_RAW}/tp4-2026/waves.json`),
      safeFetch(`${GITHUB_RAW}/tp3-2025/waves.json`),
      safeFetch(`${GITHUB_RAW}/tp2-2024/waves.json`),
      safeFetch(`${GITHUB_RAW}/tp1-2024/waves.json`),
    ]);

    // At minimum we need TP4 for the page to be useful
    if (!tp4) {
      // Try fallback export path
      const fallback = await safeFetch(
        'https://raw.githubusercontent.com/danielrosehill/Iran-Israel-War-2026-OSINT-Data/main/exports/latest/json/tp4_incidents.json'
      );
      if (!fallback) throw new Error('All OSINT data sources unreachable');
      // Use fallback as tp4 and proceed with nulls for the rest
      return buildResponse(fallback, tp3, tp2, tp1);
    }

    return buildResponse(tp4, tp3, tp2, tp1);
  } catch (error) {
    console.error('Conflict data fetch error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch conflict intelligence data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function getIncidentCount(d: WaveFile | null): number {
  if (!d) return 0;
  return d.metadata?.incident_count || d.metadata?.total_incidents || (d.incidents?.length ?? 0);
}

function getKilled(d: WaveFile | null): number {
  if (!d) return 0;
  // Sum from metadata first
  if (d.metadata?.aggregate_stats?.total_killed) return d.metadata.aggregate_stats.total_killed;
  // Fallback: sum from individual incidents
  if (d.incidents) {
    return d.incidents.reduce((sum: number, inc: any) => sum + (inc.impact?.fatalities || 0), 0);
  }
  return 0;
}

function getWounded(d: WaveFile | null): number {
  if (!d) return 0;
  if (d.metadata?.aggregate_stats?.total_wounded) return d.metadata.aggregate_stats.total_wounded;
  if (d.incidents) {
    return d.incidents.reduce((sum: number, inc: any) => sum + (inc.impact?.injuries || 0), 0);
  }
  return 0;
}

async function buildResponse(tp4: WaveFile | null, tp3: WaveFile | null, tp2: WaveFile | null, tp1: WaveFile | null) {
  const totalWaves = getIncidentCount(tp4) + getIncidentCount(tp3) + getIncidentCount(tp2) + getIncidentCount(tp1);
  const totalFatalities = getKilled(tp4) + getKilled(tp3) + getKilled(tp2) + getKilled(tp1);
  const totalWounded = getWounded(tp4) + getWounded(tp3) + getWounded(tp2) + getWounded(tp1);

  // Compute days since April 13 2024 (TP1 start)
  const conflictStart = new Date('2024-04-13T00:00:00Z');
  const conflictDays = Math.floor((Date.now() - conflictStart.getTime()) / (1000 * 60 * 60 * 24));

  // Fetch reference data concurrently
  const [weapons, defense, bases, vessels] = await Promise.all([
    safeFetch(`${GITHUB_RAW}/reference/iranian_weapons.json`),
    safeFetch(`${GITHUB_RAW}/reference/defense_systems.json`),
    safeFetch(`${GITHUB_RAW}/reference/us_bases.json`),
    safeFetch(`${GITHUB_RAW}/reference/us_naval_vessels.json`),
  ]);

  // Countries targeted (union across all rounds)
  const countriesSet = new Set<string>();
  [tp4, tp3, tp2, tp1].forEach(d => {
    d?.metadata?.countries_targeted?.forEach((c: string) => countriesSet.add(c));
  });

  // Timeline summary
  const timeline = [
    {
      phase: tp4?.metadata?.operation_name || 'True Promise 4',
      dateRange: `${tp4?.metadata?.date_range?.start || 'Feb 2026'} — Present`,
      incidents: getIncidentCount(tp4),
      fatalities: getKilled(tp4),
      wounded: getWounded(tp4),
      missiles: tp4?.metadata?.aggregate_stats?.total_ballistic_missiles_estimate || '~2,410',
      drones: tp4?.metadata?.aggregate_stats?.total_drones_estimate || '~3,560',
      description: tp4?.metadata?.aggregate_stats?.historical_significance || 'First Iranian operation directly targeting US military bases and naval vessels alongside Israel. Expanded theater to 12 countries.',
    },
    {
      phase: tp3?.metadata?.operation_name || 'True Promise 3',
      dateRange: `${tp3?.metadata?.date_range?.start || 'Jun 2025'} — ${tp3?.metadata?.date_range?.end || 'Oct 2025'}`,
      incidents: getIncidentCount(tp3),
      fatalities: getKilled(tp3),
      wounded: getWounded(tp3),
      description: tp3?.metadata?.aggregate_stats?.historical_significance || 'Sustained exchange pattern established with multiple waves.',
    },
    {
      phase: tp2?.metadata?.operation_name || 'True Promise 2',
      dateRange: `${tp2?.metadata?.date_range?.start || 'Oct 2024'}`,
      incidents: getIncidentCount(tp2),
      fatalities: getKilled(tp2),
      wounded: getWounded(tp2),
      description: tp2?.metadata?.aggregate_stats?.trigger_event || 'Response to expanding regional military operations.',
    },
    {
      phase: tp1?.metadata?.operation_name || 'True Promise 1',
      dateRange: `${tp1?.metadata?.date_range?.start || 'Apr 2024'}`,
      incidents: getIncidentCount(tp1),
      fatalities: getKilled(tp1),
      wounded: getWounded(tp1),
      description: tp1?.metadata?.aggregate_stats?.trigger_event || "Iran's first-ever direct aerial attack on Israeli territory.",
    },
  ];

  // Latest incidents from TP4 (newest first, max 20)
  const latestIncidents = (tp4?.incidents || [])
    .slice()
    .sort((a: any, b: any) => {
      const timeA = a.timing?.announced_utc || a.timing?.probable_launch_time || '';
      const timeB = b.timing?.announced_utc || b.timing?.probable_launch_time || '';
      return timeB.localeCompare(timeA);
    })
    .slice(0, 20)
    .map((inc: any) => ({
      id: `tp4-${inc.sequence}`,
      wave: inc.wave_number || inc.sequence,
      date: inc.timing?.probable_launch_time || inc.timing?.announced_utc,
      weapons: inc.weapons?.payload || 'Unknown',
      targets: inc.targets?.targets || 'Unknown',
      interceptStatus: inc.interception?.intercepted
        ? 'Intercepted'
        : inc.interception?.interception_note?.includes('Intercepted')
          ? 'Intercepted'
          : 'Impact Reported',
      fatalities: inc.impact?.fatalities || 0,
      injuries: inc.impact?.injuries || 0,
      description: inc.description || null,
    }));

  const responseData = {
    lastUpdate: tp4?.metadata?.last_updated || new Date().toISOString(),
    stats: {
      totalWaves,
      totalFatalities,
      totalWounded,
      targetedCountriesCount: countriesSet.size || 12,
      conflictDays,
    },
    weapons,
    defense,
    assets: {
      bases: bases?.bases || [],
      vessels: vessels?.vessels || [],
    },
    timeline,
    latestIncidents,
    source: 'github.com/danielrosehill/Iran-Israel-War-2026-OSINT-Data',
  };

  // Update cache
  memCache = { data: responseData, timestamp: Date.now() };

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      'X-Cache': 'MISS',
    },
  });
}
