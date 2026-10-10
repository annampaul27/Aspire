import threading
from typing import Dict, List, Optional, Tuple


class TelemetryRegistry:
    """
    In-memory OpenMetrics / Prometheus telemetry collector.
    
    Supports:
    - Counter: monotonic increasing values (e.g., http_requests_total)
    - Gauge: instantaneous values (e.g., active_websockets)
    - Summary: latency distributions with quantiles (P50, P90, P99)
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._counters: Dict[str, Dict[Tuple[Tuple[str, str], ...], float]] = {}
        self._gauges: Dict[str, Dict[Tuple[Tuple[str, str], ...], float]] = {}
        self._summaries: Dict[str, Dict[Tuple[Tuple[str, str], ...], List[float]]] = {}
        self._descriptions: Dict[str, str] = {}

    def _normalize_labels(self, labels: Optional[Dict[str, str]]) -> Tuple[Tuple[str, str], ...]:
        if not labels:
            return ()
        return tuple(sorted((str(k), str(v)) for k, v in labels.items()))

    def _format_labels(self, label_tuple: Tuple[Tuple[str, str], ...]) -> str:
        if not label_tuple:
            return ""
        items = [f'{k}="{v}"' for k, v in label_tuple]
        return "{" + ",".join(items) + "}"

    def increment_counter(
        self,
        name: str,
        value: float = 1.0,
        labels: Optional[Dict[str, str]] = None,
        description: str = "",
    ) -> None:
        norm = self._normalize_labels(labels)
        with self._lock:
            if description and name not in self._descriptions:
                self._descriptions[name] = description
            if name not in self._counters:
                self._counters[name] = {}
            self._counters[name][norm] = self._counters[name].get(norm, 0.0) + value

    def set_gauge(
        self,
        name: str,
        value: float,
        labels: Optional[Dict[str, str]] = None,
        description: str = "",
    ) -> None:
        norm = self._normalize_labels(labels)
        with self._lock:
            if description and name not in self._descriptions:
                self._descriptions[name] = description
            if name not in self._gauges:
                self._gauges[name] = {}
            self._gauges[name][norm] = float(value)

    def observe_summary(
        self,
        name: str,
        value: float,
        labels: Optional[Dict[str, str]] = None,
        description: str = "",
    ) -> None:
        norm = self._normalize_labels(labels)
        with self._lock:
            if description and name not in self._descriptions:
                self._descriptions[name] = description
            if name not in self._summaries:
                self._summaries[name] = {}
            if norm not in self._summaries[name]:
                self._summaries[name][norm] = []
            self._summaries[name][norm].append(float(value))

    def get_summary_quantiles(
        self,
        name: str,
        labels: Optional[Dict[str, str]] = None,
    ) -> Dict[str, float]:
        norm = self._normalize_labels(labels)
        with self._lock:
            samples = list(self._summaries.get(name, {}).get(norm, []))

        if not samples:
            return {"count": 0.0, "sum": 0.0, "p50": 0.0, "p90": 0.0, "p99": 0.0}

        sorted_samples = sorted(samples)
        count = len(sorted_samples)
        total_sum = sum(sorted_samples)

        def quantile(q: float) -> float:
            idx = int(q * count)
            if idx >= count:
                idx = count - 1
            return sorted_samples[idx]

        return {
            "count": float(count),
            "sum": round(total_sum, 6),
            "p50": round(quantile(0.50), 6),
            "p90": round(quantile(0.90), 6),
            "p99": round(quantile(0.99), 6),
        }

    def generate_prometheus_format(self) -> str:
        lines: List[str] = []

        with self._lock:
            # 1. Counters
            for name, series in sorted(self._counters.items()):
                desc = self._descriptions.get(name, f"Counter metric {name}")
                lines.append(f"# HELP {name} {desc}")
                lines.append(f"# TYPE {name} counter")
                for labels, val in sorted(series.items()):
                    lbl_str = self._format_labels(labels)
                    lines.append(f"{name}{lbl_str} {val:.1f}")

            # 2. Gauges
            for name, series in sorted(self._gauges.items()):
                desc = self._descriptions.get(name, f"Gauge metric {name}")
                lines.append(f"# HELP {name} {desc}")
                lines.append(f"# TYPE {name} gauge")
                for labels, val in sorted(series.items()):
                    lbl_str = self._format_labels(labels)
                    lines.append(f"{name}{lbl_str} {val:.1f}")

            # 3. Summaries
            for name, series in sorted(self._summaries.items()):
                desc = self._descriptions.get(name, f"Summary metric {name}")
                lines.append(f"# HELP {name} {desc}")
                lines.append(f"# TYPE {name} summary")
                for labels, samples in sorted(series.items()):
                    if not samples:
                        continue
                    sorted_samples = sorted(samples)
                    count = len(sorted_samples)
                    total_sum = sum(sorted_samples)

                    def q_val(q: float) -> float:
                        idx = int(q * count)
                        if idx >= count:
                            idx = count - 1
                        return sorted_samples[idx]

                    # Base label dict
                    base_dict = dict(labels)

                    # Quantile lines
                    for q in [0.5, 0.9, 0.99]:
                        q_dict = {**base_dict, "quantile": str(q)}
                        lbl_str = "{" + ",".join(f'{k}="{v}"' for k, v in sorted(q_dict.items())) + "}"
                        lines.append(f"{name}{lbl_str} {q_val(q):.4f}")

                    # Sum and Count
                    lbl_str = self._format_labels(labels)
                    lines.append(f"{name}_sum{lbl_str} {total_sum:.4f}")
                    lines.append(f"{name}_count{lbl_str} {count}")

        lines.append("")  # Trailing newline required by Prometheus specification
        return "\n".join(lines)


# Global singleton registry instance
telemetry_registry = TelemetryRegistry()
