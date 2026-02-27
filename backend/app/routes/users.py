from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
import uuid
import logging
import json
from pathlib import Path

from app.database import get_db
from app.core.auth import verify_jwt_token
from app.core.roles import require_any_role
from app.models.user import User
from app.models.genie import Genie
from app.models.notification import Notification

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "genie_docs"


@router.get("/me")
async def get_me(
    payload: dict = Depends(verify_jwt_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Return the current authenticated user's profile.
    On first login after signup, auto-creates the public.users row
    using the name and role stored in Supabase JWT metadata.
    """
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    # ── First login: auto-create profile from Supabase metadata ─────────────
    if not user:
        meta = payload.get("user_metadata") or {}
        name = meta.get("name") or "User"
        role = meta.get("role") or "user"
        if role not in ("user", "genie", "admin"):
            role = "user"

        try:
            user = User(id=uuid.UUID(user_id), name=name, role=role)
            db.add(user)
            await db.commit()
            await db.refresh(user)
            logger.info(f"Auto-created profile for new user {user_id} (role={role})")
        except Exception as exc:
            await db.rollback()
            logger.error(f"Failed to auto-create profile for {user_id}: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user profile.",
            )

    genie_is_verified = False
    verification_status = None
    if (user.role or "").lower() == "genie":
        genie_result = await db.execute(select(Genie).where(Genie.id == user.id))
        genie_profile = genie_result.scalar_one_or_none()
        if genie_profile:
            genie_is_verified = bool(genie_profile.is_verified)
            verification_status = genie_profile.verification_status

    return {
        "id": str(user.id),
        "name": user.name,
        "email": None,   # email lives in Supabase Auth, not our DB
        "role": user.role,
        "reward_points": user.reward_points,
        "is_verified": genie_is_verified,
        "verification_status": verification_status,
    }


@router.patch("/me")
async def update_me(
    body: dict,
    payload: dict = Depends(verify_jwt_token),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's name."""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    new_name = (body.get("name") or "").strip()
    if not new_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name cannot be empty")

    user.name = new_name
    await db.commit()
    await db.refresh(user)

    return {"id": str(user.id), "name": user.name, "role": user.role}


@router.post("/verification/apply")
async def apply_genie_verification(
    request: Request,
    document: UploadFile = File(...),
    skills: str = Form(...),
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db),
):
    """Allow only GENIE users to submit verification request."""
    user_role = (current_user.role or "").upper()
    if user_role != "GENIE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only GENIE users can apply for verification",
        )

    parsed_skills = None
    try:
        parsed_skills = json.loads(skills)
    except json.JSONDecodeError:
        parsed_skills = [skill.strip() for skill in skills.split(",") if skill.strip()]

    if not isinstance(parsed_skills, list) or not all(isinstance(item, str) for item in parsed_skills):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="skills must be a JSON array of strings or comma-separated string",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_suffix = Path(document.filename or "").suffix
    saved_name = f"{uuid.uuid4()}{file_suffix}"
    saved_path = UPLOAD_DIR / saved_name

    file_bytes = await document.read()
    with open(saved_path, "wb") as file_obj:
        file_obj.write(file_bytes)

    stored_document_path = f"/uploads/genie_docs/{saved_name}"

    form_data = await request.form()
    raw_proof_docs = form_data.getlist("skill_proof_docs")

    proof_document_paths = []
    if raw_proof_docs:
        proof_upload_dir = UPLOAD_DIR / "skill_proofs"
        proof_upload_dir.mkdir(parents=True, exist_ok=True)
        for proof_doc in raw_proof_docs:
            if not proof_doc or not proof_doc.filename:
                continue

            proof_suffix = Path(proof_doc.filename).suffix
            proof_saved_name = f"{uuid.uuid4()}{proof_suffix}"
            proof_saved_path = proof_upload_dir / proof_saved_name

            proof_bytes = await proof_doc.read()
            with open(proof_saved_path, "wb") as proof_file_obj:
                proof_file_obj.write(proof_bytes)

            proof_document_paths.append(f"/uploads/genie_docs/skill_proofs/{proof_saved_name}")

    stored_skill_proofs = proof_document_paths if proof_document_paths else None

    genie_result = await db.execute(select(Genie).where(Genie.id == current_user.id))
    genie_profile = genie_result.scalar_one_or_none()

    if not genie_profile:
        genie_profile = Genie(id=current_user.id)
        db.add(genie_profile)

    genie_profile.document_path = stored_document_path
    genie_profile.skills = parsed_skills
    genie_profile.skill_proofs = stored_skill_proofs
    genie_profile.verification_status = "PENDING"
    genie_profile.is_verified = False

    db.add(
        Notification(
            user_id=current_user.id,
            title="Verification Submitted",
            message="Your verification request has been submitted and is under review.",
            is_read=False,
        )
    )

    await db.commit()

    verify_result = await db.execute(
        select(Genie.document_path).where(Genie.id == current_user.id)
    )
    persisted_document_path = verify_result.scalar_one_or_none()

    if not persisted_document_path:
        await db.execute(
            text(
                """
                UPDATE genies
                SET document_path = :document_path,
                    verification_status = 'PENDING',
                    is_verified = FALSE
                WHERE id = :user_id
                """
            ),
            {
                "document_path": stored_document_path,
                "user_id": current_user.id,
            },
        )
        await db.commit()
        persisted_document_path = stored_document_path

    return {
        "message": "Verification request submitted",
        "verification_status": "PENDING",
        "is_verified": False,
        "document_path": persisted_document_path,
    }

