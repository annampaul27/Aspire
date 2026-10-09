from app.services.sandbox.security import AstSecurityAnalyzer


def test_safe_python_code_passes():
    safe_code = """
import asyncio
from typing import Dict, Any

async def handle_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    await asyncio.sleep(0.01)
    return {"status": "ok", "count": len(payload)}
"""
    is_safe, violation = AstSecurityAnalyzer.validate_code(safe_code, language="python")
    assert is_safe is True
    assert violation is None


def test_forbidden_module_import_fails():
    dangerous_snippets = [
        "import os\nos.system('ls')",
        "import subprocess\nsubprocess.run(['rm', '-rf', '/'])",
        "import sys\nsys.exit(1)",
        "import shutil\nshutil.rmtree('/tmp')",
        "import socket\ns = socket.socket()",
        "from os import path, system",
        "from subprocess import Popen",
    ]

    for snippet in dangerous_snippets:
        is_safe, violation = AstSecurityAnalyzer.validate_code(snippet, language="python")
        assert is_safe is False, f"Expected failure for: {snippet}"
        assert violation is not None
        assert "Forbidden import" in violation


def test_forbidden_builtins_calls_fail():
    dangerous_calls = [
        "eval('1 + 1')",
        "exec('import os')",
        "open('/etc/passwd', 'r')",
        "__import__('os').system('ls')",
        "compile('print(1)', '', 'exec')",
    ]

    for snippet in dangerous_calls:
        is_safe, violation = AstSecurityAnalyzer.validate_code(snippet, language="python")
        assert is_safe is False, f"Expected failure for: {snippet}"
        assert violation is not None
        assert "Forbidden function call" in violation


def test_dunder_introspection_fails():
    exploit = "().__class__.__bases__[0].__subclasses__()"
    is_safe, violation = AstSecurityAnalyzer.validate_code(exploit, language="python")
    assert is_safe is False
    assert violation is not None
    assert "Forbidden attribute" in violation


def test_safe_sql_ddl_passes():
    sql = "CREATE INDEX idx_users_email ON users(email);"
    is_safe, violation = AstSecurityAnalyzer.validate_code(sql, language="sql")
    assert is_safe is True
    assert violation is None


def test_malicious_sql_commands_fail():
    bad_sqls = [
        "DROP DATABASE production;",
        "ATTACH DATABASE '/etc/shadow' AS evil;",
        "SELECT load_extension('evil.so');",
    ]
    for bad in bad_sqls:
        is_safe, violation = AstSecurityAnalyzer.validate_code(bad, language="sql")
        assert is_safe is False
        assert violation is not None
