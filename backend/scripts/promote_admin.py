"""
Script de bootstrap : promeut un utilisateur existant au rôle super_admin.

Usage :
    DATABASE_URL=sqlite:///./moncash_dev.db .venv/Scripts/python.exe -m scripts.promote_admin <username>

Sur Linux :
    DATABASE_URL=... python -m scripts.promote_admin <username>

L'utilisateur doit d'abord avoir été créé via POST /users/.
"""
import sys
from pathlib import Path

# Permettre d'exécuter en standalone : ajouter le répertoire parent au path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from database import SessionLocal  # noqa: E402
from repositories.user_repository import UserRepository  # noqa: E402


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python -m scripts.promote_admin <username>")
        return 2

    username = sys.argv[1]
    with SessionLocal() as db:
        repo = UserRepository(db)
        user = repo.get_user_by_username(username=username)
        if not user:
            print(f"ERROR: user '{username}' not found.")
            return 1
        if user.role == "super_admin":
            print(f"INFO: user '{username}' is already a super_admin.")
            return 0
        repo.update_role(user, "super_admin")
        print(f"OK: user '{username}' is now super_admin (id={user.id}).")
        return 0


if __name__ == "__main__":
    sys.exit(main())
