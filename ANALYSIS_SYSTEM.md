# Domain-Level Analysis System

## Overview

The analysis system computes and stores performance metrics for 4 cognitive/visual defect domains based on game sessions. Each domain has its own performance table in Supabase, and metrics are aggregated over time periods (default: last 30 days).

## The 4 Defect Domains

| Domain Key              | Display Name          | Description                                          | Icon |
| ----------------------- | --------------------- | ---------------------------------------------------- | ---- |
| `depth-perception`      | Depth Perception      | Ability to judge distances and spatial relationships | 📦   |
| `eye-hand-coordination` | Eye-Hand Coordination | Hand-eye coordination and precision targeting        | 🎮   |
| `pursuit-follow`        | Pursuit & Follow      | Ability to track moving objects smoothly             | 🎯   |
| `saccadic-movement`     | Saccadic Movement     | Rapid eye movements between fixed points             | ⚡   |

## Database Schema

### Performance Tables

Four domain-specific tables store aggregated performance metrics:

- `depth_perception_performance`
- `eye_hand_coordination_performance`
- `pursuit_follow_performance`
- `saccadic_movement_performance`

### Table Structure

Each table has the following columns:

```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL REFERENCES profiles(id)
period_start DATE NOT NULL
period_end DATE NOT NULL
total_sessions INTEGER DEFAULT 0
average_score REAL DEFAULT 0
best_score INTEGER DEFAULT 0
score_stddev REAL DEFAULT 0
average_accuracy REAL DEFAULT NULL
total_playtime_seconds INTEGER DEFAULT 0
last_played TIMESTAMPTZ
last_updated TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, period_start, period_end)
```

### Running the Schema

To create the tables in Supabase:

1. Open the Supabase SQL Editor
2. Run the SQL script: `database/domain-performance-schema.sql`
3. Verify tables are created and RLS policies are active

## Game → Domain Mapping

The mapping is straightforward: `game_type` in `game_sessions` directly maps to the domain.

```typescript
// game_sessions.game_type → domain
'depth-perception' → depth_perception_performance
'eye-hand-coordination' → eye_hand_coordination_performance
'pursuit-follow' → pursuit_follow_performance
'saccadic-movement' → saccadic_movement_performance
```

Games by domain:

- **Depth Perception**: depth-matching, falling-blocks
- **Eye-Hand Coordination**: bike-racing, hit-the-mole
- **Pursuit & Follow**: find-the-queen, shadow-follow
- **Saccadic Movement**: magic-tile, fruit-ninja

## API Routes

### 1. Compute Domain Metrics

**POST** `/api/analysis/compute-user`

Computes domain-level metrics from game sessions and stores them in the domain tables.

**Request Body:**

```json
{
  "user_id": "uuid",
  "period_start": "2024-01-01", // optional, defaults to 30 days ago
  "period_end": "2024-01-31" // optional, defaults to today
}
```

**Response:**

```json
{
  "success": true,
  "user_id": "uuid",
  "period_start": "2024-01-01",
  "period_end": "2024-01-31",
  "domains": {
    "depth-perception": {
      /* DomainPerformance object */
    },
    "eye-hand-coordination": {
      /* DomainPerformance object */
    },
    "pursuit-follow": {
      /* DomainPerformance object */
    },
    "saccadic-movement": {
      /* DomainPerformance object */
    }
  }
}
```

**How It Works:**

1. Fetches all `game_sessions` for the user in the time period
2. Groups sessions by domain (based on `game_type`)
3. Computes aggregates:
   - `total_sessions`: count of sessions
   - `average_score`: mean score
   - `best_score`: max score
   - `score_stddev`: standard deviation of scores
   - `average_accuracy`: mean accuracy (ignoring nulls)
   - `total_playtime_seconds`: sum of durations
   - `last_played`: most recent session timestamp
4. Upserts computed metrics into each domain table

### 2. Fetch Domain Metrics

**GET** `/api/analysis/domains/[user_id]`

Retrieves stored domain metrics for a user.

**Query Parameters:**

- `period_start`: ISO date (optional, defaults to 30 days ago)
- `period_end`: ISO date (optional, defaults to today)

**Response:**

