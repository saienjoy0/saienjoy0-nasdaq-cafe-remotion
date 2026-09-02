from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FINAL = ROOT / ".github/workflows/nasdaq-cafe-final-v2.yml"
WAKE = ROOT / ".github/workflows/nasdaq-cafe-codespace-wake.yml"


def main() -> int:
    final_text = FINAL.read_text(encoding="utf-8")
    wake_text = WAKE.read_text(encoding="utf-8")

    if "  wake-codespace:\n" not in final_text:
        raise AssertionError("Current Final V2 does not own Codespace readiness")
    wake_section = final_text.split("  wake-codespace:\n", 1)[1].split("\n  final:\n", 1)[0]
    if "needs: preflight" not in wake_section:
        raise AssertionError("Current Final V2 wake-codespace must need preflight")
    if "needs.preflight.outputs.already_completed != 'true'" not in wake_section:
        raise AssertionError("Current Final V2 must not wake for an already-completed Final")
    if "scripts/wake_repository_codespace.py" not in wake_section:
        raise AssertionError("Current Final V2 must use the shared Codespace lifecycle helper")

    final_section = final_text.split("\n  final:\n", 1)[1]
    if "needs: [preflight, wake-codespace]" not in final_section:
        raise AssertionError("Current Final self-hosted job must depend on preflight and wake-codespace")
    if "needs.wake-codespace.result == 'success'" not in final_section:
        raise AssertionError("Current Final must require successful runner readiness")

    if "scripts/wake_repository_codespace.py" not in wake_text:
        raise AssertionError("Standalone Codespace Wake must use the shared helper")
    forbidden = ("https://api.github.com/user/codespaces", "urllib.request", "urllib.error")
    for label, text in (("Final V2", final_text), ("standalone Wake", wake_text)):
        for needle in forbidden:
            if needle in text:
                raise AssertionError(f"{label} duplicates Codespaces lifecycle implementation: {needle}")

    print("Current Final V2 runner readiness contract PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
