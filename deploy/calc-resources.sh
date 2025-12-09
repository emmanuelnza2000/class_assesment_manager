#!/usr/bin/env bash
# Simple heuristic-based resource estimator.
# Usage: ./calc-resources.sh --replicas N --concurrency M
set -euo pipefail

REPLICAS=3
CONCURRENCY=50

while [[ $# -gt 0 ]]; do
  case $1 in
    --replicas) REPLICAS="$2"; shift 2;;
    --concurrency) CONCURRENCY="$2"; shift 2;;
    *) shift;;
  esac
done

# Heuristics:
BASE_MEM=200           # Mi base per instance
MEM_PER_CONC=3         # Mi per concurrent user
BASE_CPU=200           # millicores base
CPU_PER_CONC=10        # millicores per concurrent user

MEM_PER_REPLICA=$((BASE_MEM + CONCURRENCY * MEM_PER_CONC))
CPU_PER_REPLICA=$((BASE_CPU + CONCURRENCY * CPU_PER_CONC))
TOTAL_MEM=$((MEM_PER_REPLICA * REPLICAS))
TOTAL_CPU=$((CPU_PER_REPLICA * REPLICAS))

# Output JSON
cat <<EOF
{
  "replicas": ${REPLICAS},
  "per_replica": {
    "memory_mi": ${MEM_PER_REPLICA},
    "cpu_millicores": ${CPU_PER_REPLICA}
  },
  "total": {
    "memory_mi": ${TOTAL_MEM},
    "cpu_millicores": ${TOTAL_CPU}
  }
}
EOF
