"""Export key AniCart code into deterministic TXT bundles.

Optimizations:
- fast tree traversal with ignored-dir pruning
- deterministic ordering
- deduplicated include expansion
- skip rewriting output when content is unchanged
- sha256 hashing to check for edits
"""

from __future__ import annotations

import argparse
import hashlib
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from time import perf_counter

IGNORE_DIRS = {
    '.git',
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.next',
    '.cache',
    '.turbo',
    '__pycache__',
    '.venv',
    'venv',
    'tmp',
    'temp',
}

IGNORE_FILES = {
    '.gitignore',
    '.gitkeep',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
}

SERVER_EXTENSIONS = frozenset({'.js', '.cjs', '.mjs', '.json', '.md', '.ts', '.http', '.yml', '.yaml'})
WEBSITE_EXTENSIONS = frozenset({'.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.json', '.md', '.html'})


@dataclass(frozen=True)
class ExportTarget:
    key: str
    name: str
    root: str
    output: str
    include: tuple[str, ...]
    extensions: frozenset[str]


TARGETS: dict[str, ExportTarget] = {
    'server': ExportTarget(
        key='server',
        name='AniCart-Server',
        root='server',
        output='AniCart_Server_Code.txt',
        include=(
            'package.json',
            'server.js',
            'app.js',
            'config',
            'controllers',
            'db',
            'jobs',
            'middleware',
            'models',
            'routers',
            'routes',
            'services',
            'seed',
            'utils',
        ),
        extensions=SERVER_EXTENSIONS,
    ),
    'website': ExportTarget(
        key='website',
        name='AniCart-Website',
        root='client',
        output='AniCart_Website_Code.txt',
        include=(
            'package.json',
            'public/index.html',
            'src',
        ),
        extensions=WEBSITE_EXTENSIONS,
    ),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Export important AniCart code to TXT files.')
    parser.add_argument(
        '--target',
        choices=('all', 'server', 'website'),
        default='all',
        help='Choose which export bundle to generate.',
    )
    parser.add_argument(
        '--workspace',
        type=Path,
        default=Path(__file__).resolve().parent,
        help='Workspace root that contains server and client.',
    )
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='Reduce console output.',
    )
    return parser.parse_args()


def read_file_safe(path: Path) -> str:
    try:
        return path.read_text(encoding='utf-8', errors='replace')
    except Exception as exc:  # pragma: no cover
        return f'[Error reading file: {exc}]'


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def is_ignored(path: Path, allowed_exts: frozenset[str]) -> bool:
    if path.name in IGNORE_FILES:
        return True
    if path.suffix.lower() not in allowed_exts:
        return True
    return any(part in IGNORE_DIRS for part in path.parts)


def iter_files(root: Path, allowed_exts: frozenset[str]):
    for current_root, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
        root_path = Path(current_root)

        for filename in filenames:
            file_path = root_path / filename
            if is_ignored(file_path, allowed_exts):
                continue
            yield file_path


def collect_paths(base_dir: Path, target: ExportTarget) -> list[Path]:
    collected: dict[str, Path] = {}

    for rel in target.include:
        entry = base_dir / rel
        if not entry.exists():
            continue

        if entry.is_file():
            if not is_ignored(entry, target.extensions):
                key = entry.relative_to(base_dir).as_posix()
                collected[key] = entry
            continue

        for file_path in iter_files(entry, target.extensions):
            key = file_path.relative_to(base_dir).as_posix()
            collected[key] = file_path

    return [collected[k] for k in sorted(collected.keys(), key=str.lower)]


def write_export(target_name: str, base_dir: Path, output_file: Path, files: list[Path]) -> tuple[bool, int]:
    temp_output = output_file.with_suffix(output_file.suffix + '.tmp')

    with temp_output.open('w', encoding='utf-8', newline='\n') as handle:
        handle.write('=' * 80 + '\n')
        handle.write(f'{target_name} - IMPORTANT CODE EXPORT\n')
        handle.write('=' * 80 + '\n\n')

        for file_path in files:
            rel = file_path.relative_to(base_dir).as_posix()
            handle.write('-' * 80 + '\n')
            handle.write(f'FILE: {rel}\n')
            handle.write('-' * 80 + '\n\n')
            handle.write(read_file_safe(file_path))
            handle.write('\n\n')

    new_hash = sha256_file(temp_output)
    old_hash = sha256_file(output_file) if output_file.exists() else None

    if old_hash == new_hash:
        size = output_file.stat().st_size
        temp_output.unlink(missing_ok=True)
        return False, size

    temp_output.replace(output_file)
    return True, output_file.stat().st_size


def choose_targets(target_arg: str) -> list[ExportTarget]:
    if target_arg == 'all':
        return [TARGETS['server'], TARGETS['website']]
    return [TARGETS[target_arg]]


def main() -> None:
    args = parse_args()
    started_at = perf_counter()
    workspace = args.workspace.resolve()

    for target in choose_targets(args.target):
        project_dir = workspace / target.root
        if not project_dir.is_dir():
            print(f'Error: missing folder {project_dir}')
            sys.exit(1)

        if not args.quiet:
            print(f'Collecting important files from {target.name}...')

        files = collect_paths(project_dir, target)
        output_path = workspace / target.output
        changed, size_bytes = write_export(target.name, project_dir, output_path, files)
        size_mb = size_bytes / (1024 * 1024)

        if not args.quiet:
            print(f'  Found {len(files)} files')
            print(
                f"  {'Updated' if changed else 'Unchanged'}: "
                f'{output_path.name} ({size_mb:.2f} MB)'
            )

    if not args.quiet:
        print(f'Done in {perf_counter() - started_at:.2f}s')


if __name__ == '__main__':
    main()
