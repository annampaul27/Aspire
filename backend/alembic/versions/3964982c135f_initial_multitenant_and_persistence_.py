"""initial_multitenant_and_persistence_schema

Revision ID: 3964982c135f
Revises: 
Create Date: 2026-09-27 19:06:40.513703

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = '3964982c135f'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    existing_tables = inspector.get_table_names()

    # 1. Create organizations table if not exists
    if "organizations" not in existing_tables:
        op.create_table(
            "organizations",
            sa.Column("id", sa.String(length=64), primary_key=True),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("type", sa.String(length=64), server_default="corporate", nullable=False),
            sa.Column("logo", sa.String(length=255), nullable=True),
            sa.Column("plan", sa.String(length=64), server_default="Enterprise", nullable=False),
            sa.Column("seats_used", sa.Integer(), server_default="0", nullable=False),
            sa.Column("seats_total", sa.Integer(), server_default="25", nullable=False),
            sa.Column("status", sa.String(length=32), server_default="active", nullable=False),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        )

    # 2. Create organization_memberships table if not exists
    if "organization_memberships" not in existing_tables:
        op.create_table(
            "organization_memberships",
            sa.Column("id", sa.String(length=64), primary_key=True),
            sa.Column("org_id", sa.String(length=64), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
            sa.Column("user_id", sa.String(length=64), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("role", sa.String(length=32), server_default="member", nullable=False),
            sa.Column("joined_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.UniqueConstraint("org_id", "user_id", name="uq_org_user"),
        )

    # 3. Create subscriptions table if not exists
    if "subscriptions" not in existing_tables:
        op.create_table(
            "subscriptions",
            sa.Column("id", sa.String(length=64), primary_key=True),
            sa.Column("org_id", sa.String(length=64), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
            sa.Column("plan_id", sa.String(length=64), server_default="enterprise", nullable=False),
            sa.Column("status", sa.String(length=32), server_default="active", nullable=False),
            sa.Column("seats_purchased", sa.Integer(), server_default="25", nullable=False),
            sa.Column("billing_cycle", sa.String(length=32), server_default="monthly", nullable=False),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        )

    # 4. Create dispatched_sprints table if not exists (Audit §4.5)
    if "dispatched_sprints" not in existing_tables:
        op.create_table(
            "dispatched_sprints",
            sa.Column("dispatch_id", sa.String(length=64), primary_key=True),
            sa.Column("candidate_id", sa.String(length=64), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("candidate_name", sa.String(length=255), nullable=False),
            sa.Column("candidate_email", sa.String(length=255), nullable=False),
            sa.Column("skill_id", sa.String(length=64), nullable=False, index=True),
            sa.Column("skill_name", sa.String(length=255), nullable=False),
            sa.Column("org_id", sa.String(length=64), nullable=True),
            sa.Column("job_id", sa.String(length=64), nullable=True),
            sa.Column("status", sa.String(length=32), server_default="dispatched", nullable=False),
            sa.Column("dispatched_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
            sa.Column("credential_hash", sa.String(length=128), nullable=True),
            sa.Column("invite_url", sa.Text(), nullable=False),
        )

    # 5. Create verified_credentials table if not exists (Audit §4.5 & §5.5)
    if "verified_credentials" not in existing_tables:
        op.create_table(
            "verified_credentials",
            sa.Column("id", sa.String(length=64), primary_key=True),
            sa.Column("candidate_id", sa.String(length=64), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("candidate_email", sa.String(length=255), nullable=False),
            sa.Column("skill_id", sa.String(length=64), nullable=False),
            sa.Column("skill_name", sa.String(length=255), nullable=False),
            sa.Column("score", sa.Integer(), nullable=False),
            sa.Column("passed_questions", sa.Integer(), nullable=False),
            sa.Column("total_questions", sa.Integer(), nullable=False),
            sa.Column("credential_hash", sa.String(length=128), unique=True, index=True, nullable=False),
            sa.Column("canonical_payload", sa.Text(), nullable=False),
            sa.Column("issued_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("verification_url", sa.Text(), nullable=False),
        )

    # 6. Ensure password_hash and org_id exist on users table
    if "users" in existing_tables:
        user_columns = [col["name"] for col in inspector.get_columns("users")]
        with op.batch_alter_table("users", schema=None) as batch_op:
            if "password_hash" not in user_columns:
                batch_op.add_column(sa.Column("password_hash", sa.String(length=255), nullable=True))
            if "org_id" not in user_columns:
                batch_op.add_column(sa.Column("org_id", sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_table("verified_credentials")
    op.drop_table("dispatched_sprints")
    op.drop_table("subscriptions")
    op.drop_table("organization_memberships")
    op.drop_table("organizations")
