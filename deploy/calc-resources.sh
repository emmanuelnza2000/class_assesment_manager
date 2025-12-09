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
# base memory per instance (Mi)
BASE_MEM=200
# memory per concurrent user per instance (Mi)
MEM_PER_CONC=3
# base CPU millicores
BASE_CPU=200
CPU_PER_CONC=10

# compute per-replica
MEM_PER_REPLICA=$((BASE_MEM + CONCURRENCY * MEM_PER_CONC))
CPU_PER_REPLICA=$((BASE_CPU + CONCURRENCY * CPU_PER_CONC))
# total
TOTAL_MEM=$((MEM_PER_REPLICA * REPLICAS))
TOTAL_CPU=$((CPU_PER_REPLICA * REPLICAS))

jq -n \
  --arg replicas "$REPLICAS" \
  --argjson perReplicaMem "$MEM_PER_REPLICA" \
  --argjson perReplicaCpu "$CPU_PER_REPLICA" \
  --argjson totalMem "$TOTAL_MEM" \
  --argjson totalCpu "$TOTAL_CPU" \
  '{replicas: ($replicas|tonumber), per_replica: {memory_mi: $perReplicaMem, cpu_millicores: $perReplicaCpu}, total: {memory_mi: $totalMem, cpu_millicores: $totalCpu}}'
