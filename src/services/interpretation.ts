import rules from "@/data/interpretation-rules.json";
import aliasMapRaw from "@/data/test-aliases.json";
import { TEST_CATEGORIES } from "@/types/lab";

export interface SimpleRow {
  testName: string;
  value: string;
}

type Op = ">" | "<" | ">=" | "<=" | "==";

interface Condition { test: string; op: Op; value: number }

interface Rule {
  when?: Condition;
  all?: Condition[];
  message: string;
  group?: string;
  suggestions?: string[];
  drug_classes?: string[];
  refs?: string[];
}

type RuleGroups = Record<string, Rule[]>; // key: category or panel name

function parseNumber(v: string): number | null {
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function compare(op: Op, a: number, b: number): boolean {
  switch (op) {
    case ">":
      return a > b;
    case "<":
      return a < b;
    case ">=":
      return a >= b;
    case "<=":
      return a <= b;
    case "==":
      return a === b;
    default:
      return false;
  }
}

function findCategoryAndPanel(testName: string): { category?: string; panel?: string } {
  for (const cat of TEST_CATEGORIES) {
    for (const pnl of cat.panels) {
      if (pnl.tests.some((t) => t.name.toLowerCase() === testName.toLowerCase())) {
        return { category: cat.name, panel: pnl.name };
      }
    }
  }
  return {};
}

export function evaluateInterpretations(rows: SimpleRow[]): string[] {
  const grouped = evaluateInterpretationsGrouped(rows);
  const messages: string[] = [];
  for (const arr of Object.values(grouped)) {
    for (const item of arr as any[]) {
      if (typeof item === 'string') messages.push(item);
      else if (item && typeof item === 'object' && 'message' in item) messages.push(item.message);
    }
  }
  return Array.from(new Set(messages));
}

export function evaluateInterpretationsGrouped(rows: SimpleRow[]): Record<string, Array<string | { message: string; suggestions?: string[]; drug_classes?: string[]; refs?: string[] }>> {
  const r = rules as RuleGroups;
  const result: Record<string, Array<string | { message: string; suggestions?: string[]; drug_classes?: string[]; refs?: string[] }>> = {};
  const aliasMap = Object.fromEntries(Object.entries(aliasMapRaw as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v]));

  const canonicalName = (name: string) => {
    const low = name.toLowerCase();
    const mapped = aliasMap[low];
    return mapped ? mapped : name;
  };

  // Pre-index rows by name (case-insensitive)
  const byName = new Map<string, SimpleRow>();
  for (const row of rows) {
    const canon = canonicalName(row.testName);
    byName.set(canon.toLowerCase(), { ...row, testName: canon });
  }

  // Consider all groups, but only fire rules whose tests are present in rows.
  for (const [groupKey, ruleList] of Object.entries(r)) {
    for (const rule of ruleList) {
      let matched = false;
      if (rule.when) {
        const target = byName.get(canonicalName(rule.when.test).toLowerCase());
        if (target) {
          const num = parseNumber(target.value);
          if (num !== null && compare(rule.when.op, num, rule.when.value)) {
            matched = true;
          }
        }
      } else if (rule.all && rule.all.length > 0) {
        matched = rule.all.every((c) => {
          const t = byName.get(canonicalName(c.test).toLowerCase());
          if (!t) return false;
          const n = parseNumber(t.value);
          return n !== null && compare(c.op, n, c.value);
        });
      }

      if (matched) {
        const bucket = rule.group || groupKey;
        if (!result[bucket]) result[bucket] = [];
        if (rule.suggestions || rule.drug_classes || rule.refs) {
          result[bucket].push({
            message: rule.message,
            suggestions: rule.suggestions,
            drug_classes: rule.drug_classes,
            refs: rule.refs,
          });
        } else {
          result[bucket].push(rule.message);
        }
      }
    }
  }

  // Auto-generate interpretations for qualitative and semi-quantitative results
  for (const row of rows) {
    const name = row.testName;
    const valueRaw = String(row.value).trim();
    if (!valueRaw) continue;
    const value = valueRaw.toLowerCase();
    const loc = findCategoryAndPanel(name);
    const bucket = loc.panel || loc.category || 'Findings';

    let msg: string | undefined;
    // Generic positive/reactive
    if (value === 'positive' || value === 'reactive') {
      msg = `${name}: ${valueRaw} — presence detected; correlate clinically.`;
    }
    // Semi-quantitative (e.g., Trace/1+/2+/3+/4+)
    if (!msg && /^(trace|\+1|1\+|\+2|2\+|\+3|3\+|\+4|4\+)$/.test(valueRaw)) {
      msg = `${name}: ${valueRaw} — semi‑quantitative increase noted.`;
    }
    // Specific helpers
    const low = name.toLowerCase();
    if (!msg && low.includes('stool occult') && value === 'positive') {
      msg = `Stool Occult Blood: Positive — consider GI bleeding; advise clinical correlation.`;
    }
    if (!msg && low.includes('urine blood') && /^(\+1|1\+|\+2|2\+|\+3|3\+)$/.test(valueRaw)) {
      msg = `Urine Blood: ${valueRaw} — hematuria; recommend microscopy correlation.`;
    }
    if (!msg && low.includes('urine protein') && /^(trace|\+1|1\+|\+2|2\+|\+3|3\+)$/.test(valueRaw)) {
      msg = `Urine Protein: ${valueRaw} — proteinuria; evaluate renal status.`;
    }
    if (!msg && low.includes('culture') && value !== 'no growth') {
      msg = `${name}: ${valueRaw} — organism(s) reported; manage per sensitivity profile.`;
    }

    if (msg) {
      if (!result[bucket]) result[bucket] = [];
      result[bucket].push(msg);
    }
  }

  // Deduplicate per group while preserving order
  for (const key of Object.keys(result)) {
    const seen = new Set<string>();
    const dedup: Array<string | { message: string; suggestions?: string[]; drug_classes?: string[]; refs?: string[] }> = [];
    for (const item of result[key]) {
      const msg = typeof item === 'string' ? item : item.message;
      if (seen.has(msg)) continue;
      seen.add(msg);
      dedup.push(item);
    }
    result[key] = dedup;
  }
  return result;
}