```json
{
  "success": true,
  "user_id": "uuid",
  "period_start": "2024-01-01",
  "period_end": "2024-01-31",
  "domains": {
    "depth-perception": {
      "id": "uuid",
      "user_id": "uuid",
      "period_start": "2024-01-01",
      "period_end": "2024-01-31",
      "total_sessions": 15,
      "average_score": 450.5,
      "best_score": 800,
      "score_stddev": 123.4,
      "average_accuracy": 85.5,
      "total_playtime_seconds": 1800,
      "last_played": "2024-01-31T14:30:00Z",
      "last_updated": "2024-01-31T14:35:00Z"
    }
    // ... other domains
  }
}
```

**Note:** If a domain returns `null`, it means:

- No metrics have been computed for that period yet
- Or the user has no sessions in that domain for that period

Call `/api/analysis/compute-user` first to populate the data.

## Frontend Integration

### Using the React Hook

```tsx
import { useDomainAnalysis } from "@/hooks/useDomainAnalysis";

function AnalysisPage() {
  const { data, loading, error, fetchDomains, computeMetrics } =
    useDomainAnalysis({
      userId: user.id,
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
    });

  useEffect(() => {
    // Fetch existing metrics on mount
    fetchDomains();
  }, [fetchDomains]);

  const handleRecompute = async () => {
    // Recompute metrics from game sessions
    await computeMetrics();
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data?.domains &&
        Object.entries(data.domains).map(([domain, metrics]) => (
          <DomainCard key={domain} domain={domain} metrics={metrics} />
        ))}
      <button onClick={handleRecompute}>Recompute Metrics</button>
    </div>
  );
}
```

### Direct API Calls

```typescript
// Compute metrics
const response = await fetch("/api/analysis/compute-user", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: userId,
    period_start: "2024-01-01",
    period_end: "2024-01-31",
  }),
});
const result = await response.json();

// Fetch metrics
const metricsResponse = await fetch(
  `/api/analysis/domains/${userId}?period_start=2024-01-01&period_end=2024-01-31`
);
const metricsData = await metricsResponse.json();
```

## Domain Mapping Utilities

```typescript
import {
  DOMAINS,
  DOMAIN_INFO,
  getDomainTableName,
  getDomainName,
  getDomainIcon,
  getDomainColor,
  isValidDomain,
} from "@/lib/utils/domain-mapping";

// Get all domains
console.log(DOMAINS); // ['depth-perception', 'eye-hand-coordination', ...]

// Get domain info
console.log(DOMAIN_INFO["depth-perception"]);
// { name: 'Depth Perception', description: '...', icon: '📦', color: '#3b82f6' }

// Get table name
console.log(getDomainTableName("depth-perception"));
// 'depth_perception_performance'

// Validate domain
if (isValidDomain(userInput)) {
  // Use userInput as DomainKey
}
```

## Metrics Computation Details

### Standard Deviation Calculation

```typescript
const variance =
  scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) /
  totalSessions;
const stddev = Math.sqrt(variance);
```

### Accuracy Handling

- Only sessions with non-null `accuracy` values are included
- If no sessions have accuracy, `average_accuracy` is `null`

### Playtime Aggregation

- Sums all `duration` values from sessions
- Duration is stored in seconds
- Null durations are treated as 0

### Edge Cases

- **Zero sessions**: All metrics are 0 or null
- **One session**: stddev is 0
- **Missing data**: Upsert creates a row with zeros, not skipped

## Workflow

### Initial Setup (One-time)

1. Run `database/domain-performance-schema.sql` in Supabase
2. Verify tables and RLS policies exist
3. Test API routes with sample data

### Regular Usage

1. User plays games → `game_sessions` table fills up
2. Analysis page calls `POST /api/analysis/compute-user`
   - Computes metrics from sessions
   - Stores in domain tables
3. Analysis page calls `GET /api/analysis/domains/[user_id]`
   - Fetches stored metrics
   - Displays charts/graphs

### Updating Metrics

- Call `POST /api/analysis/compute-user` again
- Uses upsert → idempotent operation
- Safe to call multiple times
- Recommended: compute nightly or on-demand

## Security

- RLS enabled on all domain tables
- Users can only view/update their own metrics
- API routes check `auth.uid() = user_id`
- Service key not required (using user context)

## Performance Considerations

- Indexes on `user_id`, `period_start`, `period_end`
- Unique constraint prevents duplicate periods
- Upsert is efficient for updates
- Consider caching in frontend for frequently accessed periods

## Future Enhancements

- Auto-compute metrics on game save (via trigger or background job)
- Support for multiple time periods (weekly, monthly, yearly)
- Trend analysis (comparing periods)
- Percentile rankings
- Domain-specific recommendations
