import ast
import re
from typing import Tuple, Optional, Set


class SecurityViolationError(Exception):
    """Raised when candidate code violates sandbox security policies."""
    pass


class AstSecurityAnalyzer:
    """
    Static code analysis engine that inspects Python AST trees and SQL commands
    to detect and block dangerous system calls, malicious imports, and unauthorized execution.
    """

    FORBIDDEN_MODULES: Set[str] = {
        "os", "sys", "subprocess", "shutil", "socket", "pty", "pathlib",
        "ctypes", "importlib", "pickle", "shelve", "multiprocessing",
        "threading", "signal", "posix", "nt", "builtins", "code",
        "_thread", "ptyprocess", "termios", "winreg"
    }

    FORBIDDEN_CALLS: Set[str] = {
        "eval", "exec", "open", "__import__", "compile", "getattr",
        "setattr", "delattr", "globals", "locals", "breakpoint", "input"
    }

    FORBIDDEN_ATTRIBUTES: Set[str] = {
        "__subclasses__", "__globals__", "__code__", "__builtins__",
        "__bases__", "__mro__", "__import__", "__loader__", "__spec__",
        "func_globals", "func_code", "gi_frame", "cr_frame"
    }

    FORBIDDEN_SQL_PATTERNS = [
        r"\battach\s+database\b",
        r"\bdetach\s+database\b",
        r"\bload_extension\b",
        r"\bdrop\s+database\b",
        r"\bshutdown\b",
        r"\bxp_cmdshell\b",
        r"\bpg_read_file\b",
        r"\bpg_write_file\b",
        r"\bcopy\s+.*\bto\s+program\b",
    ]

    class _SecurityVisitor(ast.NodeVisitor):
        def __init__(self):
            self.violations = []

        def visit_Import(self, node: ast.Import):
            for alias in node.names:
                root_module = alias.name.split(".")[0]
                if root_module in AstSecurityAnalyzer.FORBIDDEN_MODULES:
                    self.violations.append(
                        f"Forbidden import '{alias.name}' detected at line {node.lineno}."
                    )
            self.generic_visit(node)

        def visit_ImportFrom(self, node: ast.ImportFrom):
            if node.module:
                root_module = node.module.split(".")[0]
                if root_module in AstSecurityAnalyzer.FORBIDDEN_MODULES:
                    self.violations.append(
                        f"Forbidden import from '{node.module}' detected at line {node.lineno}."
                    )
            for alias in node.names:
                if alias.name in AstSecurityAnalyzer.FORBIDDEN_CALLS:
                    self.violations.append(
                        f"Forbidden import of '{alias.name}' detected at line {node.lineno}."
                    )
            self.generic_visit(node)

        def visit_Call(self, node: ast.Call):
            # Check function call name
            if isinstance(node.func, ast.Name):
                if node.func.id in AstSecurityAnalyzer.FORBIDDEN_CALLS:
                    self.violations.append(
                        f"Forbidden function call '{node.func.id}()' detected at line {node.lineno}."
                    )
            elif isinstance(node.func, ast.Attribute):
                if node.func.attr in AstSecurityAnalyzer.FORBIDDEN_CALLS:
                    self.violations.append(
                        f"Forbidden function call '{node.func.attr}()' detected at line {node.lineno}."
                    )
            self.generic_visit(node)

        def visit_Attribute(self, node: ast.Attribute):
            if node.attr in AstSecurityAnalyzer.FORBIDDEN_ATTRIBUTES:
                self.violations.append(
                    f"Forbidden attribute access '{node.attr}' detected at line {node.lineno}."
                )
            self.generic_visit(node)

    @classmethod
    def validate_code(cls, code: str, language: str = "python") -> Tuple[bool, Optional[str]]:
        """
        Validates candidate code against security constraints.
        Returns:
            Tuple[bool, Optional[str]]: (is_safe, violation_reason)
        """
        if not code or not code.strip():
            return False, "Code submission is empty."

        lang = (language or "python").lower()

        if lang == "sql":
            return cls._validate_sql(code)
        
        return cls._validate_python(code)

    @classmethod
    def _validate_python(cls, code: str) -> Tuple[bool, Optional[str]]:
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            # Let runner or caller know about syntax issues
            return False, f"Syntax Error: {e.msg} at line {e.lineno}."
        except Exception as e:
            return False, f"AST Parsing Error: {str(e)}"

        visitor = cls._SecurityVisitor()
        visitor.visit(tree)

        if visitor.violations:
            return False, " | ".join(visitor.violations)

        return True, None

    @classmethod
    def _validate_sql(cls, code: str) -> Tuple[bool, Optional[str]]:
        code_lower = code.lower()
        for pattern in cls.FORBIDDEN_SQL_PATTERNS:
            if re.search(pattern, code_lower):
                return False, f"Forbidden administrative or dangerous SQL pattern matched: '{pattern}'."

        return True, None
