from fastapi import APIRouter, Depends, Body
from firebase_admin import firestore
from app.core.security import verify_firebase_token
from app.core.firebase import db
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

class RegisterRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = "user"


@router.post("/auth/register")
def register_user(
    request: RegisterRequest,
    user=Depends(verify_firebase_token)
):
    uid = user["uid"]
    email = user.get("email")

    ref = db.collection("users").document(uid)

    if ref.get().exists:
        return {"message": "User already registered"}

    # Validate role
    valid_roles = ["user", "genie", "admin"]
    role = request.role if request.role in valid_roles else "user"
    
    print(f"Registering user {uid} with role: {role}")

    user_data = {
        "email": email,
        "role": role,
        "created_at": firestore.SERVER_TIMESTAMP
    }
    
    if request.name:
        user_data["name"] = request.name

    ref.set(user_data)

    return {"message": "User registered successfully"}
