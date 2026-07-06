#!/usr/bin/env python3
"""
Security hardening verification for Kimchi Termux launcher
"""
import json
import os
import re
import sys

def check_file_contains(filepath, patterns, description):
    """Check if file contains all specified patterns"""
    print(f"\n[CHECK] {description}")
    if not os.path.exists(filepath):
        print(f"  ✗ FAIL: File not found: {filepath}")
        return False
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    all_found = True
    for pattern in patterns:
        if re.search(pattern, content):
            print(f"  ✓ Found: {pattern[:60]}...")
        else:
            print(f"  ✗ MISSING: {pattern[:60]}...")
            all_found = False
    
    return all_found

def check_json_config():
    """Verify config.json has telemetry disabled and device ID cleared"""
    print(f"\n[CHECK] Config.json security settings")
    config_path = os.path.expanduser("~/.config/kimchi/config.json")
    
    if not os.path.exists(config_path):
        print(f"  ✗ FAIL: Config not found: {config_path}")
        return False
    
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    # Check telemetry is disabled
    telemetry_enabled = config.get("telemetry", {}).get("enabled", True)
    if telemetry_enabled is False:
        print(f"  ✓ Telemetry disabled")
    else:
        print(f"  ✗ FAIL: Telemetry still enabled")
        return False
    
    # Check device ID is removed
    if "deviceId" in config:
        print(f"  ✗ FAIL: Device ID still present in config")
        return False
    else:
        print(f"  ✓ Device ID removed")
    
    return True

def main():
    print("="*70)
    print("KIMCHI TERMUX SECURITY HARDENING VERIFICATION")
    print("="*70)
    
    home = os.path.expanduser("~")
    launcher_path = os.path.join(home, "kimchi", "bin", "kimchi")
    package_json_path = os.path.join(home, "kimchi", "package.json")
    gitignore_path = os.path.join(home, "kimchi", ".gitignore")
    
    results = []
    
    # 1. Telemetry environment variable
    results.append(check_file_contains(
        launcher_path,
        [r'export\s+KIMCHI_TELEMETRY_ENABLED=0'],
        "Telemetry environment variable (KIMCHI_TELEMETRY_ENABLED=0)"
    ))
    
    # 2. Path validation
    results.append(check_file_contains(
        launcher_path,
        [r'path traversal detected'],
        "Path traversal validation"
    ))
    
    # 3. Resource limits — must NOT cap virtual memory (ulimit -v breaks V8 on Termux)
    results.append(check_file_contains(
        launcher_path,
        [r'Do NOT cap virtual memory', r'ulimit\s+-f'],
        "Resource limits (no ulimit -v, file size cap only)"
    ))
    
    # 4. Signal forwarding (cleanup function)
    results.append(check_file_contains(
        launcher_path,
        [r'cleanup\(\)', r'trap cleanup'],
        "Signal forwarding (cleanup function)"
    ))
    
    # 5. PID validation
    results.append(check_file_contains(
        launcher_path,
        [r'is_our_node', r'CHILD_PID=\$!', r'/proc/\$pid'],
        "PID validation before kill (is_our_node + CHILD_PID)"
    ))

    # 5b. Block kimchi update on Termux
    results.append(check_file_contains(
        launcher_path,
        [r'kimchi update is disabled', r'exit 1'],
        "Self-update blocked (update subcommand)"
    ))
    
    # 6. Secure tmpfile
    results.append(check_file_contains(
        launcher_path,
        [r'mktemp\s+-t\s+kimchi\.', r'chmod 600'],
        "Secure tmpfile (mktemp -t + chmod 600)"
    ))
    
    # 7. Dependencies pinned (no ^ prefixes)
    results.append(check_file_contains(
        package_json_path,
        [r'"@clack/prompts": "1\.\d+\.\d+"'],
        "Dependencies pinned (exact versions, no ^ prefixes)"
    ))
    
    # Check no ^ in dependencies section
    with open(package_json_path, 'r') as f:
        pkg_content = f.read()
    
    print(f"\n[CHECK] No ^ prefixes in dependencies")
    # Find dependencies section
    deps_match = re.search(r'"dependencies":\s*\{([^}]+)\}', pkg_content, re.DOTALL)
    if deps_match:
        deps_section = deps_match.group(1)
        if '^' in deps_section:
            print(f"  ✗ FAIL: Found ^ prefix in dependencies")
            results.append(False)
        else:
            print(f"  ✓ No ^ prefixes in dependencies")
            results.append(True)
    else:
        print(f"  ✗ FAIL: Could not find dependencies section")
        results.append(False)
    
    # 8. Credential protection in .gitignore
    results.append(check_file_contains(
        gitignore_path,
        [r'\*\.key', r'\*\.pem', r'\*\.p12', r'\*\.pfx', r'auth\.json'],
        "Credential protection in .gitignore"
    ))
    
    # 9. Config.json verification
    results.append(check_json_config())
    
    # Summary
    print("\n" + "="*70)
    print("VERIFICATION SUMMARY")
    print("="*70)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("\n✓ ALL SECURITY HARDENING CHECKS PASSED")
        return 0
    else:
        print(f"\n✗ {total - passed} CHECK(S) FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())
